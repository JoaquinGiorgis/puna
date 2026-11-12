"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo, useDemoGuard } from "@/components/Shell";
import { ClientPanel, type Filter } from "@/components/cartera/ClientPanel";
import { GlobeView, type ReplayScene, type Row } from "@/components/cartera/GlobeView";
import { ReplayBar } from "@/components/cartera/ReplayBar";
import { Alerts } from "@/components/cartera/Alerts";
import { policyHistory, lot14Kpis } from "@/lib/policy";
import { inSaa, satAt } from "@/lib/sky";
import { SatPanel } from "@/components/cartera/SatPanel";
import { LEVEL_ICON } from "@/components/icons";
import { Globe2, Satellite } from "lucide-react";
import { HOME, PLANET, clampView, proj, satOnMap, satPoint, type View } from "@/lib/globe-noa";
import { PolicyModal } from "@/components/cartera/PolicyModal";
import { SatModal } from "@/components/cartera/SatModal";
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
  const [satOpen, setSatOpen] = useState<string | null>(null);
  const [follow, setFollow] = useState<string | null>(null);
  const [replay, setReplay] = useState<{ step: number; playing: boolean } | null>(null);
  // seguir un satélite: la vista se centra en él en cada tick del reloj (1 s)
  const followed = follow ? sky.sats.find((x) => x.name === follow) : undefined;
  const fp = followed ? satPoint(followed) : null;
  useEffect(() => {
    if (!fp) return;
    if (!followed || !satOnMap(followed)) { setFollow(null); return; }
    setView((v) => clampView({ k: Math.max(v.k, 1.2), x: fp.x, y: fp.y }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fp?.x, fp?.y]);
  const ready = sky.firesAt !== null || sky.firesError !== null;

  const rows: Row[] = useMemo(
    () =>
      CLIENTS.map((c) => ({ c, a: assess(c, sky.fires) }))
        .sort((x, y) => LEVEL_ORDER[x.a.level] - LEVEL_ORDER[y.a.level] || y.a.inField.length - x.a.inField.length || (x.a.nearestKm ?? 1e9) - (y.a.nearestKm ?? 1e9)),
    [sky.fires],
  );

  // ---- reproducción del siniestro del Lote 14 (job real en Fuji)
  const lotRow = rows.find((r) => r.c.onchain);
  const replaySteps = useMemo(() => (lotRow ? policyHistory(lotRow.c, lotRow.a) : []), [lotRow]);
  const scene: ReplayScene | null = useMemo(() => {
    if (!replay || !lotRow) return null;
    const st = replaySteps[replay.step];
    const sc = st?.scene ?? { phase: "fire" as const };
    const [w, so, e, n] = lotRow.c.bbox;
    const lot = { lat: (so + n) / 2, lon: (w + e) / 2, name: lotRow.c.field };
    let sat: ReplayScene["sat"];
    const def = sc.sat ? sky.defs.find((d) => d.name === sc.sat) : undefined;
    if (def) {
      // posición real del satélite durante la ventana del job (TLE actual de CelesTrak, SGP4)
      const min = { calc: 4, result: 6, bad: 8, ok: 8 }[sc.phase as "calc"] ?? 4;
      const g = satAt(def, new Date(new Date(demo.window.start).getTime() + min * 60_000));
      if (g) sat = { name: def.name, node: sc.node ?? "", lat: g.lat, lon: g.lon, altKm: g.altKm, inSaa: inSaa(g.lat, g.lon) };
    }
    return { phase: sc.phase, lot, sat, paid: lot14Kpis().indemnity };
  }, [replay, lotRow, replaySteps, sky.defs]);
  useEffect(() => {
    if (!scene) return;
    // encuadre: lote y satélite dentro del área libre (entre los paneles y arriba de la barra de reproducción)
    const free = { x0: 360, x1: 980, y0: 110, y1: 640 }; // en px de pantalla a 1440×900
    const fx = (free.x0 + free.x1) / 2 - 720, fy = (free.y0 + free.y1) / 2 - 450;
    const L = proj(scene.lot.lat, scene.lot.lon);
    let box = { x0: L.x, x1: L.x, y0: L.y, y1: L.y };
    if (scene.sat) {
      const S = proj(scene.sat.lat, scene.sat.lon, 1 + scene.sat.altKm / 6371);
      if (S.visible) box = { x0: Math.min(L.x, S.x), x1: Math.max(L.x, S.x), y0: Math.min(L.y, S.y), y1: Math.max(L.y, S.y) };
    }
    // sin clampView: en la reproducción se puede salir del render (fondo de espacio) para que entren los dos
    const k = Math.max(0.06, Math.min(1.8, (free.x1 - free.x0 - 160) / Math.max(1, box.x1 - box.x0), (free.y1 - free.y0 - 140) / Math.max(1, box.y1 - box.y0)));
    setView({ k, x: (box.x0 + box.x1) / 2 - fx / k, y: (box.y0 + box.y1) / 2 - fy / k });
  }, [scene]);
  const startReplay = useCallback(() => { setOpen(null); setFollow(null); setSatOpen(null); setReplay({ step: 0, playing: true }); }, []);

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
      <GlobeView rows={rows} fires={sky.fires} sats={sky.sats} defs={sky.defs} now={sky.mounted ? sky.now : new Date(0)} selected={selected} view={view} setView={setView} onSelect={openPolicy} satHover={satHover} passes={sky.passes} onSat={setSatOpen} onUserMove={() => setFollow(null)} follow={follow} replay={scene} />

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
          <Alerts rows={rows} ready={ready} now={sky.mounted ? sky.now : new Date()} onOpen={openPolicy} />
          <button onClick={() => { signOut(); router.push("/ingresar"); }} className="rounded-full border border-white/25 bg-white/[0.07] px-3 py-1.5 text-[12px] hover:bg-white/15">Salir</button>
        </header>

        {followed && (
          <div role="status" className="lg pointer-events-auto flex items-center gap-2 self-start rounded-full py-1.5 pl-3 pr-1.5 text-[12px]">
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-[#3dd6f5]" />
            Siguiendo a <b className="font-semibold">{followed.name}</b> en tiempo real · {followed.speedKms.toLocaleString("es-AR", { maximumFractionDigits: 2 })} km/s
            <button onClick={() => setFollow(null)} className="rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11.5px] hover:bg-white/20">Dejar de seguir</button>
          </div>
        )}
        {replay && replaySteps.length > 0 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center md:left-[352px] md:right-[424px] md:bottom-4">
            <ReplayBar steps={replaySteps} step={replay.step} playing={replay.playing}
              setStep={(n) => setReplay((r) => (r ? { ...r, step: n } : r))} setPlaying={(p) => setReplay((r) => (r ? { ...r, playing: p } : r))}
              onClose={() => { setReplay(null); fly(null); }} />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 md:flex-row md:items-stretch md:justify-between">
          <div className="hidden min-h-0 flex-col justify-end gap-2.5 md:flex">
            <SatPanel sats={sky.sats} passes={sky.passes} fires={sky.fires} now={sky.mounted ? sky.now : new Date(0)} onHover={setSatHover} onOpen={setSatOpen} />
            <section aria-label="Leyenda" className="lg pointer-events-auto w-[320px] shrink-0 rounded-2xl px-3.5 py-2.5 text-[11px]">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {([["atencion", "#c4352b", "#fff", "Atención"], ["vigilancia", "#f5b03d", "#0e1b2c", "Vigilancia"], ["ok", "#34d399", "#0e1b2c", "Al día"]] as const).map(([lv, bg, fg, l]) => {
                  const I = LEVEL_ICON[lv];
                  return (
                    <li key={l} className="flex items-center gap-1.5">
                      <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full" style={{ background: bg, outline: "1.5px solid #fff" }}><I size={10} color={fg} strokeWidth={2.6} /></span>{l}
                    </li>
                  );
                })}
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-[#ff7a1a]" />Fuego · NASA FIRMS</li>
                <li className="flex items-center gap-1.5"><span aria-hidden="true" className="h-3 w-3 rounded-sm border border-dashed border-[#ff5a4e] bg-[#ff5a4e]/25" />Anomalía (radiación)</li>
                <li className="flex items-center gap-1.5"><Satellite aria-hidden="true" size={13} color="#3dd6f5" />Satélite · órbita SGP4</li>
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
                <button onClick={() => { setFollow(null); setView(PLANET); }} aria-label="Ver el planeta completo" title="Ver el planeta completo" className="grid h-10 w-10 place-items-center hover:bg-white/10"><Globe2 size={17} aria-hidden="true" /></button>
              </div>
            </div>
            <ClientPanel rows={rows} ready={ready} now={sky.mounted ? sky.now : new Date()} query={query} setQuery={setQuery}
              filter={filter} setFilter={setFilter} selected={selected} onOpen={openPolicy} onHover={setHover} />
          </div>
        </div>
      </div>

      {satOpen && (() => {
        const st = sky.sats.find((x) => x.name === satOpen);
        return st ? <SatModal sat={st} def={sky.defs.find((d) => d.name === satOpen)} pass={sky.passes[satOpen] ?? null} fires={sky.fires} now={sky.now} onClose={() => setSatOpen(null)}
          onFollow={satOnMap(st) ? () => { setFollow(st.name); setSatOpen(null); } : undefined} /> : null;
      })()}
      {row && <PolicyModal onReplay={row.c.onchain ? startReplay : undefined} row={row} fires={sky.fires} now={sky.mounted ? sky.now : new Date()} onClose={() => { setOpen(null); fly(null); }} />}
    </div>
  );
}
