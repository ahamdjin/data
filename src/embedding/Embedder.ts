export interface Embedder {
  name: string;
  dim: number;
  embed(texts: string[]): Promise<number[][]>;
}
