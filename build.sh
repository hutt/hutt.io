#!/bin/bash
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

cd /workspace

echo "[build] git pull..."
git pull

echo "[build] npm install..."
npm install

echo "[build] npm run build..."
npm run build

echo "[build] Fertig."