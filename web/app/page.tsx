import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "PUNA · Índices paramétricos auditados para aseguradoras",
  description: "Un satélite mide cuánto se quemó del lote, otra empresa rehace la cuenta y el contrato en Avalanche paga solo si coincide.",
};

export default function Home() {
  return <Landing />;
}
