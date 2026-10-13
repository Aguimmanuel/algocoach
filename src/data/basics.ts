/**
 * The absolute basics, written for someone who has never studied algorithms.
 *
 * Kept separate from the pattern library because this is the layer *under* the
 * patterns: it explains what the notation means and which order to learn in.
 */

export interface SpeedRow {
  bigO: string;
  plainName: string;
  /** what it means in one sentence */
  meaning: string;
  /** everyday picture */
  analogy: string;
  /** what it looks like in code */
  shape: string;
  /** does it still work when n gets big? */
  verdict: "great" | "fine" | "careful" | "too slow";
}

export const SPEED_TABLE: SpeedRow[] = [
  {
    bigO: "O(1)",
    plainName: "Instant",
    meaning: "The work is the same whether you have 10 items or 10 million.",
    analogy: "Looking at your watch. Always one glance.",
    shape: "Ask a dictionary for one key. Do one arithmetic step.",
    verdict: "great",
  },
  {
    bigO: "O(log n)",
    plainName: "Halving",
    meaning: "Every step throws away half of what's left.",
    analogy: "Guessing a number from 1–100. 100 becomes 50, then 25, then 13… about 7 guesses.",
    shape: "Cut the search space in half each loop.",
    verdict: "great",
  },
  {
    bigO: "O(n)",
    plainName: "One pass",
    meaning: "You look at each item about once.",
    analogy: "Reading every page of a book once.",
    shape: "One loop over the array.",
    verdict: "great",
  },
  {
    bigO: "O(n log n)",
    plainName: "Efficient sorting",
    meaning: "A bit more than one pass, but nowhere near n².",
    analogy: "Sorting a hand of cards by repeatedly splitting and merging.",
    shape: "Calling .sort(), or a heap in a loop.",
    verdict: "fine",
  },
  {
    bigO: "O(n²)",
    plainName: "Every pair",
    meaning: "For each item, you look at every other item.",
    analogy: "Everyone in a room shaking hands with everyone else.",
    shape: "A loop inside a loop.",
    verdict: "careful",
  },
  {
    bigO: "O(2ⁿ)",
    plainName: "Every combination",
    meaning: "Every item either is or isn't included — twice as much work per extra item.",
    analogy: "Every on/off setting of n light switches.",
    shape: "Recursion that branches into two at each step.",
    verdict: "too slow",
  },
  {
    bigO: "O(n!)",
    plainName: "Every arrangement",
    meaning: "Every possible ordering of everything.",
    analogy: "Every way to seat 10 guests at a table — more than 3 million orderings.",
    shape: "Recursion that tries each remaining choice in turn.",
    verdict: "too slow",
  },
];

export const VERDICT_STYLE: Record<SpeedRow["verdict"], { label: string; className: string }> = {
  great: { label: "Scales forever", className: "bg-slate-900 text-white" },
  fine: { label: "Fine in practice", className: "bg-slate-200 text-slate-800" },
  careful: { label: "Only for small n", className: "bg-slate-100 text-slate-700" },
  "too slow": { label: "Very small n only", className: "bg-slate-100 text-slate-500" },
};

/** The three-step habit that makes constraints useful. */
export const CONSTRAINT_STEPS: { step: string; detail: string; example: string }[] = [
  {
    step: "Find n",
    detail: "n is how many items the problem gives you. Look in the last line of the question.",
    example: '"1 ≤ n ≤ 10⁵" → n can be 100,000. That number is 10⁵.',
  },
  {
    step: "Work out your budget",
    detail: "A computer does about 10⁸ simple steps per second. Divide your budget by n.",
    example: "10⁵ items → about 1,000 steps per item available. That's plenty.",
  },
  {
    step: "Pick an approach that fits",
    detail: "If a loop inside a loop would be too slow, the answer must avoid it.",
    example: "n = 10⁵ → O(n²) means 10¹⁰ steps ≈ 100 seconds. Too slow. Aim for O(n log n).",
  },
];

/** The order to learn things. Each step unlocks the next. */
export interface PathStep {
  patternId?: string;
  title: string;
  detail: string;
  /** shown as "you'll know you're ready when" */
  check: string;
}

