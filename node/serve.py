"""Servicio del nodo para la demo web (Railway): dispara el siniestro on-chain desde un botón.

Corre `scripts/e2e.py --demo --live --remote-validator` con la capa y el bit que elige el jurado, y
expone el progreso. El validador NO vive acá: es otro servicio, con otra wallet (validator/serve.py).

  GET  /health                     → ok
  GET  /status                     → {"running", "lines", "jobId", "result", "runsToday", "cap", "cooldown"}
  POST /run   {"capa":1-4,"bit":0-7}  → 202 si arrancó; 409 si hay una corrida; 429 si hay que esperar
  GET  /<sha256>.<ext>             → artefactos del nodo (tensores), que el validador baja y verifica por hash

Variables: INSURER_PK, SCHEDULER_PK, NODE_A_PK, NODE_B_PK, VALIDATOR_ADDR, PRODUCER_ADDR, AGENT_ID_A,
AGENT_ID_B, FUJI_RPC_URL, PUNA_ESCROW, FIRMS_MAP_KEY (opcional). ARTIFACTS_BASE_URL sale de
RAILWAY_PUBLIC_DOMAIN. Gasta AVAX de testnet: una corrida a la vez, espera entre corridas y tope diario.
"""
from __future__ import annotations

import functools
import json
import os
import re
import subprocess
import sys
import threading
import time
from datetime import date
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from .publish import _dir

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = ("VALIDATOR_PK",)  # la clave del validador es de otro operador: nunca en este host
CAP = int(os.getenv("DEMO_DAILY_CAP", "15"))
COOLDOWN = int(os.getenv("DEMO_COOLDOWN_S", "60"))
MAX_LINES = 400
ORIGINS = os.getenv("DEMO_ALLOWED_ORIGINS", "https://puna-mission-control.vercel.app,http://localhost:3107,http://localhost:3000").split(",")


class State:
    lock = threading.Lock()
    running = False
    lines: list[str] = []
    job_id: int | None = None
    result: str | None = None
    started = 0.0
    finished = 0.0
    day = date.today()
    runs_today = 0


S = State()


def _run(capa: int, bit: int) -> None:
    cmd = [sys.executable, "-u", str(ROOT / "scripts" / "e2e.py"), "--demo", "--live", "--remote-validator",
           "--capa", str(capa), "--bit", str(bit)]
    try:
        p = subprocess.Popen(cmd, cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        assert p.stdout
        for raw in p.stdout:
            line = raw.rstrip()
            if not line:
                continue
            with S.lock:
                S.lines.append(line)
                del S.lines[:-MAX_LINES]
                m = re.search(r"jobId (\d+)", line)
                if m:
                    S.job_id = int(m.group(1))
                m = re.search(r"RESULTADO intento \d+: (\w+)", line)
                if m:
                    S.result = m.group(1)
        code = p.wait()
        if code != 0:
            with S.lock:
                S.lines.append(f"▲ la corrida terminó con error (código {code})")
                S.result = S.result or "Error"
    except Exception as e:  # noqa: BLE001
        with S.lock:
            S.lines.append(f"▲ no se pudo correr la demo: {type(e).__name__}: {e}")
            S.result = "Error"
    finally:
        with S.lock:
            S.running = False
            S.finished = time.time()


class Handler(SimpleHTTPRequestHandler):
    def _cors(self):
        origin = self.headers.get("Origin", "")
        if origin in ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        else:
            self.send_header("Access-Control-Allow-Origin", "*")  # los artefactos son públicos (por hash)

    def _json(self, code: int, body: dict):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def send_response(self, code, message=None):
        super().send_response(code, message)
        self._cors()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_GET(self):
        if self.path in ("/", "/health"):
            return self._json(200, {"ok": True})
        if self.path.startswith("/status"):
            with S.lock:
                if S.day != date.today():
                    S.day, S.runs_today = date.today(), 0
                wait = max(0, int(COOLDOWN - (time.time() - S.finished))) if S.finished else 0
                return self._json(200, {"running": S.running, "lines": S.lines[-200:], "jobId": S.job_id, "result": S.result,
                                        "runsToday": S.runs_today, "cap": CAP, "cooldown": 0 if S.running else wait})
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/run"):
            return self._json(404, {"error": "no existe"})
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(min(n, 1024)) or b"{}")
            capa, bit = int(body.get("capa", 3)), int(body.get("bit", 7))
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"error": "pedido inválido"})
        if not (1 <= capa <= 4 and 0 <= bit <= 7):
            return self._json(400, {"error": "capa 1 a 4 y bit 0 a 7"})
        with S.lock:
            if S.day != date.today():
                S.day, S.runs_today = date.today(), 0
            if S.running:
                return self._json(409, {"error": "ya hay una corrida en curso"})
            if S.finished and time.time() - S.finished < COOLDOWN:
                return self._json(429, {"error": f"esperá {int(COOLDOWN - (time.time() - S.finished))} s"})
            if S.runs_today >= CAP:
                return self._json(429, {"error": "se alcanzó el tope de corridas de hoy"})
            S.running, S.lines, S.job_id, S.result, S.started = True, [], None, None, time.time()
            S.runs_today += 1
        threading.Thread(target=_run, args=(capa, bit), daemon=True).start()
        return self._json(202, {"started": True, "capa": capa, "bit": bit})

    def list_directory(self, path):
        self.send_error(404)
        return None

    def log_message(self, fmt, *args):
        if "/status" not in (args[0] if args else ""):
            print("http " + fmt % args, flush=True)


def main() -> None:
    leaked = [k for k in FORBIDDEN if os.getenv(k)]
    if leaked:
        sys.exit(f"este host es el nodo: sacá {', '.join(leaked)} de sus variables (el validador es otro operador)")
    domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
    if not os.getenv("ARTIFACTS_BASE_URL") and domain:
        os.environ["ARTIFACTS_BASE_URL"] = f"https://{domain}"
    port = int(os.getenv("PORT", "8080"))
    print(f"nodo · artefactos en {os.getenv('ARTIFACTS_BASE_URL', '(sin URL pública)')} · http :{port} · tope {CAP}/día", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), functools.partial(Handler, directory=str(_dir()))).serve_forever()


if __name__ == "__main__":
    main()
