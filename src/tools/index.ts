import { tool } from 'ai';
import { z } from 'zod';
import { fhirQuery, similar } from '@/retrievers/fhir';

/** Tool for querying FHIR resources. */
export const fhir_query = tool({
  description: 'Query or search FHIR resources.',
  parameters: z.discriminatedUnion('mode', [
    z.object({
      mode: z.literal('live'),
      resource: z.string().describe('FHIR resource type'),
      params: z.record(z.string(), z.string()).default({}),
    }),
    z.object({
      mode: z.literal('search'),
      question: z.string().describe('natural language query'),
      k: z.number().int().min(1).max(20).default(5),
    }),
  ]),
  execute: async (args) => {
    if (args.mode === 'live') {
      const data = await fhirQuery(args.resource, args.params);
      return JSON.stringify(data);
    }
    const data = await similar(args.question, args.k);
    return JSON.stringify(data);
  },
});
