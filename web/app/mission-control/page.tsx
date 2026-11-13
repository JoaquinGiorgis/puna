import { Audit } from "@/components/Audit";
import { Constellation } from "@/components/Constellation";
import { Policy } from "@/components/Policy";
import { Timeline } from "@/components/Timeline";
import { TopBar } from "@/components/TopBar";
import { demo } from "@/lib/data";
import { LiveProvider } from "@/components/LiveProvider";

export default function Page() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Saltar al contenido
      </a>
      <LiveProvider snapshot={demo}>
      <div className="flex min-h-dvh flex-col xl:h-dvh xl:overflow-hidden">
      <TopBar />
      {/* En escritorio todo entra en una sola vista: la grilla ocupa el alto restante de la ventana. */}
      <main id="main" className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-3 p-3 xl:min-h-0 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] xl:grid-rows-[minmax(0,1fr)_auto] [&>*]:min-w-0">
        <Constellation />
        <div className="grid min-w-0 content-start gap-3 xl:min-h-0 xl:grid-rows-[auto_minmax(0,1fr)] [&>*]:min-w-0 [&>*]:xl:min-h-0">
          <Policy />
          <Audit />
        </div>
        <div className="xl:col-span-2">
          <Timeline />
        </div>
        <footer className="text-xs text-muted xl:hidden">
          <p>
            <strong className="text-ink">Real:</strong> órbitas (TLE CelesTrak en vivo + SGP4), focos NASA FIRMS en vivo, exposición a la
            Anomalía y protones GOES (NOAA SWPC), nodo y validador como operadores separados (wallets y máquinas distintas),
            verificación Freivalds, transacciones y registros ERC-8004 en Avalanche Fuji.{" "}
            <strong className="text-warn">Simulado:</strong> el cómputo a bordo del satélite y la vista satelital del lote. La falla
            de radiación es inyectada. Benchmark: {demo.bench.detected}/{demo.bench.faults} fallas detectadas, {demo.bench.false_positives}/
            {demo.bench.honest_runs} falsos positivos. Datos exportados {new Date(demo.generatedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}.
          </p>
        </footer>
      </main>
      </div>
      </LiveProvider>
    </>
  );
}
