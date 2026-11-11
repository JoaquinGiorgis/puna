# web — Mission Control (por armar)

Next.js (App Router) + Tailwind. Diseño en Figma (ver `docs/design.md`). Paneles:
1. **Constelación** (globo): R3F + drei, textura Blue Marble, órbitas con satellite.js desde TLE en `sample-data/tle/`. Plan B: `public/renders/globe.png` + overlays SVG de `globe-overlay.json`.
2. **Póliza**: `public/renders/lot.png` + grilla 12×12 desde los artefactos del job.
3. **Auditoría**: certificado del validador (checks por capa) + reputación desde ERC-8004.
4. **Timeline**: eventos de `PunaEscrow` (viem, Fuji) con links a Snowtrace.

Tokens de color: `docs/design.md`. Accesibilidad: estados con ícono + etiqueta, AA, ≥ 11 px.
