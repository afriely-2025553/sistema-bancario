#!/usr/bin/env bash
# Se ejecuta una sola vez, al crear el codespace.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Backend: dependencias =="
cd backend
[ -f .env ] || cp .env.example .env
npm ci --no-audit --no-fund

echo "== Base de datos: schema.sql y seed.sql =="
NODE_PATH="$PWD/node_modules" node ../.devcontainer/esperar-mysql.cjs
npm run db:init

echo "== Frontend: dependencias =="
cd ../frontend
npm ci --no-audit --no-fund

echo "Entorno listo."
