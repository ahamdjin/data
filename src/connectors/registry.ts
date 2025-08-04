import { Connector } from './base'
import { PostgresLoader } from './postgresLoader'
import { FhirLoader } from './fhirLoader'
import { prisma } from '@/providers/prisma'
import { connectorNames } from './names'

/** Registry of available connector factories */
export const connectorRegistry: Record<(typeof connectorNames)[number], () => Connector> = {
  postgres: () => new PostgresLoader(),
  fhir: () => new FhirLoader(),
}

/**
 * Return connectors that have saved credentials.
 *
 * When the default database is not configured we simply return an empty
 * registry so that builds can proceed without requiring a running database.
 */
export async function getActiveConnectors(): Promise<Record<string, Connector>> {
  if (!process.env.DATABASE_URL) {
    return {}
  }

  const secrets = await prisma.secret.findMany()
  const active: Record<string, Connector> = {}
  for (const [name, factory] of Object.entries(connectorRegistry)) {
    if (secrets.some((s) => s.source === name)) {
      active[name] = factory()
    }
  }
  return active
}
