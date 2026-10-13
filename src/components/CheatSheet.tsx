import { SIZE_BUCKETS } from "../data/constraints";
import { PATTERN_MAP } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { useRevealStagger } from "../hooks/useReveal";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";

interface Props {
  onOpenPattern: (id: string) => void;
}

const CLUES: [string, string[]][] = [
  ["“Sorted array”", ["binary-search", "two-pointers"]],
  ["“Contiguous subarray / substring”", ["sliding-window", "prefix-sum"]],
  ["“Number of ways”", ["dp"]],
  ["“Generate all / list all”", ["backtracking"]],
  ["“Shortest path / min steps” (equal cost)", ["bfs"]],
  ["“Cheapest route” (weights)", ["dijkstra"]],
  ["“Top K / K-th largest”", ["heap"]],
  ["“Duplicates / frequency / seen before”", ["hashmap"]],
  ["“Valid brackets / next greater”", ["stack"]],
  ["“Intervals / overlapping”", ["sorting", "greedy"]],
  ["“Connected components / islands”", ["dfs", "union-find"]],
  ["“Minimum X such that…”", ["binary-search"]],
  ["“Many range-sum queries”", ["prefix-sum"]],
  ["“Maximum non-conflicting picks”", ["greedy"]],
];

// Weight = how the cost grows. Rendered as a monotonic grey ramp: the darker
// the bar, the more expensive the approach. No red here — a slow algorithm is
// a trade-off, not an error.
const GROWTH = [
  { name: "O(1)", w: 3, note: "Constant — a lookup", color: "bg-border" },
  { name: "O(log n)", w: 8, note: "Halving — binary search", color: "bg-border" },
  { name: "O(n)", w: 25, note: "One pass", color: "bg-muted" },
  { name: "O(n log n)", w: 40, note: "Sorting", color: "bg-muted" },
  { name: "O(n²)", w: 65, note: "Nested loops", color: "bg-muted-foreground" },
  { name: "O(2ⁿ)", w: 85, note: "All subsets", color: "bg-primary" },
  { name: "O(n!)", w: 100, note: "All orderings", color: "bg-primary" },
];

export default function CheatSheet({ onOpenPattern }: Props) {
  // Same arrival as the learning path: sections and rows come in as you reach
  // them, so a long reference page reads as a sequence instead of a slab.
  const pageRef = useRevealStagger<HTMLDivElement>(45);
  const clueRef = useRevealStagger<HTMLUListElement>(28);
  const growthRef = useRevealStagger<HTMLDivElement>(55);

  return (
    <div ref={pageRef} className="space-y-8">
      <section className="reveal surface rounded-xl p-6">
        <h2 className="text-xl font-bold text-foreground">📏 Constraint → complexity decoder</h2>
        <p className="mt-1 text-muted-foreground">
          A computer does roughly <strong>10⁸ simple operations per second</strong>. Read the maximum n in the question, and you instantly know what speed is allowed.
        </p>
        <div className="mt-5 rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>If max n is…</TableHead>
                <TableHead>Aim for</TableHead>
                <TableHead>What it means</TableHead>
                <TableHead>Think about</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SIZE_BUCKETS.map((b) => (
                <TableRow key={b.id} className="reveal align-top">
                  <TableCell className="font-mono font-semibold">{b.label}</TableCell>
                  <TableCell className="font-bold">{b.complexity}</TableCell>
                  <TableCell className="text-muted-foreground">{b.meaning}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {b.patterns.map((id) => {
                        const p = PATTERN_MAP[id];
                        return (
                          <Button
                            key={id}
                            variant="outline"
                            size="xs"
                            onClick={() => onOpenPattern(id)}
                          >
                            {p.name.split(" (")[0]}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="reveal grid gap-8 lg:grid-cols-2">
        <div className="surface rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground">🗣️ Clue phrase → pattern</h2>
          <p className="mt-1 text-sm text-muted-foreground">Train your eyes: certain words almost always point to certain tools.</p>
          <ul ref={clueRef} className="mt-4 divide-y divide-border">
            {CLUES.map(([phrase, ids]) => (
              <li key={phrase} className="reveal flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-medium text-foreground">{phrase}</span>
                <span className="flex flex-wrap gap-1.5">
                  {ids.map((id) => {
                    const p = PATTERN_MAP[id];
                    return (
                      <button
                        key={id}
                        onClick={() => onOpenPattern(id)}
                        className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1 hover:opacity-80", COLORS[p.color].soft, COLORS[p.color].text, COLORS[p.color].ring)}
                      >
                        {p.emoji} {p.name.split(" (")[0]}
                      </button>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-8">
          <div className="surface rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground">📊 How fast do they grow?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Bar length = how quickly the work explodes as n grows.</p>
            <div ref={growthRef} className="mt-4 space-y-3">
              {GROWTH.map((g) => (
                <div key={g.name} className="reveal flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-sm font-semibold text-muted-foreground">{g.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", g.color)} style={{ width: `${g.w}%` }} />
                  </div>
                  <span className="hidden w-36 shrink-0 text-xs text-muted-foreground sm:block">{g.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="surface rounded-xl p-6">
            <h2 className="text-xl font-bold text-foreground">🧠 Getting stuck? Try this</h2>
            <ul className="mt-3 space-y-2.5 text-muted-foreground">
              {[
                "Solve a tiny example by hand and notice what YOU do.",
                "Write the brute force. Name the repeated work.",
                "Can sorting the input make the problem simpler?",
                "Can a hash map replace an inner loop?",
                "Can you solve the problem for n − 1 and extend it? (recursion / DP)",
                "Can you guess the answer and verify it quickly? (binary search)",
                "Draw it. Arrays, trees and grids are easier on paper.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="text-muted-foreground">→</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
