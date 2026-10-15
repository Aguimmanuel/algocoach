/**
 * A small spaced-repetition scheduler.
 *
 * This is the one mechanic that separates a site you visit from a site that
 * makes you remember things. Execute Program's whole pitch is "remember it" —
 * they re-test you on a schedule rather than letting you re-read and forget.
 *
 * The model here is SM-2 lite. Each pattern you have met gets a card holding:
 *
 *   interval  — days until it is due again
 *   ease      — a multiplier that grows when you get it right, shrinks when not
 *   due       — the date it next needs review
 *   reps      — how many times you have answered it
 *
 * Deliberately simplified from full SM-2: no quality grades 0–5, just correct or
 * not, because asking a beginner to rate their own recall on a six-point scale
 * is a worse experience than it is an algorithm.
 */

export interface Card {
  /** days until the next review */
  interval: number;
  /** SM-2 ease factor, clamped so a bad patch doesn't snowball */
  ease: number;
  /** ISO date (YYYY-MM-DD) this is next due */
  due: string;
  /** consecutive correct answers */
  reps: number;
}

export type Deck = Record<string, Card>;

const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const START_EASE = 2.5;
/**
 * Cap the interval at a year.
 *
 * Without this the interval compounds without limit — 40 correct answers in a
 * row produced 2.8e17 days, which overflows Date and schedules a review for
 * never. A year is also the honest ceiling for a learning tool: if you have not
 * touched a pattern in twelve months you should see it again.
 */
const MAX_INTERVAL = 365;

/**
 * Ease is adjusted in 0.1 steps, which binary floating point cannot represent
 * exactly (2.8 - 0.2 comes out as 2.5999999999999996). Left alone the error
 * accumulates and the stored deck accumulates noise, so round at the boundary.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
/** A brand-new card, and a failed card, both come back tomorrow. */
const FIRST_INTERVAL = 1;

export function today(): string {
  const d = new Date();
  return toISO(d);
}

export function toISO(d: Date): string {
  // Local date, not UTC — "today" should mean the learner's today.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toISO(date);
}

function daysBetween(fromISO: string, toISOStr: string): number {
  const [y1, m1, d1] = fromISO.split("-").map(Number);
  const [y2, m2, d2] = toISOStr.split("-").map(Number);
  const a = new Date(y1, m1 - 1, d1).getTime();
  const b = new Date(y2, m2 - 1, d2).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** A card for a pattern the learner has never been quizzed on. */
export function newCard(): Card {
  return { interval: FIRST_INTERVAL, ease: START_EASE, due: today(), reps: 0 };
}

/**
 * Update a card after an answer.
 *
 * Correct → the interval grows by the ease factor, so a card you know well
 * fades into the distance. Wrong → back to tomorrow, and the ease drops so it
 * stays closer for a while.
 */
export function review(card: Card, correct: boolean): Card {
  const now = today();

  if (!correct) {
    return {
      interval: FIRST_INTERVAL,
      ease: round2(Math.max(MIN_EASE, card.ease - 0.2)),
      due: addDays(now, FIRST_INTERVAL),
      reps: 0,
    };
  }

  const reps = card.reps + 1;
  // First correct answer: 1 day, then 3, then step by the ease factor.
  const raw = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(card.interval * card.ease);
  const interval = Math.min(MAX_INTERVAL, Math.max(1, raw));

  return {
    interval,
    ease: round2(Math.min(MAX_EASE, card.ease + 0.1)),
    due: addDays(now, interval),
    reps,
  };
}

/** Cards whose due date has arrived. */
export function dueCards(deck: Deck, limit = 5): string[] {
  const now = today();
  return Object.entries(deck)
    .filter(([, card]) => daysBetween(card.due, now) >= 0)
    .sort((a, b) => a[1].due.localeCompare(b[1].due)) // most overdue first
    .slice(0, limit)
    .map(([patternId]) => patternId);
}

/** How many reviews are waiting. Used for the badge on the Today card. */
export function dueCount(deck: Deck): number {
  const now = today();
  return Object.values(deck).filter((c) => daysBetween(c.due, now) >= 0).length;
}

/**
 * Pick what to study today: due cards first, then fill the session with
 * patterns the learner has already met, then with something new.
 *
 * The order matters. Reviews before new material is the rule every spaced
 * repetition system converges on — forgetting what you learned is worse than
 * not learning more.
 */
export function buildSession(opts: {
  deck: Deck;
  learned: string[];
  allPatterns: string[];
  size?: number;
}): string[] {
  const { deck, learned, allPatterns, size = 5 } = opts;

  const due = dueCards(deck, size);
  const chosen = new Set(due);

  // Then patterns marked learned that aren't scheduled yet (or not yet due).
  for (const id of learned) {
    if (chosen.size >= size) break;
    if (!chosen.has(id)) chosen.add(id);
  }

  // Then something new, so the deck keeps growing.
  for (const id of allPatterns) {
    if (chosen.size >= size) break;
    if (!chosen.has(id)) chosen.add(id);
  }

  return [...chosen].slice(0, size);
}

/** Longest run of consecutive days present in a set of ISO dates. */
export function longestRun(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const sorted = [...dates].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}
