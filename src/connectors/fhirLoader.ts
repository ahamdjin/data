import FhirKitClient from 'fhir-kit-client';
import { generateUUID } from '@/lib/utils';
import { Connector, Document } from './base';

/**
 * Connector that loads resources from a FHIR server.
 */
export class FhirLoader extends Connector {
  private client: FhirKitClient;
  private pageSize: number;

  constructor(private resourceType: string) {
    super();
    this.pageSize = Number(process.env.FHIR_PAGE_SIZE ?? '50');
    this.client = new FhirKitClient({
      baseUrl: process.env.FHIR_BASE_URL ?? '',
      auth: {
        username: process.env.FHIR_USERNAME ?? '',
        password: process.env.FHIR_PASSWORD ?? '',
      },
    } as any);
  }

  async load(): Promise<Document[]> {
    const docs: Document[] = [];
    let nextUrl: string | undefined = `${this.resourceType}?_count=${this.pageSize}`;
    while (nextUrl) {
      const bundle: any = await this.client.issueGetRequest(nextUrl);
      for (const entry of bundle.entry ?? []) {
        const res = entry.resource;
        docs.push({
          id: String(res?.id ?? generateUUID()),
          text: JSON.stringify(res),
          metadata: { resourceType: res?.resourceType },
        });
      }
      nextUrl = bundle.link?.find((l: any) => l.relation === 'next')?.url;
    }
    return docs;
  }
}
