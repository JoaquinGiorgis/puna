"use client";

import { INSURED } from "@/lib/insured";
import { useEffect, useRef } from "react";
import { LevelBadge } from "@/components/Shell";
import { ALL_ICON, LEVEL_ICON } from "@/components/icons";
import { int } from "@/lib/format";
import { CLIENTS, WATCH_KM, sumInsured, usd, type Level } from "@/lib/portfolio";
import { ago } from "@/lib/sky";
import { eoxUrl, frame } from "@/lib/imagery";
import type { Row } from "./GlobeView";

export type Filter = "todos" | Level;
const FILTERS: [Filter, string, string][] = [["todos", "Todos", "Todos los campos"], ["atencion", "Atención", "Atención: fuego en el lote"], ["vigilancia", "Vigilancia", "Vigilancia: fuego a 15 km o menos"], ["ok", "Al día", "Al día: sin novedades"]];

function statusLine({ a }: Row, now: Date) {
  if (a.level === "atencion") return { cls: "text-[#ff8a80] font-medium", t: `${a.inField.length} focos dentro del campo · último ${ago(a.last!, now)}` };
  if (a.level === "siniestro") return { cls: "text-[#7dd3fc]", t: "Incendio 8–11/11 · auditado on-chain" };
  if (a.level === "vigilancia") return { cls: "text-[#f5c46b]", t: `Foco a ${a.nearestKm!.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km · ${a.near.length} en ${WATCH_KM} km` };
  return { cls: "text-muted", t: a.nearestKm !== null ? `Foco más cercano a ${Math.round(a.nearestKm)} km` : "Sin focos en el NOA" };
}

