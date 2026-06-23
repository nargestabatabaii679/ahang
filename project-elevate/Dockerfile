FROM node:22-alpine
WORKDIR /app

# Native compilation tools for better-sqlite3
RUN apk add --no-cache python3 make g++

# Production dependencies (cached layer - only re-runs when package files change)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Pre-built server artifacts (built before deploy - see deploy.sh)
COPY .output ./.output

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0 NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
