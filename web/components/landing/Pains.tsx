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
  const c = tone === "bad" ? "#ff8a80" : "#6ee7b7";
  const I = side.icon;
  return (
    <div className="flex h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 text-center"
      style={{ borderColor: `${c}40`, background: `${c}12` }}>
      <I size={19} strokeWidth={1.9} style={{ color: c }} aria-hidden="true" />
      <span className="whitespace-nowrap text-[10.5px] font-medium leading-tight" style={{ color: c }}>{side.label}</span>
    </div>
  );
}

function Card({ n, title, today, before, after, fix, fixTxt, link }: {
  n: number; title: string; today: string; before: Side; after: Side; fix: string; fixTxt: string; link?: { href: string; label: string };
}) {
  return (
    <li className="lg flex flex-col gap-4 rounded-[24px] p-5">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[11.5px] tabular-nums text-[#9aa9be]">0{n}</p>
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">{title}</h3>
        <p className="min-h-[54px] text-[13px] leading-snug text-[#c9d4e4]">
          {today}
          {link && <> <a href={link.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 whitespace-nowrap text-[#7dd3fc] underline-offset-2 hover:underline">{link.label}<ArrowUpRight size={12} aria-hidden="true" /></a></>}
        </p>
      </div>
      <div className="flex items-center gap-2" role="img" aria-label={`Hoy: ${before.label}. Con PUNA: ${after.label}.`}>
        <Tile side={before} tone="bad" />
        <ArrowRight size={13} className="shrink-0 text-[#9aa9be]" aria-hidden="true" />
        <Tile side={after} tone="ok" />
      </div>
      <div className="mt-auto flex flex-col gap-1">
        <p className="flex items-center gap-1.5 font-mono text-[20px] font-semibold tabular-nums leading-none text-[#6ee7b7]">
          <Check size={15} strokeWidth={3} aria-hidden="true" />{fix}
        </p>
        <p className="min-h-[36px] text-[13px] leading-snug text-[#c9d4e4]">{fixTxt}</p>
      </div>
    </li>
  );
}

export function Pains({ seconds, txs, fee, indemnity }: Props) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        today="La Res. SSN 315 y el reasegurador piden índice nombrado, dato con respaldo y acceso al cálculo."
        before={{ icon: FolderOpen, label: "Legajo a mano" }} after={{ icon: Link2, label: "Registro público" }}
        link={{ href: RES315_SOURCE, label: "Ver la Res. SSN 315" }}
        fix={`${txs} comprobantes`} fixTxt={`públicos por siniestro en Avalanche, con costo de red ${fee}.`} />
    </ol>
  );
}
