# Plan: menos simulado para el video de la demo (12/11, noche)

Objetivo: que el video muestre en vivo todo lo que hoy se puede hacer real, y dejar etiquetado lo único que no se puede: el cómputo a bordo de un satélite.

## Qué pide el track

Fuentes: avalanche-track.vercel.app (`/`, `/guia`, `/blockchain`) y el reglamento de competencia.argentinaspace.com. No hay un PDF de reglas: el material es HTML.

- **Validez:** contrato desplegado, una acción on-chain demostrable y **datos reales**.
- **Simulado:** no está prohibido. El propio track lo acepta en RWA ("activos simulados, datos reales"). Lo que cuenta es que el dato y la transacción sean reales.
- **Video:** de 1 a 3 min, en 1080p y sin notificaciones. Tiene que mostrar:
  - el problema;
  - el dato real entrando;
  - una tx en el explorer;
  - las 4 preguntas de "por qué blockchain" en una pantalla.
  - Conviene tener una tx confirmada de respaldo.
- **Presentación:** se evalúa con atribución de las fuentes.

## Inventario

| Pieza | Hoy | Después de este plan |
|---|---|---|
| Focos de incendio (FIRMS) | Real, leído de un CSV guardado | **Real y en vivo**: se baja de la API durante el video. El CSV queda de respaldo |
| Órbitas (TLE) | Real, TLE bajado el 11/11 | **Real y en vivo**: se baja de CelesTrak antes de correr |
| Exposición a la Anomalía (saaBps) | Real, calculada con SGP4 | Igual |
| Radiación / falla | Inyectada con semilla fija | **Exposición real** (saaBps + flujo de protones de NOAA SWPC GOES). La falla en sí sigue inyectada, y la capa y el bit los elige el jurado |
| Operadores (nodo y validador) | Wallets e identidades ERC-8004 distintas, en la misma máquina | **Dos máquinas reales**: el validador corre en otra compu o VM y baja los tensores por HTTP |
| Artefactos del job | Archivo local | **Servidos por HTTP público** (`ARTIFACTS_BASE_URL`), con sha256 en el nombre |
| Freivalds, contrato y txs | Real, en Fuji | Igual |
| Cómputo a bordo del satélite | Simulado | **Sigue simulado y etiquetado**: requiere un hosted payload |
| Aseguradora, productores y cartera | Simulados (salvo el Lote 14) | Siguen simulados. En el video se muestra solo el Lote 14 |

## Pasos, en orden de valor/riesgo

### 1. FIRMS y TLE en vivo (≈1 h, riesgo bajo)

- En `scripts/e2e.py`, agregar `--live`:
  - baja FIRMS con `FIRMS_MAP_KEY` para el bbox y las fechas del Lote 14;
  - rearma la grilla con `orbit.firms grid`;
  - baja los TLE de CelesTrak GP (NORAD 43013 y 54234).
- **Guarda:** comparar el `inputHash` de la grilla en vivo con el de `sample-data/lot14_grid.npz`.
  - Si coincide, se usa la grilla en vivo y el índice sigue siendo 3.777 bps.
  - Si no coincide (FIRMS NRT puede reprocesar datos), el script avisa y usa la guardada. Así se evita romper `demo.json`, el Figma y el test de 37,8 %.
- Imprimir en pantalla: "FIRMS en vivo · N focos · inputHash 0x… = guardado ✓".

### 2. Validador en otra máquina (≈1–1,5 h, riesgo medio)

- Publicar los artefactos en una URL pública y setear `ARTIFACTS_BASE_URL`. Opciones: Vercel Blob, un bucket o `web/public/artifacts` deployado.
- Correr `python -m validator.agent` en la segunda máquina. Solo necesita `VALIDATOR_PK`, `FUJI_RPC_URL` y el repo.
- En el video, pantalla partida con la terminal del nodo y la terminal del validador, idealmente con otro hostname o usuario visible.
- **Plan B:** si la segunda máquina falla, se vuelve al proceso aparte local. Ya funciona hoy.

### 3. Radiación anclada a datos reales (≈45 min, riesgo bajo)

- Nuevo `orbit/radiation.py`:
  - baja `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json` (sin clave);
  - informa el flujo ≥10 MeV de la ventana.
- El scheduler muestra "ORBIT-07 en la Anomalía (saaBps 10.000) · flujo GOES X pfu → riesgo de SEU alto".
- Etiqueta en terminal y UI: "exposición real · falla inyectada".
- Guardar la respuesta en `sample-data/goes_protons.json` y agregar NOAA SWPC a `docs/ATTRIBUTION.md`.

### 4. Ventana de ejecución (opcional, riesgo alto: no recomendado esta noche)

Calcular la ventana a partir de "ahora", en lugar de dejar 15:30Z fija, cambiaría saaBps y obligaría a regenerar `demo.json` y el Figma. Queda fija y se explica: "ventana programada del job".

