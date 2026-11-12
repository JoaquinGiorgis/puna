"use client";

import { useEffect, useRef } from "react";

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

/** Lava la parte de arriba y de abajo de la foto con el color del cielo, para que el texto se lea y no haya cortes. */
const WASH = "linear-gradient(180deg, rgb(169 216 245 / 0.92) 0%, rgb(169 216 245 / 0.35) 30%, rgb(169 216 245 / 0) 55%, rgb(214 236 250 / 0.55) 100%)";

export function SkyBackdrop({ scene }: { scene: Scene }) {
  const far = useRef<HTMLDivElement>(null);
  const near = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const apply = () => {
      const y = window.scrollY;
      if (far.current) far.current.style.transform = `translate3d(0, ${-((y * 0.12) % TILE)}px, 0)`;
      if (near.current) near.current.style.transform = `translate3d(0, ${-((y * 0.38) % TILE)}px, 0)`;
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(apply); };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); };
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
        style={{ backgroundImage: "linear-gradient(90deg, rgb(8 61 115 / 0.42), rgb(8 61 115 / 0) 60%), url(/landing/sun-sky.webp)" }} />
      <div ref={far} className="sky-clouds" style={{ height: `calc(100% + ${TILE}px)`, opacity: photo ? 0.25 : sunny ? 0.35 : 0.55 }}>
        <div className="sky-drift" style={{ "--img": "url(/landing/clouds-a.webp)", "--drift": "220s" } as React.CSSProperties} />
      </div>
      <div ref={near} className="sky-clouds" style={{ height: `calc(100% + ${TILE}px)`, opacity: photo ? 0.3 : sunny ? 0.4 : 0.85 }}>
        <div className="sky-drift" style={{ "--img": "url(/landing/clouds-b.webp)", "--drift": "120s", backgroundPosition: "900px 380px" } as React.CSSProperties} />
      </div>
    </div>
  );
}
