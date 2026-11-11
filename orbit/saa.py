"""Exposición de un nodo a la Anomalía del Atlántico Sur durante la ventana de ejecución.

saaBps = fracción de la ventana en que la traza sub-satelital cae dentro del polígono de la
Anomalía, × 10.000. Es un proxy declarado, no una tasa de fallas.

TLE de CelesTrak (GP API): https://celestrak.org/NORAD/elements/gp.php?CATNR=<id>&FORMAT=TLE
  python -m orbit.saa --tle sample-data/tle/orbit07.tle --start 2026-11-11T14:02:00Z --minutes 9
"""
from __future__ import annotations

import argparse
import math
from datetime import datetime, timedelta, timezone

from sgp4.api import Satrec, jday

# Polígono aproximado de la Anomalía a ~500 km (lon, lat). Simplificado para la demo; ver docs/resumen-tecnico.md.
SAA_POLYGON = [
    (-90, -10), (-60, -5), (-35, -5), (-10, -15), (10, -25), (20, -40),
    (0, -50), (-30, -55), (-60, -50), (-80, -40), (-90, -25),
]


def _point_in_poly(lon: float, lat: float, poly=SAA_POLYGON) -> bool:
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > lat) != (y2 > lat):
            x = x1 + (lat - y1) * (x2 - x1) / (y2 - y1)
            if lon < x:
                inside = not inside
    return inside


def _gmst(jd: float, fr: float) -> float:
    t = (jd - 2451545.0 + fr) / 36525.0
    g = 280.46061837 + 360.98564736629 * (jd - 2451545.0 + fr) + 0.000387933 * t * t - t**3 / 38710000.0
    return math.radians(g % 360.0)


def subpoint(sat: Satrec, when: datetime) -> tuple[float, float]:
    jd, fr = jday(when.year, when.month, when.day, when.hour, when.minute, when.second + when.microsecond / 1e6)
    e, r, _ = sat.sgp4(jd, fr)
    if e != 0:
        raise RuntimeError(f"sgp4 error {e}")
    x, y, z = r  # TEME, km
    lon = math.degrees(math.atan2(y, x) - _gmst(jd, fr))
    lon = (lon + 180) % 360 - 180
    lat = math.degrees(math.atan2(z, math.hypot(x, y)))  # geocéntrica, suficiente para el proxy
    return lat, lon


def saa_bps(line1: str, line2: str, start: datetime, minutes: float, step_s: int = 10) -> int:
    sat = Satrec.twoline2rv(line1, line2)
    n = max(1, int(minutes * 60 // step_s))
    hits = 0
    for k in range(n):
        lat, lon = subpoint(sat, start + timedelta(seconds=k * step_s))
        hits += _point_in_poly(lon, lat)
    return hits * 10_000 // n


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tle", required=True, help="archivo con 2 o 3 líneas TLE")
    ap.add_argument("--start", required=True)
    ap.add_argument("--minutes", type=float, default=9)
    a = ap.parse_args()
    lines = [l.strip() for l in open(a.tle) if l.strip()]
    l1, l2 = lines[-2], lines[-1]
    start = datetime.fromisoformat(a.start.replace("Z", "+00:00")).astimezone(timezone.utc)
    print(saa_bps(l1, l2, start, a.minutes))


if __name__ == "__main__":
    main()
