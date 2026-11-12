"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, LevelBadge } from "@/components/Shell";
import { FieldImage } from "@/components/FieldImage";
import { useFires } from "@/components/useFires";
import { int } from "@/lib/format";
import { CLIENTS, LEVEL_ORDER, WATCH_KM, assess, sumInsured, usd, type Level } from "@/lib/portfolio";
import { ago } from "@/lib/sky";
import { demo } from "@/lib/data";

type Filter = "todos" | Level;
const FILTERS: [Filter, string][] = [["todos", "Todos"], ["atencion", "Atención"], ["vigilancia", "Vigilancia"], ["siniestro", "Siniestros"], ["ok", "Sin novedades"]];
const TONE = { atencion: "bad", siniestro: "info", vigilancia: "warn", ok: "ok" } as const;

export default function Cartera() {
  const firms = useFires();
  const [filter, setFilter] = useState<Filter>("todos");
  const ready = !firms.loading;

  const rows = useMemo(
    () =>
      CLIENTS.map((c) => ({ c, a: assess(c, firms.fires) }))
        .sort((x, y) => LEVEL_ORDER[x.a.level] - LEVEL_ORDER[y.a.level] || y.a.inField.length - x.a.inField.length || (x.a.nearestKm ?? 1e9) - (y.a.nearestKm ?? 1e9)),
    [firms.fires],
  );
  const count = (l: Level) => rows.filter((r) => r.a.level === l).length;
  const shown = rows.filter((r) => filter === "todos" || r.a.level === filter);
  const totalHa = CLIENTS.reduce((s, c) => s + c.ha, 0);
  const totalUsd = CLIENTS.reduce((s, c) => s + sumInsured(c), 0);
  const exposed = rows.filter((r) => r.a.level === "atencion").reduce((s, r) => s + sumInsured(r.c), 0);
  const now = firms.now ?? new Date(0);

  return (
    <AppShell>
      <main id="main" className="mx-auto grid max-w-[1400px] gap-4 px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-semibold tracking-tight">Cartera · incendio paramétrico</h1>
            <p className="mt-0.5 text-[13px] text-muted">
              {CLIENTS.length} campos asegurados en el NOA · estado según focos NASA FIRMS de las últimas 48 h
            </p>
          </div>
          <p className="font-mono text-[11.5px] text-muted" aria-live="polite">
            {firms.loading ? "Consultando FIRMS…" : firms.error
              ? <span className="text-warn">▲ {firms.error}</span>
              : <span className="text-ok">● FIRMS en vivo · {int(firms.fires.length)} focos en el NOA · {firms.at?.toLocaleTimeString("es-AR", { hour12: false, timeZone: "America/Argentina/Buenos_Aires" })}</span>}
          </p>
        </div>

        {ready && count("atencion") > 0 && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-bad/30 bg-bad-bg px-4 py-3">
            <LevelBadge level="atencion" />
            <p className="text-[13.5px]">
              <strong>{count("atencion")} {count("atencion") === 1 ? "campo tiene" : "campos tienen"} fuego detectado dentro del lote.</strong>{" "}
              Exposición: {usd(exposed)}. Abrí cada ficha para ver las imágenes y pedir el índice verificado.
            </p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ["Campos", int(CLIENTS.length)],
            ["Hectáreas", int(totalHa)],
            ["Suma asegurada", usd(totalUsd)],
            ["En atención", ready ? int(count("atencion")) : "…"],
            ["En vigilancia", ready ? int(count("vigilancia")) : "…"],
          ].map(([k, v]) => (
            <div key={k} className="glass rounded-2xl px-4 py-3">
              <dt className="text-[11.5px] text-muted">{k}</dt>
              <dd className="mt-0.5 font-mono text-[20px] font-semibold tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>

        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-1.5">
          {FILTERS.map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={`rounded-full px-3 py-1 text-[12.5px] ${filter === f ? "bg-[#0e1b2c] text-white" : "glass-raised"}`}>
              {label}{f !== "todos" && ready ? ` · ${count(f)}` : ""}
            </button>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map(({ c, a }) => (
            <li key={c.id}>
              <Link href={`/cartera/${c.id}`}
                className={`glass group block overflow-hidden rounded-[20px] transition hover:-translate-y-0.5 hover:shadow-xl ${a.level === "atencion" ? "ring-2 ring-bad/70" : ""}`}>
                <div className="relative">
                  <FieldImage bbox={c.bbox} fires={[...a.inField, ...a.near]} tone={TONE[a.level]} px={420} className="aspect-[16/10]"
                    alt={`Imagen satelital de ${c.field}`} />
                  <LevelBadge level={ready ? a.level : "cargando"} className="absolute top-2.5 left-2.5 shadow" />
                  {c.onchain && <span className="absolute top-2.5 right-2.5 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10.5px] text-white">Fuji · job {demo.job.id}</span>}
                </div>
                <div className="p-3.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="truncate text-[15px] font-semibold">{c.field}</h2>
                    <span className="shrink-0 font-mono text-[11px] text-muted">{c.policy.split(" · ")[0]}</span>
                  </div>
                  <p className="truncate text-[12.5px] text-muted">{c.place}</p>
                  <p className="mt-1.5 text-[12.5px]">{c.crop} · {int(c.ha)} ha · {usd(sumInsured(c))}</p>
                  <p className={`mt-1.5 text-[12px] ${a.level === "atencion" ? "font-medium text-bad" : a.level === "vigilancia" ? "text-warn" : "text-muted"}`}>
                    {!ready ? "Consultando focos…"
                      : a.level === "atencion" ? `${a.inField.length} focos dentro del campo · último ${ago(a.last!, now)}`
                      : a.level === "siniestro" ? `Incendio del 8–11/11 · ${demo.job.state === "Paid" ? "pagado tras la auditoría" : demo.job.state}`
                      : a.level === "vigilancia" ? `Foco a ${a.nearestKm!.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km · ${a.near.length} en ${WATCH_KM} km`
                      : a.nearestKm !== null ? `Foco más cercano a ${Math.round(a.nearestKm)} km` : "Sin focos en el NOA"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-[11.5px] leading-snug text-muted">
          <strong className="text-warn">▲ Simulado:</strong> la aseguradora, los productores, sus campos y pólizas (salvo el Lote 14, con póliza en PunaEscrow).{" "}
          <strong className="text-ok">✓ Real:</strong> los focos NASA FIRMS y su distancia a cada campo, y las imágenes Sentinel-2 (EOX) y VIIRS (NASA GIBS).
          Un foco a ≤ 1 km del borde cuenta como dentro del campo; a ≤ {WATCH_KM} km, vigilancia.
        </p>
      </main>
    </AppShell>
  );
}
