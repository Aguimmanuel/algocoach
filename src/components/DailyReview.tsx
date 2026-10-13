import { useMemo, useState } from "react";
import { buildReview, todaySeed } from "../data/review";
import { PATTERN_MAP } from "../data/patterns";
import { Button, Card, Progress } from "./ui";
import { cn } from "../utils/cn";

interface Props {
  learned: string[];
  solved: string[];
  shaky: string[];
  onShaky: (problemKey: string) => void;
  onOpenPattern: (id: string) => void;
  onAnswered: (correct: boolean, patternId: string) => void;
}

/**
 * Today's review — five questions, about a minute.
 *
 * This is the habit loop from Duolingo, the retrieval practice from Execute
 * Program, and the targeting of weak spots from Brilliant, in one card. It
 * generates its questions from the pattern library, so it can never fall out of
 * step with the lessons.
 */
export default function DailyReview({
  learned,
  solved,
  shaky,
  onShaky,
  onOpenPattern,
  onAnswered,
}: Props) {
  const questions = useMemo(
    () => buildReview({ learned, solved, shaky, count: 5, seed: todaySeed() }),
    [learned, solved, shaky],
  );

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  if (!q) return null;

  const correct = picked !== null && picked === q.answerId;

  const choose = (id: string) => {
    if (picked !== null) return; // one answer per question
    setPicked(id);
    const right = id === q.answerId;
    if (right) setScore((s) => s + 1);
    else onShaky(`${q.answerId}::review`);
    onAnswered(right, q.answerId);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <Card>
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">✅ Review complete</h3>
        <p className="mt-2 text-slate-600">
          You got <strong className="text-slate-900">{score}</strong> of {questions.length} ({pct}%).
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {pct === 100
            ? "Every one right. Tomorrow's set will draw on different patterns."
            : "Anything you missed is noted, and will come back in a future set."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={restart}>
            Go through it again
          </Button>
          <Button variant="ghost" onClick={() => onOpenPattern(questions[0].answerId)}>
            Revisit a pattern →
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            🎯 Today's review
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Five quick questions. Retrieval beats re-reading — this is the part that makes it stick.
          </p>
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {index + 1} / {questions.length}
        </span>
      </div>

      <Progress value={((index + (picked ? 1 : 0)) / questions.length) * 100} className="mt-4" />

      <div className="mt-6">
        {q.kind === "signal" && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Which pattern do these clues point to?
          </p>
        )}
        {q.kind === "which" && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Which pattern is being described?
          </p>
        )}
        {q.kind === "compare" && (
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Best fit for this problem
          </p>
        )}

        <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-slate-800">{q.prompt}</p>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {q.options.map((id) => {
          const p = PATTERN_MAP[id];
          if (!p) return null;
          const isAnswer = id === q.answerId;
          const isPicked = id === picked;
          // Only reveal correctness once an answer has been given.
          const state =
            picked === null
              ? "idle"
              : isAnswer
                ? "right"
                : isPicked
                  ? "wrong"
                  : "dim";

          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={picked !== null}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-300",
                state === "idle" && "border-slate-200 hover:border-slate-900 hover:bg-slate-50",
                state === "right" && "border-slate-900 bg-slate-900 text-white",
                // The one colour in the app: this answer was wrong.
                state === "wrong" && "border-red-300 bg-red-50 text-red-900",
                state === "dim" && "border-slate-200 opacity-40",
              )}
            >
              <span className="text-lg">{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-900">
            {correct ? "✓ Correct" : "Not quite"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">{q.explain}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={next}>
              {index + 1 >= questions.length ? "Finish" : "Next question →"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onOpenPattern(q.answerId)}>
              Open the lesson
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
