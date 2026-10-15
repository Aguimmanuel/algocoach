import examples from "./playgroundExamples.json" with { type: "json" };

export interface PlaygroundInput {
  values?: number[];
  target?: number;
  k?: number;
  from?: number;
  to?: number;
  text?: string;
  grid?: string[];
  tree?: (number | null)[];
  intervals?: [number, number][];
  coins?: number[];
  amount?: number;
  n?: number;
  edges?: [number, number][];
  weightedEdges?: [string, string, number][];
}
export interface PlaygroundExample {
  id: string;
  label: string;
  note: string;
  input: PlaygroundInput;
  expected: unknown;
}
export const PLAYGROUND_EXAMPLES = examples as unknown as Record<
  string,
  PlaygroundExample[]
>;

export function describePlaygroundInput(input: PlaygroundInput): string {
  const parts: string[] = [];
  if (input.values)
    parts.push(
      `Values: [${input.values.join(", ")}]${input.values.length ? "" : " (empty input)"}`,
    );
  if (input.target !== undefined) parts.push(`Target: ${input.target}`);
  if (input.k !== undefined) parts.push(`Window size: ${input.k}`);
  if (input.from !== undefined)
    parts.push(`Inclusive range: ${input.from} to ${input.to}`);
  if (input.text !== undefined)
    parts.push(`Brackets: ${JSON.stringify(input.text)}`);
  if (input.grid)
    parts.push(
      `Board: ${input.grid.join(" / ")} (# = wall, S = start, T = goal)`,
    );
  if (input.tree)
    parts.push(
      `Tree by level: ${JSON.stringify(input.tree)} (null = missing child)`,
    );
  if (input.intervals)
    parts.push(
      `Intervals: ${input.intervals.map(([a, b]) => `[${a}, ${b}]`).join(", ") || "none"}`,
    );
  if (input.coins)
    parts.push(`Coins: [${input.coins.join(", ")}]; amount: ${input.amount}`);
  if (input.n !== undefined)
    parts.push(
      `Nodes: ${input.n}; edges: ${input.edges?.map(([a, b]) => `${a}–${b}`).join(", ") || "none"}`,
    );
  if (input.weightedEdges)
    parts.push(
      `Undirected edges: ${input.weightedEdges.map(([a, b, w]) => `${a}–${b} (${w})`).join(", ")}; start: A`,
    );
  return parts.join(" · ");
}
