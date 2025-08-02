export interface EmbeddedRow {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchResult {
  row: EmbeddedRow;
  score: number;
  source: string;
}
