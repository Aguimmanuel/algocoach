import { useEffect, useState } from "react";
import {
  checkHealth,
  getCoaching,
  getSolution,
  type CoachPlan,
  type Health,
  type SolutionResult,
} from "../lib/api";
import type { Analysis } from "../lib/analyze";
import { PATTERN_MAP } from "../data/patterns";
import { cn } from "../utils/cn";

interface Props {
  /** the exact text that was analyzed */
  problem: string;
  analysis: Analysis | null;
  onOpenPattern: (id: string) => void;
}

const LANGUAGES = ["Python", "JavaScript", "Java", "C++"];
const MIN_ATTEMPT = 40;

const CONFIDENCE: Record<string, { label: string; className: string }> = {
  high: { label: "Strong match", className: "bg-slate-900 text-white" },
  medium: { label: "Likely match", className: "bg-slate-200 text-slate-800" },
  low: { label: "Rough guess", className: "bg-slate-100 text-slate-600" },
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7", className)}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
      <span aria-hidden>{icon}</span>
      {children}
    </h4>
  );
}

/** Skeleton shown while the coach is thinking — keeps the layout from jumping. */
function LoadingPlan() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
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

  const [attempt, setAttempt] = useState("");
  const [language, setLanguage] = useState("Python");
  const [solution, setSolution] = useState<SolutionResult | null>(null);
  const [solLoading, setSolLoading] = useState(false);
  const [solError, setSolError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    setSolution(null);
    setSolError(null);
    getCoaching(problem, analysis)
      .then((r) => setPlan(r.plan))
      .catch((e) => setError(e instanceof Error ? e.message : "The coach could not be reached."))
      .finally(() => setLoading(false));
  };

  // One click from "Coach me" to a plan — no second button to find.
  useEffect(() => {
    if (health) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [health]);

  const reveal = () => {
    setSolLoading(true);
    setSolError(null);
    getSolution(problem, analysis, attempt, language)
      .then(setSolution)
      .catch((e) => setSolError(e instanceof Error ? e.message : "Could not fetch the solution."))
      .finally(() => setSolLoading(false));
  };

  const copyCode = () => {
    if (!solution?.code) return;
    navigator.clipboard?.writeText(solution.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // Still checking, or the backend isn't running → render nothing at all.
  // The rest of AlgoCoach works exactly as it always did; that's the point of
  // being offline-first, and it keeps this feature from ever breaking the app.
  if (!health) return null;

  const conf = plan ? CONFIDENCE[plan.pattern.confidence] ?? CONFIDENCE.low : null;
  const attemptLeft = Math.max(0, MIN_ATTEMPT - attempt.trim().length);

  return (
    <Card className="border-slate-200 bg-gradient-to-b from-white to-slate-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            🧠 Your thinking plan
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                health.mode === "gemini" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600",
              )}
            >
              {health.mode === "gemini" ? "AI" : "Offline"}
            </span>
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            How to approach <em>this</em> problem — the reasoning, not the answer.
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-40"
        >
          {loading ? "Thinking…" : "↻ Regenerate"}
        </button>
      </div>

      {health.mode === "demo" && (
        <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-800 ring-1 ring-slate-100">
          {health.message}
        </p>
      )}

      {error && (
        /* The one place colour is allowed in AlgoCoach: something went wrong. */
        <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-100">
          <p className="font-semibold">The coach hit a problem.</p>
          <p className="mt-1">{error}</p>
          <button onClick={run} className="mt-3 rounded-full bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
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
            <p className="mt-2 leading-relaxed text-slate-700">{plan.summary}</p>
          </div>

          {/* Pattern verdict + why */}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="🎯">Best fit</SectionTitle>
              {conf && (
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", conf.className)}>{conf.label}</span>
              )}
            </div>

            {plan.pattern.id && PATTERN_MAP[plan.pattern.id] ? (
              <button
                onClick={() => onOpenPattern(plan.pattern.id)}
                className="mt-2 text-lg font-bold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-4 hover:decoration-slate-900"
              >
                {PATTERN_MAP[plan.pattern.id].emoji} {plan.pattern.name} →
              </button>
            ) : (
              <p className="mt-2 text-lg font-bold text-slate-800">{plan.pattern.name}</p>
            )}

            <p className="mt-2 leading-relaxed text-slate-700">{plan.pattern.why}</p>

            {plan.alternatives && plan.alternatives.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium text-slate-500 hover:text-slate-700">
                  Also considered ({plan.alternatives.length})
                </summary>
                <ul className="mt-2 space-y-2">
                  {plan.alternatives.map((a) => (
                    <li key={a.id || a.name} className="rounded-xl bg-slate-50 p-3">
                      <span className="font-semibold text-slate-700">{a.name}</span>
                      <span className="text-slate-600"> — {a.why_not}</span>
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
                <li key={s.title + i} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    {/* The offline coach emits titleless steps, so render those
                        as plain items instead of a heading with no body. */}
                    {s.title && <p className="font-semibold text-slate-900">{s.title}</p>}
                    <p className={cn("leading-relaxed", s.title ? "mt-0.5 text-slate-600" : "text-slate-700")}>
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
                    <li key={q} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-slate-700">
                      <span className="text-slate-400">?</span>
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
                    <li key={t} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-slate-700">
                      <span className="text-slate-600">▲</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Complexity + prereqs */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">⏱ {plan.complexity.time}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">💾 {plan.complexity.space}</span>
            {plan.prereqs?.map((id) =>
              PATTERN_MAP[id] ? (
                <button
                  key={id}
                  onClick={() => onOpenPattern(id)}
                  className="rounded-full bg-slate-50 px-3 py-1 font-medium text-slate-800 ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  🪜 Learn first: {PATTERN_MAP[id].name}
                </button>
              ) : null,
            )}
          </div>

          {plan.demo_note && <p className="text-xs text-slate-400">{plan.demo_note}</p>}

          {/* ------------------------------------------------ staged reveal */}
          <div className="border-t border-dashed border-slate-300 pt-6">
            {!solution?.available && (
              <>
                <SectionTitle icon="🔒">Stuck anyway? Show me the solution</SectionTitle>
                <p className="mt-2 text-sm text-slate-600">
                  The solution unlocks after you write what you've tried. It doesn't need to be right — writing it
                  down is what makes the answer stick.
                </p>

                <textarea
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  rows={4}
                  placeholder={"What's your plan? Which steps feel shaky?\ne.g. \"I think I slide a window but I don't know what to remove when it grows…\""}
                  className="mt-3 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={reveal}
                    disabled={attemptLeft > 0 || solLoading}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {solLoading ? "Writing…" : "Unlock the solution →"}
                  </button>

                  <span className={cn("text-xs", attemptLeft > 0 ? "text-slate-400" : "text-slate-900")}>
                    {attemptLeft > 0 ? `${attemptLeft} more characters of your own thinking` : "✓ Enough to learn from"}
                  </span>
                </div>

                {solError && (
                  <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-100">{solError}</p>
                )}
              </>
            )}

            {solution && !solution.available && (
              <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-800 ring-1 ring-slate-100">
                {solution.message}
              </p>
            )}

            {solution?.available && (
              <div className="space-y-6">
                <div>
                  <SectionTitle icon="🧭">The strategy</SectionTitle>
                  <p className="mt-2 leading-relaxed text-slate-700">{solution.approach}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <SectionTitle icon="💻">Reference solution ({solution.language})</SectionTitle>
                    <button
                      onClick={copyCode}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {copied ? "Copied ✓" : "Copy"}
                    </button>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-slate-200">
                    {solution.code}
                  </pre>
                </div>

                {solution.walkthrough && solution.walkthrough.length > 0 && (
                  <div>
                    <SectionTitle icon="📝">Why each move</SectionTitle>
                    <ul className="mt-3 space-y-2">
                      {solution.walkthrough.map((w, i) => (
                        <li key={i} className="rounded-xl bg-slate-50 p-3">
                          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200">
                            {w.line}
                          </code>
                          <p className="mt-1.5 text-sm text-slate-600">{w.explain}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {solution.complexity && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      ⏱ {solution.complexity.time}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      💾 {solution.complexity.space}
                    </span>
                  </div>
                )}
                {solution.complexity?.why && <p className="text-sm text-slate-600">{solution.complexity.why}</p>}

                {solution.compare_note && (
                  <div className="rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200">
                    <SectionTitle icon="🔍">Now check your own attempt</SectionTitle>
                    <p className="mt-2 leading-relaxed text-slate-700">{solution.compare_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
