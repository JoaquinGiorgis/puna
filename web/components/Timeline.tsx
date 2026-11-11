"use client";

import { useEffect, useState } from "react";
import { createPublicClient, http, parseAbi } from "viem";
import { avalancheFuji } from "viem/chains";
import { demo } from "@/lib/data";
import { addrUrl, hhmmss, int, short, txUrl } from "@/lib/format";
import { buildSteps, summary } from "@/lib/steps";
import { ExtLink, StatusTag, type Tone } from "./ui";

const STEPS = buildSteps(demo);
const SUM = summary(demo);
const STATES = ["None", "Created", "Assigned", "Submitted", "Paid", "NoPayout", "Rejected", "Refunded"];
const ESCROW_ABI = parseAbi(["function nextJobId() view returns (uint256)"]);

const TONE_BORDER: Record<Tone, string> = {
  neutral: "border-t-cyan",
  warning: "border-t-warn",
  danger: "border-t-bad bg-bad-bg",
  success: "border-t-ok bg-ok-bg",
};

type Live = { status: "checking" | "ok" | "offline"; confirmed: number; head?: bigint };

/** Verificación en vivo contra Fuji (viem): cada tx del timeline existe y salió bien. */
function useLiveCheck(): Live {
  const [live, setLive] = useState<Live>({ status: "checking", confirmed: 0 });
  useEffect(() => {
    const client = createPublicClient({ chain: avalancheFuji, transport: http() });
    let cancelled = false;
    (async () => {
      try {
        const receipts = await Promise.all(
          demo.txs.map((t) => client.getTransactionReceipt({ hash: t.hash as `0x${string}` })),
        );
        const head = await client.getBlockNumber();
        await client.readContract({ address: demo.contracts.escrow as `0x${string}`, abi: ESCROW_ABI, functionName: "nextJobId" });
        if (!cancelled) setLive({ status: "ok", confirmed: receipts.filter((r) => r.status === "success").length, head });
      } catch {
        if (!cancelled) setLive({ status: "offline", confirmed: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return live;
}

export function Timeline() {
  const live = useLiveCheck();
  const { chain, contracts, job } = demo;
  return (
    <section aria-labelledby="timeline" className="glass rounded-[28px] p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="timeline" className="text-[17px] font-semibold tracking-tight">
            Liquidación del job {job.id} · {chain.name}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-muted">
            PunaEscrow {short(contracts.escrow)} · ERC-8004 Validation {short(contracts.validation)} · intento {job.attempt} de{" "}
            {demo.attempts.length} · estado {STATES.includes(job.state) ? job.state : "—"}
          </p>
        </div>
        <dl className="flex flex-wrap gap-2 text-xs">
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">Transacciones </dt><dd className="inline font-mono">{SUM.txs}</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">Gas total </dt><dd className="inline font-mono">{int(SUM.gas)} · {SUM.fee}</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5"><dt className="inline text-muted">De la póliza al pago </dt><dd className="inline font-mono">{int(SUM.seconds)} s</dd></div>
          <div className="glass-raised rounded-full px-3 py-1.5" aria-live="polite">
            <dt className="inline text-muted">En vivo </dt>
            <dd className="inline font-mono">
              {live.status === "checking" && <span className="text-muted">verificando…</span>}
              {live.status === "ok" && (
                <span className="text-ok"><span aria-hidden="true">✓ </span>{live.confirmed}/{SUM.txs} confirmadas en Fuji</span>
              )}
              {live.status === "offline" && <span className="text-warn"><span aria-hidden="true">▲ </span>sin red: datos guardados</span>}
            </dd>
          </div>
          <div className="glass-raised rounded-full px-3 py-1.5">
            <ExtLink href={addrUrl(chain.explorer, contracts.escrow)}>Ver contrato</ExtLink>
          </div>
        </dl>
      </header>

      <ol className="relative flex snap-x gap-3 overflow-x-auto pb-2">
        {STEPS.map((s) => (
          <li key={`${s.tx}-${s.n}`}
            className={`glass-raised relative flex w-[188px] shrink-0 snap-start flex-col rounded-2xl border-t-[3px] p-3 ${TONE_BORDER[s.tone]}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">{String(s.n).padStart(2, "0")}</span>
              <StatusTag tone={s.tone}>{s.label}</StatusTag>
            </div>
            <p className="mt-2 font-mono text-[13px] font-semibold break-words">{s.fn}</p>
            <p className="mt-1 flex-1 text-[12px] leading-snug text-muted">{s.desc}</p>
            <p className="mt-2 font-mono text-[11px] text-muted">#{s.block} · {hhmmss(s.timestamp)}</p>
            <ExtLink href={txUrl(chain.explorer, s.tx)} className="mt-0.5 font-mono text-[12px]">{short(s.tx)}</ExtLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
