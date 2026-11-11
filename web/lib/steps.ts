import type { Demo } from "./data";
import { avax, pct } from "./format";
import type { Tone } from "@/components/ui";

export type Step = {
  n: number;
  fn: string;
  tone: Tone;
  label: string;
  desc: string;
  tx: string;
  block: number;
  timestamp: number;
};

const POLICY_MAX_SAA = 2000; // umbral de la política del scheduler (orbit/scheduler.py)

/** Pasos del timeline a partir de los eventos reales del escrow y del Validation Registry. */
export function buildSteps(d: Demo): Step[] {
  const ts = new Map(d.txs.map((t) => [t.hash, t.timestamp]));
  const name = (id: unknown) => d.nodes.find((n) => n.agentId === Number(id))?.name ?? `agente ${id}`;
  const steps: Omit<Step, "n">[] = [];
  let lastAttemptNode = "";
  for (const e of d.events) {
    const base = { tx: e.tx, block: e.block, timestamp: ts.get(e.tx) ?? 0 };
    const a = e.args;
    switch (e.event) {
      case "JobCreated":
        steps.push({ ...base, fn: "createJob", tone: "neutral", label: "Creada",
          desc: `Póliza creada · indemnización ${avax(String(a.indemnity), 3)} depositada` });
        break;
      case "NodeAssigned": {
        lastAttemptNode = name(a.agentId);
        const risky = Number(a.saaBps) > POLICY_MAX_SAA;
        const re = Number(a.attempt) > 1;
        steps.push({ ...base, fn: re ? "reassign" : "assignNode", tone: risky ? "warning" : "neutral",
          label: risky ? "Riesgo SAA" : re ? "Reasignado" : "Asignado",
          desc: `${lastAttemptNode} · saa ${Number(a.saaBps).toLocaleString("es-AR")} bps ≤ máx ${d.job.maxSaaBps.toLocaleString("es-AR")} · intento ${a.attempt}` });
        break;
      }
      case "ResultSubmitted":
        steps.push({ ...base, fn: "submitResult", tone: "warning", label: "Sin auditar",
          desc: `${lastAttemptNode} declara índice ${pct(Number(a.indexBps))}` });
        break;
      case "ValidationRequest":
        steps.push({ ...base, fn: "validationRequest", tone: "neutral", label: "Pedido ERC-8004",
          desc: `${lastAttemptNode} pide auditoría al validador nombrado` });
        break;
      case "ValidationResponse": {
        const ok = Number(a.response) >= d.job.minScore;
        steps.push({ ...base, fn: "validationResponse", tone: ok ? "success" : "danger", label: ok ? "Aprobado" : "Falló",
          desc: `score ${a.response}/100 · Freivalds por capa` });
        break;
      }
      case "JobRejected":
        steps.push({ ...base, fn: "settle", tone: "danger", label: "Sin pago",
          desc: `Rechazado · no se mueve la indemnización · reputación de ${lastAttemptNode} baja` });
        break;
      case "PayoutTriggered":
        steps.push({ ...base, fn: "settle → PayoutTriggered", tone: "success", label: "Pagado",
          desc: `${avax(String(a.amount), 3)} al productor · fee al nodo · reputación +` });
        break;
      case "NoPayout":
        steps.push({ ...base, fn: "settle → NoPayout", tone: "neutral", label: "Sin pago",
          desc: `Índice bajo el disparador · la indemnización vuelve a la aseguradora` });
        break;
    }
  }
  return steps.map((s, i) => ({ ...s, n: i + 1 }));
}

export function summary(d: Demo) {
  const fee = d.txs.reduce((acc, t) => acc + BigInt(t.feeWei), BigInt(0));
  const gas = d.txs.reduce((acc, t) => acc + t.gasUsed, 0);
  const times = d.txs.map((t) => t.timestamp);
  // En Fuji el gas cuesta ~cientos de wei: en AVAX redondea a 0. Se muestra en nAVAX (1e-9 AVAX).
  const nano = Number(fee) / 1e9;
  const feeLabel = nano < 1000
    ? `${nano.toLocaleString("es-AR", { maximumFractionDigits: 3 })} nAVAX`
    : avax(fee.toString(), 6);
  return { txs: d.txs.length, gas, fee: feeLabel, seconds: Math.max(...times) - Math.min(...times) };
}
