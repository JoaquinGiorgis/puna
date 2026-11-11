"""Overlays del globo desde órbitas REALES: trazas sgp4 de NOAA 20/21 (ORBIT-07/03) en la ventana de la demo,
el polígono de la Anomalía que usa saaBps y el Lote 14. Misma proyección que docs/design/assets/globe.py
(globe.png es 1640×1264 = 2× del marco 820×632).

  .venv/bin/python scripts/export_globe_overlay.py   → web/public/renders/globe-overlay.json
"""
from __future__ import annotations

import json
import math
import sys
from datetime import timedelta
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from orbit.saa import SAA_POLYGON, _point_in_poly, read_tle, subpoint  # noqa: E402
from orbit.scheduler import NODES, WINDOW, WINDOW_MIN  # noqa: E402
from sgp4.api import Satrec  # noqa: E402

# --- proyección (idéntica a globe.py, en coordenadas 1×)
LAT0, LON0 = -24.0, -59.0
CX, CY, R = 370.0, 352.0, 450.0
la0, lo0 = math.radians(LAT0), math.radians(LON0)
F = np.array([math.cos(la0) * math.cos(lo0), math.cos(la0) * math.sin(lo0), math.sin(la0)])
E = np.array([-math.sin(lo0), math.cos(lo0), 0.0])
N = np.array([-math.sin(la0) * math.cos(lo0), -math.sin(la0) * math.sin(lo0), math.cos(la0)])
ALT_RATIO = (6371 + 830) / 6371  # NOAA 20/21 a ~830 km
LOT = (-25.0585, -62.9195)  # centro del Lote 14 (Anta)
CITIES = {"Salta": (-24.79, -65.41), "Buenos Aires": (-34.60, -58.38), "Santiago": (-33.45, -70.67),
          "Lima": (-12.05, -77.04), "São Paulo": (-23.55, -46.63), "Brasília": (-15.79, -47.88)}


def ecef(lat, lon, r=1.0):
    la, lo = math.radians(lat), math.radians(lon)
    return r * np.array([math.cos(la) * math.cos(lo), math.cos(la) * math.sin(lo), math.sin(la)])


def screen(p):
    return CX + p @ E * R, CY - p @ N * R, float(p @ F)


def visible(sx, sy, z):
    return z > 0 or math.hypot(sx - CX, sy - CY) > R


def path(points, surface: bool):
    segs, cur = [], []
    for p in points:
        sx, sy, z = screen(p)
        ok = (z > 0.02) if surface else (visible(sx, sy, z) and -40 < sx < 860 and -40 < sy < 672)
        if ok:
            cur.append(f"{sx:.1f} {sy:.1f}")
        else:
            if len(cur) > 1:
                segs.append("M" + " L".join(cur))
            cur = []
    if len(cur) > 1:
        segs.append("M" + " L".join(cur))
    return " ".join(segs)


def pt(lat, lon, r=1.0):
    sx, sy, z = screen(ecef(lat, lon, r))
    return [round(sx, 1), round(sy, 1), round(z, 3)]


def track(node, t0, t1, step_s=20):
    sat = Satrec.twoline2rv(*read_tle(node.tle))
    out, t = [], t0
    while t <= t1:
        out.append(subpoint(sat, t))
        t += timedelta(seconds=step_s)
    return out


def main() -> None:
    w0, w1 = WINDOW, WINDOW + timedelta(minutes=WINDOW_MIN)
    data = {"frame": [820, 632], "window": {"start": w0.isoformat(), "minutes": WINDOW_MIN}}
    for key, node in zip("AB", NODES):
        ll = track(node, w0 - timedelta(minutes=30), w1 + timedelta(minutes=30))
        win = track(node, w0, w1)
        data[f"ground{key}"] = path([ecef(*p) for p in ll], surface=True)
        data[f"orbit{key}"] = path([ecef(*p, ALT_RATIO) for p in ll], surface=False)
        data[f"window{key}"] = path([ecef(*p, ALT_RATIO) for p in win], surface=False)
        mid = win[len(win) // 2]
        data[f"sat{key}"] = pt(*mid, ALT_RATIO)[:2]
        data[f"sat{key}Ground"] = pt(*mid)
        data[f"sat{key}InSaa"] = _point_in_poly(mid[1], mid[0])
        data[f"sat{key}Name"] = node.name
    # polígono de la Anomalía (proxy de saaBps), densificado sobre la esfera
    poly = SAA_POLYGON + [SAA_POLYGON[0]]
    dense = []
    for (lo1, la1), (lo2, la2) in zip(poly, poly[1:]):
        for t in np.linspace(0, 1, 24, endpoint=False):
            dense.append(ecef(la1 + (la2 - la1) * t, lo1 + (lo2 - lo1) * t))
    dense.append(dense[0])
    data["saa"] = path(dense, surface=True)
    data["saaLabel"] = pt(-30, -45)
    data["lote"] = pt(*LOT)
    data["cities"] = {k: pt(*v) for k, v in CITIES.items()}
    data["limb"] = {"cx": CX, "cy": CY, "r": R}
    out = ROOT / "web" / "public" / "renders" / "globe-overlay.json"
    out.write_text(json.dumps(data))
    print("ok", out, {k: data[k] for k in ("satA", "satAInSaa", "satB", "satBInSaa", "lote")})


if __name__ == "__main__":
    main()
