/**
 * Perfil del dispositivo para escalar los efectos 3D y las animaciones de la landing.
 * Se calcula una sola vez en el navegador (advanced-init-once).
 */
export type Device = {
  webgl: boolean;      // si no hay WebGL, se muestran imágenes estáticas en lugar del 3D
  lite: boolean;       // teléfono, poca memoria/CPU o ahorro de datos: menos geometría y sin modelos pesados
  coarse: boolean;     // pantalla táctil: el globo no captura el gesto de scroll
  reduce: boolean;     // prefers-reduced-motion
  saveData: boolean;
};

let cached: Device | null = null;

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function device(): Device {
  if (cached) return cached;
  if (typeof window === "undefined") return { webgl: false, lite: true, coarse: false, reduce: true, saveData: false };
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const saveData = Boolean(nav.connection?.saveData);
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const lite = saveData || window.innerWidth < 768 || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
  cached = { webgl: hasWebGL(), lite, coarse, reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches, saveData };
  return cached;
}
