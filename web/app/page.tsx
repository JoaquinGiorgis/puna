import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "PUNA · Peritaje satelital para aseguradoras agro",
  description: "Ayudamos a las aseguradoras agro a resolver el peritaje de siniestros con auditoría satelital: un satélite mide el daño, otro independiente audita la medición y se liquida en minutos.",
};

export default function Home() {
  return <Landing />;
}
