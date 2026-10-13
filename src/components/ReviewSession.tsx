import { useEffect, useMemo, useState } from "react";
import { buildReview, todaySeed, type Question } from "../data/review";
import { PATTERN_MAP } from "../data/patterns";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ArrowRight } from "lucide-react";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import Confetti from "./Confetti";
import { Target, X } from "lucide-react";

interface Props {
  learned: string[];
  solved: string[];
  /** pattern ids the scheduler says are due today */
  duePatternIds: string[];
  onShaky: (key: string) => void;
  onOpenPattern: (id: string) => void;
  onAnswered: (patternId: string, correct: boolean) => void;
  onComplete: (score: number, total: number) => void;
  /** total reviews waiting, shown as a badge */
  dueCount: number;
  /** leave the session and go back to the dashboard */
  onExit: () => void;
}

/**
 * The daily review.
 *
 * Built as a focused session rather than another card on a page: one question
 * at a time, a progress bar that fills as you go, immediate feedback, and a
 * result screen that celebrates. The mechanics are deliberate —
 *
 *   • One question on screen. Splitting attention reduces recall.
 *   • Correct answers advance instantly; there is a short beat before the
 *     praise, which makes it feel earned rather than automatic.
 *   • A wrong answer shakes, explains, and moves on. No lives, no penalty.
 *   • The scheduler learns from every answer, so tomorrow's set is different.
 */
export default function ReviewSession({
  learned,
  solved,
  duePatternIds,
  onShaky,
  onOpenPattern,
  onAnswered,
  onComplete,
  dueCount,
  onExit,
}: Props) {
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [burst, setBurst] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // A fresh round avoids already-answered questions feeling stale.
  const questions = useMemo<Question[]>(() => {
    const all = buildReview({
      learned,
      solved,
      shaky: duePatternIds,
      count: Math.max(5, Math.min(duePatternIds.length || 5, 8)),
      seed: todaySeed() + round * 977,
    });
    return all;
  }, [learned, solved, duePatternIds, round]);

  const q = questions[index];

  // Session timer — shown on the result screen, and a quiet nudge to keep it short.
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const choose = (id: string) => {
    if (picked !== null || !q) return;
    setPicked(id);
    const right = id === q.answerId;
    if (right) {
      setScore((s) => s + 1);
      setBurst((b) => b + 1);
    } else {
      onShaky(`${q.answerId}::review`);
    }
    onAnswered(q.answerId, right);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      onComplete(score, questions.length);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const again = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
    setElapsed(0);
  };

  /* ------------------------------------------------------------- results */

  if (finished) {
    const pct = Math.round((score / Math.max(1, questions.length)) * 100);
    const perfect = pct === 100;
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;

    return (
      <Card className="relative gap-0 overflow-hidden">
        <Confetti fire={perfect ? burst || 1 : 0} />

        <CardContent className="animate-fade-up py-2 text-center">
          <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl", perfect ? "bg-primary" : "bg-muted")}>
            {perfect ? "🏆" : pct >= 60 ? "👍" : "💪"}
          </div>

          <h3 className="mt-4 text-2xl font-extrabold text-foreground">
            {perfect ? "Perfect round" : pct >= 60 ? "Nice work" : "Good effort"}
          </h3>
          <p className="mt-1 text-muted-foreground">
            {score} of {questions.length} correct
            {elapsed > 0 && (
              <>
                {" · "}
                {mins > 0 ? `${mins}m ` : ""}
                {secs}s
              </>
            )}
          </p>

          <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-3">
            {[
              { label: "Correct", value: `${score}` },
              { label: "Missed", value: `${questions.length - score}` },
              { label: "Accuracy", value: `${pct}%` },
            ].map((s, i) => (
              <div
                key={s.label}
                className="animate-pop rounded-xl bg-muted p-3"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <p className="text-xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            {questions.length - score > 0
              ? "The ones you missed are scheduled sooner, so they come back first."
              : "The ones you got right move further out."}
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={onExit}>Back to Today</Button>
            <Button variant="secondary" onClick={again}>
              Another round
            </Button>
            <Button variant="ghost" onClick={() => onOpenPattern(questions[0].answerId)}>
              Open a pattern
              <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!q) return null;

  const correct = picked !== null && picked === q.answerId;
  const wrongPick = picked !== null && !correct;

  const KIND_LABEL: Record<Question["kind"], string> = {
    signal: "Which pattern do these clues point to?",
    which: "Which pattern is being described?",
    compare: "Best fit for this problem",
  };

  /* ------------------------------------------------------------- session */

  return (
    <Card className="relative overflow-hidden gap-0">
      <Confetti fire={burst} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Target className="size-5 text-muted-foreground" />
            Today's review
          </h3>
          {dueCount > 0 && (
            <span className="animate-pop rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
              {dueCount} due
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {index + 1} / {questions.length}
          </span>
          <Button variant="ghost" size="icon" onClick={onExit} aria-label="Leave the review">
            <X />
          </Button>
        </div>
      </div>

      <Progress
        value={((index + (picked ? 1 : 0)) / questions.length) * 100}
        className="mt-4"
      />

      {/* keyed so each question animates in rather than snapping */}
      <div key={q.id} className="animate-fade-up mt-6">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{KIND_LABEL[q.kind]}</p>
        <p className="mt-2 whitespace-pre-line text-lg leading-relaxed text-foreground">{q.prompt}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {q.options.map((id) => {
            const p = PATTERN_MAP[id];
            if (!p) return null;
            const isAnswer = id === q.answerId;
            const isPicked = id === picked;
            const state = picked === null ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "dim";

            return (
              <button
                key={id}
                onClick={() => choose(id)}
                disabled={picked !== null}
                style={{ animationDelay: `${60 + q.options.indexOf(id) * 40}ms` }}
                className={cn(
                  "press animate-fade-up flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-left transition",
                  state === "idle" && "border-border hover:border-primary hover:bg-muted",
                  state === "right" && "animate-pop border-primary bg-primary text-primary-foreground",
                  // The only colour in the app, and only for a wrong answer.
                  state === "wrong" && "animate-shake border-destructive bg-destructive/10 text-destructive",
                  state === "dim" && "border-border opacity-40",
                )}
              >
                <span className="text-lg">{p.emoji}</span>
                <span className="font-medium">{p.name}</span>
                {state === "right" && <span className="ml-auto text-sm">✓</span>}
                {state === "wrong" && <span className="ml-auto text-sm">✕</span>}
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <div
            className={cn(
              "animate-slide-right mt-5 rounded-lg p-4 ring-1",
              correct ? "bg-muted ring-border" : "bg-destructive/10 ring-destructive/30",
            )}
          >
            <p className={cn("font-semibold", wrongPick ? "text-destructive" : "text-foreground")}>
              {correct ? "✓ Correct" : "Not quite — here is why"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{q.explain}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={next}>
                {index + 1 >= questions.length ? "See results" : "Next →"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onOpenPattern(q.answerId)}>
                Open the lesson
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
