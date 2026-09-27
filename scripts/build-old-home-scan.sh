#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$ROOT/public/models/old-home-scan.glb"
OPTIMIZED="${TMPDIR:-/tmp}/old-home-scan.optimized.glb"

cd "$ROOT"
blender --background --factory-startup --python scripts/blender/build_old_home_scan.py
npx gltf-transform optimize "$OUTPUT" "$OPTIMIZED" \
  --compress false \
  --flatten false \
  --join false \
  --instance false \
  --palette false \
  --simplify true \
  --simplify-ratio 0.78 \
  --simplify-error 0.001 \
  --texture-compress webp \
  --texture-size 768
mv "$OPTIMIZED" "$OUTPUT"
