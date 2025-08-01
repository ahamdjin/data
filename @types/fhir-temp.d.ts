declare module 'fhir-kit-client' {
  interface FhirKitClientOptions {
    baseUrl: string;
    auth?: { username: string; password: string };
    customHeaders?: Record<string, string>;
  }

  class FhirKitClient {
    constructor(options: FhirKitClientOptions);
    search(options: { resourceType: string; searchParams?: Record<string, string> }): Promise<any>;
    issueGetRequest(url: string): Promise<any>;
  }

  export = FhirKitClient;
}
