"""Radiación real en la ventana del job: protones integrales ≥10 MeV medidos por GOES (NOAA SWPC).

Fuente (sin clave): https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json
Copia guardada: sample-data/goes_protons.json (solo ≥10 MeV), para correr sin red.

Qué es real y qué no: el flujo es una medición real de GOES y saaBps sale de la órbita real (TLE).
La falla del nodo sigue siendo INYECTADA (el jurado elige capa y bit): no tenemos hardware en órbita.
Escala NOAA de tormentas de radiación: S1 a partir de 10 pfu (≥10 MeV).

  python -m orbit.radiation [--save]
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOES_URL = "https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json"
SAVED = ROOT / "sample-data" / "goes_protons.json"
ENERGY = ">=10 MeV"
S_SCALE = [(100_000, "S5"), (10_000, "S4"), (1_000, "S3"), (100, "S2"), (10, "S1")]


@dataclass
class Protons:
    flux_pfu: float      # ≥10 MeV, partículas / (cm² · s · sr)
    at: str              # time_tag de la medición usada
    satellite: int
    live: bool
    in_window: bool      # la medición cae en la ventana del job (si no, es la más reciente)

    @property
    def storm(self) -> str:
        return next((s for th, s in S_SCALE if self.flux_pfu >= th), "S0 (sin tormenta)")

    def describe(self) -> str:
        src = "GOES en vivo" if self.live else "GOES guardado"
        when = "en la ventana del job" if self.in_window else "última medición"
        return (f"{src} · protones ≥10 MeV {self.flux_pfu:.2f} pfu ({when}, {self.at}, GOES-{self.satellite}) "
                f"· escala NOAA {self.storm}")


def _parse(data: list[dict], window: datetime | None) -> Protons | None:
    pts = [d for d in data if d.get("energy") == ENERGY and d.get("flux") is not None]
    if not pts:
        return None
    pts.sort(key=lambda d: d["time_tag"])
    pick, in_window = pts[-1], False
    if window is not None:
        ts = lambda d: datetime.fromisoformat(d["time_tag"].replace("Z", "+00:00"))  # noqa: E731
        best = min(pts, key=lambda d: abs((ts(d) - window).total_seconds()))
        if abs((ts(best) - window).total_seconds()) <= 600:
            pick, in_window = best, True
    return Protons(float(pick["flux"]), pick["time_tag"], int(pick.get("satellite", 0)), True, in_window)


def fetch_protons(window: datetime | None = None, save: bool = False) -> Protons:
    from .live import _get

    if window is None:
        from .scheduler import WINDOW as window  # noqa: N811
    try:
        data = json.loads(_get(GOES_URL))
        p = _parse(data, window)
        if p is None:
            raise RuntimeError("sin datos ≥10 MeV")
        if save:
            SAVED.write_text(json.dumps([d for d in data if d.get("energy") == ENERGY], indent=0))
        return p
    except Exception:  # noqa: BLE001 — sin red: la copia guardada
        p = _parse(json.loads(SAVED.read_text()), window)
        p.live = False
        return p


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--save", action="store_true", help="guarda la respuesta (≥10 MeV) en sample-data/")
    a = ap.parse_args()
    print(fetch_protons(save=a.save).describe())
    if a.save:
        print("ok", SAVED)


if __name__ == "__main__":
    main()
