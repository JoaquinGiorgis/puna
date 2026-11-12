/**
 * Lectura EN VIVO del escrow y de ERC-8004 en Fuji, desde el navegador.
 *
 * - Eventos: eth_getLogs directo a la RPC (publicnode acepta rangos de ~25.000 bloques), filtrando el
 *   escrow por jobId y el Validation Registry por requestHash desde el deploy. Fuente primaria, sin el
 *   atraso ni los huecos que mostró el indexador de Routescan.
 * - Estado: getJob y reputación por viem. Hora y gas de cada tx: recibo + bloque, una vez por tx.
 * Arma un objeto con la misma forma que demo.json; lo estático (FIRMS, órbitas, benchmark) sale de la foto.
 */
import { createPublicClient, decodeEventLog, http, parseAbi, type Abi, type Hex } from "viem";
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
const FROM_BLOCK = 60_900_000; // poco antes del deploy de PunaEscrow

// publicnode: CORS abierto. La RPC de Avalanche limita por IP con 429 sin cabeceras CORS (el navegador
// lo ve como "Failed to fetch"), así que en la web no sirve de respaldo. Si publicnode falla, la página
// se queda con la última lectura o la foto y lo indica.
export const client = createPublicClient({
  chain: avalancheFuji,
  transport: http("https://avalanche-fuji-c-chain-rpc.publicnode.com", { retryCount: 2 }),
});

type RawLog = {
  address: string; topics: Hex[]; data: Hex; blockNumber: string; timeStamp: string;
  gasPrice: string; gasUsed: string; logIndex: string; transactionHash: Hex;
};

const n = (h: string) => Number.parseInt(h, 16) || 0;

const SPAN = 20_000n; // publicnode acepta ~25.000 bloques por eth_getLogs

/** eth_getLogs a la RPC desde FROM_BLOCK (o `from`) hasta la cabeza, en tramos de SPAN bloques. */
async function rpcLogs(address: Hex | string, topics: (Hex | Hex[] | null)[], head: bigint, from = BigInt(FROM_BLOCK)): Promise<RawLog[]> {
  const ranges: [bigint, bigint][] = [];
  for (let a = from; a <= head; a += SPAN) ranges.push([a, a + SPAN - 1n > head ? head : a + SPAN - 1n]);
  const chunks = await Promise.all(
    ranges.map(([f, to]) =>
      client.request({
        method: "eth_getLogs",
        params: [{ address: address as Hex, fromBlock: `0x${f.toString(16)}`, toBlock: `0x${to.toString(16)}`, topics }],
      } as never) as Promise<{ address: string; topics: Hex[]; data: Hex; blockNumber: string; logIndex: string; transactionHash: Hex }[]>,
    ),
  );
  return chunks.flat().map((l) => ({ ...l, timeStamp: "", gasPrice: "", gasUsed: "" }));
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
  // puna-artifacts://<sha256>.json → primero la copia estática del deploy (/artifacts/, para Vercel) y
  // después la ruta que lee out/artifacts en la máquina del validador. El navegador verifica el sha256.
  const m = /^puna-artifacts:\/\/([0-9a-f]{64}\.json)/.exec(uri);
  const urls = m ? [`/artifacts/${m[1]}`, `/api/artifact/${m[1]}`] : /^https?:\/\//.test(uri) ? [uri.split("#")[0]] : [];
  let cert: Certificate | null = null;
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const buf = await r.arrayBuffer();
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      if (!m || `${hash}.json` === m[1]) {
        cert = JSON.parse(new TextDecoder().decode(buf)) as Certificate;
        break;
      }
    } catch {
      /* probar la siguiente fuente */
    }
  }
  if (cert) certCache.set(uri, cert); // los fallidos se reintentan en el próximo refresco
  return cert;
}

export async function latestJobId(escrow: Hex): Promise<number> {
  const next = (await client.readContract({ address: escrow, abi: ESCROW_ABI, functionName: "nextJobId" })) as bigint;
  return Number(next) - 1;
}

const txMeta = new Map<string, Tx>();

/** Un refresco completo del job: eventos, estado y reputación, todo por RPC. */
export async function refresh(base: Demo, jobId: number): Promise<Demo | null> {
  const escrow = base.contracts.escrow as Hex;
  const validation = base.contracts.validation;
  const jobTopic = `0x${jobId.toString(16).padStart(64, "0")}` as Hex;
  const head = await client.getBlockNumber();

  const own = (await rpcLogs(escrow, [null, jobTopic], head))
    .map((l) => ({ l, e: decode(l, ESCROW_ABI, "escrow") }))
    .filter((x) => x.e && Number(x.e.args.jobId) === jobId);
  if (!own.some((x) => x.e!.event === "JobCreated")) return null;

  const requestHashes = [...new Set(own.filter((x) => x.e!.event === "ResultSubmitted").map((x) => String(x.e!.args.requestHash) as Hex))];
  const created = own.find((x) => x.e!.event === "JobCreated")!;
  const valLogs = requestHashes.length ? await rpcLogs(validation, [null, null, null, requestHashes], head, BigInt(created.e!.block)) : [];
  const val = valLogs.map((l) => ({ l, e: decode(l, VALIDATION_ABI, "validation") })).filter((x) => x.e);

  const all = [...own, ...val].sort((a, b) => a.e!.block - b.e!.block || a.e!.logIndex - b.e!.logIndex);
  const events = all.map((x) => x.e!);

  // hora y gas: recibo + bloque de cada tx, una sola vez (cache en txMeta)
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
