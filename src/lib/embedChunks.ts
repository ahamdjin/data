import fs from 'fs'
import { ensureDir } from './fs'

/**
 * Generate OpenAI embeddings for text chunks.
 * Failures are appended to `logs/embed.err`.
 * @param chunks The text chunks to embed
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY || process.env.TOGETHER_API_KEY
  if (!key) throw new Error('Missing embedding API key')

  const url = process.env.OPENAI_API_KEY
    ? 'https://api.openai.com/v1/embeddings'
    : 'https://api.together.xyz/v1/embeddings'

  const all: number[][] = []
  for (let i = 0; i < chunks.length; i += 96) {
    const batch = chunks.slice(i, i + 96)
    let attempts = 0
    while (true) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: batch
        })
      })

      if (res.ok) {
        const data = (await res.json()) as { data: { embedding: number[] }[] }
        all.push(...data.data.map((d) => d.embedding))
        break
      }

      attempts++
      ensureDir('logs')
      fs.appendFileSync('logs/embed.err', (await res.text()) + '\n')
      if (attempts >= 3) throw new Error('embedding failed')
      await new Promise((r) => setTimeout(r, 2 ** attempts * 1000))
    }
  }
  return all
}
