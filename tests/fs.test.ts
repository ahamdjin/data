import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import { ensureDir, ensureFile } from '../src/lib/fs'

const tmpDir = path.join('cache', 'test-dir')
const tmpFile = path.join(tmpDir, 'file.txt')

describe('fs helpers', () => {
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('creates directories', () => {
    ensureDir(tmpDir)
    expect(fs.existsSync(tmpDir)).toBe(true)
  })

  it('creates files', () => {
    ensureFile(tmpFile)
    expect(fs.existsSync(tmpFile)).toBe(true)
  })
})
