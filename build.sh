#!/bin/bash
set -euo pipefail

cd /opt/containers/hutt.io

echo "[build] git pull..."
git pull

echo "[build] npm install..."
npm install

echo "[build] npm run build..."
npm run build

echo "[build] Fertig."