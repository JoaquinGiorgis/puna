"""CNN chica cuantizada a enteros que clasifica cada celda del lote como quemada o no.

Toda la aritmética es entera para que el validador pueda verificar cada capa con
Freivalds módulo un primo sin margen de redondeo (ver validator/freivalds.py).

Cada convolución se expresa como C = A · W con im2col:
  A: (H*W, k*k*Cin) parches int8 de la entrada
  W: (k*k*Cin, Cout) pesos int8
  C: (H*W, Cout) acumuladores int64 (lo que se verifica con Freivalds)
Luego: requant (C + bias) * mult >> shift, clip a int8, ReLU opcional.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field

import numpy as np

INT8_MIN, INT8_MAX = -128, 127


@dataclass(frozen=True)
class ConvLayer:
    name: str
    k: int  # tamaño del kernel (impar)
    weights: np.ndarray  # (k, k, Cin, Cout) int8
    bias: np.ndarray  # (Cout,) int32
    mult: int  # multiplicador de recuantización
    shift: int  # desplazamiento de recuantización
    relu: bool = True

    @property
    def W(self) -> np.ndarray:
        k, _, cin, cout = self.weights.shape
        return self.weights.reshape(k * k * cin, cout).astype(np.int64)


@dataclass
class LayerTrace:
    """Lo que el nodo compromete por capa (hoja del árbol de Merkle)."""

    name: str
    x: np.ndarray  # entrada int8 (H, W, Cin)
    C: np.ndarray  # acumuladores int64 (H*W, Cout)
    y: np.ndarray  # salida int8 (H, W, Cout)


@dataclass
class Model:
    layers: list[ConvLayer]
    version: str = "puna-burn-cnn-int8-v1"

    def model_hash(self) -> bytes:
        h = hashlib.sha256(self.version.encode())
        for l in self.layers:
            h.update(l.name.encode())
            h.update(np.ascontiguousarray(l.weights, dtype=np.int8).tobytes())
            h.update(np.ascontiguousarray(l.bias, dtype=np.int32).tobytes())
            h.update(int(l.mult).to_bytes(8, "big", signed=True))
            h.update(int(l.shift).to_bytes(1, "big"))
            h.update(b"\x01" if l.relu else b"\x00")
        return h.digest()


def im2col(x: np.ndarray, k: int) -> np.ndarray:
    """(H, W, C) int8 → (H*W, k*k*C) int64 con padding cero ('same')."""
    H, W, C = x.shape
    p = k // 2
    xp = np.pad(x.astype(np.int64), ((p, p), (p, p), (0, 0)))
    cols = np.empty((H * W, k * k * C), dtype=np.int64)
    idx = 0
    for i in range(H):
        for j in range(W):
            cols[idx] = xp[i : i + k, j : j + k, :].reshape(-1)
            idx += 1
    return cols


def requant(C: np.ndarray, layer: ConvLayer, H: int, W: int) -> np.ndarray:
    acc = (C + layer.bias.astype(np.int64)[None, :]) * layer.mult
    acc = acc >> layer.shift  # shift aritmético (piso), determinista
    acc = np.clip(acc, INT8_MIN, INT8_MAX)
    if layer.relu:
        acc = np.maximum(acc, 0)
    return acc.astype(np.int8).reshape(H, W, -1)


def forward_layer(layer: ConvLayer, x: np.ndarray) -> LayerTrace:
    H, W, _ = x.shape
    C = im2col(x, layer.k) @ layer.W
    return LayerTrace(layer.name, x, C, requant(C, layer, H, W))


def forward(model: Model, x: np.ndarray, fault=None) -> list[LayerTrace]:
    """Corre el modelo. `fault(i, trace) -> trace` permite inyectar fallas (node/inject.py)."""
    traces: list[LayerTrace] = []
    cur = x
    for i, layer in enumerate(model.layers):
        t = forward_layer(layer, cur)
        if fault is not None:
            t = fault(i, t, layer)
        traces.append(t)
        cur = t.y
    return traces


def burned_mask(final_y: np.ndarray) -> np.ndarray:
    return final_y[..., 0] > 0


def index_bps(final_y: np.ndarray, lot_mask: np.ndarray) -> int:
    """Fracción quemada del lote en puntos básicos (0-10.000), redondeo hacia abajo."""
    burned = burned_mask(final_y) & lot_mask
    total = int(lot_mask.sum())
    return 0 if total == 0 else int(burned.sum()) * 10_000 // total


def default_model() -> Model:
    """Modelo determinista hecho a mano: suaviza el calor de los focos y umbraliza.

    Canal 0 de la entrada: intensidad FRP/brillo de FIRMS rasterizada (0-127).
    Canal 1: cantidad de detecciones en la celda (0-127).
    """
    # capa 1: 3x3, 2 → 4 canales (vecindario de calor y de detecciones)
    w1 = np.zeros((3, 3, 2, 4), dtype=np.int8)
    w1[:, :, 0, 0] = 2
    w1[1, 1, 0, 0] = 4
    w1[:, :, 1, 1] = 3
    w1[:, :, 0, 2] = [[1, 1, 1], [1, 2, 1], [1, 1, 1]]
    w1[:, :, 1, 2] = 1
    w1[1, 1, 0, 3] = 6
    l1 = ConvLayer("L1 conv 3x3·4", 3, w1, np.zeros(4, np.int32), mult=1, shift=4)

    # capa 2: 3x3, 4 → 4 (difusión del frente de fuego)
    w2 = np.zeros((3, 3, 4, 4), dtype=np.int8)
    for c in range(4):
        w2[:, :, c, c] = 1
        w2[1, 1, c, c] = 2
    w2[:, :, 0, 3] = 1
    l2 = ConvLayer("L2 conv 3x3·4", 3, w2, np.zeros(4, np.int32), mult=1, shift=4)

    # capa 3: 1x1, 4 → 2 (mezcla de evidencia)
    w3 = np.array([[[[3, 1], [2, 1], [2, 2], [3, 1]]]], dtype=np.int8)
    l3 = ConvLayer("L3 conv 1x1·2", 1, w3, np.zeros(2, np.int32), mult=1, shift=2)

    # capa 4: 1x1, 2 → 1 logit (umbral vía bias, sin ReLU)
    w4 = np.array([[[[4], [1]]]], dtype=np.int8)
    l4 = ConvLayer("L4 lineal → celda", 1, w4, np.array([-110], np.int32), mult=1, shift=2, relu=False)
    return Model([l1, l2, l3, l4])


@dataclass
class JobResult:
    index_bps: int
    input_hash: bytes
    model_hash: bytes
    output_hash: bytes
    merkle_root: bytes
    traces: list[LayerTrace] = field(repr=False)


def tensor_hash(t: np.ndarray) -> bytes:
    h = hashlib.sha256()
    h.update(str(t.shape).encode())
    h.update(str(t.dtype).encode())
    h.update(np.ascontiguousarray(t).tobytes())
    return h.digest()
