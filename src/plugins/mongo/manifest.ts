import { definePlugin } from "../define";
import type { ConnectorFactory } from "../types";
import { MongoQueryZ } from "../query-schemas";
import { chunkText } from "@/ingest/chunker";
import { saveDocumentWithChunks } from "@/ingest/saveDocumentWithChunks";

type MongoClient = typeof import("mongodb").MongoClient;

let _MongoClient: MongoClient | null = null;

async function client(url: string) {
  if (!_MongoClient) {
    const { MongoClient } = await import("mongodb");
    _MongoClient = MongoClient as any;
  }
  const cli = new (_MongoClient as any)(url, {});
  await cli.connect();
  return cli;
}

const create: ConnectorFactory = (config: Record<string, any>) => {
  const url = String(config.mongoUrl ?? "");
  const dbName = String(config.database ?? "");
  const useVector = Boolean(config.useVector);

  return {
    async testConnection() {
      try {
        const cli = await client(url);
        const admin = cli.db(dbName).admin();
        await admin.ping();
        await cli.close();
        return { ok: true as const };
      } catch (e: any) {
        return { ok: false as const, error: e?.message ?? "Mongo connection failed" };
      }
    },

    async query<T = unknown>({ mongo }: any) {
      if (!mongo) throw new Error("For Mongo connector, pass { mongo: {...} }.");
      const q = MongoQueryZ.parse(mongo);
      const cli = await client(url);
      const col = cli.db(dbName).collection(q.collection);
      const cursor = col.find(q.filter, { projection: q.projection ?? undefined });
      if (q.sort) cursor.sort(q.sort as any);
      cursor.limit(q.limit);
      const docs = await cursor.toArray();
      await cli.close();
      return docs as unknown as T[];
    },

    async similar({ collection, vector, topK = 5 }: any) {
      if (!useVector) throw new Error("Vector search disabled for this connector.");
      const cli = await client(url);
      const col = cli.db(dbName).collection(collection);
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: vector,
            numCandidates: Math.max(topK * 4, 50),
            limit: topK,
          },
        },
        { $project: { _id: 1, score: { $meta: "vectorSearchScore" } } },
      ];
      const res = await col.aggregate(pipeline).toArray();
      await cli.close();
      return res.map((r: any) => ({ id: String(r._id), score: r.score }));
    },

    async ingest({ source, options }: { source: string; options?: { field?: string; datasetId?: string } }) {
      const cli = await client(url);
      const col = cli.db(dbName).collection(source);
      const field = options?.field ?? "content";
      const docs = await col.find({}, { projection: { [field]: 1, title: 1 } }).limit(1000).toArray();
      await cli.close();

      if (!options?.datasetId) return { count: 0 };

      let count = 0;
      for (const d of docs) {
        const raw = d?.[field];
        if (typeof raw !== "string" || !raw.trim()) continue;
        const chunks = chunkText(raw, { maxTokens: 1200, overlap: 120 });
        await saveDocumentWithChunks({
          orgId: "",
          datasetId: options.datasetId!,
          source: `${source}/${String(d._id)}`,
          title: d.title ?? undefined,
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
  id: "plugin-mongo",
  displayName: "MongoDB",
  version: "0.1.0",
  connectors: [
    {
      spec: {
        id: "mongo",
        displayName: "MongoDB",
        version: "0.1.0",
        capabilities: ["json", "ingest", "vector"],
        configSchema: [
          { key: "mongoUrl", label: "Mongo URL", type: "password", required: true, secret: true, description: "mongodb+srv://user:pass@cluster/..." },
          { key: "database", label: "Database", type: "string", required: true, secret: false },
          { key: "useVector", label: "Enable Vector Search", type: "boolean", required: false, defaultValue: false, secret: false },
        ],
      },
      create,
    },
  ],
  tools: [],
});

export default manifest;
