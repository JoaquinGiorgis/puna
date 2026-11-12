"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Flame } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl } from "@/lib/format";
import { lot14Kpis } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import { Globe3D, type GlobeAlert } from "./Globe3D";
import { NightSky } from "./NightSky";
import { AlertsMini, AuditMini, GridMini, TxMini } from "./HowCards";

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
  { title: "Otro satélite lo verifica", body: "Un auditor de otro operador comprueba cada capa de la CNN con el algoritmo de Freivalds. Si una cuenta no cierra, no se paga.", fact: "C·r ≡ A·(B·r) mód p" },
  { title: "Se paga el seguro", body: "Si la verificación aprueba y el daño supera el umbral de la póliza, el contrato en Avalanche le paga al productor.", fact: "" },
] as const;

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

          <div className="lg mt-6 grid gap-6 rounded-[28px] p-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:p-8">
            <div className="flex flex-col gap-3">
              <Label>Nuestro núcleo: la verificación matemática</Label>
              <h3 className="max-w-[24ch] text-[26px] font-semibold leading-[1.12] tracking-[-0.02em] [text-wrap:balance] md:text-[30px]">
                El auditor no opina ni confía: comprueba la cuenta
              </h3>
              <p className="max-w-[56ch] text-[15px] leading-relaxed text-[#c9d4e4] [text-wrap:pretty]">
                Cada capa de la CNN es una multiplicación de matrices. Rehacerla entera es caro, así que el auditor usa el
                <b className="font-semibold text-white"> algoritmo de Freivalds (1977)</b>: multiplica ambos lados por números al azar que el
                satélite no conoce de antemano y compara. Si alguien alteró un solo número, los dos lados dan distinto y el auditor
                señala la capa exacta. Todo en aritmética entera módulo 2³¹−1, sin redondeos.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-mono text-[17px] text-[#7dd3fc]">C · r ≡ A · (B · r)  <span className="text-[13px] text-[#9aa9be]">mód 2³¹−1</span></p>
                <dl className="mt-3 grid grid-cols-[22px_1fr] gap-x-2 gap-y-1 text-[13px] text-[#c9d4e4]">
                  <dt className="font-mono text-white">A</dt><dd>lo que entra a la capa, a partir de la imagen</dd>
                  <dt className="font-mono text-white">B</dt><dd>los pesos del modelo, fijados en el contrato antes del siniestro</dd>
                  <dt className="font-mono text-white">C</dt><dd>el resultado que entregó el satélite</dd>
                  <dt className="font-mono text-white">r</dt><dd>números al azar que elige el auditor</dd>
                </dl>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 self-center">
              {([
                ["300/300", "errores provocados que detectó, incluidos los de radiación"],
                ["0", "falsos positivos: nunca rechazó una cuenta correcta"],
                ["< 1 en 10¹⁸", "probabilidad de que una cuenta alterada pase la prueba"],
                ["Capa 3", "dónde estaba el error del caso real, señalado por el auditor"],
              ] as const).map(([v, l]) => (
                <div key={v} className="flex flex-col gap-1 border-t border-white/10 pt-3">
                  <dt className="order-2 text-[12.5px] leading-snug text-[#c9d4e4]">{l}</dt>
                  <dd className="order-1 font-mono text-[22px] font-semibold tabular-nums leading-none">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-[13px] text-[#9aa9be]">
            <span>Incendio y órbitas reales; satélites y operadores simulados.</span>
            <a href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 rounded text-[#7dd3fc] hover:text-white ${btn}`}>
              Ver los comprobantes en Avalanche <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </p>
        </section>

        {/* 3 · para aseguradoras */}
        <section id="aseguradoras" aria-labelledby="aseg-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pb-20">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="flex flex-col gap-6">
              <Label tone="#ffb27a">Para aseguradoras</Label>
              <h2 id="aseg-t" className="max-w-[20ch] text-[36px] font-semibold leading-[1.08] tracking-[-0.025em] [text-wrap:balance] md:text-[44px]">
                Paramétricos satelitales para el NOA, listos para la Res. SSN 315
              </h2>
              <dl className="grid grid-cols-2 gap-x-8 gap-y-7 pt-2">
                {([
                  ["98,9 %", "de las primas agro del país es granizo. El multirriesgo es apenas el 1,1 %.", "SSN, encuesta 2024"],
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
                  ["La aseguradora", "Liquida siniestros sin perito y sin disputas, en una zona casi sin cobertura, con trazabilidad para la SSN.", "nos contrata"],
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

          <div className="mt-16">
            <p className="text-[15px] font-semibold">Qué siniestros mide un satélite</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13.5px]">
                <thead className="text-[12px] text-[#9aa9be]">
                  <tr><th className="py-2 pr-4 font-medium">Riesgo</th><th className="pr-4 font-medium">Qué se mide en el lote</th><th className="pr-4 font-medium">Fuente satelital</th><th className="font-medium">Estado</th></tr>
                </thead>
                <tbody className="text-[#c9d4e4]">
                  {([
                    ["Incendio", "Área quemada y puntos de calor", "NASA FIRMS: VIIRS, MODIS, GOES", "En la demo, con datos reales", true],
                    ["Sequía", "Índice de vegetación y humedad del suelo", "Sentinel-2, MODIS, SMAP", "Misma capa, próximo índice", false],
                    ["Inundación", "Superficie cubierta de agua", "Radar Sentinel-1, también con nubes", "Misma capa, próximo índice", false],
                    ["Helada", "Temperatura de la superficie de noche", "MODIS, VIIRS", "Misma capa, próximo índice", false],
                  ] as const).map(([r, what, src, st, live]) => (
                    <tr key={r} className="border-t border-white/10">
                      <td className="py-3 pr-4 font-semibold text-white">{r}</td>
                      <td className="pr-4">{what}</td>
                      <td className="pr-4 text-[#9aa9be]">{src}</td>
                      <td className={live ? "font-medium text-[#6ee7b7]" : "text-[#9aa9be]"}>{st}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg lg-strong mt-12 grid gap-6 overflow-hidden rounded-[32px] p-7 md:grid-cols-[1fr_auto] md:items-end md:p-10">
            <div>
              <p className="max-w-[38ch] text-[24px] font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance] md:text-[32px]">
                Arrancamos con incendios en el NOA. La misma capa mide sequía, inundación o helada: cualquier índice que calcule un satélite.
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