### 5. Etiquetas y copy (≈30 min)

- En `TopBar`, `mission-control`, la landing y la slide de real vs simulado, actualizar a: "Simulado: cómputo a bordo, aseguradora y cartera · Real: FIRMS, órbitas, radiación GOES, Freivalds, operadores separados, txs".
- Actualizar `CLAUDE.md` (sección Reglas) y `docs/demo-jurado.md`.

### 6. Grabar (≈1 h)

1. Ensayo completo con `--live` y guardado de las tx en `docs/txs.md`. Ese ensayo es el respaldo.
2. Toma final en 1080p, con No Molestar activado.

## Guion del video (≈2:30)

| Tiempo | Pantalla | Qué es real |
|---|---|---|
| 0:00–0:20 | Problema: incendio en Anta y los data centers orbitales que "se autocertifican" | Imagen y focos FIRMS |
| 0:20–0:45 | `e2e.py --demo --live`: FIRMS y TLE bajando, grilla, saaBps y flujo GOES | Datos en vivo |
| 0:45–1:25 | ORBIT-07 en la Anomalía con falla, validador en otra máquina, score 49, `Rejected` en Snowtrace | Tx real |
| 1:25–1:55 | `reassign` a ORBIT-03, score 100, `Paid`, el productor cobra, tx en el explorer | Tx real |
| 1:55–2:20 | Las 4 preguntas de por qué blockchain, en una pantalla | |
| 2:20–2:30 | Real vs simulado, atribución y dirección del contrato | |

## Lo que no se toca

- El contrato congelado `0xBcA4…F982`.
- El modelo y sus pesos.
- Los números de la demo (3.777 bps, disparador 3.000, scores 49 y 100). Si el paso 1 detecta un cambio en FIRMS, se usa la grilla guardada.

## Estado (12/11, 22:30 ART)

Pasos 1 a 3 hechos y probados en Fuji (job 11, `docs/txs.md`). El 4 queda afuera y el 5 está hecho en TopBar, mission-control, CLAUDE.md y ATTRIBUTION. Falta la slide del deck.

### Cómo grabar

En la **máquina del nodo** (esta):

```bash
source scripts/serve_artifacts.sh          # túnel HTTPS, exporta ARTIFACTS_BASE_URL
set -a; source .env; set +a
.venv/bin/python scripts/e2e.py --demo --live --remote-validator
```

En la **máquina del validador** (otra compu, con un `.env` que solo tenga `FUJI_RPC_URL`, `PUNA_ESCROW` y `VALIDATOR_PK`):

```bash
scripts/validator_remote.sh                # túnel propio para los certificados + validator.agent escuchando
```

Hay que arrancar el validador antes que el e2e. Si la segunda máquina falla, se saca `--remote-validator` y el validador vuelve a correr como proceso aparte en la misma máquina.

Después de grabar, hay que copiar los certificados (`<sha256>.json`) a `web/public/artifacts/`. Así la web los muestra cuando el túnel se cierra. Si el validador corrió en otra máquina, se copian de su `out/artifacts/`.

### Sin segunda compu: el validador en Railway

El validador corre como servicio en Railway: otro host, otra IP y solo con su propia clave. El servicio (`python -m validator.serve`) escucha los pedidos de ERC-8004 y publica sus certificados en `https://<servicio>.up.railway.app/<sha256>.json`. La imagen sale de `deploy/validator/Dockerfile`, solo con el código Python, sin `.env` ni web. `railway.json` la apunta.

Una sola vez:

```bash
railway init -n puna-validator      # proyecto nuevo
railway up --detach                 # build + deploy desde la raíz del repo
railway domain                      # genera el dominio público
```

En el dashboard de Railway, en Variables, se cargan **solo** `VALIDATOR_PK`, `FUJI_RPC_URL` y `PUNA_ESCROW`. Si aparece una clave del nodo o de la aseguradora, el servicio se niega a arrancar. Para ver el validador en el video: `railway logs`.

En esta máquina (el nodo) sigue haciendo falta el túnel para los tensores:

```bash
source scripts/serve_artifacts.sh
set -a; source .env; set +a
.venv/bin/python scripts/e2e.py --demo --live --remote-validator
```

Servicio desplegado: `https://validator-production-3c773130.up.railway.app` (proyecto `puna-validator`). No hace falta partir la pantalla: la terminal del nodo ya muestra "respuesta on-chain del validador remoto" y el certificado con la URL de Railway.

**Para que la cartera muestre el job grabado** (hoy muestra la foto del job 7, `web/public/data/demo.json`):

```bash
.venv/bin/python scripts/export_web.py --job <N> --from-block <bloque del createJob> --to-block <bloque del último settle>
cp out/artifacts/<sha256 de cada certificado>.json web/public/artifacts/
```

Los números son los mismos (37,8 %, scores 49 y 100). Cambian el número de job, la hora y los hashes.
