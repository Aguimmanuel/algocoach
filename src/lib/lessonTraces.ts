export interface TraceFrame {
  title: string;
  explanation: string;
  state: Record<string, string>;
  nodes?: { id: string; label: string; x: number; y: number }[];
  edges?: { from: string; to: string; label?: string }[];
  active?: string[];
  output?: string;
}
export interface TraceCase {
  label: string;
  values?: number[];
  text?: string;
  target?: number;
  n?: number;
  intervals?: number[][];
  pixel?: number[];
  unreachable?: boolean;
  negative?: boolean;
}
export const CASES: Record<string, TraceCase[]> = {
  "what-is-algorithm": [
    { label: "Lesson example", values: [4, 1, 7] },
    { label: "Negative values", values: [-5, -2, -8] },
    { label: "Empty list", values: [] },
  ],
  "big-o-intuition": [
    { label: "Four items", n: 4 },
    { label: "Eight items", n: 8 },
    { label: "Zero items", n: 0 },
  ],
  "brute-first": [
    { label: "Lesson example", values: [2, 4, 6], target: 8 },
    { label: "No pair", values: [1, 3], target: 9 },
    { label: "One item", values: [8], target: 16 },
  ],
  "reading-problems": [
    { label: "Lesson example", values: [2, 7, 11], target: 9 },
    { label: "Repeated values", values: [3, 3], target: 6 },
    { label: "No answer", values: [1, 2], target: 8 },
  ],
  "hashmap-lesson": [
    { label: "Lesson example", values: [2, 7, 11], target: 9 },
    { label: "Repeated values", values: [3, 3], target: 6 },
    { label: "No answer", values: [1, 2], target: 8 },
  ],
  "two-pointers-lesson": [
    { label: "Lesson example", values: [1, 2, 7, 11], target: 9 },
    { label: "No pair", values: [1, 2, 3], target: 10 },
    { label: "Empty list", values: [], target: 9 },
  ],
  "sorting-lesson": [
    { label: "Lesson example", values: [4, 1, 3, 1] },
    { label: "No duplicates", values: [8, 2, 5] },
    { label: "One item", values: [4] },
  ],
  "sliding-window-lesson": [
    { label: "Lesson example", text: "abca" },
    { label: "All repeated", text: "aaaa" },
    { label: "Empty text", text: "" },
  ],
  "binary-search-lesson": [
    {
      label: "Find 23",
      values: [2, 5, 8, 12, 16, 23, 38, 45, 56, 67],
      target: 23,
    },
    {
      label: "9 is absent",
      values: [2, 5, 8, 12, 16, 23, 38, 45, 56, 67],
      target: 9,
    },
    { label: "Empty list", values: [], target: 23 },
  ],
  "prefix-sum-lesson": [
    { label: "Lesson example", values: [3, 1, 4, 1, 5], target: 4, n: 1 },
    { label: "Includes negatives", values: [3, -1, 4], target: 2, n: 0 },
    { label: "One position", values: [3, 1, 4, 1, 5], target: 2, n: 2 },
  ],
  "stack-lesson": [
    { label: "Balanced", text: "(())" },
    { label: "Mismatched", text: "(]" },
    { label: "Unclosed", text: "(()" },
  ],
  "linked-list-lesson": [
    { label: "Lesson example", values: [1, 2, 3, 4] },
    { label: "One node", values: [9] },
    { label: "Empty list", values: [] },
  ],
  "intervals-lesson": [
    {
      label: "Lesson example",
      intervals: [
        [1, 3],
        [2, 5],
        [7, 8],
      ],
    },
    {
      label: "Touching endpoints",
      intervals: [
        [1, 3],
        [3, 5],
      ],
    },
    { label: "Empty calendar", intervals: [] },
  ],
  "heap-lesson": [
    { label: "Lesson example", values: [4, 1, 7, 3, 9, 2], n: 3 },
    { label: "Not enough items", values: [4, 1], n: 3 },
    { label: "Duplicates", values: [5, 5, 2, 1], n: 2 },
  ],
  "dfs-lesson": [
    { label: "Connected graph" },
    { label: "Isolated start", unreachable: true },
  ],
  "bfs-lesson": [
    { label: "Connected graph" },
    { label: "Isolated start", unreachable: true },
  ],
  "trees-lesson": [
    { label: "Three levels" },
    { label: "Empty tree", unreachable: true },
  ],
  "union-find-lesson": [
    { label: "Join A–B, then B–C" },
    { label: "Only join A–B", unreachable: true },
  ],
  "dijkstra-lesson": [
    { label: "Lesson example" },
    { label: "Unreachable target", unreachable: true },
    { label: "Reject negative weight", negative: true },
  ],
  "backtracking-lesson": [
    { label: "Two items", values: [1, 2] },
    { label: "One item", values: [1] },
    { label: "Empty set", values: [] },
  ],
  "greedy-lesson": [
    {
      label: "Lesson example",
      intervals: [
        [1, 3],
        [2, 5],
        [4, 6],
      ],
    },
    {
      label: "Long versus short",
      intervals: [
        [1, 10],
        [1, 3],
        [3, 5],
        [5, 7],
      ],
    },
    { label: "Empty schedule", intervals: [] },
  ],
  "dp-lesson": [
    { label: "Four stairs", n: 4 },
    { label: "One stair", n: 1 },
    { label: "Zero stairs", n: 0 },
  ],
  "filtering-images": [
    { label: "Lesson pixel", pixel: [30, 60, 90] },
    { label: "Rounding", pixel: [0, 0, 2] },
    { label: "White", pixel: [255, 255, 255] },
  ],
  "inverting-colors": [
    { label: "Lesson pixel", pixel: [20, 200, 255] },
    { label: "Black", pixel: [0, 0, 0] },
    { label: "White", pixel: [255, 255, 255] },
  ],
  "composing-functions": [
    { label: "Lesson pixel", pixel: [60, 60, 60] },
    { label: "Dark pixel", pixel: [0, 0, 0] },
    { label: "White pixel", pixel: [255, 255, 255] },
  ],
  "debugging-images": [
    { label: "Lesson pixel", pixel: [30, 60, 90] },
    { label: "Black hides the bug", pixel: [0, 0, 0] },
    { label: "White exposes it", pixel: [255, 255, 255] },
  ],
};
const show = (v: unknown) => JSON.stringify(v);
export function lessonTrace(
  id: string,
  c: TraceCase = CASES[id][0],
): TraceFrame[] {
  const f: TraceFrame[] = [];
  const add = (
    title: string,
    explanation: string,
    state: Record<string, string>,
    extra: Partial<TraceFrame> = {},
  ) => f.push({ title, explanation, state, ...extra });
  const a = c.values ?? [];
  const finish = (output: string) => {
    const previous = f.at(-1);
    add(
      "Result",
      `This is the output for ${c.label.toLowerCase()}. Compare it with the question before trying another case.`,
      { ...previous?.state, output },
      {
        nodes: previous?.nodes,
        edges: previous?.edges,
        active: previous?.active,
        output,
      },
    );
  };
  const arrayNodes = (values: number[]) =>
    values.map((v, i) => ({
      id: String(i),
      label: `${i}: ${v}`,
      x: 45 + i * 60,
      y: 55,
    }));
  if (id === "what-is-algorithm") {
    let best: number | null = null;
    add(
      "Start",
      "There is no largest value yet. An empty list will return None (no value).",
      { input: show(a), largest: "None" },
    );
    a.forEach((v, i) => {
      const before = best;
      best = best === null || v > best ? v : best;
      add(
        `Read position ${i}`,
        `${v} ${before === null ? "is our first value" : v > before ? `is greater than ${before}` : `does not beat ${before}`}. Largest so far is ${best}.`,
        { value: String(v), largest: String(best), position: String(i) },
        { nodes: arrayNodes(a), active: [String(i)] },
      );
    });
    finish(best === null ? "None" : String(best));
  } else if (id === "big-o-intuition") {
    const n = c.n ?? 4;
    add(
      "One visit per item",
      `Visiting ${n} items once takes ${n} visits. Here n means the number of items.`,
      { n: String(n), singleVisits: String(n) },
    );
    add(
      "All ordered pairs",
      `For each of ${n} items, visit all ${n} items. That makes ${n} × ${n} = ${n * n} checks. This particular counting example includes self-pairs.`,
      { n: String(n), pairChecks: String(n * n) },
    );
    finish(`(${n}, ${n * n})`);
  } else if (["brute-first", "reading-problems"].includes(id)) {
    add(
      "Read the task",
      `Return two different positions whose values add to ${c.target}.`,
      { input: show(a), target: String(c.target), output: "not found yet" },
    );
    let done = false;
    for (let i = 0; i < a.length && !done; i++)
      for (let j = i + 1; j < a.length && !done; j++) {
        const s = a[i] + a[j];
        add(
          `Try positions ${i} and ${j}`,
          `${a[i]} + ${a[j]} = ${s}. ${s === c.target ? "This matches: return positions, not values." : "It does not match; try the next unused pair."}`,
          { positions: show([i, j]), sum: String(s) },
        );
        if (s === c.target) {
          finish(show([i, j]));
          done = true;
        }
      }
    if (!done) finish("None");
  } else if (id === "hashmap-lesson") {
    const seen: Record<string, number> = {};
    add(
      "Empty lookup box",
      "Keys will be values we have read. Each stored value will be its earlier position.",
      { seen: show(seen), target: String(c.target) },
    );
    let done = false;
    for (let i = 0; i < a.length; i++) {
      const need = (c.target ?? 0) - a[i];
      add(
        `Look for ${need}`,
        `At position ${i}, read ${a[i]}. We need ${c.target} − ${a[i]} = ${need}. Look in the box BEFORE storing this item.`,
        { current: String(a[i]), need: String(need), seen: show(seen) },
      );
      if (need in seen) {
        finish(show([seen[need], i]));
        done = true;
        break;
      }
      seen[a[i]] = i;
      add(
        `Store ${a[i]} → ${i}`,
        `The partner was absent. Remember this value's position for a later lookup.`,
        { seen: show(seen) },
      );
    }
    if (!done) finish("None");
  } else if (id === "two-pointers-lesson" || id === "binary-search-lesson") {
    let l = 0,
      r = a.length - 1;
    add(
      "Start with the whole sorted list",
      "Positions begin at zero. Only positions between left and right remain candidates.",
      {
        input: show(a),
        left: String(l),
        right: String(r),
        target: String(c.target),
      },
    );
    let done = false;
    while (l <= r && (id === "binary-search-lesson" || l < r)) {
      if (id === "two-pointers-lesson") {
        const sum = a[l] + a[r];
        add(
          `Check ${l} and ${r}`,
          `${a[l]} + ${a[r]} = ${sum}. ${sum === c.target ? "The sum matches the target; return these two different positions." : sum < (c.target ?? 0) ? "Even the largest partner is too small for this left value. Discard the left position." : "Even the smallest partner makes this right value too large. Discard the right position."}`,
          { left: String(l), right: String(r), sum: String(sum) },
          { nodes: arrayNodes(a), active: [String(l), String(r)] },
        );
        if (sum === c.target) {
          finish(show([l, r]));
          done = true;
          break;
        }
        if (sum < (c.target ?? 0)) l++;
        else r--;
      } else {
        const mid = Math.floor((l + r) / 2);
        add(
          `Check middle position ${mid}`,
          `${a[mid]} ${a[mid] === c.target ? "matches" : a[mid] < (c.target ?? 0) ? "is too small; all positions to its left are smaller too" : "is too large; all positions to its right are larger too"}. ${a[mid] === c.target ? "Return this position." : "Keep only the remaining half."}`,
          {
            left: String(l),
            right: String(r),
            middle: String(mid),
            value: String(a[mid]),
          },
          { nodes: arrayNodes(a), active: [String(mid)] },
        );
        if (a[mid] === c.target) {
          finish(String(mid));
          done = true;
          break;
        }
        if (a[mid] < (c.target ?? 0)) l = mid + 1;
        else r = mid - 1;
      }
    }
    if (!done) finish("None");
  } else if (id === "sorting-lesson") {
    const sorted = [...a].sort((x, y) => x - y);
    add(
      "Order the values",
      "We use a built-in sort, not bubble sort. Close values become neighbors in this ordered list.",
      { input: show(a), sorted: show(sorted) },
    );
    let best: number | null = null;
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i] - sorted[i - 1];
      best = best === null ? gap : Math.min(best, gap);
      add(
        `Compare neighbors ${i - 1} and ${i}`,
        `${sorted[i]} − ${sorted[i - 1]} = ${gap}. Any non-neighbor pair spans at least one of these gaps.`,
        {
          pair: show([sorted[i - 1], sorted[i]]),
          gap: String(gap),
          smallestGap: String(best),
        },
      );
    }
    finish(best === null ? "None" : String(best));
  } else if (id === "sliding-window-lesson") {
    const text = c.text ?? "";
    let l = 0,
      best = 0;
    const set = new Set<string>();
    add("Empty window", "Our window must contain no repeated letter.", {
      input: text,
      window: "",
      best: "0",
    });
    for (let r = 0; r < text.length; r++) {
      while (set.has(text[r])) {
        const removed = text[l];
        set.delete(removed);
        l++;
        add(
          `Remove ${removed} from the left`,
          `The new letter ${text[r]} was already inside. Removing one leftmost letter may not be enough; keep repairing until it is absent.`,
          { left: String(l), right: String(r), letters: show([...set]) },
        );
      }
      set.add(text[r]);
      best = Math.max(best, r - l + 1);
      add(
        `Add ${text[r]} on the right`,
        "The repaired window has unique letters. Compare its length with the best found earlier.",
        {
          left: String(l),
          right: String(r),
          window: text.slice(l, r + 1),
          best: String(best),
        },
      );
    }
    finish(String(best));
  } else if (id === "prefix-sum-lesson") {
    const p = [0];
    add("Start with zero", "P[0] is the sum before reading any items.", {
      input: show(a),
      prefix: show(p),
    });
    a.forEach((v, i) => {
      p.push(p[i] + v);
      add(
        `Build P[${i + 1}]`,
        `${p[i]} + ${v} = ${p[i + 1]}. P[${i + 1}] includes the first ${i + 1} values.`,
        { prefix: show(p) },
      );
    });
    const l = c.n ?? 1,
      r = c.target ?? 4;
    add(
      "Subtract the part before the range",
      `The inclusive range ${l} through ${r} equals P[${r + 1}] − P[${l}] = ${p[r + 1]} − ${p[l]}.`,
      { left: String(l), right: String(r) },
    );
    finish(String(p[r + 1] - p[l]));
  } else if (id === "stack-lesson") {
    const stack: string[] = [];
    const match: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    let valid = true;
    add("Empty stack", "A stack removes the most recently added item first.", {
      input: c.text ?? "",
      stack: "[]",
    });
    for (const ch of c.text ?? "") {
      if ("([{".includes(ch)) {
        stack.push(ch);
        add(
          `Push ${ch}`,
          "This opening bracket must be matched before any older opening.",
          { stack: show(stack) },
        );
      } else {
        const top = stack.pop();
        valid = top === match[ch];
        add(
          `Match ${ch}`,
          `Remove the latest opener ${top ?? "(none)"}. ${valid ? "It matches." : "It does not match; stop with False."}`,
          { stack: show(stack) },
        );
        if (!valid) break;
      }
    }
    finish(valid && stack.length === 0 ? "True" : "False");
  } else if (id === "linked-list-lesson") {
    let prev: number | null = null;
    add(
      "Before reversing",
      "prev is empty. curr points to the first node. A link is a next-node connection.",
      { prev: "None", curr: a.length ? "0" : "None" },
      {
        nodes: arrayNodes(a).map((n) => ({ ...n, label: String(a[+n.id]) })),
        edges: a
          .slice(1)
          .map((_, i) => ({ from: String(i), to: String(i + 1) })),
      },
    );
    for (let i = 0; i < a.length; i++) {
      const nodes = arrayNodes(a).map((n) => ({
          ...n,
          label: String(a[+n.id]),
        })),
        edges = a
          .slice(1)
          .map((_, j) =>
            j < i
              ? { from: String(j + 1), to: String(j) }
              : j === i
                ? null
                : { from: String(j), to: String(j + 1) },
          )
          .filter((x): x is { from: string; to: string } => x !== null);
      add(
        `Save, redirect, advance at ${a[i]}`,
        `Save node ${i + 1 < a.length ? a[i + 1] : "None"} before changing the link. Point ${a[i]} to ${prev === null ? "None" : a[prev]}. Then advance prev and curr.`,
        {
          prev: String(a[i]),
          curr: i + 1 < a.length ? String(a[i + 1]) : "None",
          savedNext: i + 1 < a.length ? String(a[i + 1]) : "None",
        },
        { nodes, edges, active: [String(i)] },
      );
      prev = i;
    }
    finish(show([...a].reverse()));
  } else if (id === "intervals-lesson" || id === "greedy-lesson") {
    const iv = [...(c.intervals ?? [])]
      .map((x) => [...x])
      .sort((x, y) => (id === "intervals-lesson" ? x[0] - y[0] : x[1] - y[1]));
    const out: number[][] = [];
    add(
      "Sort the meetings",
      id === "intervals-lesson"
        ? "Order by START so overlaps are adjacent. Endpoints are closed: touching counts as overlap."
        : "Order by END so each accepted meeting leaves the most remaining time. A meeting may start when another ends.",
      { sorted: show(iv) },
    );
    for (const [s, e] of iv) {
      if (id === "intervals-lesson") {
        const prev = out.at(-1);
        if (prev && s <= prev[1]) {
          prev[1] = Math.max(prev[1], e);
          add(
            `Merge [${s}, ${e}]`,
            "The start is no later than the previous end; extend that end if needed.",
            { merged: show(out) },
          );
        } else {
          out.push([s, e]);
          add(
            `Keep [${s}, ${e}]`,
            "This meeting starts after the previous merged group finishes.",
            { merged: show(out) },
          );
        }
      } else {
        const accept = !out.length || s >= out.at(-1)![1];
        if (accept) out.push([s, e]);
        add(
          `${accept ? "Take" : "Skip"} [${s}, ${e}]`,
          accept
            ? "It starts after the last selected meeting ends."
            : "It overlaps a meeting we already chose; do not replace that earlier-finishing meeting.",
          { selected: show(out) },
        );
      }
    }
    finish(show(out));
  } else if (id === "heap-lesson") {
    const h: number[] = [];
    const push = (v: number) => {
      h.push(v);
      let i = h.length - 1;
      while (i && h[i] < h[Math.floor((i - 1) / 2)]) {
        const p = Math.floor((i - 1) / 2);
        [h[i], h[p]] = [h[p], h[i]];
        i = p;
      }
    };
    const pop = () => {
      const x = h[0],
        last = h.pop()!;
      if (h.length) {
        h[0] = last;
        let i = 0;
        while (true) {
          let j = i;
          for (const k of [2 * i + 1, 2 * i + 2])
            if (k < h.length && h[k] < h[j]) j = k;
          if (j === i) break;
          [h[i], h[j]] = [h[j], h[i]];
          i = j;
        }
      }
      return x;
    };
    const k = c.n ?? 3;
    add(
      "Empty min-heap",
      `Keep at most ${k} values. Its smallest value sits at the root, ready to evict.`,
      { heap: "[]", K: String(k) },
    );
    for (const v of a) {
      push(v);
      const removed = h.length > k ? pop() : null;
      add(
        `Insert ${v}`,
        `${removed === null ? "There is room." : `Evict the smallest value ${removed}.`} We retain the ${k} largest values read so far, or all values if fewer have arrived.`,
        { heap: show(h) },
        {
          nodes: h.map((v, i) => ({
            id: String(i),
            label: String(v),
            x:
              210 +
              ((i -
                (2 ** Math.floor(Math.log2(i + 1)) - 1) -
                (2 ** Math.floor(Math.log2(i + 1)) - 1) / 2) *
                400) /
                2 ** Math.floor(Math.log2(i + 1)),
            y: 35 + Math.floor(Math.log2(i + 1)) * 70,
          })),
          edges: h.slice(1).map((_, i) => ({
            from: String(Math.floor(i / 2)),
            to: String(i + 1),
          })),
        },
      );
    }
    finish(h.length === k ? String(h[0]) : "None");
  } else if (["dfs-lesson", "bfs-lesson", "trees-lesson"].includes(id)) {
    const nodes = [
        { id: "A", label: "A", x: 170, y: 25 },
        { id: "B", label: "B", x: 85, y: 100 },
        { id: "C", label: "C", x: 255, y: 100 },
        { id: "D", label: "D", x: 45, y: 175 },
      ],
      edges = [
        { from: "A", to: "B" },
        { from: "A", to: "C" },
        { from: "B", to: "D" },
      ];
    const graph: Record<string, string[]> = {
      A: c.unreachable ? [] : ["B", "C"],
      B: ["D"],
      C: [],
      D: [],
    };
    const pending: [string, number][] =
        id === "trees-lesson" && c.unreachable ? [] : [["A", 1]],
      seen = new Set<string>(),
      order: string[] = [];
    let depth = 0;
    add(
      "Starting structure",
      "An arrow joins a parent to a child. For a general graph, it is an allowed direction of travel.",
      {
        waiting: show(
          id === "trees-lesson" ? pending : pending.map(([node]) => node),
        ),
      },
      {
        nodes: c.unreachable && id === "trees-lesson" ? [] : nodes,
        edges: c.unreachable ? [] : edges,
      },
    );
    while (pending.length) {
      const [u, d] = id === "bfs-lesson" ? pending.shift()! : pending.pop()!;
      if (seen.has(u)) continue;
      seen.add(u);
      order.push(u);
      depth = Math.max(depth, d);
      const children = graph[u];
      for (const v of id === "bfs-lesson" ? children : [...children].reverse())
        pending.push([v, d + 1]);
      add(
        `Visit ${u}`,
        id === "trees-lesson"
          ? `${u} is on level ${d}. The deepest level visited is ${depth}.`
          : id === "bfs-lesson"
            ? "Take the earliest waiting node from the queue; its children join the back."
            : "Take the latest waiting node from the stack; push children in reverse order so B is explored before C.",
        {
          visited: show(order),
          waiting: show(
            id === "trees-lesson" ? pending : pending.map(([node]) => node),
          ),
          ...(id === "trees-lesson" ? { deepestLevel: String(depth) } : {}),
        },
        { nodes, edges: c.unreachable ? [] : edges, active: [u] },
      );
    }
    finish(id === "trees-lesson" ? String(depth) : show(order));
  } else if (id === "union-find-lesson") {
    const p: Record<string, string> = { A: "A", B: "B", C: "C" };
    const find = (u: string): string => {
      if (p[u] !== u) p[u] = find(p[u]);
      return p[u];
    };
    add(
      "Three separate groups",
      "A representative is the label found by following parent links. Initially each person represents themselves.",
      { parents: show(p), groups: "3" },
    );
    for (const [a, b] of c.unreachable
      ? [["A", "B"]]
      : [
          ["A", "B"],
          ["B", "C"],
        ]) {
      const ra = find(a),
        rb = find(b);
      p[rb] = ra;
      add(
        `Join ${a} and ${b}`,
        `Their representatives are ${ra} and ${rb}. Make ${rb} point to ${ra}; compare representatives, not raw parent entries.`,
        { parents: show(p), representatives: show(["A", "B", "C"].map(find)) },
        {
          nodes: ["A", "B", "C"].map((u, i) => ({
            id: u,
            label: u,
            x: [210, 100, 320][i],
            y: i === 0 ? 35 : 130,
          })),
          edges: ["A", "B", "C"]
            .filter((u) => p[u] !== u)
            .map((u) => ({ from: u, to: p[u] })),
        },
      );
    }
    finish(String(new Set(["A", "B", "C"].map(find)).size));
  } else if (id === "dijkstra-lesson") {
    const names = ["S", "A", "B", "C", "T"];
    const nodes = names.map((u, i) => ({
      id: u,
      label: u,
      x: [30, 160, 160, 280, 390][i],
      y: [95, 30, 160, 95, 95][i],
    }));
    const raw: [string, string, number][] = [
      ["S", "A", c.negative ? -4 : 4],
      ["S", "B", 2],
      ["A", "B", 1],
      ["A", "C", 5],
      ["B", "C", 8],
      ...(!c.unreachable
        ? ([
            ["B", "T", 10],
            ["C", "T", 2],
          ] as [string, string, number][])
        : []),
    ];
    const edges = raw.map(([from, to, w]) => ({ from, to, label: String(w) }));
    if (c.negative) {
      add(
        "Reject the input",
        "Dijkstra needs non-negative weights. Reject the negative edge before claiming any shortest route.",
        { error: "Negative weight rejected" },
        { nodes, edges },
      );
      finish("Negative weight rejected");
      return f;
    }
    const dist: Record<string, number> = { S: 0 },
      heap: [number, string][] = [[0, "S"]];
    add(
      "Start at S",
      "A tentative distance is the cheapest route discovered so far. Infinity means no route has been found yet.",
      {
        distances: names.map((u) => `${u}: ${dist[u] ?? "∞"}`).join(", "),
        heap: show(heap),
      },
      { nodes, edges },
    );
    while (heap.length) {
      heap.sort((a, b) => a[0] - b[0]);
      const [d, u] = heap.shift()!;
      if (d !== dist[u]) {
        add(
          `Skip stale ${u}`,
          `The saved distance ${d} is outdated; a cheaper route of ${dist[u]} replaced it.`,
          { heap: show(heap) },
          { nodes, edges, active: [u] },
        );
        continue;
      }
      for (const [from, v, w] of raw)
        if (from === u && d + w < (dist[v] ?? Infinity)) {
          dist[v] = d + w;
          heap.push([d + w, v]);
        }
      add(
        `Settle ${u} at ${d}`,
        `The smallest non-stale heap entry fixes ${u}'s shortest distance. Try its outgoing edges: a better route updates a neighbor and enters the heap.`,
        {
          distances: names.map((v) => `${v}: ${dist[v] ?? "∞"}`).join(", "),
          heap: show(heap),
        },
        { nodes, edges, active: [u] },
      );
    }
    finish(dist.T === undefined ? "None" : String(dist.T));
  } else if (id === "backtracking-lesson") {
    const out: number[][] = [],
      path: number[] = [];
    const nodes: { id: string; label: string; x: number; y: number }[] = [],
      edges: { from: string; to: string; label: string }[] = [];
    const visit = (
      i: number,
      key: string,
      parent?: string,
      choice?: string,
    ) => {
      const x =
        210 +
        key
          .split("")
          .reduce((s, k, j) => s + ((k === "1" ? -1 : 1) * 100) / 2 ** j, 0);
      nodes.push({ id: key || "root", label: show(path), x, y: 25 + i * 75 });
      if (parent !== undefined)
        edges.push({ from: parent || "root", to: key, label: choice! });
      if (i === a.length) out.push([...path]);
      add(
        `At choice ${i}`,
        i === a.length
          ? "All choices are made. Save a COPY of this path."
          : `Choose whether to include value ${a[i]}. The current path is ${show(path)}.`,
        { path: show(path), saved: show(out) },
        { nodes: [...nodes], edges: [...edges], active: [key || "root"] },
      );
      if (i === a.length) return;
      path.push(a[i]);
      visit(i + 1, key + "1", key, `take ${a[i]}`);
      path.pop();
      add(
        `Undo ${a[i]}`,
        "Remove the choice before exploring the skip branch, so branches do not share leftover state.",
        { path: show(path), saved: show(out) },
        { nodes: [...nodes], edges: [...edges], active: [key || "root"] },
      );
      visit(i + 1, key + "0", key, `skip ${a[i]}`);
    };
    visit(0, "");
    finish(show(out));
  } else if (id === "dp-lesson") {
    const n = c.n ?? 4,
      dp = [1, 1];
    const nodes = Array.from({ length: n + 1 }, (_, i) => ({
      id: String(i),
      label: String(i),
      x: 35 + i * 65,
      y: 100 - (i % 2) * 30,
    }));
    add(
      "Define the smaller question",
      "dp[i] means ways to climb i stairs using steps of size 1 or 2. There is one way to climb zero stairs: take no steps.",
      { known: "dp[0] = 1; dp[1] = 1" },
      { nodes, edges: [] },
    );
    for (let i = 2; i <= n; i++) {
      dp[i] = dp[i - 1] + dp[i - 2];
      add(
        `Compute dp[${i}]`,
        `Last step is either size 1 (from ${i - 1}) or size 2 (from ${i - 2}). These distinct groups have ${dp[i - 1]} and ${dp[i - 2]} ways: ${dp[i]} total.`,
        { known: show(dp.slice(0, i + 1)) },
        {
          nodes,
          edges: [
            { from: String(i - 1), to: String(i), label: String(dp[i - 1]) },
            { from: String(i - 2), to: String(i), label: String(dp[i - 2]) },
          ],
          active: [String(i)],
        },
      );
    }
    finish(String(dp[n]));
  } else if (c.pixel) {
    const [r, g, b] = c.pixel;
    const avg = Math.floor((r + g + b) / 3),
      inverse = [255 - r, 255 - g, 255 - b];
    add(
      "Read the three channels",
      "A pixel groups red, green and blue in that order. Each channel is between 0 and 255.",
      { input: show(c.pixel) },
    );
    if (id === "filtering-images") {
      add(
        "Add, divide, repeat",
        `(${r} + ${g} + ${b}) / 3 has floored average ${avg}. Put it in all three channels.`,
        { average: String(avg) },
      );
      finish(show([avg, avg, avg]));
    } else if (id === "inverting-colors") {
      add(
        "Subtract each channel from 255",
        `255 − ${r} = ${inverse[0]}; 255 − ${g} = ${inverse[1]}; 255 − ${b} = ${inverse[2]}.`,
        { input: show(c.pixel) },
      );
      finish(show(inverse));
    } else if (id === "debugging-images") {
      add(
        "Observe the broken return",
        "The average is correct, but returning (avg, 0, 0) sends it only to red. Three values are present; two channel VALUES are wrong.",
        { broken: show([avg, 0, 0]), expected: show([avg, avg, avg]) },
      );
      add(
        "Repair the return",
        "Return (avg, avg, avg). Use a non-black test pixel; black alone would conceal the bug.",
        { fixed: show([avg, avg, avg]) },
      );
      finish(show([avg, avg, avg]));
    } else {
      const bright = c.pixel.map((x) => Math.min(255, x + 100));
      add(
        "Stage 1: brighten +100",
        "Add 100 to each channel, keeping values at most 255.",
        { before: show(c.pixel), after: show(bright) },
      );
      const v =
        Math.floor(bright.reduce((s, x) => s + x, 0) / 3) >= 128 ? 255 : 0;
      add(
        "Stage 2: threshold at 128",
        "Average the brightened channels. At least 128 becomes white; less becomes black.",
        { average: String(Math.floor(bright.reduce((s, x) => s + x, 0) / 3)) },
      );
      finish(show([v, v, v]));
    }
  }
  return f;
}
