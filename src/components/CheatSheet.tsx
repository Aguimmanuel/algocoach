import { SIZE_BUCKETS } from "../data/constraints";
import { PATTERN_MAP } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "../utils/cn";

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
  { name: "O(1)", w: 3, note: "Constant — a lookup", color: "bg-slate-200" },
  { name: "O(log n)", w: 8, note: "Halving — binary search", color: "bg-slate-300" },
  { name: "O(n)", w: 25, note: "One pass", color: "bg-slate-400" },
  { name: "O(n log n)", w: 40, note: "Sorting", color: "bg-slate-500" },
  { name: "O(n²)", w: 65, note: "Nested loops", color: "bg-slate-600" },
  { name: "O(2ⁿ)", w: 85, note: "All subsets", color: "bg-slate-700" },
  { name: "O(n!)", w: 100, note: "All orderings", color: "bg-slate-900" },
];

export default function CheatSheet({ onOpenPattern }: Props) {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-bold text-slate-900">📏 Constraint → complexity decoder</h2>
        <p className="mt-1 text-slate-600">
          A computer does roughly <strong>10⁸ simple operations per second</strong>. Read the maximum n in the question, and you instantly know what speed is allowed.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">If max n is…</th>
                <th className="py-2 pr-4">Aim for</th>
                <th className="py-2 pr-4">What it means</th>
                <th className="py-2">Think about</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_BUCKETS.map((b) => (
                <tr key={b.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-800">{b.label}</td>
                  <td className="py-3 pr-4 font-bold text-slate-900">{b.complexity}</td>
                  <td className="py-3 pr-4 text-slate-600">{b.meaning}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {b.patterns.map((id) => {
                        const p = PATTERN_MAP[id];
                        return (
                          <button
                            key={id}
                            onClick={() => onOpenPattern(id)}
                            className={cn("rounded-full px-2 py-0.5 text-xs font-medium ring-1 hover:opacity-80", COLORS[p.color].soft, COLORS[p.color].text, COLORS[p.color].ring)}
                          >
                            {p.name.split(" (")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-slate-900">🗣️ Clue phrase → pattern</h2>
          <p className="mt-1 text-sm text-slate-500">Train your eyes: certain words almost always point to certain tools.</p>
          <ul className="mt-4 divide-y divide-slate-100">
            {CLUES.map(([phrase, ids]) => (
              <li key={phrase} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-medium text-slate-800">{phrase}</span>
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
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">📊 How fast do they grow?</h2>
            <p className="mt-1 text-sm text-slate-500">Bar length = how quickly the work explodes as n grows.</p>
            <div className="mt-4 space-y-3">
              {GROWTH.map((g) => (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-mono text-sm font-semibold text-slate-700">{g.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full", g.color)} style={{ width: `${g.w}%` }} />
                  </div>
                  <span className="hidden w-36 shrink-0 text-xs text-slate-500 sm:block">{g.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold text-slate-900">🧠 Getting stuck? Try this</h2>
            <ul className="mt-3 space-y-2.5 text-slate-700">
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
                  <span className="text-slate-700">→</span>
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
