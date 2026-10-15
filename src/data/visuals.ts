import {
  PLAYGROUND_EXAMPLES,
  type PlaygroundInput,
} from "./playgroundExamples";

/**
 * A run-through of every algorithm, as frames.
 *
 * Each pattern gets a real code listing and a list of frames — one frame per
 * meaningful moment, each carrying the index of the line that caused it. The
 * picture and the code move together, so the animation teaches the *mechanism*
 * rather than just being a nice moving thing beside some source.
 *
 * Everything is generated from a small, fixed example rather than hand-recorded,
 * so the steps are the actual steps the code takes. Two view types cover all
 * nineteen patterns: labelled rows of cells (arrays, tables, heaps, queues) and
 * a grid (paths, floods, components).
 */

export type CellState = "idle" | "active" | "done" | "dim" | "hint" | "warning";

export interface Cell {
  v: string;
  state?: CellState;
}

export interface Pointer {
  /** index into the row's cells */
  at: number;
  text: string;
}

export interface Row {
  label?: string;
  cells: Cell[];
  pointers?: Pointer[];
}

export interface Frame {
  rows?: Row[];
  grid?: Cell[][];
  /** what just happened, in one sentence */
  msg: string;
  /** index into the code listing */
  line: number;
}

export interface Visual {
  /** Computed by the simulation, independently of authored expected answers. */
  output: unknown;
  code: string[];
  frames: Frame[];
  /** one line describing what the run is solving */
  about: string;
}

/* ------------------------------------------------------------------ helpers */

const row = (
  label: string,
  values: (string | number)[],
  states: Record<number, CellState> = {},
  pointers: Pointer[] = [],
): Row => ({
  label,
  cells: values.map((v, i) => ({ v: String(v), state: states[i] ?? "idle" })),
  pointers,
});

/* --------------------------------------------------------------------- brute */

function brute(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const target = example.target ?? 0;
  const code = [
    "def find_pair(arr, target):",
    "    for i in range(len(arr)):",
    "        for j in range(i + 1, len(arr)):",
    "            if arr[i] + arr[j] == target:",
    "                return [i, j]",
    "    return [-1, -1]",
  ];
  const frames: Frame[] = [
    {
      line: 0,
      rows: [row("arr", arr)],
      msg: `Looking for two numbers in the list that add up to ${target}.`,
    },
  ];
  let comparisons = 0;
  let found: [number, number] | null = null;
  for (let i = 0; i < arr.length && !found; i++) {
    frames.push({
      line: 1,
      rows: [row("arr", arr, { [i]: "active" }, [{ at: i, text: "i" }])],
      msg: `Take arr[${i}] = ${arr[i]}. Now try every partner to its right.`,
    });
    for (let j = i + 1; j < arr.length; j++) {
      comparisons++;
      const sum = arr[i] + arr[j];
      frames.push({
        line: 3,
        rows: [
          row("arr", arr, { [i]: "active", [j]: "active" }, [
            { at: i, text: "i" },
            { at: j, text: "j" },
          ]),
        ],
        msg: `${arr[i]} + ${arr[j]} = ${sum}${sum === target ? " — that is the pair." : `, not ${target}.`}`,
      });
      if (sum === target) {
        found = [i, j];
        break;
      }
    }
  }
  const [i, j] = found ?? [-1, -1];
  frames.push({
    line: found ? 4 : 5,
    rows: [row("arr", arr, i >= 0 ? { [i]: "done", [j]: "done" } : {})],
    msg:
      i >= 0
        ? `Answer: indices ${i} and ${j}.`
        : "No pair adds up to the target.",
  });
  frames.push({
    line: found ? 4 : 5,
    rows: [row("arr", arr, i >= 0 ? { [i]: "done", [j]: "done" } : {})],
    msg: `Checked ${comparisons} pair${comparisons === 1 ? "" : "s"}. A full unsuccessful search checks n(n−1)/2 pairs.`,
  });
  return {
    output: found ?? [-1, -1],
    code,
    frames,
    about: `Find two numbers that sum to ${target} by checking every pair.`,
  };
}

/* ------------------------------------------------------------------- hashing */

function hashmap(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const target = example.target ?? 0;
  const code = [
    "def find_pair(arr, target):",
    "    seen = {}",
    "    for i, x in enumerate(arr):",
    "        need = target - x",
    "        if need in seen:",
    "            return [seen[need], i]",
    "        seen[x] = i",
    "    return [-1, -1]",
  ];
  const seen = new Map<number, number>();
  const table = () =>
    row(
      "seen: value → position",
      seen.size
        ? [...seen].map(([value, index]) => `${value}→${index}`)
        : ["—"],
    );
  const frames: Frame[] = [
    {
      line: 1,
      rows: [row("arr", arr), table()],
      msg: `Look for a pair summing to ${target}. The map remembers earlier positions only.`,
    },
  ];
  let answer: [number, number] | null = null;
  let lookups = 0;
  for (let i = 0; i < arr.length; i++) {
    const need = target - arr[i];
    lookups++;
    frames.push({
      line: 3,
      rows: [
        row("arr", arr, { [i]: "active" }, [{ at: i, text: "i" }]),
        table(),
      ],
      msg: `At position ${i}, value ${arr[i]} needs a partner of ${need}.`,
    });
    if (seen.has(need)) {
      answer = [seen.get(need)!, i];
      frames.push({
        line: 5,
        rows: [row("arr", arr, { [answer[0]]: "done", [i]: "done" }), table()],
        msg: `The partner ${need} is at earlier position ${answer[0]}. Return [${answer[0]}, ${i}].`,
      });
      break;
    }
    seen.set(arr[i], i);
    frames.push({
      line: 6,
      rows: [row("arr", arr, { [i]: "done" }), table()],
      msg: `No earlier partner. Remember value ${arr[i]} at position ${i}.`,
    });
  }
  frames.push({
    line: answer ? 5 : 7,
    rows: [row("arr", arr), table()],
    msg: `Checked ${lookups} value${lookups === 1 ? "" : "s"} with one map lookup each. ${answer ? "Stop at the first match." : "No matching pair exists."}`,
  });
  return {
    code,
    frames,
    output: answer ?? [-1, -1],
    about: `Find two different positions whose values sum to ${target}, remembering what has already been seen.`,
  };
}

