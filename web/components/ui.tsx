import type { ReactNode } from "react";

export type Tone = "neutral" | "warning" | "danger" | "success";

/** Estado SIEMPRE con ícono + etiqueta (nunca solo color). */
const TONE: Record<Tone, { icon: string; cls: string }> = {
  neutral: { icon: "→", cls: "text-cyan bg-cyan-bg" },
  warning: { icon: "▲", cls: "text-warn bg-warn-bg" },
  danger: { icon: "✕", cls: "text-bad bg-bad-bg" },
  success: { icon: "✓", cls: "text-ok bg-ok-bg" },
};

export function StatusTag({ tone, children, className = "" }: { tone: Tone; children: ReactNode; className?: string }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${t.cls} ${className}`}>
      <span aria-hidden="true">{t.icon}</span>
      {children}
    </span>
  );
}

export function Panel({ title, sub, aside, children, className = "", labelledBy }: {
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy: string;
}) {
  return (
    <section aria-labelledby={labelledBy} className={`glass rounded-[22px] p-4 ${className}`}>
      <header className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id={labelledBy} className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {sub && <p className="mt-0.5 font-mono text-[11px] text-muted">{sub}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function ExtLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`ext text-cyan ${className}`}>
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="sr-only"> (abre Snowtrace en otra pestaña)</span>
    </a>
  );
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono ${className}`}>{children}</span>;
}
