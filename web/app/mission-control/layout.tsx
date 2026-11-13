import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auditoría on-chain",
  description: "El job del Lote 14 en Avalanche Fuji: medición en órbita, auditoría de Freivalds por capa, rechazo de la falla y pago.",
  alternates: { canonical: "/mission-control" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
