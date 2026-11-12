# web: Mission Control

Producción: https://puna-mission-control.vercel.app (Vercel, cuenta personal, proyecto `puna-mission-control`). Requiere la variable `FIRMS_MAP_KEY`, ya cargada. Los certificados del validador se sirven desde `public/artifacts/`; los de jobs nuevos aparecen en producción recién al copiarlos ahí y redeployar.

Next.js 16 (App Router) + Tailwind 4 + viem. Diseño: `docs/design.md` y Figma.

```bash
pnpm --dir web install
pnpm --dir web dev        # http://localhost:3000
pnpm --dir web build
```

## Datos (todos reales, salvo lo marcado como simulado)

La página no depende de la red para mostrarse: lee archivos exportados desde la raíz del repo.

```bash
# job en Fuji: eventos, txs, certificados, FIRMS, reputación
.venv/bin/python scripts/export_web.py --job 7 --from-block 60904990 --to-block 60905060
# trazas sgp4 de NOAA 20/21 en la ventana + polígono de la Anomalía
.venv/bin/python scripts/export_globe_overlay.py
# vista del lote con las celdas quemadas reales (la textura es simulada)
.venv/bin/python docs/design/assets/lot.py
```

- `public/data/demo.json`: job, intentos con su certificado, eventos y txs (hash, bloque, hora, gas), grilla y focos FIRMS del Lote 14, nodos con saaBps y reputación ERC-8004.
- `public/renders/globe-overlay.json`: trazas, Anomalía, lote y ciudades en el marco de `globe.png` (820×632).

## En vivo

La página lee la cadena desde el navegador y se actualiza sola:

- **Qué job muestra:** sigue al último job del escrow (`nextJobId − 1`). Con `?job=N` fija uno.
- **Cada cuánto:** refresca cada 4 s mientras el job está en curso y cada 15 s cuando ya cerró. Si corrés `scripts/e2e.py --demo`, el timeline, la auditoría y los nodos avanzan paso a paso, unos segundos detrás de la cadena.
- **Eventos:** `eth_getLogs` directo a la RPC (publicnode acepta rangos de ~25.000 bloques), filtrando el escrow por `jobId` y el Validation Registry por `requestHash`. Es la fuente primaria. Probamos el indexador de Routescan y lo descartamos: tenía huecos (al job 8 le faltaban 4 de sus 7 eventos una hora después).
- **Estado y reputación:** `getJob` y `getSummary` vía viem, contra publicnode. La RPC de Avalanche no sirve desde el navegador: limita por IP con 429 y responde sin CORS.
- **Certificados:** la ruta `/api/artifact/<sha256>.json` sirve los que publicó el validador local, y el navegador verifica el sha256. En un host sin esos archivos, por ejemplo Vercel, se ven el score y el estado pero no el detalle por capa.
- **Sin red:** se queda con lo último que leyó o con la foto exportada, y lo indica en la barra superior.

Lo que no cambia en vivo son los insumos de la póliza: la grilla y los focos FIRMS del Lote 14, las órbitas de la ventana del job y el benchmark.

## Cielo en vivo (pestaña "● En vivo" del globo)

- **Satélites reales en su posición de ahora:** NOAA-20, NOAA-21, Terra, Aqua (polares) y GOES-19 (geoestacionario).
  - TLE de CelesTrak vía `/api/tle`, con caché de 2 h y respaldo en `lib/tle/snapshot.json`.
  - SGP4 en el navegador con `satellite.js`; la posición se recalcula cada segundo.
  - Cada polar muestra su traza ±45 min y si está dentro de la Anomalía (el mismo polígono que usa `saaBps`).
- **Focos de fuego en vivo:** NASA FIRMS sobre el NOA vía `/api/fires`, de hoy y ayer en UTC.
  - Fuentes: GOES-19 y Meteosat cada 10 min, más VIIRS y MODIS en cada pasada; caché de 5 min.
  - La `FIRMS_MAP_KEY` queda en el servidor: en local se lee de `../.env`; en un deploy va en `FIRMS_MAP_KEY`.
- **Zonas:** los focos se agrupan por vecindad (celdas de ~20 km). Cada zona muestra detecciones y antigüedad del último foco, y se marca la que toca el Lote 14.
- **Tabla de sensores:** por satélite, si está pasando sobre el NOA, cuándo vuelve y su último foco reportado.
- **Click en una zona o un satélite** (en el globo o en la tabla) abre un panel con más detalle.
  - **Zona:** imagen satelital real de NASA GIBS (NOAA-20 VIIRS), en falso color, que resalta el fuego, o en color real, para los últimos 4 días, con los focos de ese día encima. Datos reales de FIRMS: detecciones por satélite, primera y última, potencia máxima, extensión y links a NASA Worldview y al mapa de FIRMS. Un **cliente simulado** (productor, cultivo, hectáreas y póliza de ejemplo), salvo en el Lote 14, que muestra la póliza real on-chain.
  - **Satélite:** posición, altura, velocidad, si está en la Anomalía, próxima pasada sobre el NOA y sus focos reportados.
- **Lo que sigue simulado:** que estos satélites calculen el índice a bordo.

La otra pestaña, "Ventana del job", muestra ORBIT-07 y ORBIT-03 en la ventana de la demo.

La RPC pública de Avalanche limita por IP y devuelve 429. Si la demo y la página corren en la misma máquina, conviene que los scripts usen otra RPC:
`FUJI_RPC_URL=https://avalanche-fuji-c-chain-rpc.publicnode.com` en `.env`.

## Paneles

1. **Constelación:** `globe.png` (NASA Blue Marble) con overlays SVG de las trazas reales. Los satélites como nodos de cómputo son simulados y lo dice la UI. Es el plan B; el plan A en R3F queda opcional.
2. **Póliza:** la vista del lote (simulada) con la grilla 12×12, las celdas quemadas según el modelo y los focos FIRMS reales. Muestra el índice contra el disparador.
3. **Auditoría:** el certificado del validador por capa en ambos intentos, el score ERC-8004 y la reputación leída del Reputation Registry.
4. **Timeline:** los eventos del escrow y de ERC-8004 con links a Snowtrace, más el total de txs, el gas y el tiempo de la póliza al pago.

Accesibilidad:
- el estado siempre va con ícono y etiqueta;
- los links van subrayados con ↗;
- el foco es visible;
- se respeta `prefers-reduced-motion`;
- el texto mide 10,5 px o más.
