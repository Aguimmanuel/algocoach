import { PATTERNS, type Pattern } from "../data/patterns";

export interface Candidate {
  pattern: Pattern;
  score: number;
  /** 0-100 relative strength */
  strength: number;
  matched: string[];
}

export interface QuestionKind {
  label: string;
  emoji: string;
  hint: string;
}

export interface Analysis {
  candidates: Candidate[];
  detectedN: number | null;
  kinds: QuestionKind[];
}

const SUPERSCRIPTS: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, s: string) => "10^" + s.split("").map((c) => SUPERSCRIPTS[c] ?? "").join(""))
    .replace(/10\s*\*\*\s*(\d+)/g, "10^$1")
    .replace(/1e(\d+)/g, "10^$1")
    .replace(/≤/g, "<=");
}

function parseBound(raw: string): number | null {
  const s = raw.replace(/\s/g, "");
  const pow = s.match(/^10\^(\d+)$/);
  if (pow) return Math.pow(10, parseInt(pow[1], 10));
  const num = parseInt(s.replace(/,/g, ""), 10);
  return Number.isFinite(num) ? num : null;
}

export function detectN(text: string): number | null {
  const t = normalize(text);
  const re = /\b(?:n|m|k|length|size|nums|arr|array|string|s|len)\b[^\n;\[]{0,40}?(?:<=|<|at most|up to|not exceed|no more than)\s*(10\s*\^\s*\d+|\d[\d,]*)/g;
  let best: number | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const v = parseBound(m[1]);
    if (v !== null && v >= 2 && (best === null || v > best)) best = v;
  }
  return best;
}

const KIND_RULES: { test: RegExp; kind: QuestionKind }[] = [
  {
    test: /(all (possible|the)|list all|generate|return all|every (possible )?(combination|permutation|subset))/,
    kind: { label: "Enumerate all answers", emoji: "📋", hint: "You must produce every valid answer, not just one value → think backtracking." },
  },
  {
    test: /(number of ways|how many ways|count the (number of )?ways|distinct ways)/,
    kind: { label: "Counting ways", emoji: "🔢", hint: "Counting WAYS (not listing them) usually means dynamic programming." },
  },
  {
    test: /(minimum|maximum|smallest|largest|shortest|longest|fewest|most|least|optimal|cheapest)/,
    kind: { label: "Optimization (min / max)", emoji: "📈", hint: "Ask: can I always take the best local choice (greedy)? Or must I compare choices (DP)? Is the answer monotonic (binary search)?" },
  },
  {
    test: /(return true|return false|determine (if|whether)|is it possible|can you|whether|valid)/,
    kind: { label: "Yes / No decision", emoji: "✅", hint: "The output is a boolean. Look for a check that can fail early." },
  },
  {
    test: /(subarray|substring|contiguous|consecutive)/,
    kind: { label: "Contiguous range", emoji: "↔️", hint: "A contiguous chunk → sliding window or prefix sums." },
  },
  {
    test: /(grid|matrix|maze|board|island|2d|2-d)/,
    kind: { label: "Grid / matrix", emoji: "🔲", hint: "Cells are nodes, moves are edges → BFS (shortest) or DFS (explore)." },
  },
  {
    test: /(tree|node|graph|edge|vertex|vertices)/,
    kind: { label: "Tree / graph", emoji: "🌳", hint: "Model nodes and edges. Shortest steps → BFS, explore everything → DFS." },
  },
  {
    test: /(sorted|ascending|non-decreasing)/,
    kind: { label: "Sorted input", emoji: "📶", hint: "Sorted input is a gift: binary search or two pointers." },
  },
  {
    test: /(k-?th|top k|k (largest|smallest|closest|most))/,
    kind: { label: "Top-K / K-th item", emoji: "🏅", hint: "Keeping only the best K items → heap." },
  },
];

export function analyze(text: string): Analysis {
  const t = normalize(text);
  const candidates: Candidate[] = [];

  for (const pattern of PATTERNS) {
    let score = 0;
    const matched: string[] = [];
    for (const [phrase, weight] of pattern.keywords) {
      if (t.includes(phrase)) {
        score += weight;
        matched.push(phrase);
      }
    }
    if (score > 0) candidates.push({ pattern, score, strength: 0, matched });
  }

  candidates.sort((a, b) => b.score - a.score);
  const ref = Math.max(candidates[0]?.score ?? 0, 6);
  candidates.forEach((c) => (c.strength = Math.min(100, Math.round((c.score / ref) * 100))));

  const kinds = KIND_RULES.filter((r) => r.test.test(t)).map((r) => r.kind);

  return { candidates: candidates.slice(0, 4), detectedN: detectN(text), kinds };
}

export const SAMPLE_QUESTIONS: { title: string; text: string }[] = [
  {
    title: "Pair that adds up",
    text: "Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target. 2 <= nums.length <= 10^4.",
  },
  {
    title: "Longest unique substring",
    text: "Given a string s, find the length of the longest substring without repeating characters. 0 <= s.length <= 5 * 10^4.",
  },
  {
    title: "Stairs",
    text: "You are climbing a staircase. It takes n steps to reach the top. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top? 1 <= n <= 45",
  },
  {
    title: "Maze steps",
    text: "Given an m x n grid maze with walls, return the minimum number of steps to reach the exit from the entrance. 1 <= m, n <= 100",
  },
  {
    title: "All subsets",
    text: "Given an integer array nums of unique elements, return all possible subsets. 1 <= nums.length <= 10",
  },
  {
    title: "Top frequent",
    text: "Given an integer array nums and an integer k, return the k most frequent elements. n <= 10^5",
  },
];
