"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { GibsImage } from "@/components/DetailDrawer";
import { FieldImage } from "@/components/FieldImage";
import { LevelBadge } from "@/components/Shell";
import { demo } from "@/lib/data";
import { addrUrl, int, pct, short, txUrl } from "@/lib/format";
import { Stepper } from "./Stepper";
import { frame } from "@/lib/imagery";
import { lot14Kpis, policyHistory, policyStages, policyTxs, type Stage, type StepKind } from "@/lib/policy";
import { distToField, sumInsured, usd } from "@/lib/portfolio";
import type { Fire } from "@/lib/sky";
import type { Row } from "./GlobeView";

type Tab = "historial" | "transacciones" | "auditoria";
const STEP: Record<StepKind, { bg: string; fg: string; icon: string; title: string }> = {
  fire: { bg: "#ff7a1a", fg: "#fff", icon: "◉", title: "text-ink" },
  info: { bg: "#3dd6f5", fg: "#04121c", icon: "→", title: "text-ink" },
  warn: { bg: "#f5b03d", fg: "#1a1200", icon: "▲", title: "text-ink" },
  bad: { bg: "#ff5a4e", fg: "#fff", icon: "✕", title: "text-[#ff8a80]" },
  ok: { bg: "#34d399", fg: "#04140d", icon: "✓", title: "text-[#6ee7b7]" },
  pending: { bg: "transparent", fg: "#c9d4e4", icon: "…", title: "text-ink" },
};

/** Focos FIRMS históricos del Lote 14 (8–11/11), en coordenadas de la grilla en demo.json. */
function lot14Fires(): Fire[] {
  const [w, s, e, n] = demo.lot.bbox;
  return demo.lot.foci.map((f) => ({
    lat: n - f.y * (n - s), lon: w + f.x * (e - w), sat: f.sat === "N20" ? "NOAA-20" : "NOAA-21",
    source: "VIIRS", t: `${f.date}T${f.time.slice(0, 2)}:${f.time.slice(2)}:00Z`, frp: f.frp, confidence: f.confidence,
  }));
}

const TxChip = ({ hash }: { hash: string }) => (
  <a href={txUrl(demo.chain.explorer, hash)} target="_blank" rel="noreferrer"
    className="shrink-0 rounded-md bg-[#3dd6f5]/15 px-1.5 py-0.5 font-mono text-[11px] text-[#7dd3fc] hover:bg-[#3dd6f5]/25">
    {short(hash)} <span aria-hidden="true">↗</span><span className="sr-only"> (abre Snowtrace)</span>
  </a>
);