/** Panel lateral (abajo en mobile): resumen, alerta, buscador, filtros y la lista de campos. */
export function ClientPanel({ rows, ready, now, query, setQuery, filter, setFilter, selected, onOpen, onHover }: {
  rows: Row[]; ready: boolean; now: Date; query: string; setQuery: (q: string) => void;
  filter: Filter; setFilter: (f: Filter) => void; selected: string | null; onOpen: (id: string) => void; onHover: (id: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName)) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const count = (l: Level) => rows.filter((r) => r.a.level === l).length;
  const q = query.trim().toLowerCase();
  const shown = rows.filter((r) => (filter === "todos" || r.a.level === filter) &&
    (!q || `${r.c.field} ${r.c.place} ${r.c.policy} ${r.c.crop} ${INSURED[r.c.id]?.name ?? ""} ${INSURED[r.c.id]?.contact.name ?? ""}`.toLowerCase().includes(q)));
  const att = rows.filter((r) => r.a.level === "atencion");
  const totalUsd = CLIENTS.reduce((s, c) => s + sumInsured(c), 0);

  return (
    <aside aria-labelledby="cartera-titulo"
      className="lg pointer-events-auto flex max-h-[52dvh] w-full flex-col gap-3 rounded-[26px] p-4 md:max-h-none md:w-[392px] md:p-5">
      <header>
        <div className="flex items-baseline justify-between gap-2">
          <h1 id="cartera-titulo" className="text-[21px] font-semibold tracking-tight">Cartera</h1>
          <span className="font-mono text-[12px] text-muted">{CLIENTS.length} campos</span>
        </div>
        <p className="text-[12px] text-muted">Incendio paramétrico · NOA · {usd(totalUsd)} asegurados</p>
      </header>

      {ready && att.length > 0 && (
        <div role="alert" className="flex items-center gap-2.5 rounded-2xl border border-[#ff5a4e]/35 bg-[#ff5a4e]/15 px-3 py-2.5">
          <LevelBadge level="atencion" />
          <p className="text-[12px] font-medium text-[#ff9b92]">
            {att.length} {att.length === 1 ? "campo" : "campos"} con fuego dentro del lote · {usd(att.reduce((s, r) => s + sumInsured(r.c), 0))} expuestos
          </p>
        </div>
      )}

      <label className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/[0.07] px-3 py-2 focus-within:border-[#3dd6f5]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeOpacity=".7" strokeWidth="2" /><path d="m20 20-3.5-3.5" stroke="currentColor" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" /></svg>
        <span className="sr-only">Buscar en la cartera</span>
        <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar productor, póliza o localidad"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-muted focus:outline-none" />
        {query ? (
          <button onClick={() => setQuery("")} className="rounded-md px-1.5 text-[12px] text-muted hover:text-ink" aria-label="Borrar búsqueda">✕</button>
        ) : (
          <kbd className="rounded-md border border-white/30 bg-white/10 px-1.5 font-mono text-[11px] text-muted">/</kbd>
        )}
      </label>

      <div role="group" aria-label="Filtrar por estado" className="flex gap-0.5 rounded-xl border border-white/15 bg-white/[0.05] p-0.5">
        {FILTERS.map(([f, label, title]) => {
          const on = filter === f;
          const n = f === "todos" ? rows.length : count(f);
          const I = f === "todos" ? ALL_ICON : LEVEL_ICON[f];
          const tint = f === "atencion" ? "text-[#ff8a80]" : f === "vigilancia" ? "text-[#f5c46b]" : f === "ok" ? "text-[#6ee7b7]" : "";
          return (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={on} title={title} aria-label={`${title} (${n})`}
              className={`flex flex-auto items-center justify-center gap-1 whitespace-nowrap rounded-[10px] px-1.5 py-1.5 text-[11.5px] font-medium transition ${on ? "bg-white text-[#0e1b2c]" : "text-ink hover:bg-white/10"}`}>
              <I aria-hidden="true" size={13} strokeWidth={2.2} className={`shrink-0 ${on ? "" : tint}`} />
              <span>{label}</span>
              {(ready || f === "todos") && <span className={`font-mono text-[10.5px] ${on ? "text-[#4d5d73]" : "text-muted"}`}>{n}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11.5px] text-muted">
        <span>Ordenado por urgencia</span>
        <span className="font-mono" aria-live="polite">{shown.length} de {rows.length}</span>
      </div>

      <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-1 pb-1">
        {shown.map((r) => {
          const { c, a } = r;
          const s = statusLine(r, now);
          const sel = selected === c.id;
          return (
            <li key={c.id}>
              <button onClick={() => onOpen(c.id)} onMouseEnter={() => onHover(c.id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(c.id)} onBlur={() => onHover(null)}
                className={`flex w-full items-center gap-3 rounded-[18px] p-2.5 text-left transition hover:bg-white/[0.12] ${
                  a.level === "atencion" ? "border-[1.5px] border-[#ff5a4e]/85 bg-white/[0.1]" : "border border-white/15 bg-white/[0.06]"
                } ${sel ? "ring-2 ring-[#3dd6f5]" : ""} shadow-[inset_0_1px_0_rgb(255_255_255/0.16)]`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={eoxUrl(frame(c.bbox, 0.35), 200)} alt="" loading="lazy" className="h-[72px] w-[72px] shrink-0 rounded-xl bg-[#1d2a1f] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{c.field}</span>
                    <LevelBadge level={ready ? a.level : "cargando"} />
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">{c.place} · {c.policy.split(" · ")[0]}</span>
                  <span className="block truncate font-mono text-[11.5px]">{c.crop} · {int(c.ha)} ha · {usd(sumInsured(c))}</span>
                  <span className={`block truncate text-[11.5px] ${s.cls}`}>{ready ? s.t : "Consultando FIRMS…"}</span>
                </span>
              </button>
            </li>
          );
        })}
        {shown.length === 0 && <li className="rounded-xl border border-white/15 p-4 text-center text-[12.5px] text-muted">Ningún campo coincide con “{query}”.</li>}
      </ul>
    </aside>
  );
}
