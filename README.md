# PUNA — Proof of Untampered Neural Answers

> Cuando el satélite que decide si te pagan el seguro pasa por la Anomalía del Atlántico Sur, un bit dado vuelta te puede costar la cosecha: PUNA hace que un tercero audite el cálculo y el contrato pague solo si la cuenta es correcta.

![Mission Control: job 7 en Fuji, rechazo de ORBIT-07 y pago tras reasignar a ORBIT-03](docs/design/mission-control.png)

**Argentina Space Hackathon 2026** · Track Avalanche · Agentes × Geoespacial

## Links

| | |
|---|---|
| Contrato | **PunaEscrow** [`0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982`](https://testnet.snowtrace.io/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) en Avalanche Fuji (43113), verificado |
| Demo on-chain | Job 7: [rechazo](https://testnet.snowtrace.io/tx/0x15914187dcdd71b61d6c8687f1ff9137722878a59faf72b29cd473e888dd089e) → [reasignación](https://testnet.snowtrace.io/tx/0x0994322995664806a636988d6702dd1b524570523069e5edb8bff9b0afe30ee3) → [pago](https://testnet.snowtrace.io/tx/0xba0727e9691b788e74a1e1c7054a6613413d537dd43749fa3442973c814ddd6b). Todas las txs en [`docs/txs.md`](docs/txs.md) |
| Video | [pendiente, #22] |
| Deck | [pendiente de compartir] |
| Diseño | [Figma: Mission Control](https://www.figma.com/design/QX6MGCInnAdtuh6Vch931X) |

## Qué hace

1. **Aseguradora.** Un fondo mutual crea una póliza paramétrica de incendio para el Lote 14 con `PunaEscrow.createJob` y deposita la indemnización y los fees.
2. **Scheduler orbital.** Mide con TLE de CelesTrak + SGP4 cuánto de la ventana pasa cada nodo dentro de la Anomalía (`saaBps`). Asigna según su política: releva al nodo expuesto o difiere la ventana.
3. **Nodo.** Corre una CNN entera (int8) sobre la grilla de focos **NASA FIRMS** reales y publica el índice, `outputHash` y la raíz Merkle de las capas. Después pide validación en **ERC-8004**.
4. **Validador.** Es de otro operador, con proceso y wallet propios. Audita cada capa con **Freivalds módulo 2³¹−1** y el encadenado completo, contra los compromisos on-chain, y responde un score.
5. **Liquidación.** `settle` paga al productor si el score aprueba y el índice supera el disparador. Si se rechaza, no se mueve plata, baja la reputación del nodo y se reasigna.

**Resultados:**
- Índice honesto del Lote 14: **37,8 %**, contra un disparador de 30 %.
- La falla de la demo (1 bit en un peso de L3) da **0 %** y el validador la rechaza con **score 49**.
- Benchmark: **300/300** fallas detectadas y **0/300** falsos positivos ([`bench/README.md`](bench/README.md)).

## Correr

```bash
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/pytest -q                     # 35 tests: modelo entero, Freivalds, Merkle, fallas, órbita, scheduler, validador
cd contracts && forge test              # 13 tests del escrow, incluido el guion de la demo
```

Sin red (datos guardados en `sample-data/`):

```bash
.venv/bin/python -m node.job --out out/job.npz                           # honesto → 3.777 bps
.venv/bin/python -m node.job --out out/bad.npz --fault weight:2:2:7      # falla de la demo → 0 bps
.venv/bin/python -m validator.verify --artifacts out/bad.npz             # score 49: "capa L3 no pasa Freivalds"
.venv/bin/python -m orbit.saa --tle sample-data/tle/orbit07.tle --start 2026-11-12T15:30:00Z --minutes 9
.venv/bin/python -m bench.run                                             # 300 inyecciones
```

En Fuji (copiá `.env.example` a `.env` y cargá las wallets con AVAX de testnet):

```bash
.venv/bin/python scripts/e2e.py --demo       # rechazo → reassign → Paid, ~11 txs
.venv/bin/python scripts/e2e.py              # camino feliz
.venv/bin/python -m validator.agent          # el validador como servicio que escucha ERC-8004
```

Web (Mission Control):

```bash
pnpm --dir web install && pnpm --dir web dev   # http://localhost:3000
```

La web lee datos reales exportados de la cadena. Al abrirse, verifica en vivo contra Fuji que cada transacción exista. Más detalle en [`web/README.md`](web/README.md).

## Real vs simulado

| Real | Simulado (y etiquetado en pantalla) |
|---|---|
| Órbitas de NOAA 20 y 21 (TLE CelesTrak + SGP4) | Que esos satélites sean nodos de cómputo |
| Focos NASA FIRMS del incendio en Anta, Salta | La falla: un bit inyectado por software |
| CNN entera, Freivalds, Merkle | Operadores distintos (wallets y procesos separados en una laptop) |
| PunaEscrow verificado y registros ERC-8004 en Fuji | La radiación: `saaBps` es un proxy de exposición |
| | La vista satelital del lote (la forma del quemado sí es real) |

## ERC-8004 en Fuji

| Registro | Proxy | Estado |
|---|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | ORBIT-07 = agente 300, ORBIT-03 = agente 301 |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | El escrow deja feedback en cada `settle` |
| Validation | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` | Confirmado en H0 (no figura en el README oficial) |

Firmas verificadas contra los ABIs de Routescan: [`docs/erc8004.md`](docs/erc8004.md).

## Estructura

```
contracts/   PunaEscrow.sol, interfaz ERC-8004, mocks, tests y deploy (Foundry)
node/        CNN entera, Merkle por capa, inyección de fallas, publicación de artefactos
validator/   Freivalds mód p, auditoría completa y agente validador (ERC-8004)
orbit/       FIRMS → grilla, saaBps y orbitHash, scheduler orbital
onchain/     web3 + ABIs compartidos por los agentes
scripts/     smoke test ERC-8004, e2e en Fuji, exportadores para la web
web/         Mission Control (Next.js + viem)
bench/       benchmark de inyecciones
docs/        resumen técnico, diseño, ERC-8004, txs, atribución
```

## Límites

- PUNA prueba que el cálculo es correcto, no que la imagen de entrada sea auténtica.
- Hoy el índice se puede calcular en tierra. Cuando nazca en órbita y baje solo el resultado, sin PUNA no hay forma de auditarlo.
- Freivalds es probabilístico: una matriz alterada pasa con probabilidad ≤ 1/p² por capa.
- Somos complementarios a la detección de bit-flips (p. ej. Flipless). Lo que agregamos: verificación por terceros, pago on-chain y ubicación orbital.

Atribución de datos, imágenes y software en [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md).
