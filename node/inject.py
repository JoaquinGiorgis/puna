"""Inyección de fallas reproducible, dentro de la operación verificada.

Tres familias (ver docs/resumen-tecnico.md):
  - seu: un bit dado vuelta en un acumulador de una capa (transitorio)
  - weight: un peso corrupto persistente (afecta la capa entera)
  - multibit: varios bits en varios acumuladores
Cada falla devuelve su descripción (semilla, capa, bit, tipo) para el benchmark.
"""
from __future__ import annotations

from dataclasses import dataclass, replace

import numpy as np

from .model import ConvLayer, LayerTrace, im2col, requant


@dataclass(frozen=True)
class Fault:
    kind: str  # "seu" | "weight" | "multibit"
    layer: int
    seed: int
    bits: tuple[int, ...] = (30,)

    def describe(self) -> dict:
        return {"kind": self.kind, "layer": self.layer, "seed": self.seed, "bits": list(self.bits)}


def _flip(v: np.int64, bit: int) -> np.int64:
    # el acumulador vive en un registro de 32 bits en el hardware simulado
    u = int(v) & 0xFFFFFFFF
    u ^= 1 << bit
    return np.int64(u - (1 << 32) if u & 0x80000000 else u)


def make_fault_fn(f: Fault):
    rng = np.random.default_rng(f.seed)

    def fn(i: int, t: LayerTrace, layer: ConvLayer) -> LayerTrace:
        if i != f.layer:
            return t
        H, W, _ = t.x.shape
        C = t.C.copy()
        if f.kind == "seu":
            r, c = rng.integers(C.shape[0]), rng.integers(C.shape[1])
            C[r, c] = _flip(C[r, c], f.bits[0])
        elif f.kind == "multibit":
            for _ in range(3):
                r, c = rng.integers(C.shape[0]), rng.integers(C.shape[1])
                for b in f.bits:
                    C[r, c] = _flip(C[r, c], b)
        elif f.kind == "weight":
            w = layer.W.copy()
            r, c = rng.integers(w.shape[0]), rng.integers(w.shape[1])
            w[r, c] = np.int64(np.int8(np.uint8(np.int8(w[r, c]).view(np.uint8) ^ (1 << (f.bits[0] % 8))).view(np.int8)))
            C = im2col(t.x, layer.k) @ w
        else:
            raise ValueError(f.kind)
        return replace(t, C=C, y=requant(C, layer, H, W))

    return fn
