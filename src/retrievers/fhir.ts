import FhirKitClient from 'fhir-kit-client';

const client = new FhirKitClient({
  baseUrl: process.env.FHIR_BASE_URL ?? '',
  auth: {
    username: process.env.FHIR_USERNAME ?? '',
    password: process.env.FHIR_PASSWORD ?? '',
  },
} as any);

/**
 * Query the FHIR server using given search parameters.
 */
export async function fhirQuery(resource: string, params: Record<string, string>) {
  return client.search({ resourceType: resource, searchParams: params });
}
