import { useMemo, useState } from "react";
import { Check, FlaskConical } from "lucide-react";
import { PATTERNS, type Pattern } from "../data/patterns";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useRevealStagger } from "../hooks/useReveal";
import { markActiveToday } from "../lib/activity";
import { Button } from "./ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Badge } from "./ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Helpers

   Every exercise is built from data the lesson already contains — the recipe,
   the traps, the pseudo-code — and its wrong answers are drawn from *other*
   patterns. That is what makes them hard enough to be worth doing: the
   distractors are real algorithm steps, just not this algorithm's.
   ========================================================================== */

/** Deterministic PRNG, so a given pattern always builds the same exercises. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rand = seeded(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The code lines worth testing — declarations and control flow, not comments. */
function codeLines(pattern: Pattern): string[] {
  return pattern.skeleton
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.trim().length > 8);
}

/* ==========================================================================
   Exercise 1 — put the recipe back in order
   ========================================================================== */

function OrderRecipe({ pattern, onPass }: { pattern: Pattern; onPass: () => void }) {
  const shuffled = useMemo(() => {
    const seed = hash(pattern.id + "steps");
    let out = shuffle(pattern.steps, seed);
    // A shuffle that happens to come out already sorted would give the game away.
    if (out.every((s, i) => s === pattern.steps[i])) out = shuffle(pattern.steps, seed + 7);
    return out;
  }, [pattern]);

  const [placed, setPlaced] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const nextExpected = pattern.steps[placed.length];
  const complete = placed.length === pattern.steps.length;

  const tryPlace = (step: string) => {
    if (step === nextExpected) {
      const next = [...placed, step];
      setPlaced(next);
      setWrong(null);
      setAttempts((a) => a + 1);
      if (next.length === pattern.steps.length) onPass();
    } else {
      setWrong(step);
      window.setTimeout(() => setWrong((w) => (w === step ? null : w)), 600);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Click the steps in the order you would actually write them. The list is deliberately scrambled.
      </p>

      {/* What has been placed so far */}
      <ol className="mt-4 space-y-2">
        {pattern.steps.map((_, i) => {
          const step = placed[i];
          return (
            <li
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-sm transition",
                step ? "animate-pop border-border bg-card" : "border-dashed border-border bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              {step ? (
                <span className="text-foreground">{step}</span>
              ) : (
                <span className="text-muted-foreground">Step {i + 1}…</span>
              )}
            </li>
          );
        })}
      </ol>

      {!complete && (
        <div className="mt-4 flex flex-wrap gap-2">
          {shuffled
            .filter((s) => !placed.includes(s))
            .map((s) => (
              <button
                key={s}
                onClick={() => tryPlace(s)}
                className={cn(
                  "press rounded-xl border px-3 py-2 text-left text-sm transition",
                  wrong === s
                    ? "animate-shake border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-muted",
                )}
              >
                {s}
              </button>
            ))}
        </div>
      )}

      {complete && (
        <p className="animate-fade-up mt-4 rounded-xl bg-muted p-3 text-sm font-medium text-muted-foreground">
          🎉 Recipe complete. That order is the algorithm — if you can write it, you can code it.
        </p>
      )}

      {!complete && attempts > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {attempts} step{attempts === 1 ? "" : "s"} placed · keep going
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   Exercise 2 — which of these are real traps for THIS pattern?
   ========================================================================== */

function SpotTraps({ pattern, onPass }: { pattern: Pattern; onPass: () => void }) {
  /** `from` is set only on decoys, so a wrong pick can name its real owner. */
  type Option = { text: string; real: boolean; from?: string };

  const options = useMemo<Option[]>(() => {
    const mine = pattern.pitfalls;
    const others = PATTERNS.filter((p) => p.id !== pattern.id).flatMap((p) =>
      p.pitfalls.map((t) => ({ t, from: p.name })),
    );
    const decoys = shuffle(others, hash(pattern.id + "traps")).slice(0, Math.max(2, Math.min(3, mine.length)));
    return shuffle<Option>(
      [
        ...mine.map((t) => ({ text: t, real: true })),
        ...decoys.map((d) => ({ text: d.t, real: false, from: d.from })),
      ],
      hash(pattern.id + "traps2"),
    );
  }, [pattern]);

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  const toggle = (text: string) => {
    if (checked) return;
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      return next;
    });
  };

  const score = options.filter((o) => o.real === picked.has(o.text)).length;
  const perfect = score === options.length;

  const check = () => {
    setChecked(true);
    if (options.every((o) => o.real === picked.has(o.text))) onPass();
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Some of these are the real traps for <strong className="text-muted-foreground">{pattern.name}</strong>. The rest belong to
        other patterns and would send you down the wrong road. Select the ones that belong here.
      </p>

      <div className="mt-4 space-y-2">
        {options.map((o) => {
          const isPicked = picked.has(o.text);
          const right = checked && o.real;
          const missed = checked && o.real && !isPicked;
          const badPick = checked && isPicked && !o.real;
          return (
            <button
              key={o.text}
              onClick={() => toggle(o.text)}
              disabled={checked}
              className={cn(
                "press flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition",
                !checked && isPicked && "border-primary bg-muted",
                !checked && !isPicked && "border-border bg-card hover:border-ring",
                right && "animate-pop border-primary bg-muted",
                missed && "border-dashed border-primary bg-muted",
                badPick && "animate-shake border-destructive bg-destructive/10",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold",
                  isPicked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {right ? "✓" : badPick ? "✕" : isPicked ? "•" : ""}
              </span>
              <span className={cn(badPick ? "text-destructive" : "text-muted-foreground")}>
                {o.text}
                {checked && !o.real && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    That one is a {o.from} concern.
                  </span>
                )}
                {missed && <span className="mt-1 block text-xs text-muted-foreground">You missed this one.</span>}
              </span>
            </button>
          );
        })}
      </div>

      {!checked ? (
        <Button className="mt-4" onClick={check} disabled={picked.size === 0}>
          Check my answer
        </Button>
      ) : (
        <p
          className={cn(
            "animate-fade-up mt-4 rounded-xl p-3 text-sm font-medium",
            perfect ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {perfect
            ? "🎯 Every trap spotted. These are the mistakes that cost people the interview."
            : `${score} of ${options.length} right. Read the corrections above, then run it again.`}
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   Exercise 3 — put the missing line of code back
   ========================================================================== */

function RebuildCode({ pattern, onPass }: { pattern: Pattern; onPass: () => void }) {
  const { lines, gapIndex, answer, choices } = useMemo(() => {
    const ls = codeLines(pattern);
    if (ls.length < 3) return { lines: [], gapIndex: -1, answer: "", choices: [] as string[] };

    // Blank a line from the middle, where the logic lives.
    const gap = Math.max(1, Math.floor(ls.length / 2));
    const correct = ls[gap];
    const others = PATTERNS.filter((p) => p.id !== pattern.id).flatMap((p) =>
      codeLines(p).filter((l) => l !== correct),
    );
    const decoys = shuffle(others, hash(pattern.id + "code")).slice(0, 2);
    return {
      lines: ls,
      gapIndex: gap,
      answer: correct,
      choices: shuffle([correct, ...decoys], hash(pattern.id + "code2")),
    };
  }, [pattern]);

  const [picked, setPicked] = useState<string | null>(null);
  const [wrongPick, setWrongPick] = useState<string | null>(null);
  const solved = picked === answer;

  if (lines.length < 3) return null;

  const choose = (line: string) => {
    if (solved) return;
    if (line === answer) {
      setPicked(line);
      setWrongPick(null);
      onPass();
    } else {
      setWrongPick(line);
      window.setTimeout(() => setWrongPick((w) => (w === line ? null : w)), 600);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        One line has been lifted out of the template. Which line belongs in the gap?
      </p>

      <pre className="code-surface mt-4 overflow-x-auto rounded-lg p-4 font-mono text-[13px] leading-6">
        {lines.map((l, i) =>
          i === gapIndex && !solved ? (
            <div
              key={i}
              className={cn(
                "my-1 flex items-center gap-2 rounded px-2 py-1",
                wrongPick ? "animate-shake bg-destructive/25" : "bg-strong-foreground/10",
              )}
            >
              <span className="text-strong-foreground/65">?</span>
              <span className="animate-blink text-strong-foreground/85">the missing line</span>
            </div>
          ) : (
            <div
              key={i}
              className={cn(
                "flex gap-3 px-2",
                i === gapIndex && "animate-pop bg-strong-foreground/15",
                i > gapIndex && !solved && "opacity-40",
              )}
            >
              <span className="w-4 shrink-0 text-right text-strong-foreground/75">{i + 1}</span>
              <span className="whitespace-pre">{l}</span>
            </div>
          ),
        )}
      </pre>

      {!solved ? (
        <div className="mt-4 space-y-2">
          {choices.map((c) => (
            <button
              key={c}
              onClick={() => choose(c)}
              className={cn(
                "press block w-full rounded-xl border px-3 py-2 text-left font-mono text-[13px] transition",
                wrongPick === c
                  ? "animate-shake border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:bg-muted",
              )}
            >
              {c.trim()}
            </button>
          ))}
        </div>
      ) : (
        <p className="animate-fade-up mt-4 rounded-xl bg-muted p-3 text-sm font-medium text-muted-foreground">
          ✅ That is the load-bearing line. Everything else is scaffolding around it.
        </p>
      )}
    </div>
  );
}

/* ==========================================================================
   The lab
   ========================================================================== */

/* ==========================================================================
   Exercise 4 — name the cost
   --------------------------------------------------------------------------
   Complexity is the one number an interviewer will always ask for, and the one
   learners most often nod along to without checking. Four options, one click,
   immediate correction — and the real figures are revealed either way.
   ========================================================================== */

/** The first O(...) in a complexity string, which is the headline figure. */
function headline(time: string): string {
  return (time.match(/O\([^)]*\)/)?.[0] ?? time).trim();
}

function CostQuiz({ pattern, onPass }: { pattern: Pattern; onPass: () => void }) {
  const { options, answer } = useMemo(() => {
    const correct = headline(pattern.time);
    const seen = new Set([correct]);
    const decoys: string[] = [];

    for (const other of shuffle(PATTERNS.filter((p) => p.id !== pattern.id), hash(pattern.id + "cost"))) {
      const token = headline(other.time);
      if (seen.has(token)) continue;
      seen.add(token);
      decoys.push(token);
      if (decoys.length === 3) break;
    }

    return { options: shuffle([correct, ...decoys], hash(pattern.id + "cost2")), answer: correct };
  }, [pattern]);

  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const right = picked === answer;

  const choose = (token: string) => {
    if (answered) return;
    setPicked(token);
    if (token === answer) onPass();
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        What does <strong className="text-foreground">{pattern.name}</strong> aim for? Read the constraints before you
        answer — the maximum input size decides which of these is even allowed.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((token) => {
          const isAnswer = token === answer;
          const isPicked = token === picked;
          return (
            <button
              key={token}
              onClick={() => choose(token)}
              disabled={answered}
              className={cn(
                "press flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-mono text-sm transition",
                !answered && "border-border hover:border-ring hover:bg-muted",
                answered && isAnswer && "animate-pop border-primary bg-primary text-primary-foreground",
                answered && isPicked && !isAnswer && "animate-shake border-destructive bg-destructive/10 text-destructive",
                answered && !isPicked && !isAnswer && "border-border opacity-50",
              )}
            >
              <span className="font-semibold">{token}</span>
              {answered && isAnswer && <span className="ml-auto text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          className={cn(
            "animate-slide-right mt-4 rounded-xl p-4 ring-1",
            right ? "bg-muted ring-border" : "bg-destructive/10 ring-destructive/30",
          )}
        >
          <p className={cn("text-sm font-semibold", right ? "text-foreground" : "text-destructive")}>
            {right ? "✓ That is the target." : `Not quite — this one is ${answer}.`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Time <strong className="text-foreground">{pattern.time}</strong> · Space{" "}
            <strong className="text-foreground">{pattern.space}</strong>
          </p>
          {!right && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => setPicked(null)}>
              Try again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  pattern: Pattern;
}

/**
 * Four exercises, unlocked in sequence.
 *
 * Reading a lesson is not learning it. Each of these forces a decision and
 * tells you immediately whether it was right — which is the whole difference
 * between a page you scroll and a page you work. They also hand back the
 * content the lesson used to just print: the recipe, the traps and the code
 * template are all revealed by getting them right.
 */
export default function LessonLab({ pattern }: Props) {
  const [done, setDone] = useLocalStorage<string[]>(`algocoach-lab-${pattern.id}`, []);
  const [open, setOpen] = useState(1);

  const mark = (n: number) => {
    // A finished exercise is real work, so it feeds the streak and the daily
    // goal — the same list the review session and the problem ticks write to.
    markActiveToday();
    setDone((d) => (d.includes(String(n)) ? d : [...d, String(n)]));
  };

  const exercises = [
    {
      n: 1,
      title: "Put the recipe in order",
      hint: "Sequencing",
      body: <OrderRecipe pattern={pattern} onPass={() => mark(1)} />,
    },
    {
      n: 2,
      title: "Spot the traps",
      hint: "Judgement",
      body: <SpotTraps pattern={pattern} onPass={() => mark(2)} />,
    },
    {
      n: 3,
      title: "Rebuild the code",
      hint: "Recall",
      body: <RebuildCode pattern={pattern} onPass={() => mark(3)} />,
    },
    {
      n: 4,
      title: "Name the cost",
      hint: "Complexity",
      body: <CostQuiz pattern={pattern} onPass={() => mark(4)} />,
    },
  ];

  const completed = exercises.filter((e) => done.includes(String(e.n))).length;
  const listRef = useRevealStagger<HTMLDivElement>(80, [pattern.id, done.length]);

  return (
    <Card className="mt-7 gap-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="size-4" aria-hidden />
          Practice this pattern now
        </CardTitle>
        <CardDescription>
          Four short exercises. You cannot pass them by reading — you have to decide.
        </CardDescription>
        <CardAction>
          <Badge className="tabular-nums">
            {completed} / {exercises.length} done
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={(completed / exercises.length) * 100} />

        <Accordion
          ref={listRef}
          type="single"
          collapsible
          value={open ? String(open) : ""}
          onValueChange={(v) => setOpen(v ? Number(v) : 0)}
          className="rounded-xl border"
        >
          {exercises.map((e, i) => {
            const isDone = done.includes(String(e.n));
            return (
              <AccordionItem key={e.n} value={String(e.n)} className="reveal relative last:border-b-0">
                {/* the same dotted connector the learning path uses, so the
                    exercises read as a route rather than a menu */}
                {i < exercises.length - 1 && (
                  <span
                    aria-hidden
                    className={cn("path-line absolute top-12 bottom-0 left-[1.6875rem] w-1.5", isDone && "path-line-done")}
                  />
                )}

                <AccordionTrigger className="px-4 hover:no-underline">
                  <span className="flex items-center gap-3 text-left">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isDone ? "bg-primary text-primary-foreground" : "border text-muted-foreground",
                      )}
                    >
                      {isDone ? <Check className="size-4" /> : e.n}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{e.title}</span>
                      <span className="block text-xs font-normal text-muted-foreground">{e.hint}</span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4">{e.body}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>

      <p className="mt-4 text-xs text-muted-foreground">
        Progress here is saved on this device with the rest of your work. Finishing all four counts towards your daily
        goal.
      </p>
    </Card>
  );
}
