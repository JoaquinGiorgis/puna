/**
 * Cielo en vivo: posición actual de satélites reales (SGP4 con satellite.js sobre TLE de CelesTrak)
 * y zonas de fuego a partir de los focos de NASA FIRMS. Proyección idéntica a globe.png
 * (docs/design/assets/globe.py y scripts/export_globe_overlay.py), en el marco 820×632.
 */
import { degreesLat, degreesLong, eciToGeodetic, gstime, propagate, twoline2satrec, type SatRec } from "satellite.js";

const LAT0 = (-24 * Math.PI) / 180;
const LON0 = (-59 * Math.PI) / 180;
const CX = 370, CY = 352, R = 450;
const EARTH_KM = 6371;
const F = [Math.cos(LAT0) * Math.cos(LON0), Math.cos(LAT0) * Math.sin(LON0), Math.sin(LAT0)];
const E = [-Math.sin(LON0), Math.cos(LON0), 0];
const N = [-Math.sin(LAT0) * Math.cos(LON0), -Math.sin(LAT0) * Math.sin(LON0), Math.cos(LAT0)];

export type Screen = { x: number; y: number; z: number; visible: boolean; inFrame: boolean };

/** lat/lon en grados, r en radios terrestres (1 = superficie) → píxeles del marco 820×632. */
export function project(lat: number, lon: number, r = 1): Screen {
  const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
  const p = [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)];
  const dot = (a: number[]) => p[0] * a[0] + p[1] * a[1] + p[2] * a[2];
  const x = CX + dot(E) * R, y = CY - dot(N) * R, z = dot(F);
  // visible si está del lado de la cámara o, en órbita, fuera del disco del planeta
  const visible = z > 0 || Math.hypot(x - CX, y - CY) > R;
  // inFrame: dentro del recuadro que se ve del globo (el panel recorta los costados)
  return { x, y, z, visible, inFrame: visible && x > -40 && x < 760 && y > 8 && y < 624 };
}

export type SatDef = { name: string; norad: number; line1: string; line2: string };
export type SatKind = "polar" | "geo";
export type SatNow = {
  name: string; norad: number; kind: SatKind; lat: number; lon: number; altKm: number; speedKms: number;
  pos: Screen; track: string; inSaa: boolean; overNoa: boolean;
};

// Polígono de la Anomalía: el mismo que usa orbit/saa.py para saaBps (lon, lat)
const SAA: [number, number][] = [
  [-90, -10], [-60, -5], [-35, -5], [-10, -15], [10, -25], [20, -40],
  [0, -50], [-30, -55], [-60, -50], [-80, -40], [-90, -25],
];
export function inSaa(lat: number, lon: number): boolean {
  let inside = false;
  for (let i = 0, j = SAA.length - 1; i < SAA.length; j = i++) {
    const [x1, y1] = SAA[i], [x2, y2] = SAA[j];
    if (y1 > lat !== y2 > lat && lon < x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1)) inside = !inside;
  }
  return inside;
}
export const NOA = { w: -68, s: -28, e: -62, n: -21.8 };

const recs = new Map<string, SatRec>();

function geodetic(def: SatDef, when: Date): { lat: number; lon: number; altKm: number; speedKms: number } | null {
  let rec = recs.get(def.line1);
  if (!rec) recs.set(def.line1, (rec = twoline2satrec(def.line1, def.line2)));
  const pv = propagate(rec, when);
  if (!pv || typeof pv.position === "boolean" || !pv.position) return null;
  const g = eciToGeodetic(pv.position, gstime(when));
  const v = pv.velocity && typeof pv.velocity !== "boolean" ? Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z) : 0;
  return { lat: degreesLat(g.latitude), lon: degreesLong(g.longitude), altKm: g.height, speedKms: v };
}

/** Posición ahora + traza ±45 min (polares). Los geoestacionarios se marcan en su punto sub-satelital. */
export function satsNow(defs: SatDef[], now: Date): SatNow[] {
  const out: SatNow[] = [];
  for (const def of defs) {
    const g = geodetic(def, now);
    if (!g) continue;
    const kind: SatKind = g.altKm > 30_000 ? "geo" : "polar";
    const r = kind === "geo" ? 1 : 1 + g.altKm / EARTH_KM;
    let track = "";
    if (kind === "polar") {
      const segs: string[] = [];
      let cur: string[] = [];
      for (let m = -45; m <= 45; m += 1.5) {
        const p = geodetic(def, new Date(now.getTime() + m * 60_000));
        const s = p && project(p.lat, p.lon, 1 + p.altKm / EARTH_KM);
        if (s && s.visible && s.x > -60 && s.x < 880 && s.y > -60 && s.y < 692) cur.push(`${s.x.toFixed(1)} ${s.y.toFixed(1)}`);
        else {
          if (cur.length > 1) segs.push("M" + cur.join(" L"));
          cur = [];
        }
      }
      if (cur.length > 1) segs.push("M" + cur.join(" L"));
      track = segs.join(" ");
    }
    out.push({
      name: def.name, norad: def.norad, kind, lat: g.lat, lon: g.lon, altKm: g.altKm, speedKms: g.speedKms, pos: project(g.lat, g.lon, r), track,
      inSaa: kind === "polar" && inSaa(g.lat, g.lon),
      overNoa: g.lat <= NOA.n + 8 && g.lat >= NOA.s - 8 && g.lon >= NOA.w - 10 && g.lon <= NOA.e + 10,
    });
  }
  return out;
}

