FROM registry.liara.ir/library/node:22-bookworm-slim
WORKDIR /app

COPY .output ./.output

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000 NITRO_PORT=3000 HOST=0.0.0.0 NITRO_HOST=0.0.0.0 NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
