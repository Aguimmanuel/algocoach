import { useEffect, useMemo, useState } from "react";
import { cn } from "../utils/cn";

type DemoId = "binary" | "two" | "window" | "bfs";

/**
 * The real code behind each animation.
 *
 * A picture alone leaves a gap: you can watch the boxes move and still not know
 * which line caused it. So every frame carries the index of the line running at
 * that moment, and the panel highlights it. The learner builds the intuition
 * from the animation first, then connects it to the code — which is the order
 * the research says works, and the reason the code sits beside the picture
 * rather than replacing it.
 */
const CODE: Record<DemoId, string[]> = {
  binary: [
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
  ],
  two: [
    "def two_sum_sorted(arr, target):",
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
  ],
  window: [
    "def max_sum_window(arr, k):",
    "    window = sum(arr[:k])",
    "    best = window",
    "    for end in range(k, len(arr)):",
    "        window += arr[end] - arr[end - k]",
    "        best = max(best, window)",
    "    return best",
  ],
  bfs: [
    "from collections import deque",
    "def shortest_path(grid, start, goal):",
    "    queue = deque([(start, 0)])",
    "    seen = {start}",
    "    while queue:",
    "        (r, c), dist = queue.popleft()",
    "        if (r, c) == goal:",
    "            return dist",
    "        for dr, dc in [(1,0), (-1,0), (0,1), (0,-1)]:",
    "            nxt = (r + dr, c + dc)",
    "            if nxt in grid and nxt not in seen:",
    "                seen.add(nxt)",
    "                queue.append((nxt, dist + 1))",
    "    return -1",
  ],
};

interface ArrFrame {
  states: string[];
  labels: string[][];
  msg: string;
  note?: string;
  /** index into CODE[demo] — the line running at this frame */
  line: number;
}

/* ---------------------------- frame builders ---------------------------- */

const BS_ARR = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 91];

function binaryFrames(target: number): ArrFrame[] {
  const arr = BS_ARR;
  const frames: ArrFrame[] = [];
  let lo = 0;
  let hi = arr.length - 1;
  const base = (l: number, h: number, mid?: number, found?: boolean): Pick<ArrFrame, "states" | "labels"> => ({
    states: arr.map((_, i) => (found && i === mid ? "found" : i === mid ? "mid" : i < l || i > h ? "out" : "in")),
    labels: arr.map((_, i) => {
      const L: string[] = [];
      if (i === l && l <= h) L.push("low");
      if (i === h && l <= h) L.push("high");
      if (i === mid) L.push("mid");
      return L;
    }),
  });
  frames.push({ ...base(lo, hi), line: 1, msg: `Goal: find ${target}. The whole array is still possible, so ${arr.length} candidates.` });
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const v = arr[mid];
    if (v === target) {
      frames.push({ ...base(lo, hi, mid, true), line: 5, msg: `mid = index ${mid} → value ${v}. That's exactly ${target}. Found it!`, note: `Took ${frames.length} look(s) instead of up to ${arr.length}.` });
      return frames;
    }
    if (v < target) {
      frames.push({ ...base(lo, hi, mid), line: 7, msg: `mid = index ${mid} → value ${v}. ${v} < ${target}, and the array is sorted, so everything at or left of mid is too small. Discard the left half.` });
      lo = mid + 1;
    } else {
      frames.push({ ...base(lo, hi, mid), line: 9, msg: `mid = index ${mid} → value ${v}. ${v} > ${target}, so everything at or right of mid is too big. Discard the right half.` });
      hi = mid - 1;
    }
  }
  frames.push({ ...base(lo, hi), line: 10, msg: `low passed high — nothing is left to check. ${target} is not in the array.`, note: "Return 'not found' (e.g. −1)." });
  return frames;
}

const TP_ARR = [1, 3, 4, 6, 8, 11, 15, 19];

