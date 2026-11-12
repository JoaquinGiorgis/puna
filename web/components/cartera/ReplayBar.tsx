"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from "lucide-react";
import { demo } from "@/lib/data";
import { short, txUrl } from "@/lib/format";
import type { Step } from "@/lib/policy";

const DOT: Record<string, string> = { fire: "#ff7a1a", info: "#3dd6f5", warn: "#f5b03d", bad: "#ff5a4e", ok: "#34d399", pending: "#c9d4e4" };
export const STEP_MS = 4800;

/** Controles de la reproducción del siniestro: paso actual en palabras simples, avance automático y comprobante. */
export function ReplayBar({ steps, step, playing, setStep, setPlaying, onClose }: {
  steps: Step[]; step: number; playing: boolean; setStep: (n: number) => void; setPlaying: (p: boolean) => void; onClose: () => void;
}) {
  const s = steps[step];
  const last = step >= steps.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (last) { setPlaying(false); return; }
    const t = setTimeout(() => setStep(step + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, last, setStep, setPlaying]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") { setPlaying(false); setStep(Math.min(steps.length - 1, step + 1)); }
      if (e.key === "ArrowLeft") { setPlaying(false); setStep(Math.max(0, step - 1)); }
      if (e.key === " " && (e.target as HTMLElement).tagName !== "BUTTON") { e.preventDefault(); setPlaying(!playing); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [step, playing, steps.length, setStep, setPlaying, onClose]);

  return (
    <section aria-label="Reproducción del siniestro del Lote 14" aria-live="polite"
      className="lg pointer-events-auto w-full max-w-[620px] rounded-[20px] px-4 py-3">
      <div className="flex items-center gap-2 text-[11.5px] text-muted">
        <span className="font-semibold text-[#7dd3fc]">Reproduciendo el siniestro del Lote 14</span>
        <span className="font-mono">paso {step + 1} de {steps.length}</span>
        <span className="ml-auto font-mono">{s.when}</span>
        <button onClick={onClose} aria-label="Cerrar la reproducción" className="grid h-7 w-7 place-items-center rounded-full border border-white/20 hover:bg-white/10"><X size={14} /></button>
      </div>
      <div className="mt-1.5 flex items-start gap-2.5">
        <span aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: DOT[s.kind] }} />
        <div className="min-w-0 flex-1">
          <p className={`text-[15px] font-semibold leading-snug ${s.kind === "bad" ? "text-[#ff8a80]" : s.kind === "ok" ? "text-[#6ee7b7]" : ""}`}>{s.title}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[#d5deea]">{s.detail}</p>
        </div>
        {s.txs[0] && (
          <a href={txUrl(demo.chain.explorer, s.txs[s.txs.length - 1])} target="_blank" rel="noreferrer"
            className="shrink-0 rounded-md bg-[#3dd6f5]/15 px-1.5 py-0.5 font-mono text-[11px] text-[#7dd3fc] hover:bg-[#3dd6f5]/25">
            {short(s.txs[s.txs.length - 1])} ↗<span className="sr-only"> (comprobante en Snowtrace)</span>
          </a>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }} disabled={step === 0} aria-label="Paso anterior"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <button onClick={() => (last ? (setStep(0), setPlaying(true)) : setPlaying(!playing))} aria-label={last ? "Repetir" : playing ? "Pausar" : "Reproducir"}
          className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#0e1b2c] hover:bg-white/90">
          {last ? <RotateCcw size={15} /> : playing ? <Pause size={15} /> : <Play size={15} />}
        </button>
        <button onClick={() => { setPlaying(false); setStep(Math.min(steps.length - 1, step + 1)); }} disabled={last} aria-label="Paso siguiente"
          className="grid h-8 w-8 place-items-center rounded-full border border-white/20 hover:bg-white/10 disabled:opacity-40"><ChevronRight size={16} /></button>
        <ol className="ml-1 flex flex-1 gap-1" aria-label="Pasos">
          {steps.map((x, i) => (
            <li key={i} className="flex-1">
              <button onClick={() => { setPlaying(false); setStep(i); }} aria-label={`Ir al paso ${i + 1}: ${x.title}`} aria-current={i === step ? "step" : undefined}
                className="block h-1.5 w-full rounded-full" style={{ background: i <= step ? DOT[x.kind] : "rgb(255 255 255 / 0.18)", opacity: i === step ? 1 : i < step ? 0.7 : 1 }} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
