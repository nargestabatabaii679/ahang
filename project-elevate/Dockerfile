FROM node:22-alpine AS builder
WORKDIR /app

# Build tools for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Runtime ────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.output /app/.output

# Persistent directories (mount as Liara disks)
RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["npm", "run", "start"]
