import { useState } from "react";
import { CONSTRAINT_STEPS, LEARNING_PATH, SPEED_TABLE, VERDICT_STYLE } from "../data/basics";
import { GLOSSARY } from "../data/glossary";
import { PATTERN_MAP } from "../data/patterns";
import { cn } from "../utils/cn";

interface Props {
  onOpenPattern: (id: string) => void;
  learned: string[];
  onToggleLearned: (id: string) => void;
}

export default function StartHere({ onOpenPattern, learned, onToggleLearned }: Props) {
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  const nextStep = LEARNING_PATH.findIndex((s) => s.patternId && !learned.includes(s.patternId));
  const done = LEARNING_PATH.filter((s) => s.patternId && learned.includes(s.patternId)).length;
  const total = LEARNING_PATH.filter((s) => s.patternId).length;

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------ what is an algorithm */}
      <section className="rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">New to algorithms?</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          You already think in algorithms.
          <br className="hidden sm:block" /> You just don't have the names yet.
        </h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
          An algorithm is a recipe — a set of steps that turns an input into an output. Finding the largest number in
          a list is an algorithm. So is looking up someone's phone number. You do both without thinking.
        </p>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-300">
          What makes a <em>problem</em> hard is not writing steps that work. It's that some recipes are a million
          times faster than others, and picking the right one is the skill nobody teaches directly.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Same job, two recipes", "Checking every name in a phone book takes 500 steps. Halving takes 9. Same answer."],
            ["2", "The size decides", "Read how big the input can get. That single number rules recipes in or out."],
            ["3", "Every problem is a pattern", "A few hundred interview problems are really about 16 ideas, wearing disguises."],
          ].map(([n, title, detail]) => (
            <div key={n} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                  {n}
                </span>
                {title}
              </div>
              <p className="mt-1.5 text-sm text-slate-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ big-o */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-900">⏱️ What "O(n)" actually means</h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          Big-O is not a score or a grade. It answers one question:{" "}
          <strong className="text-slate-800">if I double the amount of data, how much more work do I do?</strong>{" "}
          Read <strong>n</strong> as "the number of things I have". So O(n) means "work grows in step with the data".
        </p>

        <div className="mt-6 space-y-2.5">
          {SPEED_TABLE.map((row) => {
            const v = VERDICT_STYLE[row.verdict];
            return (
              <div key={row.bigO} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-sm font-bold text-white">
                    {row.bigO}
                  </span>
                  <span className="font-semibold text-slate-900">{row.plainName}</span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", v.className)}>{v.label}</span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Means</p>
                    <p className="mt-0.5 text-sm text-slate-700">{row.meaning}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Picture it as</p>
                    <p className="mt-0.5 text-sm text-slate-700">{row.analogy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Looks like</p>
                    <p className="mt-0.5 text-sm text-slate-700">{row.shape}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------ the constraint trick */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-900">🔑 The trick that makes this click</h2>
        <p className="mt-1 max-w-3xl text-slate-600">
          You don't have to guess which algorithm to use. The problem statement tells you, if you read the size limit.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CONSTRAINT_STEPS.map((s, i) => (
            <div key={s.step} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="font-semibold text-slate-900">{s.step}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{s.detail}</p>
              <p className="mt-2 rounded-xl bg-white p-2.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200">
                {s.example}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-slate-900 p-4 text-slate-100">
          <p className="text-sm font-semibold">Worked example</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
            A problem says <span className="font-mono text-white">1 ≤ n ≤ 10⁵</span>. Two nested loops would be
            10⁵ × 10⁵ = 10¹⁰ steps. At 10⁸ steps per second that's about{" "}
            <strong className="text-white">100 seconds</strong> — far too slow. So the answer cannot use nested loops;
            it needs O(n) or O(n log n). That rules out most patterns instantly and leaves you a shortlist. That's the
            whole game.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------ glossary */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-900">📖 Every word, in plain English</h2>
        <p className="mt-1 text-slate-600">
          Tap any word. Nothing here uses a term that isn't also explained here.
        </p>

        <div className="mt-5 space-y-6">
          {GLOSSARY.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-bold text-slate-900">
                <span aria-hidden>{group.emoji}</span> {group.title}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{group.blurb}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.terms.map((t) => {
                  const open = openTerm === t.term;
                  return (
                    <button
                      key={t.term}
                      onClick={() => setOpenTerm(open ? null : t.term)}
                      className={cn(
                        "rounded-2xl border p-3 text-left transition",
                        open ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900">{t.term}</span>
                        <span className="shrink-0 text-xs text-slate-400">{open ? "−" : "+"}</span>
                      </div>
                      {open && (
                        <div className="mt-2 space-y-1.5">
                          <p className="text-sm text-slate-700">{t.meaning}</p>
                          {t.why && (
                            <p className="rounded-xl bg-white p-2 text-xs text-slate-600 ring-1 ring-slate-200">
                              {t.why}
                            </p>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ learning path */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">🗺️ Your learning path</h2>
            <p className="mt-1 text-slate-600">
              Learn them in this order. Each step only uses ideas from the steps above it.
            </p>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
            {done} of {total} patterns
          </span>
        </div>

        <ol className="mt-6 space-y-3">
          {LEARNING_PATH.map((step, i) => {
            const pattern = step.patternId ? PATTERN_MAP[step.patternId] : null;
            const isDone = step.patternId ? learned.includes(step.patternId) : false;
            const isNext = i === nextStep;

            return (
              <li
                key={step.title}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  isNext ? "border-slate-900 ring-2 ring-slate-900" : "border-slate-200",
                  isDone && "bg-slate-50",
                )}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isDone ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-500",
                    )}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{step.title}</p>
                      {isNext && (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Start here
                        </span>
                      )}
                    </div>

                    <p className="mt-1 leading-relaxed text-slate-600">{step.detail}</p>

                    <p className="mt-2 text-sm text-slate-500">
                      <span className="font-semibold text-slate-600">Ready when:</span> {step.check}
                    </p>

                    {pattern && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => onOpenPattern(step.patternId!)}
                          className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                        >
                          {pattern.emoji} Learn {pattern.name} →
                        </button>
                        <button
                          onClick={() => onToggleLearned(step.patternId!)}
                          className={cn(
                            "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                            isDone
                              ? "border-slate-300 text-slate-600 hover:bg-slate-100"
                              : "border-slate-300 text-slate-600 hover:bg-slate-100",
                          )}
                        >
                          {isDone ? "✓ Learned" : "Mark as learned"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="text-center text-sm text-slate-500">
        Ready to try a real problem? Head to the <strong className="text-slate-700">Coach</strong> tab and paste one in.
      </p>
    </div>
  );
}
