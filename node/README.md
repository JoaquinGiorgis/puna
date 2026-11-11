# node — agente nodo

`python -m node.job` corre la CNN entera sobre la grilla del lote y deja:

- `out/job.npz`: los tensores que audita el validador.
- `out/job.json`: un resumen para humanos. **El validador no lo lee.**

## Formato de `job.npz`

| Clave | Forma | Tipo | Qué es |
|---|---|---|---|
| `lot_mask` | (12, 12) | bool | celdas del Lote 14 |
| `x{i}` | (12, 12, Cin) | int8 | entrada de la capa i (`x0` = grilla FIRMS) |
| `C{i}` | (144, Cout) | int64 | acumulador `im2col(x_i) · W_i` (lo que chequea Freivalds) |
| `y{i}` | (12, 12, Cout) | int8 | salida recuantizada de la capa i |

Hay 4 capas, de i = 0 a 3. El índice es `index_bps(y3, lot_mask)`.

## Publicación (`node/publish.py`)

El archivo se guarda como `<sha256>.npz` en `ARTIFACTS_DIR` (por defecto `out/artifacts`). El nombre es el hash del contenido, así que quien lo baja verifica `sha256(contenido) == nombre`.

`requestURI` sale de esa publicación:

- Con `ARTIFACTS_BASE_URL` definida: `<ARTIFACTS_BASE_URL>/<sha256>.npz#escrow=<addr>&job=<id>`.
  Sirve cualquier hosting estático, por ejemplo `python -m http.server -d out/artifacts 8787`.
- Sin ella: `puna-artifacts://<sha256>.npz#escrow=…&job=…`, que el validador resuelve contra su propio `ARTIFACTS_DIR`. Es para la demo en una sola máquina.
- Nunca se publica una ruta local on-chain.

El fragmento `#escrow=…&job=…` es solo una pista. El validador la contrasta contra el escrow.

## Qué hace el validador (`validator/agent.py`)

1. Escucha `ValidationRequest(validatorAddress = él)` en el registro de ERC-8004. Barre de a 100 bloques, que es el límite de la RPC pública de Fuji.
2. Lee `getJob(job)` y exige estas tres condiciones:
   - `job.requestHash == requestHash`
   - `job.validator == él`
   - estado `Submitted`
3. Baja `job.npz` y verifica que el sha256 coincida con el nombre.
4. Audita con su propia copia del modelo contra los compromisos **on-chain** (`inputHash`, `modelHash`, `outputHash`, `merkleRoot`, `indexBps`):
   - Freivalds mod p por capa
   - requant y ReLU
   - encadenado entre capas
   - raíz Merkle
5. Publica el certificado JSON (`responseURI`) y responde con `responseHash = keccak256(certificado)`.

Si los artefactos faltan o están adulterados, responde score 0.