function twoPointers(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const target = example.target ?? 0;
  const code = [
    "def pair_sum_sorted(arr, target):",
    "    left, right = 0, len(arr) - 1",
    "    while left < right:",
    "        total = arr[left] + arr[right]",
    "        if total == target:",
    "            return [left, right]",
    "        elif total < target:",
    "            left += 1",
    "        else:",
    "            right -= 1",
    "    return [-1, -1]",
  ];
  const frames: Frame[] = [];
  let answer: [number, number] | null = null;
  let left = 0;
  let right = arr.length - 1;
  frames.push({
    line: 1,
    rows: [
      row("arr", arr, {}, [
        { at: left, text: "left" },
        { at: right, text: "right" },
      ]),
    ],
    msg: "The list is sorted, so the ends tell us which way to move.",
  });
  while (left < right) {
    const total = arr[left] + arr[right];
    frames.push({
      line: 3,
      rows: [
        row("arr", arr, { [left]: "active", [right]: "active" }, [
          { at: left, text: "left" },
          { at: right, text: "right" },
        ]),
      ],
      msg: `${arr[left]} + ${arr[right]} = ${total}.`,
    });
    if (total === target) {
      answer = [left, right];
      frames.push({
        line: 5,
        rows: [row("arr", arr, { [left]: "done", [right]: "done" })],
        msg: `Found it: indices ${left} and ${right}.`,
      });
      break;
    }
    if (total < target) {
      left += 1;
      frames.push({
        line: 7,
        rows: [
          row("arr", arr, { [left - 1]: "dim" }, [
            { at: left, text: "left" },
            { at: right, text: "right" },
          ]),
        ],
        msg: `${total} is too small — the left value can only get bigger, so move left up.`,
      });
    } else {
      right -= 1;
      frames.push({
        line: 9,
        rows: [
          row("arr", arr, { [right + 1]: "dim" }, [
            { at: left, text: "left" },
            { at: right, text: "right" },
          ]),
        ],
        msg: `${total} is too big — move right down.`,
      });
    }
  }
  if (!answer)
    frames.push({
      line: 10,
      rows: [row("arr", arr)],
      msg: "The pointers meet without a match. Return [-1, -1].",
    });
  return {
    output: answer ?? [-1, -1],
    code,
    frames,
    about: `Find two numbers summing to ${target} by walking in from both ends.`,
  };
}

/* ------------------------------------------------------------ sliding window */

function slidingWindow(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const k = example.k ?? 1;
  const code = [
    "def max_window_sum(arr, k):",
    "    window = sum(arr[:k])",
    "    best = window",
    "    for end in range(k, len(arr)):",
    "        window += arr[end] - arr[end - k]",
    "        best = max(best, window)",
    "    return best",
  ];
  const frames: Frame[] = [];
  let window = arr.slice(0, k).reduce((a, b) => a + b, 0);
  let best = window;
  frames.push({
    line: 1,
    rows: [
      row(
        "arr",
        arr,
        Object.fromEntries(
          Array.from({ length: k }, (_, i) => [i, "active" as CellState]),
        ),
      ),
      row("window", [`sum ${window}`]),
    ],
    msg: `Start with the first ${k} numbers: ${window}.`,
  });
  frames.push({
    line: 2,
    rows: [
      row(
        "arr",
        arr,
        Object.fromEntries(
          Array.from({ length: k }, (_, i) => [i, "active" as CellState]),
        ),
      ),
      row("window", [`sum ${window}`]),
      row("best", [best]),
    ],
    msg: `Best so far is ${best}.`,
  });
  for (let end = k; end < arr.length; end++) {
    const out = arr[end - k];
    const inn = arr[end];
    window += inn - out;
    best = Math.max(best, window);
    const states: Record<number, CellState> = {};
    for (let i = end - k + 1; i <= end; i++) states[i] = "active";
    states[end] = "done";
    states[end - k] = "dim";
    frames.push({
      line: 5,
      rows: [
        row("arr", arr, states),
        row("window", [`sum ${window}`]),
        row("best", [best]),
      ],
      msg: `Slide right: add ${inn}, drop ${out}. New window sum ${window}.`,
    });
  }
  frames.push({
    line: 6,
    rows: [row("arr", arr), row("best", [best], { 0: "done" })],
    msg: `Best window sum is ${best}, after ${arr.length - k} updates instead of ${arr.length - k + 1} re-counts.`,
  });
  return {
    output: best,
    code,
    frames,
    about: `Largest sum of ${k} consecutive numbers.`,
  };
}

/* --------------------------------------------------------------- prefix sums */

function prefixSum(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const prefix = [0];
  const code = [
    "def build_prefix(arr):",
    "    prefix = [0]",
    "    for x in arr:",
    "        prefix.append(prefix[-1] + x)",
    "    return prefix",
    "",
    "def range_sum(prefix, i, j):",
    "    return prefix[j + 1] - prefix[i]",
  ];
  const frames: Frame[] = [];
  frames.push({
    line: 1,
    rows: [row("arr", arr), row("prefix", prefix, { 0: "active" })],
    msg: "Prefix starts with a 0, so sums are just a subtraction.",
  });
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[prefix.length - 1] + arr[i]);
    const states: Record<number, CellState> = { [i + 1]: "active" };
    frames.push({
      line: 3,
      rows: [row("arr", arr, { [i]: "active" }), row("prefix", prefix, states)],
      msg: `Running total is now ${prefix[i + 1]}.`,
    });
  }
  const i = example.from ?? 0;
  const j = example.to ?? arr.length - 1;
  frames.push({
    line: 7,
    rows: [
      row(
        "arr",
        arr,
        Object.fromEntries(
          Array.from({ length: j - i + 1 }, (_, offset) => [
            i + offset,
            "active" as CellState,
          ]),
        ),
      ),
      row("prefix", prefix, { [i]: "done", [j + 1]: "done" }),
    ],
    msg: `Sum of indices ${i}…${j} = prefix[${j + 1}] (${prefix[j + 1]}) − prefix[${i}] (${prefix[i]}) = ${prefix[j + 1] - prefix[i]}.`,
  });
  frames.push({
    line: 7,
    rows: [row("prefix", prefix)],
    msg: "One subtraction per query, no matter how long the range.",
  });
  return {
    output: prefix[j + 1] - prefix[i],
    code,
    frames,
    about: `Answer range sums of arr[${i}…${j}] in one step.`,
  };
}

