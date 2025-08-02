export const connectorNames = [
  'postgres',
  'mysql',
  'mssql',
  'oracle',
  'mongodb',
  'dynamodb',
  'snowflake',
  'bigquery',
  'redshift',
  'gsheets',
  'salesforce',
  'hubspot',
  'stripe',
  's3',
  'clickhouse',
  'generic',
  'fhir'
] as const
export type ConnectorName = typeof connectorNames[number]
