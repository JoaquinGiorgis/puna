"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Servicio del nodo en Railway (node/serve.py): corre la demo on-chain en Fuji con la falla que elige el jurado. */
const NODE = (process.env.NEXT_PUBLIC_DEMO_NODE_URL ?? "https://nodo-production-23b65ee1.up.railway.app").replace(/\/$/, "");

type Status = { running: boolean; lines: string[]; jobId: number | null; result: string | null; runsToday: number; cap: number; cooldown: number };

const URL_RE = /(https:\/\/[^\s)]+)/g;

function Line({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  const tone = text.includes("RESULTADO") ? (text.includes("Paid") ? "text-ok font-semibold" : "text-bad font-semibold")
    : text.startsWith("──") ? "text-cyan font-semibold" : text.includes("▲") ? "text-warn" : text.includes("✓") ? "text-ok" : "";
  return (
    <p className={`whitespace-pre-wrap break-all ${tone}`}>
      {parts.map((p, i) => (p.startsWith("https://") ? (
        <a key={i} href={p} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-cyan">
          {p.includes("snowtrace") ? `tx ${p.split("/").pop()?.slice(0, 10)}… ↗` : `${p.replace("https://", "").slice(0, 40)}… ↗`}
        </a>
      ) : <span key={i}>{p}</span>))}
    </p>
  );
}

/**
 * Dispara el siniestro en vivo y muestra el progreso.
 * - "floating" (mission-control): botón flotante + panel; el tablero sigue el job solo (lee Fuji).
 * - "inline" (póliza del Lote 14): el panel va dentro de la póliza, abierto, con link a la auditoría del job.
 */
export function DemoRunner({ variant = "floating", onClose }: { variant?: "floating" | "inline"; onClose?: () => void }) {
  const inline = variant === "inline";
  const [openState, setOpen] = useState(false);
  const open = inline || openState;
  const [capa, setCapa] = useState(3);
  const [bit, setBit] = useState(7);
  const [st, setSt] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`${NODE}/status`, { cache: "no-store" });
      if (!r.ok) throw new Error(`status ${r.status}`);
      setSt(await r.json());
      setErr(null);
    } catch {
      setErr("No responde el servicio del nodo.");
    }
  }, []);

  useEffect(() => {
    if (!open && !st?.running) return;
    poll();
    const t = setInterval(poll, st?.running ? 1500 : 5000);
    return () => clearInterval(t);
  }, [open, st?.running, poll]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [st?.lines.length]);

  const run = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`${NODE}/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ capa, bit }) });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) setErr(body.error ?? `error ${r.status}`);
      await poll();
    } catch {
      setErr("No responde el servicio del nodo.");
    } finally {
      setBusy(false);
    }
  };

  const running = !!st?.running;
  const blocked = running || busy || (st?.cooldown ?? 0) > 0 || (st ? st.runsToday >= st.cap : false);

  return (
    <>
      {!inline && <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="demo-runner"
        className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-full bg-[#ea6a12] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-10px_rgb(0_0_0/0.5)] transition hover:bg-[#c9560a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
        <span aria-hidden="true">{running ? "●" : "▶"}</span> {running ? "Siniestro en curso…" : "Disparar siniestro en vivo"}
      </button>}

      {open && (
        <section id="demo-runner" aria-labelledby="demo-runner-t"
          className={inline
            ? "lg-tile flex flex-col gap-3 rounded-[18px] p-4"
            : "fixed bottom-20 right-4 z-[60] flex max-h-[min(640px,calc(100dvh-120px))] w-[min(460px,calc(100vw-32px))] flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-[var(--bg-canvas)] p-4 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.6)]"}>
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 id="demo-runner-t" className="text-[15px] font-semibold tracking-tight">Siniestro en vivo · Lote 14</h2>
              <p className="mt-0.5 text-[12px] leading-snug text-muted">
                Crea un job en Fuji, asigna ORBIT-07 (en la Anomalía) con la falla que elijas, el validador de otro operador lo audita y se reasigna a ORBIT-03.
              </p>
            </div>
            <button type="button" onClick={() => (inline ? onClose?.() : setOpen(false))} aria-label="Cerrar el siniestro en vivo" className="rounded-full px-2 text-[18px] leading-none text-muted hover:text-ink">×</button>
          </header>

          <div className="flex flex-wrap items-end gap-3 text-[12.5px]">
            <label className="flex flex-col gap-1">
              <span className="text-muted">Capa del peso corrupto</span>
              <select value={capa} onChange={(e) => setCapa(Number(e.target.value))} disabled={running}
                className="glass-raised rounded-lg px-2.5 py-1.5 font-mono">
                {[1, 2, 3, 4].map((c) => <option key={c} value={c}>L{c}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-muted">Bit que se da vuelta</span>
              <select value={bit} onChange={(e) => setBit(Number(e.target.value))} disabled={running}
                className="glass-raised rounded-lg px-2.5 py-1.5 font-mono">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => <option key={b} value={b}>bit {b}</option>)}
              </select>
            </label>
            <button type="button" onClick={run} disabled={blocked}
              className="ml-auto rounded-full bg-[#ea6a12] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#c9560a] disabled:cursor-not-allowed disabled:opacity-60">
              {running ? "Corriendo…" : (st?.cooldown ?? 0) > 0 ? `Esperá ${st?.cooldown} s` : "Disparar"}
            </button>
          </div>

          {err && <p role="alert" className="rounded-lg bg-warn-bg px-3 py-2 text-[12px] text-warn"><span aria-hidden="true">▲ </span>{err}</p>}

          {st && (st.lines.length > 0 || running) && (
            <div ref={logRef} aria-live="polite" aria-label="Progreso de la corrida"
              className={`scroll-thin min-h-[160px] flex-1 overflow-y-auto rounded-xl ${inline ? "max-h-[260px]" : ""} bg-black/70 p-3 font-mono text-[11.5px] leading-[1.5] text-[#d6e2f0]`}>
              {st.lines.map((l, i) => <Line key={i} text={l} />)}
              {running && <p className="animate-pulse text-muted">…</p>}
            </div>
          )}

          <footer className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
            <span>{st?.jobId ? <>job <span className="font-mono text-ink">{st.jobId}</span>{st.result ? ` · ${st.result === "Paid" ? "pagado" : st.result}` : ""}{" · "}
              {inline
                ? <a href={`/mission-control?job=${st.jobId}`} className="font-semibold text-[#7dd3fc] underline-offset-2 hover:underline">ver la auditoría on-chain →</a>
                : "el tablero lo sigue solo"}</> : "Usa AVAX de testnet (Fuji)"}</span>
            <span>{st ? `${st.runsToday}/${st.cap} corridas hoy` : ""}</span>
          </footer>
        </section>
      )}
    </>
  );
}
