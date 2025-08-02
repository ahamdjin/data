import { Connector, Document } from './base'

export class StubLoader extends Connector {
  constructor(public name: string) { super() }

  async ingest(): Promise<any[]> { return [] }
  async chunk(_data: any[]): Promise<Document[]> { return [] }
  async embed(_chunks: Document[]): Promise<number[][]> { return [] }
  async upsert(): Promise<void> { return }
  async similar(_question: string, _k: number): Promise<any[]> { return [] }
  async connected(): Promise<boolean> { return false }
}
