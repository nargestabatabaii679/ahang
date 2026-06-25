FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY .output ./.output

# Remove glibc-compiled better-sqlite3 from Nitro output so alpine version is used
RUN rm -rf /app/.output/server/node_modules/better-sqlite3

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0 NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