function twoPointerFrames(target: number): ArrFrame[] {
  const arr = TP_ARR;
  const frames: ArrFrame[] = [];
  let l = 0;
  let r = arr.length - 1;
  const base = (found = false): Pick<ArrFrame, "states" | "labels"> => ({
    states: arr.map((_, i) => (found && (i === l || i === r) ? "found" : i === l ? "a" : i === r ? "b" : i > l && i < r ? "in" : "out")),
    labels: arr.map((_, i) => (i === l ? ["left"] : i === r ? ["right"] : [])),
  });
  frames.push({ ...base(), line: 1, msg: `Goal: find two numbers that add up to ${target}. Put one pointer at each end of the sorted array.` });
  while (l < r) {
    const s = arr[l] + arr[r];
    if (s === target) {
      frames.push({ ...base(true), line: 5, msg: `${arr[l]} + ${arr[r]} = ${s}. That's the target!`, note: "One pass, no nested loop." });
      return frames;
    }
    if (s < target) {
      frames.push({ ...base(), line: 7, msg: `${arr[l]} + ${arr[r]} = ${s} is too small. The right value is already the biggest left, so only a bigger LEFT value can help → move left pointer →.` });
      l++;
    } else {
      frames.push({ ...base(), line: 9, msg: `${arr[l]} + ${arr[r]} = ${s} is too big. The left value is already the smallest left, so only a smaller RIGHT value can help → move right pointer ←.` });
      r--;
    }
  }
  frames.push({ ...base(), line: 10, msg: "The pointers crossed. No pair exists.", note: "Every pair was ruled out without checking them all." });
  return frames;
}

const SW_ARR = [2, 1, 5, 1, 3, 2, 9, 4, 1, 7];

function windowFrames(k: number): ArrFrame[] {
  const arr = SW_ARR;
  const frames: ArrFrame[] = [];
  const st = (s: number, e: number, best?: [number, number]) =>
    arr.map((_, i) => (best && i >= best[0] && i <= best[1] && (i < s || i > e) ? "found-dim" : i >= s && i <= e ? "window" : "out"));
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i];
  let best = sum;
  let bestRange: [number, number] = [0, k - 1];
  frames.push({
    states: st(0, k - 1),
    labels: arr.map((_, i) => (i === 0 ? ["start"] : i === k - 1 ? ["end"] : [])),
    line: 1,
    msg: `Goal: the biggest sum of any ${k} neighbours. Add up the first window once: sum = ${sum}.`,
    note: `Best so far: ${best}`,
  });
  for (let e = k; e < arr.length; e++) {
    sum += arr[e] - arr[e - k];
    const msg = `Slide: add ${arr[e]} (enters), subtract ${arr[e - k]} (leaves). New sum = ${sum}. No need to re-add everything.`;
    let extra = "";
    if (sum > best) {
      best = sum;
      bestRange = [e - k + 1, e];
      extra = " New best!";
    }
    frames.push({
      states: st(e - k + 1, e),
      labels: arr.map((_, i) => (i === e - k + 1 ? ["start"] : i === e ? ["end"] : [])),
      line: 4,
      msg: msg + extra,
      note: `Best so far: ${best}`,
    });
  }
  frames.push({
    states: arr.map((_, i) => (i >= bestRange[0] && i <= bestRange[1] ? "found" : "out")),
    labels: arr.map(() => []),
    line: 6,
    msg: `Done. The best window is indexes ${bestRange[0]}–${bestRange[1]} with sum ${best}.`,
    note: `Each element entered once and left once → O(n).`,
  });
  return frames;
}

/* ------------------------------- BFS grid ------------------------------- */

const GRID = ["S..#.....", ".#.#.###.", ".#...#...", ".####.#.#", "......#..", ".####...T"];
const ROWS = GRID.length;
const COLS = GRID[0].length;

interface BfsFrame {
  dist: (number | null)[][];
  queue: [number, number][];
  current: [number, number] | null;
  path: Set<string>;
  msg: string;
  /** index into CODE.bfs — the line running at this frame */
  line: number;
}

