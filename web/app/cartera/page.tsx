"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { Logo, useDemoGuard } from "@/components/Shell";
import { ClientPanel, type Filter } from "@/components/cartera/ClientPanel";
import { GlobeView, type Row } from "@/components/cartera/GlobeView";
import { SatPanel } from "@/components/cartera/SatPanel";
import { HOME, clampView, proj, type View } from "@/lib/globe-noa";
import { PolicyModal } from "@/components/cartera/PolicyModal";
import { useSky } from "@/components/useSky";
import { demo } from "@/lib/data";
import { int } from "@/lib/format";
import { CLIENTS, INSURER, LEVEL_ORDER, assess } from "@/lib/portfolio";
import { signOut } from "@/lib/session";

/** Cartera de la aseguradora: globo a pantalla completa + panel de vidrio con los clientes + modal de póliza. */
export default function Cartera() {
  const ok = useDemoGuard();
  const router = useRouter();
  const sky = useSky(demo.lot.bbox, ok);
  const [view, setView] = useState<View>(HOME);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [satHover, setSatHover] = useState<string | null>(null);
  const ready = sky.firesAt !== null || sky.firesError !== null;

  const rows: Row[] = useMemo(
    () =>
      CLIENTS.map((c) => ({ c, a: assess(c, sky.fires) }))
        .sort((x, y) => LEVEL_ORDER[x.a.level] - LEVEL_ORDER[y.a.level] || y.a.inField.length - x.a.inField.length || (x.a.nearestKm ?? 1e9) - (y.a.nearestKm ?? 1e9)),
    [sky.fires],
  );

  const fly = useCallback((id: string | null) => {
    if (!id) return setView(HOME);
    const c = CLIENTS.find((x) => x.id === id)!;
    const p = proj((c.bbox[1] + c.bbox[3]) / 2, (c.bbox[0] + c.bbox[2]) / 2);
    setView(clampView({ k: 2.2, x: p.x + 120, y: p.y }));
  }, []);
  const zoom = (f: number) => setView((v) => clampView({ ...v, k: v.k * f }));
  const openPolicy = useCallback((id: string) => { setOpen(id); fly(id); }, [fly]);
  const row = rows.find((r) => r.c.id === open);
  const selected = open ?? hover;

  if (!ok) return <p className="grid min-h-dvh place-items-center bg-[#04070d] text-[13px] text-[#9aa9be]">Verificando sesión…</p>;

  return (
    <div className="theme-dark fixed inset-0 overflow-hidden bg-[#04070d] text-ink">
      <GlobeView rows={rows} fires={sky.fires} sats={sky.sats} defs={sky.defs} now={sky.mounted ? sky.now : new Date(0)} selected={selected} view={view} setView={setView} onSelect={openPolicy} satHover={satHover} />

      {/* capa de UI flotante: no bloquea el globo salvo en sus tarjetas */}
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-3 md:p-4">
        <header className="lg pointer-events-auto flex flex-wrap items-center gap-x-4 gap-y-2 self-start rounded-[18px] py-2 pl-4 pr-2.5">
          <Logo />
          <nav aria-label="Secciones" className="flex gap-0.5 rounded-full bg-white/[0.08] p-[3px] text-[12.5px] font-medium">
            <span aria-current="page" className="rounded-full bg-white px-3 py-1.5 text-[#0e1b2c]">Cartera</span>
            <Link href="/mission-control" className="rounded-full px-3 py-1.5 text-[#e6edf7] hover:bg-white/10">Auditoría on-chain</Link>
          </nav>
          <span className="hidden items-center gap-1.5 rounded-full bg-[#34d399]/15 px-2.5 py-1.5 font-mono text-[11px] text-[#6ee7b7] sm:flex" aria-live="polite">
            {sky.firesError ? <span className="text-[#f5c46b]">▲ {sky.firesError}</span> : sky.firesAt
              ? <><span aria-hidden="true">●</span> En vivo · FIRMS {int(sky.fires.length)} focos · {sky.firesAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Argentina/Buenos_Aires" })}</>
              : "Consultando FIRMS…"}
          </span>
          <span className="hidden text-[12px] leading-tight md:block">
            <span className="block font-medium">{INSURER.name}</span>
            <span className="block text-[11px] text-muted">{INSURER.user}</span>
          </span>
          <button onClick={() => { signOut(); router.push("/"); }} className="rounded-full border border-white/25 bg-white/[0.07] px-3 py-1.5 text-[12px] hover:bg-white/15">Salir</button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-stretch md:justify-between">
          <div className="hidden min-h-0 flex-col justify-end gap-2.5 md:flex">
            <SatPanel sats={sky.sats} passes={sky.passes} fires={sky.fires} now={sky.mounted ? sky.now : new Date(0)} onHover={setSatHover} />
            <section aria-label="Leyenda" className="lg pointer-events-auto w-[320px] shrink-0 rounded-2xl px-3.5 py-2.5 text-[11px]">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {[["#c4352b", "#fff", "!", "Atención"], ["#f5b03d", "#0e1b2c", "▲", "Vigilancia"], ["#34d399", "#0e1b2c", "✓", "Sin novedades"]].map(([bg, fg, ic, l]) => (
                  <li key={l} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className="grid h-3.5 w-3.5 place-items-center rounded-full text-[7.5px] font-bold" style={{ background: bg, color: fg, outline: "1.5px solid #fff" }}>{ic}</span>{l}
                  </li>
                ))}
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#ff7a1a]" />Fuego · NASA FIRMS</li>
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-3 rounded-sm border border-dashed border-[#ff5a4e] bg-[#ff5a4e]/25" />Anomalía (radiación)</li>
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="w-3.5 border-t-2 border-dashed border-[#3dd6f5]" />Órbita · SGP4</li>
              </ul>
              <p className="mt-1.5 text-[10.5px] text-[#f5c46b]"><span aria-hidden="true">▲ </span>Cartera simulada · fuego, órbitas, imágenes y Lote 14 reales</p>
              <p className="text-[10px] text-muted">Globo NASA Blue Marble · arrastrá para moverte · rueda o pellizco para el zoom</p>
            </section>
          </div>
          <div className="pointer-events-none flex min-h-0 items-end gap-3 md:items-stretch">
            <div className="hidden flex-col justify-end md:flex">
              <div className="lg pointer-events-auto flex flex-col overflow-hidden rounded-[14px]">
                <button onClick={() => zoom(1.5)} aria-label="Acercar" className="h-10 w-10 text-[16px] hover:bg-white/10">+</button>
                <button onClick={() => zoom(1 / 1.5)} aria-label="Alejar" className="h-10 w-10 text-[16px] hover:bg-white/10">−</button>
                <button onClick={() => fly(null)} aria-label="Volver a la vista del NOA" className="h-10 w-10 text-[15px] hover:bg-white/10">◎</button>
              </div>
            </div>
            <ClientPanel rows={rows} ready={ready} now={sky.mounted ? sky.now : new Date()} query={query} setQuery={setQuery}
              filter={filter} setFilter={setFilter} selected={selected} onOpen={openPolicy} onHover={setHover} />
          </div>
        </div>
      </div>

      {row && <PolicyModal row={row} fires={sky.fires} now={sky.mounted ? sky.now : new Date()} onClose={() => { setOpen(null); fly(null); }} />}
    </div>
  );
}
