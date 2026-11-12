import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Focos de calor EN VIVO sobre el NOA desde NASA FIRMS (hoy y ayer, en UTC), de todos los satélites que lo cubren.
 * La MAP_KEY queda en el servidor: FIRMS_MAP_KEY del entorno o, en local, del .env de la raíz del repo.
 * Caché de 5 min (GOES-19 escanea cada 10 min; FIRMS publica con ~1 h de demora).
 */
const BBOX = "-68,-28,-62,-21.8"; // Salta, Jujuy, Tucumán y el oeste del Chaco salteño
const SOURCES = ["GOES_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"] as const;
const TTL = 5 * 60_000;

export type Fire = { lat: number; lon: number; sat: string; source: string; t: string; frp: number; confidence: string };
let cache: { at: number; fires: Fire[]; errors: string[] } | null = null;

const SAT_NAME: Record<string, string> = {
  N20: "NOAA-20", N21: "NOAA-21", N: "Suomi NPP", T: "Terra", A: "Aqua",
  G19: "GOES-19", G19FRP: "GOES-19", G18: "GOES-18", G16: "GOES-16", Met12: "Meteosat-12", Met11: "Meteosat-11", Met10: "Meteosat-10",
};

async function mapKey(): Promise<string | null> {
  if (process.env.FIRMS_MAP_KEY) return process.env.FIRMS_MAP_KEY;
  try {
    const env = await readFile(path.resolve(process.cwd(), "..", ".env"), "utf8");
    return /^FIRMS_MAP_KEY=([^\s#]+)/m.exec(env)?.[1] ?? null;
  } catch {
    return null;
  }
}

function parse(csv: string, source: string): Fire[] {
  const [head, ...rows] = csv.trim().split(/\r?\n/);
  if (!head?.startsWith("latitude")) return [];
  const cols = head.split(",");
  const ix = (k: string) => cols.indexOf(k);
  return rows.map((r) => r.split(",")).map((c) => {
    const time = c[ix("acq_time")].padStart(4, "0");
    return {
      lat: Number(c[ix("latitude")]), lon: Number(c[ix("longitude")]),
      sat: SAT_NAME[c[ix("satellite")]] ?? c[ix("satellite")], source,
      t: `${c[ix("acq_date")]}T${time.slice(0, 2)}:${time.slice(2)}:00Z`,
      frp: Number(c[ix("frp")]) || 0, confidence: c[ix("confidence")],
    };
  });
}

export async function GET() {
  if (!cache || Date.now() - cache.at > TTL) {
    const key = await mapKey();
    if (!key) return Response.json({ error: "falta FIRMS_MAP_KEY en el servidor" }, { status: 503 });
    const errors: string[] = [];
    const lists = await Promise.all(
      SOURCES.map(async (s) => {
        try {
          const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${s}/${BBOX}/2`, { cache: "no-store" });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return parse(await r.text(), s);
        } catch (e) {
          errors.push(`${s}: ${e instanceof Error ? e.message : "error"}`);
          return [];
        }
      }),
    );
    cache = { at: Date.now(), fires: lists.flat(), errors };
  }
  return Response.json({ bbox: BBOX, fetchedAt: new Date(cache.at).toISOString(), fires: cache.fires, errors: cache.errors });
}
