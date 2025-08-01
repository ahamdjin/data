# Extending Connectors

This repository exposes a small `Connector` base class used for data ingestion.
To add a new connector:

1. Create `src/connectors/myLoader.ts` extending `Connector` and implement `ingest`, `chunk`, `embed`, `upsert`, `similar` and `connected`.
2. Register an instance in `src/connectors/registry.ts`.
3. Update any UI forms if credentials are required.

A simple loader can usually be implemented and registered in under an hour.
