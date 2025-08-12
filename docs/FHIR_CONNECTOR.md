# FHIR Connector

The FHIR connector ingests resources from an HL7 FHIR server via bulk `$export` or RESTful search pagination.

## Usage

1. Configure the connector with the FHIR server `baseUrl` and authentication.
2. POST to `/api/fhir/ingest` with parameters such as dataset ID, mode (`bulk` or `search`), resource types, and optional `since` watermark.
3. The job streams resources, flattens them to text, deduplicates by SHA-1 hash, and stores document chunks.

## PHI Considerations

FHIR data often contains Protected Health Information (PHI). Ensure you have appropriate permissions and safeguards before ingesting any data. Uploaded resources are stored in raw form alongside derived text chunks; handle access accordingly.