/* ------------------------------------------------------------ binary search */

function binarySearch(example: PlaygroundInput): Visual {
  const arr = example.values ?? [];
  const target = example.target ?? 0;
  const code = [
    "def binary_search(arr, target):",
    "    lo, hi = 0, len(arr) - 1",
    "    while lo <= hi:",
    "        mid = (lo + hi) // 2",
    "        if arr[mid] == target:",
    "            return mid",
    "        elif arr[mid] < target:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid - 1",
    "    return -1",
  ];
  const frames: Frame[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  let steps = 0;
  const dead = new Set<number>();
  const mk = (marks: Record<number, CellState>, ptrs: Pointer[]): Row => ({
    label: "arr",
    cells: arr.map((v, i) => ({
      v: String(v),
      state: marks[i] ?? (dead.has(i) ? "dim" : "idle"),
    })),
    pointers: ptrs.filter((p) => p.at >= 0 && p.at < arr.length),
  });

  frames.push({
    line: 1,
    rows: [
      mk({}, [
        { at: lo, text: "lo" },
        { at: hi, text: "hi" },
      ]),
    ],
    msg: `Searching for ${target} in ${arr.length} sorted numbers.`,
  });
  while (lo <= hi) {
    steps++;
    const mid = (lo + hi) >> 1;
    frames.push({
      line: 3,
      rows: [
        mk({}, [
          { at: lo, text: "lo" },
          { at: mid, text: "mid" },
          { at: hi, text: "hi" },
        ]),
      ],
      msg: `Middle of the window ${lo}…${hi} is index ${mid}.`,
    });
    if (arr[mid] === target) {
      frames.push({
        line: 5,
        rows: [mk({ [mid]: "done" }, [])],
        msg: `arr[${mid}] = ${target}. Found it in ${steps} comparisons.`,
      });
      return {
        output: mid,
        code,
        frames,
        about: `Find ${target} in ${arr.length} sorted numbers.`,
      };
    }
    if (arr[mid] < target) {
      for (let i = lo; i <= mid; i++) dead.add(i);
      lo = mid + 1;
      frames.push({
        line: 7,
        rows: [
          mk({}, [
            { at: lo, text: "lo" },
            { at: hi, text: "hi" },
          ]),
        ],
        msg: `${arr[mid]} < ${target}, so everything up to index ${mid} is ruled out.`,
      });
    } else {
      for (let i = mid; i <= hi; i++) dead.add(i);
      hi = mid - 1;
      frames.push({
        line: 9,
        rows: [
          mk({}, [
            { at: lo, text: "lo" },
            { at: hi >= lo ? hi : lo, text: "hi" },
          ]),
        ],
        msg: `${arr[mid]} > ${target}, so everything above index ${mid} is ruled out.`,
      });
    }
  }
  frames.push({
    line: 10,
    rows: [mk({}, [])],
    msg: "The interval is empty. The target is absent; return -1.",
  });
  return {
    output: -1,
    code,
    frames,
    about: `Find ${target} in ${arr.length} sorted numbers.`,
  };
}

/* ------------------------------------------------------------------ sorting */

function sorting(example: PlaygroundInput): Visual {
  const input = example.values ?? [];
  const arr = [...input];
  const code = [
    "def insertion_sort(arr):",
    "    for i in range(1, len(arr)):",
    "        key = arr[i]",
    "        j = i - 1",
    "        while j >= 0 and arr[j] > key:",
    "            arr[j + 1] = arr[j]",
    "            j -= 1",
    "        arr[j + 1] = key",
    "    return arr",
  ];
  const frames: Frame[] = [
    {
      line: 0,
      rows: [row("arr", arr)],
      msg: "Sorted order makes almost every other pattern cheaper.",
    },
    {
      line: 1,
      rows: [row("arr", arr, { 0: "done" })],
      msg: "The first element is a sorted list of one.",
    },
  ];
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    frames.push({
      line: 2,
      rows: [
        row("arr", arr, { [i]: "active" }, [{ at: i, text: `key ${key}` }]),
      ],
      msg: `Take ${key} out and find where it belongs.`,
    });
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      frames.push({
        line: 5,
        rows: [row("arr", arr, { [j]: "active", [j + 1]: "hint" })],
        msg: `${arr[j]} > ${key}, so shift it right.`,
      });
      j--;
    }
    arr[j + 1] = key;
    const sortedStates: Record<number, CellState> = {};
    for (let k = 0; k <= i; k++) sortedStates[k] = "done";
    frames.push({
      line: 7,
      rows: [row("arr", arr, { ...sortedStates, [j + 1]: "active" })],
      msg: `Put ${key} at index ${j + 1}.`,
    });
  }
  frames.push({
    line: 8,
    rows: [
      row(
        "arr",
        arr,
        Object.fromEntries(arr.map((_, i) => [i, "done" as CellState])),
      ),
    ],
    msg: "Sorted, in at most n²/2 shifts.",
  });
  return {
    output: [...arr],
    code,
    frames,
    about: `Sort ${input.join(", ")} by insertion.`,
  };
}

/* -------------------------------------------------------------- linked list */

