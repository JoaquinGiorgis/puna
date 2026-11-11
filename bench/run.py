"""Benchmark mini: 300 inyecciones (3 familias × 4 capas × 25 semillas) sobre el Lote 14 real.

Para cada falla: corre el job con la falla, audita con Freivalds (reps=2, p = 2^31−1) y anota si el
validador la detecta y si la falla cambió el resultado (índice o salida final). Además, 300 corridas
honestas con semillas distintas del validador para medir falsos positivos.

  .venv/bin/python -m bench.run            # imprime la tabla y escribe bench/results.json
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import numpy as np

from node.inject import Fault
from node.job import run_job
from node.model import default_model
from validator.verify import audit

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = ["seu", "weight", "multibit"]
LAYERS = [0, 1, 2, 3]
SEEDS = range(25)


def fault_for(kind: str, layer: int, seed: int) -> Fault:
    """Bits elegidos de forma determinista a partir de la semilla (no solo el bit alto)."""
    rng = np.random.default_rng(10_000 + 97 * layer + seed)
    if kind == "weight":
        bits = (int(rng.integers(0, 8)),)
    elif kind == "seu":
        bits = (int(rng.integers(0, 31)),)
    else:
        bits = tuple(int(b) for b in rng.choice(31, size=2, replace=False))
    return Fault(kind, layer, seed, bits)


def _audit(model, res, mask, seed):
    return audit(model, res.traces, mask, input_hash=res.input_hash, model_hash=res.model_hash,
                 output_hash=res.output_hash, merkle_root=res.merkle_root,
                 claimed_index_bps=res.index_bps, rng=np.random.default_rng(seed))


def main() -> None:
    model = default_model()
    d = np.load(ROOT / "sample-data" / "lot14_grid.npz")
    grid, mask = d["grid"], d["lot_mask"]
    honest = run_job(model, grid, mask)

    cells = defaultdict(lambda: {"total": 0, "detected": 0, "effect": 0, "effect_detected": 0, "index_changed": 0})
    for kind in FAMILIES:
        for layer in LAYERS:
            for seed in SEEDS:
                res = run_job(model, grid, mask, fault_for(kind, layer, seed))
                cert = _audit(model, res, mask, seed)
                effect = res.output_hash != honest.output_hash
                c = cells[(kind, layer)]
                c["total"] += 1
                c["detected"] += not cert.passed
                c["effect"] += effect
                c["effect_detected"] += effect and not cert.passed
                c["index_changed"] += res.index_bps != honest.index_bps

    fp = sum(not _audit(model, honest, mask, 50_000 + s).passed for s in range(300))

    names = {"seu": "SEU (1 bit en acumulador)", "weight": "Peso (1 bit en W)", "multibit": "Multi-bit (2 bits × 3 acum.)"}
    layer_names = [l.name.split(" ")[0] for l in model.layers]
    lines = ["| Familia | " + " | ".join(layer_names) + " | Total |", "|---|" + "---|" * (len(LAYERS) + 1)]
    tot = {"total": 0, "detected": 0, "effect": 0, "effect_detected": 0, "index_changed": 0}
    for kind in FAMILIES:
        row, kt, kd = [], 0, 0
        for layer in LAYERS:
            c = cells[(kind, layer)]
            row.append(f"{c['detected']}/{c['total']}")
            kt, kd = kt + c["total"], kd + c["detected"]
            for k in tot:
                tot[k] += c[k]
        lines.append(f"| {names[kind]} | " + " | ".join(row) + f" | **{kd}/{kt}** |")
    table = "\n".join(lines)

    summary = {
        "faults": tot["total"], "detected": tot["detected"],
        "with_effect": tot["effect"], "with_effect_detected": tot["effect_detected"],
        "index_changed": tot["index_changed"],
        "honest_runs": 300, "false_positives": fp,
        "freivalds": {"p": 2**31 - 1, "reps": 2},
        "cells": {f"{k}:L{l + 1}": v for (k, l), v in cells.items()},
    }
    (ROOT / "bench" / "results.json").write_text(json.dumps(summary, indent=2))
    print(table)
    print(f"\nDetectadas: {tot['detected']}/{tot['total']} · con efecto en la salida: {tot['effect']} "
          f"(detectadas {tot['effect_detected']}/{tot['effect']}) · cambian el índice: {tot['index_changed']}")
    print(f"Falsos positivos en 300 corridas honestas: {fp}")


if __name__ == "__main__":
    main()
