# Use Node.js as the base image
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests and Prisma schema early so that pnpm install
# can run any postinstall scripts that rely on it.
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN corepack enable && pnpm install --frozen-lockfile && mkdir -p /app/logs /app/cache

# Set a build-time argument for OLLAMA_URL with a default value
ARG OLLAMA_URL=http://127.0.0.1:11434
ENV OLLAMA_URL=${OLLAMA_URL}

COPY . .

RUN pnpm run build

FROM node:20-slim

WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/node_modules ./node_modules
RUN useradd -m node && mkdir -p /app/logs /app/cache
USER node

# Set environment variable with a default value that can be overridden at runtime
ENV OLLAMA_URL=http://127.0.0.1:11434
ENV PORT=3000

EXPOSE 3000
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
