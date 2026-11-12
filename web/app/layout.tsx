import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUNA · Cartera de seguros",
  description:
    "Seguro paramétrico de incendio: un nodo orbital calcula el índice, un validador independiente lo audita con Freivalds y PunaEscrow paga en Avalanche Fuji.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
