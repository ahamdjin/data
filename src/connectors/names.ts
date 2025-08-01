export const connectorNames = ['postgres', 'fhir'] as const
export type ConnectorName = typeof connectorNames[number]