export const LEARNING_PATH: PathStep[] = [
  {
    title: "Read a problem like a programmer",
    detail:
      "Before any algorithm: write down the exact input, the exact output, and solve one tiny example by hand. Most people who feel stuck are stuck here, not on the algorithm.",
    check: "You can state the input and output in one sentence each, without looking at the question.",
  },
  {
    patternId: "brute",
    title: "Learn to write brute force on purpose",
    detail:
      "Try every possibility. It's slow, but it's correct, and it always gets you unstuck. It also shows you exactly which work is being repeated — which is where the real answer hides.",
    check: "You can write the slow version of a problem without freezing, and say what its cost is.",
  },
  {
    title: "Learn to read Big-O",
    detail:
      "One loop is O(n). A loop inside a loop is O(n²). Halving is O(log n). That's 90% of what you need to start.",
    check: "You can look at someone's loop structure and say roughly how fast it is.",
  },
  {
    patternId: "hashmap",
    title: "Meet your most useful tool: the hash map",
    detail:
      "Ask 'have I seen this?' and get an instant yes/no. This one container turns slow searches into instant lookups, and it appears in more interview problems than anything else.",
    check: "You reach for a dictionary before writing a second nested loop.",
  },
  {
    patternId: "two-pointers",
    title: "Pointers: walk the data from both ends",
    detail:
      "Two bookmarks instead of two nested loops. Most 'find a pair that…' problems collapse from O(n²) to O(n) once you can do this.",
    check: "You can explain why two pointers never miss the answer.",
  },
  {
    patternId: "sliding-window",
    title: "Windows: look at a chunk, then slide it",
    detail:
      "For anything about a contiguous chunk — a subarray or substring — you keep a moving frame and adjust its edges instead of re-checking every chunk from scratch.",
    check: "You can say what your window represents and what makes it invalid.",
  },
  {
    patternId: "binary-search",
    title: "Binary search: throw away half",
    detail:
      "Only works on sorted data, but it's the difference between 100,000 checks and 17. Also works on answers, not just arrays.",
    check: "You can write it without an off-by-one panic, and say why it's O(log n).",
  },
  {
    patternId: "prefix-sum",
    title: "Prefix sums: add once, answer forever",
    detail:
      "Precompute running totals so any range total is a single subtraction. The clearest example of 'do the work once, reuse it'.",
    check: "You see that a range total is just two running totals subtracted.",
  },
  {
    patternId: "sorting",
    title: "Sort first, then look at neighbours",
    detail:
      "Sorting is cheap (O(n log n)) and it puts whatever you're looking for right next to its answer. A huge share of problems become obvious after sorting.",
    check: '"Would sorting make this easy?" becomes one of your first questions.',
  },
  {
    patternId: "stack",
    title: "Stacks: handle unfinished business",
    detail:
      "Last in, first out. Perfect for matching brackets, and for 'what's the next bigger item?' problems.",
    check: "You ask 'what do I need to remember until later?' and reach for a stack.",
  },
  {
    patternId: "bfs",
    title: "BFS: explore outward in rings",
    detail:
      "Walk a grid or graph one step at a time, layer by layer. Because you explore in rings, the first time you reach something is the shortest way there.",
    check: "You can explain why BFS finds the shortest path when all steps cost the same.",
  },
  {
    patternId: "dfs",
    title: "DFS: go deep, then back up",
    detail:
      "Commit to a direction and follow it to the end before trying the next. The natural way to explore everything, and your first taste of recursion as a tool.",
    check: "You can describe what happens on the way back up the recursion.",
  },
  {
    patternId: "greedy",
    title: "Greedy: take the obvious best choice",
    detail:
      "Sometimes the locally best choice is globally best. It's fast and simple — but you must test it against a counter-example before trusting it.",
    check: "You try to break your own greedy rule before writing it.",
  },
  {
    patternId: "backtracking",
    title: "Backtracking: build answers, undo dead ends",
    detail:
      "Build a solution one choice at a time. When a choice leads nowhere, undo it and try another. This is how you produce all possible answers.",
    check: "You can talk through the 'undo' step of your recursion.",
  },
  {
    patternId: "heap",
    title: "Heaps: always know the best item",
    detail:
      "When you only need the top K, or the running smallest, a heap gives you the best item instantly without sorting everything.",
    check: "You use a heap instead of sorting when you only need the top few.",
  },
  {
    patternId: "dp",
    title: "Dynamic Programming: solve small, remember, build up",
    detail:
      "The hardest idea for beginners, and the one that needs everything above it. Write the plain recursion first, notice the repeated calls, then remember them. Don't start here.",
    check: "You can name the repeated sub-problem in your own recursion.",
  },
  {
    patternId: "union-find",
    title: "Union-Find: which group is this in?",
    detail:
      "Tracks groups as connections arrive, and answers 'are these two in the same group?' almost instantly.",
    check: "You see that 'connected?' is a grouping question, not a search.",
  },
  {
    patternId: "dijkstra",
    title: "Dijkstra: the cheapest route",
    detail:
      "BFS when the moves cost different amounts. Always continue from the cheapest route found so far.",
    check: "You know why BFS alone is wrong when steps have different costs.",
  },
];
