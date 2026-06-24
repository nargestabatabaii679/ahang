#!/bin/bash
set -e
cd "$(dirname "$0")"
APP_DIR="$(pwd)"

echo ""
echo "╔══════════════════════════════════╗"
echo "║     Liara Deploy — AHang App     ║"
echo "╚══════════════════════════════════╝"
echo ""
echo "→ Project directory: $APP_DIR"

if ! command -v liara &>/dev/null; then
  echo "✗ liara CLI not found. Install: npm install -g @liara/cli"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "→ Installing dependencies..."
  npm ci
fi

echo "→ Building app..."
npm run build

if [ ! -f .output/server/index.mjs ]; then
  echo "✗ Build failed: .output/server/index.mjs not found"
  exit 1
fi
echo "✓ Build successful (.output/ ready)"

echo "→ Deploying to Liara..."
liara deploy \
  --app songai \
  --port 3000 \
  --path "$APP_DIR" \
  --dockerfile "$APP_DIR/Dockerfile" \
  --no-cache

echo ""
echo "✓ Deploy complete!"
