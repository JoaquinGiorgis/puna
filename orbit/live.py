"""Datos en vivo para la demo: FIRMS (focos del Lote 14), TLE de CelesTrak y protones de NOAA GOES.

Cada fuente se baja en el momento y se contrasta con la copia guardada en sample-data/:
  - FIRMS: se rearma la grilla del lote y se compara su tensor_hash con lot14_grid.npz. Si NASA
    reprocesó focos y la grilla cambió, se avisa y se usa la guardada (los números de la demo, la
    web y el Figma dependen de ella). Si coincide, la grilla del job salió de la API recién.
  - TLE: se baja el GP vigente; si la exposición a la Anomalía en la ventana del job no cambia de
    lado (dentro/fuera) respecto del TLE guardado, se usa el vivo.
  - GOES: flujo de protones integrales (≥10 MeV) del último día, sin clave (orbit/radiation.py).

  python -m orbit.live            # chequeo de las tres fuentes, sin tocar la cadena
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import time
import urllib.request
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

import numpy as np

from node.model import tensor_hash

from .firms import FIRMS_AREA, rasterize

ROOT = Path(__file__).resolve().parents[1]
SAVED_GRID = ROOT / "sample-data" / "lot14_grid.npz"
LOT_BBOX = (-62.9370, -25.0760, -62.9020, -25.0410)
# Evento del Lote 14: mismas fuentes y fechas que sample-data/firms_anta.csv
FIRMS_SOURCES = ("VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT")
EVENT_START, EVENT_END = date(2026, 10, 31), date(2026, 11, 11)
CELESTRAK_GP = "https://celestrak.org/NORAD/elements/gp.php?CATNR={norad}&FORMAT=TLE"
UA = {"User-Agent": "puna-demo/1.0"}


def _get(url: str, timeout: int = 30, tries: int = 3) -> str:
    err: Exception | None = None
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode()
        except Exception as e:  # noqa: BLE001 — red: reintento corto y después que decida el llamador
            err = e
            time.sleep(1 + k)
    raise RuntimeError(f"no se pudo bajar {url.split('?')[0]}: {err}")


# ── FIRMS ────────────────────────────────────────────────────────────────────

def fetch_firms_rows(bbox=LOT_BBOX, start: date = EVENT_START, end: date = EVENT_END,
                     sources=FIRMS_SOURCES) -> list[dict]:
    """Focos de la API de área de FIRMS, en ventanas de ≤5 días, sin duplicados, recortados al evento."""
    key = os.environ["FIRMS_MAP_KEY"]
    box = ",".join(f"{x:.4f}" for x in bbox)
    seen, rows = set(), []
    for src in sources:
        d = start
        while d <= end:
            days = min(5, (end - d).days + 1)
            url = FIRMS_AREA.format(key=key, src=src, bbox=box, days=days) + f"/{d.isoformat()}"
            text = _get(url)
            if not text.startswith("latitude"):
                raise RuntimeError(f"FIRMS respondió algo inesperado: {text[:80]!r}")
            for r in csv.DictReader(io.StringIO(text)):
                k = (r["latitude"], r["longitude"], r["acq_date"], r["acq_time"], r.get("satellite"))
                if k not in seen and start.isoformat() <= r["acq_date"] <= end.isoformat():
                    seen.add(k)
                    rows.append(r)
            d += timedelta(days=days)
    return rows


@dataclass
class LiveGrid:
    grid: np.ndarray
    lot_mask: np.ndarray
    live: bool          # True: la grilla del job es la que se armó recién con la API
    foci: int           # focos dentro de la caja del lote
    input_hash: bytes
    note: str


def live_grid() -> LiveGrid:
    saved = np.load(SAVED_GRID)
    sgrid, mask = saved["grid"], saved["lot_mask"]
    shash = tensor_hash(sgrid)
    try:
        rows = fetch_firms_rows()
    except Exception as e:  # noqa: BLE001
        return LiveGrid(sgrid, mask, False, 0, shash, f"FIRMS no respondió ({e}); uso la grilla guardada")
    w, s, e, n = LOT_BBOX
    foci = sum(1 for r in rows if w <= float(r["longitude"]) < e and s <= float(r["latitude"]) < n)
    g = rasterize(rows, LOT_BBOX)
    h = tensor_hash(g)
    if h == shash:
        return LiveGrid(g, mask, True, foci, h, f"FIRMS en vivo · {foci} focos en el lote · inputHash 0x{h.hex()[:10]}… = guardado ✓")
    return LiveGrid(sgrid, mask, False, foci, shash,
                    f"FIRMS en vivo trajo {foci} focos pero la grilla difiere de la guardada "
                    f"(0x{h.hex()[:10]}… ≠ 0x{shash.hex()[:10]}…, NASA reprocesó NRT); uso la guardada")


# ── TLE ──────────────────────────────────────────────────────────────────────

def fetch_tle(norad: int) -> tuple[str, str, str]:
    lines = [l.strip() for l in _get(CELESTRAK_GP.format(norad=norad)).splitlines() if l.strip()]
    if len(lines) < 2 or not lines[-2].startswith("1 ") or not lines[-1].startswith("2 "):
        raise RuntimeError(f"CelesTrak devolvió un TLE inválido para {norad}")
    name = lines[0] if len(lines) >= 3 else str(norad)
    return name, lines[-2], lines[-1]


def tle_epoch(line1: str) -> str:
    """Época del TLE como AADDD.ddd (columnas 19-32 de la línea 1)."""
    return line1[18:32].strip()


def main() -> None:
    from datetime import datetime, timezone

    from .radiation import fetch_protons
    from .saa import read_tle, saa_bps
    from .scheduler import NODES, NORAD, WINDOW, WINDOW_MIN

    argparse.ArgumentParser(description=__doc__).parse_args()
    lg = live_grid()
    print(("✓ " if lg.live else "▲ ") + lg.note)
    for node in NODES:
        l1s, l2s = read_tle(node.tle)
        try:
            name, l1, l2 = fetch_tle(NORAD[node.name])
            print(f"✓ {node.name} ← {name} (NORAD {NORAD[node.name]}) · época {tle_epoch(l1)} "
                  f"(guardado {tle_epoch(l1s)}) · saaBps {saa_bps(l1, l2, WINDOW, WINDOW_MIN)} "
                  f"(guardado {saa_bps(l1s, l2s, WINDOW, WINDOW_MIN)})")
        except Exception as e:  # noqa: BLE001
            print(f"▲ {node.name}: CelesTrak no respondió ({e}); uso el TLE guardado")
    p = fetch_protons()
    print(("✓ " if p.live else "▲ ") + p.describe())
    print(f"  ahora {datetime.now(timezone.utc):%Y-%m-%d %H:%M}Z")


if __name__ == "__main__":
    main()
