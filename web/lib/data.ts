import demoJson from "@/public/data/demo.json";
import overlayJson from "@/public/renders/globe-overlay.json";

/** Datos reales exportados por scripts/export_web.py (job en Fuji, certificados, FIRMS, órbitas). */
export type Check = { name: string; ok: boolean; detail: string };
export type Certificate = { score: number; summary: string; checks: Check[]; validator: string };
export type Attempt = {
  attempt: number;
  agentId: number;
  saaBps: number;
  indexBps: number;
  requestHash: string;
  score: number;
  outcome: "Rejected" | "Paid" | "NoPayout";
  certificate: Certificate | null;
};
export type ChainEvent = {
  event: string;
  contract: "escrow" | "validation" | "reputation";
  tx: string;
  block: number;
  logIndex: number;
  args: Record<string, string | number | boolean>;
};
export type Tx = { hash: string; block: number; timestamp: number; from: string; gasUsed: number; feeWei: string };
export type NodeInfo = {
  name: string;
  agentId: number;
  proxy: string;
  norad: number;
  saaBps: number;
  orbitHash: string;
  reputation: { count: number; average: number | null };
};
export type Demo = {
  generatedAt: string;
  chain: { id: number; name: string; explorer: string };
  contracts: { escrow: string; identity: string; validation: string; reputation: string };
  job: {
    id: number;
    state: string;
    insurer: string;
    beneficiary: string;
    validator: string;
    inputHash: string;
    modelHash: string;
    outputHash: string;
    merkleRoot: string;
    triggerBps: number;
    minScore: number;
    maxSaaBps: number;
    indexBps: number;
    indemnityWei: string;
    computeFeeWei: string;
    validatorFeeWei: string;
    attempt: number;
  };
  attempts: Attempt[];
  events: ChainEvent[];
  txs: Tx[];
  window: { start: string; minutes: number };
  nodes: NodeInfo[];
  lot: {
    name: string;
    place: string;
    bbox: number[];
    cells: number;
    mask: number[][];
    burned: number[][];
    detections: number[][];
    foci: { x: number; y: number; frp: number; date: string; time: string; sat: string; confidence: string }[];
    fociDates: [string, string] | null;
    source: string;
  };
  bench: { faults: number; detected: number; honest_runs: number; false_positives: number; index_changed: number };
};

export type Overlay = {
  frame: [number, number];
  groundA: string;
  orbitA: string;
  windowA: string;
  satA: [number, number];
  satAInSaa: boolean;
  groundB: string;
  orbitB: string;
  windowB: string;
  satB: [number, number];
  satBInSaa: boolean;
  saa: string;
  saaLabel: [number, number, number];
  lote: [number, number, number];
  cities: Record<string, [number, number, number]>;
};

export const demo = demoJson as unknown as Demo;
export const overlay = overlayJson as unknown as Overlay;
