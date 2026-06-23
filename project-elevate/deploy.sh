#!/bin/bash
set -e

# This script can be run from EITHER the repo root OR project-elevate/
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== Liara Deploy ($(basename "$SCRIPT_DIR")) ==="

if ! command -v liara &>/dev/null; then
  echo "ERROR: liara CLI not found. Run: npm install -g @liara/cli"
  exit 1
fi

echo ">>> Deploying with --no-cache (clears stale build layers)..."
liara deploy --app songai --port 3000 --no-cache

echo "=== Done ==="
