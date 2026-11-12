# PUNA — Proof of Untampered Neural Answers

> Cuando la IA corre en órbita, a tierra baja solo la respuesta y el operador se certifica a sí mismo. PUNA hace que un tercero audite el cálculo y que el contrato en Avalanche pague solo si la cuenta cierra.

**El problema.** Los datacenters orbitales (Starcloud, Kepler, Axiom; Google y SpaceX en camino) van a vender cómputo de IA. La radiación da vuelta bits sin avisar, sobre todo en la Anomalía del Atlántico Sur: en Orbview-2 (NASA), más del 80 % de los errores ocurrieron ahí, aunque el satélite pasaba menos del 20 % de la órbita. Quien compra ese cómputo recibe solo el resultado y no tiene cómo comprobarlo antes de pagar.

**El caso de ejemplo.** Un seguro paramétrico de incendio: un índice de área quemada calculado en órbita sobre un incendio real de Anta, Salta, decide si el productor cobra.

![Mission Control: job 7 en Fuji, rechazo de ORBIT-07 y pago tras reasignar a ORBIT-03](docs/design/mission-control.png)

**Argentina Space Hackathon 2026** · Track Avalanche · Agentes × Geoespacial

## Links

| | |
|---|---|
| **Demo en vivo** | **[puna-mission-control.vercel.app](https://puna-mission-control.vercel.app)**: login demo → cartera de la aseguradora con badges de atención según focos NASA FIRMS en vivo → ficha de cada campo. La auditoría on-chain está en [`/mission-control`](https://puna-mission-control.vercel.app/mission-control) |
| Contrato | **PunaEscrow** [`0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982`](https://testnet.snowtrace.io/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) en Avalanche Fuji (43113), código verificado en Snowtrace/Routescan · [explorer de Avalanche](https://explorer-test.avax.network/c-chain/address/0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982) |
| Demo on-chain | Job 7: [rechazo](https://testnet.snowtrace.io/tx/0x15914187dcdd71b61d6c8687f1ff9137722878a59faf72b29cd473e888dd089e) → [reasignación](https://testnet.snowtrace.io/tx/0x0994322995664806a636988d6702dd1b524570523069e5edb8bff9b0afe30ee3) → [pago](https://testnet.snowtrace.io/tx/0xba0727e9691b788e74a1e1c7054a6613413d537dd43749fa3442973c814ddd6b). Todas las txs en [`docs/txs.md`](docs/txs.md) |
| Video | [pendiente, #22] |
| Deck | [pendiente de compartir] |
| Diseño | [Figma: Mission Control](https://www.figma.com/design/QX6MGCInnAdtuh6Vch931X) |
| Modelo de negocio | Cliente ideal, precios, mercado y salida al mercado: [`docs/modelo-de-negocio.md`](docs/modelo-de-negocio.md) |

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

## Por qué blockchain

| Pregunta del track | Respuesta |
|---|---|
| ¿Quién desconfía de quién? | La aseguradora y el productor no confían en el operador del nodo orbital, que es quien calcula el índice y cobra por hacerlo. |
| ¿Qué evento dispara algo on-chain? | El validador de otro operador responde en ERC-8004 Validation; `settle` lee ese score y el índice, y paga o no. |
| ¿Qué pasa si el dato miente? | Si el nodo entrega un índice adulterado, Freivalds lo detecta, el score baja de 80, `settle` deja el job en `Rejected` sin mover la indemnización, la reputación del nodo baja y el trabajo se reasigna. El dato de entrada (FIRMS) queda fijado por `inputHash`. |
| ¿Quién paga o cobra, y cuánto? | La aseguradora deposita indemnización + fees. El productor cobra la indemnización (0,015 AVAX en la demo), el nodo cobra el fee de cómputo solo si pasa la auditoría y el validador cobra por cada intento auditado. |

Sin la cadena, el pago dependería de la palabra del operador o de una base de datos de la aseguradora. Con ella, las reglas, el depósito y la reputación son públicos y nadie las cambia a mitad del siniestro.

## Correr

```bash
python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"
.venv/bin/pytest -q                     # 35 tests: modelo entero, Freivalds, Merkle, fallas, órbita, scheduler, validador
cd contracts && forge test              # 16 tests del escrow: guion de la demo y límites conocidos
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
.venv/bin/python scripts/e2e.py --demo --capa 3 --bit 7   # el jurado elige capa y bit (guía: docs/demo-jurado.md)
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

Firmas verificadas contra los ABIs de Routescan: [`docs/erc8004.md`](docs/erc8004.md). Revisión técnica de todo lo de Avalanche (contrato, scripts, web) y límites conocidos: [`docs/revision-avalanche.md`](docs/revision-avalanche.md).

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
- La CNN es un modelo de juguete con pesos fijos, no entrenada. Freivalds verifica el producto de matrices sea cual sea el modelo.
- En la demo, el bit-flip lo inyectamos por software y la asignación de ORBIT-07 a la Anomalía es forzada (la política del scheduler elegía ORBIT-03).
- Somos complementarios a la detección dentro del nodo (p. ej. Flipless). Lo que agregamos: verificación por un tercero, pago on-chain y ubicación orbital.

Atribución de datos, imágenes y software en [`docs/ATTRIBUTION.md`](docs/ATTRIBUTION.md).
