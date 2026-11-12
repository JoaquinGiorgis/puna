# web: Mission Control

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
- **Eventos:** salen de dos fuentes que se combinan:
  - el indexador de Routescan, para el historial completo, filtrando por `jobId` y `requestHash` (va con ~1 min de atraso);
  - `eth_getLogs` directo a la RPC sobre los últimos 200 bloques, para tener lo más reciente sin atraso.
- **Estado y reputación:** `getJob` y `getSummary` vía viem, con publicnode como RPC principal y la de Avalanche de respaldo.
- **Certificados:** la ruta `/api/artifact/<sha256>.json` sirve los que publicó el validador local, y el navegador verifica el sha256. En un host sin esos archivos, por ejemplo Vercel, se ven el score y el estado pero no el detalle por capa.
- **Sin red:** se queda con lo último que leyó o con la foto exportada, y lo indica en la barra superior.

Lo que no cambia en vivo son los insumos: la grilla y los focos FIRMS del Lote 14, las órbitas de la ventana y el benchmark.

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
