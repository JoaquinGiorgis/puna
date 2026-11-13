"use client";

import { useEffect, useRef } from "react";
import { onScrollFrame } from "./scrollFrame";

/**
 * Fondo único de la landing: un cielo fijo que nunca se corta entre secciones.
 * - Dos capas de nubes con parallax (lejana lenta, cercana rápida) y deriva horizontal.
 * - Capas de escena que aparecen con fundido: la condición climática de la card activa y el cielo con sol del cierre.
 * Todo es decorativo (aria-hidden). Con prefers-reduced-motion queda quieto.
 */

export type Scene = "sky" | "wx-fire" | "wx-drought" | "wx-flood" | "wx-frost" | "sun";

const WX: { scene: Scene; src: string }[] = [
  { scene: "wx-fire", src: "/landing/wx-fire.webp" },
  { scene: "wx-drought", src: "/landing/wx-drought.webp" },
  { scene: "wx-flood", src: "/landing/wx-flood.webp" },
  { scene: "wx-frost", src: "/landing/wx-frost.webp" },
];

// clouds-*.webp miden 2400×1018; con background-size 1800px el mosaico mide 1800×763
const TILE = 763;

/** Degradé oscuro sobre cada foto: el texto blanco de "Qué medimos" se lee (AA) con cualquiera de las cuatro. */
const WASH = "linear-gradient(180deg, rgb(4 18 34 / 0.55) 0%, rgb(4 18 34 / 0.1) 30%, rgb(4 18 34 / 0.25) 55%, rgb(4 18 34 / 0.82) 100%), linear-gradient(90deg, rgb(4 18 34 / 0.5) 0%, rgb(4 18 34 / 0) 60%)";

export function SkyBackdrop({ scene }: { scene: Scene }) {
  const far = useRef<HTMLDivElement>(null);
  const near = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    return onScrollFrame(() => {
      const y = window.scrollY;
      if (far.current) far.current.style.transform = `translate3d(0, ${-((y * 0.12) % TILE)}px, 0)`;
      if (near.current) near.current.style.transform = `translate3d(0, ${-((y * 0.38) % TILE)}px, 0)`;
    });
  }, []);

  const photo = scene.startsWith("wx-");
  const sunny = scene === "sun";
  return (
    <div aria-hidden="true" className="sky-base pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {WX.map((w) => (
        <div key={w.scene} className="sky-layer" data-on={scene === w.scene}
          style={{ backgroundImage: `${WASH}, url(${w.src})` }} />
      ))}
      <div className="sky-layer" data-on={scene === "sun"}
        style={{ backgroundImage: "linear-gradient(90deg, rgb(8 52 100 / 0.6), rgb(8 52 100 / 0.25) 45%, rgb(8 61 115 / 0) 70%), url(/landing/sun-sky.webp)" }} />
      <div ref={far} className="sky-clouds" style={{ height: `calc(100% + ${TILE}px)`, opacity: photo ? 0 : sunny ? 0.25 : 0.55 }}>
        <div className="sky-drift" style={{ "--img": "url(/landing/clouds-a.webp)", "--drift": "220s" } as React.CSSProperties} />
      </div>
      <div ref={near} className="sky-clouds" style={{ height: `calc(100% + ${TILE}px)`, opacity: photo ? 0 : sunny ? 0.3 : 0.85 }}>
        <div className="sky-drift" style={{ "--img": "url(/landing/clouds-b.webp)", "--drift": "120s", backgroundPosition: "900px 380px" } as React.CSSProperties} />
      </div>
    </div>
  );
}
