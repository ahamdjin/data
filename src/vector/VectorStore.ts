export type Vector = number[];

export type SearchResult = { id: string; score: number; payload?: Record<string, any> };

export interface VectorStore {
  name: string;
  dim: number;

  upsert(opts: {
    namespace: string; // orgId:datasetId
    vectors: Array<{ id: string; vector: Vector; payload?: Record<string, any> }>;
  }): Promise<void>;

  query(opts: {
    namespace: string;
    vector: Vector;
    topK?: number;
    filter?: Record<string, any>;
  }): Promise<SearchResult[]>;
}
