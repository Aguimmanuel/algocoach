import { useEffect, useRef, useState } from "react";
import { analyze, SAMPLE_QUESTIONS, type Analysis } from "../lib/analyze";
import { bucketForN, FRAMEWORK, SIZE_BUCKETS } from "../data/constraints";
import { PATTERN_MAP } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "@/lib/utils";
import { useRevealStagger } from "../hooks/useReveal";
import PatternDetail from "./PatternDetail";
import Wizard from "./Wizard";
import AICoach from "./AICoach";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";

interface Props {
  learned: string[];
  onToggleLearned: (id: string) => void;
  /** open a pattern's animation in the Visualize tab */
  onVisualize?: (id: string) => void;
}

export default function Coach({ learned, onToggleLearned, onVisualize }: Props) {
  const [text, setText] = useState("");
  // Snapshot of the text that produced `result`, so the AI coach always works
  // from the analysed problem even if the user keeps editing the textarea.
  const [analyzedText, setAnalyzedText] = useState("");
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
    setAnalyzedText(text);
    setNOverride(null);
    setSelectedId(a.candidates[0]?.pattern.id ?? null);
  };

  const clear = () => {
    setText("");
    setResult(null);
    setAnalyzedText("");
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
  const pageRef = useRevealStagger<HTMLDivElement>(60);
  const tileRef = useRevealStagger<HTMLDivElement>(70);

  return (
    <div ref={pageRef} className="space-y-8">
      {/* Intro */}
      <div className="reveal slab rounded-xl p-6 text-strong-foreground sm:p-9">
        <p className="text-sm font-semibold tracking-widest text-strong-foreground/85 uppercase">How this works</p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight sm:text-4xl">
          Paste a problem, get guided questions
        </h2>
        <div ref={tileRef} className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          {[
            ["1", "Paste a question", "Any coding / algorithm problem statement."],
            ["2", "Spot the signals", "Clue words and input size point to the right pattern."],
            ["3", "Think it through", "Guided questions, not solutions. You write the plan."],
          ].map(([n, t, d]) => (
            <div key={n} className="reveal rounded-lg bg-strong-foreground/10 p-4 backdrop-blur">
              <div className="flex items-center gap-2 font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-strong-foreground text-xs font-bold text-strong">{n}</span>
                {t}
              </div>
              <p className="mt-1.5 text-strong-foreground/85">{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="reveal surface rounded-xl p-6">
        <label htmlFor="q" className="text-lg font-bold text-foreground">
          📥 Paste your question
        </label>
        <p className="text-sm text-muted-foreground">Include the constraints (like "1 ≤ n ≤ 10^5") — they're the biggest clue.</p>
        <Textarea
          id="q"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
          }}
          rows={5}
          placeholder="e.g. Given an array of integers and a target, return the indices of the two numbers that add up to the target. 2 <= n <= 10^4"
          className="mt-3 resize-y"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={run} disabled={!text.trim()} size="lg">
            Coach me
            <ArrowRight />
          </Button>
          {(text || result) && (
            <button onClick={clear} className="rounded-full px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">
              Clear
            </button>
          )}
          <span className="hidden text-xs text-muted-foreground sm:inline">Ctrl / ⌘ + Enter</span>
        </div>
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Or try a sample question</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((s) => (
              <button
                key={s.title}
                onClick={() => {
                  setText(s.text);
                  setResult(null);
                  setSelectedId(null);
                }}
                className="rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
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
            <div className="surface rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground">📏 Step 1 · What do the constraints allow?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-border hover:bg-muted",
                    )}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {bucket ? (
                <div className="mt-4 rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Your target speed</p>
                  <p className="text-2xl font-extrabold text-foreground">{bucket.complexity}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{bucket.meaning}</p>
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
                <p className="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">Choose a size above to see the speed you should aim for.</p>
              )}
            </div>

            {/* Kind */}
            <div className="surface rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground">🔎 Step 2 · What kind of question is it?</h3>
              {result.kinds.length > 0 ? (
                <ul className="mt-3 space-y-2.5">
                  {result.kinds.slice(0, 4).map((k) => (
                    <li key={k.label} className="flex gap-3 rounded-lg bg-muted p-3">
                      <span className="text-xl">{k.emoji}</span>
                      <div>
                        <p className="font-semibold text-foreground">{k.label}</p>
                        <p className="text-sm text-muted-foreground">{k.hint}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                  No strong wording detected. Re-read the last sentence of the question and use the guided wizard below.
                </p>
              )}
            </div>
          </div>

          {/* Candidates */}
          <div className="surface rounded-xl p-6">
            <h3 className="text-lg font-bold text-foreground">🧩 Step 3 · Patterns worth considering</h3>
            <p className="text-sm text-muted-foreground">
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
                        "rounded-lg border p-4 text-left transition hover:shadow-md",
                        active ? cn("ring-2", col.border, col.soft, col.ring) : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {c.pattern.emoji} {c.pattern.name}
                        </span>
                        {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground">Best fit</span>}
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={cn("h-full rounded-full", col.bar)} style={{ width: `${Math.max(c.strength, 8)}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">Clues: {c.matched.join(", ")}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-foreground">
                I didn't spot any clue words. No problem — that's what the wizard below is for. Answer its questions and it will guide you.
              </div>
            )}
          </div>
        </div>
      )}

      {/* The bridge: an LLM reads the problem and explains how to think about it.
          Renders nothing when the Python backend isn't running. */}
      {result && (
        <AICoach key={analyzedText} problem={analyzedText} analysis={result} onOpenPattern={openPattern} />
      )}

      {selected && (
        <div ref={detailRef} className="scroll-mt-24">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            📖 Lesson
            <span className="h-px flex-1 bg-border" />
          </div>
          <PatternDetail
            key={selected.id}
            pattern={selected}
            clues={selectedClues}
            learned={learned.includes(selected.id)}
            onToggleLearned={() => onToggleLearned(selected.id)}
            onOpenPattern={openPattern}
            onVisualize={onVisualize ? () => onVisualize(selected.id) : undefined}
          />
        </div>
      )}

      <Wizard onOpenPattern={openPattern} />

      {/* Routine */}
      <div className="surface rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground">✅ Your 5-step routine for every problem</h3>
        <p className="text-sm text-muted-foreground">Tick things off as you do them. Good habits beat clever tricks.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {FRAMEWORK.map((f, i) => (
            <div key={f.title} className="rounded-lg bg-muted p-4">
              <p className="font-semibold text-foreground">
                {f.emoji} {i + 1}. {f.title}
              </p>
              <ul className="mt-2 space-y-1.5">
                {f.prompts.map((p) => {
                  const key = f.title + p;
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-start gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={!!checks[key]}
                          onCheckedChange={() => setChecks((c) => ({ ...c, [key]: !c[key] }))}
                          className="mt-1"
                        />
                        <span className={cn(checks[key] && "text-muted-foreground line-through")}>{p}</span>
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
