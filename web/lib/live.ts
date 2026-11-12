/**
 * Lectura EN VIVO del escrow y de ERC-8004 en Fuji, desde el navegador.
 *
 * - Eventos: indexador de Routescan (API compatible con Etherscan). Un pedido filtra por topic sobre
 *   todo el historial: el escrow por jobId y el Validation Registry por requestHash. Trae hora y gas.
 * - Estado: RPC pública con viem (nextJobId, getJob, reputación). Unos 4 pedidos por refresco.
 * Arma un objeto con la misma forma que demo.json; lo estático (FIRMS, órbitas, benchmark) sale de la foto.
 */
import { createPublicClient, decodeEventLog, fallback, http, parseAbi, type Abi, type Hex } from "viem";
import { avalancheFuji } from "viem/chains";
import escrowAbiJson from "./abi/PunaEscrow.json";
import type { Attempt, Certificate, ChainEvent, Demo, Tx } from "./data";

const ESCROW_ABI = escrowAbiJson as unknown as Abi;
const VALIDATION_ABI = parseAbi([
  "event ValidationRequest(address indexed validatorAddress, uint256 indexed agentId, string requestURI, bytes32 indexed requestHash)",
  "event ValidationResponse(address indexed validatorAddress, uint256 indexed agentId, bytes32 indexed requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)",
]);
const REPUTATION_ABI = parseAbi([
  "function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)",
]);
const STATES = ["None", "Created", "Assigned", "Submitted", "Paid", "NoPayout", "Rejected", "Refunded"];
const INDEXER = "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api";
const FROM_BLOCK = 60_900_000; // poco antes del deploy de PunaEscrow

// publicnode primero: CORS abierto y no comparte cuota con los scripts (que usan la RPC de Avalanche,
// que limita por IP con 429). La de Avalanche queda de respaldo.
export const client = createPublicClient({
  chain: avalancheFuji,
  transport: fallback([
    http("https://avalanche-fuji-c-chain-rpc.publicnode.com", { retryCount: 1 }),
    http("https://api.avax-test.network/ext/bc/C/rpc", { retryCount: 1 }),
  ]),
});

type RawLog = {
  address: string; topics: Hex[]; data: Hex; blockNumber: string; timeStamp: string;
  gasPrice: string; gasUsed: string; logIndex: string; transactionHash: Hex;
};

const n = (h: string) => Number.parseInt(h, 16) || 0;

