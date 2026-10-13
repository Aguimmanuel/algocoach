import { useState } from "react";
import { ChevronDown, Flag, Lock } from "lucide-react";
import { useRevealStagger } from "../hooks/useReveal";
import { LEARNING_PATH } from "../data/basics";
import { PATTERN_MAP } from "../data/patterns";
import { PRACTICE } from "../data/practice";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  learned: string[];
  solved: string[];
  onOpenPattern: (id: string) => void;
}

type NodeState = "done" | "current" | "locked";

/**
 * The learning path, as a trail of stops.
 *
 * Duolingo's move, and it is not cosmetic: a linear list reads as a syllabus you
 * are behind on, while a trail reads as a journey you are part way up. The nodes
 * bend left and right down the page and exactly one is marked "you are here", so
 * the answer to "what next?" is a place on screen rather than a paragraph.
 *
 * What the stops deliberately do *not* do is explain themselves. Every row is one
 * line — number, name, progress — and the detail ("ready when…", what it is,
 * how many problems are done) folds out on request. Nineteen expanded cards is a
 * wall; nineteen lines is a route you can take in at a glance.
 */
export default function LearningPath({ learned, solved, onOpenPattern }: Props) {
  const listRef = useRevealStagger<HTMLOListElement>(45, [learned.length, solved.length]);
  const [open, setOpen] = useState<number | null>(null);

  const steps = LEARNING_PATH.map((step, i) => {
    const pattern = step.patternId ? PATTERN_MAP[step.patternId] : null;
    const problems = step.patternId ? (PRACTICE[step.patternId] ?? []) : [];
    const solvedCount = step.patternId
      ? problems.filter((p) => solved.includes(`${step.patternId}::${p.name}`)).length
      : 0;
    return { step, pattern, i, problems, solvedCount, isDone: step.patternId ? learned.includes(step.patternId) : false };
  });

  // The first pattern-less step is onboarding, not a lesson; the first unfinished
  // *pattern* is where the learner actually is.
  const currentIndex = steps.findIndex((s) => s.pattern && !s.isDone);
  const stateOf = (i: number): NodeState => {
    if (steps[i].isDone) return "done";
    if (i === currentIndex) return "current";
    return "locked";
  };

  const totalProblems = steps.reduce((n, s) => n + s.problems.length, 0);
  const totalSolved = steps.reduce((n, s) => n + s.solvedCount, 0);
  const currentStep = currentIndex >= 0 ? steps[currentIndex] : null;

  return (
    <section className="surface rounded-xl p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your learning path</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Top to bottom. Each step only uses ideas from the steps above it — which is why DP comes late.
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-2xl font-extrabold tabular-nums">
              {steps.filter((s) => s.isDone).length}
              <span className="text-base font-semibold text-muted-foreground">/{steps.filter((s) => s.pattern).length}</span>
            </p>
            <p className="text-xs text-muted-foreground">lessons done</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold tabular-nums">
              {totalSolved}
              <span className="text-base font-semibold text-muted-foreground">/{totalProblems}</span>
            </p>
            <p className="text-xs text-muted-foreground">problems solved</p>
          </div>
        </div>
      </div>

      {currentStep?.pattern && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg bg-strong px-4 py-3 text-strong-foreground">
          <Flag className="size-4 opacity-85" />
          <p className="text-sm opacity-90">Next lesson</p>
          <p className="text-sm font-bold">{currentStep.pattern.name}</p>
          <button
            onClick={() => onOpenPattern(currentStep.pattern!.id)}
            className="press ml-auto rounded-full bg-strong-foreground px-4 py-1.5 text-sm font-semibold text-strong transition hover:opacity-90"
          >
            Continue
          </button>
        </div>
      )}

      <ol ref={listRef} className="relative mt-7 space-y-0">
        {steps.map(({ step, pattern, i, problems, solvedCount, isDone }) => {
          const state = stateOf(i);
          const side = i % 2 === 0 ? "left" : "right";
          const indent = side === "left" ? "sm:ml-[4%]" : "sm:ml-[16%]";
          const isOpen = open === i;

          return (
            <li key={step.title} className={cn("relative flex gap-3 pb-2 sm:gap-4", indent)}>
              {/* the connector to the next node */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "path-line absolute top-11 bottom-0 left-[1.375rem] w-1.5 sm:left-[1.5rem]",
                    isDone && "path-line-done",
                  )}
                />
              )}

              {/* the node */}
              <button
                onClick={() => step.patternId && onOpenPattern(step.patternId)}
                disabled={!step.patternId}
                aria-label={pattern ? `Open ${pattern.name}` : step.title}
                className={cn(
                  "reveal press relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "animate-pop border-primary bg-card text-foreground shadow-[0_0_0_7px_rgba(15,23,42,0.08)]",
                  state === "locked" && "border-border bg-card text-muted-foreground hover:border-ring",
                  !step.patternId && "cursor-default border-dashed bg-muted text-muted-foreground",
                )}
              >
                {isDone ? "✓" : pattern ? pattern.emoji : "🧠"}
              </button>

              {/* the row — one line, everything else folded away */}
              <Collapsible
                asChild
                open={isOpen}
                onOpenChange={(v) => setOpen(v ? i : null)}
              >
                <div
                  className={cn(
                    "reveal mb-2 min-w-0 flex-1 rounded-lg border transition",
                    state === "current" ? "border-primary bg-primary text-primary-foreground shadow-lg" : "border-border bg-card",
                  )}
                >
                  <div className="flex items-center gap-2 p-3">
                    <button
                      onClick={() => step.patternId && onOpenPattern(step.patternId)}
                      disabled={!step.patternId}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "truncate text-sm font-semibold",
                            state === "current" ? "text-primary-foreground" : "text-foreground",
                          )}
                        >
                          {step.title}
                        </span>
                        {state === "current" && (
                          <Badge className="shrink-0 border-transparent bg-card text-foreground">Next</Badge>
                        )}
                        {isDone && (
                          <Badge variant="secondary" className="shrink-0">
                            Done
                          </Badge>
                        )}
                        {!step.patternId && (
                          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                        )}
                      </span>

                      <span
                        className={cn(
                          "mt-0.5 flex items-center gap-2 text-xs",
                          state === "current" ? "text-primary-foreground/85" : "text-muted-foreground",
                        )}
                      >
                        <span>Step {i + 1}</span>
                        {problems.length > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="tabular-nums">
                              {solvedCount}/{problems.length} problems
                            </span>
                          </>
                        )}
                        {state === "locked" && (
                          <>
                            <span aria-hidden>·</span>
                            <span>ahead of you</span>
                          </>
                        )}
                      </span>
                    </button>

                    <CollapsibleTrigger asChild>
                      <button
                        aria-label={`${isOpen ? "Hide" : "Show"} details for ${step.title}`}
                        className={cn(
                          "press flex size-8 shrink-0 items-center justify-center rounded-full transition",
                          state === "current" ? "hover:bg-card/20" : "hover:bg-muted",
                        )}
                      >
                        <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                      </button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div
                      className={cn(
                        "space-y-3 border-t px-3 pt-3 pb-3",
                        state === "current" ? "border-primary-foreground/20" : "border-border",
                      )}
                    >
                      <p className={cn("text-sm leading-relaxed", state === "current" ? "opacity-95" : "text-muted-foreground")}>
                        {step.detail}
                      </p>

                      <p className={cn("text-xs leading-relaxed", state === "current" ? "opacity-90" : "text-muted-foreground")}>
                        <span className="font-semibold">Ready when:</span> {step.check}
                      </p>

                      {problems.length > 0 && (
                        <div className="flex items-center gap-3">
                          <Progress
                            value={problems.length ? (solvedCount / problems.length) * 100 : 0}
                            className="h-1.5 flex-1"
                          />
                          <span className={cn("text-xs tabular-nums", state === "current" ? "opacity-90" : "text-muted-foreground")}>
                            {solvedCount}/{problems.length}
                          </span>
                        </div>
                      )}

                      {pattern && (
                        <button
                          onClick={() => onOpenPattern(pattern.id)}
                          className={cn(
                            "press rounded-full px-4 py-1.5 text-sm font-semibold transition",
                            state === "current"
                              ? "bg-card text-foreground hover:opacity-90"
                              : "bg-primary text-primary-foreground hover:opacity-90",
                          )}
                        >
                          {state === "current" ? "Continue" : state === "done" ? "Review" : "Open lesson"} →
                        </button>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
