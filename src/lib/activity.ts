/**
 * Record that the learner did something today.
 *
 * The streak, the heatmap and the daily goal all read the same list of dates,
 * so anything worth counting — answering a review question, ticking off a
 * solved problem, passing a lesson exercise — calls this. It writes straight to
 * localStorage and fires the event that `useLocalStorage` listens for, rather
 * than going through React state, because the callers live in leaf components
 * that should not have to thread a callback down from App.
 */
export function markActiveToday(): void {
  try {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const days = JSON.parse(localStorage.getItem("algocoach-active-days") ?? "[]") as string[];
    if (days.includes(iso)) return;

    const next = [...days, iso];
    localStorage.setItem("algocoach-active-days", JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("algocoach:algocoach-active-days", { detail: next }));
  } catch {
    /* storage unavailable — the action still happened, it just is not recorded */
  }
}

/** Local date parts, so "today" means the learner's today rather than UTC. */
function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The streak, counted from the days the device actually saw work.
 *
 * The server knows the streak once you are signed in, but a learner who is not
 * signed in — which is a supported way to use the whole app — still deserves a
 * live number rather than a permanent zero. Today not being active yet does not
 * break the streak until the day is over, so we carry it forward from yesterday.
 */
export function localStreak(activeDays: string[]): { current: number; longest: number } {
  const active = new Set(activeDays);
  const day = new Date();
  day.setHours(0, 0, 0, 0);

  let current = 0;
  const cursor = new Date(day);
  if (!active.has(isoOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (active.has(isoOf(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest run, walked oldest-first over the sorted dates.
  const sorted = [...active].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const iso of sorted) {
    const [y, m, d] = iso.split("-").map(Number);
    const cur = new Date(y, (m ?? 1) - 1, d ?? 1);
    if (prev && (cur.getTime() - prev.getTime()) / 86_400_000 === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }

  return { current, longest: Math.max(longest, current) };
}

/**
 * What the learner did today, kept per day so it resets on its own.
 *
 * Both numbers are daily on purpose: the goal ring and the quests are about
 * today, and a total that never resets cannot answer "have I shown up yet?".
 */
export interface TodayLog {
  date: string;
  answered: number;
  sessions: number;
  /** quest ids already paid out today, so XP is awarded exactly once */
  claimed: string[];
}

export const EMPTY_TODAY_LOG: TodayLog = { date: "", answered: 0, sessions: 0, claimed: [] };

/** A log is only "today's" if the date matches; otherwise it is spent. */
export function readToday(log: TodayLog): { answered: number; sessions: number } {
  const now = new Date();
  return log.date === isoOf(now) ? { answered: log.answered, sessions: log.sessions } : { answered: 0, sessions: 0 };
}

export function todayKey(): string {
  return isoOf(new Date());
}
