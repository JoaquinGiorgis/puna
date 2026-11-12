"use client";

import { useDemo } from "./LiveProvider";
import { addrUrl, avax, pct, short } from "@/lib/format";
import { ExtLink, Mono, Panel, StatusTag, type Tone } from "./ui";

const STATE: Record<string, [Tone, string]> = {
  Paid: ["success", "Pagada"],
  NoPayout: ["neutral", "Sin pago (bajo el disparador)"],
  Rejected: ["danger", "Rechazada"],
  Submitted: ["warning", "Sin auditar"],
  Assigned: ["neutral", "Asignada"],
  Created: ["neutral", "Creada"],
  Refunded: ["neutral", "Reintegrada"],
};

export function Policy() {
  const demo = useDemo();
  const { job, lot, chain, contracts } = demo;
  const [tone, label] = STATE[job.state] ?? ["neutral", job.state];
  const idx = job.indexBps / 100;
  const trig = job.triggerBps / 100;
  const burned = lot.burned.flat().filter(Boolean).length;
  const [d0, d1] = lot.fociDates ?? ["", ""];

  return (
    <Panel
      labelledBy="poliza"
      title="Póliza Lote 14 · incendio paramétrico"
      sub={<>PunaEscrow {short(contracts.escrow)} · job {job.id} · intento {job.attempt}</>}
      aside={<StatusTag tone={tone}>{label}</StatusTag>}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,132px)_1fr]">
        <figure>
          <div className="relative aspect-square overflow-hidden rounded-xl border border-white/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/renders/lot.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <svg viewBox="0 0 12 12" className="absolute inset-0 h-full w-full" role="img"
              aria-label={`Grilla 12 por 12 del lote: ${burned} de ${lot.cells} celdas quemadas según el modelo, con ${lot.foci.length} focos FIRMS`}>
              {lot.mask.flatMap((row, r) =>
                row.map((inLot, c) => (
                  <rect key={`${r}-${c}`} x={c + 0.04} y={r + 0.04} width={0.92} height={0.92}
                    fill={inLot ? "none" : "rgb(14 27 44 / 0.45)"}
                    stroke={lot.burned[r][c] ? "var(--fire-hot)" : inLot ? "rgb(255 255 255 / 0.35)" : "none"}
                    strokeWidth={lot.burned[r][c] ? 0.08 : 0.03} />
                )),
              )}
              {lot.foci.map((f, i) => (
                <circle key={i} cx={f.x * 12} cy={f.y * 12} r={0.12 + Math.min(f.frp, 40) / 180} fill="#ffb347" stroke="#7a2e00" strokeWidth="0.03" />
              ))}
            </svg>
          </div>
          <figcaption className="mt-1.5 font-mono text-[11px] leading-tight text-muted">
            <span className="text-warn">Vista simulada</span> · <span title={`${lot.source}, ${d0} a ${d1}`}>{lot.foci.length} focos FIRMS reales</span>
          </figcaption>
        </figure>

        <div className="min-w-0">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-1">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">{["Paid", "NoPayout"].includes(job.state) ? "Índice validado" : "Índice declarado"}</p>
              <p className="font-mono text-[32px] leading-none font-semibold text-fire">{pct(job.indexBps)}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Disparador</p>
              <p className="font-mono text-xl">≥ {pct(job.triggerBps)}</p>
            </div>
          </div>
          <div className="relative mt-3 h-2 rounded-full bg-line" role="meter" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={idx} aria-label={`Índice ${pct(job.indexBps)} contra disparador ${pct(job.triggerBps)}`}>
            <div className="h-full rounded-full bg-fire" style={{ width: `${Math.min(idx, 100)}%` }} />
            <div className="absolute -top-1.5 h-5 w-0.5 bg-ink" style={{ left: `${trig}%` }} aria-hidden="true" />
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {burned} de {lot.cells} celdas quemadas · {idx >= trig ? "supera el disparador: paga" : "no supera el disparador"}
          </p>

          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[12.5px]">
            <dt className="text-muted">Indemnización</dt>
            <dd className="text-right font-mono font-semibold text-ok">{avax(job.indemnityWei, 3)}</dd>
            <dt className="text-muted">Beneficiario (productor)</dt>
            <dd className="text-right"><ExtLink href={addrUrl(chain.explorer, job.beneficiary)}><Mono>{short(job.beneficiary)}</Mono></ExtLink></dd>
            <dt className="text-muted">Aseguradora</dt>
            <dd className="text-right"><ExtLink href={addrUrl(chain.explorer, job.insurer)}><Mono>{short(job.insurer)}</Mono></ExtLink></dd>
            <dt className="text-muted">Entrada · modelo</dt>
            <dd className="text-right font-mono text-[11px]">{short(job.inputHash)} · {short(job.modelHash)}</dd>
          </dl>
        </div>
      </div>
    </Panel>
  );
}
