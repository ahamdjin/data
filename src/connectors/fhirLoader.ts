import FhirKitClient from 'fhir-kit-client';
import { generateUUID } from '@/lib/utils';
import { Connector, Document } from './base';
import { fhirChunker } from '@/lib/chunking/fhirChunker';
import { embedChunks } from '@/lib/embedChunks';
import { prisma } from '@/providers/prisma';

/**
 * Connector that loads resources from a FHIR server.
 */
export class FhirLoader extends Connector {
  private client: FhirKitClient | null;
  private pageSize: number;

  constructor(private resourceType: string) {
    super();
    this.pageSize = Number(process.env.FHIR_PAGE_SIZE ?? '50');
    this.client = null;
  }

  private getClient(): FhirKitClient {
    if (!this.client) {
      const baseUrl = process.env.FHIR_BASE_URL;
      if (!baseUrl) {
        throw new Error('Missing FHIR_BASE_URL environment variable');
      }
      this.client = new FhirKitClient({
        baseUrl,
        auth: {
          username: process.env.FHIR_USERNAME ?? '',
          password: process.env.FHIR_PASSWORD ?? '',
        },
      } as any);
    }
    return this.client;
  }

  async load(): Promise<Document[]> {
    const docs: Document[] = [];
    let nextUrl: string | undefined = `${this.resourceType}?_count=${this.pageSize}`;
    while (nextUrl) {
      const bundle: any = await this.getClient().issueGetRequest(nextUrl);
      const pageDocs: Document[] = [];
      for (const entry of bundle.entry ?? []) {
        const res = entry.resource;
        pageDocs.push({
          id: String(res?.id ?? generateUUID()),
          text: JSON.stringify(res),
          metadata: { resourceType: res?.resourceType },
        });
      }
      const chunks = fhirChunker(pageDocs);
      const embeddings = await embedChunks(chunks.map((c) => c.text));
      await prisma.$transaction(
        embeddings.map((emb, idx) =>
          prisma.fhirResource.create({
            data: {
              resourceType: this.resourceType,
              data: JSON.parse(chunks[idx].text),
              embedding: emb,
              patientId: JSON.parse(chunks[idx].text).subject?.reference?.split('/')?.[1] ?? null,
              encounterId: JSON.parse(chunks[idx].text).encounter?.reference?.split('/')?.[1] ?? null,
            },
          })
        )
      );
      docs.push(...pageDocs);
      nextUrl = bundle.link?.find((l: any) => l.relation === 'next')?.url;
    }
    return docs;
  }
}
