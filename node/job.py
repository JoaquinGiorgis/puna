"""Agente nodo: corre el modelo sobre la grilla del lote y arma lo que publica on-chain.

  python -m node.job --grid sample-data/lot14_grid.npz --out out/job.npz [--fault seu:2:7]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from .inject import Fault, make_fault_fn
from .merkle import traces_root
from .model import JobResult, Model, default_model, forward, index_bps, tensor_hash


def run_job(model: Model, grid: np.ndarray, lot_mask: np.ndarray, fault: Fault | None = None) -> JobResult:
    traces = forward(model, grid, make_fault_fn(fault) if fault else None)
    final = traces[-1].y
    return JobResult(
        index_bps=index_bps(final, lot_mask),
        input_hash=tensor_hash(grid),
        model_hash=model.model_hash(),
        output_hash=tensor_hash(final),
        merkle_root=traces_root(traces),
        traces=traces,
    )


def save_artifacts(res: JobResult, lot_mask: np.ndarray, path: Path) -> None:
    """Lo que el validador baja (en la demo, archivo local; en prod, IPFS/HTTP con requestURI)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    arrays = {"lot_mask": lot_mask}
    for i, t in enumerate(res.traces):
        arrays[f"x{i}"], arrays[f"C{i}"], arrays[f"y{i}"] = t.x, t.C, t.y
    np.savez_compressed(path, **arrays)
    meta = {
        "indexBps": res.index_bps,
        "inputHash": "0x" + res.input_hash.hex(),
        "modelHash": "0x" + res.model_hash.hex(),
        "outputHash": "0x" + res.output_hash.hex(),
        "merkleRoot": "0x" + res.merkle_root.hex(),
        "layers": [t.name for t in res.traces],
    }
    path.with_suffix(".json").write_text(json.dumps(meta, indent=2))


def _parse_fault(s: str | None) -> Fault | None:
    if not s:
        return None
    kind, layer, seed = s.split(":")
    return Fault(kind, int(layer), int(seed))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid", default="sample-data/lot14_grid.npz")
    ap.add_argument("--out", default="out/job.npz")
    ap.add_argument("--fault", help="kind:layer:seed, ej. seu:1:7")
    a = ap.parse_args()
    d = np.load(a.grid)
    res = run_job(default_model(), d["grid"], d["lot_mask"], _parse_fault(a.fault))
    save_artifacts(res, d["lot_mask"], Path(a.out))
    print(json.dumps({"indexBps": res.index_bps, "merkleRoot": "0x" + res.merkle_root.hex()}))


if __name__ == "__main__":
    main()
