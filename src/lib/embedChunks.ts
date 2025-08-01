import fs from 'fs'
import { ensureDir } from './fs'

/**
 * Generate OpenAI embeddings for text chunks.
 * Failures are appended to `logs/embeddings.log`.
 * @param chunks The text chunks to embed
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable')
  }
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: chunks
    })
  })

  if (!res.ok) {
    const msg = await res.text()
    ensureDir('logs')
    fs.appendFileSync('logs/embeddings.log', msg + '\n')
    throw new Error(`Embedding failed: ${res.status}`)
  }

  const data = (await res.json()) as { data: { embedding: number[] }[] }
  return data.data.map((d) => d.embedding)
}
