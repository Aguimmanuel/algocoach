import { useEffect, useState } from "react";
import {
  checkHealth,
  getCoaching,
  type CoachPlan,
  type Health,
} from "../lib/api";
import type { Analysis } from "../lib/analyze";
import { PATTERN_MAP } from "../data/patterns";
import { cn } from "@/lib/utils";

interface Props {
  /** the exact text that was analyzed */
  problem: string;
  analysis: Analysis | null;
  onOpenPattern: (id: string) => void;
}

const CONFIDENCE: Record<string, { label: string; className: string }> = {
  high: {
    label: "Strong match",
    className: "bg-primary text-primary-foreground",
  },
  medium: { label: "Likely match", className: "bg-border text-foreground" },
  low: { label: "Rough guess", className: "bg-muted text-muted-foreground" },
};

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface rounded-xl p-6", className)}>{children}</div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      <span aria-hidden>{icon}</span>
      {children}
    </h4>
  );
}

/** Skeleton shown while the coach is thinking — keeps the layout from jumping. */
function LoadingPlan() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-border" />
      <div className="h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-border" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-border" />
              <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AICoach({ problem, analysis, onOpenPattern }: Props) {
  // undefined = still checking, null = backend unreachable
  const [health, setHealth] = useState<Health | null | undefined>(undefined);
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    checkHealth().then((h) => alive && setHealth(h));
    return () => {
      alive = false;
    };
  }, []);

  const run = () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    getCoaching(problem, analysis)
      .then((r) => setPlan(r.plan))
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "The coach could not be reached.",
        ),
      )
      .finally(() => setLoading(false));
  };

  // One click from "Coach me" to a plan — no second button to find.
  useEffect(() => {
    if (health) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health]);

  // Still checking, or the backend isn't running → render nothing at all.
  // The rest of AlgoCoach works exactly as it always did; that's the point of
  // being offline-first, and it keeps this feature from ever breaking the app.
  if (!health) return null;

  const conf = plan
    ? (CONFIDENCE[plan.pattern.confidence] ?? CONFIDENCE.low)
    : null;

  return (
    <Card className="border-border bg-gradient-to-b from-card to-background/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            🧠 Your thinking plan
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            How to approach <em>this</em> problem — the reasoning, not the
            answer.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-40"
        >
          {loading ? "Building plan…" : "↻ Refresh plan"}
        </button>
      </div>

      {error && (
        /* The one place colour is allowed in AlgoCoach: something went wrong. */
        <div className="mt-5 rounded-lg bg-destructive/10 p-4 text-sm text-destructive ring-1 ring-destructive/30">
          <p className="font-semibold">The coach hit a problem.</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={run}
            className="mt-3 rounded-full bg-destructive px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-destructive"
          >
            Try again
          </button>
        </div>
      )}

      {loading && !plan && (
        <div className="mt-6">
          <LoadingPlan />
        </div>
      )}

      {plan && (
        <div className="mt-6 space-y-7">
          {/* Restatement */}
          <div>
            <SectionTitle icon="🗣️">In plain English</SectionTitle>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              {plan.summary}
            </p>
          </div>

          {/* Pattern verdict + why */}
          <div className="rounded-lg bg-card p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="🎯">Best fit</SectionTitle>
              {conf && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-bold",
                    conf.className,
                  )}
                >
                  {conf.label}
                </span>
              )}
            </div>

            {plan.pattern.id && PATTERN_MAP[plan.pattern.id] ? (
              <button
                onClick={() => onOpenPattern(plan.pattern.id)}
                className="mt-2 text-lg font-bold text-foreground underline decoration-border decoration-2 underline-offset-4 hover:decoration-primary"
              >
                {PATTERN_MAP[plan.pattern.id].emoji} {plan.pattern.name} →
              </button>
            ) : (
              <p className="mt-2 text-lg font-bold text-foreground">
                {plan.pattern.name}
              </p>
            )}

            <p className="mt-2 leading-relaxed text-muted-foreground">
              {plan.pattern.why}
            </p>

            {plan.alternatives && plan.alternatives.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-muted-foreground hover:text-muted-foreground">
                  Also considered ({plan.alternatives.length})
                </summary>
                <ul className="mt-2 space-y-2">
                  {plan.alternatives.map((a) => (
                    <li
                      key={a.id || a.name}
                      className="rounded-xl bg-muted p-3"
                    >
                      <span className="font-semibold text-muted-foreground">
                        {a.name}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {a.why_not}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* The heart of it */}
          <div>
            <SectionTitle icon="🪜">How to think about it</SectionTitle>
            <ol className="mt-3 space-y-3">
              {plan.thinking_steps.map((s, i) => (
                <li
                  key={s.title + i}
                  className="flex gap-3 rounded-lg bg-card p-4 ring-1 ring-border"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <div>
                    {/* The offline coach emits titleless steps, so render those
                        as plain items instead of a heading with no body. */}
                    {s.title && (
                      <p className="font-semibold text-foreground">{s.title}</p>
                    )}
                    <p
                      className={cn(
                        "leading-relaxed",
                        s.title
                          ? "mt-0.5 text-muted-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {s.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Socratic questions + traps */}
          <div className="grid gap-6 lg:grid-cols-2">
            {plan.questions.length > 0 && (
              <div>
                <SectionTitle icon="🤔">Ask yourself</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {plan.questions.map((q) => (
                    <li
                      key={q}
                      className="flex gap-2 rounded-xl bg-muted p-3 text-muted-foreground"
                    >
                      <span className="text-muted-foreground">?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {plan.traps.length > 0 && (
              <div>
                <SectionTitle icon="⚠️">Where people slip</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {plan.traps.map((t) => (
                    <li
                      key={t}
                      className="flex gap-2 rounded-xl bg-muted p-3 text-muted-foreground"
                    >
                      <span className="text-muted-foreground">▲</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Complexity + prereqs */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
              ⏱ {plan.complexity.time}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground">
              💾 {plan.complexity.space}
            </span>
            {plan.prereqs?.map((id) =>
              PATTERN_MAP[id] ? (
                <button
                  key={id}
                  onClick={() => onOpenPattern(id)}
                  className="rounded-full bg-muted px-3 py-1 font-medium text-foreground ring-1 ring-border transition hover:bg-muted"
                >
                  🪜 Learn first: {PATTERN_MAP[id].name}
                </button>
              ) : null,
            )}
          </div>

          <div className="border-t border-dashed border-border pt-6">
            <SectionTitle icon="🧩">Practice this idea</SectionTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a worked example, then practice the steps yourself.
            </p>
            {plan.pattern.id && PATTERN_MAP[plan.pattern.id] && (
              <button
                onClick={() => onOpenPattern(plan.pattern.id)}
                className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Open {plan.pattern.name} lesson →
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
