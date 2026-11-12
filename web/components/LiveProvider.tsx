"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Demo } from "@/lib/data";
import { latestJobId, refresh } from "@/lib/live";

export type LiveStatus =
  | { kind: "snapshot" } // todavía no leyó la cadena
  | { kind: "live"; at: Date; pinned: boolean }
  | { kind: "offline"; reason: string };

const Ctx = createContext<{ demo: Demo; status: LiveStatus }>(null!);

export const useDemo = () => useContext(Ctx).demo;
export const useLive = () => useContext(Ctx).status;

const FINAL = new Set(["Paid", "NoPayout", "Refunded"]);

/**
 * Arranca con la foto exportada (demo.json) y la reemplaza por la lectura en vivo de Fuji.
 * ?job=N fija un job; si no, sigue al último del escrow (nextJobId − 1), así un e2e.py --demo
 * corrido en vivo aparece solo. Refresca cada 4 s mientras el job está en curso y cada 15 s al cerrar.
 * Si la red falla, se queda con lo último que tenía (o con la foto) y lo dice.
 */
export function LiveProvider({ snapshot, children }: { snapshot: Demo; children: ReactNode }) {
  const [demo, setDemo] = useState<Demo>(snapshot);
  const [status, setStatus] = useState<LiveStatus>({ kind: "snapshot" });

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const param = new URLSearchParams(window.location.search).get("job");
    const pinned = param && /^\d+$/.test(param) ? Number(param) : null;

    const tick = async () => {
      let next = 15_000;
      try {
        const jobId = pinned ?? (await latestJobId(snapshot.contracts.escrow as `0x${string}`));
        const res = await refresh(snapshot, jobId);
        if (stop) return;
        if (res) {
          setDemo(res);
          setStatus({ kind: "live", at: new Date(), pinned: pinned !== null });
          if (!FINAL.has(res.job.state)) next = 4_000;
        } else {
          setStatus({ kind: "offline", reason: `no encontré el createJob del job ${jobId} en Fuji` });
          next = 4_000;
        }
      } catch (e) {
        if (!stop) setStatus({ kind: "offline", reason: e instanceof Error ? e.message.split("\n")[0] : "sin respuesta" });
        next = 20_000; // si la RPC limita (429), no insistir
      }
      if (!stop) timer = setTimeout(tick, next);
    };
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [snapshot]);

  return <Ctx.Provider value={{ demo, status }}>{children}</Ctx.Provider>;
}
