# -------- Stage 1: deps + build --------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

# Copy workspace manifests first for better layer caching. We need the whole monorepo
# context (via docker build from shubhmilan/) because @shubhmilan/* are workspace deps.
COPY pnpm-workspace.yaml package.json turbo.json ./
COPY .env.example ./
COPY packages ./packages
COPY server/api ./server/api

RUN pnpm install --frozen-lockfile=false --filter @shubhmilan/api...
RUN pnpm --filter @shubhmilan/api db:generate
RUN pnpm --filter @shubhmilan/api build

# -------- Stage 2: production runtime --------
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=4000

# Pull prod artifacts only.
COPY --from=builder /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/server/api/package.json ./server/api/package.json
COPY --from=builder /app/server/api/dist ./server/api/dist
COPY --from=builder /app/server/api/prisma ./server/api/prisma
COPY --from=builder /app/server/api/node_modules ./server/api/node_modules
COPY --from=builder /app/node_modules ./node_modules

# Expose the API port + default healthcheck.
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

WORKDIR /app/server/api
CMD ["sh", "-c", "pnpm db:migrate:deploy && node dist/index.js"]
