/**
 * Proyección del globo de la cartera (public/renders/globe-noa.jpg), idéntica a docs/design/assets/globe_noa.py.
 * Marco lógico 1440×900 (la imagen está a 2x). Ortográfica: cámara inclinada sobre el NOA.
 */
export const FRAME = { w: 1440, h: 900 };
const LAT0 = (-78.9 * Math.PI) / 180, LON0 = (-63.5 * Math.PI) / 180;
const CX = 480, CY = 2960, R = 3000;
const F = [Math.cos(LAT0) * Math.cos(LON0), Math.cos(LAT0) * Math.sin(LON0), Math.sin(LAT0)];
const E = [-Math.sin(LON0), Math.cos(LON0), 0];
const N = [-Math.sin(LAT0) * Math.cos(LON0), -Math.sin(LAT0) * Math.sin(LON0), Math.cos(LAT0)];

export type Pt = { x: number; y: number; visible: boolean };

/** lat/lon en grados, r en radios terrestres (1 = superficie) → píxeles del marco 1440×900. */
export function proj(lat: number, lon: number, r = 1): Pt {
  const a = (lat * Math.PI) / 180, b = (lon * Math.PI) / 180;
  const p = [r * Math.cos(a) * Math.cos(b), r * Math.cos(a) * Math.sin(b), r * Math.sin(a)];
  const dot = (v: number[]) => p[0] * v[0] + p[1] * v[1] + p[2] * v[2];
  const x = CX + dot(E) * R, y = CY - dot(N) * R, z = dot(F);
  // del lado de la cámara, o en órbita por fuera del disco
  return { x, y, visible: z > 0 || Math.hypot(x - CX, y - CY) > R };
}

/** Punto del NOA donde centra la cámara por defecto (Anta, Salta). */
export const NOA = proj(-25, -63.6);

/** Zona cubierta por los renders: el detallado (0,0)-(1440,900) y el amplio (-720,-450)-(2160,1350). */
export const BOUNDS = { x0: -720, y0: -450, x1: 2160, y1: 1350 };
export const K_MIN = 0.5, K_MAX = 2.6;
export type View = { k: number; x: number; y: number };
export const HOME: View = { k: 1, x: 720, y: 450 };

/** Limita zoom y centro para no salir de la zona renderizada. */
export function clampView(v: View): View {
  const k = Math.min(K_MAX, Math.max(K_MIN, v.k));
  const hw = FRAME.w / 2 / k, hh = FRAME.h / 2 / k;
  const cx = (BOUNDS.x0 + BOUNDS.x1) / 2, cy = (BOUNDS.y0 + BOUNDS.y1) / 2;
  const x = BOUNDS.x1 - BOUNDS.x0 <= 2 * hw ? cx : Math.min(BOUNDS.x1 - hw, Math.max(BOUNDS.x0 + hw, v.x));
  const y = BOUNDS.y1 - BOUNDS.y0 <= 2 * hh ? cy : Math.min(BOUNDS.y1 - hh, Math.max(BOUNDS.y0 + hh, v.y));
  return { k, x, y };
}

/** Punto de un satélite en el globo (en órbita o, si es geoestacionario, su punto bajo él). */
export function satPoint(x: { lat: number; lon: number; altKm: number; kind: "polar" | "geo" }): Pt {
  return proj(x.lat, x.lon, x.kind === "geo" ? 1 : 1 + x.altKm / 6371);
}

/** ¿El satélite cae dentro del área que cubre el mapa (los renders)? */
export function satOnMap(x: { lat: number; lon: number; altKm: number; kind: "polar" | "geo" }) {
  const p = satPoint(x);
  return p.visible && p.x >= BOUNDS.x0 && p.x <= BOUNDS.x1 && p.y >= BOUNDS.y0 && p.y <= BOUNDS.y1;
}
