"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell, LevelBadge } from "@/components/Shell";
import { FieldImage } from "@/components/FieldImage";
import { GibsImage } from "@/components/DetailDrawer";
import { useFires } from "@/components/useFires";
import { demo } from "@/lib/data";
import { int, pct, txUrl } from "@/lib/format";
import { EOX_CREDIT, frame } from "@/lib/imagery";
import { CLIENTS, IN_FIELD_KM, WATCH_KM, assess, distToField, sumInsured, usd, type Client } from "@/lib/portfolio";
import { ago, type Fire } from "@/lib/sky";

const art = (d: Date) =>
  d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const TONE = { atencion: "bad", siniestro: "info", vigilancia: "warn", ok: "ok" } as const;

/** Focos FIRMS históricos del Lote 14 (8–11/11), guardados en demo.json en coordenadas de la grilla. */
function lot14Fires(): Fire[] {
  const [w, s, e, n] = demo.lot.bbox;
  return demo.lot.foci.map((f) => ({
    lat: n - f.y * (n - s), lon: w + f.x * (e - w), sat: f.sat === "N20" ? "NOAA-20" : f.sat === "N21" ? "NOAA-21" : f.sat,
    source: "VIIRS", t: `${f.date}T${f.time.slice(0, 2)}:${f.time.slice(2)}:00Z`, frp: f.frp, confidence: f.confidence,
  }));
}

export default function Ficha() {
  const { id } = useParams<{ id: string }>();
  const c = CLIENTS.find((x) => x.id === id);
  return (
    <AppShell crumbs={<><Link href="/cartera" className="hover:underline">Cartera</Link> <span aria-hidden="true">/</span> <span className="text-ink">{c?.field ?? "no encontrado"}</span></>}>
      {c ? <Body c={c} /> : (
        <main className="mx-auto max-w-[700px] p-8 text-center">
          <p>No hay un campo con ese identificador.</p>
          <Link href="/cartera" className="ext text-cyan">Volver a la cartera</Link>
        </main>
      )}
    </AppShell>
  );
}

