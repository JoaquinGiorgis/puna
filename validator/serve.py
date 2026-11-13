"""Validador como servicio (Railway u otro host): otro operador, otra máquina, wallet propia.

Corre dos cosas en el mismo proceso:
  1. Un servidor HTTP en $PORT que publica sus certificados (out/artifacts/<sha256>.json), para que
     el nodo, la web y cualquiera puedan bajarlos y verificar el hash.
  2. El agente validador (validator/agent.py) escuchando ValidationRequest dirigidos a su wallet.

Variables: VALIDATOR_PK, FUJI_RPC_URL, PUNA_ESCROW. ARTIFACTS_BASE_URL se arma sola con
RAILWAY_PUBLIC_DOMAIN si no está definida. Este host NO debe tener las claves del nodo ni de la aseguradora.

  python -m validator.serve
"""
from __future__ import annotations

import functools
import os
import socket
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from node.publish import _dir

FORBIDDEN = ("NODE_A_PK", "NODE_B_PK", "INSURER_PK", "SCHEDULER_PK", "DEPLOYER_PK")


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path in ("/", "/health"):
            body = b"puna validator ok\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def list_directory(self, path):  # sin listado: solo se baja lo que se conoce por hash
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")  # la web lee los certificados desde el navegador
        super().end_headers()

    def log_message(self, fmt, *args):
        print("http " + fmt % args, flush=True)


def serve_artifacts(port: int) -> None:
    handler = functools.partial(Handler, directory=str(_dir()))
    ThreadingHTTPServer(("0.0.0.0", port), handler).serve_forever()


def main() -> None:
    leaked = [k for k in FORBIDDEN if os.getenv(k)]
    if leaked:
        sys.exit(f"este host es el validador (otro operador): sacá {', '.join(leaked)} de sus variables")
    domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
    if not os.getenv("ARTIFACTS_BASE_URL") and domain:
        os.environ["ARTIFACTS_BASE_URL"] = f"https://{domain}"
    port = int(os.getenv("PORT", "8080"))
    threading.Thread(target=serve_artifacts, args=(port,), daemon=True).start()
    print(f"validador en {socket.gethostname()} · certificados en {os.getenv('ARTIFACTS_BASE_URL', '(sin URL pública)')} "
          f"· http :{port}", flush=True)

    from . import agent

    sys.argv = [sys.argv[0]]
    while True:  # la RPC pública a veces corta: se reinicia el barrido (es idempotente)
        try:
            agent.main()
        except SystemExit:
            raise
        except Exception as e:  # noqa: BLE001
            print(f"▲ validador: {type(e).__name__}: {e} — reintento en 10 s", flush=True)
            time.sleep(10)


if __name__ == "__main__":
    main()
