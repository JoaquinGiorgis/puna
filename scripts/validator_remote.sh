#!/usr/bin/env bash
# Corre el agente validador en OTRA máquina (otro operador). Pasos en esa máquina:
#   git clone git@github.com:JoaquinGiorgis/puna.git && cd puna
#   python3 -m venv .venv && .venv/bin/pip install -e .
#   crear .env SOLO con: FUJI_RPC_URL, PUNA_ESCROW y VALIDATOR_PK (nada de las claves del nodo ni de la aseguradora)
#   scripts/validator_remote.sh
#
# El validador escucha ValidationRequest dirigidos a su wallet, baja los tensores por HTTPS desde la
# máquina del nodo (verifica sha256), audita con Freivalds contra los compromisos on-chain y responde
# en ERC-8004. Sus certificados se publican por su propio túnel para que la máquina del nodo y la web los lean.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
set -a; . ./.env; set +a
for k in NODE_A_PK NODE_B_PK INSURER_PK SCHEDULER_PK DEPLOYER_PK; do
  if [ -n "${!k:-}" ]; then echo "▲ $k está en el .env de esta máquina: el validador es otro operador, sacala"; exit 1; fi
done
. scripts/serve_artifacts.sh
echo "validador en $(hostname) · certificados en $ARTIFACTS_BASE_URL"
exec .venv/bin/python -m validator.agent "$@"