export function PolicyModal({ row, fires, now, onClose }: { row: Row; fires: Fire[]; now: Date; onClose: () => void }) {
  const { c, a } = row;
  const box = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("historial");
  const [img, setImg] = useState<"campo" | "dia">("campo");
  const [techOn, setTechOn] = useState(false);
  const steps = useMemo(() => policyHistory(c, a), [c, a]);
  const flow = useMemo(() => policyStages(c, a), [c, a]);
  const txs = useMemo(() => policyTxs(c), [c]);
  const k = c.onchain ? lot14Kpis() : null;
  const history = c.onchain ? lot14Fires() : [];

  // foco atrapado + Escape
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !box.current) return;
      const f = [...box.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),[tabindex='0']")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("keydown", key); prev?.focus(); };
  }, [onClose]);

  const kpis: [string, string, string, string][] = k
    ? [
        ["Área quemada (verificada)", pct(k.indexBps), "text-[#ff9a3d]", `supera el ${pct(k.triggerBps)} pactado`],
        ["Pago al productor", k.indemnity, "text-[#6ee7b7]", `${k.state === "Paid" ? "pagado" : k.state} · ${k.paidAt}`],
        ["Suma asegurada", usd(sumInsured(c)), "text-ink", `prima ${usd(sumInsured(c) * 0.018)} · campaña 2026/27`],
        ["Del reclamo al pago", `${k.seconds} s`, "text-ink", `${k.txs} comprobantes · costo de red ${k.fee}`],
      ]
    : [
        ["Área quemada", a.inField.length ? "sin medir" : "—", "text-ink", a.inField.length ? "falta medir y auditar" : "no hay siniestro abierto"],
        ["Puntos de calor en el lote", int(a.inField.length), a.inField.length ? "text-[#ff8a80]" : "text-ink", `últimas 48 h${a.near.length ? ` · ${a.near.length} más a ≤ 15 km` : ""}`],
        ["Suma asegurada", usd(sumInsured(c)), "text-ink", `prima ${usd(sumInsured(c) * 0.018)} · campaña 2026/27`],
        ["Paga si se quema", `> ${c.triggerPct} %`, "text-ink", "del lote, medido y auditado"],
      ];

  const tabs: [Tab, string][] = [["historial", "Qué pasó"], ["transacciones", `Comprobantes · ${txs.length}`], ["auditoria", "Auditoría"]];

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#02050a]/55 p-3 backdrop-blur-[6px] md:overflow-hidden md:p-5" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="poliza-titulo"
        className="lg lg-strong theme-dark my-auto flex w-full max-w-[1040px] flex-col gap-4 rounded-[28px] p-4 md:max-h-[calc(100dvh-40px)] md:overflow-hidden md:p-6">
        {/* encabezado */}
        <header className="flex flex-wrap items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://tiles.maps.eox.at/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=s2cloudless-2025&SRS=EPSG:4326&BBOX=${frame(c.bbox, 0.35).join(",")}&WIDTH=160&HEIGHT=160&FORMAT=image/jpeg`}
            alt="" className="h-14 w-14 rounded-[14px] border border-white/20 object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="poliza-titulo" className="text-[22px] font-semibold tracking-tight">{c.field}</h2>
              <LevelBadge level={a.level} />
              {c.onchain && <LevelBadge level="siniestro" />}
              {!c.onchain && <span className="rounded-full bg-[#fbf1df] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#9a6200]"><span aria-hidden="true">▲ </span>Póliza simulada</span>}
            </div>
            <p className="text-[12.5px] text-muted">{c.place} · {c.crop} · {int(c.ha)} ha · póliza {c.policy}{c.onchain ? " en Avalanche Fuji" : ""}</p>
          </div>
          <Link href={c.onchain ? `/mission-control?job=${demo.job.id}` : "/mission-control"}
            className="rounded-full border border-white/30 bg-white/[0.06] px-3 py-2 text-[12.5px] font-medium hover:bg-white/15">
            {c.onchain ? "Abrir en Mission Control" : "Ver cómo se audita"} <span aria-hidden="true">↗</span>
          </Link>
          <button data-autofocus onClick={onClose} aria-label="Cerrar póliza"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 text-[14px] hover:bg-white/20">✕</button>
        </header>

        {/* indicadores */}
        <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {kpis.map(([l, v, cls, s]) => (
            <div key={l} className="lg-tile rounded-[14px] px-3.5 py-3">
              <dt className="text-[11.5px] text-muted">{l}</dt>
              <dd className={`mt-0.5 font-mono text-[22px] font-semibold leading-tight ${cls}`}>{v}</dd>
              <dd className="text-[11.5px] text-muted">{s}</dd>
            </div>
          ))}
        </dl>

        {/* cuerpo: las dos columnas se estiran a la misma altura */}
        <div className="grid gap-5 md:min-h-0 md:flex-1 md:grid-cols-[380px_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
          <div className="scroll-thin flex flex-col gap-3 md:min-h-0 md:overflow-y-auto md:pr-1">
            <div className="relative">
              {img === "campo" ? (
                <FieldImage bbox={c.bbox} fires={[...a.inField, ...a.near, ...history]} tone={a.level === "atencion" ? "bad" : a.level === "vigilancia" ? "warn" : a.level === "siniestro" ? "info" : "ok"}
                  pad={0.45} px={760} className="aspect-[4/3] w-full rounded-2xl" alt={`Imagen Sentinel-2 de ${c.field} con el contorno del lote`} />
              ) : (
                <div className="rounded-2xl bg-[#0c131e] p-2">
                  <GibsImage bbox={frame(c.bbox, 1.2, 6)} fires={[...fires.filter((f) => distToField(c, f.lat, f.lon) <= 25), ...history]}
                    now={now} outline={c.bbox} initialLayer={a.level === "atencion" || c.onchain ? "fuego" : "real"} />
                </div>
              )}
              <div role="group" aria-label="Tipo de imagen" className="lg absolute left-2.5 top-2.5 flex gap-0.5 rounded-full p-0.5">
                {([["campo", "Campo · Sentinel-2"], ["dia", "Día a día · VIIRS"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setImg(v)} aria-pressed={img === v}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${img === v ? "bg-white text-[#0e1b2c]" : "text-[#e6edf7] hover:bg-white/10"}`}>{l}</button>
                ))}
              </div>
            </div>
            {img === "campo" && (
              <p className="text-[11px] leading-snug text-muted">
                Imagen Sentinel-2 sin nubes (no es de hoy) · contorno del lote{c.onchain || a.inField.length + a.near.length ? " · puntos naranjas: fuego visto por la NASA" : ""}
              </p>
            )}
            <section aria-labelledby="poliza-datos" className="lg-tile flex flex-1 flex-col gap-1.5 rounded-[14px] px-3.5 py-3">
              <h3 id="poliza-datos" className="text-[13px] font-semibold">Póliza</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12px]">
                <dt className="text-muted">Cobertura</dt><dd className="text-right">Incendio paramétrico</dd>
                <dt className="text-muted">Índice</dt><dd className="text-right">Área quemada, verificada por PUNA</dd>
                <dt className="text-muted">Vigencia</dt><dd className="text-right">01/09/2026 al 31/05/2027</dd>
                <dt className="text-muted">Productor</dt>
                <dd className="text-right">{c.onchain
                  ? <a className="font-mono text-[11.5px] text-[#7dd3fc] underline-offset-2 hover:underline" href={addrUrl(demo.chain.explorer, demo.job.beneficiary)} target="_blank" rel="noreferrer">simulado · {short(demo.job.beneficiary)} ↗</a>
                  : "simulado"}</dd>
                <dt className="text-muted">Contrato</dt>
                <dd className="text-right">{c.onchain
                  ? <a className="font-mono text-[11.5px] text-[#7dd3fc] underline-offset-2 hover:underline" href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer">PunaEscrow {short(demo.contracts.escrow)} ↗</a>
                  : "se crea al pedir el índice"}</dd>
                <dt className="text-muted">Validador</dt><dd className="text-right">agente de otro operador · ERC-8004</dd>
              </dl>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-3 md:min-h-0">
            <div role="tablist" aria-label="Detalle de la póliza" className="lg-tile flex w-fit max-w-full flex-wrap gap-1 rounded-full p-[3px]">
              {tabs.map(([t, l]) => (
                <button key={t} role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} id={`tab-${t}`} onClick={() => setTab(t)}
                  className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${tab === t ? "bg-white text-[#0e1b2c]" : "text-[#e6edf7] hover:bg-white/10"}`}>{l}</button>
              ))}
            </div>

            {tab === "historial" && (
              <div id="panel-historial" role="tabpanel" aria-labelledby="tab-historial" className="scroll-thin flex flex-1 flex-col gap-3 md:min-h-0 md:overflow-y-auto md:pr-1">
                <Stepper stages={flow.stages} />
                <div className="flex items-start gap-3">
                  <p className="flex-1 text-[12.5px] leading-snug text-ink">{flow.summary}</p>
                  <button onClick={() => setTechOn((v) => !v)} aria-pressed={techOn}
                    className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-[#d5deea] hover:bg-white/10">
                    {techOn ? "Ocultar detalle técnico" : "Ver detalle técnico"}
                  </button>
                </div>
                <ol className="flex flex-col">
                  {steps.map((s, i) => {
                    const st = STEP[s.kind];
                    return (
                      <li key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <span aria-hidden="true" className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[10px] font-bold"
                            style={{ background: st.bg, color: st.fg, border: s.kind === "pending" ? "1.5px dashed #c9d4e4" : undefined }}>{st.icon}</span>
                          {i < steps.length - 1 && <span aria-hidden="true" className="w-0.5 flex-1 bg-white/20" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-2.5">
                          <div className="flex items-baseline gap-2">
                            <p className={`min-w-0 flex-1 text-[13px] font-semibold ${st.title}`}>{s.title}</p>
                            {s.when && <span className="shrink-0 font-mono text-[11px] text-muted">{s.when}</span>}
                          </div>
                          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] leading-snug text-[#d5deea]">{s.detail}</p>
                              {techOn && s.tech && <p className="font-mono text-[10.5px] text-muted">{s.tech}</p>}
                            </div>
                            {techOn && s.txs.length > 0 && <span className="flex gap-1">{s.txs.map((h) => <TxChip key={h} hash={h} />)}</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {!c.onchain && (
                  <section aria-labelledby="como-se-paga" className="lg-tile mt-auto rounded-[14px] px-3.5 py-3">
                    <h3 id="como-se-paga" className="text-[12.5px] font-semibold">Cómo se paga un siniestro</h3>
                    <ol className="mt-1.5 grid gap-1 text-[11.5px] leading-snug text-[#d5deea]">
                      <li><span className="font-mono text-muted">1.</span> <b className="font-medium text-ink">Fuego detectado:</b> los satélites de la NASA ven puntos de calor dentro del lote.</li>
                      <li><span className="font-mono text-muted">2.</span> <b className="font-medium text-ink">Medición:</b> una computadora en órbita calcula qué parte del lote se quemó.</li>
                      <li><span className="font-mono text-muted">3.</span> <b className="font-medium text-ink">Auditoría:</b> un auditor de otra empresa rehace la cuenta; si no coincide, no se paga.</li>
                      <li><span className="font-mono text-muted">4.</span> <b className="font-medium text-ink">Pago:</b> si se quemó más del {c.triggerPct} %, el contrato paga solo, sin trámites.</li>
                    </ol>
                  </section>
                )}
              </div>
            )}

            {tab === "transacciones" && (
              <div id="panel-transacciones" role="tabpanel" aria-labelledby="tab-transacciones" className="flex flex-1 flex-col gap-2 md:min-h-0">
                {txs.length ? (
                  <>
                    <p className="text-[12px] leading-snug text-[#d5deea]">
                      Cada fila es un registro público en la blockchain de Avalanche. Con el comprobante, cualquiera puede verificar qué pasó y cuándo, sin pedirle nada a la aseguradora.
                    </p>
                    <div className="lg-tile scroll-thin overflow-auto rounded-[14px] p-1 md:min-h-0 md:flex-1">
                      <table className="w-full min-w-[540px] text-left text-[12px]">
                        <thead className="sticky top-0 z-[1] bg-[#121b29] text-[11px] text-muted">
                          <tr><th className="px-2.5 py-2 font-medium">Hora</th><th className="font-medium">Qué pasó</th><th className="font-medium">Dónde</th><th className="pr-2 font-medium">Comprobante</th></tr>
                        </thead>
                        <tbody>
                          {txs.map((t) => (
                            <tr key={t.hash} className={t.tone === "bad" ? "bg-[#ff5a4e]/15" : t.tone === "ok" ? "bg-[#34d399]/15" : ""}>
                              <td className="rounded-l-[10px] px-2.5 py-1.5 align-top font-mono">{t.when}</td>
                              <td className="py-1.5 pr-2">
                                <span className={`block font-medium ${t.tone === "bad" ? "text-[#ff8a80]" : t.tone === "ok" ? "text-[#6ee7b7]" : ""}`}>{t.tone === "bad" ? "✕ " : t.tone === "ok" ? "✓ " : ""}{t.what}</span>
                                <span className="block font-mono text-[10.5px] text-muted">{t.tech}</span>
                              </td>
                              <td className="py-1.5 pr-2 align-top text-[11.5px] text-[#d5deea]">{t.where}</td>
                              <td className="rounded-r-[10px] py-1.5 pr-2 align-top"><TxChip hash={t.hash} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="flex flex-wrap justify-between gap-2 text-[11.5px] text-muted">
                      <span>{txs.length} comprobantes · costo de red {k?.fee} · {demo.chain.name}</span>
                      <a className="font-medium text-[#7dd3fc] hover:underline" href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer">Ver el contrato en Snowtrace ↗</a>
                    </p>
                  </>
                ) : (
                  <Empty title="Todavía no hay comprobantes" body="Esta póliza de demo no está en la blockchain. Cuando se abre un reclamo, cada paso (reservar el pago, medir, auditar y pagar) queda registrado acá con un comprobante público." />
                )}
              </div>
            )}

            {tab === "auditoria" && (
              <div id="panel-auditoria" role="tabpanel" aria-labelledby="tab-auditoria" className="scroll-thin flex flex-1 flex-col gap-2.5 md:min-h-0 md:overflow-y-auto md:pr-1">
                {k ? (
                  <>
                    <p className="text-[12px] leading-snug text-[#d5deea]">
                      Un auditor de otra empresa rehace la cuenta paso a paso. <span className="text-[#6ee7b7]">✓</span> el paso coincide · <span className="text-[#ff8a80]">✕</span> no coincide. Si algo no coincide, no se paga.
                    </p>
                    {k.attempts.map((at) => {
                      const okA = at.outcome !== "Rejected";
                      const nd = demo.nodes.find((n) => n.agentId === at.agentId);
                      return (
                        <section key={at.attempt} className={`rounded-[14px] border px-3.5 py-3 ${okA ? "border-[#34d399]/40 bg-[#34d399]/10" : "border-[#ff5a4e]/45 bg-[#ff5a4e]/10"}`}>
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className={`text-[13px] font-semibold ${okA ? "text-[#6ee7b7]" : "text-[#ff8a80]"}`}>
                              {okA ? "✓" : "✕"} Intento {at.attempt} · {nd?.name}: {okA ? "cuenta correcta" : "error encontrado"} ({at.score}/100)
                            </h3>
                            <span className="text-[11.5px] text-muted">resultado entregado: {pct(at.indexBps)} quemado</span>
                          </div>
                          <ul className="mt-2 grid gap-1 font-mono text-[11px] sm:grid-cols-2">
                            {(at.certificate?.checks ?? []).map((ch) => (
                              <li key={ch.name} className={ch.ok ? "text-muted" : "font-medium text-[#ff8a80]"}><span aria-hidden="true">{ch.ok ? "✓ " : "✕ "}</span>{ch.name}</li>
                            ))}
                            {!at.certificate && <li className="text-muted">El detalle por paso está en Mission Control.</li>}
                          </ul>
                        </section>
                      );
                    })}
                  </>
                ) : (
                  <Empty title="Todavía no hay auditorías" body="Cuando se mide el área quemada, un auditor de otra empresa rehace la cuenta paso a paso. Si algo no coincide, el contrato no paga." />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="lg-tile grid flex-1 place-content-center gap-1 rounded-[14px] p-6 text-center">
      <p className="text-[13.5px] font-semibold">{title}</p>
      <p className="mx-auto max-w-[44ch] text-[12px] text-muted">{body}</p>
      <Link href="/mission-control" className="mt-2 text-[12.5px] font-medium text-[#7dd3fc] hover:underline">Ver un job real en Mission Control ↗</Link>
    </div>
  );
}
