"""Benchmark de escala: verificar con Freivalds contra recalcular el producto, con matrices n×n.

Responde a "¿por qué el validador no recalcula todo?": en la demo la grilla es 12×12 y recalcular
es trivial; con capas de tamaño real, verificar es O(n²) y recalcular O(n³).

- Matrices int8 (como los pesos y activaciones del modelo); acumulación exacta en int64.
- Freivalds exacto módulo p = 2³¹−1 con 2 repeticiones. Para que nada desborde int64, el vector r
  (< 2³¹) se parte en dos mitades de 16 bits y se reduce mod p entre pasos.
- Recalcular, dos versiones:
    · exacto en enteros (lo que haría un auditor de un modelo entero; numpy int64, sin BLAS)
    · float32 con BLAS (cota optimista: lo más rápido posible, pero NO exacto bit a bit)
- Cada medición se repite y se toma el mínimo. Antes se comprueba que Freivalds acepte el C honesto
  y rechace un C con una sola entrada alterada.

  .venv/bin/python -m bench.scale            # imprime la tabla y escribe bench/scale.json
"""
from __future__ import annotations

import json
import platform
import time
from pathlib import Path

import numpy as np

P = (1 << 31) - 1
MASK = (1 << 16) - 1
ROOT = Path(__file__).resolve().parents[1]


def _mv_modp(M: np.ndarray, v: np.ndarray) -> np.ndarray:
    """(M · v) mod p sin overflow: M con entradas < 2³¹ en módulo, v < 2³¹ partido en 16 bits."""
    lo = (M @ (v & MASK)) % P
    hi = (M @ (v >> 16)) % P
    return (hi * (1 << 16) + lo) % P


def freivalds_fast(A: np.ndarray, B: np.ndarray, C: np.ndarray, reps: int = 2, rng=None) -> bool:
    rng = rng or np.random.default_rng()
    Cm = C % P  # C entra reducido: sus entradas pueden ser grandes
    for _ in range(reps):
        r = rng.integers(0, P, B.shape[1], dtype=np.int64)
        Br = _mv_modp(B, r)
        if not np.array_equal(_mv_modp(Cm, r), _mv_modp(A, Br)):
            return False
    return True


def best(fn, reps: int) -> float:
    t = float("inf")
    for _ in range(reps):
        s = time.perf_counter()
        fn()
        t = min(t, time.perf_counter() - s)
    return t


def main() -> None:
    rng = np.random.default_rng(7)
    rows = []
    for n in (256, 512, 1024, 2048):
        A = rng.integers(-127, 128, (n, n), dtype=np.int64)
        B = rng.integers(-127, 128, (n, n), dtype=np.int64)
        C = A @ B
        bad = C.copy()
        bad[n // 3, n // 5] += 1
        assert freivalds_fast(A, B, C, rng=rng) and not freivalds_fast(A, B, bad, rng=rng)

        reps = 5 if n <= 1024 else 2
        t_ver = best(lambda: freivalds_fast(A, B, C, rng=rng), 7)
        t_int = best(lambda: A @ B, 1 if n >= 2048 else reps)
        Af, Bf = A.astype(np.float32), B.astype(np.float32)
        t_flt = best(lambda: Af @ Bf, reps)
        rows.append({"n": n, "verify_s": t_ver, "recompute_int_s": t_int, "recompute_f32_blas_s": t_flt,
                     "x_vs_int": t_int / t_ver, "x_vs_f32": t_flt / t_ver})
        print(f"n={n:5d}  verificar {t_ver * 1e3:9.2f} ms · recalcular entero {t_int * 1e3:10.1f} ms "
              f"({t_int / t_ver:7.0f}×) · float32 BLAS {t_flt * 1e3:8.2f} ms ({t_flt / t_ver:5.1f}×)", flush=True)

    out = {"machine": f"{platform.machine()} {platform.system()}", "reps_freivalds": 2, "p": P, "rows": rows}
    (ROOT / "bench" / "scale.json").write_text(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
