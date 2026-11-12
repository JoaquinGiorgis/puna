"use client";

import { Satellite } from "lucide-react";
import { ago, type Fire, type SatNow } from "@/lib/sky";
import { satOnMap } from "@/lib/globe-noa";

const SENSOR: Record<string, string> = {
  "NOAA-20": "VIIRS · 375 m", "NOAA-21": "VIIRS · 375 m", Terra: "MODIS · 1 km", Aqua: "MODIS · 1 km", "GOES-19": "ABI · cada 10 min",
};
const hm = (d: Date) => d.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Fuentes de datos: los satélites reales de donde sale la información, con su estado para decidir.
 * Un satélite dentro de la Anomalía del Atlántico Sur no recibe cálculos (la radiación puede alterarlos).
 */
export function SatPanel({ sats, passes, fires, now, onHover, onOpen }: {
  sats: SatNow[]; passes: Record<string, Date | null>; fires: Fire[]; now: Date; onHover: (name: string | null) => void; onOpen: (name: string) => void;
}) {
  const last = new Map<string, Date>();
  for (const f of fires) { const t = new Date(f.t); if (!last.has(f.sat) || last.get(f.sat)! < t) last.set(f.sat, t); }
  const order = [...sats].sort((a, b) => Number(b.inSaa) - Number(a.inSaa) || Number(b.overNoa) - Number(a.overNoa) || a.name.localeCompare(b.name));
  const inSaa = sats.filter((x) => x.inSaa).length;

  return (
    <section aria-labelledby="fuentes" className="lg pointer-events-auto w-[320px] shrink-0 rounded-2xl px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="fuentes" className="text-[13px] font-semibold">Fuentes de datos</h2>
        <span className="font-mono text-[10.5px] text-muted">satélites en vivo · SGP4</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">
        {inSaa
          ? `${inSaa} ${inSaa === 1 ? "satélite está" : "satélites están"} en la Anomalía: no ${inSaa === 1 ? "recibe" : "reciben"} cálculos hasta salir.`
          : "Ahora ninguno está en la Anomalía: todos pueden calcular."}
      </p>
      <ul className="mt-2 grid gap-1">
        {order.map((x) => {
          const pass = passes[x.name];
          const lf = last.get(x.name);
          return (
            <li key={x.name}>
              <button type="button" onClick={() => onOpen(x.name)} onMouseEnter={() => onHover(x.name)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(x.name)} onBlur={() => onHover(null)}
              title={`${SENSOR[x.name] ?? ""} · ver ficha`}
              className={`block w-full rounded-lg border px-2 py-1 text-left transition hover:bg-white/10 ${x.inSaa ? "border-[#ff5a4e]/50 bg-[#ff5a4e]/12" : "border-white/10 bg-white/[0.04]"}`}>
              <div className="flex items-center gap-1.5">
                <Satellite aria-hidden="true" size={13} strokeWidth={2.2} className="shrink-0" color={x.inSaa ? "#ff5a4e" : "#3dd6f5"} />
                <span className="whitespace-nowrap text-[12px] font-semibold">{x.name}</span>
                <span className="truncate text-[10.5px] text-muted">{SENSOR[x.name] ?? ""}</span>
                <span className={`ml-auto shrink-0 whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-medium ${
                  x.kind === "geo" ? "bg-white/10 text-[#d5deea]" : x.inSaa ? "bg-[#ff5a4e] text-white" : "bg-[#34d399]/20 text-[#6ee7b7]"}`}>
                  {x.kind === "geo" ? "fijo" : x.inSaa ? "▲ en la Anomalía" : "✓ apto"}
                </span>
              </div>
              <p className="truncate pl-[19px] text-[10.5px] text-muted">
                {satOnMap(x) ? "en el mapa · " : "fuera del mapa · "}
                {x.kind === "geo" ? "mira el NOA siempre" : x.overNoa ? "sobre el NOA ahora" : pass ? `vuelve ${hm(pass)}` : "—"}
                {" · "}{lf ? `último foco ${ago(lf, now)}` : "sin focos en 48 h"}
              </p>
              </button>
            </li>
          );
        })}
        {sats.length === 0 && <li className="text-[11px] text-muted">Cargando órbitas…</li>}
      </ul>
      <p className="mt-1.5 text-[10px] leading-snug text-muted"><b className="font-medium text-[#6ee7b7]">✓ apto</b>: puede recibir cálculos · <b className="font-medium text-[#ff9b92]">▲ en la Anomalía</b>: se releva a otro satélite</p>
    </section>
  );
}
