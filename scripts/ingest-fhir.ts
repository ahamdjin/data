#!/usr/bin/env ts-node
import fs from 'fs/promises';
import path from 'path';
import { FhirLoader } from '../src/connectors/fhirLoader';
import { ensureDir } from '../src/lib/fs';

async function main() {
  const resource = process.argv[2] || 'Patient';
  const loader = new FhirLoader(resource);
  const docs = await loader.load();
  ensureDir('cache');
  await fs.writeFile(path.join('cache', `${resource}.json`), JSON.stringify(docs, null, 2));
  console.log(`Wrote ${docs.length} documents`);
}

main().catch(async (err) => {
  ensureDir('logs');
  await fs.writeFile('logs/ingest-fhir.err', String(err));
  console.error(err);
});
