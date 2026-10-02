import { useEffect, useRef, useState } from "react";
import { analyze, SAMPLE_QUESTIONS, type Analysis } from "../lib/analyze";
import { bucketForN, FRAMEWORK, SIZE_BUCKETS } from "../data/constraints";
import { PATTERN_MAP } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "../utils/cn";
import PatternDetail from "./PatternDetail";
import Wizard from "./Wizard";

interface Props {
  learned: string[];
  onToggleLearned: (id: string) => void;
}

export default function Coach({ learned, onToggleLearned }: Props) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [nOverride, setNOverride] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const detailRef = useRef<HTMLDivElement>(null);
  const scrollNext = useRef(false);

  useEffect(() => {
    if (scrollNext.current && selectedId) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      scrollNext.current = false;
    }
  }, [selectedId]);

  const run = () => {
    if (!text.trim()) return;
    const a = analyze(text);
    setResult(a);
    setNOverride(null);
    setSelectedId(a.candidates[0]?.pattern.id ?? null);
  };

  const clear = () => {
    setText("");
    setResult(null);
    setSelectedId(null);
    setNOverride(null);
  };

  const openPattern = (id: string) => {
    scrollNext.current = true;
    setSelectedId(id);
  };

  const effectiveN = nOverride ?? result?.detectedN ?? null;
  const bucket = effectiveN !== null ? bucketForN(effectiveN) : null;
  const selected = selectedId ? PATTERN_MAP[selectedId] : null;
  const selectedClues = result?.candidates.find((c) => c.pattern.id === selectedId)?.matched;

  return (
    <div className="space-y-8">
      {/* Intro */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-100">How this works</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          I won't give you the answer.
          <br className="hidden sm:block" /> I'll teach you how to <span className="underline decoration-fuchsia-300 decoration-4 underline-offset-4">find</span> it.
        </h2>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["1", "Paste a question", "Any coding / algorithm problem statement."],
            ["2", "Spot the signals", "Clue words and input size point to the right pattern."],
            ["3", "Think it through", "Guided questions, not solutions. You write the plan."],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-700">{n}</span>
                {t}
              </div>
              <p className="mt-1.5 text-indigo-100">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <label htmlFor="q" className="text-lg font-bold text-slate-900">
          📥 Paste your question
        </label>
        <p className="text-sm text-slate-500">Include the constraints (like "1 ≤ n ≤ 10^5") — they're the biggest clue.</p>
        <textarea
          id="q"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
          }}
          rows={5}
          placeholder="e.g. Given an array of integers and a target, return the indices of the two numbers that add up to the target. 2 <= n <= 10^4"
          className="mt-3 w-full resize-y rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={!text.trim()}
            className="rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Coach me →
          </button>
          {(text || result) && (
            <button onClick={clear} className="rounded-full px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100">
              Clear
            </button>
          )}
          <span className="hidden text-xs text-slate-400 sm:inline">Ctrl / ⌘ + Enter</span>
        </div>
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Or try a sample question</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((s) => (
              <button
                key={s.title}
                onClick={() => {
                  setText(s.text);
                  setResult(null);
                  setSelectedId(null);
                }}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis */}
      {result && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Constraints */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-lg font-bold text-slate-900">📏 Step 1 · What do the constraints allow?</h3>
              <p className="mt-1 text-sm text-slate-500">
                {result.detectedN !== null
                  ? `I found a size limit of about ${result.detectedN.toLocaleString()} in your text. Wrong? Pick the right one:`
                  : "I couldn't find the input size. Pick the maximum n from the question:"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SIZE_BUCKETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setNOverride(b.max === Infinity ? 1_000_000_000 : b.max)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      bucket?.id === b.id
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {bucket ? (
                <div className="mt-4 rounded-2xl bg-indigo-50 p-4">
                  <p className="text-sm text-slate-600">Your target speed</p>
                  <p className="text-2xl font-extrabold text-indigo-700">{bucket.complexity}</p>
                  <p className="mt-1 text-sm text-slate-700">{bucket.meaning}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {bucket.patterns.map((id) => {
                      const p = PATTERN_MAP[id];
                      if (!p) return null;
                      return (
                        <button
                          key={id}
                          onClick={() => openPattern(id)}
                          className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1 hover:opacity-80", COLORS[p.color].soft, COLORS[p.color].text, COLORS[p.color].ring)}
                        >
                          {p.emoji} {p.name.split(" (")[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Choose a size above to see the speed you should aim for.</p>
              )}
            </div>

            {/* Kind */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-lg font-bold text-slate-900">🔎 Step 2 · What kind of question is it?</h3>
              {result.kinds.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {result.kinds.slice(0, 4).map((k) => (
                    <li key={k.label} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                      <span className="text-xl">{k.emoji}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{k.label}</p>
                        <p className="text-sm text-slate-600">{k.hint}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No strong wording detected. Re-read the last sentence of the question and use the guided wizard below.
                </p>
              )}
            </div>
          </div>

          {/* Candidates */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="text-lg font-bold text-slate-900">🧩 Step 3 · Patterns worth considering</h3>
            <p className="text-sm text-slate-500">
              These are <strong>candidates</strong>, not verdicts. Open each lesson and check whether its signals really fit your problem.
            </p>
            {result.candidates.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {result.candidates.map((c, i) => {
                  const col = COLORS[c.pattern.color];
                  const active = selectedId === c.pattern.id;
                  return (
                    <button
                      key={c.pattern.id}
                      onClick={() => openPattern(c.pattern.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition hover:shadow-md",
                        active ? cn("ring-2", col.border, col.soft, col.ring) : "border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">
                          {c.pattern.emoji} {c.pattern.name}
                        </span>
                        {i === 0 && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Best fit</span>}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn("h-full rounded-full", col.bar)} style={{ width: `${Math.max(c.strength, 8)}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Clues: {c.matched.join(", ")}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                I didn't spot any clue words. No problem — that's what the wizard below is for. Answer its questions and it will guide you.
              </div>
            )}
          </div>
        </div>
      )}

      {selected && (
        <div ref={detailRef} className="scroll-mt-24">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            📖 Lesson
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <PatternDetail
            key={selected.id}
            pattern={selected}
            clues={selectedClues}
            learned={learned.includes(selected.id)}
            onToggleLearned={() => onToggleLearned(selected.id)}
            onOpenPattern={openPattern}
          />
        </div>
      )}

      <Wizard onOpenPattern={openPattern} />

      {/* Routine */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h3 className="text-lg font-bold text-slate-900">✅ Your 5-step routine for every problem</h3>
        <p className="text-sm text-slate-500">Tick things off as you do them. Good habits beat clever tricks.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FRAMEWORK.map((f, i) => (
            <div key={f.title} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">
                {f.emoji} {i + 1}. {f.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {f.prompts.map((p) => {
                  const key = f.title + p;
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={!!checks[key]}
                          onChange={() => setChecks((c) => ({ ...c, [key]: !c[key] }))}
                          className="mt-1 h-4 w-4 accent-indigo-600"
                        />
                        <span className={cn(checks[key] && "text-slate-400 line-through")}>{p}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
