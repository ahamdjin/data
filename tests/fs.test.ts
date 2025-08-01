import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ensureDir, ensureFile } from '../src/lib/fs';

const tmpBase = path.join(os.tmpdir(), 'fs-test');

afterEach(() => {
  if (fs.existsSync(tmpBase)) fs.rmSync(tmpBase, { recursive: true });
});

describe('fs helpers', () => {
  it('creates directories', () => {
    const dir = path.join(tmpBase, 'a/b');
    ensureDir(dir);
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('creates files', () => {
    const file = path.join(tmpBase, 'file.txt');
    ensureFile(file);
    expect(fs.existsSync(file)).toBe(true);
  });
});
