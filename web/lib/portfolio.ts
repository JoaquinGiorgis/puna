/**
 * Cartera de EJEMPLO de una aseguradora que usa PUNA: productores, campos y pólizas SIMULADOS.
 * Lo real es el estado de cada campo: se calcula en vivo con los focos de NASA FIRMS (48 h) que caen
 * dentro del campo o cerca. El Lote 14 es el único con póliza on-chain (job de la demo en Fuji).
 */
import { km, type Fire } from "./sky";
import { demo } from "./data";

export const INSURER = { name: "Aseguradora Demo NOA", user: "Operaciones · siniestros", email: "demo@aseguradora.test" };

export type Client = {
  id: string;
  field: string; // nombre del establecimiento
  place: string;
  crop: string;
  bbox: [number, number, number, number]; // w, s, e, n
  ha: number;
  policy: string;
  usdPerHa: number;
  triggerPct: number;
  onchain: boolean; // true solo para el Lote 14
};

/** bbox cuadrado de `ha` hectáreas centrado en (lat, lon). */
function square(lat: number, lon: number, ha: number): [number, number, number, number] {
  const side = Math.sqrt(ha / 100); // km
  const dLat = side / 2 / 111.32;
  const dLon = side / 2 / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}

/** Hectáreas de un bbox (aprox. plana, suficiente para lotes de pocos km). */
export function bboxHa([w, s, e, n]: [number, number, number, number]) {
  return Math.round((km(s, w, s, e) * km(s, w, n, w) * 100) / 10) * 10;
}

type Seed = [id: string, field: string, place: string, crop: string, lat: number, lon: number, ha: number, usdPerHa: number];

const SEEDS: Seed[] = [
  ["la-esperanza", "Establecimiento La Esperanza", "Las Lajitas, Anta (Salta)", "soja", -24.66, -64.12, 1800, 380],
  ["el-algarrobal", "Finca El Algarrobal", "Apolinario Saravia, Anta (Salta)", "poroto", -24.38, -63.92, 900, 420],
  ["los-quebrachos", "Establecimiento Los Quebrachos", "J. V. González, Anta (Salta)", "maíz", -25.1, -64.0, 1200, 360],
  ["santa-rosa", "Finca Santa Rosa", "El Quebrachal, Anta (Salta)", "soja", -25.33, -64.05, 2400, 380],
  ["el-chanar", "Establecimiento El Chañar", "General Pizarro, Anta (Salta)", "poroto", -24.25, -63.95, 700, 420],
  ["la-florida", "Finca La Florida", "Pichanal, Orán (Salta)", "caña de azúcar", -23.3, -64.18, 1500, 520],
  ["el-palmar", "Establecimiento El Palmar", "Embarcación, San Martín (Salta)", "soja", -23.42, -64.0, 1100, 380],
  ["don-ernesto", "Finca Don Ernesto", "Aguaray, San Martín (Salta)", "poroto", -22.28, -63.7, 600, 420],
  ["la-aurora", "Establecimiento La Aurora", "Metán (Salta)", "soja", -25.42, -64.9, 1300, 380],
  ["san-jose", "Finca San José", "Rosario de la Frontera (Salta)", "pastura", -25.88, -64.88, 2000, 150],
  ["el-timbo", "Establecimiento El Timbó", "Burruyacú (Tucumán)", "soja", -26.55, -64.7, 1600, 380],
  ["el-mistol", "Finca El Mistol", "Taco Pozo (Chaco)", "soja", -25.55, -63.3, 2200, 360],
];

const lot = demo.lot.bbox as [number, number, number, number];

export const CLIENTS: Client[] = [
  {
    id: "lote-14", field: "Finca Tres Cerros", place: "Anta (Salta)", crop: "soja y poroto", bbox: lot, ha: bboxHa(lot),
    policy: `PUNA-NOA-0014 · job ${demo.job.id}`, usdPerHa: 400, triggerPct: demo.job.triggerBps / 100, onchain: true,
  },
  ...SEEDS.map(([id, field, place, crop, lat, lon, ha, usdPerHa], i) => ({
    id, field, place, crop, bbox: square(lat, lon, ha), ha, usdPerHa, triggerPct: 30, onchain: false,
    policy: `PUNA-NOA-${String(101 + i * 7).padStart(4, "0")}`,
  })),
];

export const sumInsured = (c: Client) => c.ha * c.usdPerHa;

// ------------------------------------------------------------------ estado en vivo

export type Level = "atencion" | "siniestro" | "vigilancia" | "ok";
export type Assessment = {
  level: Level;
  inField: Fire[];
  near: Fire[];
  nearestKm: number | null;
  last: Date | null;
};

/** Un foco a ≤ 1 km del borde cuenta como dentro (píxel VIIRS 375 m + error de geolocalización). */
export const IN_FIELD_KM = 1;
/** Vigilancia: foco a ≤ 15 km del campo en las últimas 48 h. */
export const WATCH_KM = 15;

/** Distancia en km de un punto al rectángulo del campo (0 si está adentro). */
export function distToField(c: Client, lat: number, lon: number) {
  const [w, s, e, n] = c.bbox;
  const clat = Math.min(Math.max(lat, s), n);
  const clon = Math.min(Math.max(lon, w), e);
  return km(lat, lon, clat, clon);
}

export function assess(c: Client, fires: Fire[]): Assessment {
  const withD = fires.map((f) => ({ f, d: distToField(c, f.lat, f.lon) }));
  const inField = withD.filter((x) => x.d <= IN_FIELD_KM).map((x) => x.f);
  const near = withD.filter((x) => x.d > IN_FIELD_KM && x.d <= WATCH_KM).sort((a, b) => a.d - b.d).map((x) => x.f);
  const nearestKm = withD.length ? Math.min(...withD.map((x) => x.d)) : null;
  const pool = inField.length ? inField : near;
  const last = pool.length ? new Date(Math.max(...pool.map((f) => Date.parse(f.t)))) : null;
  const level: Level = inField.length ? "atencion" : c.onchain ? "siniestro" : near.length ? "vigilancia" : "ok";
  return { level, inField, near, nearestKm, last };
}

export const LEVEL_ORDER: Record<Level, number> = { atencion: 0, siniestro: 1, vigilancia: 2, ok: 3 };

export const usd = (n: number) => `USD ${Math.round(n).toLocaleString("es-AR")}`;
