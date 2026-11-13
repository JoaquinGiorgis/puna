"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Droplets, Flame, Snowflake, Sun, type LucideIcon } from "lucide-react";
import { demo } from "@/lib/data";
import { addrUrl } from "@/lib/format";
import { lot14Kpis } from "@/lib/policy";
import { assess, CLIENTS } from "@/lib/portfolio";
import { useSky } from "@/components/useSky";
import type { GlobeAlert } from "./Globe3D";

// three.js se carga aparte y solo en el navegador: la página pinta antes y el bundle inicial es chico
const Globe3D = dynamic(() => import("./Globe3D").then((m) => m.Globe3D), { ssr: false });
const GrassField = dynamic(() => import("./GrassField").then((m) => m.GrassField), { ssr: false });
import { AuditMini, GridMini, TxMini } from "./HowCards";
import { ContactForm } from "./ContactForm";
import { Pains } from "./Pains";
import { SkyBackdrop, type Scene } from "./SkyBackdrop";
import { onScrollFrame } from "./scrollFrame";

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

/** Capa de satélites decorativos: sus animaciones CSS se pausan cuando la sección no está en pantalla. */
function Sprites({ children }: { children: React.ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "100px" }, false);
  return <div ref={ref} aria-hidden="true" data-paused={!inView} className="pointer-events-none absolute inset-0 overflow-hidden">{children}</div>;
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
        <li key={a} className="flex items-center gap-2 rounded-lg bg-[var(--ok)]/[0.08] px-2.5 py-1.5 text-[12.5px]">
          <Check size={13} strokeWidth={3} className="shrink-0 text-[var(--ok)]" aria-label="Listo" />
          <span className="font-bold">{a}</span>
          <span className="truncate text-[var(--ink-2)]">· {b}</span>
        </li>
      ))}
    </ul>
  );
}

function StepCard({ s, i, n, reserve = false }: { s: Step; i: number; n: number; reserve?: boolean }) {
  return (
    <div className="flex h-full flex-col gap-5">
      {/* con `reserve` el encabezado deja libre la esquina donde está el objeto 3D: nunca tapa el texto */}
      <div className={`flex flex-col gap-4 ${reserve ? "pr-[230px]" : ""}`}>
        <p className="text-[14px] font-bold tabular-nums tracking-[0.08em] text-[var(--act)]">PASO {String(i + 1).padStart(2, "0")} DE {String(n).padStart(2, "0")}</p>
        <h3 className="max-w-[20ch] text-[28px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">{s.title}</h3>
      </div>
      <p className="max-w-[52ch] text-[16px] font-light leading-relaxed [text-wrap:pretty]">{s.body}</p>
      <div className="relative mt-auto h-[188px] shrink-0 overflow-hidden [@media(max-height:760px)]:h-[164px] rounded-2xl border border-white bg-white/80 shadow-[0_14px_34px_-18px_rgb(30_90_150/0.45)]">{s.mini}</div>
      <p className="flex"><span className="rounded-full bg-[var(--act)]/10 px-3 py-1.5 text-[13px] font-bold tabular-nums text-[var(--act)]">{s.fact}</span></p>
    </div>
  );
}

