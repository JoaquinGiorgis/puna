import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PUNA · Peritaje satelital para aseguradoras agro",
    short_name: "PUNA",
    description: "Un satélite mide el daño, otro operador audita la medición y el seguro se paga en Avalanche.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eaf6fd",
    theme_color: "#cfe9fb",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
