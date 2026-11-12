import snapshot from "@/lib/tle/snapshot.json";

/**
 * TLE frescos de CelesTrak (GP) para los satélites que ven el NOA. CelesTrak limita a quien consulta
 * seguido: se cachea 2 h en el servidor y, si falla, se usa la copia guardada (lib/tle/snapshot.json).
 */
const IDS: Record<string, number> = { "NOAA-20": 43013, "NOAA-21": 54234, Terra: 25994, Aqua: 27424, "GOES-19": 60133 };
const TTL = 2 * 3600_000;

type Sat = { norad: number; line1: string; line2: string };
let cache: { at: number; sats: Record<string, Sat>; source: string } | null = null;

async function fetchOne(norad: number): Promise<Sat | null> {
  try {
    const r = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${norad}&FORMAT=TLE`, { cache: "no-store" });
    if (!r.ok) return null;
    const lines = (await r.text()).trim().split(/\r?\n/).map((l) => l.trim());
    if (lines.length < 3 || !lines[1].startsWith("1 ") || !lines[2].startsWith("2 ")) return null;
    return { norad, line1: lines[1], line2: lines[2] };
  } catch {
    return null;
  }
}

export async function GET() {
  if (!cache || Date.now() - cache.at > TTL) {
    const entries = await Promise.all(Object.entries(IDS).map(async ([name, id]) => [name, await fetchOne(id)] as const));
    const fresh = entries.every(([, s]) => s);
    const fallback = snapshot.sats as Record<string, Sat>;
    cache = {
      at: Date.now(),
      sats: Object.fromEntries(entries.map(([name, s]) => [name, s ?? fallback[name]])),
      source: fresh ? "CelesTrak (en vivo)" : `CelesTrak, copia del ${snapshot.fetched}`,
    };
  }
  return Response.json({ source: cache.source, fetchedAt: new Date(cache.at).toISOString(), sats: cache.sats });
}
