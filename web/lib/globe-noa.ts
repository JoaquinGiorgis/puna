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
