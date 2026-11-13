"""Publicación de artefactos con dirección por contenido (requestURI / responseURI).

Cada archivo se guarda como <sha256>.<ext> en ARTIFACTS_DIR (por defecto out/artifacts).
La URI es ARTIFACTS_BASE_URL/<sha256>.<ext> si está definida (p. ej. un `python -m http.server`
o un bucket público); si no, puna-artifacts://<sha256>.<ext>, que el validador resuelve contra su
ARTIFACTS_DIR (demo en una sola máquina). Nunca se publica una ruta local on-chain. El fragmento #escrow=…&job=… es solo una pista para el
validador, que igual lo contrasta contra el escrow on-chain.

El nombre ES el hash: quien baja verifica sha256(contenido) == nombre, venga de donde venga.
"""
from __future__ import annotations

import hashlib
import os
import re
import shutil
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
_HEX64 = re.compile(r"^[0-9a-f]{64}$")
LOCAL_SCHEME = "puna-artifacts"  # puna-artifacts://<sha256>.<ext> → ARTIFACTS_DIR/<sha256>.<ext>


def _dir() -> Path:
    d = Path(os.getenv("ARTIFACTS_DIR", ROOT / "out" / "artifacts"))
    d.mkdir(parents=True, exist_ok=True)
    return d


def publish_bytes(data: bytes, ext: str, fragment: dict | None = None) -> str:
    sha = hashlib.sha256(data).hexdigest()
    dest = _dir() / f"{sha}.{ext}"
    if not dest.exists():
        dest.write_bytes(data)
    base = os.getenv("ARTIFACTS_BASE_URL")
    # Sin URL pública, esquema neutro: nunca publicar on-chain rutas locales (exponen usuario y máquina).
    uri = f"{base.rstrip('/')}/{dest.name}" if base else f"{LOCAL_SCHEME}://{dest.name}"
    if fragment:
        uri += "#" + urllib.parse.urlencode(fragment)
    return uri


def publish_file(path: Path, fragment: dict | None = None) -> str:
    return publish_bytes(Path(path).read_bytes(), Path(path).suffix.lstrip("."), fragment)


def fragment(uri: str) -> dict:
    return dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(uri).fragment))


def fetch(uri: str, max_bytes: int = 50_000_000) -> bytes:
    """Baja la URI (file:// o http[s]://) y verifica que el contenido coincida con el hash del nombre."""
    parts = urllib.parse.urlsplit(uri)
    if parts.scheme == LOCAL_SCHEME:
        name = parts.netloc or parts.path.lstrip("/")
        if not _HEX64.match(Path(name).stem) or "/" in name:
            raise ValueError(f"nombre inválido en {uri!r}")
        data = (_dir() / name).read_bytes()
        parts = parts._replace(path="/" + name)
    elif parts.scheme == "file":
        data = Path(urllib.parse.unquote(parts.path)).read_bytes()
    elif parts.scheme in ("http", "https") and _HEX64.match(Path(parts.path).stem) and (_dir() / Path(parts.path).name).exists():
        # copia local con el mismo hash (los túneles son efímeros); igual se verifica el sha256 abajo
        data = (_dir() / Path(parts.path).name).read_bytes()
    elif parts.scheme in ("http", "https"):
        with urllib.request.urlopen(urllib.parse.urlunsplit(parts._replace(fragment="")), timeout=30) as r:
            data = r.read(max_bytes + 1)
    else:
        raise ValueError(f"esquema no soportado: {parts.scheme!r}")
    if len(data) > max_bytes:
        raise ValueError("artefacto demasiado grande")
    stem = Path(parts.path).stem
    if _HEX64.match(stem) and hashlib.sha256(data).hexdigest() != stem:
        raise ValueError("el contenido no coincide con el sha256 del nombre")
    return data


if __name__ == "__main__":
    import sys

    print(publish_file(Path(sys.argv[1])))
