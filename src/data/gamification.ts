/**
 * XP, levels and milestones.
 *
 * The point is not points. It is that a learner should be able to see, at a
 * glance, that they are making progress — and have a reason to come back
 * tomorrow. Duolingo's streak and XP are the most effective version of this
 * that exists, so this borrows the shape and drops the manipulative parts:
 * no lives, no loss aversion for its own sake, no "you broke your streak"
 * guilt. Missing a day shows up as a gap, not a reprimand.
 */

export const XP = {
  /** reading a pattern lesson to the end */
  lesson: 10,
  /** marking a pattern as learned */
  learned: 15,
  /** solving a practice problem */
  problem: 20,
  /** each correct review answer */
  correct: 5,
  /** finishing a review session */
  session: 15,
} as const;

export interface Level {
  n: number;
  title: string;
  /** XP needed to reach this level */
  at: number;
}

/** Thresholds grow, but not so fast that the first few levels feel distant. */
export const LEVELS: Level[] = [
  { n: 1, title: "Curious", at: 0 },
  { n: 2, title: "Getting Started", at: 60 },
  { n: 3, title: "Pattern Spotter", at: 160 },
  { n: 4, title: "Problem Breaker", at: 320 },
  { n: 5, title: "Steady Hand", at: 540 },
  { n: 6, title: "Sharp Thinker", at: 820 },
  { n: 7, title: "Pattern Reader", at: 1160 },
  { n: 8, title: "Algorithmist", at: 1580 },
  { n: 9, title: "Problem Solver", at: 2080 },
  { n: 10, title: "Interview Ready", at: 2680 },
];

/** Total XP from everything recorded so far. */
export function computeXP(opts: {
  learned: number;
  solved: number;
  correctAnswers: number;
  sessions: number;
}): number {
  return (
    opts.learned * XP.learned +
    opts.solved * XP.problem +
    opts.correctAnswers * XP.correct +
    opts.sessions * XP.session
  );
}

export interface LevelProgress {
  level: Level;
  next: Level | null;
  /** XP earned inside the current level */
  into: number;
  /** XP the current level spans */
  span: number;
  /** 0–100 */
  pct: number;
  /** XP still needed for the next level */
  remaining: number;
}

export function levelFor(xp: number): LevelProgress {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.at) level = l;
    else break;
  }
  const next = LEVELS.find((l) => l.at > level.at) ?? null;

  if (!next) {
    return {
      level,
      next: null,
      into: xp - level.at,
      span: 1,
      pct: 100,
      remaining: 0,
    };
  }

  const into = xp - level.at;
  const span = next.at - level.at;
  return {
    level,
    next,
    into,
    span,
    pct: Math.min(100, (into / span) * 100),
    remaining: Math.max(0, next.at - xp),
  };
}

export interface Milestone {
  id: string;
  label: string;
  detail: string;
  emoji: string;
  earned: boolean;
}

/** Achievements, computed from state — no separate storage, so they can't drift. */
export function milestones(opts: {
  learned: number;
  solved: number;
  streak: number;
  level: number;
  sessions: number;
}): Milestone[] {
  const { learned, solved, streak, level, sessions } = opts;
  return [
    {
      id: "first",
      label: "First Steps",
      detail: "Mark your first pattern learned",
      emoji: "🌱",
      earned: learned >= 1,
    },
    {
      id: "five",
      label: "Five Down",
      detail: "Learn 5 patterns",
      emoji: "🖐️",
      earned: learned >= 5,
    },
    {
      id: "ten",
      label: "Halfway",
      detail: "Learn 10 patterns",
      emoji: "🧗",
      earned: learned >= 10,
    },
    {
      id: "all",
      label: "Completionist",
      detail: "Learn every pattern",
      emoji: "🏆",
      earned: learned >= 19,
    },
    {
      id: "solve1",
      label: "First Blood",
      detail: "Solve a practice problem",
      emoji: "✅",
      earned: solved >= 1,
    },
    {
      id: "solve10",
      label: "Practitioner",
      detail: "Solve 10 problems",
      emoji: "🔧",
      earned: solved >= 10,
    },
    {
      id: "solve25",
      label: "Grinder",
      detail: "Solve 25 problems",
      emoji: "💪",
      earned: solved >= 25,
    },
    {
      id: "streak3",
      label: "Warming Up",
      detail: "3-day streak",
      emoji: "🔥",
      earned: streak >= 3,
    },
    {
      id: "streak7",
      label: "Week Strong",
      detail: "7-day streak",
      emoji: "⚡",
      earned: streak >= 7,
    },
    {
      id: "streak30",
      label: "Habit Formed",
      detail: "30-day streak",
      emoji: "🌟",
      earned: streak >= 30,
    },
    {
      id: "session1",
      label: "Reviewed",
      detail: "Finish a review session",
      emoji: "🎯",
      earned: sessions >= 1,
    },
    {
      id: "level5",
      label: "Steady Hand",
      detail: "Reach level 5",
      emoji: "🎖️",
      earned: level >= 5,
    },
  ];
}

/* --------------------------------------------------------------- quests */

export interface Quest {
  id: string;
  label: string;
  hint: string;
  /** XP paid the moment it is completed, once per day */
  xp: number;
  progress: number;
  target: number;
  done: boolean;
}

/**
 * Three things to do today, in the order they cost effort.
 *
 * Duolingo's daily quests work because they are finite and legible: you always
 * know what is left and when you are done for the day. These are derived from
 * numbers the app already tracks, so nothing can drift, and the XP is real —
 * it is added to the same total the levels read.
 */
export function dailyQuests(opts: {
  answered: number;
  sessions: number;
  goal: number;
}): Quest[] {
  const goal = Math.max(1, opts.goal);
  const raw = [
    {
      id: "warmup",
      label: "Warm up",
      hint: "Answer one question",
      xp: 5,
      progress: opts.answered,
      target: 1,
    },
    {
      id: "goal",
      label: "Hit today's goal",
      hint: `Answer ${goal} questions`,
      xp: 15,
      progress: opts.answered,
      target: goal,
    },
    {
      id: "review",
      label: "Finish a review",
      hint: "One full session, start to results",
      xp: 20,
      progress: opts.sessions,
      target: 1,
    },
  ];

  return raw.map((q) => {
    const progress = Math.min(q.progress, q.target);
    return { ...q, progress, done: progress >= q.target };
  });
}
