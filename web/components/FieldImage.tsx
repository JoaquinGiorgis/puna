"use client";

import { useState } from "react";
import type { Fire } from "@/lib/sky";
import { eoxUrl, frame, rel, type BBox } from "@/lib/imagery";

/**
 * Imagen nítida del campo (Sentinel-2 cloudless, EOX) con el contorno del lote y, si hay, los focos FIRMS encima.
 * `tone` colorea el contorno según el estado; el estado igual se dice con texto afuera.
 */
export function FieldImage({ bbox, fires = [], tone = "ok", pad = 0.35, px = 600, className = "", alt }: {
  bbox: BBox; fires?: Fire[]; tone?: "ok" | "warn" | "bad" | "info"; pad?: number; px?: number; className?: string; alt: string;
}) {
  const box = frame(bbox, pad);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const a = rel(box, bbox[3], bbox[0]);
  const b = rel(box, bbox[1], bbox[2]);
  const stroke = { ok: "#34d399", warn: "#f5b03d", bad: "#ff5a4e", info: "#3dd6f5" }[tone];
  const shown = fires.map((f) => ({ f, p: rel(box, f.lat, f.lon) })).filter(({ p }) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
  const dot = shown.length > 40 ? 0.008 : shown.length > 12 ? 0.011 : 0.015;
  return (
    <div className={`relative overflow-hidden bg-[#1d2a1f] ${className}`}>
      {!loaded && !failed && <p className="absolute inset-0 grid place-items-center text-[11px] text-white/70">Cargando imagen satelital…</p>}
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={eoxUrl(box, px)} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <p className="absolute inset-0 grid place-items-center p-3 text-center text-[11px] text-white/80">No cargó la imagen satelital</p>
      )}
      <svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect x={a.x} y={a.y} width={b.x - a.x} height={b.y - a.y} fill="none" stroke="#0008" strokeWidth="0.014" />
        <rect x={a.x} y={a.y} width={b.x - a.x} height={b.y - a.y} fill="none" stroke={stroke} strokeWidth="0.007" strokeDasharray={tone === "ok" ? "" : "0.02 0.012"} />
        {shown.map(({ p }, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={dot} fill="#ff7a1a" fillOpacity="0.75" />
            <circle cx={p.x} cy={p.y} r={dot * 0.4} fill="#ffe066" />
          </g>
        ))}
      </svg>
    </div>
  );
}