const HowItWorks = memo(function HowItWorks({ steps }: { steps: Step[] }) {
  const sec = useRef<HTMLElement>(null);
  const last = useRef(0);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => onScrollFrame(() => {
    const el = sec.current;
    if (!el || el.offsetParent === null) return;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      el.style.setProperty("--hp", p.toFixed(4));
      const idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
      if (idx !== last.current) { last.current = idx; setActive(idx); } // solo re-render al cambiar de paso
  }), [steps.length]);

  const goTo = (i: number) => {
    const el = sec.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / steps.length) * (el.offsetHeight - window.innerHeight), behavior: reduce ? "auto" : "smooth" });
  };

  const head = (
    <div className="flex flex-col gap-4">
      <Eyebrow>Cómo funciona</Eyebrow>
      <h2 id="como-t" className="max-w-[16ch] text-[32px] font-bold leading-[1.05] tracking-[-0.035em] md:text-[40px] [@media(max-height:760px)]:text-[32px]">Del siniestro al pago, en cuatro pasos</h2>
      <p className="max-w-[40ch] text-[16px] font-light leading-relaxed">Así peritamos un incendio real en Anta, Salta. Quien mide el daño nunca es quien lo controla.</p>
    </div>
  );

  return (
    <>
      {/* escritorio: sección fija, el scroll cambia de paso */}
      <section ref={sec} id="como" aria-labelledby="como-t" data-zone="sky" className="relative hidden scroll-mt-0 lg:block" style={{ height: `${steps.length * 90 + 60}vh` }}>
        <div className="sticky top-0 flex h-svh items-center-safe overflow-hidden pb-4 pt-[112px]">
          {/* satélite de parallax: cruza por debajo de las cards, nunca debajo del header */}
          <img decoding="async" src="/landing/obj-satellite.webp" alt="" aria-hidden="true" className="pointer-events-none absolute right-0 top-[90%] w-[90px] opacity-80"
            style={{ transform: "translate3d(calc(var(--hp, 0) * -120vw + 10vw), calc(var(--hp, 0) * 60px), 0) rotate(16deg)" }} />

          <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-[400px_minmax(0,1fr)] items-center gap-14 px-6">
            <div className="relative">
            {/* satélite apoyado en la esquina de la card: queda entero, por delante y por debajo del header */}
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-8 z-10 w-[124px] drop-shadow-[0_20px_20px_rgb(11_36_64/0.25)]"
              style={{ transform: "translate3d(calc(var(--hp, 0) * -14px), calc(var(--hp, 0) * 18px), 0) rotate(calc(-10deg + var(--hp, 0) * 14deg))" }} />
            <div className="sky-glass flex flex-col gap-8 rounded-[36px] p-8 [@media(max-height:760px)]:gap-4 [@media(max-height:760px)]:p-6">
              {head}
              <ol className="flex flex-col gap-1" aria-label="Pasos">
                {steps.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.key}>
                      <button type="button" onClick={() => goTo(i)} aria-current={on ? "step" : undefined}
                        className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left [@media(max-height:760px)]:py-2 ${ring} ${on ? "bg-white shadow-[0_12px_28px_-14px_rgb(30_90_150/0.4)]" : "hover:bg-white/50"}`}>
                        <span className={`h-8 w-1 rounded-full transition-colors ${on ? "bg-[var(--act)]" : "bg-[var(--ink)]/15"}`} aria-hidden="true" />
                        <span className={`text-[15px] tabular-nums ${on ? "font-bold text-[var(--act)]" : "text-[var(--ink-2)]"}`}>{String(i + 1).padStart(2, "0")}</span>
                        <span className={`text-[17px] ${on ? "font-bold" : ""}`}>{s.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            </div>

            <div className="relative h-[min(620px,calc(100svh-136px))] min-h-[500px]">
              <div className="sky-glass absolute inset-y-0 left-0 right-[60px] rounded-[36px] p-10">
                <div key={active} className="step-swap h-full"><StepCard s={steps[active]} i={active} n={steps.length} reserve /></div>
              </div>
              {steps.map((s, i) => (
                <div key={s.key} className="obj right-0 top-5 flex h-[170px] w-[220px] items-start justify-end [@media(max-height:760px)]:h-[140px]" data-on={i === active}>
                  <img decoding="async" src={s.obj} alt={i === active ? s.objAlt : ""} className="obj-bob h-full w-auto max-w-full object-contain drop-shadow-[0_30px_30px_rgb(11_36_64/0.28)]" />
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
                <img decoding="async" src={s.obj} alt={s.objAlt} className="absolute -top-8 right-4 h-[116px] w-auto max-w-[150px] object-contain object-right-top drop-shadow-[0_20px_20px_rgb(11_36_64/0.25)]" />
                <StepCard s={s} i={i} n={steps.length} />
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
});

/* ───────────────────────── Qué medimos ───────────────────────── */

type Peril = {
  key: "fire" | "drought" | "flood" | "frost"; name: string; icon: LucideIcon; tone: string;
  lead: string; measure: string; src: string; live: boolean; status: string;
};
const PERILS: Peril[] = [
  { key: "fire", name: "Incendio", icon: Flame, tone: "#ffb27a", live: true, status: "En la demo · 37,8 %",
    lead: "La NASA detecta focos de calor dentro del lote y un satélite mide qué parte se quemó, celda por celda. Si supera el umbral de la póliza, se paga.",
    measure: "Área quemada y focos de calor", src: "NASA FIRMS · VIIRS, MODIS, GOES" },
  { key: "drought", name: "Sequía", icon: Sun, tone: "#ffd27a", live: false, status: "Próximo índice",
    lead: "Seguimos el vigor del cultivo y la humedad del suelo durante toda la campaña, y lo comparamos con la historia del mismo lote.",
    measure: "Vigor de la vegetación y humedad del suelo", src: "Sentinel-2 · MODIS · SMAP" },
  { key: "flood", name: "Inundación", icon: Droplets, tone: "#9fd8ff", live: false, status: "Próximo índice",
    lead: "El radar ve a través de las nubes: medimos qué parte del lote quedó bajo el agua y durante cuántos días.",
    measure: "Superficie del lote cubierta de agua", src: "Radar Sentinel-1" },
  { key: "frost", name: "Helada", icon: Snowflake, tone: "#d6c8ff", live: false, status: "Próximo índice",
    lead: "Medimos la temperatura de la superficie durante la noche y contamos las horas bajo cero en las etapas sensibles del cultivo.",
    measure: "Temperatura de la superficie de noche", src: "MODIS · VIIRS" },
];

/**
 * Sección fija, una pantalla por siniestro: el fondo es la foto de la condición y la explicación va directo
 * sobre ella (texto blanco sobre un degradé oscuro, contraste AA). Al scrollear se pasa de una condición a la
 * siguiente; el riel de la derecha muestra el avance y permite saltar. Al terminar, el contenido se desvanece
 * antes de que entre el cierre, así nunca se superpone con la sección siguiente.
 */
const Weather = memo(function Weather({ active, setActive }: { active: number; setActive: (i: number) => void }) {
  const sec = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const last = useRef(-1);
  const reduce = useReducedMotion();
  const n = PERILS.length;

  useEffect(() => onScrollFrame(() => {
    const el = sec.current;
    if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(0.9999, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      const idx = Math.floor(p * n);
      if (idx !== last.current) { last.current = idx; setActive(idx); }
      // entrada y salida: opacidad según cuánto de la sección ocupa la pantalla
      const enter = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.5)));
      const exit = Math.min(1, Math.max(0, (r.bottom - vh * 0.6) / (vh * 0.35)));
      if (inner.current) inner.current.style.opacity = String(Math.min(enter, exit));
  }), [n, setActive]);

  const goTo = (i: number) => {
    const el = sec.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + ((i + 0.5) / n) * (el.offsetHeight - window.innerHeight), behavior: reduce ? "auto" : "smooth" });
  };

  const p = PERILS[active];
  const I = p.icon;
  return (
    <section ref={sec} id="medimos" aria-labelledby="wx-t" data-zone="wx" className="relative" style={{ height: `${n * 85 + 30}vh` }}>
      <div ref={inner} className="sticky top-0 flex h-svh flex-col justify-center px-4 pb-8 pt-24 text-white [text-shadow:0_2px_18px_rgb(4_16_30/0.45)]">
        <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 id="wx-t" className="text-[14px] font-bold uppercase tracking-[0.14em] text-white/85">Qué siniestros medimos</h2>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            {/* explicación de la condición activa, directo sobre su foto */}
            <div key={p.key} className="step-swap flex max-w-[760px] flex-col gap-4" aria-live="polite">
              <p className="flex items-center gap-3 text-[15px] font-bold tabular-nums">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-white/40 bg-white/15 backdrop-blur-md"><I size={20} strokeWidth={2} style={{ color: p.tone }} aria-hidden="true" /></span>
                {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
              </p>
              <h3 className="text-[48px] font-bold leading-none tracking-[-0.045em] md:text-[72px]">{p.name}</h3>
              <p className="max-w-[56ch] text-[17px] leading-relaxed md:text-[19px]">{p.lead}</p>
              <dl className="grid gap-x-8 gap-y-3 border-t border-white/30 pt-4 text-[14px] sm:grid-cols-[auto_auto_auto] sm:justify-start [text-shadow:none]">
                <div><dt className="text-white/75">Qué medimos</dt><dd className="mt-1 whitespace-nowrap font-bold">{p.measure}</dd></div>
                <div><dt className="text-white/75">Sensores</dt><dd className="mt-1 whitespace-nowrap font-bold">{p.src}</dd></div>
                <div><dt className="text-white/75">Estado</dt>
                  <dd className="mt-1 font-bold">
                    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] ${p.live ? "bg-[#34d399]/25 text-[#d1fae5]" : "bg-white/15"}`}>{p.live ? "✓" : "→"} {p.status}</span>
                  </dd>
                </div>
              </dl>
            </div>

            {/* riel de avance: muestra en qué condición estás y permite saltar */}
            <ol className="flex gap-2 lg:flex-col lg:gap-1.5 [text-shadow:none]" aria-label="Condiciones">
              {PERILS.map((q, i) => {
                const on = i === active;
                const Q = q.icon;
                return (
                  <li key={q.key} className="flex-1 lg:flex-none">
                    <button type="button" onClick={() => goTo(i)} aria-current={on ? "step" : undefined} aria-label={q.name}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left backdrop-blur-md transition ${ring} ${on ? "border-white/70 bg-white/90 text-[var(--ink)]" : "border-white/25 bg-white/10 text-white hover:bg-white/20"}`}>
                      <Q size={18} strokeWidth={2} aria-hidden="true" style={on ? undefined : { color: q.tone }} />
                      <span className="hidden text-[15px] font-bold sm:inline">{q.name}</span>
                      <span className={`ml-auto hidden h-1.5 w-1.5 rounded-full lg:block ${q.live ? "bg-[#34d399]" : "bg-transparent"}`} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
});

/** Pin de alerta igual al de la cartera: círculo rojo con borde blanco, ícono de fuego, pulso y etiqueta de vidrio. */
function renderPin(al: GlobeAlert, i: number) {
  return (
    <>
      <span aria-hidden="true" className="pin-pulse absolute -left-[18px] -top-[18px] h-9 w-9 rounded-full border border-[var(--alert)] bg-[var(--alert)]/25" />
      <span className="absolute -left-[11px] -top-[11px] grid h-[22px] w-[22px] place-items-center rounded-full border-2 border-white bg-[var(--alert)] shadow-[0_4px_10px_rgb(11_36_64/0.35)]">
        <Flame size={12} strokeWidth={2.6} color="#fff" aria-hidden="true" />
      </span>
      <span className="sky-glass sky-glass-strong absolute left-4 whitespace-nowrap rounded-lg px-2.5 py-1 leading-tight" style={{ top: i % 2 ? 10 : -48 }}>
        <span className="block text-[12.5px] font-bold">{al.field}</span>
        <span className="block text-[11.5px] font-bold text-[var(--alert)]">{al.note}</span>
      </span>
    </>
  );
}

/* ───────────────────────── Landing ───────────────────────── */

export function Landing() {
  const sky = useSky(demo.lot.bbox, true);
  const k = useMemo(() => lot14Kpis(), []);
  const pct = `${(k.indexBps / 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })} %`;
  const trigger = `${(k.triggerBps / 100).toLocaleString("es-AR", { minimumFractionDigits: 1 })} %`;

  // solo alertas: fuego reciente dentro de un campo asegurado. Si hoy no hay, mostramos el incendio real del Lote 14.
  const alerts: GlobeAlert[] = useMemo(() => {
    if (!sky.mounted) return [];
    const t = Date.now();
    const live = CLIENTS.map((c) => {
      const recent = assess(c, sky.fires).inField.filter((f) => t - Date.parse(f.t) < WINDOW_H * 3600_000);
      const [w, s, e, n] = c.bbox;
      return recent.length ? { id: c.id, field: c.field, lat: (s + n) / 2, lon: (w + e) / 2, count: recent.length, note: `! ${recent.length} focos en el lote` } : null;
    }).filter((x): x is GlobeAlert => x !== null);
    if (live.length) return live;
    const [w, s, e, n] = demo.lot.bbox;
    return [{ id: "lote-14", field: "Lote 14", lat: (s + n) / 2, lon: (w + e) / 2, count: demo.lot.foci.length, note: `! ${demo.lot.foci.length} focos en el lote` }];
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
  const [grassRef, grassNear] = useInView<HTMLDivElement>({ rootMargin: "900px 0px" }); // monta three.js recién cerca

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
          </ul>
          <Link href="/ingresar" className={`ml-auto flex items-center gap-1.5 rounded-full bg-[var(--ink)] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#13365e] ${ring}`}>
            Entrar a la demo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main id="contenido" className="relative z-10">
        {/* 1 · portada */}
        <section aria-labelledby="hero-t" data-zone="sky" className="relative">
          <Sprites>
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-a left-0 top-[2%] w-[130px] opacity-90" />
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-b left-0 top-[86%] w-[120px] opacity-80" />
          </Sprites>
          <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-6 px-4 pb-10 pt-14 lg:min-h-[calc(100dvh-80px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pt-0">
            <div className="relative z-10 flex flex-col gap-6">
              <p className="rise sky-glass flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold">
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true"><span className="pin-pulse absolute inset-0 rounded-full bg-[var(--alert)]" /><span className="relative h-2.5 w-2.5 rounded-full bg-[var(--alert)]" /></span>
                Peritaje satelital para aseguradoras agro
              </p>
              <h1 id="hero-t" className="rise max-w-[19ch] text-[40px] font-bold leading-[1.02] tracking-[-0.04em] [text-wrap:balance] md:text-[58px]" style={{ animationDelay: "60ms" }}>
                Resolvé el peritaje de siniestros con auditoría satelital
              </h1>
              <p className="rise max-w-[46ch] text-[17px] font-light leading-relaxed md:text-[19px]" style={{ animationDelay: "120ms" }}>
                Un satélite mide el daño, otro de otro operador audita la medición y el seguro paramétrico se paga en segundos, con evidencia lista para la SSN.
              </p>
              <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
                <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgb(11_36_64/0.6)] hover:bg-[#13365e] ${ring}`}>
                  Ver la cartera de demo <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative h-[420px] md:h-[600px] lg:h-[min(760px,calc(100dvh-90px))]">
              <Globe3D sats={sky.sats} defs={sky.defs} now={sky.now} alerts={alerts} renderPin={renderPin} />
            </div>
          </div>
        </section>

        {/* 2 · problemas, con pasto que crece entre y debajo de las cards */}
        <section ref={painsRef} id="problemas" aria-labelledby="aseg-t" data-zone="sky" className="relative scroll-mt-24 pb-[200px] pt-24">
          <div className="mx-auto flex max-w-[760px] flex-col items-center gap-4 px-4 text-center">
            <Eyebrow>Para aseguradoras</Eyebrow>
            <h2 id="aseg-t" className="text-[32px] font-bold leading-[1.05] tracking-[-0.035em] [text-wrap:balance] md:text-[44px]">Cuatro problemas de las aseguradoras que PUNA resuelve</h2>
            <p className="max-w-[56ch] text-[17px] font-light leading-relaxed">Cómo se hace hoy y qué cambia, con los números del incendio real del Lote 14.</p>
          </div>
          <div className="relative mx-auto mt-14 max-w-[1240px] px-4">
            <Pains seconds={k.seconds} txs={k.txs} fee={k.fee} indemnity={k.indemnity} inView={painsIn} />
          </div>
          {/* pasto 3D detrás de las cards; se difumina hacia abajo y se funde con el cielo */}
          <div ref={grassRef} aria-hidden="true" className="grass-fade absolute inset-x-0 bottom-0 z-0 h-[440px]">
            {grassNear && <GrassField grow={painsIn} className="h-full w-full" />}
          </div>
        </section>

        {/* 3 · cómo funciona */}
        <HowItWorks steps={steps} />

        {/* 4 · qué medimos: el fondo toma la condición activa */}
        <Weather active={wx} setActive={setWx} />

        {/* 5 · cierre con sol */}
        <section aria-labelledby="cta-t" data-zone="sun" className="relative flex min-h-svh flex-col px-4 pt-28">
          <Sprites>
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-a left-0 top-[3%] w-[120px] opacity-90" />
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-c left-0 top-[30%] w-[170px]" />
            <img decoding="async" src="/landing/obj-satellite.webp" alt="" className="sky-sat sky-sat-d left-0 top-[58%] w-[110px] opacity-90" />
          </Sprites>
          {/* texto a la izquierda, centrado en vertical contra el formulario de la derecha */}
          <div className="relative mx-auto my-auto grid w-full max-w-[1240px] items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="flex flex-col gap-7 [text-shadow:0_2px_24px_rgb(8_40_80/0.35)]">
              <h2 id="cta-t" className="max-w-[16ch] text-[38px] font-bold leading-[1.02] tracking-[-0.04em] text-white [text-wrap:balance] md:text-[56px]">Peritá tu próximo siniestro desde el espacio</h2>
              <p className="max-w-[44ch] text-[17px] leading-relaxed text-white md:text-[19px]">Mirá la cartera de demo con el incendio real del Lote 14: la alerta, la medición, la auditoría y el pago.</p>
              <div className="flex flex-wrap gap-3 [text-shadow:none]">
                <Link href="/ingresar" className={`flex items-center gap-2 rounded-full bg-white px-7 py-4 text-[16px] font-bold text-[var(--ink)] shadow-[0_18px_40px_-14px_rgb(8_40_80/0.6)] hover:bg-[#eaf6fd] ${ring}`}>
                  Entrar a la demo <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <ContactForm />
          </div>
          <footer className="relative mx-auto mb-6 w-full max-w-[1240px]">
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
