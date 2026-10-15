import { describe, it, expect } from "vitest";
import { PATTERNS } from "../../src/data/patterns";
import {
  PLAYGROUND_EXAMPLES,
  describePlaygroundInput,
} from "../../src/data/playgroundExamples";
import { getPlaygroundVisual } from "../../src/data/visuals";

describe("five real examples for every algorithm playground", () => {
  it("covers exactly all 19 patterns with five distinct inputs each", () => {
    expect(Object.keys(PLAYGROUND_EXAMPLES).sort()).toEqual(
      PATTERNS.map((p) => p.id).sort(),
    );
    const ids: string[] = [];
    for (const pattern of PATTERNS) {
      const examples = PLAYGROUND_EXAMPLES[pattern.id];
      expect(examples).toHaveLength(5);
      expect(new Set(examples.map((e) => JSON.stringify(e.input))).size).toBe(
        5,
      );
      expect(new Set(examples.map((e) => e.label)).size).toBe(5);
      for (const example of examples) {
        ids.push(example.id);
        expect(example.note.length).toBeGreaterThan(25);
        expect(describePlaygroundInput(example.input).length).toBeGreaterThan(
          10,
        );
        for (const pair of example.input.intervals ?? example.input.edges ?? [])
          expect(pair).toHaveLength(2);
        for (const edge of example.input.weightedEdges ?? []) {
          expect(edge).toHaveLength(3);
          expect(edge[2]).toBeGreaterThanOrEqual(0);
        }
      }
    }
    expect(new Set(ids).size).toBe(95);
  });

  for (const pattern of PATTERNS) {
    PLAYGROUND_EXAMPLES[pattern.id].forEach((example, index) => {
      it(`${pattern.id}: ${example.label} produces the independently authored result`, () => {
        const before = JSON.stringify(example);
        const visual = getPlaygroundVisual(pattern.id, index);
        expect(visual.output).toEqual(example.expected);
        expect(JSON.stringify(example)).toBe(before);
        expect(visual.frames.length).toBeGreaterThan(1);
        for (const frame of visual.frames) {
          expect(Number.isInteger(frame.line)).toBe(true);
          expect(frame.line).toBeGreaterThanOrEqual(0);
          expect(frame.line).toBeLessThan(visual.code.length);
          expect(frame.msg).not.toMatch(/undefined|NaN/);
          expect(frame.msg.length).toBeGreaterThan(5);
          expect(Boolean(frame.rows || frame.grid)).toBe(true);
          if (frame.grid) {
            expect(frame.grid.length).toBeGreaterThan(0);
            expect(new Set(frame.grid.map((r) => r.length)).size).toBe(1);
          }
          for (const row of frame.rows ?? []) {
            for (const cell of row.cells)
              expect(cell.v).not.toMatch(/undefined|NaN/);
          }
        }
        expect(visual.frames.at(-1)!.msg).toContain(
          `Result: ${JSON.stringify(example.expected)}`,
        );
        expect(getPlaygroundVisual(pattern.id, index)).toEqual(visual);
      });
    });
  }

  it("retains separate region labels and accurate no-match results", () => {
    const regions = getPlaygroundVisual("dfs", 2);
    const cells = regions.frames
      .at(-1)!
      .grid!.flat()
      .filter((c) => c.state !== "dim");
    expect(new Set(cells.map((c) => c.v)).size).toBe(4);
    expect(getPlaygroundVisual("stack", 2).output).toBe(false);
    expect(getPlaygroundVisual("bfs", 2).output).toBe(-1);
    expect(getPlaygroundVisual("sliding-window", 1).output).toBe(-7);
  });
});
