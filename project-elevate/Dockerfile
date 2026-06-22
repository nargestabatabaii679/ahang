FROM node:22-alpine AS builder
WORKDIR /app

# Install build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .

# Build with Node.js server preset instead of Cloudflare
ENV NITRO_PRESET=node-server
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.output /app/.output

# Runtime directories
RUN mkdir -p /app/data /app/public/media

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