function linkedList(example: PlaygroundInput): Visual {
  const values = example.values ?? [];
  const code = [
    "def reverse(head):",
    "    prev = None",
    "    while head:",
    "        nxt = head.next",
    "        head.next = prev",
    "        prev = head",
    "        head = nxt",
    "    return prev",
  ];
  const detail = (
    prev: number | null,
    cur: number,
    nxt: number | null,
    flipped: boolean,
  ): Row[] => {
    const states: Record<number, CellState> = {};
    values.forEach((_, i) => {
      if (i === cur) states[i] = "active";
      else if (flipped && i <= cur && i > 0) states[i] = "done";
    });
    return [
      row("list", values, states, [
        ...(prev !== null ? [{ at: prev, text: "prev" }] : []),
        { at: cur, text: "cur" },
        ...(nxt !== null ? [{ at: nxt, text: "next" }] : []),
      ]),
    ];
  };
  const frames: Frame[] = [
    {
      line: 0,
      rows: [row("list", values)],
      msg: "Point each node backwards instead of forwards.",
    },
    {
      line: 1,
      rows: values.length
        ? detail(null, 0, values.length > 1 ? 1 : null, false)
        : [row("list", [])],
      msg: "prev starts empty; cur is the head.",
    },
  ];
  let prev: number | null = null;
  let cur: number | null = values.length ? 0 : null;
  while (cur !== null) {
    const nxt: number | null = cur + 1 < values.length ? cur + 1 : null;
    frames.push({
      line: 3,
      rows: detail(prev, cur, nxt, true),
      msg: `Save the rest of the list (${nxt === null ? "end" : `node ${values[nxt]}`}) before rewiring.`,
    });
    frames.push({
      line: 4,
      rows: detail(prev, cur, nxt, true),
      msg: `Point node ${values[cur]} backwards${prev === null ? " to nothing — it becomes the new tail" : ` at node ${values[prev]}`}.`,
    });
    prev = cur;
    cur = nxt;
    frames.push({
      line: 6,
      rows: detail(
        prev,
        cur ?? prev,
        cur === null ? null : cur + 1 < values.length ? cur + 1 : null,
        true,
      ),
      msg:
        cur === null
          ? "cur is off the end, so prev is the new head."
          : "Advance both pointers.",
    });
  }
  frames.push({
    line: 7,
    rows: [
      row(
        "reversed list",
        [...values].reverse(),
        Object.fromEntries(values.map((_, i) => [i, "done" as CellState])),
      ),
    ],
    msg: values.length
      ? "The new head starts the reversed chain. One pass, no extra list copied."
      : "The head is None, so there is nothing to reverse.",
  });
  return {
    output: [...values].reverse(),
    code,
    frames,
    about: "Reverse a linked list in place.",
  };
}

/* ------------------------------------------------------------------- stack */

function stack(example: PlaygroundInput): Visual {
  const text = example.text ?? "";
  const code = [
    "def is_valid(s):",
    "    pairs = {')': '(', ']': '[', '}': '{'}",
    "    stack = []",
    "    for ch in s:",
    "        if ch in pairs:",
    "            if not stack or stack.pop() != pairs[ch]:",
    "                return False",
    "        else:",
    "            stack.append(ch)",
    "    return not stack",
  ];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const pending: string[] = [];
  const frames: Frame[] = [
    {
      line: 2,
      rows: [row("chars", text.split("")), row("stack", ["—"])],
      msg: "A closer must match the most recent opener.",
    },
  ];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const chars = row("chars", text.split(""), { [i]: "active" });
    if (pairs[ch]) {
      const top = pending.pop();
      const matches = top === pairs[ch];
      frames.push({
        line: matches ? 5 : 6,
        rows: [chars, row("stack", pending.length ? pending : ["—"])],
        msg: matches
          ? `${ch} matches ${top}; remove that opener.`
          : `${ch} needs ${pairs[ch]}, but ${top === undefined ? "the stack is empty" : `the top is ${top}`}. Return False immediately.`,
      });
      if (!matches)
        return {
          code,
          frames,
          output: false,
          about: `Check ${JSON.stringify(text)} for balanced brackets.`,
        };
    } else {
      pending.push(ch);
      frames.push({
        line: 8,
        rows: [
          chars,
          row("stack", pending, { [pending.length - 1]: "active" }),
        ],
        msg: `Push ${ch}. It must be closed before older openers.`,
      });
    }
  }
  frames.push({
    line: 9,
    rows: [row("stack", pending.length ? pending : ["—"])],
    msg: pending.length
      ? "Openers remain unmatched. Return False."
      : "No unmatched openers remain. Return True.",
  });
  return {
    code,
    frames,
    output: pending.length === 0,
    about: `Check ${JSON.stringify(text)} for balanced brackets.`,
  };
}

/* -------------------------------------------------------------- grid helpers */

const GRID: string[] = [
  "S.....",
  "####.#",
  ".....#",
  "####.#",
  "......",
  ".#..T.",
];
const COLS = GRID[0].length;

const gridCells = (
  grid: string[],
  fn: (r: number, c: number) => Cell,
): Cell[][] => grid.map((line, r) => line.split("").map((_, c) => fn(r, c)));

/* --------------------------------------------------------------------- BFS */

function bfs(example: PlaygroundInput): Visual {
  const GRID = example.grid ?? ["ST"];
  const COLS = GRID[0].length;
  const code = [
    "def shortest_path(grid, start, goal):",
    "    queue = deque([(start, 0)])",
    "    seen = {start}",
    "    while queue:",
    "        (r, c), dist = queue.popleft()",
    "        if (r, c) == goal:",
    "            return dist",
    "        for dr, dc in DIRS:",
    "            nxt = (r + dr, c + dc)",
    "            if open(nxt) and nxt not in seen:",
    "                seen.add(nxt)",
    "                queue.append((nxt, dist + 1))",
    "    return -1",
  ];
  const dist: (number | null)[][] = GRID.map((l) =>
    l.split("").map(() => null),
  );
  dist[0][0] = 0;
  const goalAt = (() => {
    for (let r = 0; r < GRID.length; r++)
      for (let c = 0; c < COLS; c++)
        if (GRID[r][c] === "T") return [r, c] as [number, number];
    return [GRID.length - 1, COLS - 1] as [number, number];
  })();
  const frames: Frame[] = [];
  const view = (
    current: [number, number] | null,
    path?: Set<string>,
  ): Frame["grid"] =>
    gridCells(GRID, (r, c) => {
      const ch = GRID[r][c];
      if (ch === "#") return { v: "", state: "dim" };
      const d = dist[r][c];
      const key = `${r},${c}`;
      if (path?.has(key)) return { v: "*", state: "done" };
      if (current && current[0] === r && current[1] === c)
        return { v: String(d ?? ""), state: "active" };
      if (d === null)
        return { v: ch === "S" ? "S" : ch === "T" ? "T" : "", state: "idle" };
      return { v: String(d), state: "hint" };
    });

  frames.push({
    line: 1,
    grid: view(null),
    msg: "Every empty cell gets a number: how many moves it takes to reach it from S. Start with S at 0.",
  });

  let queue: [number, number][] = [[0, 0]];
  let reached: [number, number] | null = null;
  let visited = 0;
  while (queue.length && !reached) {
    const next: [number, number][] = [];
    for (const [r, c] of queue) {
      visited++;
      const d = dist[r][c] ?? 0;
      const isGoal = r === goalAt[0] && c === goalAt[1];
      const fresh: [number, number][] = [];
      if (!isGoal) {
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= GRID.length || nc >= COLS) continue;
          if (GRID[nr][nc] === "#" || dist[nr][nc] !== null) continue;
          dist[nr][nc] = d + 1;
          fresh.push([nr, nc]);
          next.push([nr, nc]);
        }
      }
      frames.push({
        line: 4,
        grid: view([r, c]),
        msg: isGoal
          ? `Pop T at distance ${d}. First arrival wins — nothing later can be shorter.`
          : `Pop (${r}, ${c}) — ${d} move${d === 1 ? "" : "s"} from S. ` +
            (fresh.length
              ? `${fresh.length} new cell${fresh.length === 1 ? "" : "s"} marked ${d + 1} and pushed to the back.`
              : "Nothing new here; its neighbours are already numbered."),
      });
      if (isGoal) {
        reached = [r, c];
        break;
      }
    }
    if (reached) break;
    queue = next;
  }

  const path = new Set<string>();
  if (reached) {
    let cur = reached;
    path.add(`${cur[0]},${cur[1]}`);
    while (!(cur[0] === 0 && cur[1] === 0)) {
      const d = dist[cur[0]][cur[1]] ?? 0;
      const step = (
        [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const
      )
        .map(([dr, dc]) => [cur[0] + dr, cur[1] + dc] as [number, number])
        .find(
          ([r, c]) =>
            r >= 0 &&
            c >= 0 &&
            r < GRID.length &&
            c < COLS &&
            dist[r][c] === d - 1,
        );
      if (!step) break;
      cur = step;
      path.add(`${cur[0]},${cur[1]}`);
    }
    frames.push({
      line: 6,
      grid: view(null, path),
      msg: `Walk back from T: each step lands on a number one smaller, so the route is ${dist[reached[0]][reached[1]]} moves long.`,
    });
  }
  frames.push({
    line: reached ? 6 : 12,
    grid: view(null, path),
    msg: reached
      ? `Popped ${visited} cells to find it. Each cell was numbered once, and the queue always held the nearest cells first — that is why the first arrival is the shortest.`
      : "The queue is empty and T was not reached. No route exists; return -1.",
  });
  return {
    output: reached ? dist[reached[0]][reached[1]] : -1,
    code,
    frames,
    about: "Label each cell with its distance from S, then walk back from T.",
  };
}

