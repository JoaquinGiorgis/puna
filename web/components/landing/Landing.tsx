"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Droplets, Flame, Snowflake, Sun } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl } from "@/lib/format";
import { lot14Kpis } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import { Globe3D, type GlobeAlert } from "./Globe3D";
import { NightSky } from "./NightSky";
import { AlertsMini, AuditMini, GridMini, TxMini } from "./HowCards";
import { Pains } from "./Pains";

const WINDOW_H = 24;

const btn = "transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7dd3fc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05080f]";

function Mark() {
  return (
    <svg width="30" height="20" viewBox="0 0 34 22" aria-hidden="true">
      <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="#7dd3fc" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="23" cy="3" r="2.4" fill="#ff7a1a" />
    </svg>
  );
}

const HOW = [
  { title: "Se detecta el siniestro", body: "La NASA registra focos de calor dentro del lote asegurado y la cartera lo marca en rojo. El reclamo se abre solo, sin denuncia.", fact: "Fuente: NASA FIRMS" },
  { title: "Un satélite mide el daño", body: "Una CNN (red neuronal convolucional) recorre la imagen con filtros chicos, zona por zona, y marca cada celda del lote como quemada o sana.", fact: "Lote 14 · grilla de 12 × 12" },
  { title: "Otro satélite lo verifica", body: "Otro operador comprueba cada capa de la CNN con el algoritmo de Freivalds: prueba la cuenta con números al azar y, si un solo valor fue alterado, no cierra y no se paga.", fact: "C·r ≡ A·(B·r) mód p" },
  { title: "Se paga el seguro", body: "Si la verificación aprueba y el daño supera el umbral de la póliza, el contrato en Avalanche le paga al productor.", fact: "" },
] as const;

const PERILS = [
  { name: "Incendio", icon: Flame, color: "#ff7a1a", what: "Área quemada y puntos de calor dentro del lote.", src: "NASA FIRMS · VIIRS, MODIS, GOES", live: true },
  { name: "Sequía", icon: Sun, color: "#f5c26b", what: "Vigor de la vegetación y humedad del suelo.", src: "Sentinel-2 · MODIS · SMAP", live: false },
  { name: "Inundación", icon: Droplets, color: "#7dd3fc", what: "Superficie del lote cubierta de agua, aun con nubes.", src: "Radar Sentinel-1", live: false },
  { name: "Helada", icon: Snowflake, color: "#c4b5fd", what: "Temperatura de la superficie durante la noche.", src: "MODIS · VIIRS", live: false },
];

function Label({ children, tone = "#7dd3fc" }: { children: React.ReactNode; tone?: string }) {
  return <p className="text-[13px] font-medium" style={{ color: tone }}>{children}</p>;
}

