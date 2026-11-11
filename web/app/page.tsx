import { Audit } from "@/components/Audit";
import { Constellation } from "@/components/Constellation";
import { Policy } from "@/components/Policy";
import { Timeline } from "@/components/Timeline";
import { TopBar } from "@/components/TopBar";
import { demo } from "@/lib/data";

export default function Page() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <TopBar />
      <main id="main" className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Constellation />
        <div className="grid min-w-0 content-start gap-5 [&>*]:min-w-0">
          <Policy />
          <Audit />
        </div>
        <div className="xl:col-span-2">
          <Timeline />
        </div>
        <footer className="text-xs text-muted xl:col-span-2">
          <p>
            <strong className="text-ink">Real:</strong> órbitas (TLE CelesTrak + SGP4), focos NASA FIRMS, verificación Freivalds,
            transacciones y registros ERC-8004 en Avalanche Fuji.{" "}
            <strong className="text-warn">Simulado:</strong> satélites como nodos de cómputo, operadores, radiación (proxy saaBps),
            vista satelital del lote. Benchmark: {demo.bench.detected}/{demo.bench.faults} fallas detectadas, {demo.bench.false_positives}/
            {demo.bench.honest_runs} falsos positivos. Datos exportados {new Date(demo.generatedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}.
          </p>
        </footer>
      </main>
    </>
  );
}
