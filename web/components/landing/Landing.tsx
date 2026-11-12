"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Flame } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl, txUrl } from "@/lib/format";
import { lot14Kpis, lot14Steps, type StepKind } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import { Globe3D, type GlobeAlert } from "./Globe3D";
import { NightSky } from "./NightSky";

const WINDOW_H = 24;
const tz = "America/Argentina/Buenos_Aires";
const hm = (d: Date) => d.toLocaleTimeString("es-AR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
const DOT: Record<StepKind, string> = { fire: "#ff7a1a", info: "#7dd3fc", warn: "#f5b03d", bad: "#ff5a4e", ok: "#34d399", pending: "#9aa9be" };

const btn = "transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7dd3fc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05080f]";

function Mark() {
  return (
    <svg width="30" height="20" viewBox="0 0 34 22" aria-hidden="true">
      <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="23" cy="3" r="2.4" fill="#ff7a1a" />
    </svg>
  );
}

function Label({ children, tone = "#7dd3fc" }: { children: React.ReactNode; tone?: string }) {
  return <p className="text-[13px] font-medium" style={{ color: tone }}>{children}</p>;
}

export function Landing() {
  const sky = useSky(demo.lot.bbox, true);
  const [labels, setLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const steps = useMemo(() => lot14Steps(), []);
  const k = useMemo(() => lot14Kpis(), []);

  const alerts: GlobeAlert[] = useMemo(() => {
    if (!sky.mounted) return [];
    const t = Date.now();
    return CLIENTS.map((c) => {
      const recent = assess(c, sky.fires).inField.filter((f) => t - Date.parse(f.t) < WINDOW_H * 3600_000);
      const [w, s, e, n] = c.bbox;
      return recent.length ? { id: c.id, field: c.field, lat: (s + n) / 2, lon: (w + e) / 2, count: recent.length } : null;
    }).filter((x): x is GlobeAlert => x !== null);
  }, [sky.fires, sky.mounted]);

  const inSaa = sky.sats.filter((s) => s.inSaa).map((s) => s.name);

  return (
    <div className="theme-dark relative min-h-dvh text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-[#0e1b2c]">Saltar al contenido</a>
      <NightSky />

      <header className="sticky top-3 z-30 mx-auto mt-3 w-full max-w-[1240px] px-4">
        <nav aria-label="Principal" className="lg lg-strong flex items-center gap-4 rounded-full py-2 pl-4 pr-2">
          <Link href="/" className={`flex items-center gap-2.5 rounded-full ${btn}`} aria-label="PUNA, inicio">
            <Mark />
            <span className="text-[15px] font-semibold tracking-[0.22em]">PUNA</span>
          </Link>
          <ul className="ml-4 hidden gap-1 text-[13px] text-[#d5deea] md:flex">
            <li><a href="#como" className={`rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white ${btn}`}>Cómo funciona</a></li>
            <li><a href="#aseguradoras" className={`rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white ${btn}`}>Para aseguradoras</a></li>
            <li><Link href="/mission-control" className={`rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white ${btn}`}>Auditoría on-chain</Link></li>
          </ul>
          <Link href="/ingresar" className={`ml-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0e1b2c] hover:bg-[#dff6fd] ${btn}`}>
            Entrar a la demo <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main id="contenido">
        {/* 1 · portada */}
        <section aria-labelledby="hero-t" className="relative mx-auto grid w-full max-w-[1240px] items-center gap-8 px-4 pb-16 pt-12 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] lg:pt-0">
          <div className="relative z-10 flex flex-col gap-7">
            <p className="rise flex items-center gap-2 text-[13px] text-[#b0bed1]">
              <span className="h-px w-8 bg-[#7dd3fc]/60" aria-hidden="true" /> Para aseguradoras agro · sobre Avalanche
            </p>
            <h1 id="hero-t" className="rise max-w-[15ch] text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] [text-wrap:balance] md:text-[66px]" style={{ animationDelay: "60ms" }}>
              Pagá incendios con un índice que otro auditó
            </h1>
            <p className="rise max-w-[46ch] text-[17px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]" style={{ animationDelay: "120ms" }}>
              Un satélite mide cuánto se quemó del lote. Una empresa distinta rehace la cuenta. El contrato paga solo si coincide,
              y cada paso queda a la vista de la SSN y de tu reasegurador.
            </p>
            <div className="rise flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "180ms" }}>
              <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#0e1b2c] shadow-[0_8px_30px_-8px_rgba(125,211,252,0.45)] hover:bg-[#dff6fd] ${btn}`}>
                Ver la cartera de demo <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={`/mission-control?job=${demo.job.id}`} className={`group flex items-center gap-1 rounded text-[14px] font-medium text-[#7dd3fc] hover:text-white ${btn}`}>
                o mirá un siniestro real on-chain <ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
            <dl className="rise lg grid max-w-[540px] grid-cols-3 divide-x divide-white/10 rounded-2xl py-3.5" style={{ animationDelay: "240ms" }}>
              {([
                [`${k.seconds} s`, "del reclamo al pago", "job 7, Avalanche Fuji"],
                ["300/300", "fallas detectadas", "benchmark del validador"],
                ["15 días", "plazo de la Res. SSN 315", "lo cumplimos en minutos"],
              ] as const).map(([v, l, s]) => (
                <div key={l} className="flex flex-col-reverse gap-1 px-4">
                  <dt className="text-[12px] leading-snug text-[#c9d4e4]">{l}<span className="block text-[11px] text-[#9aa9be]">{s}</span></dt>
                  <dd className="font-mono text-[19px] font-semibold tabular-nums leading-none tracking-tight md:text-[24px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative h-[440px] md:h-[600px] lg:h-[min(800px,calc(100dvh-90px))]">
            <Globe3D fires={sky.fires} sats={sky.sats} defs={sky.defs} now={sky.now} alerts={alerts} onLabels={setLabels} />
            {alerts.map((al, i) => {
              const p = labels[al.id];
              if (!p?.visible) return null;
              return (
                <div key={al.id} className="lg pointer-events-none absolute flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px]"
                  style={{ left: p.x + (i % 2 ? 70 : -70), top: p.y, transform: `translate(-50%, calc(-100% - ${44 + i * 38}px))` }}>
                  <Flame size={13} className="text-[#ff8a3d]" aria-hidden="true" />
                  <span className="font-semibold">{al.field}</span>
                  <span className="font-mono text-[11px] tabular-nums text-[#ffb27a]">{al.count} focos</span>
                </div>
              );
            })}
            <div className="lg absolute bottom-3 left-3 w-[min(320px,calc(100%-24px))] rounded-xl p-3 text-[12px]" aria-live="polite">
              <p className="flex items-center gap-2 font-semibold"><span className="relative flex h-2 w-2" aria-hidden="true"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#34d399]" /></span> En vivo</p>
              {sky.firesAt || sky.firesError ? (
                <>
                  <p className="mt-1 text-[#c9d4e4]">
                    {sky.firesAt ? <>NASA FIRMS · <b className="font-mono font-semibold tabular-nums text-ink">{sky.fires.length.toLocaleString("es-AR")}</b> focos en el NOA · {hm(sky.firesAt)}</> : "FIRMS no responde: queda la última lectura"}
                  </p>
                  <p className="mt-0.5 text-[#c9d4e4]"><span className="font-mono tabular-nums text-[#ff8a3d]">{alerts.length}</span> {alerts.length === 1 ? "campo asegurado" : "campos asegurados"} con fuego adentro · {WINDOW_H} h</p>
                  {inSaa.length > 0 && <p className="mt-0.5 text-[#ff9b92]">▲ {inSaa.join(", ")} en la Anomalía: no recibe cálculos</p>}
                </>
              ) : (
                <div className="mt-2 grid gap-1.5" aria-label="Cargando datos en vivo"><span className="h-2.5 w-4/5 animate-pulse rounded bg-white/10" /><span className="h-2.5 w-3/5 animate-pulse rounded bg-white/10" /></div>
              )}
            </div>
            <p className="absolute bottom-3 right-3 hidden text-right text-[10.5px] leading-snug text-[#9aa9be] sm:block">
              Arrastrá para girar<br />Satélites: modelos NASA, tamaño exagerado
            </p>
          </div>
        </section>

        {/* 2 · cómo funciona: el siniestro real del Lote 14 */}
        <section id="como" aria-labelledby="como-t" className="mx-auto grid w-full max-w-[1240px] scroll-mt-24 gap-12 px-4 pb-24 pt-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="flex flex-col gap-6 lg:sticky lg:top-28 lg:self-start">
            <Label>Cómo funciona</Label>
            <h2 id="como-t" className="max-w-[18ch] text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[44px]">
              Del diseño y del dato ya se ocupa alguien. Del cálculo, nadie.
            </h2>
            <p className="max-w-[48ch] text-[15.5px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]">
              Cuando el índice lo calcula un satélite de otra empresa, el operador se certifica a sí mismo. Y arriba nuestro está la
              Anomalía del Atlántico Sur, donde la radiación cambia bits sin avisar.
            </p>
            <dl className="grid max-w-[480px] text-[13.5px]">
              {([
                ["Diseño", "¿El índice representa la pérdida?", "actuarios"],
                ["Dato", "¿Llegó el dato correcto?", "oráculos, Chainlink"],
                ["Cálculo", "¿La cuenta se hizo bien?", "PUNA"],
              ] as const).map(([r, q, who], i) => (
                <div key={r} className={`grid grid-cols-[84px_1fr_auto] items-baseline gap-3 border-t border-white/10 py-2.5 ${i === 2 ? "text-white" : "text-[#c9d4e4]"}`}>
                  <dt className={`font-medium ${i === 2 ? "text-[#7dd3fc]" : ""}`}>{r}</dt>
                  <dd>{q}</dd>
                  <dd className={`text-[12px] ${i === 2 ? "rounded bg-[#7dd3fc]/15 px-1.5 py-0.5 font-semibold text-[#7dd3fc]" : "text-[#9aa9be]"}`}>{who}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg rounded-[28px] p-5 md:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
              <p className="text-[15px] font-semibold">Siniestro real · Lote 14, Anta (Salta)</p>
              <a href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer" className={`flex items-center gap-1 rounded text-[12.5px] text-[#7dd3fc] hover:text-white ${btn}`}>
                job {demo.job.id} en Avalanche Fuji <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            </div>
            <ol className="mt-4 flex flex-col">
              {steps.map((s, i) => (
                <li key={i} className="grid grid-cols-[18px_1fr] gap-x-4">
                  <div className="flex flex-col items-center">
                    <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-[#05080f]" style={{ background: DOT[s.kind] }} />
                    {i < steps.length - 1 && <span aria-hidden="true" className="w-px flex-1 bg-white/12" />}
                  </div>
                  <div className="pb-5">
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <p className={`text-[14.5px] font-semibold ${s.kind === "bad" ? "text-[#ff8a80]" : s.kind === "ok" ? "text-[#6ee7b7]" : ""}`}>{s.title}</p>
                      <span className="font-mono text-[11.5px] tabular-nums text-[#9aa9be]">{s.when}</span>
                    </div>
                    <p className="mt-0.5 max-w-[60ch] text-[13.5px] leading-snug text-[#c9d4e4]">{s.detail}</p>
                    {s.txs[0] && (
                      <a href={txUrl(demo.chain.explorer, s.txs[s.txs.length - 1])} target="_blank" rel="noreferrer"
                        className={`mt-1 inline-flex items-center gap-1 rounded font-mono text-[11.5px] text-[#7dd3fc] hover:text-white ${btn}`}>
                        comprobante {s.txs[s.txs.length - 1].slice(0, 10)}… <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-white/10 pt-4 text-[12.5px] text-[#9aa9be]">
              {k.txs} comprobantes públicos · costo de red {k.fee} · el productor cobró {k.indemnity}
            </p>
          </div>
        </section>

        {/* 3 · para aseguradoras */}
        <section id="aseguradoras" aria-labelledby="aseg-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pb-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="flex flex-col gap-6">
              <Label tone="#ffb27a">Para aseguradoras</Label>
              <h2 id="aseg-t" className="max-w-[20ch] text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[44px]">
                Un producto de incendio para el NOA, listo para la Res. SSN 315
              </h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-7 pt-2">
                {([
                  ["98,9 %", "de las primas agro del país es granizo. El incendio solo existe como adicional.", "SSN, encuesta 2024"],
                  ["2,5 %", "de las hectáreas aseguradas está en el NOA. Salta: 29.000 ha y ningún siniestro pagado.", "SSN, encuesta 2024"],
                  ["23/07/2026", "rige la Res. SSN 315: índice nombrado, dato con respaldo, acceso al cálculo y pago en 15 días.", "Marval O'Farrell Mairal"],
                  ["7.000 ha", "quemó el zonda en Salta en julio de 2026, con un muerto y unas 50 familias afectadas.", "Perfil"],
                ] as const).map(([v, d, src]) => (
                  <div key={v} className="border-t border-white/15 pt-3">
                    <dt className="font-mono text-[26px] font-semibold tabular-nums tracking-tight md:text-[30px]">{v}</dt>
                    <dd className="mt-1.5 text-[13.5px] leading-snug text-[#c9d4e4]">{d}</dd>
                    <dd className="mt-1 text-[11px] text-[#9aa9be]">Fuente: {src}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg flex flex-col rounded-[28px] p-6 md:p-7 lg:mt-14">
              <p className="text-[15px] font-semibold">Qué gana cada uno</p>
              <dl className="mt-3">
                {([
                  ["La aseguradora", "Liquida incendios sin perito y sin disputas, en una zona hoy sin producto, con trazabilidad para la SSN.", "nos contrata"],
                  ["El asegurado", "Cobra en minutos y puede ver con qué dato y qué cuenta le pagaron, o por qué no.", "cobra antes"],
                  ["El reasegurador", "Ve cada evento y cada pago en la cadena. Menos riesgo de modelo para dar capacidad.", "audita solo"],
                  ["El operador del satélite", "Cobra su fee únicamente si el cálculo pasa la auditoría, y suma reputación verificable.", "cobra si acierta"],
                ] as const).map(([who, what, tag]) => (
                  <div key={who} className="grid gap-1 border-t border-white/10 py-3.5 first:border-t-0">
                    <dt className="flex items-baseline justify-between gap-3 text-[14.5px] font-semibold">{who}<span className="text-[11.5px] font-normal text-[#9aa9be]">{tag}</span></dt>
                    <dd className="text-[13.5px] leading-snug text-[#c9d4e4]">{what}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="lg lg-strong mt-16 grid gap-6 overflow-hidden rounded-[32px] p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10">
            <div>
              <p className="max-w-[30ch] text-[26px] font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[32px]">
                Arrancamos con incendios en el NOA. La misma capa sirve para cualquier índice que calcule un satélite.
              </p>
              <p className="mt-3 max-w-[60ch] text-[14.5px] text-[#c9d4e4]">
                Cuando la inteligencia artificial corra en el espacio, alguien va a tener que controlar que no se equivoque antes de que se mueva la plata.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#0e1b2c] hover:bg-[#dff6fd] ${btn}`}>
                Entrar a la demo <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/mission-control" className={`flex items-center gap-1.5 rounded-full border border-white/25 px-5 py-3 text-[14px] font-medium hover:bg-white/10 ${btn}`}>
                Auditoría on-chain
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1240px] px-4 pb-10">
        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[11.5px] leading-relaxed text-[#9aa9be] md:flex-row md:justify-between md:gap-8">
          <p className="max-w-[70ch]"><span className="text-[#6ee7b7]">Real:</span> focos NASA FIRMS, órbitas CelesTrak, contrato y transacciones en Avalanche Fuji. <span className="text-[#f5c26b]">Simulado:</span> la aseguradora, los productores y que esos satélites calculen.</p>
          <p className="md:text-right">Planeta: NASA Blue Marble vía GIBS · Satélites: NASA 3D Resources · Argentina Space Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
