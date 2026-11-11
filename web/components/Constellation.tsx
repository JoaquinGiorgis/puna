import type { ReactNode } from "react";
import { demo, overlay } from "@/lib/data";
import { int } from "@/lib/format";

const [FW, FH] = overlay.frame;
const PAD = 48;

/** Etiqueta anclada a un punto del globo (dentro del SVG: escala y recorta igual que la imagen). */
function GeoLabel({ x, y, dx, dy, w, children }: { x: number; y: number; dx: number; dy: number; w: number; children: ReactNode }) {
  return (
    <foreignObject x={x + dx} y={y + dy} width={w} height={44} overflow="visible">
      <div className="glass-dark inline-block rounded-md px-2 py-1 leading-tight">{children}</div>
    </foreignObject>
  );
}

/** Visor oscuro: globo NASA Blue Marble (render) + overlays SVG desde órbitas reales (sgp4, TLE CelesTrak). */
export function Constellation() {
  const start = new Date(demo.window.start);
  const end = new Date(start.getTime() + demo.window.minutes * 60_000);
  const hm = (d: Date) => d.toISOString().slice(11, 16);
  const [a1, a2] = demo.attempts;
  const n07 = demo.nodes.find((n) => n.name === "ORBIT-07")!;
  const n03 = demo.nodes.find((n) => n.name === "ORBIT-03")!;
  const inSaa = demo.nodes.filter((n) => n.saaBps > 0).length;
  const failing = a1?.certificate?.checks.find((c) => !c.ok)?.name.split(" ")[0] ?? "—";

  return (
    <section
      aria-labelledby="constelacion"
      className="theme-dark relative min-h-[520px] overflow-hidden rounded-[28px] border border-white/60 bg-[#04070d] shadow-[0_24px_60px_-20px_rgb(10_30_70/0.55)]"
    >
      {/* El render va dentro del SVG para que imagen, trazas y etiquetas recorten igual. El encuadre se corre
          a la izquierda (-PAD) para que ORBIT-03 no quede en el borde cuando el panel es angosto. */}
      <svg viewBox={`${-PAD} 0 ${FW} ${FH}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img"
        aria-label={`Globo con la Anomalía del Atlántico Sur y las trazas reales de ${n07.proxy} (ORBIT-07) y ${n03.proxy} (ORBIT-03) en la ventana de ejecución; ORBIT-07 está dentro de la Anomalía y ORBIT-03 fuera.`}>
        <image href="/renders/globe.png" x="0" y="0" width={FW} height={FH} preserveAspectRatio="none" />
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <path d={overlay.saa} fill="rgb(255 90 78 / 0.10)" stroke="var(--status-danger)" strokeWidth="1.2" strokeDasharray="5 5" />
        <path d={overlay.groundA} fill="none" stroke="var(--status-danger)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
        <path d={overlay.groundB} fill="none" stroke="var(--accent-cyan)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
        <path d={overlay.orbitA} fill="none" stroke="var(--status-danger)" strokeOpacity="0.7" strokeWidth="1.4" />
        <path d={overlay.orbitB} fill="none" stroke="var(--accent-cyan)" strokeOpacity="0.7" strokeWidth="1.4" />
        <path d={overlay.windowA} fill="none" stroke="var(--status-danger)" strokeWidth="4" filter="url(#glow)" />
        <path d={overlay.windowA} fill="none" stroke="var(--status-danger)" strokeWidth="2.4" />
        <path d={overlay.windowB} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.4" />
        {Object.entries(overlay.cities).map(([name, [x, y, z]]) =>
          z > 0.05 ? (
            <g key={name}>
              <circle cx={x} cy={y} r="1.8" fill="#e6edf7" opacity="0.8" />
              <text x={x + 5} y={y + 3} fontSize="8.5" fill="#c9d4e4" className="font-mono uppercase">{name}</text>
            </g>
          ) : null,
        )}
        <text x={overlay.saaLabel[0]} y={overlay.saaLabel[1]} fontSize="10" fill="#ff8a80" textAnchor="middle" className="font-mono uppercase">
          Anomalía del Atlántico Sur
        </text>
        {/* Lote 14 */}
        <circle cx={overlay.lote[0]} cy={overlay.lote[1]} r="9" fill="var(--fire-hot)" opacity="0.35" className="sat-halo" />
        <circle cx={overlay.lote[0]} cy={overlay.lote[1]} r="3.5" fill="var(--fire-hot)" stroke="#fff" strokeWidth="1" />
        {/* satélites (render simulado) */}
        <circle cx={overlay.satA[0]} cy={overlay.satA[1]} r="20" fill="var(--status-danger)" opacity="0.4" className="sat-halo" />
        <image href="/renders/satA.png" x={overlay.satA[0] - 32} y={overlay.satA[1] - 20} width="64" height="40" />
        <circle cx={overlay.satB[0]} cy={overlay.satB[1]} r="20" fill="var(--accent-cyan)" opacity="0.3" />
        <image href="/renders/satB.png" x={overlay.satB[0] - 32} y={overlay.satB[1] - 20} width="64" height="40" />

        <GeoLabel x={overlay.satA[0]} y={overlay.satA[1]} dx={-150} dy={24} w={190}>
          <p className="font-mono text-[9px] font-semibold text-bad"><span aria-hidden="true">✕ </span>ORBIT-07 · rechazado</p>
          <p className="font-mono text-[8.5px] text-muted">{n07.proxy} · saa {int(n07.saaBps)} bps · Freivalds ✕ {failing}</p>
        </GeoLabel>
        <GeoLabel x={overlay.satB[0]} y={overlay.satB[1]} dx={30} dy={-16} w={190}>
          <p className="font-mono text-[9px] font-semibold text-ok"><span aria-hidden="true">✓ </span>ORBIT-03 · validado</p>
          <p className="font-mono text-[8.5px] text-muted">
            {n03.proxy} · saa {int(n03.saaBps)} bps{a2 ? ` · ${(a2.indexBps / 100).toLocaleString("es-AR")} % quemado` : ""}
          </p>
        </GeoLabel>
        <GeoLabel x={overlay.lote[0]} y={overlay.lote[1]} dx={14} dy={-8} w={150}>
          <p className="font-mono text-[9px] font-semibold text-fire">Lote 14 · {demo.lot.place}</p>
          <p className="font-mono text-[8.5px] text-muted">{demo.lot.foci.length} focos FIRMS reales</p>
        </GeoLabel>
      </svg>

      {/* HUD superior */}
      <div className="glass-dark absolute left-5 top-5 max-w-[calc(100%-2.5rem)] rounded-2xl px-4 py-3 sm:max-w-[46%]">
        <h2 id="constelacion" className="text-[15px] font-semibold">Constelación de cómputo</h2>
        <p className="mt-1 font-mono text-[11px] text-muted">
          Ventana de ejecución {hm(start)}–{hm(end)} UTC ·{" "}
          {start.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
        </p>
      </div>
      <dl className="absolute right-5 top-5 hidden gap-2 sm:flex">
        {[
          ["Nodos", `${demo.nodes.length}`],
          ["En Anomalía", `${inSaa}`],
          ["maxSaaBps", int(demo.job.maxSaaBps)],
        ].map(([k, v]) => (
          <div key={k} className="glass-dark rounded-xl px-3 py-2">
            <dt className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{k}</dt>
            <dd className="font-mono text-base">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Leyenda y atribución */}
      <ul className="glass-dark absolute bottom-5 left-5 space-y-1 rounded-2xl px-4 py-3 text-[11.5px]">
        <li className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-0.5 w-5 bg-bad" />Traza en la Anomalía (ORBIT-07)</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-0.5 w-5 bg-cyan" />Traza fuera de la Anomalía (ORBIT-03)</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-fire" />Lote 14: focos NASA FIRMS (VIIRS 375 m)</li>
        <li className="flex items-center gap-2"><span aria-hidden="true" className="inline-block h-2.5 w-5 border border-dashed border-bad bg-bad-bg" />Anomalía (polígono proxy de saaBps)</li>
      </ul>
      <p className="glass-dark absolute bottom-5 right-5 hidden max-w-[46%] sm:block rounded-xl px-3 py-2 text-right font-mono text-[10.5px] text-[#c9d4e4]">
        Órbitas reales: TLE CelesTrak + SGP4 · Imagen: NASA Blue Marble · Focos: NASA FIRMS ·{" "}
        <span className="text-warn">satélites como nodos de cómputo: simulado</span>
      </p>
    </section>
  );
}
