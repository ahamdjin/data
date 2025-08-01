import crypto from 'crypto'
import { prisma } from '@/providers/prisma'

export async function POST(req: Request) {
  const { source, key, value } = await req.json()
  if (!source || !key || !value) {
    return new Response('Invalid body', { status: 400 })
  }
  const hashed = crypto.scryptSync(value, 'salt', 32).toString('hex')
  await prisma.secrets.upsert({
    where: { source_key: { source, key } },
    update: { value: hashed },
    create: { source, key, value: hashed }
  })
  return new Response('ok')
}