function Body({ c }: { c: Client }) {
  const firms = useFires();
  const a = useMemo(() => assess(c, firms.fires), [c, firms.fires]);
  const ready = !firms.loading;
  const now = firms.now ?? new Date(0);
  const history = c.onchain ? lot14Fires() : [];
  const overlay = [...a.inField, ...a.near, ...history];
  const [view, setView] = useState<"campo" | "dia">("campo");
  const dayBox = frame(c.bbox, 1.2, 6);

  return (
    <main id="main" className="mx-auto grid max-w-[1400px] gap-4 px-4 py-5 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/cartera" className="text-[12.5px] text-muted hover:underline">← Volver a la cartera</Link>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{c.field}</h1>
          <p className="text-[13px] text-muted">{c.place} · {c.crop} · {int(c.ha)} ha · póliza {c.policy}</p>
        </div>
        <LevelBadge level={ready ? a.level : "cargando"} className="text-[13px]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* ---------------------------------------------------------------- imágenes */}
        <section aria-labelledby="imagen" className="glass rounded-[22px] p-4">
          <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="imagen" className="text-[15px] font-semibold">Imagen del campo</h2>
            <div role="group" aria-label="Tipo de imagen" className="flex gap-1">
              {([["campo", "Campo (Sentinel-2, 10 m)"], ["dia", "Día a día (VIIRS)"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setView(k)} aria-pressed={view === k}
                  className={`rounded-full px-3 py-1 text-[12px] ${view === k ? "bg-[#0e1b2c] text-white" : "glass-raised"}`}>{label}</button>
              ))}
            </div>
          </header>
          {view === "campo" ? (
            <figure>
              <FieldImage bbox={c.bbox} fires={overlay} tone={TONE[ready ? a.level : "ok"]} pad={0.45} px={900}
                className="aspect-square w-full rounded-xl md:aspect-[4/3]" alt={`Imagen satelital Sentinel-2 de ${c.field}, con el contorno del lote`} />
              <figcaption className="mt-2 text-[11.5px] leading-snug text-muted">
                Contorno del lote asegurado sobre {EOX_CREDIT}. Es un mosaico sin nubes: muestra cómo es el campo, no cómo está hoy.
                {overlay.length > 0 && <> Puntos naranjas: focos NASA FIRMS{c.onchain ? " (incendio del 8 al 11/11 y de las últimas 48 h)" : " de las últimas 48 h"}.</>}
                {" "}Para ver el estado de hoy, pasá a <button className="ext text-cyan" onClick={() => setView("dia")}>Día a día</button>.
              </figcaption>
            </figure>
          ) : (
            <div className="theme-dark rounded-xl bg-[#0c131e] p-3">
              <GibsImage bbox={dayBox} fires={[...firms.fires.filter((f) => distToField(c, f.lat, f.lon) <= 25), ...history]} now={now.getTime() ? now : new Date()}
                outline={c.bbox} initialLayer={a.level === "atencion" || c.onchain ? "fuego" : "real"} />
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- estado + póliza */}
        <div className="grid content-start gap-4">
          <Status c={c} a={a} ready={ready} now={now} error={firms.error} />

          <section aria-labelledby="poliza" className="glass rounded-[22px] p-4">
            <header className="mb-2 flex items-center justify-between gap-2">
              <h2 id="poliza" className="text-[15px] font-semibold">Póliza</h2>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${c.onchain ? "bg-cyan-bg text-cyan" : "bg-warn-bg text-warn"}`}>
                {c.onchain ? "◆ On-chain en Fuji" : "▲ Simulada"}
              </span>
            </header>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13px]">
              <dt className="text-muted">Cobertura</dt><dd className="text-right">Incendio paramétrico</dd>
              <dt className="text-muted">Índice</dt><dd className="text-right">Área quemada del lote, verificada por PUNA</dd>
              <dt className="text-muted">Disparador</dt><dd className="text-right font-mono">≥ {c.triggerPct.toLocaleString("es-AR")} %</dd>
              <dt className="text-muted">Suma asegurada</dt><dd className="text-right font-mono">{usd(sumInsured(c))}</dd>
              <dt className="text-muted">Prima (1,8 %)</dt><dd className="text-right font-mono">{usd(sumInsured(c) * 0.018)}</dd>
              <dt className="text-muted">Vigencia</dt><dd className="text-right">campaña 2026/27 · 01/09 al 31/05</dd>
              <dt className="text-muted">Cultivo</dt><dd className="text-right">{c.crop} · {int(c.ha)} ha</dd>
              <dt className="text-muted">Centro del lote</dt>
              <dd className="text-right font-mono text-[12px]">{((c.bbox[1] + c.bbox[3]) / 2).toFixed(3)}°, {((c.bbox[0] + c.bbox[2]) / 2).toFixed(3)}°</dd>
            </dl>
            <p className="mt-2 text-[11.5px] leading-snug text-muted">
              {c.onchain
                ? "La póliza vive en PunaEscrow: el contrato guarda la indemnización y solo la libera si el validador aprueba el índice."
                : "Productor y póliza inventados para la demo. La ubicación es una zona agrícola real del NOA."}
            </p>
          </section>
        </div>
      </div>

      {(a.inField.length > 0 || a.near.length > 0) && <FireTable c={c} fires={[...a.inField, ...a.near]} />}
    </main>
  );
}

function Status({ c, a, ready, now, error }: { c: Client; a: ReturnType<typeof assess>; ready: boolean; now: Date; error: string | null }) {
  const sats = [...new Set([...a.inField, ...a.near].map((f) => f.sat))].join(", ");
  const box = {
    atencion: "border-bad/40 bg-bad-bg",
    siniestro: "border-cyan/30 bg-cyan-bg",
    vigilancia: "border-warn/30 bg-warn-bg",
    ok: "border-ok/30 bg-ok-bg",
  }[a.level];
  return (
    <section aria-labelledby="estado" className={`rounded-[22px] border p-4 ${ready ? box : "glass"}`}>
      <h2 id="estado" className="text-[15px] font-semibold">Estado del campo</h2>
      {!ready ? <p className="mt-1 text-[13px] text-muted">Consultando NASA FIRMS…</p> : (
        <>
          {c.onchain && a.level === "atencion" && (
            <p className="mt-1 text-[14px]"><strong>Sigue habiendo fuego en el lote:</strong> {a.inField.length} focos en las últimas 48 h, el último {ago(a.last!, now)}.</p>
          )}
          {(a.level === "siniestro" || c.onchain) && <Lot14 />}
          {a.level === "atencion" && !c.onchain && (
            <>
              <p className="mt-1 text-[14px]"><strong>Fuego dentro del lote:</strong> {a.inField.length} focos en las últimas 48 h, el último {ago(a.last!, now)} ({sats}).</p>
              <ol className="mt-3 grid gap-1.5 text-[13px]">
                <li><span className="font-mono text-muted">1.</span> PUNA asigna un nodo para calcular el índice de área quemada.</li>
                <li><span className="font-mono text-muted">2.</span> Un validador de otro operador audita el cálculo (Freivalds).</li>
                <li><span className="font-mono text-muted">3.</span> Si aprueba y supera {c.triggerPct} %, PunaEscrow paga {usd(sumInsured(c))} al productor.</li>
              </ol>
              <Link href="/mission-control" className="mt-3 inline-block rounded-xl bg-[#0e1b2c] px-4 py-2 text-[13px] font-semibold text-white">
                Ver cómo se audita: job {demo.job.id} en Fuji →
              </Link>
              <p className="mt-2 text-[11.5px] text-muted">En la demo, el único job on-chain es el del Lote 14. Para este campo el flujo sería el mismo.</p>
            </>
          )}
          {a.level === "vigilancia" && (
            <p className="mt-1 text-[14px]">
              <strong>Fuego cerca, no adentro.</strong> El foco más cercano está a {a.nearestKm!.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km del lote
              ({a.near.length} focos a menos de {WATCH_KM} km, último {ago(a.last!, now)}). Se revisa en cada pasada; si entra al lote, pasa a atención.
            </p>
          )}
          {a.level === "ok" && (
            <p className="mt-1 text-[14px]">
              <strong>Todo en orden.</strong> Sin focos de calor en el lote ni a menos de {WATCH_KM} km en las últimas 48 h
              {a.nearestKm !== null ? ` (el más cercano está a ${Math.round(a.nearestKm)} km)` : ""}. La imagen muestra el campo como está asegurado.
            </p>
          )}
          {error && <p className="mt-2 text-[12px] text-warn">▲ {error}: el estado puede estar desactualizado.</p>}
        </>
      )}
    </section>
  );
}

function Lot14() {
  const paid = demo.events.find((e) => e.event === "PayoutTriggered");
  const rejected = demo.attempts.find((x) => x.outcome === "Rejected");
  const ok = demo.attempts.find((x) => x.outcome === "Paid");
  return (
    <>
      <p className="mt-1 text-[14px]"><strong>Incendio real del 8 al 11/11</strong> (NASA FIRMS, {demo.lot.foci.length} focos en el lote). Siniestro liquidado on-chain.</p>
      <ol className="mt-3 grid gap-1.5 text-[13px]">
        {rejected && <li><span className="text-bad">✕</span> Primer cálculo (nodo en la Anomalía): índice {pct(rejected.indexBps)}, score {rejected.score}. Rechazado, sin pago.</li>}
        {ok && <li><span className="text-ok">✓</span> Reasignado a otro nodo: índice {pct(ok.indexBps)}, score {ok.score}. Aprobado.</li>}
        <li><span className="text-ok">✓</span> {pct(demo.job.indexBps)} supera el disparador de {pct(demo.job.triggerBps)}: {demo.job.state === "Paid" ? "pagado" : demo.job.state}.</li>
      </ol>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/mission-control?job=${demo.job.id}`} className="rounded-xl bg-[#0e1b2c] px-4 py-2 text-[13px] font-semibold text-white">Ver la auditoría completa →</Link>
        {paid && <a href={txUrl(demo.chain.explorer, paid.tx)} target="_blank" rel="noreferrer" className="glass-raised ext rounded-xl px-3 py-2 text-[13px]">Pago en Snowtrace ↗</a>}
      </div>
    </>
  );
}

