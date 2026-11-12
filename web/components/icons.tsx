import { CircleCheck, Diamond, Eye, Flame, LayoutGrid, type LucideIcon } from "lucide-react";
import type { Level } from "@/lib/portfolio";

/** Ícono de cada estado de un campo (siempre acompañado de su etiqueta en texto). */
export const LEVEL_ICON: Record<Level, LucideIcon> = { atencion: Flame, vigilancia: Eye, ok: CircleCheck, siniestro: Diamond };
export const ALL_ICON = LayoutGrid;
