import { memo } from "react";
import { ArrowRight, ArrowUpRight, Car, Check, Fingerprint, FolderOpen, Hourglass, Link2, Satellite, UserRound, Zap, type LucideIcon } from "lucide-react";
import { demo } from "@/lib/data";
import { RES315_SOURCE } from "@/lib/insured";

/**
 * Cuatro problemas de la aseguradora agro y lo que PUNA resolvió en el siniestro real del Lote 14.
 * Todas las cards siguen la misma plantilla: título, cómo es hoy, un antes → después con íconos y el resultado.
 */

type Side = { icon: LucideIcon; label: string };
type Props = { seconds: number; txs: number; fee: string; indemnity: string };

function Tile({ side, tone }: { side: Side; tone: "bad" | "ok" }) {
  const c = tone === "bad" ? "#b42318" : "#0b7d55";
  const I = side.icon;
  return (
    <div className="flex h-[76px] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 text-center"
      style={{ borderColor: `${c}33`, background: `${c}10` }}>
      <I size={20} strokeWidth={1.9} style={{ color: c }} aria-hidden="true" />
      <span className="text-[11.5px] font-bold leading-tight" style={{ color: c }}>{tone === "bad" ? "✕ " : "✓ "}{side.label}</span>
    </div>
  );
}

/**
 * Cada card es un subgrid de 4 filas (encabezado · hoy · antes→después · resultado), así las filas
 * quedan alineadas entre las cuatro cards aunque un título o un texto ocupe una línea más.
 */
function Card({ n, title, today, before, after, fix, fixTxt, link }: {
  n: number; title: string; today: string; before: Side; after: Side; fix: string; fixTxt: string; link?: { href: string; label: string };
}) {
  return (
    <li className="sky-glass reveal row-span-4 grid grid-rows-subgrid gap-y-4 rounded-[28px] p-6" style={{ transitionDelay: `${n * 90}ms` }}>
      <div className="flex flex-col gap-1.5 self-start">
        <p className="text-[13px] tabular-nums text-[var(--ink-2)]">0{n}</p>
        <h3 className="text-[20px] font-bold leading-tight tracking-[-0.02em] [text-wrap:balance]">{title}</h3>
      </div>
      <p className="text-[14px] leading-snug text-[var(--ink-2)]">
        {today}
        {link && <> <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 whitespace-nowrap text-[var(--act)] underline underline-offset-2">{link.label}<ArrowUpRight size={12} aria-hidden="true" /></a></>}
      </p>
      <div className="flex items-center gap-2 self-center" role="img" aria-label={`Hoy: ${before.label}. Con PUNA: ${after.label}.`}>
        <Tile side={before} tone="bad" />
        <ArrowRight size={14} className="shrink-0 text-[var(--ink-2)]" aria-hidden="true" />
        <Tile side={after} tone="ok" />
      </div>
      <div className="flex flex-col gap-1.5 self-start border-t border-[var(--ink)]/10 pt-4">
        <p className="flex items-center gap-2 whitespace-nowrap text-[30px] font-light tabular-nums leading-none tracking-[-0.03em]">
          <Check size={18} strokeWidth={2.5} className="shrink-0 text-[var(--ok)]" aria-label="Resuelto" />{fix}
        </p>
        <p className="text-[13.5px] leading-snug text-[var(--ink-2)]">{fixTxt}</p>
      </div>
    </li>
  );
}

function PainsBase({ seconds, txs, fee, indemnity, inView }: Props & { inView: boolean }) {
  return (
    <ol data-in={inView} className="relative z-10 grid gap-x-5 gap-y-0 md:grid-cols-2 xl:grid-cols-4 [&>li]:mb-5 xl:[&>li]:mb-0">
      <Card n={1} title="Peritar sin ir al campo"
        today="Cada denuncia necesita un perito que viaje hasta el lote. Son 45.497 siniestros agro por año (SSN 2024)."
        before={{ icon: Car, label: "Viaje al lote" }} after={{ icon: Satellite, label: "Desde el espacio" }}
        fix="0 viajes" fixTxt="para peritar las 1.370 ha del Lote 14." />
      <Card n={2} title="Pagar sin esperar"
        today="La plata sale después de la inspección, el informe y la aprobación. El productor espera semanas."
        before={{ icon: Hourglass, label: "Semanas" }} after={{ icon: Zap, label: "Pago automático" }}
        fix={`${seconds} s`} fixTxt={`para pagar ${indemnity}, que ya estaba reservado en el contrato.`} />
      <Card n={3} title="Datos que nadie puede tocar"
        today="El dato del siniestro lo aporta una de las partes, y después cuesta probar que no se cambió."
        before={{ icon: UserRound, label: "Una de las partes" }} after={{ icon: Fingerprint, label: "Con huella" }}
        fix={`${demo.lot.foci.length} focos`} fixTxt="públicos de la NASA, con su huella guardada antes de calcular." />
      <Card n={4} title="Pruebas para la SSN"
        today="La Res. SSN 315 regula los seguros paramétricos: con el reasegurador, pide índice nombrado, dato con respaldo y acceso al cálculo."
        before={{ icon: FolderOpen, label: "Legajo a mano" }} after={{ icon: Link2, label: "Registro público" }}
        link={{ href: RES315_SOURCE, label: "Ver la Res. SSN 315" }}
        fix={`${txs} comprobantes`} fixTxt={`públicos por siniestro en Avalanche, con costo de red ${fee}.`} />
    </ol>
  );
}

export const Pains = memo(PainsBase);