function FireTable({ c, fires }: { c: Client; fires: Fire[] }) {
  const rows = fires
    .map((f) => ({ f, d: distToField(c, f.lat, f.lon) }))
    .sort((x, y) => x.d - y.d || Date.parse(y.f.t) - Date.parse(x.f.t))
    .slice(0, 12);
  return (
    <section aria-labelledby="focos" className="glass overflow-x-auto rounded-[22px] p-4">
      <h2 id="focos" className="mb-2 text-[15px] font-semibold">Focos NASA FIRMS · últimas 48 h <span className="font-normal text-muted">({int(fires.length)}, se muestran los {rows.length} más cercanos)</span></h2>
      <table className="w-full min-w-[560px] text-left font-mono text-[12px]">
        <thead className="text-[11px] text-muted">
          <tr><th className="py-1 font-normal">Distancia</th><th className="font-normal">Hora (ART)</th><th className="font-normal">Satélite</th><th className="font-normal">Potencia</th><th className="font-normal">Posición</th></tr>
        </thead>
        <tbody>
          {rows.map(({ f, d }, i) => (
            <tr key={i} className="border-t border-line">
              <td className={`py-1 ${d <= IN_FIELD_KM ? "font-semibold text-bad" : ""}`}>{d <= IN_FIELD_KM ? "! en el lote" : `${d.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km`}</td>
              <td>{art(new Date(f.t))}</td>
              <td>{f.sat}</td>
              <td>{f.frp.toLocaleString("es-AR", { maximumFractionDigits: 1 })} MW</td>
              <td>{f.lat.toFixed(3)}°, {f.lon.toFixed(3)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
