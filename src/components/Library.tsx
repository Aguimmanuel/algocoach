import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PATTERNS, type Level, type Pattern } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { useRevealStagger } from "../hooks/useReveal";
import { cn } from "@/lib/utils";
import PatternDetail from "./PatternDetail";
import { Input } from "./ui/input";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface Props {
  learned: string[];
  onToggleLearned: (id: string) => void;
  /** jump to this pattern's animation */
  onVisualize?: (id: string) => void;
  initialId?: string;
}

const LEVELS: { level: Level; blurb: string }[] = [
  { level: "Beginner", blurb: "Start here" },
  { level: "Intermediate", blurb: "After the basics" },
  { level: "Advanced", blurb: "Bigger ideas" },
];

/**
 * The pattern library.
 *
 * Nineteen patterns at once is a catalogue, not a lesson — you cannot tell what
 * to read next, and the list competes with the page you are actually reading.
 * So a level is chosen first and only that level's patterns are listed: nine
 * rows instead of nineteen, each one a decision you can actually make. Search
 * deliberately ignores the level filter, because searching is the one time you
 * already know the thing you are looking for.
 */
export default function Library({ learned, onToggleLearned, onVisualize, initialId }: Props) {
  const initial = PATTERNS.find((p) => p.id === initialId);
  const [level, setLevel] = useState<Level>(initial?.level ?? "Beginner");
  const [selectedId, setSelectedId] = useState(initialId ?? PATTERNS[0].id);
  const [query, setQuery] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialId) return;
    const p = PATTERNS.find((x) => x.id === initialId);
    if (!p) return;
    setSelectedId(initialId);
    setLevel(p.level);
  }, [initialId]);

  const searching = query.trim().length > 0;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return PATTERNS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.drills.some((d) => d.toLowerCase().includes(q)) ||
        p.keywords.some(([k]) => k.includes(q)),
    );
  }, [query]);

  const visible: Pattern[] = matches ?? PATTERNS.filter((p) => p.level === level);
  const selected = PATTERNS.find((p) => p.id === selectedId) ?? visible[0] ?? PATTERNS[0];

  /** Choosing a level means choosing its first unwatched pattern, not nothing. */
  const chooseLevel = (next: Level) => {
    if (!next) return;
    setLevel(next);
    setQuery("");
    const list = PATTERNS.filter((p) => p.level === next);
    const current = list.find((p) => p.id === selectedId);
    if (!current) {
      const nextUp = list.find((p) => !learned.includes(p.id)) ?? list[0];
      if (nextUp) setSelectedId(nextUp.id);
    }
  };

  const select = (id: string) => {
    const pattern = PATTERNS.find((p) => p.id === id);
    if (!pattern) return;
    setSelectedId(id);
    // Keep the level and selected detail consistent when a search result or
    // prerequisite opens a pattern outside the previously selected level.
    setLevel(pattern.level);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Staggered arrival, the same motion the learning path uses — re-run whenever
  // the visible set changes so a filtered list animates rather than swapping.
  const detailRef = useRevealStagger<HTMLDivElement>(50, [selectedId]);

  const doneInLevel = PATTERNS.filter((p) => p.level === level && learned.includes(p.id)).length;
  const totalInLevel = PATTERNS.filter((p) => p.level === level).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {/* pick a level first — one level's worth of patterns, never all of them */}
        <ToggleGroup
          type="single"
          value={level}
          onValueChange={(v) => chooseLevel(v as Level)}
          variant="outline"
          className="grid w-full grid-cols-3"
          disabled={searching}
        >
          {LEVELS.map(({ level: l }) => {
            const n = PATTERNS.filter((p) => p.level === l).length;
            const done = PATTERNS.filter((p) => p.level === l && learned.includes(p.id)).length;
            return (
              <ToggleGroupItem key={l} value={l} className="h-auto flex-col gap-0.5 py-2" aria-label={`${l}, ${done} of ${n} learned`}>
                <span className="text-xs font-semibold">{l}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {done}/{n}
                </span>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search all ${PATTERNS.length} patterns…`}
            className="h-10 rounded-full pr-9 pl-9"
          />
          {searching && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="press absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="mt-4 space-y-1.5">
          <p className="px-1 pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {searching ? (
              <>
                {visible.length} {visible.length === 1 ? "result" : "results"} for “{query.trim()}”
              </>
            ) : (
              <>
                {LEVELS.find((l) => l.level === level)?.level} ·{" "}
                <span className="font-medium tracking-normal normal-case">
                  {LEVELS.find((l) => l.level === level)?.blurb}
                </span>
              </>
            )}
          </p>

          {visible.map((p) => {
            const active = p.id === selected.id;
            const isLearned = learned.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => select(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  active
                    ? cn(COLORS[p.color].soft, COLORS[p.color].text, "font-semibold ring-1", COLORS[p.color].ring)
                    : isLearned
                      ? "text-foreground hover:bg-card hover:shadow-sm"
                      : "text-muted-foreground hover:bg-card hover:shadow-sm hover:text-foreground",
                )}
              >
                <span className="text-lg" aria-hidden>
                  {p.emoji}
                </span>
                <span className="min-w-0 flex-1 leading-tight">{p.name}</span>
                {isLearned && <span className="shrink-0 text-xs font-semibold">✓</span>}
              </button>
            );
          })}

          {visible.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">
              Nothing matches “{query.trim()}”. Try a clue instead — “sorted”, “window”, “graph”.
            </p>
          )}

          {!searching && (
            <p className="px-1 pt-1 text-xs text-muted-foreground">
              {doneInLevel} of {totalInLevel} learned at this level
            </p>
          )}
        </div>
      </aside>

      <div ref={topRef} className="min-w-0 scroll-mt-24">
        <div ref={detailRef} className="reveal">
          <PatternDetail
            key={selected.id}
            pattern={selected}
            learned={learned.includes(selected.id)}
            onToggleLearned={() => onToggleLearned(selected.id)}
            onOpenPattern={select}
            onVisualize={onVisualize ? () => onVisualize(selected.id) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
