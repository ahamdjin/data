import FhirKitClient from 'fhir-kit-client';

let client: FhirKitClient | null = null;

function getClient(): FhirKitClient {
  if (!client) {
    const baseUrl = process.env.FHIR_BASE_URL;
    if (!baseUrl) {
      throw new Error('Missing FHIR_BASE_URL environment variable');
    }
    client = new FhirKitClient({
      baseUrl,
      auth: {
        username: process.env.FHIR_USERNAME ?? '',
        password: process.env.FHIR_PASSWORD ?? '',
      },
    } as any);
  }
  return client;
}

/**
 * Query the FHIR server using given search parameters.
 */
export async function fhirQuery(resource: string, params: Record<string, string>) {
  return getClient().search({ resourceType: resource, searchParams: params });
}
