#!/bin/bash
set -e
cd "$(dirname "$0")"

echo ""
echo "╔══════════════════════════════════╗"
echo "║     Liara Deploy — AHang App     ║"
echo "╚══════════════════════════════════╝"
echo ""

# 1. Check liara CLI
if ! command -v liara &>/dev/null; then
  echo "✗ liara CLI not found. Install: npm install -g @liara/cli"
  exit 1
fi

# 2. Install dependencies if needed
if [ ! -d node_modules ]; then
  echo "→ Installing dependencies..."
  npm ci
fi

# 3. Build the app
echo "→ Building app..."
npm run build

# 4. Verify build output exists
if [ ! -f .output/server/index.mjs ]; then
  echo "✗ Build failed: .output/server/index.mjs not found"
  exit 1
fi
echo "✓ Build successful"

# 5. Deploy to Liara
echo "→ Deploying to Liara..."
liara deploy --app songai --port 3000

echo ""
echo "✓ Deploy complete!"
