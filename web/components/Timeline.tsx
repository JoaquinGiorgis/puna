"use client";

import { addrUrl, hhmmss, int, short, txUrl } from "@/lib/format";
import { buildSteps, summary } from "@/lib/steps";
import { useDemo, useLive } from "./LiveProvider";
import { ExtLink, StatusTag, type Tone } from "./ui";

const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-t-cyan",
  warning: "border-t-warn",
  danger: "border-t-bad bg-bad-bg",
  success: "border-t-ok bg-ok-bg",
};

const STATE_LABEL: Record<string, string> = {
  Created: "creado", Assigned: "asignado", Submitted: "esperando auditoría", Paid: "pagado",
  NoPayout: "sin pago", Rejected: "rechazado, esperando reasignación", Refunded: "reintegrado",
};

export function Timeline() {
  const demo = useDemo();
  const live = useLive();
  const steps = buildSteps(demo);
  const sum = summary(demo);
  const { chain, contracts, job } = demo;
  return (
    <section aria-labelledby="timeline" className="glass rounded-[22px] px-4 py-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="timeline" className="text-[15px] font-semibold tracking-tight">
            Liquidación del job {job.id} · {chain.name}
          </h2>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            PunaEscrow {short(contracts.escrow)} · ERC-8004 {short(contracts.validation)} · intento {job.attempt} ·{" "}
            {STATE_LABEL[job.state] ?? job.state}
          </p>
        </div>
        <dl className="flex flex-wrap gap-1.5 text-[11px]">
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">Txs </dt><dd className="inline font-mono">{sum.txs}</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">Gas </dt><dd className="inline font-mono">{int(sum.gas)} · {sum.fee}</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">Póliza → último paso </dt><dd className="inline font-mono">{int(sum.seconds)} s</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5"><ExtLink href={addrUrl(chain.explorer, contracts.escrow)}>Contrato</ExtLink></div>
        </dl>
      </header>

      {steps.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          {live.kind === "snapshot" ? "Leyendo el escrow en Fuji…" : "Sin eventos para este job todavía."}
        </p>
      ) : (
        <ol className="relative flex snap-x gap-2 overflow-x-auto pb-1">
          {steps.map((s) => (
            <li key={`${s.tx}-${s.n}`}
              className={`glass-raised relative flex min-w-[140px] max-w-[260px] flex-1 snap-start flex-col rounded-xl border-t-[3px] p-2 ${TONE_BORDER[s.tone]}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted">{String(s.n).padStart(2, "0")}</span>
                <StatusTag tone={s.tone}>{s.label}</StatusTag>
              </div>
              <p className="mt-1.5 font-mono text-[11.5px] leading-tight font-semibold break-words">{s.fn}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted" title={s.desc}>{s.desc}</p>
              <p className="mt-auto pt-1 font-mono text-[11px] text-muted">{hhmmss(s.timestamp)}</p>
              <ExtLink href={txUrl(chain.explorer, s.tx)} className="font-mono text-[11px]">{short(s.tx, 6, 3)}</ExtLink>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