async function getLogs(address: string, topic: { idx: 1 | 3; value: Hex }): Promise<RawLog[]> {
  const q = new URLSearchParams({
    module: "logs", action: "getLogs", address, fromBlock: String(FROM_BLOCK), toBlock: "latest",
    [`topic${topic.idx}`]: topic.value,
  });
  const r = await fetch(`${INDEXER}?${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`indexador HTTP ${r.status}`);
  const j = (await r.json()) as { status: string; message: string; result: RawLog[] | string };
  if (Array.isArray(j.result)) return j.result;
  if (/no records/i.test(j.message)) return [];
  throw new Error(`indexador: ${typeof j.result === "string" ? j.result : j.message}`);
}

const toArgs = (args: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(args).map(([k, v]) => [
      k,
      typeof v === "bigint" ? (v > BigInt(Number.MAX_SAFE_INTEGER) ? v.toString() : Number(v)) : (v as string | number | boolean),
    ]),
  );

function decode(l: RawLog, abi: Abi, contract: ChainEvent["contract"]): ChainEvent | null {
  try {
    const d = decodeEventLog({ abi, data: l.data, topics: l.topics as [Hex, ...Hex[]] }) as unknown as {
      eventName: string; args: Record<string, unknown>;
    };
    return { event: d.eventName, contract, tx: l.transactionHash, block: n(l.blockNumber), logIndex: n(l.logIndex), args: toArgs(d.args) };
  } catch {
    return null;
  }
}

const certCache = new Map<string, Certificate | null>();

async function fetchCertificate(uri: string): Promise<Certificate | null> {
  if (certCache.has(uri)) return certCache.get(uri)!;
  // puna-artifacts://<sha256>.json → /api/artifact/<sha256>.json; el navegador verifica el sha256
  const m = /^puna-artifacts:\/\/([0-9a-f]{64}\.json)/.exec(uri);
  const url = m ? `/api/artifact/${m[1]}` : /^https?:\/\//.test(uri) ? uri.split("#")[0] : null;
  let cert: Certificate | null = null;
  if (url) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const buf = await r.arrayBuffer();
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (!m || `${hash}.json` === m[1]) cert = JSON.parse(new TextDecoder().decode(buf)) as Certificate;
      }
    } catch {
      cert = null;
    }
  }
  if (cert) certCache.set(uri, cert); // los fallidos se reintentan en el próximo refresco
  return cert;
}

export async function latestJobId(escrow: Hex): Promise<number> {
  const next = (await client.readContract({ address: escrow, abi: ESCROW_ABI, functionName: "nextJobId" })) as bigint;
  return Number(next) - 1;
}

const TAIL = 200n; // bloques recientes que se piden directo a la RPC (el indexador va con ~1 min de atraso)
const txMeta = new Map<string, Tx>();

/** eth_getLogs directo a la RPC sobre los últimos TAIL bloques, de a 100 (límite de Fuji). */
async function rpcTail(address: Hex | string, topics: (Hex | Hex[] | null)[], head: bigint): Promise<RawLog[]> {
  const out: RawLog[] = [];
  for (let to = head; to > head - TAIL; to -= 100n) {
    const from = to - 99n;
    const logs = (await client.request({
      method: "eth_getLogs",
      params: [{ address: address as Hex, fromBlock: `0x${from.toString(16)}`, toBlock: `0x${to.toString(16)}`, topics }],
    } as never)) as { address: string; topics: Hex[]; data: Hex; blockNumber: string; logIndex: string; transactionHash: Hex }[];
    for (const l of logs) out.push({ ...l, timeStamp: "", gasPrice: "", gasUsed: "" });
  }
  return out;
}

const merge = (a: RawLog[], b: RawLog[]) => {
  const seen = new Set(a.map((l) => `${l.transactionHash}:${n(l.logIndex)}`));
  return [...a, ...b.filter((l) => !seen.has(`${l.transactionHash}:${n(l.logIndex)}`))];
};

/** Un refresco completo del job: eventos (indexador + cola reciente por RPC), estado y reputación (RPC). */
export async function refresh(base: Demo, jobId: number): Promise<Demo | null> {
  const escrow = base.contracts.escrow as Hex;
  const validation = base.contracts.validation;
  const jobTopic = `0x${jobId.toString(16).padStart(64, "0")}` as Hex;
  const head = await client.getBlockNumber();

  const [idxEscrow, tailEscrow] = await Promise.all([
    getLogs(escrow, { idx: 1, value: jobTopic }).catch(() => [] as RawLog[]),
    rpcTail(escrow, [null, jobTopic], head),
  ]);
  const own = merge(idxEscrow, tailEscrow)
    .map((l) => ({ l, e: decode(l, ESCROW_ABI, "escrow") }))
    .filter((x) => x.e && Number(x.e.args.jobId) === jobId);
  if (!own.some((x) => x.e!.event === "JobCreated")) return null;

  const requestHashes = [...new Set(own.filter((x) => x.e!.event === "ResultSubmitted").map((x) => String(x.e!.args.requestHash) as Hex))];
  const [idxVal, tailVal] = requestHashes.length
    ? await Promise.all([
        Promise.all(requestHashes.map((h) => getLogs(validation, { idx: 3, value: h }).catch(() => [] as RawLog[]))).then((x) => x.flat()),
        rpcTail(validation, [null, null, null, requestHashes], head),
      ])
    : [[], []];
  const val = merge(idxVal, tailVal).map((l) => ({ l, e: decode(l, VALIDATION_ABI, "validation") })).filter((x) => x.e);

  const all = [...own, ...val].sort((a, b) => a.e!.block - b.e!.block || a.e!.logIndex - b.e!.logIndex);
  const events = all.map((x) => x.e!);

  // hora y gas: del indexador si lo trae; si no (cola por RPC), recibo + bloque, una vez por tx
  const txs = new Map<string, Tx>();
  await Promise.all(
    all.map(async ({ l }) => {
      if (txs.has(l.transactionHash)) return;
      if (l.timeStamp) {
        const gasUsed = n(l.gasUsed);
        txs.set(l.transactionHash, {
          hash: l.transactionHash, block: n(l.blockNumber), timestamp: n(l.timeStamp), from: "",
          gasUsed, feeWei: (BigInt(gasUsed) * BigInt(n(l.gasPrice))).toString(),
        });
        return;
      }
      if (!txMeta.has(l.transactionHash)) {
        const r = await client.getTransactionReceipt({ hash: l.transactionHash });
        const b = await client.getBlock({ blockNumber: r.blockNumber });
        txMeta.set(l.transactionHash, {
          hash: l.transactionHash, block: Number(r.blockNumber), timestamp: Number(b.timestamp), from: r.from,
          gasUsed: Number(r.gasUsed), feeWei: (r.gasUsed * r.effectiveGasPrice).toString(),
        });
      }
      txs.set(l.transactionHash, txMeta.get(l.transactionHash)!);
    }),
  );

  // certificados de cada respuesta del validador
  const certs = new Map<string, Certificate | null>();
  await Promise.all(
    events.filter((e) => e.event === "ValidationResponse")
      .map(async (e) => certs.set(String(e.args.requestHash), await fetchCertificate(String(e.args.responseURI)))),
  );

  const attempts: Attempt[] = [];
  for (const e of events) {
    const a = e.args;
    if (e.event === "NodeAssigned")
      attempts.push({ attempt: Number(a.attempt), agentId: Number(a.agentId), saaBps: Number(a.saaBps) } as Attempt);
    const last = attempts[attempts.length - 1];
    if (!last) continue;
    if (e.event === "ResultSubmitted") Object.assign(last, { indexBps: Number(a.indexBps), requestHash: String(a.requestHash) });
    if (e.event === "ValidationResponse" && last.requestHash === String(a.requestHash))
      Object.assign(last, { score: Number(a.response), certificate: certs.get(String(a.requestHash)) ?? null });
    if (e.event === "JobRejected") last.outcome = "Rejected";
    if (e.event === "PayoutTriggered") last.outcome = "Paid";
    if (e.event === "NoPayout") last.outcome = "NoPayout";
  }

  const [j, ...reps] = await Promise.all([
    client.readContract({ address: escrow, abi: ESCROW_ABI, functionName: "getJob", args: [BigInt(jobId)] }) as Promise<Record<string, unknown>>,
    ...base.nodes.map((node) =>
      client.readContract({
        address: base.contracts.reputation as Hex, abi: REPUTATION_ABI, functionName: "getSummary",
        args: [BigInt(node.agentId), [escrow], "puna", ""],
      }) as Promise<readonly [bigint, bigint, number]>,
    ),
  ]);
  const nodes = base.nodes.map((node, i) => {
    const [count, value, dec] = reps[i] as readonly [bigint, bigint, number];
    return { ...node, reputation: { count: Number(count), average: count ? Number(value) / 10 ** dec : null } };
  });

  const s = (v: unknown) => String(v);
  return {
    ...base,
    generatedAt: new Date().toISOString(),
    job: {
      id: jobId, state: STATES[Number(j.state)] ?? "None", insurer: s(j.insurer), beneficiary: s(j.beneficiary),
      validator: s(j.validator), inputHash: s(j.inputHash), modelHash: s(j.modelHash), outputHash: s(j.outputHash),
      merkleRoot: s(j.merkleRoot), triggerBps: Number(j.triggerBps), minScore: Number(j.minScore), maxSaaBps: Number(j.maxSaaBps),
      indexBps: Number(j.indexBps), indemnityWei: s(j.indemnity), computeFeeWei: s(j.computeFee),
      validatorFeeWei: s(j.validatorFeePerAttempt), attempt: Number(j.attempt),
    },
    attempts,
    events,
    txs: [...txs.values()],
    nodes,
  };
}
