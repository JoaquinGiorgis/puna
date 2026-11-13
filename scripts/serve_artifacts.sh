#!/usr/bin/env bash
# Sirve out/artifacts por HTTPS público (túnel rápido de Cloudflare, sin cuenta) e imprime la URL.
# Los archivos se llaman <sha256>.<ext>: quien baja verifica el hash, así que el túnel no necesita ser de confianza.
#
#   source scripts/serve_artifacts.sh        # deja exportado ARTIFACTS_BASE_URL en esta terminal
#   scripts/serve_artifacts.sh               # solo imprime la URL (y deja el túnel corriendo)
#
# Requiere cloudflared (brew install cloudflared). Puerto: PUNA_ARTIFACTS_PORT (8787).
set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PUNA_ARTIFACTS_PORT:-8787}"
DIR="${ARTIFACTS_DIR:-$ROOT/out/artifacts}"
LOG="$ROOT/out/tunnel.log"
mkdir -p "$DIR" "$ROOT/out"

PY="$ROOT/.venv/bin/python"; [ -x "$PY" ] || PY=python3
"$PY" -m http.server "$PORT" --bind 127.0.0.1 --directory "$DIR" >"$ROOT/out/http.log" 2>&1 &
echo "http.server $DIR en 127.0.0.1:$PORT (pid $!)"

: >"$LOG"
cloudflared tunnel --no-autoupdate --url "http://127.0.0.1:$PORT" >"$LOG" 2>&1 &
echo "cloudflared (pid $!) — esperando la URL…"
URL=""
for _ in $(seq 1 40); do
  URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -n "$URL" ] || { echo "no apareció la URL del túnel; ver $LOG"; return 1 2>/dev/null || exit 1; }
export ARTIFACTS_BASE_URL="$URL"
echo "ARTIFACTS_BASE_URL=$URL"
