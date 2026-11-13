import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://puna-mission-control.vercel.app");

const DESCRIPTION =
  "Peritaje satelital para aseguradoras agro: un satélite mide el daño, un validador de otro operador audita la medición y el seguro se paga en Avalanche, con evidencia lista para la SSN.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "PUNA · Peritaje satelital para aseguradoras agro", template: "%s · PUNA" },
  description: DESCRIPTION,
  applicationName: "PUNA",
  keywords: ["seguro paramétrico", "peritaje satelital", "aseguradoras agro", "incendio", "NASA FIRMS", "Avalanche", "Freivalds", "cómputo orbital"],
  authors: [{ name: "Equipo PUNA" }],
  creator: "Equipo PUNA",
  category: "insurance",
  alternates: { canonical: "/" },
  // opengraph-image.jpg, twitter-image.jpg, icon.png, apple-icon.png y favicon.ico viven en app/ (archivos de metadata de Next)
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "PUNA",
    title: "PUNA · Peritaje satelital para aseguradoras agro",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "PUNA · Peritaje satelital para aseguradoras agro",
    description: "Un satélite mide el daño, otro operador lo audita y el seguro se paga en segundos.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { capable: true, title: "PUNA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#cfe9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b2440" },
  ],
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
