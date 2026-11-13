import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar a la demo",
  description: "Entrá a la cartera de demo de PUNA con el incendio real del Lote 14 en Anta, Salta.",
  alternates: { canonical: "/ingresar" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
