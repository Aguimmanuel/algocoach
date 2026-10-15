export interface SizeBucket {
  id: string;
  label: string;
  /** upper bound of n for this bucket */
  max: number;
  complexity: string;
  meaning: string;
  patterns: string[];
}

export const SIZE_BUCKETS: SizeBucket[] = [
  {
    id: "tiny",
    label: "n ≤ 12",
    max: 12,
    complexity: "O(n!)",
    meaning:
      "Tiny input. The author expects you to try every ordering/arrangement.",
    patterns: ["backtracking", "brute"],
  },
  {
    id: "small",
    label: "n ≤ 25",
    max: 25,
    complexity: "O(2ⁿ)",
    meaning: "Small input. Trying every subset / yes-no choice is allowed.",
    patterns: ["backtracking", "dp", "brute"],
  },
  {
    id: "cubic",
    label: "n ≤ 500",
    max: 500,
    complexity: "O(n³)",
    meaning:
      "Three nested loops are OK. Often a 2-D / 3-D DP table or all-pairs graph work.",
    patterns: ["dp", "brute", "dijkstra"],
  },
  {
    id: "quad",
    label: "n ≤ 5,000",
    max: 5000,
    complexity: "O(n²)",
    meaning:
      "Two nested loops are OK. Typical for 2-D DP or checking every pair.",
    patterns: ["dp", "brute", "bfs", "dfs"],
  },
  {
    id: "nlogn",
    label: "n ≤ 10⁵",
    max: 100000,
    complexity: "O(n log n)",
    meaning:
      "You need something smart: sort, heap, binary search, or a single clever pass.",
    patterns: [
      "sorting",
      "heap",
      "binary-search",
      "greedy",
      "sliding-window",
      "hashmap",
      "union-find",
      "dijkstra",
    ],
  },
  {
    id: "linear",
    label: "n ≤ 10⁶",
    max: 1000000,
    complexity: "O(n)",
    meaning:
      "One pass only. Think hash map, two pointers, sliding window, prefix sums, stack.",
    patterns: [
      "two-pointers",
      "sliding-window",
      "hashmap",
      "prefix-sum",
      "stack",
    ],
  },
  {
    id: "log",
    label: "n ≥ 10⁹",
    max: Infinity,
    complexity: "O(log n) or O(1)",
    meaning:
      "You cannot even loop over n. Look for binary search on the answer or a math formula.",
    patterns: ["binary-search"],
  },
];

export function bucketForN(n: number): SizeBucket {
  return (
    SIZE_BUCKETS.find((b) => n <= b.max) ??
    SIZE_BUCKETS[SIZE_BUCKETS.length - 1]
  );
}

export const FRAMEWORK = [
  {
    title: "Understand",
    emoji: "🧠",
    prompts: [
      "Restate the problem in one sentence, in your own words.",
      "What is the exact INPUT? What is the exact OUTPUT?",
      "Write 1–2 tiny examples by hand and solve them as a human.",
    ],
  },
  {
    title: "Constrain",
    emoji: "📏",
    prompts: [
      "How big can n get? That tells you the maximum time complexity allowed.",
      "Are there special properties — sorted, only positives, distinct, small alphabet?",
      "List edge cases: empty, one element, all equal, negative numbers.",
    ],
  },
  {
    title: "Match",
    emoji: "🧩",
    prompts: [
      "Which key words / signals does the question contain?",
      "Which 1–2 patterns fit those signals AND the constraint size?",
      "Start with the simplest brute force — what is its cost, and where is the waste?",
    ],
  },
  {
    title: "Plan",
    emoji: "🗺️",
    prompts: [
      "Write the steps in plain English before any code.",
      "Hand-trace your plan on your example from step 1.",
      "State the time and space complexity you expect.",
    ],
  },
  {
    title: "Review",
    emoji: "🔍",
    prompts: [
      "Run your edge cases through the plan / code.",
      "Is there an off-by-one risk at the boundaries?",
      "Could any step be made faster with a better data structure?",
    ],
  },
];
