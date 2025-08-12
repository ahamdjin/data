import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { FirestoreQueryZ } from "../query-schemas";
import { chunkText } from "@/ingest/chunker";
import { saveDocumentWithChunks } from "@/ingest/saveDocumentWithChunks";

let _admin: any = null;

async function fsAdmin() {
  if (_admin) return _admin;
  const admin = await import("firebase-admin");
  if (!admin.apps.length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
    const creds = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
  }
  _admin = admin;
  return admin;
}

const create: ConnectorFactory = (_config: Record<string, any>) => {
  return {
    async testConnection() {
      try {
        const admin = await fsAdmin();
        await admin.firestore().listCollections();
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Firestore connection failed" };
      }
    },

    async query<T = unknown>({ firestore }: any) {
      if (!firestore) throw new Error("For Firestore connector, pass { firestore: {...} }.");
      const q = FirestoreQueryZ.parse(firestore);
      const admin = await fsAdmin();
      let ref: any = admin.firestore().collection(q.collection);

      for (const [field, op, value] of q.where) {
        ref = ref.where(field, op, value);
      }
      if (q.orderBy) {
        const [f, dir] = q.orderBy;
        ref = ref.orderBy(f, dir);
      }
      ref = ref.limit(q.limit);
      const snap = await ref.get();
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return docs as unknown as T[];
    },

    async ingest({ source, options }: { source: string; options?: { field?: string; datasetId?: string } }) {
      const admin = await fsAdmin();
      const col = admin.firestore().collection(source);
      const field = options?.field ?? "content";
      const snap = await col.limit(1000).get();
      if (!options?.datasetId) return { count: 0 };

      let count = 0;
      for (const d of snap.docs) {
        const data = d.data();
        const raw = data?.[field];
        if (typeof raw !== "string" || !raw.trim()) continue;
        const chunks = chunkText(raw, { maxTokens: 1200, overlap: 120 });
        await saveDocumentWithChunks({
          orgId: "",
          datasetId: options.datasetId!,
          source: `${source}/${d.id}`,
          title: data.title ?? undefined,
          mimeType: "text/plain",
          chunks,
        });
        count += 1;
      }
      return { count };
    },
  };
};

const manifest = definePlugin({
  id: "plugin-firestore",
  displayName: "Firestore",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "firestore",
        displayName: "Firestore",
        version: "0.1.0",
        capabilities: ["json", "ingest"],
        configSchema: [
          {
            key: "serviceAccountJson",
            label: "Service Account (JSON)",
            type: "json",
            required: false,
            description: "Leave blank to use FIREBASE_SERVICE_ACCOUNT_JSON server env",
            secret: true,
          },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