function bfsFrames(): BfsFrame[] {
  const dist: (number | null)[][] = GRID.map((row) => row.split("").map(() => null));
  const parent = new Map<string, string>();
  const frames: BfsFrame[] = [];
  const snap = (queue: [number, number][], current: [number, number] | null, msg: string, line: number, path = new Set<string>()): BfsFrame => ({
    dist: dist.map((r) => [...r]),
    queue: queue.map((q) => [...q] as [number, number]),
    current,
    path,
    msg,
    line,
  });
  dist[0][0] = 0;
  const queue: [number, number][] = [[0, 0]];
  frames.push(snap(queue, null, "Start: put the start cell in the queue with distance 0 and mark it visited.", 2));
  const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  while (queue.length) {
    const [r, c] = queue.shift()!;
    const d = dist[r][c]!;
    if (GRID[r][c] === "T") {
      const path = new Set<string>();
      let cur: string | undefined = `${r},${c}`;
      while (cur) {
        path.add(cur);
        cur = parent.get(cur);
      }
      frames.push(snap(queue, [r, c], `Reached the target at distance ${d}. Because BFS explores in rings, no shorter route can exist. Follow the parents back to draw the path.`, 7, path));
      return frames;
    }
    let pushed = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue;
      if (GRID[nr][nc] === "#" || dist[nr][nc] !== null) continue;
      dist[nr][nc] = d + 1;
      parent.set(`${nr},${nc}`, `${r},${c}`);
      queue.push([nr, nc]);
      pushed++;
    }
    frames.push(
      snap(queue, [r, c], `Take (${r},${c}) from the FRONT of the queue (distance ${d}). ${pushed ? `Add its ${pushed} unvisited neighbour${pushed > 1 ? "s" : ""} at distance ${d + 1}.` : "No new neighbours — dead end."}`, 5),
    );
  }
  return frames;
}

/* ------------------------------- Visuals ------------------------------- */

// Monochrome language for the animations: fill, outline and halo carry the
// meaning that hue used to. Nothing here is an error, so nothing here is red.
//   filled black  = the thing being acted on right now
//   outlined black = the other pointer
//   faded grey    = ruled out / out of range
//   halo ring     = the answer
const CELL: Record<string, string> = {
  in: "bg-white border-slate-300 text-slate-800",
  out: "bg-slate-100 border-slate-200 text-slate-500",
  mid: "bg-slate-900 border-slate-900 text-white scale-110 shadow-md",
  found: "bg-slate-900 border-slate-900 text-white scale-110 shadow-md ring-4 ring-slate-400",
  "found-dim": "bg-slate-200 border-slate-400 text-slate-900",
  a: "bg-slate-900 border-slate-900 text-white scale-110 shadow-md",
  b: "bg-white border-slate-900 text-slate-900 scale-110 shadow-md",
  window: "bg-slate-200 border-slate-400 text-slate-900 shadow-sm",
};

