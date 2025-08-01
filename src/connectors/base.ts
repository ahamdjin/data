export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Base connector class for loading documents from external systems.
 */
export abstract class Connector {
  /** Load documents from the source system. */
  abstract load(): Promise<Document[]>;
}