/** Próxima pasada de un satélite polar sobre el NOA (búsqueda cada 30 s, hasta 14 h). */
export function nextPass(def: SatDef, now: Date): Date | null {
  for (let s = 30; s < 14 * 3600; s += 30) {
    const t = new Date(now.getTime() + s * 1000);
    const g = geodetic(def, t);
    if (g && g.lat <= NOA.n + 3 && g.lat >= NOA.s - 3 && g.lon >= NOA.w - 5 && g.lon <= NOA.e + 5) return t;
  }
  return null;
}

// ------------------------------------------------------------------ zonas de fuego

export type Fire = { lat: number; lon: number; sat: string; source: string; t: string; frp: number; confidence: string };
export type Zone = {
  id: string; lat: number; lon: number; count: number; sats: string[]; first: Date; last: Date; maxFrp: number;
  near: string; inLot: boolean; pos: Screen; fires: Fire[]; bbox: [number, number, number, number]; extentKm: number;
};

// localidades de referencia para nombrar las zonas ("cerca de …")
const PLACES: [string, number, number][] = [
  ["Salta", -24.79, -65.41], ["San Salvador de Jujuy", -24.19, -65.3], ["Tartagal", -22.52, -63.8],
  ["Orán", -23.13, -64.33], ["Embarcación", -23.21, -64.1], ["Pichanal", -23.32, -64.22],
  ["Libertador Gral. San Martín", -23.81, -64.79], ["Apolinario Saravia", -24.44, -63.99],
  ["Las Lajitas", -24.73, -64.2], ["Joaquín V. González", -25.12, -64.13], ["Metán", -25.5, -64.97],
  ["Rosario de la Frontera", -25.8, -64.97], ["San Miguel de Tucumán", -26.82, -65.22],
  ["Coronel Juan Solá", -23.47, -62.89], ["Cafayate", -26.07, -65.98], ["Tilcara", -23.58, -65.4],
];

const km = (a: number, b: number, c: number, d: number) => {
  const r = Math.PI / 180;
  const h = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
};

/**
 * Agrupa focos en zonas por distancia: un foco entra a la zona cuyo centro esté a menos de `radiusKm`
 * (si no, abre una zona nueva). Los focos dentro del Lote 14 (bbox + 3 km) forman siempre su propia zona,
 * así no se mezclan con incendios vecinos. lot = bbox del Lote 14 [w, s, e, n].
 */
export function zones(fires: Fire[], lot: number[], radiusKm = 12): Zone[] {
  const [lw, ls, le, ln] = lot;
  const m = 0.03; // ~3 km de margen alrededor del lote
  const inLot = (f: Fire) => f.lon >= lw - m && f.lon <= le + m && f.lat >= ls - m && f.lat <= ln + m;
  const groups: Fire[][] = [];
  const lotGroup = fires.filter(inLot);
  if (lotGroup.length) groups.push(lotGroup);
  const centers: { lat: number; lon: number; g: Fire[] }[] = [];
  // los más intensos primero: los centros caen sobre el núcleo de cada incendio
  for (const f of fires.filter((x) => !inLot(x)).sort((a, b) => b.frp - a.frp)) {
    const c = centers.find((z) => km(z.lat, z.lon, f.lat, f.lon) < radiusKm);
    if (c) {
      c.g.push(f);
      c.lat += (f.lat - c.lat) / c.g.length;
      c.lon += (f.lon - c.lon) / c.g.length;
    } else centers.push({ lat: f.lat, lon: f.lon, g: [f] });
  }
  groups.push(...centers.map((c) => c.g));
  return groups
    .map((g, i) => {
      const lat = g.reduce((a, f) => a + f.lat, 0) / g.length;
      const lon = g.reduce((a, f) => a + f.lon, 0) / g.length;
      const [place, d] = PLACES.map(([p, a, b]) => [p, km(lat, lon, a, b)] as const).sort((x, y) => x[1] - y[1])[0];
      return {
        id: `z${Math.round(lat * 100)}_${Math.round(lon * 100)}`, lat, lon, count: g.length,
        sats: [...new Set(g.map((f) => f.sat))].sort(),
        first: new Date(Math.min(...g.map((f) => Date.parse(f.t)))),
        last: new Date(Math.max(...g.map((f) => Date.parse(f.t)))),
        maxFrp: Math.max(...g.map((f) => f.frp)),
        near: d < 15 ? place : d < 90 ? `${Math.round(d)} km de ${place}` : `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`,
        inLot: g === lotGroup,
        pos: project(lat, lon),
        fires: g,
        bbox: [Math.min(...g.map((f) => f.lon)), Math.min(...g.map((f) => f.lat)), Math.max(...g.map((f) => f.lon)), Math.max(...g.map((f) => f.lat))] as [number, number, number, number],
        extentKm: km(Math.min(...g.map((f) => f.lat)), Math.min(...g.map((f) => f.lon)), Math.max(...g.map((f) => f.lat)), Math.max(...g.map((f) => f.lon))),
      };
    })
    .sort((a, b) => Number(b.inLot) - Number(a.inLot) || b.last.getTime() - a.last.getTime() || b.count - a.count);
}

export const ago = (d: Date, now: Date) => {
  const m = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
  return m < 60 ? `hace ${m} min` : m < 48 * 60 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`;
};
