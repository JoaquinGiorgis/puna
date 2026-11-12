"use client";

import { useDemo, useLive } from "./LiveProvider";
import { addrUrl, short } from "@/lib/format";

export function TopBar() {
  const demo = useDemo();
  const live = useLive();
  const { job, chain, contracts } = demo;
  return (
    <header className="glass z-20 flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-none border-x-0 border-t-0 px-5 py-2">
      <div className="flex items-center gap-3">
        <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true" className="text-cyan">
          <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="text-[15px] font-semibold tracking-[0.2em]">PUNA</p>
          <p className="text-[11px] text-muted">Orbital Compute Integrity</p>
        </div>
      </div>
      <nav aria-label="Ruta" className="text-sm text-muted">
        <a href="/cartera" className="hover:underline">Cartera</a> <span aria-hidden="true">/</span> Mission Control <span aria-hidden="true">/</span> Póliza Lote 14 <span aria-hidden="true">/</span>{" "}
        <span className="font-mono text-ink">job {job.id}</span>
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-warn-bg px-3 py-1 font-mono text-warn" title="Real: órbitas (TLE + SGP4), focos NASA FIRMS, Freivalds, transacciones y ERC-8004 en Fuji. Simulado: satélites como nodos de cómputo, operadores, radiación (saaBps), vista del lote.">
          <span aria-hidden="true">▲ </span>Simulado: nodos y radiación · Real: órbitas, FIRMS, txs
        </span>
        <span className="glass-raised rounded-full px-3 py-1 font-mono" aria-live="polite"
          title={live.kind === "offline" ? live.reason : "Lee PunaEscrow y ERC-8004 en Fuji cada 4–15 s"}>
          {live.kind === "live" && (
            <span className="text-ok"><span aria-hidden="true">● </span>En vivo · {chain.name} · {live.pinned ? "job fijado" : "último job"} · {live.at.toLocaleTimeString("es-AR", { hour12: false })}</span>
          )}
          {live.kind === "snapshot" && <span className="text-muted"><span aria-hidden="true">○ </span>Conectando a {chain.name}…</span>}
          {live.kind === "offline" && <span className="text-warn"><span aria-hidden="true">▲ </span>Sin red · foto guardada del job {demo.job.id}</span>}
        </span>
        <a
          href={addrUrl(chain.explorer, contracts.escrow)}
          target="_blank"
          rel="noreferrer"
          className="glass-raised ext rounded-full px-3 py-1"
        >
          PunaEscrow <span className="font-mono">{short(contracts.escrow)}</span>
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </header>
  );
}
