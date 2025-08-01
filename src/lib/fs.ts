import fs from 'fs';
import path from 'path';

/**
 * Ensure the given directory exists.
 * @param dir Path to the directory
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Ensure the given file exists, creating parent directories if necessary.
 * @param file Path to the file
 */
export function ensureFile(file: string): void {
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, '');
  }
}
