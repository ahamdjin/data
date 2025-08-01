declare module 'fhir-kit-client' {
  export default class Client {
    constructor(options: any)
    capabilityStatement(): Promise<any>
    search(opts: any): Promise<any>
    request(url: string): Promise<any>
    [key: string]: any
  }
}
