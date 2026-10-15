export type RGB = [number, number, number];
export type Filter =
  | "identity"
  | "red"
  | "green"
  | "blue"
  | "gray"
  | "invert"
  | "brighten"
  | "threshold"
  | "poster";
export const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
export function filterPixel(
  pixel: RGB,
  filter: Filter,
  amount = 40,
  threshold = 128,
): RGB {
  const [r, g, b] = pixel;
  switch (filter) {
    case "red":
      return [r, 0, 0];
    case "green":
      return [0, g, 0];
    case "blue":
      return [0, 0, b];
    case "gray": {
      const avg = Math.floor((r + g + b) / 3);
      return [avg, avg, avg];
    }
    case "invert":
      return [255 - r, 255 - g, 255 - b];
    case "brighten":
      return pixel.map((v) => clamp(v + amount)) as RGB;
    case "threshold": {
      const v = (r + g + b) / 3 >= threshold ? 255 : 0;
      return [v, v, v];
    }
    case "poster":
      return pixel.map((v) => clamp(Math.round(v / 64) * 64)) as RGB;
    default:
      return [...pixel];
  }
}
export function pipelinePixel(
  pixel: RGB,
  filters: Filter[],
  amount = 40,
  threshold = 128,
): RGB {
  return filters.reduce((p, f) => filterPixel(p, f, amount, threshold), pixel);
}
export function dijkstraTrace(
  n: number,
  edges: [number, number, number][],
  start = 0,
) {
  if (edges.some((e) => e[2] < 0))
    throw new Error("Dijkstra requires non-negative weights");
  const dist = Array(n).fill(Infinity) as number[],
    done = new Set<number>();
  dist[start] = 0;
  const frames: { node: number; distance: number; distances: number[] }[] = [];
  for (let count = 0; count < n; count++) {
    let u = -1;
    for (let v = 0; v < n; v++)
      if (!done.has(v) && (u === -1 || dist[v] < dist[u])) u = v;
    if (u === -1 || !Number.isFinite(dist[u])) break;
    done.add(u);
    for (const [a, b, w] of edges)
      if (a === u && !done.has(b)) dist[b] = Math.min(dist[b], dist[u] + w);
    frames.push({ node: u, distance: dist[u], distances: [...dist] });
  }
  return frames;
}
