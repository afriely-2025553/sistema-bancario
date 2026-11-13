#!/usr/bin/env bash
# Se ejecuta una sola vez, al crear el codespace.
set -euo pipefail
cd "$(dirname "$0")/.."

# El contenedor «servicios» espera esta marca para levantar la API y Angular.
mkdir -p logs
rm -f logs/.dependencias-listas

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

touch ../logs/.dependencias-listas
echo "Entorno listo. La API y Angular arrancan en el contenedor «servicios»."
