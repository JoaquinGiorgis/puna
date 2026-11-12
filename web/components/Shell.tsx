"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { INSURER, type Level } from "@/lib/portfolio";
import { LEVEL_ICON } from "./icons";
import { isSignedIn, signOut } from "@/lib/session";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true" className="text-cyan">
        <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div>
        <p className="text-[15px] font-semibold tracking-[0.2em]">PUNA</p>
        <p className="text-[11px] text-muted">Índices paramétricos verificables</p>
      </div>
    </div>
  );
}

/** Estado de un campo: SIEMPRE ícono + etiqueta. */
const LEVEL: Record<Level, { icon: string; label: string; cls: string }> = {
  atencion: { icon: "!", label: "Atención", cls: "bg-[#c4352b] text-white" },
  siniestro: { icon: "◆", label: "Siniestro on-chain", cls: "bg-[#e3eff7] text-[#0369a1]" },
  vigilancia: { icon: "▲", label: "Vigilancia", cls: "bg-[#fbf1df] text-[#9a6200]" },
  ok: { icon: "✓", label: "Al día", cls: "bg-[#e2f2ea] text-[#0b7d55]" },
};

export function LevelBadge({ level, className = "" }: { level: Level | "cargando"; className?: string }) {
  if (level === "cargando")
    return <span className={`inline-flex items-center gap-1 rounded-full bg-line px-2.5 py-0.5 text-[11.5px] font-medium text-muted ${className}`}><span aria-hidden="true">○</span>Consultando FIRMS…</span>;
  const l = LEVEL[level];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${l.cls} ${className}`}>
      {(() => { const I = LEVEL_ICON[level]; return <I aria-hidden="true" size={12} strokeWidth={2.4} className="shrink-0" />; })()}
      {l.label}
    </span>
  );
}

/** Guarda de la sesión demo: si no pasó por el login, vuelve a /. */
export function useDemoGuard() {
  const router = useRouter();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (isSignedIn()) setOk(true);
    else router.replace("/");
  }, [router]);
  return ok;
}

/** Encabezado de la app de la aseguradora + guarda de la sesión demo. */
export function AppShell({ children, crumbs }: { children: ReactNode; crumbs?: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (isSignedIn()) setOk(true);
    else router.replace("/");
  }, [router]);

  const nav = [
    { href: "/cartera", label: "Cartera" },
    { href: "/mission-control", label: "Auditoría on-chain" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-20 rounded-none border-x-0 border-t-0">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 md:px-6">
          <Link href="/cartera" aria-label="PUNA, ir a la cartera"><Logo /></Link>
          <nav aria-label="Secciones" className="flex gap-1 text-[13px]">
            {nav.map((n) => {
              const active = path === n.href || (n.href === "/cartera" && path.startsWith("/cartera"));
              return (
                <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1 ${active ? "bg-[#0e1b2c] text-white" : "text-muted hover:bg-white/60"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          {crumbs && <div className="text-[13px] text-muted">{crumbs}</div>}
          <div className="ml-auto flex items-center gap-3 text-[12.5px]">
            <span className="hidden rounded-full bg-warn-bg px-2.5 py-0.5 text-[11.5px] text-warn sm:inline"><span aria-hidden="true">▲ </span>Demo · cartera simulada</span>
            <div className="text-right leading-tight">
              <p className="font-medium">{INSURER.name}</p>
              <p className="text-[11px] text-muted">{INSURER.user}</p>
            </div>
            <button onClick={() => { signOut(); router.push("/"); }} className="glass-raised rounded-full px-3 py-1 text-[12px]">Salir</button>
          </div>
        </div>
      </header>
      {ok ? children : <p className="p-8 text-center text-[13px] text-muted">Verificando sesión…</p>}
    </div>
  );
}
