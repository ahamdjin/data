#!/usr/bin/env ts-node
import fs from 'fs/promises'
import { ensureDir } from '../src/lib/fs'
import { FhirLoader } from '../src/connectors/fhirLoader'
import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

const args = yargs(hideBin(process.argv))
  .option('since', { type: 'string' })
  .option('max', { type: 'number' })
  .parseSync()

async function main() {
  const loader = new FhirLoader('Patient')
  await loader.load()
}

main().catch(async (err) => {
  ensureDir('logs')
  await fs.writeFile('logs/ingest-fhir.err', String(err))
  console.error(err)
})
