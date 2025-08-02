import { Connector } from './base'
import { PostgresLoader } from './postgresLoader'
import { FhirLoader } from './fhirLoader'
import { StubLoader } from './stubLoader'
import { prisma } from '@/providers/prisma'
import { connectorNames, ConnectorName } from './names'

export const connectorRegistry: Record<ConnectorName, Connector> = {
  postgres: new PostgresLoader(),
  mysql: new StubLoader('mysql'),
  mssql: new StubLoader('mssql'),
  oracle: new StubLoader('oracle'),
  mongodb: new StubLoader('mongodb'),
  dynamodb: new StubLoader('dynamodb'),
  snowflake: new StubLoader('snowflake'),
  bigquery: new StubLoader('bigquery'),
  redshift: new StubLoader('redshift'),
  gsheets: new StubLoader('gsheets'),
  salesforce: new StubLoader('salesforce'),
  hubspot: new StubLoader('hubspot'),
  stripe: new StubLoader('stripe'),
  s3: new StubLoader('s3'),
  clickhouse: new StubLoader('clickhouse'),
  generic: new StubLoader('generic'),
  fhir: new FhirLoader()
}

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
