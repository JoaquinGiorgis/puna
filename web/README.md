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

**En vivo:** el timeline verifica con viem, contra la RPC pública de Fuji, que cada tx exista y haya salido bien. Sin red muestra "sin red: datos guardados".

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
