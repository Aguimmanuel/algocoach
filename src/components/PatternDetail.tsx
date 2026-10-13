import { useState } from "react";
import { Check, Footprints, Lightbulb, Play, Target, type LucideIcon } from "lucide-react";
import { PATTERN_MAP, type Pattern } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "@/lib/utils";
import { countByDifficulty, DIFFICULTY_STYLE, PRACTICE, problemId } from "../data/practice";
import { useLocalStorage } from "../hooks/useLocalStorage";
import LessonLab from "./LessonLab";
import { markActiveToday } from "../lib/activity";
import { useRevealStagger } from "../hooks/useReveal";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface Props {
  pattern: Pattern;
  learned: boolean;
  onToggleLearned: () => void;
  onOpenPattern?: (id: string) => void;
  /** open this pattern's animation in the Visualize tab */
  onVisualize?: () => void;
  /** matched keyword clues from the analyzer */
  clues?: string[];
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="reveal space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-4" aria-hidden />
        {title}
      </h4>
      {children}
    </section>
  );
}

export default function PatternDetail({ pattern, learned, onToggleLearned, onOpenPattern, onVisualize, clues }: Props) {
  const c = COLORS[pattern.color];
  const [shownHints, setShownHints] = useState(0);

  // Which practice problems have been solved. Keyed by pattern + problem name.
  // Stored locally for now; this is the state that moves to the account when
  // sign-up lands, which is why it is one flat list rather than nested state.
  const [solved, setSolved] = useLocalStorage<string[]>("algocoach-solved", []);
  const problems = PRACTICE[pattern.id] ?? [];
  const counts = countByDifficulty(problems);
  const solvedHere = problems.filter((p) => solved.includes(problemId(pattern.id, p.name))).length;
  const pct = problems.length ? Math.round((solvedHere / problems.length) * 100) : 0;

  // Each section of the lesson arrives in turn, the way the path's stops do.
  const lessonRef = useRevealStagger<HTMLElement>(55, [pattern.id]);

  const toggleSolved = (name: string) => {
    const key = problemId(pattern.id, name);
    setSolved((s) => {
      const done = !s.includes(key);
      // Solving counts towards the streak, the heatmap and XP.
      if (done) markActiveToday();
      return done ? [...s, key] : s.filter((x) => x !== key);
    });
  };

  return (
    <article ref={lessonRef} className={cn("rounded-xl border bg-card p-5 shadow-sm sm:p-7", c.border)}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-2xl ring-1", c.soft, c.ring)}>
            {pattern.emoji}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{pattern.name}</h3>
            <p className="mt-0.5 text-muted-foreground">{pattern.tagline}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              <span className={cn("rounded-full px-2.5 py-1", c.soft, c.text)}>{pattern.level}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">⏱ {pattern.time}</span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">💾 {pattern.space}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onVisualize && (
            <Button variant="outline" size="sm" onClick={onVisualize}>
              <Play className="size-4" />
              Watch it
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onOpenPattern ? () => onOpenPattern(pattern.id) : undefined}>
            Practice
          </Button>
          <Button size="sm" onClick={onToggleLearned}>
            {learned ? <Check className="size-4" /> : null}
            {learned ? "Learned" : "Mark as learned"}
          </Button>
        </div>
      </header>

      {clues && clues.length > 0 && (
        <div className={cn("mt-5 rounded-lg p-4 text-sm", c.soft)}>
          <p className={cn("font-semibold", c.text)}>Why this showed up</p>
          <p className="mt-1 text-muted-foreground">
            Your question contains these clue words:{" "}
            {clues.map((w) => (
              <code key={w} className="mx-0.5 rounded bg-card px-1.5 py-0.5 font-mono text-xs text-foreground ring-1 ring-border">
                {w}
              </code>
            ))}
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="The big idea" icon={Lightbulb}>
          <p className="slab rounded-xl p-4 text-base leading-relaxed font-medium text-strong-foreground">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-strong-foreground/85">
              In plain words
            </span>
            {pattern.plain}
          </p>
          <p className="leading-relaxed text-muted-foreground">{pattern.idea}</p>
          <p className="rounded-xl border border-dashed border-border bg-muted p-3 text-sm italic text-muted-foreground">
            Think of it like this: {pattern.analogy}
          </p>
        </Section>

        <Section title="How to spot it" icon={Target}>
          <ul className="space-y-2">
            {pattern.signals.map((s) => (
              <li key={s} className="flex gap-2 text-muted-foreground">
                <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", c.bar)} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* The work. Everything the lesson used to print as prose — the recipe,
          the traps, the code template — is handed back by getting it right. */}
      <LessonLab pattern={pattern} />

      {/* Socratic hints */}
      <div className="mt-7 rounded-lg border border-border bg-muted p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 font-semibold text-foreground">
            <span aria-hidden>🤔</span> Ask yourself — guided questions
          </h4>
          <span className="text-xs text-muted-foreground">
            {shownHints}/{pattern.hints.length} revealed
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Try to answer each question about YOUR problem before revealing the next one.
        </p>
        <ol className="mt-4 space-y-3">
          {pattern.hints.slice(0, shownHints).map((h, i) => (
            <li key={h} className="flex gap-3 rounded-xl bg-card p-3 text-muted-foreground shadow-sm ring-1 ring-border">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground", c.solid)}>
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
              className={cn("rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90", c.solid)}
            >
              {shownHints === 0 ? "Give me the first question" : "Next question"}
            </button>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">That's all the guiding questions. Now write your plan!</span>
          )}
          {shownHints > 0 && (
            <button onClick={() => setShownHints(0)} className="rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-border">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <Section title="Skills to master" icon={Target}>
          <div className="flex flex-wrap gap-2">
            {pattern.drills.map((d) => (
              <span key={d} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
        </Section>

        {pattern.prerequisites && pattern.prerequisites.length > 0 && (
          <Section title="Learn these first" icon={Footprints}>
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

      {/* Practice. Reading a pattern is not learning it — solving with it is.
          Ordered easiest-first and tracked, so there is always a next step. */}
      {problems.length > 0 && (
        <section className="mt-7 rounded-lg border border-border bg-muted p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="flex items-center gap-2 font-semibold text-foreground">
                <span aria-hidden>🏋️</span> Practice these problems
              </h4>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Easiest first. Tick one off once you have solved it without looking at a solution.
              </p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              {solvedHere} / {problems.length} solved
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {counts.Easy} easy · {counts.Medium} medium · {counts.Hard} hard
          </p>

          <ul className="mt-4 space-y-1.5">
            {problems.map((p) => {
              const done = solved.includes(problemId(pattern.id, p.name));
              return (
                <li key={p.name}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition",
                      done ? "border-border opacity-60" : "border-border hover:border-ring",
                    )}
                  >
                    <Checkbox
                      checked={done}
                      onCheckedChange={() => toggleSolved(p.name)}
                      className="shrink-0"
                    />
                    <span className={cn("flex-1 text-sm text-foreground", done && "line-through")}>{p.name}</span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                        DIFFICULTY_STYLE[p.difficulty],
                      )}
                    >
                      {p.difficulty}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs text-muted-foreground">
            Search these by name on LeetCode, HackerRank or any judge you like — the names are standard.
          </p>
        </section>
      )}
    </article>
  );
}
