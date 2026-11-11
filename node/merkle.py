"""Árbol de Merkle SHA-256 sobre las capas: hoja_i = H(i ‖ H(x_i) ‖ H(C_i) ‖ H(y_i))."""
from __future__ import annotations

import hashlib

from .model import LayerTrace, tensor_hash


def leaf(i: int, t: LayerTrace) -> bytes:
    return hashlib.sha256(
        b"\x00" + i.to_bytes(4, "big") + tensor_hash(t.x) + tensor_hash(t.C) + tensor_hash(t.y)
    ).digest()


def _node(a: bytes, b: bytes) -> bytes:
    return hashlib.sha256(b"\x01" + a + b).digest()


def root(leaves: list[bytes]) -> bytes:
    if not leaves:
        return b"\x00" * 32
    level = list(leaves)
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [_node(level[i], level[i + 1]) for i in range(0, len(level), 2)]
    return level[0]


def proof(leaves: list[bytes], index: int) -> list[tuple[bytes, bool]]:
    """Camino de prueba: lista de (hermano, hermano_a_la_derecha)."""
    out, level, i = [], list(leaves), index
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        sib = i ^ 1
        out.append((level[sib], sib > i))
        level = [_node(level[j], level[j + 1]) for j in range(0, len(level), 2)]
        i //= 2
    return out


def verify_proof(leaf_hash: bytes, path: list[tuple[bytes, bool]], expected_root: bytes) -> bool:
    h = leaf_hash
    for sib, right in path:
        h = _node(h, sib) if right else _node(sib, h)
    return h == expected_root


def traces_root(traces: list[LayerTrace]) -> bytes:
    return root([leaf(i, t) for i, t in enumerate(traces)])
