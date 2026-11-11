"""Agente validador (otro operador): audita el job completo y produce el certificado.

Chequeos (todos deben pasar para score 100):
  1. inputHash   : H(x0) coincide con lo comprometido on-chain
  2. modelHash   : los pesos que usa el validador (propios) coinciden con modelHash
  3. por capa    : Freivalds C ≡ im2col(x_i)·W_i (mod p), recalculado por el validador
  4. por capa    : y_i = requant(C_i) (ReLU y clip recalculados)
  5. encadenado  : x_{i+1} = y_i
  6. outputHash  : H(y_last) y el índice recalculado coinciden
  7. merkleRoot  : la raíz recalculada coincide
Score = 100 · chequeos aprobados / chequeos totales (entero).

  python -m validator.verify --artifacts out/job.npz
"""
from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

from node.merkle import traces_root
from node.model import LayerTrace, Model, default_model, im2col, index_bps, requant, tensor_hash

from .freivalds import freivalds


_WHY = {
    "Freivalds": "el acumulador C no es im2col(x)·W mod p con los pesos comprometidos",
    "requant/ReLU": "la salida no es la recuantización del acumulador",
    "in[i+1]=out[i]": "la entrada de la capa siguiente no es la salida de esta",
    "inputHash": "la grilla de entrada no es la comprometida",
    "modelHash": "los pesos no son los del modelo comprometido",
    "outputHash": "la salida final no es la comprometida",
    "indexBps": "el índice declarado no sale de la salida final",
    "merkleRoot": "la raíz Merkle de las capas no coincide",
    "artifacts": "no se pudieron bajar o verificar los artefactos",
}


@dataclass
class Check:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class Certificate:
    score: int
    checks: list[Check] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(c.ok for c in self.checks)

    @property
    def summary(self) -> str:
        """Una línea para humanos: qué capa falla y qué chequeo."""
        bad = [c for c in self.checks if not c.ok]
        if not bad:
            return f"Aprobado ({len(self.checks)} chequeos): el cálculo corresponde al modelo y a la entrada comprometidos."
        first = bad[0]
        layer, _, check = first.name.partition(": ")
        why = _WHY.get(check or layer, "no coincide con lo comprometido on-chain")
        where = f"capa {layer}" if check else layer
        extra = f" (+{len(bad) - 1} chequeo(s) más)" if len(bad) > 1 else ""
        return f"Rechazado: {where} no pasa {check or 'el chequeo'}: {why}{extra}."

    def to_json(self) -> str:
        return json.dumps(
            {"score": self.score, "summary": self.summary, "checks": [c.__dict__ for c in self.checks]},
            ensure_ascii=False, indent=2,
        )

    def hash(self) -> bytes:
        return hashlib.sha256(self.to_json().encode()).digest()


def audit(
    model: Model,
    traces: list[LayerTrace],
    lot_mask: np.ndarray,
    *,
    input_hash: bytes,
    model_hash: bytes,
    output_hash: bytes,
    merkle_root: bytes,
    claimed_index_bps: int,
    reps: int = 2,
    rng=None,
) -> Certificate:
    checks: list[Check] = []
    checks.append(Check("inputHash", tensor_hash(traces[0].x) == input_hash))
    checks.append(Check("modelHash", model.model_hash() == model_hash))
    for i, (layer, t) in enumerate(zip(model.layers, traces)):
        H, W, _ = t.x.shape
        A = im2col(t.x, layer.k)
        ok_f = freivalds(A, layer.W, t.C, reps=reps, rng=rng)
        checks.append(Check(f"{layer.name}: Freivalds", ok_f, f"p=2^31-1, reps={reps}"))
        checks.append(Check(f"{layer.name}: requant/ReLU", np.array_equal(requant(t.C, layer, H, W), t.y)))
        if i + 1 < len(traces):
            checks.append(Check(f"{layer.name}: in[i+1]=out[i]", np.array_equal(traces[i + 1].x, t.y)))
    final = traces[-1].y
    checks.append(Check("outputHash", tensor_hash(final) == output_hash))
    checks.append(Check("indexBps", index_bps(final, lot_mask) == claimed_index_bps))
    checks.append(Check("merkleRoot", traces_root(traces) == merkle_root))
    score = 100 * sum(c.ok for c in checks) // len(checks)
    # cualquier falla de integridad deja el score por debajo de cualquier minScore razonable
    if not all(c.ok for c in checks):
        score = min(score, 49)
    return Certificate(score, checks)


def load_traces(path: Path, model: Model) -> tuple[list[LayerTrace], np.ndarray]:
    d = np.load(path)
    traces = [
        LayerTrace(l.name, d[f"x{i}"], d[f"C{i}"], d[f"y{i}"]) for i, l in enumerate(model.layers)
    ]
    return traces, d["lot_mask"]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--artifacts", default="out/job.npz")
    a = ap.parse_args()
    p = Path(a.artifacts)
    meta = json.loads(p.with_suffix(".json").read_text())
    model = default_model()
    traces, lot_mask = load_traces(p, model)
    h = lambda s: bytes.fromhex(s[2:])
    cert = audit(
        model, traces, lot_mask,
        input_hash=h(meta["inputHash"]), model_hash=h(meta["modelHash"]),
        output_hash=h(meta["outputHash"]), merkle_root=h(meta["merkleRoot"]),
        claimed_index_bps=meta["indexBps"],
    )
    print(cert.to_json())
    print("responseHash: 0x" + cert.hash().hex())


if __name__ == "__main__":
    main()