/* --------------------------------------------------------------------- DFS */

function dfs(example: PlaygroundInput): Visual {
  const GRID = example.grid ?? ["."];
  const COLS = GRID[0].length;
  const code = [
    "def count_regions(grid):",
    "    seen = set()",
    "    regions = 0",
    "    for r in range(ROWS):",
    "        for c in range(COLS):",
    "            if open(r, c) and (r, c) not in seen:",
    "                regions += 1",
    "                flood(r, c)",
    "    return regions",
    "",
    "def flood(r, c):",
    "    seen.add((r, c))",
    "    for dr, dc in DIRS:",
    "        if open(r + dr, c + dc) and (r + dr, c + dc) not in seen:",
    "            flood(r + dr, c + dc)",
  ];
  const seen = new Set<string>();
  const labels = new Map<string, number>();
  const frames: Frame[] = [];
  const view = (current: [number, number] | null, region = 0): Frame["grid"] =>
    gridCells(GRID, (r, c) => {
      const ch = GRID[r][c];
      if (ch === "#") return { v: "", state: "dim" };
      const key = `${r},${c}`;
      if (current && current[0] === r && current[1] === c)
        return { v: "•", state: "active" };
      if (seen.has(key))
        return { v: String(labels.get(key) ?? region), state: "done" };
      return { v: ch === "S" ? "S" : ch === "T" ? "T" : "", state: "idle" };
    });

  frames.push({
    line: 1,
    grid: view(null),
    msg: "Pick the first open cell, then keep moving to an unvisited neighbour until you cannot — that is one whole region.",
  });

  let regions = 0;
  for (let r = 0; r < GRID.length; r++) {
    for (let c = 0; c < COLS; c++) {
      if (GRID[r][c] === "#" || seen.has(`${r},${c}`)) continue;
      regions++;
      const stack: [number, number][] = [[r, c]];
      let filled = 0;
      let last: [number, number] | null = null;
      while (stack.length) {
        const [cr, cc] = stack.pop()!;
        if (seen.has(`${cr},${cc}`)) continue;
        seen.add(`${cr},${cc}`);
        labels.set(`${cr},${cc}`, regions);
        filled++;
        const fresh: [number, number][] = [];
        for (const [dr, dc] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ] as const) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nc < 0 || nr >= GRID.length || nc >= COLS) continue;
          if (GRID[nr][nc] !== "#" && !seen.has(`${nr},${nc}`))
            fresh.push([nr, nc]);
        }
        stack.push(...fresh);
        frames.push({
          line: fresh.length ? 12 : 11,
          grid: view([cr, cc], regions),
          msg: fresh.length
            ? `(${cr}, ${cc}) still has somewhere to go, so dive into (${fresh[fresh.length - 1][0]}, ${fresh[fresh.length - 1][1]}) instead of backing up. Region ${regions}: ${filled} cell${filled === 1 ? "" : "s"}.`
            : `(${cr}, ${cc}) has no unvisited neighbour left — back up and try the cell you came from. Region ${regions} stands at ${filled} cells.`,
        });
        last = [cr, cc];
      }
      frames.push({
        line: 6,
        grid: view(last, regions),
        msg: `Region ${regions} is closed at ${filled} cells. Look for the next open cell in reading order.`,
      });
    }
  }
  frames.push({
    line: 8,
    grid: view(null, regions),
    msg: `${regions} separate region${regions === 1 ? "" : "s"}, numbered in the order the flood found them. Deep first, back up only when forced.`,
  });
  return {
    output: regions,
    code,
    frames,
    about:
      "Flood the grid region by region — dive deep, back up only when stuck.",
  };
}

/* ------------------------------------------------------------------- trees */

