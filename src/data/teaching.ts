import raw from "./teachingPlans.json" with { type: "json" };
import type { Lesson, LessonPage, QuizQ } from "./curriculum";
import type { BeginnerExample } from "./beginner";
import { CASES, lessonTrace } from "../lib/lessonTraces";
export interface TeachingQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}
export interface TeachingPlan {
  id: string;
  title: string;
  goal: string;
  intro: string[];
  recipe: string[];
  words: string[];
  caution: string;
  code: string;
  expected: string;
  predict: TeachingQuestion;
  transfer: TeachingQuestion;
  gap: TeachingQuestion;
  final: TeachingQuestion;
  hint: string;
}
export const PLANS = raw as Record<string, TeachingPlan>;
export const GUIDANCE: Record<
  string,
  {
    description: string;
    prerequisites: string;
    prior?: string;
    next?: string;
    why: string;
    outcomes: string[];
  }
> = {
  foundations: {
    description:
      "Begin with inputs, outputs, lists and repeatable instructions. Count small examples before using mathematical shorthand. No coding experience or installation required.",
    prerequisites:
      "None. Start here if programming and algorithms are new to you.",
    next: "arrays",
    why: "Next, use the same small-list skills to avoid repeated work.",
    outcomes: [
      "Read values and zero-based positions",
      "Trace a simple loop by hand",
      "Distinguish inputs from required outputs",
      "Compare counted work without timing promises",
    ],
  },
  arrays: {
    description:
      "Use small lists to understand lookup boxes, sorted boundaries, windows and running totals. Each lesson keeps one task from example through code.",
    prerequisites:
      "First learn lists, positions and loops in Think Like an Engineer.",
    prior: "foundations",
    next: "structures",
    why: "Next, learn structures that remember pending work and priorities.",
    outcomes: [
      "Explain why a dictionary stores earlier positions",
      "Justify a move on a sorted list",
      "Repair a repeated-letter window",
      "Answer an inclusive range using prefix totals",
    ],
  },
  structures: {
    description:
      "See what stacks, linked nodes, intervals and heaps remember. Follow the state changes before reading complete Python examples.",
    prerequisites:
      "Understand values, positions and basic loops; Array Patterns is recommended.",
    prior: "arrays",
    next: "graphs",
    why: "Stacks and heaps now become tools for exploring connected places.",
    outcomes: [
      "Match brackets using a stack",
      "Reverse links without losing the rest",
      "Merge overlapping ranges with a stated endpoint rule",
      "Keep the top K values using a min-heap",
    ],
  },
  graphs: {
    description:
      "Start with four connected nodes. See a real queue or stack, measure tree depth, join groups, and improve priced routes.",
    prerequisites:
      "Complete stacks and heaps in Stacks, Lists & Heaps first. Arrows, nodes and routes are introduced here.",
    prior: "structures",
    next: "recursion-dp",
    why: "Next, use decision trees and smaller subproblems to generate and count answers.",
    outcomes: [
      "Distinguish stack-based DFS from queue-based BFS",
      "Count tree depth using levels",
      "Find representatives of connected groups",
      "Read Dijkstra’s heap, updates and stale entries",
    ],
  },
  "recursion-dp": {
    description:
      "Make include/skip choices, test a scheduling rule, and derive the stair-count recurrence. Recursion and base cases are explained before use.",
    prerequisites:
      "Know stacks, trees and small-list tracing from the previous courses.",
    prior: "graphs",
    next: "pixel-pusher",
    why: "Try a creative application: one small function changes every pixel in an image.",
    outcomes: [
      "Save copies and undo branch choices",
      "Explain why earliest-end scheduling fits this goal",
      "Derive the two final-step groups for stairs",
      "Test the empty-input and zero-stair base cases",
    ],
  },
  "pixel-pusher": {
    description:
      "Use numbers to explain colors. Predict one pixel, try the image filter, connect two functions and repair the actual wrong-channel bug.",
    prerequisites:
      "Basic input/output and arithmetic. The first lesson explains RGB and functions; Foundations is available if lists and named recipes are unfamiliar.",
    prior: "foundations",
    why: "Review with a different sample, or choose another course from the catalog.",
    outcomes: [
      "Compute equal-channel grayscale",
      "Invert channels within 0..255",
      "Explain why pipeline order changes an output",
      "Fix the wrong green/blue values and keep a small regression test",
    ],
  },
};
export function planExample(id: string): BeginnerExample {
  const p = PLANS[id];
  const first = lessonTrace(id, CASES[id][0]);
  return {
    title: p.title,
    input: first[0].state.input ?? p.goal,
    result: first.at(-1)!.output!,
    steps: p.recipe,
    another: {
      title: `Try a contrasting case: ${CASES[id][1].label}`,
      body: `In the lab, choose ${CASES[id][1].label.toLowerCase()}. Before revealing the result, predict what changes and explain why. This contrasting case tests the caution below.`,
    },
    words: p.words.join(" "),
    caution: p.caution,
  };
}
const question = (id: string, q: TeachingQuestion): QuizQ => ({
  id,
  kind: "mcq",
  ...q,
});
export function teachLesson(l: Lesson): Lesson {
  const p = PLANS[l.id];
  if (!p) return l;
  const pages: LessonPage[] = [
    {
      id: l.id + "-goal",
      kind: "story",
      eyebrow: "Your goal",
      title: p.title,
      body: [p.goal, ...p.intro.slice(0, 1)],
      goal: p.goal,
      words: p.words,
    },
    {
      id: l.id + "-idea",
      kind: "concept",
      eyebrow: "The recipe",
      title: `How to ${p.title.toLowerCase()}`,
      body: p.intro.slice(1),
      bullets: p.recipe,
      goal: p.goal,
      words: p.words,
    },
    {
      id: l.id + "-worked",
      kind: "concept",
      eyebrow: "Worked example",
      title: "Follow the same input, one move at a time",
      body: [
        "Read the input and expected output. Then explain each move before opening the interactive trace.",
      ],
      example: planExample(l.id),
      goal: p.goal,
      words: p.words,
    },
    {
      id: l.id + "-practice",
      kind: "try",
      eyebrow: "Guided practice",
      title: "Predict, explore, then try a new case",
      body: [
        "First predict one move. After checking it, use Next move to follow the state changes. Choose a contrasting case to investigate the caution. Finally answer the new-case question to complete this practice.",
      ],
      widget: "guide-" + l.id,
      goal: p.goal,
      words: p.words,
      required: true,
    },
    {
      id: l.id + "-code",
      kind: "code",
      eyebrow: "Complete recipe",
      title: "Connect a code line to the move it makes",
      body: [
        "This is a complete Python example using the same lesson input. Comments explain each line. Choose the missing line below; the restored example can be copied and run in Python 3. You do not need to install Python to complete this course.",
      ],
      code: { title: p.title, lang: "python", text: p.code },
      quiz: question(l.id + "-code-check", p.gap),
      goal: "Connect the missing Python line to the exact recipe move.",
      words: [
        "A function is a named recipe; parameters are its inputs.",
        "Read the comment after # for this line’s role in the lesson example.",
        "Indentation groups steps. = stores a value; == checks equality. Complete the missing line using the recipe you traced.",
      ],
    },
    {
      id: l.id + "-check",
      kind: "quiz",
      eyebrow: "Explain the move",
      title: "Check your reasoning",
      body: [
        "Answer using the recipe, not just the highlighted result. You can reopen a reached section using Sections & help.",
      ],
      quiz: question(l.id + "-check", p.final),
      goal: p.goal,
      words: p.words,
    },
    {
      id: l.id + "-wrap",
      kind: "wrap",
      eyebrow: "Takeaway",
      title: "Name the move you can now explain",
      body: [
        p.recipe.at(-1)!,
        p.caution,
        "You practiced predicting a move, inspecting state, applying the idea to another case, and completing a code line. Revisit freely; completion XP is awarded once.",
      ],
      bullets: [
        "Write what the recipe remembers.",
        "State what the next move changes and why.",
        "Keep the contrasting test case, not just the happy-path example.",
      ],
      goal: p.goal,
      words: p.words,
    },
  ];
  if (l.id === "what-is-algorithm")
    pages.splice(
      1,
      0,
      {
        id: "starter-input",
        kind: "concept",
        eyebrow: "Before we begin",
        title: "Input in. Output out.",
        body: [
          "Think of a recipe that receives three numbers and returns the largest. Input means the information you receive: [4, 1, 7]. Output means the answer you send back: 7.",
          "A list is a group kept in order. [4, 1, 7] has three values. It is not the number 417: commas separate the items.",
        ],
        bullets: [
          "Input: [4, 1, 7]",
          "Requested output: its largest number",
          "Correct output: 7",
        ],
        words: [
          "Input: information received. Output: the requested result. List: an ordered group of items.",
        ],
        goal: "Distinguish the information you receive from the answer you must produce.",
      },
      {
        id: "starter-positions",
        kind: "concept",
        eyebrow: "Before we begin",
        title: "A position is not a value",
        body: [
          "Give each item a position so you can point to it. Programming lists begin at position 0: position 0 holds 4, position 1 holds 1, position 2 holds 7.",
          "The largest VALUE is 7. Its POSITION is 2. Our first task asks for the value, so return 7. A different task might ask for position 2.",
        ],
        bullets: [
          "Position 0 → value 4",
          "Position 1 → value 1",
          "Position 2 → value 7",
        ],
        words: [
          "Index is another word for position. Positions here begin at zero.",
        ],
        goal: "Tell a position apart from the value stored there.",
      },
      {
        id: "starter-memory",
        kind: "concept",
        eyebrow: "Before we begin",
        title: "Remember one thing, then repeat",
        body: [
          "A variable is a name attached to remembered information. We name our memory largest. At first it contains None, meaning no value yet.",
          "A loop repeats instructions: read the next item, compare it with largest, and replace largest only if the new item is greater. After all three items, stop and return largest.",
          "Compare 1 with 4: 1 is not greater, so keep 4. Compare 7 with 4: 7 is greater, so keep 7. The symbol > is just shorthand for “is greater than.”",
        ],
        words: [
          "Variable: a named memory. Loop: repeat steps. Compare: ask how two values relate.",
        ],
        goal: "Trace a remembered value through repeated instructions.",
      },
      {
        id: "starter-python",
        kind: "concept",
        eyebrow: "Reading code gently",
        title: "The words in a Python recipe",
        body: [
          "Python is one programming language. You can complete this course by tracing examples without installing it. We will show complete programs, not incomplete templates.",
          "def names a reusable recipe (a function). Parentheses list its inputs. Indented lines belong to that recipe; a colon starts a group of instructions.",
          "for means repeat for each item. if asks a yes/no question. = stores a value under a name; == compares two values. return sends the answer back. print displays an answer. We will connect these words to our small example, not ask you to memorize syntax first.",
        ],
        words: [
          "Function: a reusable named recipe. Indentation: spaces grouping the recipe’s instructions.",
        ],
        goal: "Recognize the few words needed to read the largest-number example.",
      },
    );
  if (l.id === "union-find-lesson")
    pages[1].body.push(
      "The find function calls itself on a parent until that parent represents itself. That self-parent is the stopping condition. Returning back along the chain updates links to the representative; this is a small, terminating use of recursion.",
    );
  return {
    ...l,
    title: p.title,
    subtitle: p.goal,
    widget: "guide-" + l.id,
    pages,
  };
}
