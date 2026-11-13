#!/usr/bin/env bash
# Informa si la API (3000) y Angular (4200) responden. No inicia procesos:
# los levanta el contenedor «servicios». Uso: bash .devcontainer/estado.sh [segundos de espera]
raiz="$(cd "$(dirname "$0")/.." && pwd)"
limite=${1:-300}
inicio=$SECONDS

responde() { curl -s -o /dev/null --max-time 5 "$1"; }

until responde http://127.0.0.1:3000/api/salud && responde http://127.0.0.1:4200/; do
  if (( SECONDS - inicio >= limite )); then
    echo "Los servicios todavía no responden después de ${limite} s."
    for f in backend frontend; do
      echo "--- logs/$f.log (últimas líneas)"
      tail -n 15 "$raiz/logs/$f.log" 2>/dev/null || echo "(sin registro)"
    done
    echo "Vea «Solución de problemas en Codespaces» en el README."
    exit 0
  fi
  sleep 5
done
echo "API lista en el puerto 3000 y Angular en el 4200 (pestaña PORTS)."
echo "Registros: logs/backend.log y logs/frontend.log"
