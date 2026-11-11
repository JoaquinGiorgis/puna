"""NASA FIRMS → grilla del lote.

Descarga (requiere MAP_KEY gratis en https://firms.modaps.eosdis.nasa.gov/api/map_key/, va en .env):
  python -m orbit.firms fetch --bbox -64.6,-23.4,-64.0,-22.8 --days 2 --out sample-data/firms_oran.csv
Rasteriza a la grilla 12×12 del lote:
  python -m orbit.firms grid --csv sample-data/firms_oran.csv --bbox ... --out sample-data/lot14_grid.npz

La API de área devuelve CSV: /api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{DAYS}
Fuente por defecto VIIRS_NOAA20_NRT (~375 m). VIIRS_SNPP_NRT devolvía 0 focos en el NOA (11/11/2026),
mientras NOAA-20 traía 610 en 5 días; NOAA-21 y MODIS sirven de alternativa (--source). Si la API se cae, se usa el CSV guardado en sample-data/.
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import urllib.request
from pathlib import Path

import numpy as np

GRID = 12
FIRMS_AREA = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/{key}/{src}/{bbox}/{days}"

# Polígono del Lote 14 en coordenadas de grilla (col, fila), 0..12 — mismo límite que el diseño en Figma
LOT_POLYGON = [(2.9, 0), (12, 0), (12, 9.8), (9.8, 12), (0.9, 12), (0.9, 8.9), (0, 8.9), (0, 1), (2.9, 1)]


DEFAULT_SOURCE = "VIIRS_NOAA20_NRT"


def fetch(bbox: str, days: int, source: str = DEFAULT_SOURCE) -> str:
    key = os.environ["FIRMS_MAP_KEY"]
    url = FIRMS_AREA.format(key=key, src=source, bbox=bbox, days=days)
    with urllib.request.urlopen(url, timeout=30) as r:
        return r.read().decode()


def lot_mask(n: int = GRID) -> np.ndarray:
    """Celdas cuyo centro cae dentro del polígono del lote."""
    from matplotlib.path import Path as MPath

    poly = MPath(LOT_POLYGON)
    centers = [(c + 0.5, r + 0.5) for r in range(n) for c in range(n)]
    return poly.contains_points(centers).reshape(n, n)


def rasterize(rows: list[dict], bbox: tuple[float, float, float, float], n: int = GRID) -> np.ndarray:
    """(n, n, 2) int8: canal 0 = FRP máx escalado 0-127, canal 1 = cantidad de detecciones (tope 127)."""
    w, s, e, nn = bbox
    g = np.zeros((n, n, 2), dtype=np.int32)
    for row in rows:
        lat, lon = float(row["latitude"]), float(row["longitude"])
        if not (w <= lon < e and s <= lat < nn):
            continue
        c = int((lon - w) / (e - w) * n)
        r = int((nn - lat) / (nn - s) * n)
        frp = float(row.get("frp") or 0)
        g[r, c, 0] = max(g[r, c, 0], min(127, int(frp * 4)))
        g[r, c, 1] = min(127, g[r, c, 1] + 16)
    return g.astype(np.int8)


def demo_grid(seed: int = 14) -> np.ndarray:
    """Grilla sintética con la forma del incendio del diseño (para correr sin MAP_KEY). Etiquetada como simulada."""
    rng = np.random.default_rng(seed)
    g = np.zeros((GRID, GRID, 2), dtype=np.int32)
    core = [(r, c) for r in range(3, 7) for c in range(6, 10)]
    ring = [(r, c) for r in range(1, 9) for c in range(4, 12) if (r, c) not in core]
    for r, c in core:
        g[r, c] = (rng.integers(70, 120), rng.integers(48, 96))
    for r, c in ring:
        if rng.random() < 0.55:
            g[r, c] = (rng.integers(20, 60), rng.integers(16, 40))
    return g.astype(np.int8)


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch")
    f.add_argument("--bbox", required=True)
    f.add_argument("--days", type=int, default=2)
    f.add_argument("--source", default=DEFAULT_SOURCE)
    f.add_argument("--out", required=True)
    g = sub.add_parser("grid")
    g.add_argument("--csv")
    g.add_argument("--bbox")
    g.add_argument("--demo", action="store_true")
    g.add_argument("--out", required=True)
    a = ap.parse_args()
    if a.cmd == "fetch":
        Path(a.out).write_text(fetch(a.bbox, a.days, a.source))
        print("ok", a.out)
    else:
        if a.demo:
            grid = demo_grid()
        else:
            rows = list(csv.DictReader(io.StringIO(Path(a.csv).read_text())))
            grid = rasterize(rows, tuple(float(x) for x in a.bbox.split(",")))
        np.savez_compressed(a.out, grid=grid, lot_mask=lot_mask())
        print("ok", a.out)


if __name__ == "__main__":
    main()
