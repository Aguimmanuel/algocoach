/**
 * Palette policy: white, black, and red for errors — nothing else.
 *
 * AlgoCoach deliberately ships a single monochrome scale. Hierarchy comes from
 * contrast, weight and spacing rather than hue, and colour is reserved
 * exclusively for errors (see AICoach.tsx, which is the only place red appears).
 *
 * Every pattern still carries a `color` field. That name is kept so lessons
 * stay distinguishable if the design ever wants per-pattern tones again, but
 * for now every name resolves to the same neutral scale.
 */

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
  /** soft background — chips, badges, tinted panels */
  soft: string;
  /** readable text on `soft` */
  text: string;
  /** ring colour used with `soft` */
  ring: string;
  /** solid fill for bars and meters */
  bar: string;
  /** card outline */
  border: string;
  /** solid fill for primary buttons inside a lesson */
  solid: string;
}

// Full class names are written out so Tailwind can detect them.
const MONO: ColorSet = {
  soft: "bg-muted",
  text: "text-foreground",
  ring: "ring-border",
  bar: "bg-primary",
  border: "border-border",
  solid: "bg-primary",
};

export const COLORS: Record<ColorName, ColorSet> = {
  slate: MONO,
  indigo: MONO,
  emerald: MONO,
  sky: MONO,
  amber: MONO,
  rose: MONO,
  violet: MONO,
  teal: MONO,
  orange: MONO,
  fuchsia: MONO,
  lime: MONO,
  cyan: MONO,
  pink: MONO,
  blue: MONO,
  red: MONO,
};