function ArrayView({ arr, frame }: { arr: number[]; frame: ArrFrame }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto flex w-max gap-1.5 px-2 pt-4 sm:gap-2">
        {arr.map((v, i) => (
          <div key={i} className="flex w-11 flex-col items-center sm:w-12">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border-2 text-base font-bold transition-all duration-300 sm:h-12 sm:w-12", CELL[frame.states[i]])}>
              {v}
            </div>
            <span className="mt-1 text-[10px] text-slate-400">{i}</span>
            <div className="flex h-9 flex-col items-center gap-0.5">
              {frame.labels[i].map((l) => (
                <span key={l} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {l}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BfsView({ frame }: { frame: BfsFrame }) {
  const inQueue = new Set(frame.queue.map(([r, c]) => `${r},${c}`));
  return (
    <div className="space-y-4">
      <div className="mx-auto grid w-max gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
        {GRID.map((row, r) =>
          row.split("").map((ch, c) => {
            const key = `${r},${c}`;
            const d = frame.dist[r][c];
            const isCur = frame.current?.[0] === r && frame.current?.[1] === c;
            const onPath = frame.path.has(key);
            const wall = ch === "#";
            return (
              <div
                key={key}
                style={!wall && d !== null && !onPath ? { backgroundColor: `hsl(0 0% ${Math.max(40, 94 - d * 3.5)}%)` } : undefined}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-md text-[11px] font-bold transition-colors duration-300 sm:h-11 sm:w-11 sm:text-sm",
                  wall ? "bg-slate-800" : "border border-slate-200 bg-white text-slate-700",
                  !wall && d !== null && d > 12 && !onPath && "text-white",
                  onPath && "border-slate-900 bg-slate-900 text-white",
                  inQueue.has(key) && !onPath && "ring-2 ring-slate-400",
                  isCur && "z-10 scale-110 ring-4 ring-slate-900",
                )}
              >
                {ch === "S" ? "S" : ch === "T" ? "🏁" : d !== null ? d : ""}
              </div>
            );
          }),
        )}
      </div>
      <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-slate-400" /> visited (number = distance)</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-slate-400" /> waiting in queue</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded ring-2 ring-slate-900" /> being processed</span>
      </div>
      <p className="text-center text-sm text-slate-500">
        Queue size: <strong className="text-slate-800">{frame.queue.length}</strong>
      </p>
    </div>
  );
}

/**
 * The code panel that runs beside the animation.
 *
 * Watching the boxes move builds intuition; seeing which line moved them turns
 * that intuition into something you can write yourself. Line numbers are shown
 * so the learner can follow along in their own editor.
 */
function CodeTrace({ demo, active }: { demo: DemoId; active: number }) {
  const code = CODE[demo];
  return (
    <div className="rounded-2xl bg-slate-900 p-3 lg:w-[320px]">
      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        The code · line {active + 1}
      </p>
      <pre className="overflow-x-auto font-mono text-[12px] leading-6">
        {code.map((l, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-3 rounded px-2 transition-colors duration-200",
              i === active ? "bg-slate-700 text-white" : "text-slate-400",
            )}
          >
            <span className={cn("w-4 shrink-0 text-right", i === active ? "text-slate-300" : "text-slate-600")}>
              {i + 1}
            </span>
            <span className="whitespace-pre">{l}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

/* ------------------------------- Main ------------------------------- */

const DEMOS: { id: DemoId; title: string; emoji: string; blurb: string; lesson: string }[] = [
  { id: "binary", title: "Binary Search", emoji: "✂️", blurb: "Halve the search space every step.", lesson: "binary-search" },
  { id: "two", title: "Two Pointers", emoji: "👉👈", blurb: "Walk inward from both ends of sorted data.", lesson: "two-pointers" },
  { id: "window", title: "Sliding Window", emoji: "🪟", blurb: "Update a running sum instead of recomputing.", lesson: "sliding-window" },
  { id: "bfs", title: "BFS on a Grid", emoji: "🌊", blurb: "Explore in rings to find the shortest path.", lesson: "bfs" },
];

interface Props {
  onOpenPattern: (id: string) => void;
}

export default function Visualizer({ onOpenPattern }: Props) {
  const [demo, setDemo] = useState<DemoId>("binary");
  const [bsTarget, setBsTarget] = useState(23);
  const [tpTarget, setTpTarget] = useState(14);
  const [k, setK] = useState(3);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const arrFrames = useMemo(() => {
    if (demo === "binary") return binaryFrames(bsTarget);
    if (demo === "two") return twoPointerFrames(tpTarget);
    if (demo === "window") return windowFrames(k);
    return [];
  }, [demo, bsTarget, tpTarget, k]);
  const bfs = useMemo(() => (demo === "bfs" ? bfsFrames() : []), [demo]);

  const total = demo === "bfs" ? bfs.length : arrFrames.length;
  const safeStep = Math.min(step, total - 1);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [demo, bsTarget, tpTarget, k]);

  useEffect(() => {
    if (!playing) return;
    if (safeStep >= total - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), demo === "bfs" ? 450 : 1100);
    return () => clearTimeout(t);
  }, [playing, safeStep, total, demo]);

  const meta = DEMOS.find((d) => d.id === demo)!;
  const frame = arrFrames[safeStep];
  const bfsFrame = bfs[safeStep];
  const msg = demo === "bfs" ? bfsFrame?.msg : frame?.msg;
  const arr = demo === "binary" ? BS_ARR : demo === "two" ? TP_ARR : SW_ARR;

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">🎬 Watch the algorithms think</h2>
        <p className="mt-1 text-slate-600">Press play or step through. Read each explanation and try to predict the next move before you click.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DEMOS.map((d) => (
          <button
            key={d.id}
            onClick={() => setDemo(d.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition hover:shadow-md",
              demo === d.id ? "border-slate-400 bg-slate-50 ring-2 ring-slate-200" : "border-slate-200 bg-white",
            )}
          >
            <div className="text-2xl">{d.emoji}</div>
            <p className="mt-1 font-semibold text-slate-900">{d.title}</p>
            <p className="text-sm text-slate-500">{d.blurb}</p>
          </button>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">
            {meta.emoji} {meta.title}
          </h3>
          <button onClick={() => onOpenPattern(meta.lesson)} className="text-sm font-semibold text-slate-900 hover:underline">
            Open the lesson →
          </button>
        </div>

        {/* params */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {demo === "binary" && (
            <>
              <span className="text-slate-500">Search for:</span>
              {[23, 72, 2, 50].map((t) => (
                <button key={t} onClick={() => setBsTarget(t)} className={chip(bsTarget === t)}>
                  {t}
                  {!BS_ARR.includes(t) && " (missing)"}
                </button>
              ))}
            </>
          )}
          {demo === "two" && (
            <>
              <span className="text-slate-500">Target sum:</span>
              {[14, 23, 30, 99].map((t) => (
                <button key={t} onClick={() => setTpTarget(t)} className={chip(tpTarget === t)}>
                  {t}
                  {t === 99 && " (no pair)"}
                </button>
              ))}
            </>
          )}
          {demo === "window" && (
            <>
              <span className="text-slate-500">Window size k:</span>
              {[2, 3, 4].map((t) => (
                <button key={t} onClick={() => setK(t)} className={chip(k === t)}>
                  {t}
                </button>
              ))}
            </>
          )}
          {demo === "bfs" && <span className="text-slate-500">Find the shortest way from S to 🏁 — dark squares are walls.</span>}
        </div>

        {/* Picture first, then the code that produced it — side by side on a
            wide screen, stacked on a phone. */}
        <div className="mt-6 flex flex-col gap-4 lg:flex-row">
          <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-2 py-6 sm:px-4">
            {demo === "bfs" ? bfsFrame && <BfsView frame={bfsFrame} /> : frame && <ArrayView arr={arr} frame={frame} />}
          </div>
          <CodeTrace demo={demo} active={(demo === "bfs" ? bfsFrame?.line : frame?.line) ?? 0} />
        </div>

        {/* explanation */}
        <div className="mt-5 min-h-[88px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
            Step {safeStep + 1} of {total}
          </p>
          <p className="mt-1 text-slate-800">{msg}</p>
          {demo !== "bfs" && frame?.note && <p className="mt-1 text-sm font-semibold text-slate-900">{frame.note}</p>}
        </div>

        {/* controls */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPlaying(false);
              setStep(0);
            }}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ⟲ Reset
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setStep(Math.max(0, safeStep - 1));
            }}
            disabled={safeStep === 0}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              setPlaying(false);
              setStep(Math.min(total - 1, safeStep + 1));
            }}
            disabled={safeStep >= total - 1}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-30"
          >
            Next →
          </button>
          <button
            onClick={() => {
              if (safeStep >= total - 1) setStep(0);
              setPlaying((p) => !p);
            }}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-900"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <div className="ml-auto hidden h-2 w-40 overflow-hidden rounded-full bg-slate-100 sm:block">
            <div className="h-full rounded-full bg-slate-700 transition-all" style={{ width: `${((safeStep + 1) / total) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
