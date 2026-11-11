"""Agente nodo: corre el modelo sobre la grilla del lote y arma lo que publica on-chain.

  python -m node.job --grid sample-data/lot14_grid.npz --out out/job.npz [--fault weight:2:2:7]
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


def save_artifacts(res: JobResult, lot_mask: np.ndarray, path: Path, fault: Fault | None = None) -> None:
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
        # registro de la inyección (simulada) para reproducirla: tipo, capa, semilla y bits
        "fault": fault.describe() if fault else None,
    }
    path.with_suffix(".json").write_text(json.dumps(meta, indent=2))


def _parse_fault(s: str | None) -> Fault | None:
    if not s:
        return None
    parts = s.split(":")
    if len(parts) not in (3, 4):
        raise SystemExit(f"--fault inválido: {s!r} (kind:layer:seed[:bit,bit…])")
    kind, layer, seed = parts[0], int(parts[1]), int(parts[2])
    if len(parts) == 4:
        return Fault(kind, layer, seed, tuple(int(b) for b in parts[3].split(",")))
    return Fault(kind, layer, seed)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid", default="sample-data/lot14_grid.npz")
    ap.add_argument("--out", default="out/job.npz")
    ap.add_argument("--fault", help="kind:layer:seed[:bits], ej. seu:1:7 o weight:2:2:7 (falla de la demo)")
    a = ap.parse_args()
    d = np.load(a.grid)
    fault = _parse_fault(a.fault)
    res = run_job(default_model(), d["grid"], d["lot_mask"], fault)
    save_artifacts(res, d["lot_mask"], Path(a.out), fault)
    print(json.dumps({"indexBps": res.index_bps, "merkleRoot": "0x" + res.merkle_root.hex(),
                      "fault": fault.describe() if fault else None}))


if __name__ == "__main__":
    main()
