"use client";

import { useEffect, useRef } from "react";
import { Satellite, X } from "lucide-react";
import { SAT_INFO, tleOrbit } from "@/lib/satinfo";
import { ago, type Fire, type SatDef, type SatNow } from "@/lib/sky";

const tz = "America/Argentina/Buenos_Aires";
const hm = (d: Date) => d.toLocaleTimeString("es-AR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
const dayHm = (d: Date) => d.toLocaleString("es-AR", { timeZone: tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const num = (v: number, d = 0) => v.toLocaleString("es-AR", { maximumFractionDigits: d, minimumFractionDigits: d });

/** Ficha de un satélite: foto real, datos de catálogo, órbita del TLE y lo que aportó en las últimas 48 h. */
export function SatModal({ sat, def, pass, fires, now, onClose }: {
  sat: SatNow; def?: SatDef; pass: Date | null; fires: Fire[]; now: Date; onClose: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const info = SAT_INFO[sat.name];
  const orbit = def ? tleOrbit(def) : null;
  const mine = fires.filter((f) => f.sat === sat.name).sort((a, b) => Date.parse(b.t) - Date.parse(a.t));
  const last = mine[0] ? new Date(mine[0].t) : null;
  const geo = sat.kind === "geo";

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus(); };
  }, [onClose]);

  const status = geo
    ? { cls: "bg-white/15 text-[#e6edf7]", txt: "Fijo sobre América" }
    : sat.inSaa ? { cls: "bg-[#ff5a4e] text-white", txt: "▲ En la Anomalía" } : { cls: "bg-[#e2f2ea] text-[#0b7d55]", txt: "✓ Apto para calcular" };
  const kpis: [string, string, string][] = [
    ["Altura", `${num(sat.altKm)} km`, geo ? "órbita geoestacionaria" : "órbita polar"],
    ["Velocidad", `${num(sat.speedKms, 2)} km/s`, `${num(sat.speedKms * 3600)} km/h`],
    [geo ? "Sobre el NOA" : "Próxima pasada", geo ? "siempre" : sat.overNoa ? "ahora" : pass ? hm(pass) : "—", geo ? "mira la región sin parar" : sat.overNoa ? "está viendo el NOA" : pass ? `en ${Math.max(0, Math.round((pass.getTime() - now.getTime()) / 60_000))} min` : ""],
    ["Focos en 48 h", num(mine.length), last ? `último ${ago(last, now)}` : "ninguno en el NOA"],
  ];

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#02050a]/55 p-3 backdrop-blur-[6px] md:overflow-hidden md:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="sat-titulo"
        className="lg lg-strong theme-dark my-auto flex w-full max-w-[900px] flex-col gap-4 rounded-[28px] p-4 md:max-h-[calc(100dvh-40px)] md:overflow-hidden md:p-6">
        <header className="flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className={`grid h-11 w-11 place-items-center rounded-full border ${sat.inSaa ? "border-[#ff5a4e] text-[#ff5a4e]" : "border-[#3dd6f5] text-[#3dd6f5]"} bg-white/5`}><Satellite size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="sat-titulo" className="text-[22px] font-semibold tracking-tight">{sat.name}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${status.cls}`}>{status.txt}</span>
              <span className="rounded-full bg-[#34d399]/15 px-2.5 py-0.5 text-[11.5px] font-medium text-[#6ee7b7]">✓ Satélite real · posición en vivo</span>
            </div>
            <p className="text-[12.5px] text-muted">{info?.alias} · {info?.operator} · NORAD {sat.norad} · {info?.sensor}</p>
          </div>
          <a href={`https://celestrak.org/satcat/table-satcat.php?CATNR=${sat.norad}`} target="_blank" rel="noreferrer"
            className="rounded-full border border-white/30 bg-white/[0.06] px-3 py-2 text-[12.5px] font-medium hover:bg-white/15">Ficha en CelesTrak ↗</a>
          <button data-autofocus onClick={onClose} aria-label="Cerrar satélite" className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 hover:bg-white/20"><X size={16} /></button>
        </header>

        <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {kpis.map(([l, v, s]) => (
            <div key={l} className="lg-tile rounded-[14px] px-3.5 py-3">
              <dt className="text-[11.5px] text-muted">{l}</dt>
              <dd className="mt-0.5 font-mono text-[21px] font-semibold leading-tight">{v}</dd>
              <dd className="text-[11.5px] text-muted">{s}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-5 md:min-h-0 md:flex-1 md:grid-cols-[360px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
          <div className="scroll-thin flex flex-col gap-3 md:min-h-0 md:overflow-y-auto md:pr-1">
            {info && (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={info.image} alt={`Imagen de ${info.name} (${info.alias}) de ${info.operator}`} className="aspect-[16/10] w-full rounded-2xl border border-white/15 bg-black object-cover" />
                <figcaption className="mt-1.5 text-[11px] text-muted">
                  Ilustración oficial · {info.imageCredit} · <a className="text-[#7dd3fc] hover:underline" href={info.imageSource} target="_blank" rel="noreferrer">fuente ↗</a>
                </figcaption>
              </figure>
            )}
            <section aria-labelledby="sat-ficha" className="lg-tile rounded-[14px] px-3.5 py-3">
              <h3 id="sat-ficha" className="text-[13px] font-semibold">Ficha</h3>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <dt className="text-muted">Operador</dt><dd className="text-right">{info?.operator}</dd>
                <dt className="text-muted">Lanzamiento</dt><dd className="text-right">{info?.launched}</dd>
                <dt className="text-muted">Instrumentos</dt><dd className="text-right">{info?.instruments}</dd>
                {orbit && <>
                  <dt className="text-muted">Inclinación</dt><dd className="text-right font-mono">{num(orbit.inclination, 2)}°</dd>
                  <dt className="text-muted">Una vuelta</dt><dd className="text-right font-mono">{geo ? "24 h (acompaña la Tierra)" : `${num(orbit.periodMin, 1)} min · ${num(orbit.revsPerDay, 1)} por día`}</dd>
                  <dt className="text-muted">Datos orbitales</dt><dd className="text-right">TLE de CelesTrak del {dayHm(orbit.epoch)}</dd>
                </>}
              </dl>
            </section>
          </div>

          <div className="scroll-thin flex min-w-0 flex-col gap-3 md:min-h-0 md:overflow-y-auto md:pr-1">
            <section className="lg-tile rounded-[14px] px-3.5 py-3">
              <h3 className="text-[13px] font-semibold">Qué aporta a la cartera</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-[#d5deea]">{info?.role}</p>
            </section>

            <section className={`rounded-[14px] border px-3.5 py-3 ${geo ? "border-white/15 bg-white/[0.05]" : sat.inSaa ? "border-[#ff5a4e]/50 bg-[#ff5a4e]/12" : "border-[#34d399]/40 bg-[#34d399]/10"}`}>
              <h3 className="text-[13px] font-semibold">Decisión para PUNA</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-[#d5deea]">
                {geo
                  ? "No se le asignan cálculos de área quemada: está fijo y lejos. Se usa solo para detectar fuego rápido."
                  : sat.inSaa
                    ? "Ahora pasa por la Anomalía del Atlántico Sur. Si hubiera que medir un campo, se le asigna a otro satélite hasta que salga de la zona de radiación."
                    : "Está fuera de la Anomalía: puede recibir el cálculo del área quemada. Igual, un auditor de otra empresa revisa el resultado antes de pagar."}
              </p>
            </section>

            <section className="lg-tile rounded-[14px] px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[13px] font-semibold">Ahora</h3>
                <span className="font-mono text-[11px] text-muted">SGP4 · se actualiza cada segundo</span>
              </div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <dt className="text-muted">Posición</dt><dd className="text-right font-mono">{num(sat.lat, 2)}°, {num(sat.lon, 2)}°</dd>
                <dt className="text-muted">Anomalía</dt><dd className={`text-right ${sat.inSaa ? "text-[#ff9b92]" : ""}`}>{geo ? "no aplica (35.786 km)" : sat.inSaa ? "dentro, ahora" : "fuera, ahora"}</dd>
                <dt className="text-muted">Sobre el NOA</dt><dd className="text-right">{geo ? "siempre" : sat.overNoa ? "pasando ahora" : pass ? `vuelve ${dayHm(pass)}` : "—"}</dd>
              </dl>
            </section>

            <section className="lg-tile rounded-[14px] px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[13px] font-semibold">Lo que vio en el NOA · 48 h</h3>
                <span className="font-mono text-[11px] text-muted">NASA FIRMS</span>
              </div>
              {mine.length ? (
                <table className="mt-1.5 w-full text-left text-[11.5px]">
                  <thead className="text-[10.5px] text-muted"><tr><th className="py-1 font-medium">Hora</th><th className="font-medium">Posición</th><th className="text-right font-medium">Potencia</th></tr></thead>
                  <tbody className="font-mono">
                    {mine.slice(0, 6).map((f, i) => (
                      <tr key={i} className="border-t border-white/10"><td className="py-1">{dayHm(new Date(f.t))}</td><td>{num(f.lat, 3)}°, {num(f.lon, 3)}°</td><td className="text-right">{num(f.frp, 1)} MW</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="mt-1 text-[12px] text-muted">No reportó puntos de calor en el NOA en las últimas 48 h.</p>}
              {mine.length > 6 && <p className="mt-1 text-[11px] text-muted">y {num(mine.length - 6)} más</p>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
