/**
 * Historial y transacciones de una póliza para el modal de la cartera.
 * - Lote 14: sale del job real en Fuji (foto exportada en demo.json: eventos, txs, certificados).
 * - Resto de la cartera: póliza simulada; el historial solo tiene lo real (focos FIRMS) y lo que falta.
 */
import { demo } from "./data";
import type { Assessment, Client } from "./portfolio";

export type StepKind = "fire" | "info" | "warn" | "bad" | "ok" | "pending";
export type Step = { kind: StepKind; title: string; detail: string; when: string; txs: string[] };
export type TxRow = { hash: string; when: string; event: string; contract: string; gas: number; tone?: "bad" | "ok" };

const NOAA: Record<number, string> = { 43013: "NOAA 20", 54234: "NOAA 21" };
const art = (unix: number, withDate = false) =>
  new Date(unix * 1000).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires", hour12: false,
    ...(withDate ? { day: "2-digit", month: "2-digit" } : {}), hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
const pctTxt = (bps: number) => `${(bps / 100).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const avaxTxt = (wei: string | number) => `${(Number(BigInt(String(wei))) / 1e18).toLocaleString("es-AR", { maximumFractionDigits: 4 })} AVAX`;

const nodeName = (agentId: number) => {
  const n = demo.nodes.find((x) => x.agentId === agentId);
  return n ? `${n.name}${NOAA[n.norad] ? ` (${NOAA[n.norad]})` : ""}` : `agente ${agentId}`;
};
const txTime = new Map(demo.txs.map((t) => [t.hash, t]));

/** Historial del Lote 14 a partir de los eventos del job en Fuji. */
function lot14Steps(): Step[] {
  const [d0, d1] = demo.lot.fociDates ?? ["", ""];
  const maxFrp = Math.max(...demo.lot.foci.map((f) => f.frp));
  const steps: Step[] = [{
    kind: "fire", title: "Incendio detectado en el lote",
    detail: `NASA FIRMS · ${demo.lot.foci.length} focos VIIRS de NOAA-20/21 · potencia máx. ${Math.round(maxFrp)} MW`,
    when: d0 && d1 ? `${d0.slice(8)}/${d0.slice(5, 7)} al ${d1.slice(8)}/${d1.slice(5, 7)}` : "", txs: [],
  }];
  let first = true;
  let lastAgent = 0;
  for (const e of demo.events) {
    const t = txTime.get(e.tx);
    const when = t ? art(t.timestamp, first) : "";
    const a = e.args;
    if (e.event === "JobCreated") {
      steps.push({ kind: "info", title: "Póliza activada en PunaEscrow", detail: `${avaxTxt(demo.job.indemnityWei)} de indemnización en garantía · disparador ${pctTxt(demo.job.triggerBps)}`, when, txs: [e.tx] });
      first = false;
    } else if (e.event === "NodeAssigned") {
      lastAgent = Number(a.agentId);
      const reassign = Number(a.attempt) > 1;
      const saa = Number(a.saaBps);
      steps.push({
        kind: "info", title: `${reassign ? "Reasignado a" : "Cómputo asignado a"} ${nodeName(lastAgent)}`,
        detail: saa > 0 ? `El ${pctTxt(saa)} de la ventana cae dentro de la Anomalía del Atlántico Sur` : "Fuera de la Anomalía del Atlántico Sur",
        when, txs: [e.tx],
      });
    } else if (e.event === "ResultSubmitted") {
      steps.push({ kind: "warn", title: `${nodeName(lastAgent).split(" ")[0]} declara índice ${pctTxt(Number(a.indexBps))}`, detail: "Publica el outputHash y la raíz Merkle de las capas", when, txs: [e.tx] });
    } else if (e.event === "ValidationResponse") {
      const score = Number(a.response);
      const att = demo.attempts.find((x) => x.requestHash === String(a.requestHash));
      const bad = att?.certificate?.checks.find((c) => !c.ok);
      const ok = score >= demo.job.minScore;
      steps.push({
        kind: ok ? "ok" : "bad", title: `Auditoría ${ok ? "aprobada" : "rechazada"} · score ${score}`,
        detail: ok ? "Todas las capas pasan Freivalds y el encadenado completo" : `Freivalds mód. 2³¹−1: ${bad ? bad.name.split(" ")[0] : "una capa"} no cierra`,
        when, txs: [e.tx],
      });
    } else if (e.event === "JobRejected") {
      const last = steps[steps.length - 1];
      last.detail += `. Sin pago; baja la reputación de ${nodeName(lastAgent).split(" ")[0]}`;
      if (!last.txs.includes(e.tx)) last.txs.push(e.tx);
    } else if (e.event === "PayoutTriggered") {
      steps.push({ kind: "ok", title: "Indemnización pagada al productor", detail: `${pctTxt(Number(a.indexBps))} ≥ ${pctTxt(demo.job.triggerBps)}: PunaEscrow libera ${avaxTxt(String(a.amount))}`, when, txs: [e.tx] });
    } else if (e.event === "NoPayout") {
      steps.push({ kind: "info", title: "Sin pago", detail: "El índice validado no supera el disparador", when, txs: [e.tx] });
    }
  }
  return steps;
}

const LABEL: Record<string, string> = {
  JobCreated: "JobCreated · póliza", ValidationRequest: "ValidationRequest", JobRejected: "JobRejected", PayoutTriggered: "PayoutTriggered", NewFeedback: "reputación",
};

function lot14Txs(): TxRow[] {
  return [...demo.txs].sort((a, b) => a.block - b.block).map((t) => {
    const evs = demo.events.filter((e) => e.tx === t.hash);
    const parts = evs.map((e) => {
      if (e.event === "NodeAssigned") return `NodeAssigned · ${nodeName(Number(e.args.agentId)).split(" ")[0]}`;
      if (e.event === "ResultSubmitted") return `ResultSubmitted · ${pctTxt(Number(e.args.indexBps))}`;
      if (e.event === "ValidationResponse") return `ValidationResponse · ${e.args.response}`;
      return LABEL[e.event] ?? e.event;
    });
    const tone = evs.some((e) => e.event === "JobRejected") ? "bad" : evs.some((e) => e.event === "PayoutTriggered") ? "ok" : undefined;
    return {
      hash: t.hash, when: art(t.timestamp), event: parts.join(" + "),
      contract: evs.some((e) => e.contract === "escrow") ? "PunaEscrow" : "ERC-8004", gas: t.gasUsed, tone,
    };
  });
}

export function policyHistory(c: Client, a: Assessment, now: Date): Step[] {
  if (c.onchain) return lot14Steps();
  const steps: Step[] = [{ kind: "info", title: "Póliza emitida (simulada)", detail: `Incendio paramétrico · disparador ${c.triggerPct} % del lote quemado`, when: "01/09/2026", txs: [] }];
  const fires = [...a.inField, ...a.near];
  if (fires.length) {
    const first = new Date(Math.min(...fires.map((f) => Date.parse(f.t))));
    const fmt = (d: Date) => d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    steps.push({
      kind: a.inField.length ? "fire" : "warn",
      title: a.inField.length ? `Fuego dentro del lote · ${a.inField.length} focos` : `Fuego cerca · foco a ${a.nearestKm!.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km`,
      detail: `NASA FIRMS · ${[...new Set(fires.map((f) => f.sat))].join(", ")}`, when: fmt(first), txs: [],
    });
    if (a.last) steps.push({ kind: a.inField.length ? "fire" : "warn", title: "Última detección", detail: `${fires.length} focos en 48 h a ≤ 15 km del lote`, when: fmt(a.last), txs: [] });
  } else {
    steps.push({ kind: "ok", title: "Sin focos en las últimas 48 h", detail: a.nearestKm !== null ? `El más cercano está a ${Math.round(a.nearestKm)} km` : "Ningún foco en el NOA", when: "hoy", txs: [] });
  }
  if (a.level === "atencion") {
    steps.push({ kind: "pending", title: "Próximo paso: pedir el índice verificado", detail: "Un nodo calcula el área quemada, otro operador lo audita y PunaEscrow paga si supera el disparador", when: "", txs: [] });
  }
  void now;
  return steps;
}

export function policyTxs(c: Client): TxRow[] {
  return c.onchain ? lot14Txs() : [];
}

export function lot14Kpis() {
  const ts = demo.txs.map((t) => t.timestamp);
  return {
    indexBps: demo.job.indexBps, triggerBps: demo.job.triggerBps, state: demo.job.state,
    indemnity: avaxTxt(demo.job.indemnityWei), paidAt: art(Math.max(...ts), true),
    seconds: Math.max(...ts) - Math.min(...ts), txs: demo.txs.length, gas: demo.txs.reduce((s, t) => s + t.gasUsed, 0),
    attempts: demo.attempts,
  };
}
