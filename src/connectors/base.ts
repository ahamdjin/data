export abstract class Connector<TOptions = unknown> {
  constructor(public options: TOptions) {}
  /** Establish a connection to the source system. */
  abstract connect(): Promise<void>
  /** Load data from the source system. */
  abstract load(): AsyncGenerator<unknown>
}
