import type { Stage } from "@/lib/policy";

const ICON = { done: "✓", retry: "↻", current: "●", todo: "" } as const;
const STATE_TXT = { done: "hecho", retry: "se repitió", current: "en curso", todo: "pendiente" } as const;

/** Las 4 etapas de un siniestro (iguales para toda póliza), con el estado de esta. */
export function Stepper({ stages }: { stages: Stage[] }) {
  return (
    <ol aria-label="Etapas del siniestro" className="lg-tile grid grid-cols-4 rounded-[14px] px-2 py-2.5">
      {stages.map((s, i) => {
        const tone =
          s.state === "done" ? "bg-[#34d399] text-[#04140d] border-[#34d399]"
          : s.state === "retry" ? "bg-[#f5b03d] text-[#1a1200] border-[#f5b03d]"
          : s.state === "current" ? "bg-[#3dd6f5]/20 text-[#7dd3fc] border-[#3dd6f5]"
          : "bg-transparent text-muted border-white/30";
        return (
          <li key={s.label} className="relative flex flex-col items-center gap-1 text-center">
            {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[11px] mr-3 h-0.5 w-[calc(100%-24px)] ${stages[i - 1].state === "todo" || s.state === "todo" ? "bg-white/15" : "bg-white/45"}`} />}
            <span aria-hidden="true" className={`relative grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] font-bold ${tone}`}>{ICON[s.state] || i + 1}</span>
            <span className="text-[12px] font-medium leading-tight">{s.label}</span>
            <span className="text-[10.5px] leading-tight text-muted">
              <span className="sr-only">{STATE_TXT[s.state]}: </span>{s.hint || STATE_TXT[s.state]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
