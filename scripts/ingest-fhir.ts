#!/usr/bin/env ts-node
import fs from 'fs'
import path from 'path'
import { FhirLoader } from '../src/connectors/fhirLoader'
import { chunkFhirResource } from '../src/lib/chunking/fhirChunker'
import { ensureDir } from '../src/lib/fs'

async function main() {
  const loader = new FhirLoader({ resourceType: 'Patient' })
  await loader.connect()
  const cache = path.join('cache', 'fhir')
  ensureDir(cache)
  for await (const res of loader.load()) {
    for (const chunk of chunkFhirResource(res as Record<string, any>)) {
      const file = path.join(cache, `${chunk.id}.json`)
      fs.writeFileSync(file, JSON.stringify(chunk))
    }
  }
}

main().catch(err => {
  ensureDir('logs')
  fs.appendFileSync(path.join('logs', 'ingest-fhir.err'), String(err) + '\n')
})
