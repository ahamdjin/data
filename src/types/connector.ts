export type DataSourceType =
  | 'postgres'
  | 'mysql'
  | 'mssql'
  | 'oracle'
  | 'mongodb'
  | 'dynamodb'
  | 'snowflake'
  | 'bigquery'
  | 'redshift'
  | 'gsheets'
  | 'salesforce'
  | 'hubspot'
  | 'stripe'
  | 's3'
  | 'clickhouse'
  | 'generic'
  | 'fhir';

import { EmbeddedRow, SearchResult } from './embedding';

export interface BaseConnectorConfig {
  id: string;
  type: DataSourceType;
  displayName: string;
  credentials: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loader {
  testConnection(cfg: BaseConnectorConfig): Promise<void>;
  sync(cfg: BaseConnectorConfig, since?: Date): Promise<void>;
  upsert(rows: EmbeddedRow[]): Promise<number>;
  similar(queryEmbedding: number[], k?: number): Promise<SearchResult[]>;
}
