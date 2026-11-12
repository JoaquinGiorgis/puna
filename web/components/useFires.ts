"use client";

import { useEffect, useState } from "react";
import type { Fire } from "@/lib/sky";

export type FiresState = { fires: Fire[]; at: Date | null; error: string | null; loading: boolean; now: Date | null };

/** Focos FIRMS del NOA (hoy y ayer en UTC) desde /api/fires, refrescados cada 5 min. */
export function useFires(): FiresState {
  const [s, setS] = useState<FiresState>({ fires: [], at: null, error: null, loading: true, now: null });
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch("/api/fires");
        const j = await r.json();
        if (stop) return;
        setS((p) => ({
          fires: r.ok ? j.fires : p.fires,
          at: r.ok ? new Date(j.fetchedAt) : p.at,
          error: r.ok ? null : (j.error ?? "FIRMS no respondió"),
          loading: false,
          now: new Date(),
        }));
      } catch {
        if (!stop) setS((p) => ({ ...p, error: "sin conexión con FIRMS", loading: false, now: new Date() }));
      }
    };
    load();
    const t = setInterval(load, 5 * 60_000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, []);
  return s;
}
