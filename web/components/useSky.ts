"use client";

import { useEffect, useMemo, useState } from "react";
import { nextPass, satsNow, zones, type Fire, type SatDef } from "@/lib/sky";

export type SkyState = {
  now: Date;
  mounted: boolean;
  defs: SatDef[];
  tleSource: string;
  fires: Fire[];
  firesAt: Date | null;
  firesError: string | null;
};

/**
 * Cielo en vivo para el globo: TLE (cada 2 h) y focos FIRMS (cada 5 min) desde las rutas del servidor,
 * y un reloj que recalcula las posiciones cada segundo (cada 10 s con prefers-reduced-motion).
 */
export function useSky(lotBbox: number[], enabled: boolean) {
  // el reloj arranca en el cliente: inicializar con la hora del servidor rompe la hidratación
  const [s, setS] = useState<SkyState>({ now: new Date(0), mounted: false, defs: [], tleSource: "", fires: [], firesAt: null, firesError: null });

  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    const loadTle = async () => {
      try {
        const j = await (await fetch("/api/tle")).json();
        if (!stop) setS((p) => ({ ...p, tleSource: j.source, defs: Object.entries(j.sats).map(([name, v]) => ({ name, ...(v as Omit<SatDef, "name">) })) }));
      } catch {
        /* sin TLE no hay satélites en vivo; el resto sigue */
      }
    };
    const loadFires = async () => {
      try {
        const r = await fetch("/api/fires");
        const j = await r.json();
        if (!stop) setS((p) => ({ ...p, fires: r.ok ? j.fires : p.fires, firesAt: r.ok ? new Date(j.fetchedAt) : p.firesAt, firesError: r.ok ? null : j.error }));
      } catch {
        if (!stop) setS((p) => ({ ...p, firesError: "sin conexión con FIRMS" }));
      }
    };
    setS((p) => ({ ...p, now: new Date(), mounted: true }));
    loadTle();
    loadFires();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clock = setInterval(() => setS((p) => ({ ...p, now: new Date() })), reduce ? 10_000 : 1_000);
    const t1 = setInterval(loadTle, 2 * 3600_000);
    const t2 = setInterval(loadFires, 5 * 60_000);
    return () => {
      stop = true;
      clearInterval(clock);
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [enabled]);

  const sats = useMemo(() => satsNow(s.defs, s.now), [s.defs, s.now]);
  const zs = useMemo(() => zones(s.fires, lotBbox), [s.fires, lotBbox]);
  // la próxima pasada se recalcula cada minuto (es una búsqueda de hasta 14 h)
  const minute = Math.floor(s.now.getTime() / 60_000);
  const passes = useMemo(
    () => Object.fromEntries(s.defs.map((d) => [d.name, nextPass(d, new Date(minute * 60_000))])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s.defs, minute],
  );
  return { ...s, sats, zones: zs, passes };
}
