"use client";

import { Aurora, FilmGrain, Shader } from "shaders/react";

/**
 * Fondo animado de la landing (shaders.com, MIT). Corre en WebGPU; sin WebGPU el canvas queda transparente
 * y se ve el degradé del contenedor, así que la página se lee igual.
 */
export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_80%_10%,#0d2a3f_0%,#070b12_55%,#04070c_100%)]">
      <Shader className="h-full w-full opacity-90" disableTelemetry>
        <Aurora colorA="#1d4ed8" colorB="#3dd6f5" colorC="#ff7a1a" intensity={70} speed={3} curtainCount={3} rayDensity={16} />
        <FilmGrain strength={0.18} bias={2} />
      </Shader>
    </div>
  );
}
