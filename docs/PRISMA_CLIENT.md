# Prisma Client Singleton

This project uses a singleton instance of `PrismaClient` to avoid opening new
connections every time the server reloads in development.

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

- In **development**, the instance is cached on `globalThis` so that hot
  reloads reuse the existing connection.
- In **production**, a new client is created for each serverless invocation
  or process.

When writing new code that accesses the database, always import `prisma` from
`src/providers/prisma.ts` instead of instantiating a new `PrismaClient`.
