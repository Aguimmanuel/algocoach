export interface BeginnerExample {
  title: string;
  input: string;
  result: string;
  steps: string[];
  another: { title: string; body: string };
  words: string;
  caution: string;
}
export const BEGINNER: Record<string, BeginnerExample> = {
  brute: {
    title: "Try every pair",
    input: "[2, 4, 6], target = 8",
    result: "One pair: 2 + 6 = 8",
    steps: [
      "Start with 2 and 4. Their sum is 6, not 8.",
      "Try 2 and 6. Their sum is 8: keep this pair.",
      "Try 4 and 6. Their sum is 10, not 8.",
      "There are 3 distinct pairs, not 9: never pair an item with itself and do not check the reversed pair again.",
    ],
    another: {
      title: "Finding a lost key",
      body: "Try every key on a small keyring. With just five keys, a simple exhaustive search is often enough.",
    },
    words:
      "A baseline is a straightforward correct solution you can use to test a faster one.",
    caution:
      "What if the list has fewer than two numbers? There is no pair to try.",
  },
  hashmap: {
    title: "Remember what you have seen",
    input: "[2, 7, 11], target = 9",
    result: "Indices 0 and 1: 2 + 7 = 9",
    steps: [
      "At index 0, the value is 2. Its needed partner is 9 − 2 = 7. The notebook is empty.",
      "Write 2 → index 0 in the notebook.",
      "At index 1, the value is 7. Its needed partner is 9 − 7 = 2.",
      "The notebook already contains 2 at index 0, so return [0, 1].",
    ],
    another: {
      title: "Repeated names",
      body: "For [Ada, Bisi, Ada], a set remembers Ada after the first item. The third item is already present: you found a duplicate.",
    },
    words:
      "A hash map stores key → value. A set only remembers whether a key is present.",
    caution:
      "Check for the partner BEFORE inserting the current value, so one number is not reused twice.",
  },
  "two-pointers": {
    title: "Move the ends inward",
    input: "Sorted [1, 2, 7, 11], target = 9",
    result: "2 + 7 = 9",
    steps: [
      "Left = 1, right = 11. Sum 12 is too large; move right leftward.",
      "Left = 1, right = 7. Sum 8 is too small; move left rightward.",
      "Left = 2, right = 7. Sum 9: found!",
    ],
    another: {
      title: "Check a palindrome",
      body: "Compare the first and last letters of radar, then move inward. Equal outside pairs tell you which smaller substring to inspect.",
    },
    words:
      "A pointer is an index: a number telling you where you are in a collection.",
    caution:
      "The sorted-sum rule requires sorted numbers. Do not silently apply it to an unsorted array.",
  },
  "sliding-window": {
    title: "Keep a useful stretch",
    input: "Text = abca; no repeated letters",
    result: "Longest unique stretch has length 3",
    steps: [
      "Read a: window a, length 1.",
      "Read b, then c: window abc, length 3.",
      "Read the second a: it conflicts with the first a.",
      "Move the left edge past the old a. The window becomes bca, still length 3.",
    ],
    another: {
      title: "Three-day totals",
      body: "For [2, 4, 6, 8], the first three-day sum is 12. Slide once: remove 2, add 8. New sum = 18.",
    },
    words: "Contiguous means adjacent with nothing skipped in between.",
    caution:
      "A rule for shrinking a window must really restore validity; arbitrary sums with negative values may need another pattern.",
  },
  "binary-search": {
    title: "Discard half the possibilities",
    input: "Sorted [2, 5, 8, 12, 16], target = 12",
    result: "Index 3",
    steps: [
      "Look at the middle, index 2: value 8.",
      "12 is larger than 8. Sorted order tells you the left half cannot contain it.",
      "Search indices 3–4. Their lower middle is index 3, value 12.",
      "Found in two checks instead of scanning up to four values.",
    ],
    another: {
      title: "Guess a hidden number",
      body: "If a guess of 50 is too low, you can eliminate every number 1–50 together.",
    },
    words:
      "Sorted means ordered. A monotonic condition changes in only one direction, which also allows binary search.",
    caution:
      "If the target is 9 instead, the interval eventually becomes empty. Report not found.",
  },
  "prefix-sum": {
    title: "Reuse a running total",
    input: "[3, 1, 4, 2], sum of indices 1–2",
    result: "1 + 4 = 5",
    steps: [
      "Build a prefix array starting with zero: [0, 3, 4, 8, 10].",
      "Prefix[3] = 8 includes items at indices 0, 1, 2.",
      "Prefix[1] = 3 includes only the item before index 1.",
      "Subtract: 8 − 3 = 5. Use prefix[right + 1] − prefix[left].",
    ],
    another: {
      title: "Spending between days",
      body: "Cumulative spending is [0, 10, 15, 23]. Spending on days 2–3 is 23 − 10 = 13.",
    },
    words:
      "An index starts at 0. An exclusive boundary points just after the last included item.",
    caution:
      "The extra starting zero makes ranges beginning at index 0 work without a special case.",
  },
  sorting: {
    title: "Put related things together",
    input: "[4, 1, 3, 1]",
    result: "Sorted [1, 1, 3, 4]",
    steps: [
      "Compare the unsorted list with its ascending version.",
      "The two 1s become neighbors. Duplicate detection is now an adjacent comparison.",
      "The smallest value is at the front; the largest is at the end.",
    ],
    another: {
      title: "Closest prices",
      body: "Sorted prices [5, 9, 10, 30] have gaps 4, 1, 20. The closest pair is 9 and 10.",
    },
    words:
      "Sorting rearranges items into an order; it may change their original positions.",
    caution:
      "If you must return original indices, keep each item together with its original index.",
  },
  "linked-list": {
    title: "Follow the next link",
    input: "A → B → C → end",
    result: "Reversed: C → B → A → end",
    steps: [
      "Save B before changing A’s next link. Set A.next to end.",
      "At B, save C. Set B.next to A.",
      "At C, save end. Set C.next to B.",
      "C is the new head. Every link now points backward.",
    ],
    another: {
      title: "Train carriages",
      body: "A carriage tells you which carriage comes next. Unlike array positions, you follow connections to reach a distant carriage.",
    },
    words:
      "The head is the first node. A node holds a value and a link to another node.",
    caution: "Saving the next link first prevents losing the rest of the list.",
  },
  stack: {
    title: "Undo the most recent action",
    input: "Read parentheses: (())",
    result: "Balanced",
    steps: [
      "Push the first opening bracket onto a stack.",
      "Push the second opening bracket.",
      "The first closing bracket matches and removes the most recent opening bracket.",
      "The final closing bracket removes the remaining one. The stack ends empty.",
    ],
    another: {
      title: "Undo typing",
      body: "Type A, then B. Undo removes B first. A stack follows last in, first out.",
    },
    words: "Push adds an item. Pop removes the most recently added item.",
    caution:
      "A closing bracket when the stack is empty is invalid; leftover openings at the end are invalid too.",
  },
  bfs: {
    title: "Explore one layer at a time",
    input: "A → B, A → C, B → D",
    result: "Fewest edges from A to D: 2",
    steps: [
      "Queue starts [A], distance(A) = 0.",
      "Remove A; add B and C with distance 1.",
      "Remove B; add D with distance 2.",
      "D is first reached after two edges. No shorter unweighted path exists.",
    ],
    another: {
      title: "Friends of friends",
      body: "Look at direct friends first, then their friends. That is distance one, then distance two.",
    },
    words:
      "A queue processes the earliest added item first. A graph has nodes and connections.",
    caution:
      "Mark a node when you add it to the queue, otherwise cycles can add it repeatedly.",
  },
  dfs: {
    title: "Finish one branch first",
    input: "A has children B, C; B has child D",
    result: "One DFS order: A, B, D, C",
    steps: [
      "Visit A and choose its first branch, B.",
      "From B, keep going to D.",
      "D has no unexplored neighbors: go back to B, then A.",
      "Now visit A’s other branch, C.",
    ],
    another: {
      title: "Search a maze",
      body: "Follow one corridor until it ends, then retrace your steps to try another.",
    },
    words:
      "Backtracking means returning to an earlier choice point. DFS can use recursion or a stack.",
    caution:
      "Neighbor order can change the visit order. DFS does not generally find the shortest path.",
  },
  trees: {
    title: "Reuse answers from the children",
    input: "Root A; children B and C; B has child D",
    result: "Height = 3 levels",
    steps: [
      "D has no children, so height(D) = 1.",
      "B has a child of height 1, so height(B) = 2.",
      "C is a leaf, so height(C) = 1.",
      "A is 1 + max(2, 1) = 3 levels tall.",
    ],
    another: {
      title: "Folders inside folders",
      body: "A folder contains subfolders. Count or inspect each smaller subtree, then combine its result with the current folder.",
    },
    words:
      "A leaf has no children. A subtree is a node together with everything below it.",
    caution:
      "Some definitions count edges instead of nodes; this example explicitly counts levels.",
  },
  backtracking: {
    title: "Choose, explore, undo",
    input: "Make all length-2 strings using A and B",
    result: "AA, AB, BA, BB",
    steps: [
      "Choose A first. Choose A again: record AA.",
      "Undo the second choice. Choose B: record AB.",
      "Undo both choices; choose B first.",
      "Explore A and B as the second choice: record BA and BB.",
    ],
    another: {
      title: "Pack a lunch",
      body: "Try a sandwich, then a drink. Undo the drink choice to try another combination.",
    },
    words:
      "A decision tree lists choices at each step. Pruning skips branches that cannot produce a valid answer.",
    caution:
      "Copy the current answer before saving it, so later undo operations do not change previous answers.",
  },
  intervals: {
    title: "Merge overlapping time blocks",
    input: "Meetings [1, 3], [2, 5], [7, 8]",
    result: "Merged [1, 5], [7, 8]",
    steps: [
      "Sort by starting time.",
      "Start with [1, 3]. The next meeting starts at 2, before 3: they overlap.",
      "Extend the end to max(3, 5) = 5.",
      "The last meeting starts at 7, after 5. Begin a separate block.",
    ],
    another: {
      title: "Booked calendar time",
      body: "Combine overlapping reservations to find when a room is unavailable.",
    },
    words:
      "An interval describes a start and an end, not each individual point inside.",
    caution:
      "Decide whether touching endpoints count as overlap. Closed and half-open intervals have different rules.",
  },
  dp: {
    title: "Remember answers to smaller problems",
    input: "Climb 4 stairs, taking 1 or 2 at a time",
    result: "5 ways",
    steps: [
      "Ways(0) = 1: doing nothing is one way to finish zero stairs. Ways(1) = 1.",
      "To reach step 2, arrive from step 1 or step 0: 1 + 1 = 2.",
      "Ways(3) = Ways(2) + Ways(1) = 2 + 1 = 3.",
      "Ways(4) = Ways(3) + Ways(2) = 3 + 2 = 5.",
    ],
    another: {
      title: "Plan the cheapest journey",
      body: "If many journeys share the same remaining route, solve that route once and reuse its answer.",
    },
    words:
      "A state describes a smaller problem. A recurrence explains how smaller answers combine.",
    caution:
      "Base cases are part of the algorithm. An incorrect starting value gives incorrect later answers.",
  },
  greedy: {
    title: "Choose what leaves room for more",
    input: "Activities [1, 3], [2, 5], [4, 6]",
    result: "Choose [1, 3] and [4, 6]",
    steps: [
      "Sort activities by finishing time.",
      "Take [1, 3], which finishes earliest.",
      "Reject [2, 5] because it overlaps the chosen activity.",
      "Take [4, 6]. You completed two activities.",
    ],
    another: {
      title: "Serve short tasks first?",
      body: "A locally attractive choice is only useful when you can justify that it never harms the required final goal.",
    },
    words:
      "Greedy commits to a local choice without exploring every future branch.",
    caution:
      "Greedy is not always correct: largest-coin-first fails for coins [1, 3, 4] and amount 6 (4+1+1 vs 3+3).",
  },
  heap: {
    title: "Keep the next priority ready",
    input: "Insert priorities 8, 3, 5 into a min-heap",
    result: "Next removal is 3",
    steps: [
      "A min-heap keeps its smallest value at the root.",
      "Insert values while restoring that rule.",
      "Remove the root, 3, then restore the heap.",
      "The next smallest, 5, is ready without sorting the whole collection again.",
    ],
    another: {
      title: "Emergency queue",
      body: "A priority queue serves the highest-priority item, not necessarily the earliest arrival.",
    },
    words:
      "A heap is a data structure with an efficient top-priority operation; it is not a fully sorted array.",
    caution:
      "Choose a min-heap for the smallest value or a max-heap for the largest.",
  },
  "union-find": {
    title: "Join groups and test connections",
    input: "People A, B, C. Join A–B, then B–C",
    result: "A and C belong to one group",
    steps: [
      "Initially each person represents a separate group.",
      "Joining A and B connects their group representatives.",
      "Joining B and C joins C to that same group.",
      "Find(A) and Find(C) return the same representative: they are connected.",
    ],
    another: {
      title: "Connect communities",
      body: "When two clubs merge, every member becomes part of the combined group, not just the two organizers.",
    },
    words:
      "A representative is a label for a whole connected group. Path compression makes later lookups faster.",
    caution:
      "This structure answers connectivity, not the actual shortest route between two people.",
  },
  dijkstra: {
    title: "Explore the cheapest known route",
    input: "Directed roads S→A:4, S→B:2, A→B:1, A→C:5, B→C:8, B→T:10, C→T:2",
    result: "Distance to T = 11, via S→A→C→T",
    steps: [
      "Start at S, cost 0. Tentative costs: A=4, B=2.",
      "Settle B at 2. It suggests C=10 and T=12.",
      "Settle A at 4. It improves C to 9 (4+5).",
      "Settle C at 9. It improves T to 11 (9+2). Finally settle T.",
    ],
    another: {
      title: "Travel times",
      body: "BFS treats each road as one step. Dijkstra accounts for unequal non-negative travel costs.",
    },
    words:
      "Tentative means best known so far. Settled means the shortest distance is final.",
    caution:
      "Direction matters: A→B does not permit B→A. Dijkstra cannot safely handle negative edges.",
  },
  foundations: {
    title: "A recipe you can test",
    input: "Find the largest of [4, 1, 7]",
    result: "7",
    steps: [
      "Keep 4 as your best so far.",
      "Compare 1: it is smaller, so keep 4.",
      "Compare 7: it is larger, so update your best to 7.",
      "You examined each item once. For n items, this idea does n comparisons up to a constant difference.",
    ],
    another: {
      title: "A class register",
      body: "Count students by scanning each name once. Double the register length and you do roughly twice the work.",
    },
    words:
      "Input is what you receive. Output is what you must return. n is the input size.",
    caution:
      "An empty list has no largest item unless the task defines a special output.",
  },
  pixels: {
    title: "One tiny function, thousands of pixels",
    input: "Pixel (30, 60, 90), apply grayscale",
    result: "(60, 60, 60)",
    steps: [
      "Red is 30, green is 60, blue is 90. These are three channel intensities, not coordinates.",
      "Add them: 30 + 60 + 90 = 180.",
      "Divide by 3: 180 ÷ 3 = 60.",
      "Return three copies of 60 so the output still has red, green, and blue channels.",
    ],
    another: {
      title: "Keep just green",
      body: "For (120, 200, 80), return (0, 200, 0). Applying the same rule to every pixel changes the entire picture.",
    },
    words:
      "A tuple groups values in a fixed order. A function takes input and returns output.",
    caution:
      "Channels must remain in 0–255 and every output pixel must contain three channel values.",
  },
  compose: {
    title: "Follow the output, not just the names",
    input: "Pixel (60, 60, 60); brighten +100 and threshold 128",
    result: "Brighten→threshold: (255,255,255). Reverse: (100,100,100).",
    steps: [
      "Brighten first: 60+100 gives 160 for each channel.",
      "Threshold compares average 160 with 128: return white, 255.",
      "Reverse it: threshold sees average 60 and returns black, 0.",
      "Brightening black by 100 gives dark gray, not black. Order changed the result.",
    ],
    another: {
      title: "Cooking stages",
      body: "Bake then frost is different from frost then bake. Each stage receives the previous stage’s output.",
    },
    words: "Composition means feeding the result of one function into another.",
    caution:
      "Some operations commute, but do not assume that all pairs of filters do.",
  },
  invert: {
    title: "Turn light into dark",
    input: "Pixel (20, 200, 255)",
    result: "(235, 55, 0)",
    steps: [
      "Red: 255−20 = 235.",
      "Green: 255−200 = 55.",
      "Blue: 255−255 = 0.",
      "Invert again: (20, 200, 255). The original pixel returns.",
    ],
    another: {
      title: "Safe brightness",
      body: "Brightening (250, 0, 0) by 20 must return (255, 20, 20), not (270, 20, 20). Clamp each channel.",
    },
    words: "Clamp means limit a value to a permitted range.",
    caution:
      "Darkening also needs a lower bound: 10−40 must clamp to 0, not remain −30.",
  },
  debug: {
    title: "Test the smallest case",
    input: "Broken grayscale(30,60,90) returns (60,0,0)",
    result: "Expected (60,60,60)",
    steps: [
      "Check the arithmetic: the average 60 is right.",
      "Count three returned values, then compare them: green and blue are incorrectly zero.",
      "The renderer already receives three values, but grayscale needs the same average in all three.",
      "Fix the return to (avg,avg,avg), then rerun the one-pixel test before processing a whole image.",
    ],
    another: {
      title: "Black and white tests",
      body: "invert(0,0,0) must return white; invert(255,255,255) must return black. These extremes reveal mistakes quickly.",
    },
    words:
      "An assertion checks whether an actual result equals the expected result.",
    caution:
      "A correct-looking image does not prove the code handles every input.",
  },
};