function trees(example: PlaygroundInput): Visual {
  const tree = example.tree ?? [];
  const code = [
    "def inorder(root):",
    "    out = []",
    "    def walk(node):",
    "        if node is None: return",
    "        walk(node.left)",
    "        out.append(node.value)",
    "        walk(node.right)",
    "    walk(root)",
    "    return out",
  ];
  const visited = new Set<number>();
  const order: number[] = [];
  const depth = Math.max(1, Math.ceil(Math.log2(tree.length + 1)));
  const columns = Math.max(1, 2 ** depth - 1);
  const view = (active: number | null): Cell[][] => {
    const grid = Array.from({ length: depth }, () =>
      Array.from({ length: columns }, () => ({
        v: "",
        state: "dim" as CellState,
      })),
    );
    tree.forEach((value, index) => {
      if (value === null) return;
      const level = Math.floor(Math.log2(index + 1));
      const position = index - (2 ** level - 1);
      const col =
        Math.floor(((2 * position + 1) * (columns + 1)) / 2 ** (level + 1)) - 1;
      grid[level][Math.max(0, col)] = {
        v: String(value),
        state:
          active === index ? "active" : visited.has(index) ? "done" : "idle",
      };
    });
    return grid;
  };
  const frames: Frame[] = [
    {
      line: 7,
      grid: view(null),
      msg: tree.length
        ? "Read the left subtree, then the node, then the right subtree."
        : "The root is missing. Return an empty traversal.",
    },
  ];
  const walk = (index: number) => {
    if (index >= tree.length || tree[index] === null) return;
    frames.push({
      line: 4,
      grid: view(index),
      msg: `At node ${tree[index]}, explore the left child first.`,
    });
    walk(2 * index + 1);
    visited.add(index);
    order.push(tree[index]!);
    frames.push({
      line: 5,
      grid: view(index),
      msg: `Visit ${tree[index]}. Order so far: [${order.join(", ")}].`,
    });
    frames.push({
      line: 6,
      grid: view(index),
      msg: `Now explore the right child of ${tree[index]}.`,
    });
    walk(2 * index + 2);
  };
  walk(0);
  frames.push({
    line: 8,
    grid: view(null),
    msg: `In-order traversal: [${order.join(", ")}]. A search tree yields sorted values.`,
  });
  return {
    code,
    frames,
    output: order,
    about:
      "In-order traversal: left, node, right. Layout shows tree levels; empty slots are missing children.",
  };
}

function backtracking(example: PlaygroundInput): Visual {
  const nums = example.values ?? [];
  const code = [
    "def subsets(nums):",
    "    out, path = [], []",
    "    def walk(i):",
    "        if i == len(nums):",
    "            out.append(path[:])",
    "            return",
    "        path.append(nums[i])",
    "        walk(i + 1)",
    "        path.pop()",
    "        walk(i + 1)",
    "    walk(0)",
    "    return out",
  ];
  const frames: Frame[] = [];
  const results: string[] = [];
  const output: number[][] = [];
  const path: number[] = [];
  const show = (msg: string, line: number, active?: number) =>
    frames.push({
      line,
      rows: [
        row(
          "nums",
          nums,
          active !== undefined ? { [active]: "active" } : {},
          active !== undefined ? [{ at: active, text: "i" }] : [],
        ),
        row("chosen", path.length ? path : ["—"]),
        row("results", results.length ? results : ["—"]),
      ],
      msg,
    });

  show("Each number has two futures: take it, or skip it.", 1);
  const walk = (i: number) => {
    if (i === nums.length) {
      results.push(`{${path.join(",")}}`);
      output.push([...path]);
      show(
        `A complete decision — record {${path.join(",")}}. Then undo and try the other branch.`,
        4,
      );
      return;
    }
    path.push(nums[i]);
    show(`Take ${nums[i]}.`, 6, i);
    walk(i + 1);
    path.pop();
    show(`Undo — put ${nums[i]} back.`, 8, i);
    walk(i + 1);
  };
  walk(0);
  show(`All ${results.length} subsets. The recursion tree has 2^n leaves.`, 11);
  return {
    output: output,
    code,
    frames,
    about: `Every subset of [${nums.join(", ")}].`,
  };
}

/* ---------------------------------------------------------------- intervals */

