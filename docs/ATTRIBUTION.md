# Atribución

## Datos e imágenes

- **NASA Blue Marble** (textura del globo): NASA Earth Observatory / NASA Visible Earth. Dominio público.
- **NASA FIRMS** (focos de calor VIIRS/MODIS): NASA LANCE FIRMS, https://firms.modaps.eosdis.nasa.gov.
  - El Lote 14 es un incendio real en Anta, Salta.
  - Datos: VIIRS 375 m NRT (NOAA-20 y NOAA-21), 147 detecciones del 31/10 al 11/11/2026, en `sample-data/firms_anta.csv`.
  - "We acknowledge the use of data and imagery from LANCE FIRMS operated by NASA's Earth Science Data and Information System (ESDIS) with funding provided by NASA Headquarters."
- **CelesTrak** (TLE / GP): https://celestrak.org. Usamos NOAA 20 (NORAD 43013) y NOAA 21 (NORAD 54234), época 26315 (guardado) o la vigente, bajada en vivo con `scripts/e2e.py --live`. Las órbitas son reales; usarlos como nodos de cómputo es simulado.
- **NOAA SWPC / GOES** (protones integrales ≥10 MeV): https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json. Dato real del flujo en la ventana del job, guardado en `sample-data/goes_protons.json`. La falla en el nodo sigue siendo inyectada.
- **Datos de Orbview-2** sobre SEU en la Anomalía del Atlántico Sur: NASA NEPP (ver fuentes en `docs/resumen-tecnico.md`).
- **Renders del equipo** (`docs/design/assets/`), generados proceduralmente:
  - satélites;
  - vista satelital del lote: la textura es **simulada**, pero la forma del quemado sale de las celdas reales.

## Protocolos y contratos

- **ERC-8004** (Identity, Reputation, Validation): https://github.com/erc-8004/erc-8004-contracts. Usamos los despliegues en Avalanche Fuji.
- **Avalanche Fuji** y explorador **Snowtrace / Routescan**.

## Software

- Foundry y forge-std (MIT/Apache-2.0)
- web3.py (MIT)
- sgp4 (MIT)
- NumPy (BSD)
- Matplotlib (PSF-based)
- python-dotenv (BSD)
- Next.js (MIT), React (MIT), Tailwind CSS (MIT), viem (MIT)
- Tipografías **Geist** y **Geist Mono** (Vercel, SIL Open Font License 1.1)

## Referencias

- **Freivalds, R.** (1977), verificación probabilística de productos de matrices.
- **Flipless** (https://flipless.space), citado como trabajo complementario de detección de bit-flips.

## Sentinel-2 cloudless (EOX)

La ficha de cada campo en la cartera usa el mosaico **Sentinel-2 cloudless 2025** de EOX IT Services GmbH, que contiene datos Copernicus Sentinel modificados. Licencia CC BY-NC-SA 4.0: solo para uso no comercial, como esta demo. Un producto comercial necesita licencia de EOX u otra fuente de imágenes.

## Imágenes de satélites

Ilustraciones oficiales de dominio público, de NASA y NOAA, obtenidas en Wikimedia Commons y copiadas en `web/public/sats/`:

| Satélite | Archivo | Autor |
|---|---|---|
| NOAA-20 | [JPSS-1.jpg](https://commons.wikimedia.org/wiki/File:JPSS-1.jpg) | NOAA |
| NOAA-21 | [Artist's rendering of NOAA-21.png](https://commons.wikimedia.org/wiki/File:Artist%27s_rendering_of_NOAA-21.png) | NOAA |
| Terra | [TERRA am1.jpg](https://commons.wikimedia.org/wiki/File:TERRA_am1.jpg) | NASA/JPL |
| Aqua | [Aqua spacecraft model.png](https://commons.wikimedia.org/wiki/File:Aqua_spacecraft_model.png) | NASA |
| GOES-19 | [GOES-R Spacecraft Art (serie GOES-R)](https://commons.wikimedia.org/wiki/File:GOES-R_Spacecraft_Art_on_Side_Front_Left_(14213075849).png) | NOAA/Lockheed Martin |

El ícono de satélite del globo es el render propio de `docs/design/assets/sat.py` (`web/public/renders/satA.png`).

## Landing
- Textura del planeta: NASA Blue Marble (BlueMarble_ShadedRelief_Bathymetry) vía NASA GIBS. Imagen de dominio público de la NASA; se agradece al servicio GIBS (earthdata.nasa.gov/gibs).
- Fondo: cielo nocturno con un shader GLSL propio (estrellas por capas, Vía Láctea y polvo), sin librerías externas.
- Satélites 3D: modelos de [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) (dominio público): Suomi NPP (usado para NOAA-20 y NOAA-21, que comparten la plataforma), Aqua y Terra. Al de Terra se le quitaron dos texturas externas que no venían en el archivo.
- Globo 3D: [three.js](https://threejs.org) (MIT).
