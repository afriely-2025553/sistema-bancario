#!/usr/bin/env bash
# Se ejecuta cada vez que el codespace arranca: levanta la API y Angular en segundo plano.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/.." && pwd)"
logs="$raiz/logs"
mkdir -p "$logs"

NODE_PATH="$raiz/backend/node_modules" node "$raiz/.devcontainer/esperar-mysql.cjs"

if ! pgrep -f "tsx watch src/server.ts" > /dev/null; then
  cd "$raiz/backend"
  setsid nohup npm run dev > "$logs/backend.log" 2>&1 < /dev/null &
fi

if ! pgrep -f "ng serve --configuration codespaces" > /dev/null; then
  cd "$raiz/frontend"
  setsid nohup npm run start:codespaces > "$logs/frontend.log" 2>&1 < /dev/null &
fi

echo "API: logs/backend.log | Frontend: logs/frontend.log"
echo "Abra la pestaña PORTS y entre al puerto 4200 (Sistema bancario)."
