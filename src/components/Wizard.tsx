import { useState } from "react";
import { PATTERN_MAP } from "../data/patterns";
import { COLORS } from "../lib/colors";
import { cn } from "../utils/cn";

interface Option {
  label: string;
  next?: string;
  leaf?: string;
  why?: string;
}
interface Node {
  q: string;
  sub?: string;
  options: Option[];
}

const TREE: Record<string, Node> = {
  start: {
    q: "What does the question want back from you?",
    sub: "Look at the very last sentence of the question.",
    options: [
      { label: "A list of ALL valid answers / arrangements", leaf: "backtracking", why: "When every valid arrangement must be produced, you build answers piece by piece and undo choices." },
      { label: "A single value: a count, a min / max, or yes / no", next: "value" },
      { label: "A path, route, or number of steps through a grid / graph / tree", next: "graph" },
      { label: "Find a specific item, pair or position in a list / string", next: "find" },
      { label: "The best K items, or handle items in some priority / order", next: "order" },
    ],
  },
  value: {
    q: "Is the answer about a contiguous chunk (a subarray or substring)?",
    options: [
      { label: "Yes, a contiguous chunk", next: "chunk" },
      { label: "No, it's about the whole input or about choices", next: "choices" },
    ],
  },
  chunk: {
    q: "What are you doing with those chunks?",
    options: [
      { label: "Answering many range-sum queries, or counting chunks with an exact sum", leaf: "prefix-sum", why: "Precompute running totals so any range sum becomes one subtraction." },
      { label: "Finding the longest / shortest / best chunk that satisfies a condition", leaf: "sliding-window", why: "A window you can expand and shrink while keeping a running summary avoids recomputation." },
    ],
  },
  choices: {
    q: "Which description feels closest?",
    sub: "Pick the one that matches your gut — you can always come back.",
    options: [
      { label: "'Number of ways' or choices change what's possible later and the same sub-problems repeat", leaf: "dp", why: "Repeated sub-problems + optimal / counting answers = remember small answers (DP)." },
      { label: "An obvious 'always take the best-looking option' rule seems to work", leaf: "greedy", why: "A locally best choice that is never regretted. Test it against small counter-examples first." },
      { label: "The answer is a number X, and I can test 'does X work?' (bigger X is always easier or always harder)", leaf: "binary-search", why: "A monotonic yes/no check lets you binary-search on the ANSWER itself." },
      { label: "The input is tiny (n ≤ 20) — I could try everything", leaf: "brute", why: "With a small input, a correct exhaustive solution is a perfectly valid answer." },
    ],
  },
  graph: {
    q: "What kind of moves / connections are there?",
    options: [
      { label: "All moves cost the same and I want the FEWEST steps", leaf: "bfs", why: "BFS explores in rings, so the first time it reaches a node is the shortest way." },
      { label: "Moves have different costs / weights / times", leaf: "dijkstra", why: "BFS with a priority queue: always expand the cheapest known route." },
      { label: "I just need to explore: is it reachable, count regions, tree depth / paths", leaf: "dfs", why: "Go deep, trust recursion to solve children, combine their answers." },
      { label: "Items join groups over time and I ask 'are these two connected?'", leaf: "union-find", why: "Union-Find merges groups and answers 'same group?' in near-constant time." },
    ],
  },
  find: {
    q: "What does the data look like?",
    options: [
      { label: "Sorted, and I'm looking for ONE target or a boundary", leaf: "binary-search", why: "Sorted + search = cut the space in half each time." },
      { label: "Sorted (or sortable) and I need a PAIR / triplet, or must work from both ends", leaf: "two-pointers", why: "Two pointers walking inward can rule out many combos with each move." },
      { label: "Unsorted: 'have I seen this?', counting, or finding a complement", leaf: "hashmap", why: "A dictionary replaces an inner search loop with an instant lookup." },
      { label: "Matching / nested things (brackets) or 'next bigger item'", leaf: "stack", why: "Whatever is most recent and unresolved gets handled first — LIFO." },
    ],
  },
  order: {
    q: "What is the order-related need?",
    options: [
      { label: "Top K, K-th largest/smallest, running min or max", leaf: "heap", why: "A heap gives you the best item in O(log n) without sorting everything." },
      { label: "Intervals, overlaps, closest values, 'sort then scan'", leaf: "sorting", why: "Sorting puts the relevant items next to each other." },
      { label: "Pick the maximum number of non-conflicting things / schedule", leaf: "greedy", why: "Sort by the right key, then pick whatever doesn't conflict." },
    ],
  },
};

interface Props {
  onOpenPattern: (id: string) => void;
}

export default function Wizard({ onOpenPattern }: Props) {
  const [path, setPath] = useState<{ node: string; label: string }[]>([]);
  const [current, setCurrent] = useState("start");
  const [leaf, setLeaf] = useState<{ id: string; why: string } | null>(null);

  const node = TREE[current];

  const pick = (opt: Option) => {
    setPath((p) => [...p, { node: current, label: opt.label }]);
    if (opt.leaf) setLeaf({ id: opt.leaf, why: opt.why ?? "" });
    else if (opt.next) setCurrent(opt.next);
  };

  const back = () => {
    if (path.length === 0) return;
    const prev = path[path.length - 1];
    setPath((p) => p.slice(0, -1));
    setCurrent(prev.node);
    setLeaf(null);
  };

  const restart = () => {
    setPath([]);
    setCurrent("start");
    setLeaf(null);
  };

  const pattern = leaf ? PATTERN_MAP[leaf.id] : null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">🧭 Not sure? Let's reason it out</h3>
          <p className="text-sm text-slate-500">Answer a few questions about your problem and I'll point to a pattern.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={back}
            disabled={path.length === 0}
            className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          >
            ← Back
          </button>
          <button onClick={restart} className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Restart
          </button>
        </div>
      </div>

      {path.length > 0 && (
        <ol className="mt-4 flex flex-wrap gap-2">
          {path.map((p, i) => (
            <li key={i} className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {i + 1}. {p.label}
            </li>
          ))}
        </ol>
      )}

      {!pattern ? (
        <div className="mt-5">
          <p className="text-lg font-semibold text-slate-900">{node.q}</p>
          {node.sub && <p className="mt-1 text-sm text-slate-500">{node.sub}</p>}
          <div className="mt-4 grid gap-2.5">
            {node.options.map((o) => (
              <button
                key={o.label}
                onClick={() => pick(o)}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-left text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <span>{o.label}</span>
                <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={cn("mt-5 rounded-2xl p-5 ring-1", COLORS[pattern.color].soft, COLORS[pattern.color].ring)}>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your best candidate</p>
          <p className={cn("mt-1 text-2xl font-bold", COLORS[pattern.color].text)}>
            {pattern.emoji} {pattern.name}
          </p>
          <p className="mt-2 text-slate-700">{leaf?.why}</p>
          <p className="mt-3 text-sm text-slate-600">
            Before you trust this: does the pattern's list of signals match your problem? If not, press Back and pick a different answer.
          </p>
          <button
            onClick={() => onOpenPattern(pattern.id)}
            className={cn("mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90", COLORS[pattern.color].solid)}
          >
            Teach me this pattern →
          </button>
        </div>
      )}
    </div>
  );
}
