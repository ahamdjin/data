import fs from 'fs';
import path from 'path';

/** Sanitize a relative path and reject dangerous values. */
export function sanitizePath(p: string): string {
  if (path.isAbsolute(p) || p.split(path.sep).includes('..')) {
    throw new Error(`Invalid path: ${p}`);
  }
  return p;
}

/**
 * Ensure the given directory exists.
 * @param dir Path to the directory
 */
export function ensureDir(dir: string): void {
  dir = sanitizePath(dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Ensure the given file exists, creating parent directories if necessary.
 * @param file Path to the file
 */
export function ensureFile(file: string): void {
  file = sanitizePath(file);
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '');
  }
}
