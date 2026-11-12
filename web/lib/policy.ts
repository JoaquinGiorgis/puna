/**
 * Historial, etapas y transacciones de una póliza, en palabras simples, para el modal de la cartera.
 * Cada paso tiene un título y una explicación para cualquier persona, y aparte el dato técnico.
 * - Lote 14: sale del job real en Fuji (foto exportada en demo.json: eventos, txs, certificados).
 * - Resto de la cartera: póliza simulada; el historial solo tiene lo real (focos FIRMS) y lo que falta.
 */
import { demo } from "./data";
import type { Assessment, Client } from "./portfolio";

export type StepKind = "fire" | "info" | "warn" | "bad" | "ok" | "pending";
export type Step = { kind: StepKind; title: string; detail: string; tech?: string; when: string; txs: string[] };
export type TxRow = { hash: string; when: string; what: string; tech: string; where: string; tone?: "bad" | "ok" };

/** Las 4 etapas de un siniestro, iguales para toda póliza. */
export type StageState = "done" | "current" | "todo" | "retry";
export type Stage = { label: string; hint: string; state: StageState };

const NOAA: Record<number, string> = { 43013: "NOAA 20", 54234: "NOAA 21" };
const tz = "America/Argentina/Buenos_Aires";
const hms = (unix: number) => new Date(unix * 1000).toLocaleTimeString("es-AR", { timeZone: tz, hour12: false });
const dayHm = (d: Date) => d.toLocaleString("es-AR", { timeZone: tz, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const pctTxt = (bps: number) => `${(bps / 100).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const avaxTxt = (wei: string | number | bigint, digits = 4) => `${(Number(BigInt(String(wei))) / 1e18).toLocaleString("es-AR", { maximumFractionDigits: digits })} AVAX`;

const node = (agentId: number) => demo.nodes.find((x) => x.agentId === agentId);
const nodeName = (agentId: number) => node(agentId)?.name ?? `agente ${agentId}`;
const nodeSat = (agentId: number) => { const n = node(agentId); return n && NOAA[n.norad] ? ` (satélite ${NOAA[n.norad]})` : ""; };
const txTime = new Map(demo.txs.map((t) => [t.hash, t]));

function lot14Steps(): Step[] {
  const [d0, d1] = demo.lot.fociDates ?? ["", ""];
  const maxFrp = Math.max(...demo.lot.foci.map((f) => f.frp));
  const trig = pctTxt(demo.job.triggerBps);
  const steps: Step[] = [{
    kind: "fire", title: "Se detectó fuego en el campo",
    detail: `Satélites de la NASA vieron ${demo.lot.foci.length} puntos de calor dentro del lote.`,
    tech: `NASA FIRMS · VIIRS NOAA-20/21 · potencia máx. ${Math.round(maxFrp)} MW`,
    when: d0 && d1 ? `${d0.slice(8)}/${d0.slice(5, 7)} al ${d1.slice(8)}/${d1.slice(5, 7)}` : "", txs: [],
  }];
  let lastAgent = 0;
  let first = true;
  for (const e of demo.events) {
    const t = txTime.get(e.tx);
    const when = t ? (first ? `${dayHm(new Date(t.timestamp * 1000)).split(",")[0]} ${hms(t.timestamp)}` : hms(t.timestamp)) : "";
    const a = e.args;
    if (e.event === "JobCreated") {
      first = false;
      steps.push({ kind: "info", title: "Se abrió el reclamo y se reservó el pago",
        detail: `La aseguradora dejó ${avaxTxt(demo.job.indemnityWei)} guardados en el contrato. Solo se pagan si se quemó más del ${trig} del lote.`,
        tech: "PunaEscrow · JobCreated", when, txs: [e.tx] });
    } else if (e.event === "NodeAssigned") {
      lastAgent = Number(a.agentId);
      const retry = Number(a.attempt) > 1;
      const saa = Number(a.saaBps) > 0;
      steps.push({ kind: "info",
        title: retry ? `Se repite la medición con ${nodeName(lastAgent)}` : `${nodeName(lastAgent)} mide cuánto se quemó`,
        detail: saa
          ? `La computadora en órbita${nodeSat(lastAgent)} hace la cuenta, pero pasa por la Anomalía del Atlántico Sur: una zona con mucha radiación que puede alterar los cálculos.`
          : `Otra computadora en órbita${nodeSat(lastAgent)}, que pasa lejos de la zona de radiación.`,
        tech: `NodeAssigned · exposición a la Anomalía ${pctTxt(Number(a.saaBps))}`, when, txs: [e.tx] });
    } else if (e.event === "ResultSubmitted") {
      const bps = Number(a.indexBps);
      steps.push({ kind: "warn", title: `Resultado entregado: ${pctTxt(bps)} quemado`,
        detail: bps === 0 ? "No coincide con los puntos de calor que se vieron desde el espacio. Antes de pagar, se revisa." : "Antes de pagar, un auditor revisa la cuenta.",
        tech: "ResultSubmitted · publica el hash del resultado y de cada paso del cálculo", when, txs: [e.tx] });
    } else if (e.event === "ValidationResponse") {
      const score = Number(a.response);
      const att = demo.attempts.find((x) => x.requestHash === String(a.requestHash));
      const bad = att?.certificate?.checks.find((c) => !c.ok);
      const ok = score >= demo.job.minScore;
      steps.push(ok
        ? { kind: "ok", title: "El auditor confirmó la cuenta", detail: `Un auditor de otra empresa revisó cada paso del cálculo y todo coincide (${score}/100).`, tech: `ERC-8004 ValidationResponse · Freivalds en todas las capas`, when, txs: [e.tx] }
        : { kind: "bad", title: "El auditor encontró un error y no se pagó", detail: `Un auditor de otra empresa revisó el cálculo paso a paso y encontró un error${bad ? ` en el paso ${bad.name.split(" ")[0].replace("L", "")}` : ""} (${score}/100).`, tech: `ERC-8004 ValidationResponse · Freivalds mód. 2³¹−1${bad ? ` falla en ${bad.name.split(" ")[0]}` : ""}`, when, txs: [e.tx] });
    } else if (e.event === "JobRejected") {
      const last = steps[steps.length - 1];
      last.detail += ` El contrato no pagó y ${nodeName(lastAgent)} pierde reputación.`;
      last.tech += " · PunaEscrow JobRejected";
      if (!last.txs.includes(e.tx)) last.txs.push(e.tx);
    } else if (e.event === "PayoutTriggered") {
      steps.push({ kind: "ok", title: "Se pagó al productor",
        detail: `${pctTxt(Number(a.indexBps))} quemado supera el ${trig} pactado: el contrato pagó ${avaxTxt(String(a.amount))} solo, sin trámites.`,
        tech: "PunaEscrow · PayoutTriggered", when, txs: [e.tx] });
    } else if (e.event === "NoPayout") {
      steps.push({ kind: "info", title: "No corresponde pago", detail: `El área quemada verificada no llega al ${trig}.`, tech: "PunaEscrow · NoPayout", when, txs: [e.tx] });
    }
  }
  return steps;
}

export function policyHistory(c: Client, a: Assessment): Step[] {
  if (c.onchain) return lot14Steps();
  const steps: Step[] = [{ kind: "info", title: "Póliza emitida", detail: `Cubre incendio: paga si se quema más del ${c.triggerPct} % del lote.`, tech: "Póliza simulada para la demo", when: "01/09/2026", txs: [] }];
  const fires = [...a.inField, ...a.near];
  const sats = [...new Set(fires.map((f) => f.sat))].join(", ");
  if (a.inField.length) {
    const first = new Date(Math.min(...a.inField.map((f) => Date.parse(f.t))));
    steps.push({ kind: "fire", title: "Se detectó fuego en el campo", detail: `Satélites de la NASA vieron ${a.inField.length} puntos de calor dentro del lote.`, tech: `NASA FIRMS · ${sats}`, when: dayHm(first), txs: [] });
    steps.push({ kind: "fire", title: "Sigue habiendo fuego", detail: `${fires.length} puntos de calor en las últimas 48 h, dentro del lote o a menos de 15 km.`, tech: "Última detección de NASA FIRMS", when: dayHm(a.last!), txs: [] });
    steps.push({ kind: "pending", title: "Falta medir cuánto se quemó", detail: "Una computadora en órbita calcula el área quemada, un auditor de otra empresa la revisa y el contrato paga si supera el disparador.", when: "", txs: [] });
  } else if (a.near.length) {
    steps.push({ kind: "warn", title: "Hay fuego cerca del campo", detail: `El punto de calor más cercano está a ${a.nearestKm!.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km. Se sigue en cada pasada de los satélites.`, tech: `NASA FIRMS · ${sats}`, when: dayHm(a.last!), txs: [] });
  } else {
    steps.push({ kind: "ok", title: "Sin fuego cerca", detail: `Los satélites no vieron puntos de calor a menos de 15 km en las últimas 48 h${a.nearestKm !== null ? ` (el más cercano está a ${Math.round(a.nearestKm)} km)` : ""}.`, tech: "NASA FIRMS · 48 h", when: "hoy", txs: [] });
  }
  return steps;
}

/** En qué etapa está el siniestro (o si no hay ninguno). */
export function policyStages(c: Client, a: Assessment): { stages: Stage[]; summary: string } {
  const S = (label: string, hint: string, state: StageState): Stage => ({ label, hint, state });
  if (c.onchain) {
    const k = lot14Kpis();
    return {
      summary: `El primer cálculo vino con un error y no se pagó. Se repitió con otro satélite, el auditor lo confirmó y el productor cobró en ${k.seconds} segundos.`,
      stages: [S("Fuego detectado", "NASA FIRMS", "done"), S("Medición", "2 intentos", "retry"), S("Auditoría", "1 error, 1 aprobada", "done"), S("Pago", k.indemnity, "done")],
    };
  }
  if (a.inField.length) return {
    summary: "Hay fuego dentro del campo. El siguiente paso es medir cuánto se quemó para saber si corresponde pagar.",
    stages: [S("Fuego detectado", `${a.inField.length} puntos de calor`, "done"), S("Medición", "pendiente", "current"), S("Auditoría", "", "todo"), S("Pago", "", "todo")],
  };
  return {
    summary: a.near.length ? "No hay siniestro: el fuego está cerca pero no adentro del campo. Se vigila en cada pasada." : "No hay siniestro abierto. El campo se vigila con cada pasada de los satélites.",
    stages: [S("Fuego detectado", a.near.length ? "cerca, no adentro" : "no", a.near.length ? "current" : "todo"), S("Medición", "", "todo"), S("Auditoría", "", "todo"), S("Pago", "", "todo")],
  };
}

function lot14Txs(): TxRow[] {
  return [...demo.txs].sort((a, b) => a.block - b.block).map((t) => {
    const evs = demo.events.filter((e) => e.tx === t.hash);
    const main = evs.find((e) => e.event !== "NewFeedback") ?? evs[0];
    const a = main.args;
    const sc = Number(a.response);
    const what: Record<string, string> = {
      JobCreated: "Se abrió el reclamo y se reservó el pago",
      NodeAssigned: `Se asignó la medición a ${nodeName(Number(a.agentId))}`,
      ResultSubmitted: `${nodeName(lastAgentOf(t.block))} entregó: ${pctTxt(Number(a.indexBps))} quemado`,
      ValidationRequest: "Se pidió la auditoría",
      ValidationResponse: `El auditor respondió: ${sc}/100${sc >= demo.job.minScore ? " (correcto)" : " (error)"}`,
      JobRejected: "Rechazo: no se paga y baja la reputación",
      PayoutTriggered: "Pago al productor",
      NoPayout: "Cierre sin pago",
    };
    const tone = evs.some((e) => e.event === "JobRejected") ? "bad" : evs.some((e) => e.event === "PayoutTriggered") ? "ok" : undefined;
    return {
      hash: t.hash, when: hms(t.timestamp), what: what[main.event] ?? main.event, tech: evs.map((e) => e.event).join(" + "),
      where: evs.some((e) => e.contract === "escrow") ? "Contrato" : "Auditoría", tone,
    };
  });
}
/** Último nodo asignado antes de un bloque (para nombrar quién entregó un resultado). */
function lastAgentOf(block: number) {
  const as = demo.events.filter((e) => e.event === "NodeAssigned" && e.block <= block);
  return Number(as[as.length - 1]?.args.agentId ?? 0);
}

export function policyTxs(c: Client): TxRow[] {
  return c.onchain ? lot14Txs() : [];
}

export function lot14Kpis() {
  const ts = demo.txs.map((t) => t.timestamp);
  const fee = Number(demo.txs.reduce((s, t) => s + BigInt(t.feeWei), 0n)) / 1e18;
  return {
    indexBps: demo.job.indexBps, triggerBps: demo.job.triggerBps, state: demo.job.state,
    indemnity: avaxTxt(demo.job.indemnityWei), paidAt: dayHm(new Date(Math.max(...ts) * 1000)),
    seconds: Math.max(...ts) - Math.min(...ts), txs: demo.txs.length,
    fee: fee < 0.0001 ? "casi nulo" : avaxTxt(BigInt(Math.round(fee * 1e18)), 4),
    attempts: demo.attempts,
  };
}
