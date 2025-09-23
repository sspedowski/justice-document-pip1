#!/usr/bin/env bash
set -euo pipefail

SRC="${1:-./dashboard}"
ALT="${2:-./justice-dashboard}"
DEST="${3:-./public/dashboard}"

echo "[publish-dashboard] SRC=$SRC ALT=$ALT DEST=$DEST"

if [[ ! -d "$SRC" && -d "$ALT" ]]; then
  SRC="$ALT"
  echo "[publish-dashboard] Falling back to ALT: $SRC"
fi

if [[ ! -d "$SRC" ]]; then
  echo "[publish-dashboard] No Vite source found (skipping publish)."
  exit 0
fi

pushd "$SRC" >/dev/null
  if [[ -f package-lock.json || -f npm-shrinkwrap.json ]]; then
    npm ci
  else
    npm install
  fi
  npm run build
popd >/dev/null

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$SRC/dist/." "$DEST/"

echo "[publish-dashboard] Published to $DEST"
