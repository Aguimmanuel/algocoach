export type ColorName =
  | "slate"
  | "indigo"
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "teal"
  | "orange"
  | "fuchsia"
  | "lime"
  | "cyan"
  | "pink"
  | "blue"
  | "red";

export interface ColorSet {
  soft: string;
  text: string;
  ring: string;
  bar: string;
  border: string;
  solid: string;
}

// Full class names are written out so Tailwind can detect them.
export const COLORS: Record<ColorName, ColorSet> = {
  slate: { soft: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", bar: "bg-slate-500", border: "border-slate-300", solid: "bg-slate-600" },
  indigo: { soft: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", bar: "bg-indigo-500", border: "border-indigo-300", solid: "bg-indigo-600" },
  emerald: { soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", bar: "bg-emerald-500", border: "border-emerald-300", solid: "bg-emerald-600" },
  sky: { soft: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", bar: "bg-sky-500", border: "border-sky-300", solid: "bg-sky-600" },
  amber: { soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", bar: "bg-amber-500", border: "border-amber-300", solid: "bg-amber-600" },
  rose: { soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", bar: "bg-rose-500", border: "border-rose-300", solid: "bg-rose-600" },
  violet: { soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200", bar: "bg-violet-500", border: "border-violet-300", solid: "bg-violet-600" },
  teal: { soft: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200", bar: "bg-teal-500", border: "border-teal-300", solid: "bg-teal-600" },
  orange: { soft: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200", bar: "bg-orange-500", border: "border-orange-300", solid: "bg-orange-600" },
  fuchsia: { soft: "bg-fuchsia-50", text: "text-fuchsia-700", ring: "ring-fuchsia-200", bar: "bg-fuchsia-500", border: "border-fuchsia-300", solid: "bg-fuchsia-600" },
  lime: { soft: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-200", bar: "bg-lime-500", border: "border-lime-300", solid: "bg-lime-600" },
  cyan: { soft: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200", bar: "bg-cyan-500", border: "border-cyan-300", solid: "bg-cyan-600" },
  pink: { soft: "bg-pink-50", text: "text-pink-700", ring: "ring-pink-200", bar: "bg-pink-500", border: "border-pink-300", solid: "bg-pink-600" },
  blue: { soft: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", bar: "bg-blue-500", border: "border-blue-300", solid: "bg-blue-600" },
  red: { soft: "bg-red-50", text: "text-red-700", ring: "ring-red-200", bar: "bg-red-500", border: "border-red-300", solid: "bg-red-600" },
};
