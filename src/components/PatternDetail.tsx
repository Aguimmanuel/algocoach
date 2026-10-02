import { useState } from "react";
import { PATTERN_MAP, type Pattern } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "../utils/cn";

interface Props {
  pattern: Pattern;
  learned: boolean;
  onToggleLearned: () => void;
  onOpenPattern?: (id: string) => void;
  /** matched keyword clues from the analyzer */
  clues?: string[];
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        <span aria-hidden>{icon}</span>
        {title}
      </h4>
      {children}
    </section>
  );
}

export default function PatternDetail({ pattern, learned, onToggleLearned, onOpenPattern, clues }: Props) {
  const c = COLORS[pattern.color];
  const [shownHints, setShownHints] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);

  return (
    <article className={cn("rounded-3xl border bg-white p-5 shadow-sm sm:p-7", c.border)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ring-1", c.soft, c.ring)}>
            {pattern.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{pattern.name}</h3>
            <p className="mt-0.5 text-slate-600">{pattern.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className={cn("rounded-full px-2.5 py-1", c.soft, c.text)}>{pattern.level}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">⏱ {pattern.time}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">💾 {pattern.space}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onToggleLearned}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-semibold transition",
            learned ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-900 text-white hover:bg-slate-700",
          )}
        >
          {learned ? "✓ Learned" : "Mark as learned"}
        </button>
      </header>

      {clues && clues.length > 0 && (
        <div className={cn("mt-5 rounded-2xl p-4 text-sm", c.soft)}>
          <p className={cn("font-semibold", c.text)}>Why this showed up</p>
          <p className="mt-1 text-slate-700">
            Your question contains these clue words:{" "}
            {clues.map((w) => (
              <code key={w} className="mx-0.5 rounded bg-white px-1.5 py-0.5 font-mono text-xs text-slate-800 ring-1 ring-slate-200">
                {w}
              </code>
            ))}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="The big idea" icon="💡">
          <p className="leading-relaxed text-slate-700">{pattern.idea}</p>
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm italic text-slate-600">
            Think of it like this: {pattern.analogy}
          </p>
        </Section>

        <Section title="How to spot it" icon="🎯">
          <ul className="space-y-2">
            {pattern.signals.map((s) => (
              <li key={s} className="flex gap-2 text-slate-700">
                <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", c.bar)} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Socratic hints */}
      <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 font-semibold text-slate-800">
            <span aria-hidden>🤔</span> Ask yourself — guided questions
          </h4>
          <span className="text-xs text-slate-500">
            {shownHints}/{pattern.hints.length} revealed
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Try to answer each question about YOUR problem before revealing the next one.
        </p>
        <ol className="mt-4 space-y-3">
          {pattern.hints.slice(0, shownHints).map((h, i) => (
            <li key={h} className="flex gap-3 rounded-xl bg-white p-3 text-slate-700 shadow-sm ring-1 ring-slate-200">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", c.solid)}>
                {i + 1}
              </span>
              <span>{h}</span>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex gap-2">
          {shownHints < pattern.hints.length ? (
            <button
              onClick={() => setShownHints((n) => n + 1)}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90", c.solid)}
            >
              {shownHints === 0 ? "Give me the first question" : "Next question"}
            </button>
          ) : (
            <span className="text-sm font-medium text-emerald-700">That's all the guiding questions. Now write your plan!</span>
          )}
          {shownHints > 0 && (
            <button onClick={() => setShownHints(0)} className="rounded-full px-3 py-2 text-sm text-slate-500 hover:bg-slate-200">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Section title="Step-by-step recipe" icon="📝">
          <ol className="space-y-2">
            {pattern.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-slate-700">
                <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", c.soft, c.text)}>
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Common traps" icon="⚠️">
          <ul className="space-y-2">
            {pattern.pitfalls.map((s) => (
              <li key={s} className="flex gap-2 text-slate-700">
                <span className="text-amber-500">▲</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className="mt-7">
        <button
          onClick={() => setShowSkeleton((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <span>🧰 Generic template (pseudo-code, not a solution)</span>
          <span className="text-slate-400">{showSkeleton ? "Hide" : "Peek"}</span>
        </button>
        {showSkeleton && (
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-emerald-200">
            {pattern.skeleton}
          </pre>
        )}
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Section title="Practice drills" icon="🏋️">
          <div className="flex flex-wrap gap-2">
            {pattern.drills.map((d) => (
              <span key={d} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {d}
              </span>
            ))}
          </div>
        </Section>

        {pattern.prerequisites && pattern.prerequisites.length > 0 && (
          <Section title="Learn these first" icon="🪜">
            <div className="flex flex-wrap gap-2">
              {pattern.prerequisites.map((id) => {
                const p = PATTERN_MAP[id];
                return (
                  <button
                    key={id}
                    onClick={() => onOpenPattern?.(id)}
                    className={cn("rounded-full px-3 py-1 text-sm font-medium ring-1 transition hover:opacity-80", COLORS[p.color].soft, COLORS[p.color].text, COLORS[p.color].ring)}
                  >
                    {p.emoji} {p.name}
                  </button>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </article>
  );
}
