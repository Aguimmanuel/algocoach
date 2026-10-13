import { LEARNING_PATH } from "../data/basics";
import { PATTERN_MAP, PATTERNS } from "../data/patterns";
import { PRACTICE } from "../data/practice";
import type { AccountUser, StreakInfo, TodayInfo } from "../lib/api";
import AuthPanel from "./AuthPanel";
import DailyReview from "./DailyReview";
import { Badge, Button, Card, Progress } from "./ui";

interface Props {
  learned: string[];
  solved: string[];
  shaky: string[];
  user: AccountUser | null;
  streak: StreakInfo;
  today: TodayInfo;
  busy: boolean;
  error: string | null;
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => void;
  onClearError: () => void;
  onOpenPattern: (id: string) => void;
  onShaky: (key: string) => void;
  onAnswered: (correct: boolean, patternId: string) => void;
}

/**
 * The working surface above the lessons: where you are, what is next, and today's
 * review.
 *
 * Brilliant's best idea is that a learner should never have to decide what to do
 * next — the app tells them, from their own data. So this card answers three
 * questions in order: how am I doing, what should I do right now, and how do I
 * keep this progress.
 */
export default function ProgressHome({
  learned,
  solved,
  shaky,
  user,
  streak,
  today,
  busy,
  error,
  onSignUp,
  onSignIn,
  onSignOut,
  onClearError,
  onOpenPattern,
  onShaky,
  onAnswered,
}: Props) {
  const totalProblems = Object.values(PRACTICE).reduce((n, list) => n + list.length, 0);

  // Next unfinished step in the recommended order — the "what to do next" answer.
  const nextStep = LEARNING_PATH.find((s) => s.patternId && !learned.includes(s.patternId));
  const nextPattern = nextStep?.patternId ? PATTERN_MAP[nextStep.patternId] : null;

  const goalPct = today.goal > 0 ? Math.min(100, (today.count / today.goal) * 100) : 0;
  const hasProgress = learned.length > 0 || solved.length > 0;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------- where you are */}
      <Card>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Streak</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {streak.current > 0 ? `${streak.current}` : "0"}
              <span className="ml-1 text-base font-semibold text-slate-500">
                {streak.current === 1 ? "day" : "days"}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              {streak.current === 0
                ? "Answer one question today to start one."
                : streak.longest > streak.current
                  ? `Your best is ${streak.longest}.`
                  : "Your best run so far."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Today's goal</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {today.count}
              <span className="ml-1 text-base font-semibold text-slate-500">/ {today.goal}</span>
            </p>
            <Progress value={goalPct} className="mt-2.5" />
            <p className="mt-1.5 text-sm text-slate-500">
              {today.met ? "✓ Done for today. Anything more is a bonus." : "Short and daily beats long and rare."}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">All time</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {learned.length}
              <span className="ml-1 text-base font-semibold text-slate-500">/ {PATTERNS.length}</span>
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
              patterns learned · {solved.length}/{totalProblems} problems solved
            </p>
          </div>
        </div>

        {/* -------------------------------------------- what to do next */}
        {nextPattern && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-900 p-4 text-white sm:p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {hasProgress ? "Next up" : "Start here"}
              </p>
              <p className="mt-1 text-lg font-bold">
                {nextPattern.emoji} {nextPattern.name}
              </p>
              <p className="mt-0.5 max-w-xl text-sm text-slate-300">{nextPattern.plain}</p>
            </div>
            <Button
              variant="secondary"
              className="shrink-0 border-white/20 bg-white/10 text-white hover:bg-white/20"
              onClick={() => onOpenPattern(nextPattern.id)}
            >
              Open the lesson →
            </Button>
          </div>
        )}
      </Card>

      {/* ---------------------------------------------- today's review */}
      <DailyReview
        learned={learned}
        solved={solved}
        shaky={shaky}
        onShaky={onShaky}
        onOpenPattern={onOpenPattern}
        onAnswered={onAnswered}
      />

      {/* ---------------------------------------------- keep the progress */}
      {!user && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <Badge tone="muted">Optional</Badge>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <AuthPanel
            user={user}
            busy={busy}
            error={error}
            onSignUp={onSignUp}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onClearError={onClearError}
          />
        </div>
      )}

      {user && (
        <AuthPanel
          user={user}
          busy={busy}
          error={error}
          onSignUp={onSignUp}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onClearError={onClearError}
        />
      )}
    </div>
  );
}
