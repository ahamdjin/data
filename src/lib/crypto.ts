import crypto from 'crypto'

/** Encrypt data using AES-256-GCM. */
export function encrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('Missing ENCRYPTION_KEY')
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes hex')
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Decrypt data using AES-256-GCM. */
export function decrypt(encoded: string): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('Missing ENCRYPTION_KEY')
  const keyBuf = Buffer.from(key, 'hex')
  if (keyBuf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes hex')
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data).toString('utf8') + decipher.final('utf8')
}
