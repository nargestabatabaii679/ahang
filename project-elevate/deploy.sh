#!/bin/bash
set -e

# Run from project-elevate directory
cd "$(dirname "$0")"

echo "=== Liara Deploy Script ==="
echo ""

# Check liara CLI is installed
if ! command -v liara &> /dev/null; then
  echo "ERROR: liara CLI not found. Install it with: npm install -g @liara/cli"
  exit 1
fi

# Check liara login
echo ">>> Checking Liara authentication..."
liara account --api-token "$LIARA_TOKEN" 2>/dev/null || true

echo ">>> Deploying to Liara (no-cache to avoid stale build layers)..."
liara deploy --app songai --port 3000 --no-cache

echo ""
echo "=== Deploy complete! ==="