BEGINNER["big-o"] = {
  title: "Count the work, not the seconds",
  input: "Input grows from 4 items to 8",
  result: "Linear: 4 → 8 checks. Quadratic: 16 → 64 checks.",
  steps: [
    "A single pass does about n checks: 4 now, 8 after doubling.",
    "Two full loops do n × n checks: 4 × 4 = 16.",
    "With 8 items, the same two loops do 8 × 8 = 64 checks.",
    "Doubling n doubled linear work but quadrupled quadratic work. Big-O describes growth, not an exact stopwatch time.",
  ],
  another: {
    title: "Find one name vs every pair",
    body: "Finding a name in an unsorted register scans entries one by one. Comparing every student with every other student multiplies the work instead.",
  },
  words:
    "O(n) means work grows proportionally with input size. O(n²) means it grows like the square of that size.",
  caution:
    "Constants, input structure, language, and time limits still matter. Complexity is a guide, not a guaranteed runtime.",
};
BEGINNER["reading"] = {
  title: "Turn a statement into a plan",
  input: "[2, 7, 11], target 9; return TWO indices",
  result: "[0, 1], not the values [2, 7]",
  steps: [
    "Restate: I need two different positions whose values sum to 9.",
    "Try a tiny example: positions 0 and 1 hold 2 and 7. Their sum is 9.",
    "A slow baseline tries every pair. With n items, that repeats work quadratically.",
    "A faster idea remembers previously seen values. Before coding, test duplicate values and a no-answer case too.",
  ],
  another: {
    title: "Small tests expose misunderstandings",
    body: "For [3, 3] and target 6, the two equal values are at different indices. For [3] there is only one index, so it cannot be reused as both numbers.",
  },
  words:
    "A constraint is a limit on valid inputs. An index is a position; a value is the item stored there.",
  caution:
    "Read the required output carefully. Returning values instead of indices solves a different problem.",
};
