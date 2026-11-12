"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Flame, X } from "lucide-react";
import { ago } from "@/lib/sky";
import type { Row } from "./GlobeView";

type Alert = { id: string; field: string; count: number; last: Date };
type Toast = { key: number; id: string; field: string; n: number };
const WINDOW_H = 24;
const fkey = (f: { lat: number; lon: number; t: string }) => `${f.lat.toFixed(4)},${f.lon.toFixed(4)},${f.t}`;

/**
 * Alertas de fuego dentro de los campos: campana con los focos de las últimas 24 h (NASA FIRMS) y,
 * mientras la app está abierta, un aviso cuando FIRMS reporta un foco nuevo dentro de un lote.
 */
export function Alerts({ rows, ready, now, onOpen }: { rows: Row[]; ready: boolean; now: Date; onOpen: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const alerts: Alert[] = rows
    .map(({ c, a }) => {
      const recent = a.inField.filter((f) => now.getTime() - Date.parse(f.t) < WINDOW_H * 3600_000);
      if (!recent.length) return null;
      return { id: c.id, field: c.field, count: recent.length, last: new Date(Math.max(...recent.map((f) => Date.parse(f.t)))) };
    })
    .filter((x): x is Alert => x !== null)
    .sort((x, y) => y.last.getTime() - x.last.getTime());

  // focos nuevos dentro de un lote desde que se abrió la app (FIRMS se consulta cada 5 min)
  useEffect(() => {
    if (!ready) return;
    const cur = new Map<string, { id: string; field: string }>();
    for (const { c, a } of rows) for (const f of a.inField) cur.set(fkey(f), { id: c.id, field: c.field });
    if (!seen.current) { seen.current = new Set(cur.keys()); return; }
    const fresh = new Map<string, Toast>();
    for (const [k, v] of cur) if (!seen.current.has(k)) {
      seen.current.add(k);
      const t = fresh.get(v.id) ?? { key: Date.now() + Math.random(), id: v.id, field: v.field, n: 0 };
      t.n++; fresh.set(v.id, t);
    }
    if (fresh.size) setToasts((p) => [...p, ...fresh.values()]);
  }, [rows, ready]);
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts((p) => p.slice(1)), 9000);
    return () => clearTimeout(t);
  }, [toasts]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <>
      <div ref={box} className="relative">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true"
          aria-label={`Alertas: ${alerts.length} ${alerts.length === 1 ? "campo" : "campos"} con fuego en las últimas ${WINDOW_H} h`}
          className="relative grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-white/[0.07] hover:bg-white/15">
          <Bell size={15} aria-hidden="true" />
          {alerts.length > 0 && (
            <span aria-hidden="true" className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c4352b] px-1 text-[10px] font-bold text-white">{alerts.length}</span>
          )}
        </button>
        {open && (
          <div role="dialog" aria-label="Alertas de fuego" className="lg lg-strong absolute right-0 top-10 z-30 w-[320px] rounded-2xl p-3">
            <p className="text-[13px] font-semibold">Alertas de fuego</p>
            <p className="text-[11px] text-muted">Focos de NASA FIRMS dentro de un campo asegurado · últimas {WINDOW_H} h</p>
            <ul className="mt-2 grid gap-1.5">
              {alerts.map((al) => (
                <li key={al.id}>
                  <button onClick={() => { setOpen(false); onOpen(al.id); }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-[#ff5a4e]/40 bg-[#ff5a4e]/10 px-2.5 py-2 text-left hover:bg-[#ff5a4e]/20">
                    <Flame size={15} className="shrink-0 text-[#ff8a80]" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold">{al.field}</span>
                      <span className="block text-[11px] text-[#d5deea]">{al.count} {al.count === 1 ? "foco" : "focos"} dentro del lote · último {ago(al.last, now)}</span>
                    </span>
                    <span className="text-[11px] text-[#7dd3fc]">Ver →</span>
                  </button>
                </li>
              ))}
              {alerts.length === 0 && <li className="rounded-xl border border-white/10 p-3 text-center text-[12px] text-muted">{ready ? `Sin fuego dentro de los campos en las últimas ${WINDOW_H} h.` : "Consultando FIRMS…"}</li>}
            </ul>
            <p className="mt-2 text-[10.5px] text-muted">Avisa también cuando entra un foco nuevo mientras la app está abierta.</p>
          </div>
        )}
      </div>

      {/* avisos de focos nuevos */}
      <div className="pointer-events-none fixed right-4 top-20 z-40 flex w-[320px] flex-col gap-2 md:right-[440px]" aria-live="assertive">
        {toasts.map((t) => (
          <div key={t.key} role="alert" className="lg lg-strong pointer-events-auto flex items-start gap-2.5 rounded-2xl border-[#ff5a4e]/60 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c4352b]"><Flame size={16} color="#fff" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">Nuevo foco en {t.field}</p>
              <p className="text-[11.5px] text-[#d5deea]">NASA FIRMS reportó {t.n} {t.n === 1 ? "punto de calor nuevo" : "puntos de calor nuevos"} dentro del lote.</p>
              <button onClick={() => { onOpen(t.id); setToasts((p) => p.filter((x) => x.key !== t.key)); }} className="mt-1 text-[12px] font-medium text-[#7dd3fc] hover:underline">Abrir la póliza →</button>
            </div>
            <button onClick={() => setToasts((p) => p.filter((x) => x.key !== t.key))} aria-label="Cerrar aviso" className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/10"><X size={13} /></button>
          </div>
        ))}
      </div>
    </>
  );
}