export function Landing() {
  const sky = useSky(demo.lot.bbox, true);
  const [labels, setLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const k = useMemo(() => lot14Kpis(), []);
  const pct = `${(k.indexBps / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
  const alerts: GlobeAlert[] = useMemo(() => {
    if (!sky.mounted) return [];
    const t = Date.now();
    return CLIENTS.map((c) => {
      const recent = assess(c, sky.fires).inField.filter((f) => t - Date.parse(f.t) < WINDOW_H * 3600_000);
      const [w, s, e, n] = c.bbox;
      return recent.length ? { id: c.id, field: c.field, lat: (s + n) / 2, lon: (w + e) / 2, count: recent.length } : null;
    }).filter((x): x is GlobeAlert => x !== null);
  }, [sky.fires, sky.mounted]);


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
            <li><Link href="/mission-control" className={`rounded-full px-3 py-1.5 hover:bg-white/10 hover:text-white ${btn}`}>Ver una auditoría</Link></li>
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
            <p className="rise text-[13px] text-[#b0bed1]">
              Peritaje satelital para aseguradoras agro
            </p>
            <h1 id="hero-t" className="rise max-w-[17ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] [text-wrap:balance] md:text-[56px]" style={{ animationDelay: "60ms" }}>
              Resolvé el peritaje de siniestros con auditoría satelital
            </h1>
            <p className="rise max-w-[46ch] text-[17px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]" style={{ animationDelay: "120ms" }}>
              Ayudamos a las aseguradoras agro a peritar los siniestros de sus clientes desde el espacio. Los satélites se verifican
              entre ellos y cada medición queda registrada sin posibilidad de cambios, con evidencia lista para la SSN y pago
              instantáneo del seguro.
            </p>
            <div className="rise flex flex-wrap items-center gap-x-6 gap-y-3" style={{ animationDelay: "180ms" }}>
              <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14.5px] font-semibold text-[#0e1b2c] shadow-[0_8px_30px_-8px_rgba(125,211,252,0.45)] hover:bg-[#dff6fd] ${btn}`}>
                Ver la cartera de demo <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={`/mission-control?job=${demo.job.id}`} className={`group flex items-center gap-1 rounded text-[14px] font-medium text-[#7dd3fc] hover:text-white ${btn}`}>
                o mirá un siniestro real, paso a paso <ArrowUpRight size={15} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative h-[440px] md:h-[600px] lg:h-[min(800px,calc(100dvh-90px))]">
            <Globe3D fires={sky.fires} sats={sky.sats} defs={sky.defs} now={sky.now} alerts={alerts} onLabels={setLabels} />
            {alerts.map((al, i) => {
              const p = labels[al.id];
              if (!p?.visible) return null;
              return (
                <div key={al.id} className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
                  <span aria-hidden="true" className="pin-pulse absolute -left-[18px] -top-[18px] h-9 w-9 rounded-full border border-[#c4352b] bg-[#c4352b]/25" />
                  <span className="absolute -left-[11px] -top-[11px] grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-[#c4352b]">
                    <Flame size={12} strokeWidth={2.6} color="#fff" aria-hidden="true" />
                  </span>
                  <div className="lg absolute left-4 whitespace-nowrap rounded-lg px-2 py-1 leading-tight" style={{ top: i % 2 ? 10 : -48 }}>
                    <span className="block text-[12px] font-semibold text-[#e6edf7]">{al.field}</span>
                    <span className="block font-mono text-[10.5px] text-[#ff8a80]">! {al.count} focos en el lote</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2 · cómo funciona: cuatro pasos, con los datos del Lote 14 */}
        <section id="como" aria-labelledby="como-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pb-24 pt-20">
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 text-center">
            <Label>Cómo funciona</Label>
            <h2 id="como-t" className="text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[44px]">
              Del siniestro al pago, en cuatro pasos
            </h2>
            <p className="max-w-[52ch] text-[15.5px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]">
              Así peritamos un incendio real en Anta, Salta. Quien mide el daño nunca es quien lo controla.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map((st, i) => (
              <li key={st.title} className="lg group relative flex flex-col rounded-[24px] p-5 transition duration-300 hover:-translate-y-1">
                <div className="relative h-[176px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220]/80 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.8)]">
                  {i === 0 && <AlertsMini fires={sky.fires} ready={Boolean(sky.firesAt || sky.firesError)} />}
                  {i === 1 && <GridMini pct={pct} trigger={`${(k.triggerBps / 100).toLocaleString("es-AR", { minimumFractionDigits: 1 })} %`} />}
                  {i === 2 && <AuditMini />}
                  {i === 3 && <TxMini explorer={demo.chain.explorer} />}
                </div>
                <p className="mt-5 font-mono text-[12px] tabular-nums text-[#9aa9be]">Paso {i + 1}</p>
                <h3 className="mt-1 truncate text-[18px] font-semibold leading-snug tracking-[-0.01em]">{st.title}</h3>
                <p className="mt-2 min-h-[115px] text-[14px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]">{st.body}</p>
                <p className="mt-auto flex pt-4 text-[12px] text-[#9aa9be]">
                  <span className="max-w-full truncate whitespace-nowrap rounded-md bg-white/[0.06] px-2 py-1 font-mono tabular-nums text-[#e6edf7]">{i === 3 ? `${k.indemnity} · en ${k.seconds} s` : st.fact}</span>
                </p>
              </li>
            ))}
          </ol>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-[13px] text-[#9aa9be]">
            <span>Incendio y órbitas reales; satélites y operadores simulados.</span>
            <a href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 rounded text-[#7dd3fc] hover:text-white ${btn}`}>
              Ver los comprobantes en Avalanche <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </p>
        </section>

        {/* 3 · para aseguradoras */}
        <section id="aseguradoras" aria-labelledby="aseg-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pb-20">
          <div className="mx-auto flex max-w-[680px] flex-col items-center gap-4 text-center">
            <Label tone="#ffb27a">Para aseguradoras</Label>
            <h2 id="aseg-t" className="text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[44px]">
              Cuatro problemas del seguro agro que PUNA resuelve
            </h2>
            <p className="max-w-[56ch] text-[15.5px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]">
              Cómo se hace hoy y qué cambia, con los números del incendio real del Lote 14.
            </p>
          </div>
          <div className="mt-12">
            <Pains seconds={k.seconds} txs={k.txs} fee={k.fee} indemnity={k.indemnity} />
          </div>

          <div className="mt-24">
            <div className="mx-auto flex max-w-[640px] flex-col items-center gap-3 text-center">
              <Label tone="#6ee7b7">Qué siniestros medimos</Label>
              <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] [text-wrap:balance] md:text-[36px]">
                Si un satélite lo ve, PUNA lo puede peritar
              </h2>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {PERILS.map(({ name, icon: I, color, what, src, live }) => (
                <li key={name} className="lg flex flex-col gap-4 rounded-[24px] p-5">
                  <div className="relative grid h-[88px] place-items-center overflow-hidden rounded-2xl border border-white/10"
                    style={{ background: `radial-gradient(80% 90% at 50% 100%, ${color}40, transparent 70%), #05080f99` }}>
                    <I size={34} strokeWidth={1.6} style={{ color }} aria-hidden="true" />
                    <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${live ? "bg-[#34d399]/15 text-[#6ee7b7]" : "bg-white/[0.07] text-[#9aa9be]"}`}>
                      {live ? "En la demo" : "Próximo índice"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[17px] font-semibold">{name}</h3>
                    <p className="text-[13px] leading-snug text-[#c9d4e4]">{what}</p>
                  </div>
                  <p className="mt-auto text-[11.5px] text-[#9aa9be]">{src}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-24 overflow-hidden rounded-[32px] border border-white/10 p-8 md:p-12"
            style={{ background: "radial-gradient(60% 120% at 100% 0%, rgba(125,211,252,0.18), transparent 60%), radial-gradient(50% 100% at 0% 100%, rgba(255,122,26,0.14), transparent 60%), rgba(11,18,32,0.75)" }}>
            <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="flex flex-col gap-5">
                <h2 className="max-w-[18ch] text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[42px]">
                  Peritá tu próximo siniestro desde el espacio
                </h2>
                <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-[#c9d4e4]">
                  Mirá la cartera de demo con el incendio real del Lote 14: la alerta, la medición, la auditoría y el pago.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14.5px] font-semibold text-[#0e1b2c] shadow-[0_8px_30px_-8px_rgba(125,211,252,0.5)] hover:bg-[#dff6fd] ${btn}`}>
                    Entrar a la demo <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href={`/mission-control?job=${demo.job.id}`} className={`flex items-center gap-1.5 rounded-full border border-white/25 px-5 py-3 text-[14px] font-medium hover:bg-white/10 ${btn}`}>
                    Ver una auditoría <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <ul className="flex flex-col gap-3" aria-label="Resultados del caso real">
                {([
                  ["46 s", "del reclamo al pago", "#6ee7b7", 0],
                  ["300/300", "fallas detectadas por el auditor", "#7dd3fc", 28],
                  [`${k.txs}`, "comprobantes públicos en Avalanche", "#ffb27a", 8],
                ] as const).map(([v, l, c, off]) => (
                  <li key={l} className="lg flex items-center gap-4 rounded-2xl px-5 py-3.5" style={{ marginLeft: off }}>
                    <span className="font-mono text-[24px] font-semibold tabular-nums leading-none" style={{ color: c }}>{v === "46 s" ? `${k.seconds} s` : v}</span>
                    <span className="text-[13px] text-[#c9d4e4]">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1240px] px-4 pb-10 pt-6">
        <div className="flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 text-[12px] text-[#9aa9be] md:flex-row md:items-center">
          <span className="flex items-center gap-2"><Mark /> <span className="font-semibold tracking-[0.2em] text-[#e6edf7]">PUNA</span> · Argentina Space Hackathon 2026</span>
          <span><span className="text-[#6ee7b7]">Real:</span> focos NASA, órbitas y pagos en Avalanche · <span className="text-[#f5c26b]">Simulado:</span> aseguradora y satélites que calculan</span>
        </div>
      </footer>
    </div>
  );
}
