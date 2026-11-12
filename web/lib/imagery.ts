/**
 * Imágenes satelitales reales para la ficha de cada campo.
 * - Base nítida: Sentinel-2 cloudless 2025 de EOX (10 m, mosaico anual sin nubes; no es del día).
 * - Del día: NASA GIBS, NOAA-20 VIIRS (375 m), en color real o falso color para fuego.
 */
import { km } from "./sky";

export type BBox = [number, number, number, number]; // w, s, e, n

/** Recuadro CUADRADO en km alrededor del campo, con `pad` veces su lado de margen. */
export function frame(bbox: BBox, pad = 0.35, minKm = 3): BBox {
  const [w, s, e, n] = bbox;
  const lat = (s + n) / 2, lon = (w + e) / 2;
  const side = Math.max(km(s, w, s, e), km(s, w, n, w), minKm) * (1 + 2 * pad);
  const dLat = side / 2 / 111.32;
  const dLon = side / 2 / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}

export const eoxUrl = ([w, s, e, n]: BBox, px = 600) =>
  `https://tiles.maps.eox.at/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=s2cloudless-2025&SRS=EPSG:4326` +
  `&BBOX=${w},${s},${e},${n}&WIDTH=${px}&HEIGHT=${px}&FORMAT=image/jpeg`;

export const EOX_CREDIT = "Sentinel-2 cloudless 2025 de EOX IT Services (contiene datos Copernicus Sentinel modificados)";

/** Posición de un punto o rectángulo dentro del recuadro, en [0, 1] (y hacia abajo). */
export const rel = ([w, s, e, n]: BBox, lat: number, lon: number) => ({ x: (lon - w) / (e - w), y: (n - lat) / (n - s) });
