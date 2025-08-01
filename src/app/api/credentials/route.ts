import { prisma } from '@/providers/prisma'
import { encrypt } from '@/lib/crypto'

export async function POST(req: Request) {
  const { source, creds } = await req.json()
  if (!source || !creds) return new Response('Invalid body', { status: 400 })
  const value = encrypt(JSON.stringify(creds))
  await prisma.secret.upsert({
    where: { source_key: { source, key: 'creds' } },
    update: { value },
    create: { source, key: 'creds', value }
  })
  return Response.json({ status: 'connected' })
}

export async function GET() {
  const secrets = await prisma.secret.findMany({ select: { source: true } })
  const names = Array.from(new Set(secrets.map((s) => s.source)))
  return Response.json(names)
}
