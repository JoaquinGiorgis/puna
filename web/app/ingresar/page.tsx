"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/Shell";
import { INSURER } from "@/lib/portfolio";
import { signIn } from "@/lib/session";

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
    <main className="mx-auto grid min-h-dvh w-full max-w-[1100px] items-center gap-10 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:px-8">
      <section>
        <Logo />
        <h1 className="mt-8 max-w-[18ch] text-[34px] leading-[1.1] font-semibold tracking-tight md:text-[42px]">
          Seguro paramétrico con un índice que se puede auditar
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Tu cartera de campos, vigilada con focos de NASA FIRMS en vivo. Cuando hay fuego, el índice de área quemada lo calcula un nodo,
          lo audita un validador independiente y el contrato en Avalanche paga solo si la cuenta cierra.
        </p>
        <ul className="mt-6 grid max-w-[52ch] gap-2 text-[13px]">
          <li className="flex gap-2"><span className="text-ok" aria-hidden="true">✓</span> Real: focos FIRMS, imágenes satelitales, contrato y transacciones en Fuji.</li>
          <li className="flex gap-2"><span className="text-warn" aria-hidden="true">▲</span> Simulado: la aseguradora, los productores y sus pólizas (salvo el Lote 14, on-chain).</li>
        </ul>
      </section>

      <section aria-labelledby="ingresar" className="glass rounded-[26px] p-6 md:p-8">
        <h2 id="ingresar" className="text-[19px] font-semibold tracking-tight">Ingresar</h2>
        <p className="mt-1 text-[13px] text-muted">Panel de siniestros · {INSURER.name}</p>

        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-[13px]">
            <span className="font-medium">Correo</span>
            <input type="email" name="email" defaultValue={INSURER.email} autoComplete="off"
              className="glass-raised rounded-xl px-3 py-2.5 font-mono text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-cyan" />
          </label>
          <label className="grid gap-1.5 text-[13px]">
            <span className="font-medium">Contraseña</span>
            <input type="password" name="password" defaultValue="demo-puna" autoComplete="off"
              className="glass-raised rounded-xl px-3 py-2.5 font-mono text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-cyan" />
          </label>
          <button type="submit" disabled={busy}
            className="mt-2 rounded-xl bg-[#0e1b2c] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#1b2d45] disabled:opacity-70">
            {busy ? "Entrando…" : "Entrar a la cartera"}
          </button>
        </form>

        <p className="mt-4 rounded-xl bg-warn-bg px-3 py-2 text-[12px] leading-snug text-warn">
          <span aria-hidden="true">▲ </span>Acceso de demostración: los datos ya están cargados y no se validan. No escribas una contraseña real.
        </p>
      </section>
    </main>
  );
}
