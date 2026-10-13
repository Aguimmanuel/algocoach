/**
 * Every word AlgoCoach uses, in plain English.
 *
 * Written for someone who can code but has never studied algorithms. Each term
 * gets a one-line definition and a "why care" note. No definition here uses
 * another jargon word without it also being defined.
 */

export interface Term {
  term: string;
  /** plain-English meaning */
  meaning: string;
  /** why a beginner should care, or the everyday picture */
  why?: string;
}

export interface TermGroup {
  title: string;
  emoji: string;
  blurb: string;
  terms: Term[];
}

export const GLOSSARY: TermGroup[] = [
  {
    title: "The pieces of a problem",
    emoji: "🧱",
    blurb: "Before you can pick an algorithm, you need words for what you're looking at.",
    terms: [
      {
        term: "Array / List",
        meaning: "A row of numbered boxes holding values.",
        why: "Like a row of lockers: [5, 3, 9] is three boxes.",
      },
      {
        term: "Index",
        meaning: "The number of a box. The first box is 0, not 1.",
        why: "This is why code says arr[0] for 'the first one'.",
      },
      {
        term: "Element / Item",
        meaning: "One value sitting inside a box.",
      },
      {
        term: "String",
        meaning: "A row of characters — just an array where each box holds a letter.",
        why: "Anything you learn about arrays works on strings too.",
      },
      {
        term: "n",
        meaning: "How many things you have. 'n = 10⁵' means 100,000 items.",
        why: "The single most important number in the problem. It decides everything.",
      },
      {
        term: "Subarray",
        meaning: "A run of neighbouring boxes — a slice you cut out without skipping any.",
        why: "In [5, 3, 9, 1], [3, 9] is a subarray but [5, 9] is not (it skips 3).",
      },
      {
        term: "Subsequence",
        meaning: "Any selection of boxes in order, skipping allowed.",
        why: "In [5, 3, 9, 1], [5, 9] IS a subsequence. Different problem, different pattern.",
      },
      {
        term: "Contiguous",
        meaning: "Neighbouring, with no gaps. Same as subarray.",
      },
      {
        term: "Sorted",
        meaning: "In order, smallest to largest.",
        why: "Sorted input is a huge gift — half of these patterns only work because of it.",
      },
    ],
  },
  {
    title: "Talking about speed",
    emoji: "⏱️",
    blurb: "The words people use when they say 'your code is too slow'.",
    terms: [
      {
        term: "Complexity / Big-O",
        meaning: "How much more work your code does as the input gets bigger.",
        why: "O(n) means 'work grows in step with the input'. O(n²) means 'work explodes'.",
      },
      {
        term: "Time limit",
        meaning: "Roughly 10⁸ (100 million) simple steps per second is what you get.",
        why: "This is the whole trick: read n, do the arithmetic, know what's allowed.",
      },
      {
        term: "Brute force",
        meaning: "Trying every possibility, however dumb.",
        why: "Always start here. It's correct, it's writable, and it shows you what's being repeated.",
      },
      {
        term: "Recursion",
        meaning: "A function that calls itself on a smaller version of the same problem.",
        why: "Usually 'I trust the smaller version is already solved, so what's left for me?'",
      },
      {
        term: "Memoization",
        meaning: "Writing down an answer you already worked out so you never compute it twice.",
        why: "Recognising repeated work is the entire idea behind Dynamic Programming.",
      },
    ],
  },
  {
    title: "The containers",
    emoji: "📦",
    blurb: "Each one trades something for something. That trade IS the algorithm choice.",
    terms: [
      {
        term: "Hash Map / Dictionary",
        meaning: "A lookup box: you ask for a key, you get the value instantly — no searching.",
        why: "The single biggest speed-up available to a beginner. Turns 'search the list' into 'just ask'.",
      },
      {
        term: "Hash Set",
        meaning: "A hash map with no values — it only answers 'have I seen this before?'",
      },
      {
        term: "Stack",
        meaning: "A pile. Last thing put on is the first thing taken off.",
        why: "Think of undo history, or a stack of plates.",
      },
      {
        term: "Queue",
        meaning: "A line. First thing in is the first thing out.",
        why: "Like a queue at a shop counter.",
      },
      {
        term: "Heap / Priority Queue",
        meaning: "A pile that always hands you the smallest (or biggest) item instantly.",
        why: "Use it when you only care about the best one, not the full order.",
      },
      {
        term: "Tree",
        meaning: "Items connected in a hierarchy with no loops — like folders inside folders.",
      },
      {
        term: "Graph",
        meaning: "Dots joined by lines. Cities joined by roads, friends joined by friendship.",
        why: "Two names for the same thing: 'node' = dot, 'edge' = line.",
      },
      {
        term: "Node / Vertex",
        meaning: "One dot in a graph or tree.",
      },
      {
        term: "Edge",
        meaning: "One connection between two dots.",
      },
      {
        term: "Grid / Matrix",
        meaning: "A 2-D array — a chessboard of values.",
        why: "A grid is secretly a graph where each cell is a dot joined to its neighbours.",
      },
    ],
  },
  {
    title: "The moves",
    emoji: "🎯",
    blurb: "Words that show up in problem statements and point straight at a pattern.",
    terms: [
      {
        term: "Pointer",
        meaning: "A variable that remembers a position (an index) in the array.",
        why: "Two pointers = two bookmarks you move around.",
      },
      {
        term: "Window",
        meaning: "A slice of the array you're currently looking at, which you slide along.",
      },
      {
        term: "Traversal",
        meaning: "Visiting every item in a structure, one at a time.",
      },
      {
        term: "BFS / DFS",
        meaning: "Two ways to walk a graph. BFS = explore outward in rings. DFS = go deep, then back up.",
        why: "BFS finds the fewest steps. DFS explores everything.",
      },
      {
        term: "Greedy",
        meaning: "Always take the best-looking choice right now and never look back.",
        why: "Fast and simple — but only correct when the problem allows it.",
      },
      {
        term: "In-place",
        meaning: "Rearranging the data without making a second copy of it.",
      },
      {
        term: "Edge case",
        meaning: "An unusual input that breaks naive code: empty, one item, all equal, negatives.",
      },
    ],
  },
];
