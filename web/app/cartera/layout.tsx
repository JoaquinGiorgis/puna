import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cartera de demo",
  description: "Cartera de la aseguradora de demo: campos asegurados con alertas de focos NASA FIRMS en vivo.",
  alternates: { canonical: "/cartera" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
