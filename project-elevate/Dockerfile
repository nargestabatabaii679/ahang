FROM node:22-alpine
WORKDIR /app

# Build tools for better-sqlite3 native module
RUN apk add --no-cache python3 make g++

# Dependencies (cached layer - only re-runs if package*.json changes)
COPY package.json package-lock.json ./
RUN npm ci

# Source code + config files
COPY . .

# Build (produces .output/server/index.mjs)
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --omit=dev

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0 NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
