# PUNA — contexto para Claude Code

**PUNA (Proof of Untampered Neural Answers):** seguro paramétrico de incendio para lotes agrícolas del NOA (caña, tabaco, vid).
- Un nodo de cómputo orbital calcula la fracción quemada del lote con una CNN entera.
- Un validador de **otro operador** la audita con Freivalds módulo p = 2³¹−1.
- `PunaEscrow` en **Avalanche Fuji (chain 43113)** paga la indemnización solo si la auditoría aprueba y el índice supera el disparador.

Los data centers orbitales son el protagonista; el seguro es el primer caso de uso.

- **Hackatón:** Argentina Space Hackathon 2026 (Salta, 11–13 nov). Track Avalanche, categoría Agentes × Geoespacial.
- **Entrega:** viernes 13/11, antes de las 09:00 ART (objetivo 07:30).

## Fuente de verdad
- `docs/resumen-tecnico.md`: su sección **"Resumen técnico final"** manda sobre todo lo demás.
- `docs/design.md` + Figma `https://www.figma.com/design/QX6MGCInnAdtuh6Vch931X`: la UI. Light mode liquid glass; el globo es un visor oscuro.
- Backlog: GitHub Issues, con milestones H0…H5 (ver plan en el doc técnico).

## Estructura
```
contracts/   Foundry: PunaEscrow.sol, interfaces ERC-8004, mocks, tests, deploy
node/        agente nodo: CNN int8 (model.py), Merkle por capa, inyección de fallas, job.py (CLI)
validator/   agente validador: freivalds.py (mod p), verify.py (encadenado completo + certificado)
orbit/       firms.py (NASA FIRMS → grilla 12×12), saa.py (TLE + sgp4 → saaBps)
web/         Next.js (por armar): globo 3D + póliza + auditoría + timeline. Renders en web/public/renders
scripts/     on-chain e2e (por armar), create_issues.py
sample-data/ grillas y respuestas guardadas (FIRMS, TLE) para correr sin red
bench/       benchmark de inyecciones
docs/        resumen técnico, diseño, erc8004, txs.md (hashes de respaldo), ATTRIBUTION.md
```

## Comandos
```bash
# contratos
cd contracts && forge test -vv
forge script script/Deploy.s.sol --rpc-url fuji --broadcast --verify   # requiere .env

# python (desde la raíz)
pip install -e ".[dev]"
python -m orbit.firms grid --csv sample-data/firms_anta.csv --bbox -62.9370,-25.0760,-62.9020,-25.0410 --out sample-data/lot14_grid.npz  # FIRMS real
python -m node.job --out out/job.npz                         # honesto → ~37,8 %
python -m node.job --out out/bad.npz --fault weight:2:2:7    # falla de la demo → 0 %
python -m validator.verify --artifacts out/bad.npz           # score < 50 → rechazo
pytest -q
```

## Reglas
- **Secretos solo en `.env`** (está en .gitignore): claves privadas, FIRMS_MAP_KEY, RPC. Nunca en el repo; es regla del track.
- **ERC-8004 es borrador.** Antes de depender de una firma, verificala contra el contrato desplegado en Fuji. Gotchas en `docs/erc8004.md`.
  - Solo el dueño del agente llama a `validationRequest`. Solo el validador nombrado responde.
  - `requestHash` es único global.
  - Reputation revierte si el dueño se autocalifica.
  - Plan B si Validation no responde: EIP-712 + ecrecover en el escrow.
- **Todo entero en el modelo.** Nada de float en lo que se verifica. Si cambiás el modelo, recalibrá: el test `test_honest_index_is_about_37_percent` lo cuida.
- **Simulado vs real va etiquetado** en UI y pitch.
  - Simulado: satélites, operadores, radiación.
  - Real: órbitas (TLE), focos FIRMS, verificación y transacciones.
- **Copy en español rioplatense, sentence case.** El estado nunca se comunica solo con color (ícono + etiqueta). Texto ≥ 11 px y contraste AA.
- Commits chicos, por issue (`feat(contracts): … (#12)`).
- **Nunca se recortan:** contrato desplegado, rechazo sin pago y FIRMS real.

## Números de la demo (mantener sincronizados con la UI)
- **PunaEscrow congelado en Fuji:** `0xBcA4312A49CD8CED7aC61fd630F114E0DD2CF982`. Demo completa: `.venv/bin/python scripts/e2e.py --demo`.
- Grilla 12×12, lote de 135 celdas. Índice honesto: 3.777 bps (37,8 %). Disparador: 3.000 bps.
- Órbitas: ORBIT-07 = NOAA 20 (en la Anomalía, saaBps 10.000) y ORBIT-03 = NOAA 21 (fuera, 0), ventana 2026-11-12T15:30Z de 9 min. Como el escrow rechaza si saaBps > maxSaaBps, el job de la demo necesita maxSaaBps = 10.000 para asignar ORBIT-07.
- Lote 14 = incendio **real** de FIRMS en Anta, Salta (-25,06; -62,92), 8–11/11/2026. Zona de soja y poroto, no de caña: el copy del lote tiene que decirlo.
- Falla de la demo: `Fault("weight", layer=2, seed=2, bits=(7,))` → índice 0 → score < 50 → `Rejected` → `reassign` → `Paid`.
- La UI de Figma todavía dice 37,4 %: actualizar al número real (issue).
