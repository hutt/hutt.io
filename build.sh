#!/bin/bash
set -euo pipefail

WORKDIR="/opt/containers/hutt.io"
cd "$WORKDIR"

echo "[build] git pull..."
git pull

echo "[build] npm install..."
npm install

echo "[build] npm run build..."
npm run build

echo "[build] Container neu starten..."
docker compose up -d --no-deps --build frontend

echo "[build] Fertig."
