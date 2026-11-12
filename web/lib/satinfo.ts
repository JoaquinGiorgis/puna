/**
 * Ficha de cada satélite de donde sale la información de la cartera.
 * Datos de catálogo (lanzamiento, operador, instrumentos) de NASA/NOAA; lo orbital se calcula del TLE.
 * Imágenes: dominio público (NASA/NOAA) vía Wikimedia Commons, copiadas en public/sats/.
 */
import type { SatDef } from "./sky";

export type SatInfo = {
  name: string; alias: string; operator: string; launched: string; norad: number;
  sensor: string; role: string; instruments: string;
  image: string; imageCredit: string; imageSource: string;
};

export const SAT_INFO: Record<string, SatInfo> = {
  "NOAA-20": {
    name: "NOAA-20", alias: "JPSS-1", operator: "NOAA y NASA", launched: "18/11/2017", norad: 43013,
    sensor: "VIIRS · 375 m",
    role: "Ve los puntos de calor del NOA en cada pasada (de madrugada y a la tarde) con buena resolución. Es una de las fuentes de NASA FIRMS.",
    instruments: "VIIRS, CrIS, ATMS, OMPS, CERES",
    image: "/sats/noaa-20.jpg", imageCredit: "NOAA (dominio público)", imageSource: "https://commons.wikimedia.org/wiki/File:JPSS-1.jpg",
  },
  "NOAA-21": {
    name: "NOAA-21", alias: "JPSS-2", operator: "NOAA y NASA", launched: "10/11/2022", norad: 54234,
    sensor: "VIIRS · 375 m",
    role: "Mismo sensor que NOAA-20, en la misma órbita pero media vuelta adelante: entre los dos ven el NOA con el doble de frecuencia.",
    instruments: "VIIRS, CrIS, ATMS, OMPS",
    image: "/sats/noaa-21.jpg", imageCredit: "NOAA (dominio público)", imageSource: "https://commons.wikimedia.org/wiki/File:Artist%27s_rendering_of_NOAA-21.png",
  },
  Terra: {
    name: "Terra", alias: "EOS AM-1", operator: "NASA", launched: "18/12/1999", norad: 25994,
    sensor: "MODIS · 1 km",
    role: "Pasa por la mañana. Su sensor MODIS es el más antiguo de FIRMS: ve menos detalle, pero suma una pasada más por día.",
    instruments: "MODIS, ASTER, MISR, CERES, MOPITT",
    image: "/sats/terra.jpg", imageCredit: "NASA/JPL (dominio público)", imageSource: "https://commons.wikimedia.org/wiki/File:TERRA_am1.jpg",
  },
  Aqua: {
    name: "Aqua", alias: "EOS PM-1", operator: "NASA", launched: "04/05/2002", norad: 27424,
    sensor: "MODIS · 1 km",
    role: "Pasa por la tarde con MODIS, igual que Terra. Suma otra mirada diaria sobre los campos.",
    instruments: "MODIS, AIRS, AMSU, CERES",
    image: "/sats/aqua.jpg", imageCredit: "NASA (dominio público)", imageSource: "https://commons.wikimedia.org/wiki/File:Aqua_spacecraft_model.png",
  },
  "GOES-19": {
    name: "GOES-19", alias: "GOES-U · GOES-Este", operator: "NOAA y NASA", launched: "25/06/2024", norad: 60133,
    sensor: "ABI · ~2 km, cada 10 min",
    role: "Está fijo sobre América a 35.786 km: no ve tanto detalle, pero mira el NOA todo el tiempo y avisa de un fuego nuevo en minutos.",
    instruments: "ABI, GLM, SUVI, EXIS, SEISS, MAG",
    image: "/sats/goes-19.jpg", imageCredit: "NOAA/Lockheed Martin (dominio público, serie GOES-R)", imageSource: "https://commons.wikimedia.org/wiki/File:GOES-R_Spacecraft_Art_on_Side_Front_Left_(14213075849).png",
  },
};

/** Inclinación, período y fecha del TLE (columnas fijas del formato). */
export function tleOrbit(def: SatDef) {
  const inc = Number(def.line2.slice(8, 16));
  const mm = Number(def.line2.slice(52, 63)); // vueltas por día
  const yy = Number(def.line1.slice(18, 20)), doy = Number(def.line1.slice(20, 32));
  const epoch = new Date(Date.UTC(2000 + yy, 0, 1) + (doy - 1) * 86_400_000);
  return { inclination: inc, periodMin: 1440 / mm, revsPerDay: mm, epoch };
}
