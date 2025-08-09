// src/db/Adapter.ts
export type QueryParams = readonly unknown[];
export type Vector = number[];
export type Capability = 'sql' | 'vector' | 'json' | 'fulltext';

export interface DbAdapter {
  name: string;
  capabilities: Capability[];

  // Basic SQL query interface (rows)
  query<T = unknown>(sql: string, params?: QueryParams): Promise<T[]>;

  // Optional convenience helpers
  table?<T = unknown>(name: string): {
    all(): Promise<T[]>;
    byId(id: string | number): Promise<T | undefined>;
  };

  // Optional vector operations (if supported)
  upsertEmbedding?(opts: {
    table: string; id: string; vector: Vector; payload?: Record<string, any>;
  }): Promise<void>;

  similar?(opts: {
    table: string; vector: Vector; topK?: number;
  }): Promise<Array<{ id: string | number; score: number }>>;

  // Optional cleanup
  close?(): Promise<void>;
}
