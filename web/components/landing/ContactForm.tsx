"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleAlert, LoaderCircle } from "lucide-react";

/**
 * Formulario de contacto del cierre: nombre, email, aseguradora y mensaje opcional.
 * Envía a /api/contact. Los estados (enviando, enviado, error) se comunican con ícono + texto, no solo color.
 */

type State = "idle" | "sending" | "sent" | "error";

const field = "w-full rounded-xl border border-[var(--ink)]/15 bg-white px-3.5 py-2.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-2)]/70 outline-none transition focus:border-[var(--act)] focus:ring-2 focus:ring-[var(--act)]/25";

export function ContactForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "No pudimos enviar el mensaje.");
      setState("sent");
      form.reset();
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "No pudimos enviar el mensaje.");
    }
  }

  if (state === "sent") {
    return (
      <div className="sky-glass sky-glass-strong flex flex-col items-start gap-3 rounded-[28px] p-7 text-[var(--ink)]" role="status">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--ok)]/12 text-[var(--ok)]"><Check size={22} strokeWidth={2.6} aria-hidden="true" /></span>
        <h3 className="text-[22px] font-bold tracking-[-0.02em]">¡Gracias! Recibimos tu mensaje</h3>
        <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">Te escribimos al email que dejaste para coordinar una demo con tu cartera.</p>
        <button type="button" onClick={() => setState("idle")} className="mt-1 text-[14px] font-bold text-[var(--act)] underline underline-offset-2">Enviar otro mensaje</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="sky-glass sky-glass-strong flex flex-col gap-4 rounded-[28px] p-6 text-left text-[var(--ink)] md:p-7" aria-labelledby="contacto-t" noValidate={false}>
      <div className="flex flex-col gap-1">
        <h3 id="contacto-t" className="text-[22px] font-bold tracking-[-0.02em]">Hablemos</h3>
        <p className="text-[14px] text-[var(--ink-2)]">Contanos de tu cartera y te mostramos PUNA con tus lotes.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Nombre
          <input name="name" required autoComplete="name" placeholder="Tu nombre" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-bold">
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="nombre@aseguradora.com" className={field} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Aseguradora
        <input name="company" autoComplete="organization" placeholder="Nombre de la compañía" className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-bold">
        Mensaje <span className="sr-only">(opcional)</span>
        <textarea name="message" rows={3} placeholder="Opcional: hectáreas, cultivos, zona…" className={`${field} resize-none`} />
      </label>
      {/* trampa para bots: los humanos no la ven */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state === "error" && (
        <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#b42318]" role="alert"><CircleAlert size={15} aria-hidden="true" /> {error}</p>
      )}
      <button type="submit" disabled={state === "sending"}
        className="flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-[#13365e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--act)] focus-visible:ring-offset-2 disabled:opacity-70">
        {state === "sending" ? <><LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Enviando…</> : <>Quiero una demo <ArrowRight size={16} aria-hidden="true" /></>}
      </button>
    </form>
  );
}
