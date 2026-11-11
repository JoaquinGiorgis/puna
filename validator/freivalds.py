"""Freivalds en enteros módulo p = 2^31 − 1.

Comprueba C ≡ A·B (mod p) en O(n·k + k·m + n·m) en vez de O(n·k·m):
    C·r ≡ A·(B·r)  (mod p),  r uniforme en Z_p^m
Si C ≠ A·B, pasa con probabilidad ≤ 1/p por repetición.
Se usa dtype=object (enteros de Python) para que no haya overflow: las matrices de una
CNN chica son pequeñas y la claridad vale más que la velocidad en la demo.
"""
from __future__ import annotations

import secrets

import numpy as np

P = (1 << 31) - 1


def _modp(M: np.ndarray) -> np.ndarray:
    return np.vectorize(lambda v: int(v) % P, otypes=[object])(M)


def freivalds(A: np.ndarray, B: np.ndarray, C: np.ndarray, reps: int = 2, rng=None) -> bool:
    if A.shape[1] != B.shape[0] or C.shape != (A.shape[0], B.shape[1]):
        return False
    Am, Bm, Cm = _modp(A), _modp(B), _modp(C)
    m = B.shape[1]
    for _ in range(reps):
        if rng is None:
            r = np.array([secrets.randbelow(P) for _ in range(m)], dtype=object)
        else:
            r = np.array([int(v) for v in rng.integers(0, P, m)], dtype=object)
        Br = (Bm.dot(r)) % P
        lhs = (Cm.dot(r)) % P
        rhs = (Am.dot(Br)) % P
        if not np.array_equal(lhs, rhs):
            return False
    return True
