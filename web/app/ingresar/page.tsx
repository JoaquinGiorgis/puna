"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, TriangleAlert } from "lucide-react";
import { SkyBackdrop } from "@/components/landing/SkyBackdrop";
import { INSURER } from "@/lib/portfolio";
import { signIn } from "@/lib/session";

const ring = "transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--act)] focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const field = "rounded-2xl border border-white bg-white/80 px-4 py-3 font-mono text-[15px] text-[var(--ink)] shadow-[inset_0_1px_2px_rgb(11_36_64/0.06)] outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--act)]";

function Mark() {
  return (
    <svg width="30" height="20" viewBox="0 0 34 22" aria-hidden="true">
      <path d="M1 21 L11 5 L17 13 L23 3 L33 21 Z" fill="none" stroke="#0b2440" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="23" cy="3" r="2.6" fill="#ea6a12" />
    </svg>
  );
}

/** Login de DEMOSTRACIÓN de la aseguradora: no valida credenciales, solo abre la cartera. */
export default function Login() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    signIn();
    router.push("/cartera");
  };

  return (
    <div className="sky relative min-h-dvh">
      <SkyBackdrop scene="sky" />

      <header className="sticky top-3 z-30 mx-auto mt-3 w-full max-w-[1240px] px-4">
        <nav aria-label="Principal" className="sky-glass flex items-center gap-4 rounded-full py-2 pl-5 pr-2">
          <Link href="/" className={`flex items-center gap-2.5 rounded-full ${ring}`} aria-label="PUNA, inicio">
            <Mark />
            <span className="text-[15px] font-bold tracking-[0.22em]">PUNA</span>
          </Link>
          <Link href="/" className={`ml-auto flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] hover:bg-white/60 ${ring}`}>
            <ArrowLeft size={15} aria-hidden="true" /> Volver al inicio
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 pb-16 pt-12 md:min-h-[calc(100dvh-88px)] md:px-6 md:pt-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <section className="flex flex-col gap-5">
          <p className="text-[14px] font-bold uppercase tracking-[0.14em] text-[var(--ink)]">Panel de la aseguradora</p>
          <h1 className="max-w-[17ch] text-[40px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[56px]">
            Tu cartera, vigilada desde el espacio
          </h1>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-[var(--ink)]">
            Cuando hay fuego en un campo asegurado, un satélite mide el daño, otro operador lo audita y el contrato en Avalanche
            paga solo si la cuenta cierra.
          </p>
          <ul className="mt-2 flex max-w-[52ch] flex-col gap-2.5 text-[14px]">
            <li className="sky-glass flex items-start gap-2.5 rounded-2xl px-4 py-3">
              <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-[var(--ok)]" aria-hidden="true" />
              <span><b>Real:</b> focos NASA FIRMS y órbitas en vivo, el incendio del Lote 14, la auditoría y los pagos en Fuji.</span>
            </li>
            <li className="sky-glass flex items-start gap-2.5 rounded-2xl px-4 py-3">
              <TriangleAlert size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-[#9a6200]" aria-hidden="true" />
              <span><b>Simulado:</b> la aseguradora, los productores y sus pólizas, salvo el Lote 14.</span>
            </li>
          </ul>
        </section>

        <section aria-labelledby="ingresar" className="relative">
          <img decoding="async" src="/landing/obj-shield.webp" alt="" aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-14 z-10 hidden w-[120px] drop-shadow-[0_24px_24px_rgb(11_36_64/0.28)] sm:block" />
          <div className="sky-glass rounded-[36px] p-7 md:p-10">
            <h2 id="ingresar" className="text-[28px] font-bold leading-tight tracking-[-0.03em]">Ingresar</h2>
            <p className="mt-1.5 text-[14px] text-[var(--ink-2)]">Siniestros · {INSURER.name}</p>

            <form onSubmit={submit} className="mt-7 flex flex-col gap-5">
              <label className="flex flex-col gap-2 text-[14px]">
                <span className="font-bold">Correo</span>
                <input type="email" name="email" defaultValue={INSURER.email} autoComplete="off" className={field} />
              </label>
              <label className="flex flex-col gap-2 text-[14px]">
                <span className="font-bold">Contraseña</span>
                <input type="password" name="password" defaultValue="demo-puna" autoComplete="off" className={field} />
              </label>
              <button type="submit" disabled={busy}
                className={`mt-2 flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-[15px] font-bold text-white hover:bg-[#13365e] disabled:opacity-70 ${ring}`}>
                {busy ? "Entrando…" : <>Entrar a la cartera <ArrowRight size={16} aria-hidden="true" /></>}
              </button>
            </form>

            <p className="mt-5 flex gap-2 rounded-2xl bg-[#fbf1df] px-4 py-3 text-[13px] leading-snug text-[#7a4d00]">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>Acceso de demostración: los datos ya están cargados y no se validan. No escribas una contraseña real.</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
