import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ListChecks,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { PATTERNS, type Level } from "../data/patterns";
import {
  getPlaygroundVisual,
  type Cell,
  type Row as VisRow,
} from "../data/visuals";
import ExampleSelector from "./studio/ExampleSelector";
import { useRevealStagger } from "../hooks/useReveal";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface Props {
  focused?: boolean;
  onOpenPattern?: (id: string) => void;
  /** which pattern to open on, when arriving from a lesson */
  initialId?: string;
}

const LEVELS: { level: Level; blurb: string }[] = [
  { level: "Beginner", blurb: "Start here" },
  { level: "Intermediate", blurb: "After the basics" },
  { level: "Advanced", blurb: "Bigger ideas" },
];

/** How a cell looks, in one place, so both views agree. */
const CELL: Record<string, string> = {
  idle: "border-border bg-card text-foreground",
  active: "border-primary bg-primary text-primary-foreground scale-105",
  done: "border-primary/60 bg-primary/20 text-foreground",
  hint: "border-border bg-muted text-muted-foreground",
  dim: "border-transparent bg-muted/40 text-muted-foreground/50",
  warning: "border-destructive bg-destructive/20 text-destructive",
};

function RowsView({ rows }: { rows: VisRow[] }) {
  return (
    <div className="space-y-5">
      {rows.map((r, ri) => (
        <div key={r.label ?? ri}>
          {r.label && (
            <p className="mb-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              {r.label}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {r.cells.map((cell: Cell, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-10 min-w-10 items-center justify-center rounded-lg border-2 px-1.5 font-mono text-sm font-bold transition-all duration-300",
                    CELL[cell.state ?? "idle"],
                  )}
                >
                  {cell.v}
                </div>
                <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                  {i}
                </span>
                <div className="flex h-5 flex-col items-center">
                  {r.pointers
                    ?.filter((p) => p.at === i)
                    .map((p) => (
                      <span
                        key={p.text}
                        className="rounded bg-strong-foreground px-1.5 py-px text-[10px] font-bold text-strong"
                      >
                        {p.text}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GridView({ grid }: { grid: Cell[][] }) {
  return (
    <div
      className="mx-auto grid w-full gap-1"
      style={{
        maxWidth: (grid[0]?.length ?? 1) * 48,
        gridTemplateColumns: `repeat(${grid[0]?.length ?? 1}, minmax(0, 1fr))`,
      }}
    >
      {grid.flatMap((line, r) =>
        line.map((cell, c) => (
          <div
            key={`${r},${c}`}
            className={cn(
              "flex aspect-square min-w-0 items-center justify-center rounded-md border text-[11px] font-bold transition-all duration-300 sm:text-sm",
              CELL[cell.state ?? "idle"],
              cell.state === "dim" && "border-transparent",
            )}
          >
            {cell.v}
          </div>
        )),
      )}
    </div>
  );
}

/**
 * The visualizer.
 *
 * Laid out like the pattern library — pick a level, pick an algorithm, watch
 * it — because a list of nineteen animations is the same wall of choice as a
 * list of nineteen lessons. Every pattern has a run-through here, so this is
 * never a dead end: whatever you are reading, there is something to watch.
 */
export default function Visualizer({
  onOpenPattern,
  initialId,
  focused = false,
}: Props) {
  const initial = PATTERNS.find((p) => p.id === initialId);
  const [level, setLevel] = useState<Level>(initial?.level ?? "Beginner");
  const [id, setId] = useState(initialId ?? "binary-search");
  const [step, setStep] = useState(0);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const pattern = PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
  const visual = useMemo(
    () => getPlaygroundVisual(pattern.id, exampleIndex),
    [pattern.id, exampleIndex],
  );
  const frames = visual?.frames ?? [];
  const frame = frames[Math.min(step, frames.length - 1)];

  /** Arriving from a lesson should land on that pattern's level and animation. */
  useEffect(() => {
    if (!initialId) return;
    const p = PATTERNS.find((x) => x.id === initialId);
    if (!p) return;
    setLevel(p.level);
    setId(initialId);
    setExampleIndex(0);
    setStep(0);
    setPlaying(false);
  }, [initialId]);

  // Reset selection, player and autoplay in the same event, never a later effect.
  const selectPattern = (next: string) => {
    setId(next);
    setExampleIndex(0);
    setStep(0);
    setPlaying(false);
  };
  const selectExample = (next: number) => {
    setExampleIndex(next);
    setStep(0);
    setPlaying(false);
  };

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    if (step >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), 850);
    return () => clearTimeout(t);
  }, [playing, step, frames.length]);

  const visible = useMemo(
    () => PATTERNS.filter((p) => p.level === level),
    [level],
  );
  const listRef = useRevealStagger<HTMLDivElement>(45, [level, id]);

  const chooseLevel = (next: Level) => {
    if (!next) return;
    setLevel(next);
    const list = PATTERNS.filter((p) => p.level === next);
    if (!list.some((p) => p.id === id) && list[0]) selectPattern(list[0].id);
  };

  if (!visual || !frame) {
    return (
      <p className="text-muted-foreground">
        No animation for this pattern yet.
      </p>
    );
  }

  return (
    <div
      className={focused ? "min-w-0" : "grid gap-6 lg:grid-cols-[320px_1fr]"}
    >
      {/* ------------------------------------------------------- pick one */}
      {!focused && (
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ToggleGroup
            type="single"
            value={level}
            onValueChange={(v) => chooseLevel(v as Level)}
            variant="outline"
            className="grid w-full grid-cols-3"
          >
            {LEVELS.map(({ level: l }) => (
              <ToggleGroupItem
                key={l}
                value={l}
                className="h-auto flex-col gap-0.5 py-2"
                aria-label={l}
              >
                <span className="text-xs font-semibold">{l}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {PATTERNS.filter((p) => p.level === l).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div ref={listRef} className="mt-3 space-y-1.5">
            <p className="px-1 pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {LEVELS.find((l) => l.level === level)?.level} ·{" "}
              <span className="font-medium tracking-normal normal-case">
                {LEVELS.find((l) => l.level === level)?.blurb}
              </span>
            </p>
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPattern(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  p.id === id
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                <span className="text-lg" aria-hidden>
                  {p.emoji}
                </span>
                <span className="min-w-0 flex-1 leading-tight">{p.name}</span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* ------------------------------------------------------- watch it */}
      <div className="min-w-0 space-y-4">
        <div className="surface rounded-xl">
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span aria-hidden>{pattern.emoji}</span>
                {pattern.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {visual.about}
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              Step {Math.min(step + 1, frames.length)} / {frames.length}
            </Badge>
          </div>

          <div className="px-6 pt-4">
            <ExampleSelector
              id={pattern.id}
              selected={exampleIndex}
              onSelect={selectExample}
            />
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              {frame.grid ? (
                <GridView grid={frame.grid} />
              ) : (
                <RowsView rows={frame.rows ?? []} />
              )}
            </div>

            <p
              key={step}
              data-testid="playground-trace"
              aria-live="polite"
              className="animate-fade-up mt-4 min-h-10 text-sm text-foreground"
            >
              {frame.msg}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  setPlaying(false);
                  setStep((s) => Math.max(0, s - 1));
                }}
                disabled={step === 0}
                aria-label="Previous step"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                onClick={() => {
                  if (playing) setPlaying(false);
                  else {
                    if (step >= frames.length - 1) setStep(0);
                    setPlaying(true);
                  }
                }}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause /> : <Play />}
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  setPlaying(false);
                  setStep(0);
                }}
                aria-label="Start again"
              >
                <RotateCcw />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  setPlaying(false);
                  setStep((s) => Math.min(frames.length - 1, s + 1));
                }}
                disabled={step >= frames.length - 1}
                aria-label="Next step"
              >
                <ChevronRight />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                aria-label="Jump to result"
                disabled={step >= frames.length - 1}
                onClick={() => {
                  setPlaying(false);
                  setStep(frames.length - 1);
                }}
              >
                <ChevronsRight />
              </Button>

              <div className="mx-1 hidden h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:block">
                <Progress
                  value={((step + 1) / frames.length) * 100}
                  className="h-1.5"
                />
              </div>

              {onOpenPattern && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onOpenPattern(pattern.id)}
                >
                  <ListChecks className="size-4" />
                  Open the lesson
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-border p-4 lg:flex-row">
            <div className="code-surface min-w-0 flex-1 rounded-lg p-3">
              <p className="mb-2 px-1 text-[10px] font-bold tracking-wider text-code-foreground/75 uppercase">
                The code · line {frame.line + 1}
              </p>
              <pre className="overflow-x-auto font-mono text-[12px] leading-6">
                {visual.code.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 rounded px-2",
                      i === frame.line
                        ? "bg-primary text-primary-foreground"
                        : "text-code-foreground/80",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 shrink-0 text-right",
                        i === frame.line ? "opacity-80" : "opacity-55",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="whitespace-pre">{l}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>

        <p className="px-1 text-xs text-muted-foreground">
          The highlighted line is the line that produced this frame. Step
          through until the code and the picture agree — that is the moment the
          pattern is actually yours.
        </p>
      </div>
    </div>
  );
}
