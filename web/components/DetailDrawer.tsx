"use client";

import { useEffect, useRef, useState } from "react";
import type { Demo } from "@/lib/data";
import { int } from "@/lib/format";
import { ago, type Fire, type SatNow, type Zone } from "@/lib/sky";

export type Selection = { kind: "zone"; zone: Zone } | { kind: "sat"; sat: SatNow; fires: Fire[]; pass: Date | null } | null;

const art = (d: Date) =>
  d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
const ymd = (d: Date) => d.toISOString().slice(0, 10);

// Capas de NASA GIBS (sin key). Falso color M11-I2-I1: el fuego activo y las cicatrices de quemado resaltan.
const LAYERS = {
  fuego: { id: "VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1", label: "Falso color (fuego)" },
  real: { id: "VIIRS_NOAA20_CorrectedReflectance_TrueColor", label: "Color real" },
} as const;

/** Productor y póliza de EJEMPLO, deterministas por zona (misma zona → mismo cliente). */
function simulatedClient(z: Zone) {
  const h = [...z.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const names = ["La Esperanza", "San José", "El Algarrobal", "Los Quebrachos", "Santa Rosa", "El Palmar", "La Florida", "Don Ernesto", "El Chañar", "La Aurora"];
  const crops = ["soja", "poroto", "maíz", "caña de azúcar", "pastura"];
  const ha = Math.max(120, Math.round(((Math.max(z.extentKm, 1.5) ** 2) * 100) / 10) * 10);
  return { name: `Establecimiento ${names[h % names.length]}`, crop: crops[(h >> 4) % crops.length], ha, policy: `PUNA-${(h % 9000) + 1000}` };
}

function bySat(fires: Fire[]) {
  const m = new Map<string, number>();
  for (const f of fires) m.set(f.sat, (m.get(f.sat) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function GibsImage({ bbox, fires, now, outline, initialLayer = "fuego" }: {
  bbox: [number, number, number, number]; fires: Fire[]; now: Date; outline?: [number, number, number, number]; initialLayer?: keyof typeof LAYERS;
}) {
  const days = [0, 1, 2, 3].map((d) => ymd(new Date(now.getTime() - d * 86_400_000)));
  // arranca en el día con más focos VIIRS DIURNOS (la imagen es de la pasada de ~13:30 local, 15–20 UTC):
  // si esa pasada vio fuego, el cielo estaba despejado. Si no hay, el día anterior (imagen completa).
  const viirsDay = (d: string) =>
    fires.filter((f) => f.t.slice(0, 10) === d && /NOAA/.test(f.sat) && +f.t.slice(11, 13) >= 15 && +f.t.slice(11, 13) <= 20).length;
  const [day, setDay] = useState(() => {
    const best = [...days].sort((a, b) => viirsDay(b) - viirsDay(a))[0];
    return viirsDay(best) > 0 ? best : days[1];
  });
  const [layer, setLayer] = useState<keyof typeof LAYERS>(initialLayer);
  const [w, s, e, n] = bbox;
  const url =
    `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
    `&LAYERS=${LAYERS[layer].id}&CRS=EPSG:4326&BBOX=${s},${w},${n},${e}&WIDTH=600&HEIGHT=600&FORMAT=image/jpeg&TIME=${day}`;
  const dayFires = fires.filter((f) => f.t.slice(0, 10) === day);
  return (
    <figure>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-white/15 bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={url} src={url} alt={`Imagen satelital real de NOAA-20 VIIRS (${LAYERS[layer].label}) del ${day} sobre la zona`} className="h-full w-full object-cover" />
        <svg viewBox="0 0 1 1" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {outline && (
            <rect x={(outline[0] - w) / (e - w)} y={(n - outline[3]) / (n - s)} width={(outline[2] - outline[0]) / (e - w)} height={(outline[3] - outline[1]) / (n - s)}
              fill="none" stroke="#3dd6f5" strokeWidth="0.006" />
          )}
          {dayFires.map((f, i) => (
            <circle key={i} cx={(f.lon - w) / (e - w)} cy={(n - f.lat) / (n - s)} r="0.008" fill="none" stroke="#ffe066" strokeWidth="0.004" />
          ))}
        </svg>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {days.map((d) => (
          <button key={d} onClick={() => setDay(d)} aria-pressed={day === d}
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${day === d ? "bg-white/90 text-[#0e1b2c]" : "bg-white/10 text-[#c9d4e4]"}`}>
            {d.slice(8)}/{d.slice(5, 7)}
          </button>
        ))}
        <span className="mx-1 text-white/30" aria-hidden="true">|</span>
        {(Object.keys(LAYERS) as (keyof typeof LAYERS)[]).map((k) => (
          <button key={k} onClick={() => setLayer(k)} aria-pressed={layer === k}
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${layer === k ? "bg-white/90 text-[#0e1b2c]" : "bg-white/10 text-[#c9d4e4]"}`}>
            {LAYERS[k].label}
          </button>
        ))}
      </div>
      <figcaption className="mt-1 font-mono text-[11px] text-muted">
        Imagen real NASA GIBS · NOAA-20 VIIRS · {day} · <span className="text-[#ffe066]">○</span> {dayFires.length} focos FIRMS de ese día. Las nubes pueden tapar la zona: probá otro día.
      </figcaption>
    </figure>
  );
}

export function DetailDrawer({ sel, demo, now, onClose }: { sel: Selection; demo: Demo; now: Date; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sel) return;
    ref.current?.focus();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [sel, onClose]);
  if (!sel) return null;

  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby="detalle-titulo"
      className="glass-dark absolute inset-y-3 right-3 z-10 flex w-[min(380px,calc(100%-1.5rem))] flex-col overflow-y-auto rounded-2xl p-4 outline-none">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 id="detalle-titulo" className="text-[15px] font-semibold">
          {sel.kind === "zone" ? (sel.zone.inLot ? "Lote 14 · Anta, Salta" : `Zona con fuego · ${sel.zone.near}`) : `${sel.sat.name} · NORAD ${sel.sat.norad}`}
        </h3>
        <button onClick={onClose} className="rounded-full bg-white/10 px-2 py-0.5 text-[12px]" aria-label="Cerrar detalle">✕</button>
      </div>

      {sel.kind === "zone" ? <ZoneBody zone={sel.zone} demo={demo} now={now} /> : <SatBody sel={sel} now={now} />}
    </div>
  );
}

function ZoneBody({ zone: z, demo, now }: { zone: Zone; demo: Demo; now: Date }) {
  const c = simulatedClient(z);
  const pad = Math.max(0.12, (z.bbox[2] - z.bbox[0]) * 0.6, (z.bbox[3] - z.bbox[1]) * 0.6);
  const box: [number, number, number, number] = [z.lon - pad, z.lat - pad, z.lon + pad, z.lat + pad];
  const worldview = `https://worldview.earthdata.nasa.gov/?v=${box.join(",")}&l=VIIRS_NOAA20_CorrectedReflectance_BandsM11-I2-I1,VIIRS_NOAA20_Thermal_Anomalies_375m_All&t=${ymd(new Date(now.getTime() - 86_400_000))}`;
  const firms = `https://firms.modaps.eosdis.nasa.gov/map/#d:48hrs;@${z.lon.toFixed(3)},${z.lat.toFixed(3)},11.0z`;
  return (
    <>
      <GibsImage bbox={box} fires={z.fires} now={now} />

      <h4 className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ok">✓ Datos reales · NASA FIRMS</h4>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px]">
        <dt className="text-muted">Detecciones</dt><dd>{int(z.count)} en 48 h</dd>
        <dt className="text-muted">Por satélite</dt><dd>{bySat(z.fires).map(([s, k]) => `${s} ${k}`).join(" · ")}</dd>
        <dt className="text-muted">Primera</dt><dd>{art(z.first)} (ART)</dd>
        <dt className="text-muted">Última</dt><dd>{art(z.last)} · {ago(z.last, now)}</dd>
        <dt className="text-muted">Potencia máx.</dt><dd>{z.maxFrp.toLocaleString("es-AR", { maximumFractionDigits: 1 })} MW (FRP)</dd>
        <dt className="text-muted">Extensión</dt><dd>~{z.extentKm.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km</dd>
        <dt className="text-muted">Centro</dt><dd>{z.lat.toFixed(3)}°, {z.lon.toFixed(3)}°</dd>
      </dl>
      <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[11.5px]">
        <a className="ext text-cyan" href={worldview} target="_blank" rel="noreferrer">NASA Worldview ↗</a>
        <a className="ext text-cyan" href={firms} target="_blank" rel="noreferrer">Mapa FIRMS ↗</a>
      </p>

      <h4 className="mt-3 font-mono text-[11px] uppercase tracking-wider text-warn">▲ Cliente {z.inLot ? "de la demo" : "simulado"}</h4>
      {z.inLot ? (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px]">
          <dt className="text-muted">Póliza</dt><dd>Lote 14 · job {demo.job.id} on-chain</dd>
          <dt className="text-muted">Estado</dt><dd>{demo.job.state} · índice {(demo.job.indexBps / 100).toLocaleString("es-AR")} %</dd>
          <dt className="text-muted">Disparador</dt><dd>≥ {(demo.job.triggerBps / 100).toLocaleString("es-AR")} %</dd>
          <dt className="text-muted">Productor</dt><dd>simulado (wallet de testnet)</dd>
        </dl>
      ) : (
        <>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px]">
            <dt className="text-muted">Productor</dt><dd>{c.name}</dd>
            <dt className="text-muted">Cultivo</dt><dd>{c.crop} · ~{int(c.ha)} ha</dd>
            <dt className="text-muted">Póliza</dt><dd>{c.policy} · disparador ≥ 30 %</dd>
            <dt className="text-muted">Acción PUNA</dt><dd className="text-warn">▲ fuego detectado: evaluar índice</dd>
          </dl>
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Productor y póliza inventados para mostrar cómo se vería cada cliente. El incendio y los datos de arriba son reales. El job on-chain de la demo es el del Lote 14.
          </p>
        </>
      )}
    </>
  );
}

function SatBody({ sel, now }: { sel: Extract<Selection, { kind: "sat" }>; now: Date }) {
  const { sat: x, fires, pass } = sel;
  const instrument: Record<string, string> = { "NOAA-20": "VIIRS (375 m)", "NOAA-21": "VIIRS (375 m)", Terra: "MODIS (1 km)", Aqua: "MODIS (1 km)", "GOES-19": "ABI (~2 km, cada 10 min)" };
  const last = fires.length ? new Date(Math.max(...fires.map((f) => Date.parse(f.t)))) : null;
  return (
    <>
      <h4 className="font-mono text-[11px] uppercase tracking-wider text-ok">✓ Posición real ahora · SGP4 sobre TLE de CelesTrak</h4>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px]">
        <dt className="text-muted">Tipo</dt><dd>{x.kind === "geo" ? "geoestacionario" : "órbita polar heliosincrónica"}</dd>
        <dt className="text-muted">Sensor</dt><dd>{instrument[x.name] ?? "—"}</dd>
        <dt className="text-muted">Posición</dt><dd>{x.lat.toFixed(2)}°, {x.lon.toFixed(2)}°</dd>
        <dt className="text-muted">Altura</dt><dd>{int(Math.round(x.altKm))} km</dd>
        <dt className="text-muted">Velocidad</dt><dd>{x.speedKms.toLocaleString("es-AR", { maximumFractionDigits: 2 })} km/s</dd>
        <dt className="text-muted">Anomalía</dt><dd className={x.inSaa ? "text-bad" : ""}>{x.kind === "geo" ? "no aplica (35.786 km)" : x.inSaa ? "▲ dentro ahora" : "fuera ahora"}</dd>
        {x.kind === "polar" && <><dt className="text-muted">Sobre el NOA</dt><dd>{x.overNoa ? "▲ pasando ahora" : pass ? `vuelve ${art(pass)} (ART)` : "—"}</dd></>}
      </dl>
      <h4 className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ok">✓ Lo que reportó en el NOA · NASA FIRMS 48 h</h4>
      <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[11.5px]">
        <dt className="text-muted">Focos</dt><dd>{int(fires.length)}</dd>
        <dt className="text-muted">Último</dt><dd>{last ? `${art(last)} · ${ago(last, now)}` : "sin focos en 48 h"}</dd>
      </dl>
      <p className="mt-1.5 font-mono text-[11.5px]">
        <a className="ext text-cyan" href={`https://celestrak.org/satcat/table-satcat.php?CATNR=${x.norad}`} target="_blank" rel="noreferrer">Ficha en CelesTrak ↗</a>
      </p>
      <p className="mt-3 text-[11px] leading-snug text-warn">▲ Simulado: que este satélite calcule el índice de PUNA a bordo. Su órbita y sus detecciones son reales.</p>
    </>
  );
}
