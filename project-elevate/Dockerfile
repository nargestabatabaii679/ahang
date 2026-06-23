FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy pre-built output (built locally before deploy)
COPY .output ./.output

RUN mkdir -p /app/data /app/public/media

EXPOSE 3000
ENV PORT=3000
ENV NITRO_PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "/app/.output/server/index.mjs"]
