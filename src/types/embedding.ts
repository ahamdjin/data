export interface EmbeddedRow {
  id: string;
  connectorId: string;
  embedding: number[];
  source: string; // "mongodb://.../users#123"
  text: string;   // raw flattened JSON
  updatedAt: Date;
}

export interface SearchResult {
  row: EmbeddedRow;
  score: number; // cosine similarity 0-1
}
