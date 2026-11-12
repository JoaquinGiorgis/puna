import { demo, type Attempt, type Check } from "@/lib/data";
import { int, short } from "@/lib/format";
import { Panel, StatusTag } from "./ui";

/** Chequeos por capa del certificado: "L1 conv 3x3·4: Freivalds", ": requant/ReLU", ": in[i+1]=out[i]". */
function layerRows(a: Attempt | undefined) {
  const map = new Map<string, Check[]>();
  for (const c of a?.certificate?.checks ?? []) {
    const [layer, kind] = c.name.split(": ");
    if (!kind) continue;
    map.set(layer, [...(map.get(layer) ?? []), c]);
  }
  return map;
}

function Cell({ checks }: { checks: Check[] | undefined }) {
  if (!checks?.length) return <span className="text-muted">—</span>;
  const bad = checks.filter((c) => !c.ok);
  if (!bad.length)
    return (
      <span className="font-mono text-ok"><span aria-hidden="true">✓ </span>ok</span>
    );
  return (
    <span className="font-mono text-bad">
      <span aria-hidden="true">✕ </span>falla <span className="text-[11px]">({bad.map((c) => c.name.split(": ")[1]).join(", ")})</span>
    </span>
  );
}

export function Audit() {
  const [a1, a2] = demo.attempts;
  const r1 = layerRows(a1);
  const r2 = layerRows(a2);
  const layers = [...new Set([...r1.keys(), ...r2.keys()])];
  const global = ["inputHash", "modelHash", "outputHash", "indexBps", "merkleRoot"];
  const g = (a: Attempt | undefined, n: string) => a?.certificate?.checks.find((c) => c.name === n);
  const nodeName = (agentId: number) => demo.nodes.find((n) => n.agentId === agentId)?.name ?? `#${agentId}`;

  return (
    <Panel
      labelledBy="auditoria"
      title="Auditoría del validador"
      sub={<>Validador {short(demo.job.validator)}, otro operador · Freivalds C·r ≡ A·(B·r) mód 2³¹−1 · bench {demo.bench.detected}/{demo.bench.faults}, {demo.bench.false_positives} FP</>}
    >
      <div className="glass-raised relative overflow-x-auto rounded-xl">
        <table className="w-full min-w-[440px] text-[12.5px]">
          <caption className="sr-only">Resultado por capa de cada intento</caption>
          <thead>
            <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="px-3 py-1 font-normal">Capa</th>
              <th scope="col" className="px-3 py-1 font-normal">Intento 1 · {a1 ? nodeName(a1.agentId) : "—"}</th>
              <th scope="col" className="px-3 py-1 font-normal">Intento 2 · {a2 ? nodeName(a2.agentId) : "—"}</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((l) => (
              <tr key={l} className="border-b border-line/60">
                <th scope="row" className="px-3 py-[2px] text-left font-mono font-normal">{l}</th>
                <td className="px-3 py-[2px]"><Cell checks={r1.get(l)} /></td>
                <td className="px-3 py-[2px]"><Cell checks={r2.get(l)} /></td>
              </tr>
            ))}
            <tr className="border-b border-line/60">
              <th scope="row" className="px-3 py-[2px] text-left font-mono font-normal">Hashes y Merkle</th>
              <td className="px-3 py-[2px]"><Cell checks={global.map((n) => g(a1, n)).filter(Boolean) as Check[]} /></td>
              <td className="px-3 py-[2px]"><Cell checks={global.map((n) => g(a2, n)).filter(Boolean) as Check[]} /></td>
            </tr>
            <tr>
              <th scope="row" className="px-3 py-1 text-left font-semibold">Score ERC-8004</th>
              {[a1, a2].map((a, i) => (
                <td key={i} className="px-3 py-1">
                  {a ? (
                    <StatusTag tone={a.score >= demo.job.minScore ? "success" : "danger"}>
                      <span className="font-mono">{a.score} / 100</span>
                    </StatusTag>
                  ) : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {a1?.certificate && (
        <p className="mt-1.5 line-clamp-1 text-[11px] leading-snug text-muted" title={a1?.certificate?.summary}>
          <span className="font-semibold text-bad">Intento 1:</span> {a1.certificate.summary}
        </p>
      )}

      <ul className="mt-2 grid gap-2 sm:grid-cols-2" aria-label="Reputación ERC-8004 de los nodos">
        {demo.nodes.map((n) => {
          const avg = n.reputation.average;
          const good = avg !== null && avg >= 50;
          return (
            <li key={n.name} className="glass-raised rounded-xl px-3 py-1.5">
              <p className="flex items-center justify-between gap-2 whitespace-nowrap font-mono text-[11.5px]">
                <span><b>{n.name}</b> <span className="text-muted">rep {avg === null ? "—" : int(Math.round(avg))}/100 · SAA {int(n.saaBps / 100)} %</span></span>
                <StatusTag tone={good ? "success" : "danger"}>{good ? "alta" : "baja"}</StatusTag>
              </p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
