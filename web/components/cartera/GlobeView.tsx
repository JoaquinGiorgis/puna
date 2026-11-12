"use client";

import { type KeyboardEvent } from "react";
import { FRAME, proj } from "@/lib/globe-noa";
import type { Assessment, Client, Level } from "@/lib/portfolio";
import { groundTrack, type Fire, type SatDef, type SatNow } from "@/lib/sky";

export type Row = { c: Client; a: Assessment };
export type View = { k: number; x: number; y: number }; // zoom y centro, en píxeles del marco

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
export function GlobeView({ rows, fires, sats, defs, now, selected, view, onSelect }: {
  rows: Row[]; fires: Fire[]; sats: SatNow[]; defs: SatDef[]; now: Date; selected: string | null; view: View; onSelect: (id: string) => void;
}) {
  const vw = FRAME.w / view.k, vh = FRAME.h / view.k;
  const vb = `${view.x - vw / 2} ${view.y - vh / 2} ${vw} ${vh}`;
  const s = 1 / view.k; // tamaño constante en pantalla para marcas y textos

  const tracks = defs.filter((d) => !/GOES/.test(d.name)).flatMap((d) =>
    groundTrack(d, now, 45, 1).map((seg) => seg.map(([lon, lat]) => proj(lat, lon, 1.02)).filter((p) => p.visible)));
  const key = (id: string) => (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(id));

  return (
    <svg viewBox={vb} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full select-none"
      role="img" aria-label={`Globo con ${rows.length} campos asegurados, ${fires.length} focos de fuego y ${sats.length} satélites en vivo`}>
      <rect x={-2000} y={-2000} width={6000} height={5000} fill="#04070d" />
      <image href="/renders/globe-noa.jpg" x={0} y={0} width={FRAME.w} height={FRAME.h} preserveAspectRatio="none" />

      {/* trazas de satélites polares (±45 min) */}
      {tracks.map((seg, i) => seg.length > 1 && (
        <polyline key={i} points={seg.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="#3dd6f5" strokeOpacity={0.8} strokeWidth={1.5 * s} strokeDasharray={`${6 * s} ${5 * s}`} />
      ))}

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

      {/* satélites reales en su posición de ahora */}
      {sats.map((x) => {
        const p = proj(x.lat, x.lon, x.kind === "geo" ? 1 : 1 + x.altKm / 6371);
        if (!p.visible) return null;
        return (
          <g key={x.name} aria-hidden="true">
            <circle cx={p.x} cy={p.y} r={13 * s} fill="#3dd6f5" fillOpacity={0.2} />
            <circle cx={p.x} cy={p.y} r={5.5 * s} fill="#3dd6f5" stroke="#fff" strokeWidth={2 * s} />
            <Tag x={p.x} y={p.y} k={view.k} dx={12} dy={-11}>
              <span className="block font-mono text-[10.5px] text-[#e6edf7]">{x.name}{x.overNoa ? " · sobre el NOA" : ""}</span>
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
          <g key={c.id} role="button" tabIndex={0} aria-label={`${c.field}: ${pin.label}. Abrir póliza`} onClick={() => onSelect(c.id)} onKeyDown={key(c.id)}
            className="cursor-pointer outline-none [&:focus-visible>circle.ring]:stroke-[#3dd6f5]">
            {a.level === "atencion" && <circle cx={p.x} cy={p.y} r={18 * s} fill={pin.bg} fillOpacity={0.25} stroke={pin.bg} strokeWidth={1 * s} className="pin-pulse" style={{ transformBox: "fill-box", transformOrigin: "center" }} />}
            <circle className="ring" cx={p.x} cy={p.y} r={(sel ? 13 : 10.5) * s} fill={pin.bg} stroke={sel ? "#3dd6f5" : "#fff"} strokeWidth={2 * s} />
            <text x={p.x} y={p.y + 3.4 * s} textAnchor="middle" fontSize={10 * s} fontWeight={700} fill={pin.fg}>{pin.icon}</text>
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
