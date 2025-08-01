import { Connector } from './base'
import { PostgresLoader } from './postgresLoader'
import { FhirLoader } from './fhirLoader'
import { prisma } from '@/providers/prisma'
import { connectorNames } from './names'

/** Registry of available connectors */
export const connectorRegistry: Record<(typeof connectorNames)[number], Connector> = {
  postgres: new PostgresLoader(),
  fhir: new FhirLoader()
}

/**
 * Return connectors that have saved credentials.
 */
export async function getActiveConnectors(): Promise<Record<string, Connector>> {
  const secrets = await prisma.secret.findMany()
  const active: Record<string, Connector> = {}
  for (const [name, connector] of Object.entries(connectorRegistry)) {
    if (secrets.some((s) => s.source === name)) {
      active[name] = connector
    }
  }
  return active
}
