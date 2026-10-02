import { useEffect, useMemo, useRef, useState } from "react";
import { PATTERNS, type Level } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "../utils/cn";
import PatternDetail from "./PatternDetail";

interface Props {
  learned: string[];
  onToggleLearned: (id: string) => void;
  initialId?: string;
}

const LEVELS: { level: Level; blurb: string }[] = [
  { level: "Beginner", blurb: "Start here" },
  { level: "Intermediate", blurb: "After the basics" },
  { level: "Advanced", blurb: "Bigger ideas" },
];

export default function Library({ learned, onToggleLearned, initialId }: Props) {
  const [selectedId, setSelectedId] = useState(initialId ?? PATTERNS[0].id);
  const [query, setQuery] = useState("");
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PATTERNS;
    return PATTERNS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.drills.some((d) => d.toLowerCase().includes(q)) ||
        p.keywords.some(([k]) => k.includes(q)),
    );
  }, [query]);

  const selected = PATTERNS.find((p) => p.id === selectedId) ?? PATTERNS[0];

  const select = (id: string) => {
    setSelectedId(id);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patterns, clues, drills…"
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          />
        </div>
        <div className="mt-4 space-y-5">
          {LEVELS.map(({ level, blurb }) => {
            const items = filtered.filter((p) => p.level === level);
            if (items.length === 0) return null;
            return (
              <div key={level}>
                <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  {level} · <span className="font-medium normal-case tracking-normal">{blurb}</span>
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                  {items.map((p) => {
                    const active = p.id === selected.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => select(p.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                          active ? cn(COLORS[p.color].soft, COLORS[p.color].text, "font-semibold ring-1", COLORS[p.color].ring) : "text-slate-600 hover:bg-white hover:shadow-sm",
                        )}
                      >
                        <span className="text-lg">{p.emoji}</span>
                        <span className="flex-1 leading-tight">{p.name}</span>
                        {learned.includes(p.id) && <span className="text-slate-900">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="px-1 text-sm text-slate-500">Nothing matches "{query}".</p>}
        </div>
      </aside>

      <div ref={topRef} className="min-w-0 scroll-mt-24">
        <PatternDetail
          key={selected.id}
          pattern={selected}
          learned={learned.includes(selected.id)}
          onToggleLearned={() => onToggleLearned(selected.id)}
          onOpenPattern={select}
        />
      </div>
    </div>
  );
}