function intervals(example: PlaygroundInput): Visual {
  const input = (example.intervals ?? [])
    .map(([a, b]) => [a, b] as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const code = [
    "def merge(intervals):",
    "    intervals = sorted(intervals)",
    "    out = []",
    "    for start, end in intervals:",
    "        if out and start <= out[-1][1]:",
    "            out[-1][1] = max(out[-1][1], end)",
    "        else:",
    "            out.append([start, end])",
    "    return out",
  ];
  const span = Math.max(1, ...input.map(([, end]) => end + 1));
  const bar = (a: number, b: number, state: CellState): Row => ({
    label: `${a}–${b}`,
    cells: Array.from({ length: span }, (_, i) => ({
      v: i >= a && i <= b ? "█" : "",
      state: i >= a && i <= b ? state : "dim",
    })),
  });
  const frames: Frame[] = [
    {
      line: 1,
      rows: input.map(([a, b]) => bar(a, b, "idle")),
      msg: input.length
        ? "Sort by start time. Touching closed intervals overlap in this example."
        : "The input is empty; initialize an empty result, not intervals[0].",
    },
  ];
  const merged: [number, number][] = [];
  for (const [start, end] of input) {
    const last = merged.at(-1);
    if (last && start <= last[1]) {
      const previousEnd = last[1];
      last[1] = Math.max(last[1], end);
      frames.push({
        line: 5,
        rows: merged.map(([a, b]) => bar(a, b, "active")),
        msg: `${start} is at or before ${previousEnd}. Merge and keep the farther end, ${last[1]}.`,
      });
    } else {
      merged.push([start, end]);
      frames.push({
        line: 7,
        rows: merged.map(([a, b], i) =>
          bar(a, b, i === merged.length - 1 ? "active" : "done"),
        ),
        msg: `Start a separate range [${start}, ${end}].`,
      });
    }
  }
  frames.push({
    line: 8,
    rows: merged.map(([a, b]) => bar(a, b, "done")),
    msg: `${input.length} input intervals become ${merged.length} merged ranges.`,
  });
  return {
    code,
    frames,
    output: merged,
    about:
      "Merge overlapping closed intervals; touching endpoints count as overlap.",
  };
}

function dp(example: PlaygroundInput): Visual {
  const coins = example.coins ?? [];
  const amount = example.amount ?? 0;
  const INF = Infinity;
  const dp: number[] = Array.from({ length: amount + 1 }, () => INF);
  dp[0] = 0;
  const code = [
    "def coin_change(coins, amount):",
    "    dp = [0] + [inf] * amount",
    "    for c in coins:",
    "        for a in range(c, amount + 1):",
    "            dp[a] = min(dp[a], dp[a - c] + 1)",
    "    return -1 if dp[amount] == inf else dp[amount]",
  ];
  const frames: Frame[] = [];
  const show = (v: number) => (v === INF ? "∞" : String(v));
  const view = (marks: Record<number, CellState>, coin?: number): Row[] => [
    row("dp", dp.map(show), marks),
    ...(coin === undefined
      ? []
      : [row(`coin ${coin}`, [`${coin}`], { 0: "active" })]),
  ];

  frames.push({
    line: 1,
    rows: view({ 0: "done" }),
    msg: "dp[a] = fewest coins that make exactly a. Amount 0 needs none, so dp[0] = 0.",
  });
  frames.push({
    line: 2,
    rows: view({}),
    msg: "Take the coins one at a time. Each new coin may improve amounts it can pay for.",
  });

  for (const c of coins) {
    for (let a = c; a <= amount; a++) {
      const prev = dp[a - c];
      const cand = prev === INF ? INF : prev + 1;
      const before = dp[a];
      if (cand < before) dp[a] = cand;
      frames.push({
        line: 4,
        rows: view({ [a]: "active", [a - c]: "hint" }, c),
        msg:
          `Amount ${a}: a coin of ${c} leaves ${a - c}, which takes ${prev === INF ? "∞ (impossible)" : prev}. ` +
          (cand === INF
            ? "Still impossible."
            : cand < before
              ? `So ${a} can be done in ${cand} — better than ${show(before)}. Write it.`
              : `${cand} is not better than ${show(before)}. Leave it.`),
      });
    }
  }
  frames.push({
    line: 5,
    rows: view({ [amount]: "done" }, coins.at(-1)),
    msg:
      dp[amount] === INF
        ? `No combination makes ${amount}; return -1.`
        : `Fewest coins for ${amount} is ${dp[amount]}. Every value came from a smaller amount already computed.`,
  });
  return {
    output: dp[amount] === INF ? -1 : dp[amount],
    code,
    frames,
    about: `Fewest coins to make ${amount} from ${coins.join(", ")}.`,
  };
}

/* ------------------------------------------------------------------- greedy */

function greedy(example: PlaygroundInput): Visual {
  const meetings = example.intervals ?? [];
  const sorted = [...meetings].sort((a, b) => a[1] - b[1]);
  const code = [
    "def max_meetings(meetings):",
    "    meetings.sort(key=lambda m: m[1])",
    "    chosen, free_from = [], float('-inf')",
    "    for start, end in meetings:",
    "        if start >= free_from:",
    "            chosen.append((start, end))",
    "            free_from = end",
    "    return chosen",
  ];
  const SPAN = 12;
  const bar = (a: number, b: number, state: CellState): Row => ({
    label: `${a}–${b}`,
    cells: Array.from({ length: SPAN }, (_, i) => ({
      v: i >= a && i < b ? "█" : "",
      state: i >= a && i < b ? state : "dim",
    })),
  });
  const frames: Frame[] = [
    {
      line: 1,
      rows: sorted.map(([a, b]) => bar(a, b, "idle")),
      msg: "Finish earliest first — that leaves the most room for whatever comes next.",
    },
  ];
  const chosen: [number, number][] = [];
  let free = -Infinity;
  for (const [s, e] of sorted) {
    if (s >= free) {
      const previousFree = free;
      chosen.push([s, e]);
      free = e;
      frames.push({
        line: 5,
        rows: [
          bar(s, e, "done"),
          ...chosen.map(([a, b]) => bar(a, b, "done")),
        ].slice(0, 4),
        msg: `${s}–${e} fits — the room was free ${previousFree === -Infinity ? "before the first meeting" : `from ${previousFree}`}. Take it, and the room is now free from ${free}.`,
      });
    } else {
      frames.push({
        line: 4,
        rows: [bar(s, e, "warning")],
        msg: `${s}–${e} clashes with a meeting already booked. Skip it.`,
      });
    }
  }
  frames.push({
    line: 7,
    rows: chosen.map(([a, b]) => bar(a, b, "done")),
    msg: `${chosen.length} meetings, no clashes. Finishing earliest is what makes this safe.`,
  });
  return {
    output: chosen,
    code,
    frames,
    about: "Book as many non-overlapping meetings as possible.",
  };
}

/* --------------------------------------------------------------------- heap */

function heap(example: PlaygroundInput): Visual {
  const values = example.values ?? [];
  const heap: number[] = [];
  const code = [
    "def build_heap(values):",
    "    heap = []",
    "    for x in values:",
    "        heap.append(x)",
    "        i = len(heap) - 1",
    "        while i > 0 and heap[i] < heap[(i - 1) // 2]:",
    "            p = (i - 1) // 2",
    "            heap[i], heap[p] = heap[p], heap[i]",
    "            i = p",
    "    return heap",
  ];
  const frames: Frame[] = [];
  const show = (
    msg: string,
    line: number,
    marks: Record<number, CellState> = {},
  ) =>
    frames.push({
      line,
      rows: [row("heap array", heap.length ? heap : ["—"], marks)],
      msg,
    });
  show(
    "A min-heap keeps every parent no larger than its children. It is not a fully sorted array.",
    1,
  );
  for (const x of values) {
    heap.push(x);
    let i = heap.length - 1;
    show(`Append ${x} at index ${i}.`, 3, { [i]: "active" });
    while (i > 0 && heap[i] < heap[Math.floor((i - 1) / 2)]) {
      const p = Math.floor((i - 1) / 2);
      const parent = heap[p];
      [heap[i], heap[p]] = [heap[p], heap[i]];
      show(
        `${x} is smaller than parent ${parent}; swap positions ${i} and ${p}.`,
        7,
        { [i]: "hint", [p]: "active" },
      );
      i = p;
    }
    show(`${x} stays at index ${i}; the parent rule is satisfied.`, 5, {
      [i]: "done",
    });
  }
  show(
    values.length
      ? `The root, ${heap[0]}, is the minimum. The rest of the array follows heap order, not sorted order.`
      : "No inserted values means an empty heap.",
    9,
    { 0: "done" },
  );
  return {
    code,
    frames,
    output: [...heap],
    about: `Build a min-heap by inserting [${values.join(", ")}].`,
  };
}

function unionFind(example: PlaygroundInput): Visual {
  const n = example.n ?? 0;
  const parent = Array.from({ length: n }, (_, i) => i);
  const edges = example.edges ?? [];
  const code = [
    "def find(x):",
    "    while parent[x] != x:",
    "        parent[x] = parent[parent[x]]",
    "        x = parent[x]",
    "    return x",
    "",
    "def union(a, b):",
    "    ra, rb = find(a), find(b)",
    "    if ra != rb:",
    "        parent[ra] = rb",
    "        return True",
    "    return False",
  ];
  const groups = () => {
    const map = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
      const r = find(i);
      map.set(r, [...(map.get(r) ?? []), i]);
    }
    return map;
  };
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  const frames: Frame[] = [];
  const show = (
    msg: string,
    line: number,
    marks: Record<number, CellState> = {},
  ) => {
    const g = groups();
    frames.push({
      line,
      rows: [
        row(
          "node",
          Array.from({ length: n }, (_, i) => i),
        ),
        row("parent", parent, marks),
        row(
          "groups",
          [...g.values()].map((vs) => `{${vs.join(",")}}`),
        ),
      ],
      msg,
    });
  };
  show("Every node starts as its own group.", 0);
  for (const [a, b] of edges) {
    show(`Consider edge ${a}–${b}. Find the root of each end.`, 7, {
      [a]: "active",
      [b]: "active",
    });
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[ra] = rb;
      show(
        `${ra} and ${rb} were separate, so point one at the other. Now they are one group.`,
        9,
        { [ra]: "done" },
      );
    } else {
      show(
        `Both ends already share root ${ra} — adding this edge would make a cycle.`,
        11,
        { [a]: "warning", [b]: "warning" },
      );
    }
  }
  show(`${groups().size} groups once all edges are processed.`, 0);
  return {
    output: groups().size,
    code,
    frames,
    about: "Track which nodes belong together as edges arrive.",
  };
}

