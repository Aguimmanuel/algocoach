import type { ColorName } from "../lib/colors";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export interface Pattern {
  id: string;
  name: string;
  emoji: string;
  color: ColorName;
  level: Level;
  tagline: string;
  /** the same idea with no jargon at all — the first thing a beginner should read */
  plain: string;
  analogy: string;
  signals: string[];
  /** [phrase, weight] — used by the question analyzer */
  keywords: [string, number][];
  idea: string;
  steps: string[];
  skeleton: string;
  time: string;
  space: string;
  pitfalls: string[];
  /** progressive Socratic hints — each one nudges a bit more, none give the answer */
  hints: string[];
  drills: string[];
  prerequisites?: string[];
}

export const PATTERNS: Pattern[] = [
  {
    id: "brute",
    name: "Brute Force & Simulation",
    emoji: "🔨",
    color: "slate",
    level: "Beginner",
    tagline: "Try everything, or act out the rules exactly as written.",
    /** the same idea with no jargon at all */
    plain: "Try every possibility and keep the answer. Slow, but always correct — and always your first move.",
    analogy:
      "Checking every key on a keyring until one opens the door. Slow, but always correct — and the best starting point for every problem.",
    signals: [
      "The input is very small (n ≤ 20, or ≤ 1000 for double loops)",
      "The statement describes a process: 'at each step, do X'",
      "You can't see any pattern yet — you just need a correct baseline",
    ],
    keywords: [
      ["simulate", 3],
      ["brute", 3],
      ["each step", 1.5],
      ["follow the rules", 2],
      ["every possible", 1],
      ["check each", 1],
      ["after k", 1],
      ["repeat", 1],
    ],
    idea:
      "Translate the problem statement literally into loops. Correctness first, speed second. A brute-force solution also gives you a way to test your fancy solution later.",
    steps: [
      "Write down what 'one attempt' looks like (one pair, one step, one candidate).",
      "Loop over every attempt.",
      "Check the condition and keep track of the best / count / answer.",
      "Compute the cost: how many attempts × cost per attempt?",
      "Ask: which work is being repeated? That repetition is where a better pattern hides.",
    ],
    skeleton: `answer = starting value
for each candidate in all candidates:
    if candidate satisfies the rule:
        update answer
return answer`,
    time: "Often O(n²) – O(n³)",
    space: "O(1)",
    pitfalls: [
      "Skipping brute force and freezing — always write the slow idea first.",
      "Ignoring the constraints, then submitting something that takes hours.",
      "Modifying a collection while looping over it.",
    ],
    hints: [
      "Forget speed. How would YOU solve a tiny example by hand, step by step?",
      "What does ONE attempt look like? Write it as a sentence.",
      "Count how many attempts exist. Is that number acceptable for the maximum n?",
      "If it is too slow, point at the exact thing you recompute again and again.",
    ],
    drills: ["Find all pairs with a given difference", "Simulate a robot walking on a grid", "FizzBuzz-style rule problems"],
  },
  {
    id: "hashmap",
    name: "Hash Map / Hash Set",
    emoji: "🗂️",
    color: "amber",
    level: "Beginner",
    tagline: "Trade memory for instant lookups.",
    /** the same idea with no jargon at all */
    plain: "Keep a lookup box of things you've already seen, so you never search the list twice.",
    analogy:
      "A coat-check desk. Instead of searching every coat on the rack, you hand over a ticket and get yours in one move.",
    signals: [
      "'Have I seen this before?' / duplicates / uniqueness",
      "Counting how often something appears (frequency)",
      "Finding a pair or partner that completes a target",
      "Grouping items by some shared property (anagrams)",
    ],
    keywords: [
      ["two sum", 4],
      ["duplicate", 3],
      ["frequency", 3],
      ["count of each", 3],
      ["anagram", 3],
      ["unique", 2],
      ["distinct", 2],
      ["occurrence", 2],
      ["pair", 1.5],
      ["seen", 1],
      ["group", 1.5],
      ["non-repeating", 3],
      ["majority", 2],
      ["indices", 1],
      ["lookup", 1.5],
      ["exists", 1],
      ["target", 1],
    ],
    idea:
      "Whenever an inner loop is only there to SEARCH for something, replace it with a dictionary lookup. You turn O(n) searching into O(1).",
    steps: [
      "Decide the KEY (what do you look up by?) and the VALUE (what do you need to remember?).",
      "Walk through the data once.",
      "For each item, ask the map: 'does what I need already exist?'",
      "Then store the current item so future items can find it.",
      "Mind the ORDER: check first, then insert (matters for duplicates and pairs).",
    ],
    skeleton: `map = empty dictionary
for each item in data:
    need = something computed from item
    if need is in map:
        use map[need]        // found a partner / duplicate
    map[item's key] = info   // remember for later items`,
    time: "O(n)",
    space: "O(n)",
    pitfalls: [
      "Inserting before checking — an element can pair with itself.",
      "Forgetting the key might be missing (default to 0 when counting).",
      "Using a mutable thing (like a list) as a key.",
    ],
    hints: [
      "Where is your brute force searching for something inside an inner loop?",
      "What exactly are you searching for — can it be computed from the current item?",
      "If you stored every earlier item in a dictionary, what would be the KEY?",
      "What would the VALUE need to be (a count, an index, a list)?",
    ],
    drills: ["Two Sum", "Contains Duplicate", "Valid Anagram", "Group Anagrams", "First Unique Character"],
  },
  {
    id: "two-pointers",
    name: "Two Pointers",
    emoji: "👉👈",
    color: "sky",
    level: "Beginner",
    tagline: "Two fingers moving through the data instead of two nested loops.",
    /** the same idea with no jargon at all */
    plain: "Put one finger at each end and walk them toward each other, instead of checking every pair.",
    analogy:
      "Two people walking toward each other along a corridor, meeting in the middle — each step eliminates part of the corridor.",
    signals: [
      "Sorted array (or you are allowed to sort it)",
      "Looking for a pair / triplet meeting a condition",
      "Palindromes, reversing, or working from both ends",
      "In-place modification: remove duplicates, move zeros",
    ],
    keywords: [
      ["sorted", 1.5],
      ["palindrome", 3],
      ["pair", 1.5],
      ["two numbers", 2],
      ["in-place", 2.5],
      ["in place", 2.5],
      ["remove duplicates", 2],
      ["reverse", 1.5],
      ["both ends", 3],
      ["triplet", 2],
      ["merge two", 2],
      ["container", 2],
      ["move zeroes", 3],
      ["move zeros", 3],
    ],
    idea:
      "Because of some order (sorted data, or a one-way scan), moving a pointer lets you PROVE a whole set of options is useless, so you never check them.",
    steps: [
      "Place pointers: usually both ends (left, right) or both at the start (slow, fast).",
      "Look at the pair of values under the pointers.",
      "Decide which pointer to move — and be able to explain WHY the other choices can't work.",
      "Stop when pointers cross.",
    ],
    skeleton: `left = 0
right = last index
while left < right:
    look at data[left] and data[right]
    if condition met:
        record / return
    else if we need a bigger value:
        left = left + 1
    else:
        right = right - 1`,
    time: "O(n) (O(n log n) if sorting first)",
    space: "O(1)",
    pitfalls: [
      "Using it on unsorted data when the order matters.",
      "Infinite loops: every iteration must move at least one pointer.",
      "Off-by-one: < versus <= in the loop condition.",
    ],
    hints: [
      "Is the data sorted — or can order help you decide what to throw away?",
      "Imagine one pointer at each end. What does the sum/comparison tell you?",
      "If the value is too big, which pointer movement could possibly make it smaller?",
      "When do the pointers stop? Think about what 'crossed' means.",
    ],
    drills: ["Valid Palindrome", "Two Sum II (sorted)", "3Sum", "Container With Most Water", "Move Zeroes"],
  },
  {
    id: "sliding-window",
    name: "Sliding Window",
    emoji: "🪟",
    color: "teal",
    level: "Beginner",
    tagline: "Slide a window across a sequence, updating instead of recomputing.",
    /** the same idea with no jargon at all */
    plain: "Look at a moving block of items instead of every possible block, and only nudge the edges.",
    analogy:
      "Looking through a train window: as the train moves, one new thing enters on the right and one old thing leaves on the left — you don't re-look at the whole landscape.",
    signals: [
      "'Contiguous' subarray or substring",
      "Longest / shortest / maximum / minimum of something over a range",
      "A fixed window size k",
      "A condition like 'at most k distinct' or 'no repeats'",
    ],
    keywords: [
      ["subarray", 2],
      ["substring", 2.5],
      ["contiguous", 2.5],
      ["window", 3],
      ["longest", 1.5],
      ["shortest", 1.5],
      ["at most k", 3],
      ["k consecutive", 3],
      ["size k", 2],
      ["without repeating", 3],
      ["minimum window", 3],
      ["consecutive", 1.5],
      ["maximum sum", 1],
    ],
    idea:
      "Keep a running summary of the current window. Add the new element on the right, remove the old element on the left, and never start over.",
    steps: [
      "Define precisely what a VALID window is (a sentence!).",
      "Expand: move the right edge, adding that element to your summary.",
      "While the window is invalid, shrink: move the left edge, removing elements.",
      "Record the best answer whenever the window is valid.",
      "Check whether the window is fixed size (simple) or variable size (expand + shrink).",
    ],
    skeleton: `left = 0
summary = empty
for right from 0 to last index:
    add data[right] to summary
    while window is invalid:
        remove data[left] from summary
        left = left + 1
    update best answer using (right - left + 1)`,
    time: "O(n)",
    space: "O(1) – O(k)",
    pitfalls: [
      "Not removing the left element from the summary correctly.",
      "Negative numbers can break 'shrink when sum too big' logic.",
      "Updating the answer at the wrong moment (before the window is valid).",
    ],
    hints: [
      "Is the thing you're looking at a CONTIGUOUS chunk?",
      "Describe a 'good' window in one sentence. What would make it 'bad'?",
      "When you add one element on the right, what must you update? What if you drop one on the left?",
      "Each element enters once and leaves once. What does that say about the speed?",
    ],
    drills: ["Max Sum Subarray of Size K", "Longest Substring Without Repeating Characters", "Minimum Window Substring", "Longest Repeating Character Replacement"],
  },
  {
    id: "binary-search",
    name: "Binary Search",
    emoji: "✂️",
    color: "indigo",
    level: "Beginner",
    tagline: "Cut the search space in half with every question.",
    /** the same idea with no jargon at all */
    plain: "Guess the middle, throw away the half that can't hold the answer, repeat.",
    analogy:
      "Guessing a number between 1 and 100 with 'higher / lower' feedback. Seven questions are always enough.",
    signals: [
      "Sorted data, and a target to find",
      "Required time like O(log n)",
      "'Minimum value such that…' or 'maximum value such that…'",
      "A yes/no check that flips from NO to YES at some point (monotonic)",
    ],
    keywords: [
      ["sorted", 2],
      ["log n", 3],
      ["o(log", 3],
      ["rotated", 3],
      ["search", 1],
      ["insert position", 3],
      ["lower bound", 3],
      ["first position", 2],
      ["smallest value such", 3],
      ["maximize the minimum", 3],
      ["minimize the maximum", 3],
      ["peak", 2.5],
      ["minimum possible", 1.5],
      ["at least", 0.5],
      ["capacity", 1.5],
      ["speed", 1],
    ],
    idea:
      "If you can look at ONE middle option and decide which half the answer is NOT in, discard that half. It works on arrays AND on 'guess the answer' problems.",
    steps: [
      "Define the search space: [low, high] — indexes OR possible answer values.",
      "Take mid. Ask a yes/no question about mid.",
      "Throw away the half that cannot contain the answer.",
      "Repeat until low and high meet.",
      "Decide: are you looking for exact match, first true, or last true? That decides the loop details.",
    ],
    skeleton: `low = smallest possible answer
high = largest possible answer
while low <= high:
    mid = low + (high - low) / 2
    if check(mid) says "go left":
        high = mid - 1
    else:
        low = mid + 1
return the right boundary`,
    time: "O(log n) × cost of check",
    space: "O(1)",
    pitfalls: [
      "Infinite loop from mid rounding — test with 2 elements.",
      "Off-by-one on low/high updates (mid vs mid ± 1).",
      "Using it when the check is not monotonic.",
    ],
    hints: [
      "Is there an ORDER — in the data, or in the possible answers?",
      "Can one yes/no question about a middle value rule out half the options?",
      "If answer X works, does X + 1 (or X − 1) also always work? That's monotonic.",
      "What would you search over — array indexes, or answer values 1…max?",
    ],
    drills: ["Binary Search", "Search Insert Position", "Search in Rotated Sorted Array", "Koko Eating Bananas", "Capacity to Ship Packages"],
  },
  {
    id: "prefix-sum",
    name: "Prefix Sum",
    emoji: "➕",
    color: "cyan",
    level: "Beginner",
    tagline: "Precompute running totals to answer range questions instantly.",
    /** the same idea with no jargon at all */
    plain: "Add everything up once into running totals, so any range total is a single subtraction.",
    analogy:
      "A bank statement: to know how much you spent between March and June, subtract the balance in March from June instead of adding every receipt.",
    signals: [
      "Many queries asking for the sum over a range [i, j]",
      "'Subarray sum equals k'",
      "Counting subarrays with a property (often with a hash map)",
      "Range updates (difference array)",
    ],
    keywords: [
      ["range sum", 3],
      ["sum of subarray", 2],
      ["queries", 2],
      ["subarray sum equals", 3],
      ["cumulative", 3],
      ["prefix", 3],
      ["multiple queries", 2],
      ["between index", 1.5],
      ["product of array except self", 3],
      ["difference array", 3],
      ["range update", 2],
      ["number of subarrays", 2],
    ],
    idea:
      "prefix[i] = sum of the first i items. Then sum(i..j) = prefix[j+1] − prefix[i]. Pay O(n) once, answer each query in O(1).",
    steps: [
      "Build prefix array where prefix[0] = 0.",
      "Each next entry = previous entry + current item.",
      "Range [i, j] = prefix[j+1] − prefix[i].",
      "For 'count subarrays with sum k': store how often each prefix value occurred in a hash map.",
    ],
    skeleton: `prefix[0] = 0
for i from 0 to n-1:
    prefix[i+1] = prefix[i] + data[i]

// query for range i..j (inclusive):
answer = prefix[j+1] - prefix[i]`,
    time: "O(n) build, O(1) per query",
    space: "O(n)",
    pitfalls: [
      "Off-by-one — that is why prefix[0] = 0 padding exists.",
      "Forgetting to seed the hash map with {0: 1} when counting subarrays.",
      "Integer overflow on big sums in some languages.",
    ],
    hints: [
      "Are you adding up the same stretches of numbers again and again?",
      "If you knew the total up to index i and up to index j, how would you get the part in between?",
      "What would you precompute — and how long does it take once?",
      "For counting problems: which earlier prefix value would complete the target?",
    ],
    drills: ["Range Sum Query – Immutable", "Subarray Sum Equals K", "Product of Array Except Self", "Contiguous Array"],
    prerequisites: ["hashmap"],
  },
  {
    id: "sorting",
    name: "Sorting First",
    emoji: "📶",
    color: "lime",
    level: "Beginner",
    tagline: "Put things in order so that the problem becomes easy.",
    /** the same idea with no jargon at all */
    plain: "Put the items in order first, then whatever you're looking for sits right next to its answer.",
    analogy:
      "Alphabetizing a stack of papers before looking for duplicates — neighbours now tell you everything.",
    signals: [
      "Intervals / overlaps / meetings",
      "Closest, smallest difference, ranking",
      "The order of the INPUT doesn't matter for the answer",
      "Custom order (e.g. by deadline or by length)",
    ],
    keywords: [
      ["sort", 2],
      ["merge intervals", 3],
      ["intervals", 2],
      ["overlap", 2],
      ["closest", 1],
      ["meeting rooms", 2],
      ["arrange", 1],
      ["largest number", 1.5],
      ["smallest difference", 2.5],
      ["order", 0.5],
      ["rank", 1],
    ],
    idea:
      "Spend O(n log n) to sort, and then the interesting items sit NEXT to each other. Many O(n²) pair-checks become a single scan.",
    steps: [
      "Ask: does the original order matter? If not, sorting is free to try.",
      "Pick what to sort by (value, start time, end time, custom rule).",
      "Scan once, comparing each item with its neighbour / the previous one.",
      "Combine with two pointers or greedy afterwards.",
    ],
    skeleton: `sort data by <the right key>
previous = data[0]
for each next item in data (after the first):
    compare next with previous
    decide: merge / skip / count / update
    previous = (updated) item`,
    time: "O(n log n)",
    space: "O(1) – O(n)",
    pitfalls: [
      "Sorting by the wrong key (start vs. end time matters!).",
      "Losing the original indexes — store (value, index) pairs first.",
      "Assuming sort is stable when you need it to be.",
    ],
    hints: [
      "Does the final answer depend on the original ORDER of the input?",
      "If everything were sorted, where would the items you care about be?",
      "Which key should you sort by: start, end, value, or a custom comparison?",
      "After sorting, what single pass do you need?",
    ],
    drills: ["Merge Intervals", "Meeting Rooms", "Minimum Absolute Difference", "Largest Number"],
  },
  {
    id: "stack",
    name: "Stack",
    emoji: "📚",
    color: "orange",
    level: "Intermediate",
    tagline: "Last in, first out — perfect for nested and 'most recent' things.",
    /** the same idea with no jargon at all */
    plain: "Keep a pile. The last thing you put down is the first thing you pick up.",
    analogy:
      "A stack of plates: you can only touch the top one. Great whenever the thing you handle next is the thing you saw most recently.",
    signals: [
      "Matching pairs: parentheses, brackets, tags",
      "'Next greater / next smaller element'",
      "Undo operations, nested structures, expression evaluation",
      "Temperatures/prices where each item waits for a bigger one",
    ],
    keywords: [
      ["parentheses", 3],
      ["brackets", 3],
      ["valid", 0.5],
      ["nested", 2],
      ["next greater", 3],
      ["next smaller", 3],
      ["undo", 2],
      ["evaluate expression", 3],
      ["reverse polish", 3],
      ["decode", 1.5],
      ["histogram", 2],
      ["daily temperatures", 3],
      ["monotonic", 3],
      ["matching", 1],
      ["backspace", 2],
    ],
    idea:
      "Push things that are 'still waiting', pop them the moment they get resolved. A monotonic stack keeps its items in sorted order so each element is pushed and popped once.",
    steps: [
      "Decide what 'waiting' means (an open bracket, an unresolved index).",
      "Scan left to right.",
      "If the current item resolves the top of the stack: pop and handle it (repeat while true).",
      "Otherwise push the current item.",
      "At the end, whatever is left on the stack is unresolved.",
    ],
    skeleton: `stack = empty
for each item in data:
    while stack is not empty and item resolves stack.top:
        popped = stack.pop()
        handle(popped, item)
    stack.push(item)
// anything left in stack never got resolved`,
    time: "O(n)",
    space: "O(n)",
    pitfalls: [
      "Popping from an empty stack — always check isEmpty first.",
      "Storing values when you actually need INDEXES (for distances).",
      "Forgetting to check that the stack is empty at the end (brackets).",
    ],
    hints: [
      "Is there something that stays 'open' until a later element closes it?",
      "Does the most recently seen unresolved item get handled first?",
      "What should you store: the value or its index?",
      "What does it mean if the stack is not empty at the very end?",
    ],
    drills: ["Valid Parentheses", "Daily Temperatures", "Next Greater Element", "Evaluate Reverse Polish Notation"],
  },
  {
    id: "bfs",
    name: "Breadth-First Search (BFS)",
    emoji: "🌊",
    color: "blue",
    level: "Intermediate",
    tagline: "Explore level by level — the shortest path in an unweighted graph.",
    /** the same idea with no jargon at all */
    plain: "Explore outward in rings — one step away, then two, then three. The first time you arrive is the shortest way.",
    analogy:
      "A ripple spreading in a pond. Everything 1 step away gets touched first, then everything 2 steps away, and so on.",
    signals: [
      "'Shortest path' / 'minimum number of steps / moves' with equal-cost moves",
      "Grid or maze navigation",
      "Level-by-level tree processing",
      "Spreading processes (rot oranges, fire, infection)",
    ],
    keywords: [
      ["shortest path", 3],
      ["minimum number of steps", 3],
      ["minimum moves", 3],
      ["minimum number of moves", 3],
      ["fewest", 2],
      ["level order", 3],
      ["nearest", 2],
      ["grid", 1],
      ["maze", 2],
      ["shortest", 1],
      ["word ladder", 3],
      ["unweighted", 3],
      ["spread", 1.5],
      ["minimum time", 1.5],
      ["each level", 2],
    ],
    idea:
      "A queue guarantees you finish all nodes at distance d before any at distance d+1 — so the first time you reach a node is via the shortest route.",
    steps: [
      "Model the problem as a graph: what is a NODE (state)? What are its NEIGHBOURS (moves)?",
      "Put the start in a queue and mark it visited.",
      "Pop a node, look at all neighbours not yet visited.",
      "Mark them visited AS YOU PUSH them, record distance = current + 1.",
      "Stop when you reach the target or the queue is empty.",
    ],
    skeleton: `queue = [start]
visited = {start}
distance = 0
while queue is not empty:
    repeat (current queue size) times:     // one level
        node = queue.pop_front()
        if node is target: return distance
        for each neighbour of node:
            if neighbour not in visited:
                visited.add(neighbour)
                queue.push_back(neighbour)
    distance = distance + 1
return "unreachable"`,
    time: "O(V + E) — for a grid, O(rows × cols)",
    space: "O(V)",
    pitfalls: [
      "Marking visited when POPPING instead of when pushing — queue explodes.",
      "Forgetting grid boundary checks.",
      "Using it for weighted edges (use Dijkstra).",
    ],
    hints: [
      "What is one 'move' in this problem? Are all moves equally costly?",
      "What is a 'state' — just a position, or position plus something else?",
      "Why would exploring in rings guarantee the shortest answer?",
      "How will you avoid visiting the same state twice?",
    ],
    drills: ["Binary Tree Level Order Traversal", "Rotting Oranges", "Shortest Path in Binary Matrix", "Word Ladder", "Number of Islands (BFS version)"],
  },
  {
    id: "dfs",
    name: "Depth-First Search (DFS)",
    emoji: "🕳️",
    color: "emerald",
    level: "Intermediate",
    tagline: "Go as deep as possible, then come back.",
    /** the same idea with no jargon at all */
    plain: "Pick a direction, go as far as you can, then back up and try the next one.",
    analogy:
      "Exploring a cave system by always taking the next tunnel until you hit a dead end, then backing up to the last fork.",
    signals: [
      "Trees: depth, paths, subtrees, ancestors",
      "Connected components / islands / flood fill",
      "'Is there a path?' (not shortest)",
      "Detecting cycles, topological order",
    ],
    keywords: [
      ["connected", 2],
      ["islands", 3],
      ["island", 3],
      ["tree", 2],
      ["binary tree", 2],
      ["path exists", 2],
      ["reachable", 2],
      ["traverse", 2],
      ["graph", 1.5],
      ["flood fill", 3],
      ["depth", 2],
      ["cycle", 2],
      ["component", 2],
      ["topological", 3],
      ["subtree", 2],
      ["ancestor", 2],
      ["maximum depth", 3],
    ],
    idea:
      "Solve the problem for one node by trusting that recursion solves it for the children. Combine their results.",
    steps: [
      "Define precisely what dfs(node) returns or does.",
      "Write the base case (null node / out of bounds / already visited).",
      "Recursively call dfs on every neighbour / child.",
      "Combine results (max, sum, count, boolean) and return.",
      "For graphs and grids: mark visited to avoid infinite loops.",
    ],
    skeleton: `function dfs(node):
    if node is invalid or already visited:
        return base value
    mark node visited
    result = start value
    for each neighbour of node:
        result = combine(result, dfs(neighbour))
    return result`,
    time: "O(V + E)",
    space: "O(depth) recursion stack",
    pitfalls: [
      "Missing base case → stack overflow.",
      "Forgetting visited markers in graphs/grids → infinite loop.",
      "Using DFS for shortest path (it doesn't guarantee it).",
    ],
    hints: [
      "Can the problem be solved for a node if you already know the answers for its children?",
      "In ONE sentence: what should dfs(node) return?",
      "What are your base cases?",
      "How will you avoid going in circles?",
    ],
    drills: ["Maximum Depth of Binary Tree", "Number of Islands", "Flood Fill", "Path Sum", "Course Schedule"],
  },
  {
    id: "backtracking",
    name: "Backtracking",
    emoji: "🔙",
    color: "rose",
    level: "Intermediate",
    tagline: "Build answers piece by piece; undo when stuck.",
    /** the same idea with no jargon at all */
    plain: "Build an answer one choice at a time. When a choice leads nowhere, undo it and try another.",
    analogy:
      "Solving a maze with chalk: choose a path, mark it, and if you reach a dead end, erase your marks and try the next turn.",
    signals: [
      "'Generate ALL…' permutations, combinations, subsets",
      "Very small n (≤ 15 or so)",
      "Constraint puzzles: N-Queens, Sudoku, word search",
      "You must list the answers, not just count them",
    ],
    keywords: [
      ["all possible", 3],
      ["all combinations", 3],
      ["permutations", 3],
      ["permutation", 3],
      ["subsets", 3],
      ["subset", 2],
      ["combination", 3],
      ["generate all", 3],
      ["n-queens", 3],
      ["sudoku", 3],
      ["word search", 2],
      ["list all", 3],
      ["return all", 2],
      ["generate", 1.5],
    ],
    idea:
      "Draw the decision tree: at each step you CHOOSE an option, EXPLORE deeper, then UN-CHOOSE. Prune branches that already break the rules.",
    steps: [
      "Define the state you're building (current path / partial answer).",
      "Define when the state is complete → save a COPY.",
      "Loop over the choices available right now.",
      "Choose → recurse → undo the choice.",
      "Add early pruning: skip choices that can't lead to a valid answer.",
    ],
    skeleton: `function backtrack(partial, choices):
    if partial is a complete answer:
        save a copy of partial
        return
    for each choice in choices available now:
        if choice is not allowed: continue    // prune
        partial.add(choice)                   // choose
        backtrack(partial, remaining choices) // explore
        partial.remove_last()                 // un-choose`,
    time: "O(2ⁿ) or O(n!) — exponential",
    space: "O(depth)",
    pitfalls: [
      "Saving the reference instead of a copy of the partial answer.",
      "Forgetting to undo the choice.",
      "Duplicates: sort the input and skip equal neighbours at the same level.",
    ],
    hints: [
      "Does the problem ask you to LIST every valid arrangement?",
      "Draw the decision tree for 2–3 elements. What is a decision at each level?",
      "What exactly are you tracking as the 'partial answer'?",
      "When should a branch be abandoned early?",
    ],
    drills: ["Subsets", "Permutations", "Combination Sum", "Generate Parentheses", "N-Queens"],
    prerequisites: ["dfs"],
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    emoji: "🧱",
    color: "violet",
    level: "Advanced",
    tagline: "Solve small versions first, remember them, build up to the big one.",
    /** the same idea with no jargon at all */
    plain: "Solve the small versions once, write them down, and reuse them to build the big answer.",
    analogy:
      "Climbing stairs: the number of ways to reach step 10 is built from the ways to reach steps 9 and 8. You write each result in a notebook so you never recompute it.",
    signals: [
      "'Number of ways', 'minimum cost', 'maximum profit', 'is it possible'",
      "Making a choice at each step that affects what's left",
      "Brute force recursion repeats the same sub-calls",
      "Sequences: subsequence, edit distance, knapsack, coins",
    ],
    keywords: [
      ["number of ways", 3],
      ["count the ways", 3],
      ["how many ways", 3],
      ["minimum cost", 2],
      ["maximum profit", 2],
      ["longest common", 3],
      ["longest increasing", 3],
      ["subsequence", 2.5],
      ["knapsack", 3],
      ["coin change", 3],
      ["edit distance", 3],
      ["climb", 2],
      ["stairs", 2],
      ["optimal", 1],
      ["house robber", 3],
      ["fibonacci", 2],
      ["unique paths", 3],
      ["can you reach", 1],
      ["partition equal", 2],
    ],
    idea:
      "DP = recursion + memory. If an answer is built from answers to smaller versions of the SAME question, store each small answer once.",
    steps: [
      "Write the brute-force recursion first (choices + base cases).",
      "Identify the STATE: which few numbers fully describe a sub-problem? (index, remaining capacity…)",
      "Write the recurrence: answer(state) in terms of smaller states.",
      "Add memoization (a cache) → top-down DP.",
      "Optionally convert to a bottom-up table; then shrink memory if only the last row/few values are used.",
    ],
    skeleton: `// top-down
cache = empty
function solve(state):
    if state is a base case: return base value
    if state in cache: return cache[state]
    best = worst possible value
    for each choice available in this state:
        best = better(best, cost(choice) + solve(next state after choice))
    cache[state] = best
    return best`,
    time: "O(number of states × work per state)",
    space: "O(number of states)",
    pitfalls: [
      "Defining the state with too little (or too much) information.",
      "Wrong base cases / wrong initial values (0 vs infinity).",
      "Jumping to a table without understanding the recursion first.",
    ],
    hints: [
      "Write the plain recursive idea first: what choices exist at each step?",
      "Do the recursive calls repeat the same arguments? That's the sign of DP.",
      "What is the smallest set of variables that describes 'where I am' in the problem?",
      "How does the answer for a state depend on smaller states? Write it as a formula.",
      "What are the smallest/base states, and what are their answers?",
    ],
    drills: ["Climbing Stairs", "House Robber", "Coin Change", "Longest Increasing Subsequence", "0/1 Knapsack", "Edit Distance"],
    prerequisites: ["dfs", "backtracking"],
  },
  {
    id: "greedy",
    name: "Greedy",
    emoji: "🍫",
    color: "pink",
    level: "Intermediate",
    tagline: "Make the locally best choice each time — when you can prove it's safe.",
    /** the same idea with no jargon at all */
    plain: "Always take the best-looking option right now, and trust that it works out.",
    analogy:
      "Making change with the fewest coins: always take the biggest coin that fits. Easy and fast — but only works when the situation is shaped right.",
    signals: [
      "Scheduling / selecting the maximum number of non-overlapping things",
      "'Minimum number of…' or 'maximum number of…' where choices don't undo each other",
      "After sorting, one obvious rule seems to work every time",
      "Jump / reach / assign problems",
    ],
    keywords: [
      ["minimum number of", 1.5],
      ["maximum number of", 1.5],
      ["schedule", 2],
      ["activity selection", 3],
      ["jump game", 3],
      ["always choose", 3],
      ["earliest", 1.5],
      ["assign", 1.5],
      ["cookies", 2],
      ["gas station", 3],
      ["minimum platforms", 2],
      ["lexicographically", 1.5],
      ["largest possible", 1],
      ["non-overlapping", 3],
    ],
    idea:
      "Find a rule that picks the best option NOW and never needs to be reconsidered. Then prove it with an 'exchange argument' or try to break it with a counter-example.",
    steps: [
      "Guess a greedy rule (biggest first? earliest end? smallest cost?).",
      "Try hard to break it with a small counter-example.",
      "If it survives, sort (or use a heap) to access choices in that order.",
      "Make choices in one pass, skipping those that conflict.",
      "If you find a counter-example, switch to DP.",
    ],
    skeleton: `sort candidates by the greedy rule
chosen = empty
for each candidate in sorted order:
    if candidate is compatible with chosen:
        chosen.add(candidate)
return chosen (or its size / total)`,
    time: "O(n log n) (sorting)",
    space: "O(1) – O(n)",
    pitfalls: [
      "Trusting a greedy rule without testing counter-examples.",
      "Sorting by the wrong thing (earliest START vs. earliest END).",
      "Using greedy where DP is required (like 0/1 knapsack).",
    ],
    hints: [
      "Is there an obvious 'best next choice'? Say it out loud as a rule.",
      "Try to find a small example where that rule fails. Can you?",
      "What would you sort by to make the rule easy to follow?",
      "Does choosing something now ever block a better combination later?",
    ],
    drills: ["Jump Game", "Assign Cookies", "Non-overlapping Intervals", "Gas Station", "Best Time to Buy and Sell Stock II"],
  },
  {
    id: "heap",
    name: "Heap / Priority Queue",
    emoji: "⛰️",
    color: "fuchsia",
    level: "Intermediate",
    tagline: "Always know the smallest or largest item in O(log n).",
    /** the same idea with no jargon at all */
    plain: "A pile that always hands you its smallest (or biggest) item instantly.",
    analogy:
      "A hospital emergency room: the most urgent patient is always seen next, no matter when they arrived.",
    signals: [
      "'Top K', 'K-th largest/smallest', 'K closest'",
      "A stream of data where you keep asking for min / max",
      "Merging K sorted lists",
      "Running median, scheduling by priority",
    ],
    keywords: [
      ["k largest", 3],
      ["k smallest", 3],
      ["top k", 3],
      ["kth largest", 3],
      ["kth smallest", 2.5],
      ["median", 2],
      ["k closest", 3],
      ["most frequent", 2],
      ["merge k", 3],
      ["priority", 3],
      ["stream", 2],
      ["continuously", 1.5],
      ["task scheduler", 2],
      ["k-th", 2],
    ],
    idea:
      "A heap is a bucket that hands you its smallest (or largest) item instantly. To keep the top K largest, use a MIN-heap of size K and kick out the smallest.",
    steps: [
      "Decide: do you need the min or the max repeatedly?",
      "Push items in; the heap keeps order automatically.",
      "For 'top K': keep the heap at size K — pop when it grows beyond.",
      "Pop to process the next-best item.",
    ],
    skeleton: `heap = empty min-heap
for each item in data:
    heap.push(item)
    if heap.size > K:
        heap.pop()          // removes the smallest
// heap now holds the K largest items`,
    time: "O(n log k)",
    space: "O(k)",
    pitfalls: [
      "Using a max-heap when you need a min-heap of size K (the reverse!).",
      "Languages differ: some only have a min-heap — negate values for max.",
      "Re-sorting everything each time instead of using a heap.",
    ],
    hints: [
      "Do you repeatedly need the current smallest/largest item?",
      "Would sorting everything be wasteful when you only need K items?",
      "For top-K LARGEST, which kind of heap do you keep — and what do you evict?",
      "What would you store as the item: a number, or a (priority, data) pair?",
    ],
    drills: ["Kth Largest Element in an Array", "Top K Frequent Elements", "Merge K Sorted Lists", "Find Median from Data Stream"],
  },
  {
    id: "union-find",
    name: "Union-Find (Disjoint Set)",
    emoji: "🤝",
    color: "red",
    level: "Advanced",
    tagline: "Track which items belong to the same group, super quickly.",
    /** the same idea with no jargon at all */
    plain: "Track which items belong to the same group, and merge groups as new links arrive.",
    analogy:
      "Friend circles at a party: when two people become friends, their two entire circles merge into one.",
    signals: [
      "'Are these two connected?' queries, with connections added over time",
      "Counting connected components / provinces / groups",
      "Detecting a redundant edge (cycle) in an undirected graph",
      "Merging accounts, equivalence groups",
    ],
    keywords: [
      ["connected components", 2],
      ["union", 3],
      ["friends", 1.5],
      ["redundant connection", 3],
      ["accounts merge", 3],
      ["provinces", 3],
      ["same group", 2],
      ["merge groups", 3],
      ["disjoint", 3],
      ["equivalent", 2],
      ["network", 1],
      ["group", 0.5],
    ],
    idea:
      "Each group has a 'leader'. find(x) walks to x's leader; union(a, b) makes one leader report to the other. Path compression keeps it near O(1).",
    steps: [
      "Start with every item as its own leader: parent[i] = i.",
      "find(x): follow parents to the leader (compress the path while returning).",
      "union(a, b): find both leaders; if different, link one to the other.",
      "Two items are connected if find(a) == find(b).",
    ],
    skeleton: `parent[i] = i for every i
function find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])   // path compression
    return parent[x]
function union(a, b):
    ra = find(a); rb = find(b)
    if ra != rb: parent[ra] = rb`,
    time: "≈ O(α(n)) per operation (practically constant)",
    space: "O(n)",
    pitfalls: [
      "Comparing parent[a] and parent[b] instead of find(a) and find(b).",
      "Forgetting that the number of components drops by one on each successful union.",
      "Using it for directed graphs.",
    ],
    hints: [
      "Are you grouping items, and do groups only ever MERGE?",
      "What question do you ask repeatedly — 'are A and B in the same group?'",
      "How could every group be represented by one single leader?",
      "What does it mean if both items already share a leader when you try to connect them?",
    ],
    drills: ["Number of Provinces", "Redundant Connection", "Accounts Merge", "Graph Valid Tree"],
    prerequisites: ["dfs"],
  },
  {
    id: "dijkstra",
    name: "Dijkstra (Weighted Shortest Path)",
    emoji: "🛣️",
    color: "teal",
    level: "Advanced",
    tagline: "BFS's big brother for roads with different lengths.",
    /** the same idea with no jargon at all */
    plain: "Explore like BFS, but always continue from the cheapest route found so far.",
    analogy:
      "A GPS: always extend the route that is currently the cheapest, and the first time you pop a place from the list you've found its cheapest route.",
    signals: [
      "Graph edges have different costs / weights / times",
      "'Cheapest', 'minimum cost / time to reach'",
      "All weights are non-negative",
    ],
    keywords: [
      ["weighted", 2],
      ["cheapest", 3],
      ["dijkstra", 4],
      ["minimum cost to reach", 2.5],
      ["network delay", 3],
      ["minimum time", 1],
      ["travel time", 2],
      ["edge weight", 3],
      ["flights", 1.5],
    ],
    idea:
      "Like BFS, but replace the queue with a min-heap ordered by total distance so far. Always expand the closest unfinished node.",
    steps: [
      "dist[start] = 0, everything else = infinity.",
      "Push (0, start) into a min-heap.",
      "Pop the smallest (d, node). If d is larger than dist[node], skip it (stale).",
      "For each edge (node → next, w): if d + w < dist[next], update and push.",
      "When the heap is empty, dist[] holds the shortest distances.",
    ],
    skeleton: `dist = all infinity; dist[start] = 0
heap = [(0, start)]
while heap is not empty:
    (d, node) = heap.pop_min()
    if d > dist[node]: continue          // outdated entry
    for each (next, weight) of node:
        if d + weight < dist[next]:
            dist[next] = d + weight
            heap.push((dist[next], next))`,
    time: "O((V + E) log V)",
    space: "O(V + E)",
    pitfalls: [
      "Negative weights break it (use Bellman-Ford).",
      "Forgetting the 'stale entry' check.",
      "Using it when all weights are equal — plain BFS is simpler.",
    ],
    hints: [
      "Do moves have different costs? If not, BFS is enough.",
      "What do you need to keep sorted to always expand the cheapest option next?",
      "When do you know a node's distance is final?",
      "Are any weights negative?",
    ],
    drills: ["Network Delay Time", "Cheapest Flights Within K Stops", "Path With Minimum Effort"],
    prerequisites: ["bfs", "heap"],
  },
];

export const PATTERN_MAP: Record<string, Pattern> = Object.fromEntries(PATTERNS.map((p) => [p.id, p]));
