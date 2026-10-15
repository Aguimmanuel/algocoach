/**
 * Quiz questions, generated from the pattern library rather than written by hand.
 *
 * The three sites worth copying all do the same thing: short, frequent
 * retrieval practice. Duolingo makes it a daily habit; Execute Program calls it
 * "remember it" and re-tests you later; Brilliant adapts to what you missed.
 *
 * Writing hundreds of questions by hand would take days and rot the moment a
 * pattern changes. Instead every question is built from data the app already
 * has — the signals, the plain description, the tagline — so the quiz cannot
 * drift out of sync with the lessons, and adding a pattern adds questions.
 *
 * Three kinds, from easy to hard:
 *   signal  → read the clues, name the pattern
 *   which   → read the plain description, name the pattern
 *   compare → read a scenario, pick the pattern that fits best
 */

import { PATTERNS, type Pattern } from "./patterns";

export type QuestionKind = "signal" | "which" | "compare";

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** the pattern the answer points to */
  answerId: string;
  /** 4 options, pattern ids */
  options: string[];
  explain: string;
}

/** Deterministic shuffle so a given seed always builds the same question set. */
function shuffle<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    // xorshift-ish: cheap, repeatable, good enough for picking options
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function distractors(
  answer: Pattern,
  pool: Pattern[],
  seed: number,
  count = 3,
): Pattern[] {
  // Prefer patterns at a similar level, so the wrong answers are plausible
  // rather than obviously silly. That is what makes retrieval actually work.
  const sameLevel = pool.filter(
    (p) => p.id !== answer.id && p.level === answer.level,
  );
  const others = pool.filter(
    (p) => p.id !== answer.id && p.level !== answer.level,
  );
  return shuffle(
    [...shuffle(sameLevel, seed), ...shuffle(others, seed + 7)],
    seed + 3,
  ).slice(0, count);
}

function buildQuestion(
  pattern: Pattern,
  kind: QuestionKind,
  pool: Pattern[],
  seed: number,
): Question {
  let prompt: string;
  let explain: string;

  if (kind === "signal") {
    // Show three real signals — the same clues the analyzer looks for.
    const shown = pattern.signals.slice(0, 3);
    prompt = shown.map((s) => `• ${s}`).join("\n");
    explain = `${shown.length} clues, and every one points at ${pattern.name}. ${pattern.plain}`;
  } else if (kind === "which") {
    prompt = pattern.plain;
    explain = pattern.tagline;
  } else {
    // Compare: describe the situation and ask for the best fit.
    prompt = `${pattern.plain}\n\nWhich pattern handles this shape of problem?`;
    explain = `That description is ${pattern.name} in different clothes. ${pattern.idea.split(". ")[0]}.`;
  }

  const wrong = distractors(pattern, pool, seed);
  return {
    id: `${kind}:${pattern.id}`,
    kind,
    prompt,
    answerId: pattern.id,
    options: shuffle([pattern, ...wrong], seed + 11).map((p) => p.id),
    explain,
  };
}

/**
 * Build today's set.
 *
 * Prioritises patterns the learner has already marked as learned (that is the
 * "remember it" half — revisiting what you think you know), then anything they
 * got wrong before, then the rest. `seed` makes it stable for a given day, so
 * refreshing mid-session does not reshuffle under the learner.
 */
export function buildReview(opts: {
  learned: string[];
  solved: string[];
  shaky: string[];
  count?: number;
  seed: number;
}): Question[] {
  const { learned, shaky, count = 5, seed } = opts;
  const pool = PATTERNS;
  if (pool.length < 4) return [];

  const priority = (p: Pattern) => {
    // Lowest sorts first.
    if (shaky.some((s) => s.startsWith(`${p.id}::`))) return 0; // got it wrong before
    if (learned.includes(p.id)) return 1; // revisit what you claimed to know
    return 2; // something new
  };

  const ranked = [...pool].sort(
    (a, b) => priority(a) - priority(b) || a.id.localeCompare(b.id),
  );
  const kinds: QuestionKind[] = ["signal", "which", "compare"];

  return ranked
    .slice(0, count)
    .map((p, i) =>
      buildQuestion(p, kinds[(seed + i) % kinds.length], pool, seed + i * 101),
    );
}

/** Local-day seed: the review is the same all day, and new tomorrow. */
export function todaySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