/* ---------------------------------------------------------------- dijkstra */

function dijkstra(example: PlaygroundInput): Visual {
  /** a small weighted graph laid out on a 3 × 4 slot grid */
  const nodes = ["A", "B", "C", "D", "E", "F"];
  const slot: Record<string, [number, number]> = {
    A: [0, 0],
    B: [0, 3],
    C: [1, 0],
    D: [1, 3],
    E: [2, 1],
    F: [2, 3],
  };
  const edges = example.weightedEdges ?? [];
  const code = [
    "def dijkstra(graph, start):",
    "    dist = {n: inf for n in graph}",
    "    dist[start] = 0",
    "    pq = [(0, start)]",
    "    while pq:",
    "        d, u = heappop(pq)",
    "        if d > dist[u]: continue",
    "        for v, w in graph[u]:",
    "            if d + w < dist[v]:",
    "                dist[v] = d + w",
    "                heappush(pq, (dist[v], v))",
    "    return dist",
  ];
  const dist: Record<string, number> = Object.fromEntries(
    nodes.map((n) => [n, Infinity]),
  );
  dist.A = 0;
  const done = new Set<string>();
  const frames: Frame[] = [];
  const view = (current: string | null): Frame["grid"] => {
    const g = Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => ({ v: "", state: "dim" as CellState })),
    );
    for (const [name, [r, c]] of Object.entries(slot)) {
      const d = dist[name];
      g[r][c] = {
        v: d === Infinity ? name : `${name}${d}`,
        state:
          name === current
            ? "active"
            : done.has(name)
              ? "done"
              : d === Infinity
                ? "idle"
                : "hint",
      };
    }
    return g;
  };
  frames.push({
    line: 2,
    grid: view(null),
    msg: "Start at A with distance 0. Every other node is unknown — for now.",
  });
  for (let guard = 0; guard < 12; guard++) {
    const u = nodes
      .filter((n) => !done.has(n))
      .sort((a, b) => dist[a] - dist[b])[0];
    if (!u || dist[u] === Infinity) break;
    done.add(u);
    frames.push({
      line: 5,
      grid: view(u),
      msg: `Settle ${u} at distance ${dist[u]} — nothing can reach it more cheaply than that.`,
    });
    for (const [a, b, w] of edges) {
      const other = a === u ? b : b === u ? a : null;
      if (!other || done.has(other)) continue;
      const cand = dist[u] + w;
      if (cand < dist[other]) {
        const was = dist[other];
        dist[other] = cand;
        frames.push({
          line: 9,
          grid: view(u),
          msg: `Via ${u} the cost to ${other} is ${cand}, better than ${was === Infinity ? "no route at all" : was}. Relax it.`,
        });
      }
    }
  }
  frames.push({
    line: 11,
    grid: view(null),
    msg: `Cheapest distances from A: ${nodes.map((n) => `${n}=${dist[n] === Infinity ? "unreachable" : dist[n]}`).join(", ")}.`,
  });
  return {
    output: Object.fromEntries(
      nodes.map((n) => [n, dist[n] === Infinity ? "∞" : dist[n]]),
    ),
    code,
    frames,
    about: "Cheapest route from A to every other node.",
  };
}

/* -------------------------------------------------------------------------- */

const GENERATORS: Record<string, (input: PlaygroundInput) => Visual> = {
  brute,
  hashmap,
  "two-pointers": twoPointers,
  "sliding-window": slidingWindow,
  "binary-search": binarySearch,
  "prefix-sum": prefixSum,
  sorting,
  "linked-list": linkedList,
  stack,
  bfs,
  dfs,
  trees,
  backtracking,
  intervals,
  dp,
  greedy,
  heap,
  "union-find": unionFind,
  dijkstra,
};

export function getPlaygroundVisual(id: string, exampleIndex = 0): Visual {
  const example = PLAYGROUND_EXAMPLES[id]?.[exampleIndex];
  const generate = GENERATORS[id];
  if (!example || !generate)
    throw new Error(`Unknown playground example: ${id}/${exampleIndex}`);
  const visual = generate(example.input);
  const last = visual.frames.at(-1)!;
  visual.frames.push({
    ...last,
    msg: `Result: ${JSON.stringify(visual.output)}. ${last.msg}`,
  });
  return visual;
}
export const VISUALS: Record<string, Visual> = Object.fromEntries(
  Object.keys(GENERATORS).map((id) => [id, getPlaygroundVisual(id)]),
);
export const VISUAL_IDS = Object.keys(VISUALS);
export { COLS as VISUAL_GRID_COLS };
