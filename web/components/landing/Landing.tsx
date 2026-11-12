"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Droplets, Flame, Snowflake, Sun, type LucideIcon } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl } from "@/lib/format";
import { lot14Kpis } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import { Globe3D, type GlobeAlert } from "./Globe3D";
import { AuditMini, GridMini, TxMini } from "./HowCards";
import { Pains } from "./Pains";
import { SkyBackdrop, type Scene } from "./SkyBackdrop";

/**
 * Landing "cielo continuo": un solo fondo fijo (cielo + nubes con parallax) que cuenta la historia completa
 * sin cortes entre secciones: alerta en el globo → problemas (crece el pasto) → cómo funciona (sección fija
 * con objetos 3D por paso) → qué medimos (el fondo toma la condición activa) → cierre con sol.
 */

const WINDOW_H = 24;
const ring = "transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--act)] focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function useInView<T extends Element>(opts: IntersectionObserverInit = { threshold: 0.2 }, once = true) {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { set(true); if (once) io.disconnect(); } else if (!once) set(false);
    }, opts);
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView] as const;
}

function useReducedMotion() {
  const [r, set] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    set(m.matches);
    const on = () => set(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

function Mark({ light = false }: { light?: boolean }) {
  return (
    <svg width="30" height="20" viewBox="0 0 34 22" aria-hidden="true">
      <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke={light ? "#fff" : "#0b2440"} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="23" cy="3" r="2.6" fill="#ea6a12" />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] font-bold uppercase tracking-[0.14em] text-[var(--act)]">{children}</p>;
}

/* ───────────────────────── Cómo funciona ───────────────────────── */

type Step = { key: string; obj: string; objAlt: string; title: string; body: string; fact: string; mini: React.ReactNode };

function EvidenceMini({ txs }: { txs: number }) {
  const rows = [
    [`${demo.lot.foci.length} focos NASA FIRMS`, "huella guardada antes de calcular"],
    ["Medición del daño", "raíz Merkle por capa"],
    ["Auditoría de otro operador", "certificado firmado"],
    ["Pago del seguro", `${txs} comprobantes en Avalanche`],
  ];
  return (
    <ul className="flex h-full flex-col justify-center gap-1.5 p-3">
      {rows.map(([a, b]) => (
        <li key={a} className="flex items-center gap-2 rounded-lg bg-[#34d399]/10 px-2.5 py-1.5 text-[12px]">
          <Check size={13} strokeWidth={3} className="shrink-0 text-[#6ee7b7]" aria-hidden="true" />
          <span className="font-semibold text-[#e6edf7]">{a}</span>
          <span className="truncate text-[#b0bed1]">· {b}</span>
        </li>
      ))}
    </ul>
  );
}

function StepCard({ s, i, n }: { s: Step; i: number; n: number }) {
  return (
    <div className="flex h-full flex-col gap-5">
      <p className="text-[14px] font-bold tabular-nums tracking-[0.08em] text-[var(--act)]">PASO {String(i + 1).padStart(2, "0")} DE {String(n).padStart(2, "0")}</p>
      <h3 className="max-w-[15ch] text-[34px] font-bold leading-[1.02] tracking-[-0.035em] md:text-[44px]">{s.title}</h3>
      <p className="max-w-[46ch] text-[17px] font-light leading-relaxed [text-wrap:pretty]">{s.body}</p>
      <div className="theme-dark relative mt-auto h-[188px] overflow-hidden rounded-2xl bg-[#0b1626] shadow-[0_18px_40px_-18px_rgb(11_36_64/0.7)]">{s.mini}</div>
      <p className="flex"><span className="rounded-full bg-[var(--act)]/10 px-3 py-1.5 text-[13px] font-bold tabular-nums text-[var(--act)]">{s.fact}</span></p>
    </div>
  );
}

function HowItWorks({ steps }: { steps: Step[] }) {
  const sec = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    let raf = 0;
    const apply = () => {
      const el = sec.current;
      if (!el || el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      el.style.setProperty("--hp", p.toFixed(4));
      setActive(Math.min(steps.length - 1, Math.floor(p * steps.length)));
    };
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, [steps.length]);

  const goTo = (i: number) => {
    const el = sec.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / steps.length) * (el.offsetHeight - window.innerHeight), behavior: reduce ? "auto" : "smooth" });
  };

  const head = (
    <div className="flex flex-col gap-4">
      <Eyebrow>Cómo funciona</Eyebrow>
      <h2 id="como-t" className="max-w-[14ch] text-[40px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[52px]">Del siniestro al pago, en cuatro pasos</h2>
      <p className="max-w-[40ch] text-[17px] font-light leading-relaxed">Así peritamos un incendio real en Anta, Salta. Quien mide el daño nunca es quien lo controla.</p>
    </div>
  );

  return (
    <>
      {/* escritorio: sección fija, el scroll cambia de paso */}
      <section ref={sec} id="como" aria-labelledby="como-t" data-zone="sky" className="relative hidden scroll-mt-0 lg:block" style={{ height: `${steps.length * 90 + 60}vh` }}>
        <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
          {/* satélites de parallax: cruzan el cielo a medida que avanza el scroll */}
          <img src="/landing/obj-satellite.webp" alt="" aria-hidden="true" className="pointer-events-none absolute left-0 top-[9%] w-[150px] drop-shadow-[0_20px_20px_rgb(11_36_64/0.25)]"
            style={{ transform: "translate3d(calc(var(--hp, 0) * 115vw - 18vw), calc(var(--hp, 0) * -40px), 0) rotate(-8deg)" }} />
          <img src="/landing/obj-satellite.webp" alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-[90%] w-[90px] opacity-80"
            style={{ transform: "translate3d(calc(var(--hp, 0) * -120vw + 10vw), calc(var(--hp, 0) * 60px), 0) rotate(16deg)" }} />

          <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-[400px_minmax(0,1fr)] items-center gap-14 px-6">
            <div className="flex flex-col gap-10">
              {head}
              <ol className="flex flex-col gap-1.5" aria-label="Pasos">
                {steps.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.key}>
                      <button type="button" onClick={() => goTo(i)} aria-current={on ? "step" : undefined}
                        className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left ${ring} ${on ? "sky-glass-strong shadow-[0_14px_30px_-14px_rgb(30_90_150/0.35)]" : "hover:bg-white/40"}`}>
                        <span className={`h-9 w-1 rounded-full transition-colors ${on ? "bg-[var(--act)]" : "bg-white/80"}`} aria-hidden="true" />
                        <span className={`text-[15px] tabular-nums ${on ? "font-bold text-[var(--act)]" : "text-[var(--ink-2)]"}`}>{String(i + 1).padStart(2, "0")}</span>
                        <span className={`text-[17px] ${on ? "font-bold" : ""}`}>{s.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="relative h-[620px]">
              <div className="sky-glass absolute inset-y-0 left-0 right-[60px] rounded-[36px] p-10">
                <div key={active} className="step-swap h-full"><StepCard s={steps[active]} i={active} n={steps.length} /></div>
              </div>
              {steps.map((s, i) => (
                <div key={s.key} className="obj -right-6 -top-14 w-[320px]" data-on={i === active}>
                  <img src={s.obj} alt={i === active ? s.objAlt : ""} className="obj-bob w-full drop-shadow-[0_30px_30px_rgb(11_36_64/0.28)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* móvil y tablet: pasos apilados */}
      <section aria-labelledby="como-t-m" data-zone="sky" className="relative px-4 py-20 lg:hidden">
        <div className="mx-auto flex max-w-[680px] flex-col gap-10">
          <div className="flex flex-col gap-4">
            <Eyebrow>Cómo funciona</Eyebrow>
            <h2 id="como-t-m" className="text-[36px] font-bold leading-[1.04] tracking-[-0.04em]">Del siniestro al pago, en cuatro pasos</h2>
            <p className="text-[17px] font-light leading-relaxed">Así peritamos un incendio real en Anta, Salta. Quien mide el daño nunca es quien lo controla.</p>
          </div>
          <ol className="flex flex-col gap-6">
            {steps.map((s, i) => (
              <li key={s.key} className="sky-glass relative rounded-[28px] p-6 pt-24">
                <img src={s.obj} alt={s.objAlt} className="absolute -top-8 right-4 w-[150px] drop-shadow-[0_20px_20px_rgb(11_36_64/0.25)]" />
                <StepCard s={s} i={i} n={steps.length} />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

/* ───────────────────────── Qué medimos ───────────────────────── */

type Peril = { key: "fire" | "drought" | "flood" | "frost"; name: string; icon: LucideIcon; tone: string; what: string; src: string; live: boolean };
const PERILS: Peril[] = [
  { key: "fire", name: "Incendio", icon: Flame, tone: "#b54708", what: "Área quemada y puntos de calor dentro del lote.", src: "NASA FIRMS · VIIRS, MODIS, GOES", live: true },
  { key: "drought", name: "Sequía", icon: Sun, tone: "#93590a", what: "Vigor de la vegetación y humedad del suelo.", src: "Sentinel-2 · MODIS · SMAP", live: false },
  { key: "flood", name: "Inundación", icon: Droplets, tone: "#0b6cb8", what: "Superficie del lote cubierta de agua, aun con nubes.", src: "Radar Sentinel-1", live: false },
  { key: "frost", name: "Helada", icon: Snowflake, tone: "#5b3fb5", what: "Temperatura de la superficie durante la noche.", src: "MODIS · VIIRS", live: false },
];

function Weather({ active, setActive, running }: { active: number; setActive: (i: number) => void; running: boolean }) {
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!running || paused || reduce) return;
    const t = setInterval(() => setActive((active + 1) % PERILS.length), 3800);
    return () => clearInterval(t);
  }, [running, paused, reduce, active, setActive]);

  return (
    <section id="medimos" aria-labelledby="wx-t" data-zone="wx" className="relative px-4 py-28 md:py-36">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-12">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
          <Eyebrow>Qué siniestros medimos</Eyebrow>
          <h2 id="wx-t" className="text-[40px] font-bold leading-[1.02] tracking-[-0.04em] [text-wrap:balance] md:text-[56px]">Si un satélite lo ve, PUNA lo puede peritar</h2>
          <p className="max-w-[48ch] text-[17px] leading-relaxed">Cada condición tiene su sensor. El fondo cambia con la que elijas.</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4" onMouseLeave={() => setPaused(false)}>
          {PERILS.map((p, i) => {
            const on = i === active;
            const I = p.icon;
            return (
              <li key={p.key}>
                <button type="button" aria-pressed={on} onMouseEnter={() => { setPaused(true); setActive(i); }} onFocus={() => { setPaused(true); setActive(i); }} onClick={() => setActive(i)}
                  className={`sky-glass sky-glass-strong flex h-full w-full flex-col gap-4 rounded-[28px] p-5 text-left transition duration-500 ${ring} ${on ? "-translate-y-2" : "opacity-95"}`}
                  style={on ? { boxShadow: `0 0 0 2px ${p.tone}, 0 30px 60px -20px rgb(11 36 64 / 0.45)` } : undefined}>
                  <span className="relative block h-[120px] overflow-hidden rounded-2xl">
                    <img src={`/landing/wx-${p.key}.webp`} alt="" loading="lazy" className={`h-full w-full object-cover transition duration-700 ${on ? "scale-110" : ""}`} />
                  </span>
                  <span className="flex items-center gap-2 text-[22px] font-bold tracking-[-0.02em]"><I size={22} strokeWidth={2} style={{ color: p.tone }} aria-hidden="true" />{p.name}</span>
                  <span className="text-[14.5px] leading-snug text-[var(--ink-2)]">{p.what}</span>
                  <span className="mt-auto flex flex-col gap-2">
                    <span className={`w-fit rounded-full px-2.5 py-1 text-[12px] font-bold ${p.live ? "bg-[var(--ok)]/12 text-[var(--ok)]" : "bg-[var(--ink)]/[0.07] text-[var(--ink-2)]"}`}>
                      {p.live ? "✓ En la demo" : "→ Próximo índice"}
                    </span>
                    <span className="text-[12.5px] text-[var(--ink-2)]">{p.src}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────── Landing ───────────────────────── */

export function Landing() {
  const sky = useSky(demo.lot.bbox, true);
  const [labels, setLabels] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const k = useMemo(() => lot14Kpis(), []);
  const pct = `${(k.indexBps / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
  const trigger = `${(k.triggerBps / 100).toLocaleString("es-AR", { minimumFractionDigits: 1 })} %`;

  // solo alertas: fuego reciente dentro de un campo asegurado. Si hoy no hay, mostramos el incendio real del Lote 14.
  const alerts: (GlobeAlert & { note: string })[] = useMemo(() => {
    if (!sky.mounted) return [];
    const t = Date.now();
    const live = CLIENTS.map((c) => {
      const recent = assess(c, sky.fires).inField.filter((f) => t - Date.parse(f.t) < WINDOW_H * 3600_000);
      const [w, s, e, n] = c.bbox;
      return recent.length ? { id: c.id, field: `${c.field} · ${c.place}`, lat: (s + n) / 2, lon: (w + e) / 2, count: recent.length, note: `${recent.length} focos en las últimas 24 h` } : null;
    }).filter((x): x is GlobeAlert & { note: string } => x !== null);
    if (live.length) return live;
    const [w, s, e, n] = demo.lot.bbox;
    return [{ id: "lote-14", field: "Lote 14 · Anta, Salta", lat: (s + n) / 2, lon: (w + e) / 2, count: demo.lot.foci.length, note: `${demo.lot.foci.length} focos · 8 al 11/11` }];
  }, [sky.fires, sky.mounted]);

  // escena del fondo según la sección que cruza el centro de la pantalla
  const [zone, setZone] = useState<"sky" | "wx" | "sun">("sky");
  const [wx, setWxState] = useState(0);
  const setWx = useCallback((i: number) => setWxState(i), []);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) setZone(((e.target as HTMLElement).dataset.zone as typeof zone) ?? "sky");
    }), { rootMargin: "-50% 0px -50% 0px" });
    document.querySelectorAll("[data-zone]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const scene: Scene = zone === "wx" ? `wx-${PERILS[wx].key}` : zone;

  const [painsRef, painsIn] = useInView<HTMLElement>({ threshold: 0.15 });

  const steps: Step[] = useMemo(() => [
    { key: "sat", obj: "/landing/obj-satellite.webp", objAlt: "Satélite de observación", title: "Un satélite mide el daño",
      body: "La NASA detecta focos de calor en el lote y el reclamo se abre solo. Un nodo en órbita recorre la imagen con una red neuronal entera (pesos fijos en la demo) y marca cada celda como quemada o sana.",
      fact: "Lote 14 · grilla de 12 × 12", mini: <GridMini pct={pct} trigger={trigger} /> },
    { key: "shield", obj: "/landing/obj-shield.webp", objAlt: "Escudo con candado", title: "Otro satélite lo verifica",
      body: "Un validador de otro operador comprueba cada capa con el algoritmo de Freivalds: prueba la cuenta con números al azar. Si un solo valor fue alterado, no cierra y no se paga.",
      fact: "C·r ≡ A·(B·r) mód p", mini: <AuditMini /> },
    { key: "dollars", obj: "/landing/obj-dollars.webp", objAlt: "Billetes y monedas", title: "Se paga el seguro",
      body: "Si la verificación aprueba y el daño supera el umbral de la póliza, el contrato en Avalanche le paga al productor. Sin legajo y sin esperar.",
      fact: `${k.indemnity} · en ${k.seconds} s`, mini: <TxMini explorer={demo.chain.explorer} /> },
    { key: "papers", obj: "/landing/obj-papers.webp", objAlt: "Carpeta con documentos sellados", title: "Queda la evidencia para la SSN",
      body: "Cada paso deja un comprobante público: los focos con su huella, la medición, la auditoría y el pago. Es lo que piden la Res. SSN 315 y el reasegurador.",
      fact: `${k.txs} comprobantes por siniestro`, mini: <EvidenceMini txs={k.txs} /> },
  ], [k, pct, trigger]);

  return (
    <div className="sky relative min-h-dvh">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">Saltar al contenido</a>
      <SkyBackdrop scene={scene} />

      <header className="sticky top-3 z-30 mx-auto mt-3 w-full max-w-[1240px] px-4">
        <nav aria-label="Principal" className="sky-glass flex items-center gap-4 rounded-full py-2 pl-5 pr-2">
          <Link href="/" className={`flex items-center gap-2.5 rounded-full ${ring}`} aria-label="PUNA, inicio">
            <Mark />
            <span className="text-[15px] font-bold tracking-[0.22em]">PUNA</span>
          </Link>
          <ul className="ml-6 hidden gap-1 text-[14px] md:flex">
            <li><a href="#problemas" className={`rounded-full px-3 py-1.5 hover:bg-white/60 ${ring}`}>Problemas</a></li>
            <li><a href="#como" className={`rounded-full px-3 py-1.5 hover:bg-white/60 ${ring}`}>Cómo funciona</a></li>
            <li><a href="#medimos" className={`rounded-full px-3 py-1.5 hover:bg-white/60 ${ring}`}>Qué medimos</a></li>
            <li><Link href="/mission-control" className={`rounded-full px-3 py-1.5 hover:bg-white/60 ${ring}`}>Ver una auditoría</Link></li>
          </ul>
          <Link href="/ingresar" className={`ml-auto flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#13365e] ${ring}`}>
            Entrar a la demo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main id="contenido" className="relative z-10">
        {/* 1 · portada */}
        <section aria-labelledby="hero-t" data-zone="sky" className="relative">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <img src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-a left-0 top-[2%] w-[130px] opacity-90" />
            <img src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-b left-0 top-[86%] w-[120px] opacity-80" />
          </div>
          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-6 px-4 pb-10 pt-14 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] lg:pt-0">
            <div className="relative z-10 flex flex-col gap-7">
              <p className="rise sky-glass flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true"><span className="pin-pulse absolute inset-0 rounded-full bg-[var(--alert)]" /><span className="relative h-2.5 w-2.5 rounded-full bg-[var(--alert)]" /></span>
                Peritaje satelital para aseguradoras agro
              </p>
              <h1 id="hero-t" className="rise max-w-[15ch] text-[48px] font-bold leading-[0.98] tracking-[-0.045em] [text-wrap:balance] md:text-[76px]" style={{ animationDelay: "60ms" }}>
                Resolvé el peritaje de siniestros con auditoría satelital
              </h1>
              <p className="rise max-w-[42ch] text-[19px] font-light leading-relaxed md:text-[21px]" style={{ animationDelay: "120ms" }}>
                Un satélite mide el daño, otro de otro operador audita la medición y el seguro se paga en segundos, con evidencia lista para la SSN.
              </p>
              <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
                <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgb(11_36_64/0.6)] hover:bg-[#13365e] ${ring}`}>
                  Ver la cartera de demo <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href={`/mission-control?job=${demo.job.id}`} className={`sky-glass flex items-center gap-1.5 rounded-full px-5 py-3.5 text-[15px] hover:bg-white ${ring}`}>
                  Mirá un siniestro real <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <dl className="rise mt-2 flex flex-wrap gap-x-9 gap-y-3" style={{ animationDelay: "240ms" }}>
                {([[`${k.seconds} s`, "del reclamo al pago"], ["300/300", "fallas detectadas"], [`${k.txs}`, "comprobantes en Avalanche"]] as const).map(([v, l]) => (
                  <div key={l} className="flex flex-col-reverse">
                    <dt className="text-[13px] text-[var(--ink-2)]">{l}</dt>
                    <dd className="text-[32px] font-light tabular-nums leading-none tracking-[-0.04em]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative h-[420px] md:h-[600px] lg:h-[min(760px,calc(100dvh-90px))]">
              <Globe3D sats={sky.sats} defs={sky.defs} now={sky.now} alerts={alerts} onLabels={setLabels} />
              {alerts.map((al, i) => {
                const p = labels[al.id];
                if (!p?.visible) return null;
                return (
                  <div key={al.id} className="pointer-events-none absolute" style={{ left: p.x, top: p.y }}>
                    <div className="sky-glass sky-glass-strong absolute left-5 whitespace-nowrap rounded-xl px-3 py-1.5 leading-tight" style={{ top: i % 2 ? 12 : -54 }}>
                      <span className="block text-[13px] font-bold">{al.field}</span>
                      <span className="flex items-center gap-1 text-[12px] font-bold text-[var(--alert)]"><Flame size={12} strokeWidth={2.6} aria-hidden="true" /> Alerta · {al.note}</span>
                    </div>
                  </div>
                );
              })}
              <p className="absolute bottom-2 right-2 rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-[var(--ink-2)]">Solo se marcan los campos asegurados con fuego · arrastrá para girar</p>
            </div>
          </div>
        </section>

        {/* 2 · problemas, con pasto que crece entre y debajo de las cards */}
        <section ref={painsRef} id="problemas" aria-labelledby="aseg-t" data-zone="sky" className="relative scroll-mt-24 pb-[230px] pt-24">
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-4 px-4 text-center">
            <Eyebrow>Para aseguradoras</Eyebrow>
            <h2 id="aseg-t" className="text-[40px] font-bold leading-[1.02] tracking-[-0.04em] [text-wrap:balance] md:text-[56px]">Cuatro problemas del seguro agro que PUNA resuelve</h2>
            <p className="max-w-[52ch] text-[18px] font-light leading-relaxed">Cómo se hace hoy y qué cambia, con los números del incendio real del Lote 14.</p>
          </div>
          <div className="relative mx-auto mt-14 max-w-[1240px] px-4">
            {/* matas a los costados de las cards: detrás del contenido, solo en pantallas anchas */}
            {([["-left-[170px] h-[300px] w-[300px]", 0], ["-right-[170px] h-[330px] w-[320px]", 160]] as const).map(([pos, d]) => (
              <div key={pos} aria-hidden="true" data-grown={painsIn} className={`grass grass-tuft bottom-[-120px] hidden xl:block ${pos}`} style={{ transitionDelay: `${d}ms` }}>
                <div className="grass-sway" style={{ animationDelay: `-${d / 100}s` }} />
              </div>
            ))}
            <Pains seconds={k.seconds} txs={k.txs} fee={k.fee} indemnity={k.indemnity} inView={painsIn} />
          </div>
          <div aria-hidden="true" data-grown={painsIn} className="grass grass-edge inset-x-0 bottom-0 h-[300px] opacity-90" style={{ transitionDelay: "100ms" }}>
            <div className="grass-sway" style={{ animationDuration: "8s", backgroundPosition: "700px bottom" }} />
          </div>
          <div aria-hidden="true" data-grown={painsIn} className="grass grass-edge inset-x-0 bottom-0 h-[210px]" style={{ transitionDelay: "260ms" }}>
            <div className="grass-sway" style={{ animationDuration: "6s" }} />
          </div>
        </section>

        {/* 3 · cómo funciona */}
        <HowItWorks steps={steps} />
        <p className="relative mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 pb-6 text-center text-[13px]">
          <span className="sky-glass rounded-full px-3 py-1.5">Incendio y órbitas reales; satélites y operadores simulados.</span>
          <a href={addrUrl(demo.chain.explorer, demo.contracts.escrow)} target="_blank" rel="noreferrer" className={`sky-glass inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-bold text-[var(--act)] underline underline-offset-2 ${ring}`}>
            Ver los comprobantes en Avalanche <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </p>

        {/* 4 · qué medimos: el fondo toma la condición activa */}
        <Weather active={wx} setActive={setWx} running={zone === "wx"} />

        {/* 5 · cierre con sol */}
        <section aria-labelledby="cta-t" data-zone="sun" className="relative flex min-h-[92dvh] flex-col justify-center px-4 pt-24">
          <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-7 [text-shadow:0_2px_24px_rgb(8_40_80/0.35)]">
            <h2 id="cta-t" className="max-w-[14ch] text-[48px] font-bold leading-[0.98] tracking-[-0.045em] text-white md:text-[80px]">Peritá tu próximo siniestro desde el espacio</h2>
            <p className="max-w-[44ch] text-[19px] leading-relaxed text-white md:text-[21px]">Mirá la cartera de demo con el incendio real del Lote 14: la alerta, la medición, la auditoría y el pago.</p>
            <div className="flex flex-wrap gap-3 [text-shadow:none]">
              <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[16px] font-bold text-[var(--ink)] shadow-[0_18px_40px_-14px_rgb(8_40_80/0.6)] hover:bg-[#eaf6fd] ${ring}`}>
                Entrar a la demo <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href={`/mission-control?job=${demo.job.id}`} className={`flex items-center gap-1.5 rounded-full border border-white/80 bg-white/10 px-6 py-4 text-[16px] text-white backdrop-blur hover:bg-white/20 ${ring}`}>
                Ver una auditoría <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <footer className="mx-auto mb-6 mt-auto w-full max-w-[1240px] pt-24">
            <div className="sky-glass flex flex-col items-start justify-between gap-2 rounded-[24px] px-5 py-3.5 text-[13px] md:flex-row md:items-center md:rounded-full">
              <span className="flex items-center gap-2"><Mark /> <span className="font-bold tracking-[0.2em]">PUNA</span> · Argentina Space Hackathon 2026</span>
              <span><b className="text-[var(--ok)]">Real:</b> focos NASA, órbitas y pagos en Avalanche · <b className="text-[#8a4b00]">Simulado:</b> aseguradora y satélites que calculan</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
