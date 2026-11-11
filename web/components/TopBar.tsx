import { demo } from "@/lib/data";
import { addrUrl, short } from "@/lib/format";

export function TopBar() {
  const { job, chain, contracts } = demo;
  return (
    <header className="glass sticky top-0 z-20 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-none border-x-0 border-t-0 px-6 py-3">
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
        Mission Control <span aria-hidden="true">/</span> Póliza Lote 14 <span aria-hidden="true">/</span>{" "}
        <span className="font-mono text-ink">job {job.id}</span>
      </nav>
      <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-warn-bg px-3 py-1.5 font-mono text-warn">
          <span aria-hidden="true">▲ </span>Simulación · nodos y radiación simulados
        </span>
        <span className="glass-raised rounded-full px-3 py-1.5 font-mono">
          <span aria-hidden="true" className="text-bad">● </span>
          {chain.name} · {chain.id}
        </span>
        <a
          href={addrUrl(chain.explorer, contracts.escrow)}
          target="_blank"
          rel="noreferrer"
          className="glass-raised ext rounded-full px-3 py-1.5"
        >
          PunaEscrow <span className="font-mono">{short(contracts.escrow)}</span>
          <span aria-hidden="true"> ↗</span>
        </a>
      </div>
    </header>
  );
}
