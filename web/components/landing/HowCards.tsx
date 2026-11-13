"use client";

import { Check, Flame, X } from "lucide-react";
import { FieldImage } from "@/components/FieldImage";
import { demo } from "@/lib/data";
import { txUrl } from "@/lib/format";
import type { BBox } from "@/lib/imagery";
import { policyTxs } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import type { Fire } from "@/lib/sky";

/**
 * Versiones chicas de los componentes de la cartera, para las cards de "Cómo funciona".
 * Usan los mismos datos que el dashboard: focos FIRMS en vivo, la grilla del Lote 14 y el job 7 en Fuji.
 */

/** Paso 1: las alertas de la cartera, con los campos que tienen fuego adentro. */
export function AlertsMini({ fires, ready }: { fires: Fire[]; ready: boolean }) {
  const live = CLIENTS.map((c) => ({ c, n: assess(c, fires).inField.length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 2);
  const lot = CLIENTS.find((c) => c.onchain)!;
  const rows = live.length ? live.map(({ c, n }) => ({ c, txt: `${n} focos dentro del campo` }))
    : [{ c: lot, txt: `${demo.lot.foci.length} focos FIRMS · 8 al 11/11` }];
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b42318]">
        <span className="flex items-center gap-1 rounded-full bg-[#c4352b] px-1.5 py-0.5 text-[11.5px] text-white"><Flame size={10} strokeWidth={2.6} aria-hidden="true" /> Atención</span>
        {ready ? `${rows.length} ${rows.length === 1 ? "campo" : "campos"} con fuego` : "Leyendo NASA FIRMS…"}
      </p>
      {rows.map(({ c, txt }) => (
        <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-[#c4352b]/60 bg-[#c4352b]/10 p-1.5">
          <FieldImage bbox={c.bbox} fires={fires} tone="bad" px={160} className="h-11 w-12 shrink-0 rounded-lg" alt={`Imagen satelital de ${c.field}`} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-semibold">{c.field}</p>
            <p className="truncate text-[11.5px] text-[#33506e]">{c.place}</p>
            <p className="truncate text-[11.5px] text-[#b42318]">{txt}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Paso 2: el Lote 14 como en la ficha de la cartera: Sentinel-2, contorno del lote, focos FIRMS y el KPI de área quemada. */
export function GridMini({ pct, trigger }: { pct: string; trigger: string }) {
  const [w, s, e, n] = demo.lot.bbox;
  const fires: Fire[] = demo.lot.foci.map((f) => ({
    lat: n - f.y * (n - s), lon: w + f.x * (e - w), sat: f.sat, source: "FIRMS", t: f.date, frp: f.frp, confidence: f.confidence,
  }));
  return (
    <div className="flex h-full items-center gap-3 p-3">
      <div className="relative aspect-square h-full shrink-0 overflow-hidden rounded-xl">
        <FieldImage bbox={demo.lot.bbox as BBox} fires={fires} tone="bad" pad={0.12} px={400} className="h-full w-full"
          alt={`Imagen Sentinel-2 del Lote 14 con ${fires.length} focos de fuego vistos por la NASA`} />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-1.5 py-px text-[11px] font-medium text-[#0e1b2c]">Sentinel-2</span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[11.5px] leading-tight text-[#33506e]">Área quemada</p>
        <p className="whitespace-nowrap text-[20px] font-semibold tabular-nums leading-none text-[#b54708]">{pct}</p>
        <p className="text-[11.5px] leading-tight text-[#33506e]">supera el {trigger} pactado</p>
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[#33506e]"><i className="h-2 w-2 rounded-full bg-[#ea6a12]" /> {fires.length} focos</p>
      </div>
    </div>
  );
}

/** Paso 3: la auditoría capa por capa, intento 1 contra intento 2. */
export function AuditMini() {
  const [a, b] = demo.attempts;
  const layers = (a.certificate?.checks ?? []).filter((c) => c.name.endsWith(": Freivalds"));
  const okOf = (at: typeof a, name: string) => at.certificate?.checks.find((c) => c.name === name)?.ok;
  const Cell = ({ ok }: { ok?: boolean }) => ok
    ? <span className="flex items-center gap-1 text-[#0b7d55]"><Check size={11} strokeWidth={3} aria-hidden="true" />ok</span>
    : <span className="flex items-center gap-1 text-[#b42318]"><X size={11} strokeWidth={3} aria-hidden="true" />falla</span>;
  return (
    <table className="h-full w-full text-left text-[11.5px]">
      <caption className="sr-only">Auditoría de Freivalds por capa, dos intentos</caption>
      <thead className="text-[11px] text-[#33506e]">
        <tr><th className="px-3 pb-1 pt-2.5 font-normal">Capa</th><th className="pb-1 pt-2.5 font-normal">Intento 1</th><th className="pb-1 pt-2.5 font-normal">Intento 2</th></tr>
      </thead>
      <tbody>
        {layers.map((l) => (
          <tr key={l.name} className={`border-t border-[#0b2440]/10 ${okOf(a, l.name) ? "" : "bg-[#b42318]/[0.07]"}`}>
            <td className="px-3 py-[3px] text-[#0b2440]">{l.name.split(":")[0].replace(/ (conv|lineal).*/, "")} · Freivalds</td>
            <td><Cell ok={okOf(a, l.name)} /></td>
            <td><Cell ok={okOf(b, l.name)} /></td>
          </tr>
        ))}
        <tr className="border-t border-[#0b2440]/15 font-semibold">
          <td className="px-3 py-1 text-[11px]">Puntaje</td>
          <td><span className="rounded bg-[#b42318]/10 px-1 py-0.5 text-[#b42318]">{a.score}/100</span></td>
          <td><span className="rounded bg-[#0b7d55]/10 px-1 py-0.5 text-[#0b7d55]">{b.score}/100</span></td>
        </tr>
      </tbody>
    </table>
  );
}

/** Paso 4: los últimos comprobantes del job en Avalanche, hasta el pago. */
export function TxMini({ explorer }: { explorer: string }) {
  const lot = CLIENTS.find((c) => c.onchain)!;
  const rows = policyTxs(lot).filter((r) => /JobRejected|ResultSubmitted|ValidationResponse|Payout/.test(r.tech)).slice(-4);
  const label = (t: string) => t.replace(/^[✓✕×]\s*/, "").replace(" y baja la reputación", "").replace("El auditor respondió:", "Auditor:").replace(" quemado", "");
  return (
    <ul className="flex h-full flex-col justify-center gap-1 p-2.5">
      {rows.map((r) => (
        <li key={r.hash} className={`grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] ${r.tone === "bad" ? "bg-[#b42318]/[0.07]" : r.tone === "ok" ? "bg-[#0b7d55]/10" : ""}`}>
          <span className={`truncate ${r.tone === "bad" ? "text-[#b42318]" : r.tone === "ok" ? "font-semibold text-[#0b7d55]" : "text-[#0b2440]"}`}>{label(r.what)}</span>
          <a href={txUrl(explorer, r.hash)} target="_blank" rel="noreferrer" className="rounded bg-[#0b6cb8]/10 px-1 text-[11.5px] text-[#0b6cb8] hover:text-[#0b2440]">{r.hash.slice(0, 6)} ↗</a>
        </li>
      ))}
    </ul>
  );
}
