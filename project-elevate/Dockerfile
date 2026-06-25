FROM node:22-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY .output ./.output

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0 NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
