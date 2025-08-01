import fs from 'fs'
import path from 'path'

function logError(name: string, err: unknown) {
  try {
    const dir = path.join('.', 'logs')
    fs.mkdirSync(dir, { recursive: true })
    fs.appendFileSync(path.join(dir, `${name}.err`), String(err) + '\n')
  } catch {}
}

/** Ensure that a directory exists. */
export function ensureDir(dir: string): void {
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (err) {
    logError('ensureDir', err)
  }
}

/** Ensure that a file exists, creating parent directories if needed. */
export function ensureFile(file: string): void {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (!fs.existsSync(file)) fs.writeFileSync(file, '')
  } catch (err) {
    logError('ensureFile', err)
  }
}
