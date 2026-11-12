"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { Check } from "lucide-react";
import { LEVEL_ICON } from "@/components/icons";
import { BOUNDS, FRAME, clampView, proj, satOnMap, satPoint, type View } from "@/lib/globe-noa";
import type { Assessment, Client, Level } from "@/lib/portfolio";
import { SAA, satAt, type Fire, type SatDef, type SatNow } from "@/lib/sky";

export type Row = { c: Client; a: Assessment };
export type { View };

/** Polígono de la Anomalía (el mismo de saaBps), densificado para que siga la curvatura del globo. */
const SAA_PTS = (() => {
  const out: { x: number; y: number; visible: boolean }[] = [];
  for (let i = 0; i < SAA.length; i++) {
    const [lo1, la1] = SAA[i], [lo2, la2] = SAA[(i + 1) % SAA.length];
    for (let t = 0; t < 1; t += 0.1) out.push(proj(la1 + (la2 - la1) * t, lo1 + (lo2 - lo1) * t));
  }
  return out;
})();
const SAA_LABEL = proj(-9, -60);

const PIN: Record<Level, { bg: string; fg: string; icon: string; label: string }> = {
  atencion: { bg: "#c4352b", fg: "#fff", icon: "!", label: "atención" },
  siniestro: { bg: "#0369a1", fg: "#fff", icon: "◆", label: "siniestro on-chain" },
  vigilancia: { bg: "#f5b03d", fg: "#0e1b2c", icon: "▲", label: "vigilancia" },
  ok: { bg: "#34d399", fg: "#0e1b2c", icon: "✓", label: "sin novedades" },
};
const CITIES: [string, number, number][] = [["Salta", -24.79, -65.41], ["S. M. de Tucumán", -26.82, -65.22], ["S. S. de Jujuy", -24.19, -65.3]];

/** Etiqueta en vidrio anclada a un punto del globo; mantiene su tamaño en pantalla con cualquier zoom. */
function Tag({ x, y, dx = 14, dy = -14, k, children }: { x: number; y: number; dx?: number; dy?: number; k: number; children: React.ReactNode }) {
  const s = 1 / k;
  return (
    <foreignObject x={x + dx * s} y={y + dy * s} width={280 * s} height={60 * s} overflow="visible" className="pointer-events-none">
      <div style={{ transform: `scale(${s})`, transformOrigin: "0 0", width: 280 }}>
        <div className="lg inline-block rounded-lg px-2 py-1 leading-tight">{children}</div>
      </div>
    </foreignObject>
  );
}

/**
 * Globo a pantalla completa: render NASA Blue Marble con la cámara sobre el NOA y, encima, en SVG con la
 * misma proyección: focos FIRMS en vivo, trazas y posición SGP4 de satélites reales y un pin por cliente.
 * El SVG usa "slice": llena cualquier pantalla sin deformar. El zoom cambia el viewBox (sin pixelar el SVG).
 */
