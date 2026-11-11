# Diseño — Mission Control

Figma: https://www.figma.com/design/QX6MGCInnAdtuh6Vch931X (frame `2:17`, 1440×1024). Captura: `docs/design/mission-control.png`.

## Dirección
- **Modo claro con liquid glass.**
  - Fondo: degradé "Salinas Grandes", del blanco salar al celeste de altura, con un brillo rosado tipo laguna.
  - Paneles: vidrio esmerilado (fondo blanco ~50 %, `backdrop-filter: blur(28px)`, borde blanco 1 px, reflejo interior arriba, sombra azulada suave).
- **El globo es la pieza principal:** un visor oscuro (modo Dark de las variables) con marco de vidrio. Sus HUD van en vidrio oscuro.
- **Tipografía:** Geist para la UI, Geist Mono para hashes, números y datos on-chain.

## Tokens (colección Figma `PUNA / Color`, modos Dark / Light)
| Token | Light | Dark |
|---|---|---|
| bg/canvas | #EEF3F8 | #070B12 |
| bg/surface | #FFFFFF @ 50 % | #0C131E |
| bg/raised | #FFFFFF @ 62 % | #111B2A |
| text/primary | #0E1B2C | #E6EDF7 |
| text/muted | #4D5D73 | #8293AD |
| text/faint | #5F6E82 | #55657E |
| accent/cyan | #0369A1 | #3DD6F5 |
| status/success | #0B7D55 | #34D399 |
| status/warning | #9A6200 | #F5B03D |
| status/danger | #C4352B | #FF5A4E |
| fire/hot | #EA6A12 | #FF7A1A |
| */\*-bg (tintes) | color @ 8–10 % | color @ 14–16 % |

En código, los tintes usan los tokens `-bg`, que ya traen la transparencia. No uses opacidad sobre el color de estado (en Figma eso rompía el cambio de modo).

## Accesibilidad (obligatorio)
- **El estado nunca se comunica solo con color.** Cada estado lleva ícono y etiqueta:
  - ✓ Aprobado / Pagado
  - ✕ Falló / Sin pago
  - ▲ Riesgo SAA / Sin auditar
  - → Creada / Reasignado
- Contraste AA (4.5:1) en todo el texto. Tamaño mínimo 11 px.
- Los links van subrayados y con ↗.
- Foco visible por teclado. Respetar `prefers-reduced-motion`: la animación del satélite entrando a la Anomalía es el único movimiento autónomo.

## Componentes
- **Globo:** `web/public/renders/globe.png`, una textura NASA Blue Marble proyectada (render en `docs/design/assets/globe.py`).
  - Overlays vectoriales desde `globe-overlay.json`: órbitas, trazas, contornos SAA, satélites, lote, ciudades.
  - En web, preferir R3F + drei con la misma textura y satellite.js; el PNG es el plan B estático.
- **Satélites:** `satA.png` (ORBIT-07, halo rojo) y `satB.png` (ORBIT-03, halo cian).
- **Póliza:** la vista satelital del lote (`lot.png`, simulada y etiquetada) con la grilla 12×12 encima. Las celdas quemadas llevan contorno naranja.
- **Auditoría:** tabla por capa (encadenado, intento 1 y 2) y tarjetas de reputación de nodos.
- **Timeline:** componente `Timeline step` con variantes `Estado = Neutral | Warning | Danger | Success` y prop `Etiqueta`.
