# File Storage Connectors

The platform supports read-only ingestion from common cloud file stores via A2 plugins.
Currently available connectors:

- Amazon S3 (`s3`)
- Google Cloud Storage (`gcs`)
- Azure Blob Storage (`azure-blob`)

Use the `/api/files/ingest` endpoint to enqueue an ingest job. The job pulls one or more
objects, parses CSV/Parquet/Text/PDF/DOCX/HTML and image formats (via OCR), and saves
documents + chunks. Duplicate content is skipped based on a content hash. Optionally, it can
automatically enqueue an embedding job when `enqueueEmbed` is true.

## Example Requests

### S3 prefix ingest
```bash
curl -X POST http://localhost:3000/api/files/ingest \
  -H 'Content-Type: application/json' -H 'x-org-id: <ORG_UUID>' \
  -d '{
    "connectorId":"s3",
    "config": { "region":"us-east-1", "bucket":"my-bucket" },
    "source":"data/2025/08/",
    "options": { "prefix":"data/2025/08/", "csv": {"headers": true} },
    "datasetId":"<DATASET_UUID>",
    "enqueueEmbed": true
  }'
```

### GCS single object
```bash
curl -X POST http://localhost:3000/api/files/ingest \
  -H 'Content-Type: application/json' -H 'x-org-id: <ORG_UUID>' \
  -d '{
    "connectorId":"gcs",
    "config": { "bucket":"my-ds", "serviceAccountJson": { /* ... */ } },
    "source":"exports/users.parquet",
    "options": { "object":"exports/users.parquet", "format":"parquet" },
    "datasetId":"<DATASET_UUID>",
    "enqueueEmbed": true
  }'
```

### Azure Blob text logs
```bash
curl -X POST http://localhost:3000/api/files/ingest \
  -H 'Content-Type: application/json' -H 'x-org-id: <ORG_UUID>' \
  -d '{
    "connectorId":"azure-blob",
    "config": { "accountUrl":"https://<acct>.blob.core.windows.net", "sasToken":"<SAS>", "container":"logs" },
    "source":"app/2025-08-12",
    "options": { "prefix":"app/2025-08-12", "format":"text", "text": { "maxTokens": 4000 } },
    "datasetId":"<DATASET_UUID>",
    "enqueueEmbed": true
  }'
```

These connectors rely on environment credentials or credentials provided in the `config`
object. No secrets are persisted.
