#!/usr/bin/env bash
# Proceso principal del contenedor «servicios» (ver docker-compose.yml).
# Levanta la API (puerto 3000) y Angular (puerto 4200) y los vuelve a levantar si se detienen.
# Los procesos viven en este contenedor y no dependen de la sesión que Codespaces abre
# para postStartCommand, que puede terminar con los procesos lanzados en segundo plano.
set -uo pipefail

raiz="${RAIZ_PROYECTO:-/proyecto}"

# El contenedor arranca como root solo para adoptar al dueño de la carpeta del proyecto;
# así los registros y la caché de Angular quedan con el mismo usuario que el editor.
if [ "$(id -u)" = 0 ]; then
  uid="$(stat -c %u "$raiz")"; gid="$(stat -c %g "$raiz")"
  export HOME=/tmp/servicios-home
  mkdir -p "$HOME" && chown "$uid:$gid" "$HOME"
  exec setpriv --reuid="$uid" --regid="$gid" --clear-groups bash "$0" "$@"
fi

logs="$raiz/logs"
marca="$logs/.dependencias-listas"
mkdir -p "$logs"

export NG_CLI_ANALYTICS=false NO_UPDATE_NOTIFIER=1 npm_config_update_notifier=false npm_config_fund=false

registrar() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

esperar_dependencias() {
  local avisado=0
  until [ -f "$marca" ] && [ -x "$raiz/backend/node_modules/.bin/tsx" ] && [ -x "$raiz/frontend/node_modules/.bin/ng" ]; do
    if [ "$avisado" = 0 ]; then registrar "Esperando a que post-create.sh instale las dependencias..."; avisado=1; fi
    sleep 3
  done
}

# servicio <nombre> <carpeta> <script de npm> <archivo de registro>
servicio() {
  local nombre=$1 carpeta=$2 script=$3 log="$logs/$4" codigo
  : > "$log"
  while true; do
    esperar_dependencias >> "$log"
    if [ "$nombre" = API ]; then
      if ! NODE_PATH="$raiz/backend/node_modules" node "$raiz/.devcontainer/esperar-mysql.cjs" >> "$log" 2>&1; then
        sleep 5; continue
      fi
    fi
    registrar "Iniciando $nombre (npm run $script)." >> "$log"
    (cd "$raiz/$carpeta" && exec npm run "$script") >> "$log" 2>&1 < /dev/null
    codigo=$?
    registrar "$nombre terminó con código $codigo. Se reinicia en 5 s." >> "$log"
    sleep 5
  done
}

trap 'kill 0' TERM INT
servicio API backend dev backend.log &
servicio Angular frontend start:codespaces frontend.log &
wait