export function GlobeView({ rows, fires, sats, defs, now, selected, view, setView, onSelect, satHover = null, passes = {}, onSat, onUserMove, follow = null }: {
  rows: Row[]; fires: Fire[]; sats: SatNow[]; defs: SatDef[]; now: Date; selected: string | null; view: View;
  setView: (f: (v: View) => View) => void; onSelect: (id: string) => void; satHover?: string | null; passes?: Record<string, Date | null>; onSat?: (name: string) => void; onUserMove?: () => void; follow?: string | null;
}) {
  const [aspect, setAspect] = useState(1.6);
  useEffect(() => {
    const r = () => setAspect(window.innerWidth / Math.max(1, window.innerHeight));
    r(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r);
  }, []);
  const svg = useRef<SVGSVGElement>(null);
  const viewRef = useRef(view); viewRef.current = view;
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; v: View; dist: number; moved: boolean } | null>(null);

  // px de pantalla por unidad del marco (preserveAspectRatio slice)
  const scaleOf = (v: View) => { const r = svg.current!.getBoundingClientRect(); return { r, sc: Math.max(r.width / (FRAME.w / v.k), r.height / (FRAME.h / v.k)) }; };
  const zoomAt = (factor: number, cx: number, cy: number, base = viewRef.current) => {
    const { r, sc } = scaleOf(base);
    const ux = base.x + (cx - r.left - r.width / 2) / sc, uy = base.y + (cy - r.top - r.height / 2) / sc;
    const k = base.k * factor;
    const sc2 = sc * (clampView({ ...base, k }).k / base.k);
    return clampView({ k, x: ux - (cx - r.left - r.width / 2) / sc2, y: uy - (cy - r.top - r.height / 2) / sc2 });
  };
  // rueda: zoom hacia el cursor (listener no pasivo para poder frenar el scroll de la página)
  useEffect(() => {
    const el = svg.current; if (!el) return;
    const wheel = (e: WheelEvent) => { e.preventDefault(); onUserMove?.(); const f = Math.exp(-e.deltaY * 0.0015); setView((v) => zoomAt(f, e.clientX, e.clientY, v)); };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setView]);
  const down = (e: RPointerEvent<SVGSVGElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...ptrs.current.values()];
    const c = ps.reduce((a, p) => ({ x: a.x + p.x / ps.length, y: a.y + p.y / ps.length }), { x: 0, y: 0 });
    drag.current = { x: c.x, y: c.y, v: viewRef.current, dist: ps.length > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0, moved: false };
  };
  const move = (e: RPointerEvent<SVGSVGElement>) => {
    if (!drag.current || !ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = [...ptrs.current.values()];
    const c = ps.reduce((a, p) => ({ x: a.x + p.x / ps.length, y: a.y + p.y / ps.length }), { x: 0, y: 0 });
    const d = drag.current;
    if (!d.moved && Math.hypot(c.x - d.x, c.y - d.y) < 4 && ps.length < 2) return;
    if (!d.moved) { d.moved = true; svg.current?.setPointerCapture(e.pointerId); onUserMove?.(); }
    let v = d.v;
    if (ps.length > 1 && d.dist) v = zoomAt(Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) / d.dist, d.x, d.y, d.v);
    const { sc } = scaleOf(v);
    setView(() => clampView({ ...v, x: v.x - (c.x - d.x) / sc, y: v.y - (c.y - d.y) / sc }));
  };
  const up = (e: RPointerEvent<SVGSVGElement>) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size === 0) setTimeout(() => { drag.current = null; }, 0);
    else down({ ...e, pointerId: -1 } as RPointerEvent<SVGSVGElement>);
  };
  const pick = (id: string) => { if (!drag.current?.moved) onSelect(id); };
  const pickSat = (name: string) => { if (!drag.current?.moved) onSat?.(name); };
  const satBtn = (name: string, label: string) => ({
    role: "button" as const, tabIndex: 0, "aria-label": `${name}: ${label}. Ver ficha del satélite`, className: "cursor-pointer outline-none",
    onClick: () => pickSat(name),
    onKeyDown: (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSat?.(name)),
  });
  const vw = FRAME.w / view.k, vh = FRAME.h / view.k;
  // con "slice" se ve menos en un eje: el rectángulo visible real, para los indicadores de borde
  const visW = aspect >= FRAME.w / FRAME.h ? vw : vh * aspect, visH = aspect >= FRAME.w / FRAME.h ? vw / aspect : vh;
  const vb = `${view.x - vw / 2} ${view.y - vh / 2} ${vw} ${vh}`;
  const s = 1 / view.k; // tamaño constante en pantalla para marcas y textos

  // órbita ±45 min a la altura real: lo recorrido (línea) y lo que viene (punteado), cortada donde no se ve
  const tracks = defs.filter((d) => !/GOES/.test(d.name)).flatMap((d) => {
    const out: { name: string; future: boolean; pts: string }[] = [];
    for (const future of [false, true]) {
      let cur: string[] = [];
      for (let m = future ? 0 : -45; m <= (future ? 45 : 0); m += 1) {
        const g = satAt(d, new Date(now.getTime() + m * 60_000));
        const p = g && proj(g.lat, g.lon, 1 + g.altKm / 6371);
        if (p && p.visible) cur.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
        else { if (cur.length > 1) out.push({ name: d.name, future, pts: cur.join(" ") }); cur = []; }
      }
      if (cur.length > 1) out.push({ name: d.name, future, pts: cur.join(" ") });
    }
    return out;
  });
  const key = (id: string) => (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(id));

  return (
    <svg ref={svg} viewBox={vb} preserveAspectRatio="xMidYMid slice" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      className={`absolute inset-0 h-full w-full touch-none select-none ${drag.current?.moved ? "cursor-grabbing" : "cursor-grab"}`}
      role="img" aria-label={`Globo con ${rows.length} campos asegurados, ${fires.length} focos de fuego y ${sats.length} satélites en vivo`}>
      <rect x={-4000} y={-4000} width={12000} height={10000} fill="#04070d" />
      {/* render amplio (1x) para alejar, y encima el detallado (2x) del cuadro principal: misma proyección */}
      <image href="/renders/globe-noa-wide.jpg" x={BOUNDS.x0} y={BOUNDS.y0} width={BOUNDS.x1 - BOUNDS.x0} height={BOUNDS.y1 - BOUNDS.y0} preserveAspectRatio="none" />
      <image href="/renders/globe-noa.jpg" x={0} y={0} width={FRAME.w} height={FRAME.h} preserveAspectRatio="none" />

      {/* Anomalía del Atlántico Sur: zona de radiación donde los cálculos en órbita pueden fallar */}
      <g aria-hidden="true">
        <polygon points={SAA_PTS.filter((p) => p.visible).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
          fill="#ff5a4e" fillOpacity={0.06} stroke="#ff5a4e" strokeOpacity={0.85} strokeWidth={1.5 * s} strokeDasharray={`${8 * s} ${5 * s}`} />
        <Tag x={SAA_LABEL.x} y={SAA_LABEL.y} k={view.k} dx={-110} dy={6}>
          <span className="block text-[12px] font-semibold text-[#ff9b92]">▲ Anomalía del Atlántico Sur</span>
          <span className="block text-[10.5px] text-[#d5deea]">zona de radiación: un cálculo hecho acá puede fallar</span>
        </Tag>
      </g>

      {/* trazas de satélites polares (±45 min) */}
      {tracks.map((t, i) => {
        const on = satHover === t.name || follow === t.name;
        const red = sats.find((x) => x.name === t.name)?.inSaa;
        return <polyline key={i} points={t.pts} fill="none" stroke={red ? "#ff5a4e" : "#3dd6f5"} strokeOpacity={on ? 1 : t.future ? 0.75 : 0.4}
          strokeWidth={(on ? 2.5 : t.future ? 1.5 : 2) * s} strokeDasharray={t.future ? `${6 * s} ${5 * s}` : undefined} />;
      })}

      {/* focos FIRMS en vivo */}
      <g aria-hidden="true">
        {fires.map((f, i) => {
          const p = proj(f.lat, f.lon);
          return p.visible && <circle key={i} cx={p.x} cy={p.y} r={1.8 * s} fill="#ffb347" fillOpacity={0.95} />;
        })}
        {fires.map((f, i) => {
          const p = proj(f.lat, f.lon);
          return p.visible && <circle key={`g${i}`} cx={p.x} cy={p.y} r={4.5 * s} fill="#ff7a1a" fillOpacity={0.08} />;
        })}
      </g>

      {/* ciudades */}
      {CITIES.map(([n, la, lo]) => {
        const p = proj(la, lo);
        return (
          <g key={n} aria-hidden="true">
            <circle cx={p.x} cy={p.y} r={2.5 * s} fill="#fff" fillOpacity={0.9} />
            <text x={p.x - 7 * s} y={p.y + 4 * s} textAnchor="end" fontSize={11.5 * s} fontWeight={500} fill="#fff" fillOpacity={0.9} style={{ paintOrder: "stroke", stroke: "#000a", strokeWidth: 3 * s }}>{n}</text>
          </g>
        );
      })}

      {/* lotes asegurados (se ven al acercar) */}
      {view.k >= 2 && rows.map(({ c, a }) => {
        const [w, so, e, n] = c.bbox;
        const pts = [[so, w], [so, e], [n, e], [n, w]].map(([la, lo]) => proj(la, lo));
        return <polygon key={`l${c.id}`} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill={PIN[a.level].bg} fillOpacity={0.15} stroke={PIN[a.level].bg} strokeWidth={1.5 * s} strokeDasharray={`${4 * s} ${2 * s}`} />;
      })}

      {/* satélites reales anclados a su posición: se mueven solos (SGP4 cada segundo), con flecha de rumbo.
          Si están del otro lado del planeta no se dibujan: el panel de fuentes dice cuándo vuelven. */}
      {sats.map((x) => {
        if (!satOnMap(x)) return null;
        const p = satPoint(x);
        const color = x.inSaa ? "#ff5a4e" : "#3dd6f5";
        const hl = satHover === x.name || follow === x.name;
        const def = defs.find((d) => d.name === x.name);
        // rumbo: dónde estará en 1 minuto
        const ahead = def && x.kind === "polar" ? satAt(def, new Date(now.getTime() + 60_000)) : null;
        const q = ahead ? satPoint({ ...ahead, kind: "polar" }) : null;
        const ang = q ? (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI : null;
        const pass = passes[x.name];
        const sub = x.inSaa ? "en la Anomalía" : x.kind === "geo" ? "geoestacionario · fijo" : x.overNoa ? "sobre el NOA ahora" : pass ? `vuelve al NOA ${pass.toLocaleTimeString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour: "2-digit", minute: "2-digit", hour12: false })}` : "";
        return (
          <g key={x.name} {...satBtn(x.name, sub || "satélite")}>
            {hl && <circle cx={p.x} cy={p.y} r={34 * s} fill="none" stroke={color} strokeWidth={1.5 * s} strokeDasharray={`${4 * s} ${3 * s}`} />}
            <circle cx={p.x} cy={p.y} r={(hl ? 27 : 23) * s} fill={color} fillOpacity={0.14} stroke={color} strokeOpacity={0.75} strokeWidth={1.2 * s} />
            {ang !== null && <path d={`M ${p.x + 33 * s} ${p.y} l ${-8 * s} ${-5.5 * s} l 0 ${11 * s} z`} fill={color} transform={`rotate(${ang} ${p.x} ${p.y})`} />}
            <image href="/renders/satA.png" x={p.x - 26 * s} y={p.y - 16 * s} width={52 * s} height={32.5 * s} preserveAspectRatio="xMidYMid meet" />
            <Tag x={p.x} y={p.y} k={view.k} dx={30} dy={-14}>
              <span className="block font-mono text-[11px] font-medium text-[#e6edf7]">{x.name}{follow === x.name ? " · siguiendo" : ""}</span>
              {sub && <span className="block text-[10px]" style={{ color: x.inSaa ? "#ff9b92" : "#c9d4e4" }}>{sub}</span>}
            </Tag>
          </g>
        );
      })}

      {/* pines de clientes */}
      {rows.map(({ c, a }) => {
        const p = proj((c.bbox[1] + c.bbox[3]) / 2, (c.bbox[0] + c.bbox[2]) / 2);
        const pin = PIN[a.level];
        const sel = selected === c.id;
        return (
          <g key={c.id} role="button" tabIndex={0} aria-label={`${c.field}: ${pin.label}. Abrir póliza`} onClick={() => pick(c.id)} onKeyDown={key(c.id)}
            className="cursor-pointer outline-none [&:focus-visible>circle.ring]:stroke-[#3dd6f5]">
            {a.level === "atencion" && <circle cx={p.x} cy={p.y} r={18 * s} fill={pin.bg} fillOpacity={0.25} stroke={pin.bg} strokeWidth={1 * s} className="pin-pulse" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
            <circle className="ring" cx={p.x} cy={p.y} r={(sel ? 13 : 10.5) * s} fill={pin.bg} stroke={sel ? "#3dd6f5" : "#fff"} strokeWidth={2 * s} />
            {(() => { const I = a.level === "ok" ? Check : LEVEL_ICON[a.level]; return <I x={p.x - 6 * s} y={p.y - 6 * s} width={12 * s} height={12 * s} color={pin.fg} strokeWidth={a.level === "ok" ? 3 : 2.6} />; })()}
            {(a.level === "atencion" || sel) && (
              <Tag x={p.x} y={p.y} k={view.k} dx={16} dy={rows.findIndex((r) => r.c.id === c.id) % 2 ? 10 : -48}>
                <span className="block text-[12px] font-semibold text-[#e6edf7]">{c.field}</span>
                <span className="block font-mono text-[10.5px]" style={{ color: a.level === "atencion" ? "#ff8a80" : "#c9d4e4" }}>
                  {a.level === "atencion" ? `! ${a.inField.length} focos en el lote` : pin.label}
                </span>
              </Tag>
            )}
          </g>
        );
      })}
    </svg>
  );
}
