import { tool } from 'ai'
import { z } from 'zod'
import { retrieveFhir } from '@/retrievers/fhir'

export const fhir_query = tool({
  description: 'Query resources from the connected FHIR server.',
  parameters: z.object({
    resourceType: z.string(),
    query: z.record(z.string(), z.string()).optional()
  }),
  execute: async ({ resourceType, query }) => {
    const res = await retrieveFhir(resourceType, query ?? {})
    return JSON.stringify(res)
  }
})
