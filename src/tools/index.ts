import { tool } from 'ai';
import { z } from 'zod';
import { fhirQuery } from '@/retrievers/fhir';

/** Tool for querying FHIR resources. */
export const fhir_query = tool({
  description: 'Query FHIR resources.',
  parameters: z.object({
    resource: z.string().describe('FHIR resource type'),
    params: z.record(z.string(), z.string()).default({}),
  }),
  execute: async ({ resource, params }) => {
    const data = await fhirQuery(resource, params);
    return JSON.stringify(data);
  },
});
