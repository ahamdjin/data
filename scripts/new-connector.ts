#!/usr/bin/env ts-node
import fs from 'fs/promises'
import path from 'path'
import ejs from 'ejs'

async function main() {
  const name = process.argv[2]
  if (!name) {
    console.error('usage: new-connector <name>')
    process.exit(1)
  }

  const tmplDir = path.join(__dirname, '..', 'templates', 'connector')
  const destDir = path.join(__dirname, '..', 'connectors', name)
  await fs.mkdir(destDir, { recursive: true })

  const files = ['loader.ts', 'icon.svg', '__tests__/loader.test.ts', `../../ui/connectors/${name}Card.tsx`]
  for (const file of files) {
    const tmpl = await fs.readFile(path.join(tmplDir, path.basename(file) + '.ejs'), 'utf8')
    const outPath = path.join(destDir, file.replace('../../', ''))
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    const rendered = ejs.render(tmpl, { name, className: name.charAt(0).toUpperCase() + name.slice(1) })
    await fs.writeFile(outPath, rendered)
  }
  console.log(`scaffolded ${name}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
