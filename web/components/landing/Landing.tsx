"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Flame, Landmark, Orbit, ScanSearch, ShieldCheck, Tractor, Wallet } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl } from "@/lib/format";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import { Backdrop } from "./Backdrop";
import { Globe3D, type GlobeAlert } from "./Globe3D";

const WINDOW_H = 24;
const tz = "America/Argentina/Buenos_Aires";
const hm = (d: Date) => d.toLocaleTimeString("es-AR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });

function Mark() {
  return (
    <svg width="30" height="20" viewBox="0 0 34 22" aria-hidden="true" className="text-[#3dd6f5]">
      <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="23" cy="3" r="2.4" fill="#ff7a1a" />
    </svg>
  );
}

export function Landing() {
  const sky = useSky(demo.lot.bbox, true);
  const [labels, setLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  const alerts: GlobeAlert[] = useMemo(() => {
    if (!sky.mounted) return [];
    const t = sky.now.getTime();
    return CLIENTS.map((c) => {
      const recent = assess(c, sky.fires).inField.filter((f) => t - Date.parse(f.t) < WINDOW_H * 3600_000);
      const [w, s, e, n] = c.bbox;
      return recent.length ? { id: c.id, field: c.field, lat: (s + n) / 2, lon: (w + e) / 2, count: recent.length } : null;
    }).filter((x): x is GlobeAlert => x !== null);
    // las alertas cambian con los focos, no con cada tic del reloj
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky.fires, sky.mounted]);

  const inSaa = sky.sats.filter((s) => s.inSaa).map((s) => s.name);

  return (
    <div className="theme-dark relative min-h-dvh text-ink">
      <Backdrop />

      {/* navegación */}
      <header className="sticky top-3 z-30 mx-auto mt-3 w-full max-w-[1240px] px-4">
        <nav aria-label="Principal" className="lg lg-strong flex items-center gap-4 rounded-full py-2 pl-4 pr-2">
          <Link href="/" className="flex items-center gap-2.5" aria-label="PUNA, inicio">
            <Mark />
            <span className="text-[15px] font-semibold tracking-[0.22em]">PUNA</span>
          </Link>
          <ul className="ml-4 hidden gap-1 text-[13px] text-[#d5deea] md:flex">
            <li><a href="#como" className="rounded-full px-3 py-1.5 hover:bg-white/10">Cómo funciona</a></li>
            <li><a href="#aseguradoras" className="rounded-full px-3 py-1.5 hover:bg-white/10">Para aseguradoras</a></li>
            <li><Link href="/mission-control" className="rounded-full px-3 py-1.5 hover:bg-white/10">Auditoría on-chain</Link></li>
          </ul>
          <Link href="/ingresar" className="ml-auto flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0e1b2c] hover:bg-white/90">
            Entrar a la demo <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        {/* 1 · hero */}
        <section aria-labelledby="hero-t" className="relative mx-auto grid w-full max-w-[1240px] items-center gap-6 px-4 pb-10 pt-10 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:pt-0">
          <div className="relative z-10 flex flex-col gap-6">
            <p className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-3 py-1 text-[12px] text-[#d5deea]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a1a]" aria-hidden="true" /> Para aseguradoras agro · sobre Avalanche
            </p>
            <h1 id="hero-t" className="max-w-[16ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] [text-wrap:balance] md:text-[58px]">
              Pagá siniestros de incendio con un índice <span className="text-[#3dd6f5]">auditado</span>
            </h1>
            <p className="max-w-[50ch] text-[16.5px] leading-relaxed text-[#d5deea]">
              Un satélite mide cuánto se quemó del lote. Otra empresa rehace la cuenta. El contrato paga solo si coincide.
              Sin perito, sin discusiones y con cada paso a la vista de la SSN y de tu reasegurador.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/ingresar" className="flex items-center gap-2 rounded-full bg-[#ff7a1a] px-5 py-3 text-[14px] font-semibold text-[#1a0b02] hover:bg-[#ff8f3d]">
                Ver la cartera de demo <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href={`/mission-control?job=${demo.job.id}`} className="lg rounded-full px-5 py-3 text-[14px] font-medium hover:bg-white/10">
                Ver un siniestro real on-chain
              </Link>
            </div>
            <dl className="grid max-w-[560px] grid-cols-3 gap-2.5">
              {([
                ["46 s", "del reclamo al pago", "job 7 en Fuji"],
                ["300/300", "fallas detectadas", "benchmark"],
                ["15 días", "plazo de la Res. SSN 315", "lo cumplimos de sobra"],
              ] as const).map(([v, l, s]) => (
                <div key={l} className="lg rounded-2xl px-3.5 py-3">
                  <dd className="font-mono text-[18px] font-semibold leading-none md:text-[22px]">{v}</dd>
                  <dt className="mt-1.5 text-[12px] leading-snug text-[#d5deea]">{l}</dt>
                  <dd className="text-[11px] text-muted">{s}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* globo 3D */}
          <div className="relative h-[460px] md:h-[600px] lg:h-[min(780px,calc(100dvh-90px))]">
            <Globe3D fires={sky.fires} sats={sky.sats} defs={sky.defs} now={sky.now} alerts={alerts} onLabels={setLabels} />
            {alerts.map((al, i) => {
              const p = labels[al.id];
              if (!p?.visible) return null;
              const lift = 40 + i * 38;
              return (
                <div key={al.id} className="lg pointer-events-none absolute flex items-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-[12px]"
                  style={{ left: p.x + (i % 2 ? 70 : -70), top: p.y, transform: `translate(-50%, calc(-100% - ${lift}px))` }}>
                  <Flame size={13} className="text-[#ff8a3d]" aria-hidden="true" />
                  <span className="font-semibold">{al.field}</span>
                  <span className="font-mono text-[11px] text-[#ffb27a]">{al.count} focos</span>
                </div>
              );
            })}
            <div className="lg absolute bottom-3 left-3 max-w-[300px] rounded-2xl p-3 text-[12px]" aria-live="polite">
              <p className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" aria-hidden="true" /> En vivo</p>
              <p className="mt-1 text-[#d5deea]">
                {sky.firesAt ? <>NASA FIRMS · <b className="font-mono font-semibold text-ink">{sky.fires.length.toLocaleString("es-AR")}</b> focos en el NOA · {hm(sky.firesAt)}</> : sky.firesError ? "FIRMS no responde: se muestra lo último" : "Consultando NASA FIRMS…"}
              </p>
              <p className="mt-0.5 text-[#d5deea]">
                <span className="text-[#ff8a3d]">{alerts.length}</span> {alerts.length === 1 ? "campo asegurado" : "campos asegurados"} con fuego adentro · últimas {WINDOW_H} h
              </p>
              {inSaa.length > 0 && <p className="mt-0.5 text-[#ff9b92]">▲ {inSaa.join(", ")} en la Anomalía: no recibe cálculos</p>}
            </div>
            <p className="absolute bottom-3 right-3 text-[10.5px] text-muted">Arrastrá para girar · satélites en su posición real</p>
          </div>
        </section>

        {/* 2 · cómo funciona */}
        <section id="como" aria-labelledby="como-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 py-20">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#3dd6f5]">Cómo funciona</p>
            <h2 id="como-t" className="mt-2 text-[34px] font-semibold leading-tight tracking-tight [text-wrap:balance]">
              Un paramétrico tiene tres riesgos. Del diseño y del dato ya se ocupa alguien. Del cálculo, nadie.
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#d5deea]">
              Cuando el índice lo calcula un satélite de otra empresa, el operador se certifica a sí mismo, y arriba nuestro está la
              Anomalía del Atlántico Sur, donde la radiación cambia bits sin avisar. PUNA agrega el paso que falta.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {([
              [ScanSearch, "Detecta", "Los satélites de la NASA ven fuego dentro de un campo asegurado. Un satélite fuera de la Anomalía calcula qué parte del lote se quemó.", "NASA FIRMS · órbitas reales por SGP4"],
              [ShieldCheck, "Audita", "Un validador de otra empresa rehace la cuenta capa por capa con el algoritmo de Freivalds. Si no coincide, no se paga y el trabajo pasa a otro satélite.", "ERC-8004 · score de 0 a 100"],
              [Wallet, "Paga", "Si la auditoría aprueba y el área quemada supera el disparador, el contrato le paga al asegurado. Cada paso queda con su comprobante público.", "PunaEscrow en Avalanche"],
            ] as const).map(([Icon, t, d, s], i) => (
              <li key={t} className="lg flex flex-col gap-3 rounded-[24px] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Icon size={19} aria-hidden="true" /></span>
                  <span className="font-mono text-[12px] text-muted">Paso {i + 1}</span>
                </div>
                <h3 className="text-[20px] font-semibold">{t}</h3>
                <p className="text-[14px] leading-relaxed text-[#d5deea]">{d}</p>
                <p className="mt-auto font-mono text-[11.5px] text-[#7dd3fc]">{s}</p>
              </li>
            ))}
          </ol>
          <div className="lg mt-4 grid gap-4 rounded-[24px] p-5 md:grid-cols-[1fr_auto] md:items-center">
            <p className="text-[14.5px] leading-relaxed text-[#d5deea]">
              <b className="font-semibold text-ink">En la demo:</b> incendio real en Anta, Salta. El primer satélite pasó por la Anomalía y entregó 0 %.
              El auditor lo rechazó, se reasignó a otro satélite, que midió 37,8 %, y el productor cobró 46 segundos después de abrir el reclamo.
            </p>
            <a href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer"
              className="flex w-fit items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-[13px] font-medium hover:bg-white/10">
              Ver el contrato verificado ↗
            </a>
          </div>
        </section>

        {/* 3 · para aseguradoras */}
        <section id="aseguradoras" aria-labelledby="aseg-t" className="mx-auto w-full max-w-[1240px] scroll-mt-24 px-4 pb-16 pt-6">
          <div className="max-w-[720px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#ff8a3d]">Para aseguradoras</p>
            <h2 id="aseg-t" className="mt-2 text-[34px] font-semibold leading-tight tracking-tight [text-wrap:balance]">
              Un producto de incendio para el NOA, listo para la Res. SSN 315
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#d5deea]">
              El 99 % de las primas agro del país es granizo y el NOA casi no está asegurado. Desde julio de 2026 la SSN regula los paramétricos:
              pide proveedor de datos con respaldo, acceso del asegurado al cálculo y pago en 15 días. Es lo que PUNA ya hace.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {([
              [Building2, "Aseguradora", "Liquidás incendios sin perito y sin disputas. Lanzás un producto nuevo en una zona sin cobertura, con trazabilidad para la SSN.", "nos contrata"],
              [Tractor, "Asegurado", "Cobra en minutos, sin trámites, y puede ver con qué dato y qué cuenta le pagaron o no.", "cobra más rápido"],
              [Landmark, "Reasegurador", "Ve cada evento y cada pago on-chain. Menos riesgo de modelo para dar capacidad.", "audita sin pedir nada"],
            ] as const).map(([Icon, t, d, tag]) => (
              <article key={t} className="lg flex flex-col gap-3 rounded-[24px] p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Icon size={19} aria-hidden="true" /></span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] text-[#d5deea]">{tag}</span>
                </div>
                <h3 className="text-[20px] font-semibold">{t}</h3>
                <p className="text-[14px] leading-relaxed text-[#d5deea]">{d}</p>
              </article>
            ))}
          </div>

          <div className="lg-strong lg mt-4 flex flex-col gap-5 rounded-[28px] p-6 md:flex-row md:items-center md:p-8">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ff7a1a]/20 text-[#ff8a3d]"><Orbit size={22} aria-hidden="true" /></span>
            <div className="flex-1">
              <p className="text-[22px] font-semibold leading-snug tracking-tight">Empezamos con incendios en el NOA. La misma capa sirve para cualquier índice que calcule un satélite.</p>
              <p className="mt-1 text-[14px] text-[#d5deea]">Cuando la inteligencia artificial corra en el espacio, alguien va a tener que controlar que no se equivoque antes de que se mueva la plata.</p>
            </div>
            <Link href="/ingresar" className="flex w-fit shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-[#0e1b2c] hover:bg-white/90">
              Entrar a la demo <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-[1240px] px-4 pb-10">
        <div className="flex flex-col gap-2 border-t border-white/10 pt-5 text-[11.5px] text-muted md:flex-row md:justify-between">
          <p><span className="text-[#6ee7b7]">Real:</span> focos NASA FIRMS, órbitas CelesTrak, contrato y transacciones en Avalanche Fuji. <span className="text-[#f5c26b]">Simulado:</span> la aseguradora, los productores y que esos satélites calculen.</p>
          <p>Planeta: NASA Blue Marble vía GIBS · Fondo: shaders.com · Argentina Space Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
