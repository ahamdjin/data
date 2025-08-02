import { encoding_for_model } from 'tiktoken'

export function chunkJSON(json: any, maxTokens = 8000): { id: string; text: string }[] {
  const buffer = 200
  const text = typeof json === 'string' ? json : JSON.stringify(json)
  if (maxTokens < buffer) {
    const out: { id: string; text: string }[] = []
    for (let i = 0; i < text.length; i += maxTokens) {
      out.push({ id: json.id ?? json.resourceType ?? 'unknown', text: text.slice(i, i + maxTokens) })
    }
    return out
  }
  const enc = encoding_for_model('gpt-3.5-turbo')
  const tokens = enc.encode(text)
  const out: { id: string; text: string }[] = []
  let size = maxTokens - buffer
  if (size <= 0) size = 1
  for (let i = 0; i < tokens.length; i += size) {
    const slice = tokens.slice(i, i + size)
    out.push({ id: json.id ?? json.resourceType ?? 'unknown', text: enc.decode(slice) })
  }
  enc.free()
  return out
}
