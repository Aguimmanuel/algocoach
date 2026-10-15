import { describe, it, expect } from "vitest";
import { COURSES, flattenLessons } from "../../src/data/curriculum";
import { BEGINNER } from "../../src/data/beginner";
import { PATTERNS } from "../../src/data/patterns";
import {
  filterPixel,
  pipelinePixel,
  dijkstraTrace,
} from "../../src/lib/experiments";
import { mergeLearning, emptyLesson } from "../../src/lib/learning";
describe("merged curriculum", () => {
  it("derives accurate counts and has a checked quiz in every lesson", () => {
    expect(COURSES.length).toBe(6);
    expect(COURSES.flatMap(flattenLessons).length).toBe(26);
    for (const c of COURSES) {
      expect(c.lessonsCount).toBe(flattenLessons(c).length);
      for (const l of flattenLessons(c)) {
        expect(l.pages.some((p) => p.quiz)).toBe(true);
        for (const p of l.pages)
          if (p.quiz?.options)
            expect(p.quiz.options[p.quiz.answer!]).toBeTruthy();
      }
    }
  });
  it("explains every pattern with two examples and a caution", () => {
    for (const p of PATTERNS) {
      const e = BEGINNER[p.id];
      expect(e.steps.length).toBeGreaterThanOrEqual(3);
      expect(e.input).toBeTruthy();
      expect(e.result).toBeTruthy();
      expect(e.another.body).toBeTruthy();
      expect(e.words).toBeTruthy();
      expect(e.caution).toBeTruthy();
    }
  });
});
describe("pixel mathematics", () => {
  it("keeps channels and computes grayscale using the same floor rule as the lesson", () => {
    expect(filterPixel([120, 200, 80], "green")).toEqual([0, 200, 0]);
    expect(filterPixel([30, 60, 90], "gray")).toEqual([60, 60, 60]);
    expect(filterPixel([0, 0, 2], "gray")).toEqual([0, 0, 0]);
  });
  it("inverts twice and clamps BOTH brightness bounds", () => {
    expect(
      filterPixel(filterPixel([20, 200, 255], "invert"), "invert"),
    ).toEqual([20, 200, 255]);
    expect(filterPixel([250, 0, 10], "brighten", 20)).toEqual([255, 20, 30]);
    expect(filterPixel([250, 0, 10], "brighten", -40)).toEqual([210, 0, 0]);
  });
  it("does not pretend filter order is interchangeable", () => {
    expect(
      pipelinePixel([60, 60, 60], ["brighten", "threshold"], 100, 128),
    ).toEqual([255, 255, 255]);
    expect(
      pipelinePixel([60, 60, 60], ["threshold", "brighten"], 100, 128),
    ).toEqual([100, 100, 100]);
  });
});
describe("correct graph trace", () => {
  it("respects the directions shown in the lesson", () => {
    const frames = dijkstraTrace(5, [
      [0, 1, 4],
      [0, 2, 2],
      [1, 2, 1],
      [1, 3, 5],
      [2, 3, 8],
      [2, 4, 10],
      [3, 4, 2],
    ]);
    expect(frames.map((f) => [f.node, f.distance])).toEqual([
      [0, 0],
      [2, 2],
      [1, 4],
      [3, 9],
      [4, 11],
    ]);
  });
  it("rejects negative weights", () =>
    expect(() => dijkstraTrace(2, [[0, 1, -1]])).toThrow());
});
describe("completion merge", () => {
  it("does not discard completed quizzes or grant duplicate completion", () => {
    const a = {
      ...emptyLesson(),
      page: 5,
      visited: ["one"],
      passed: ["quiz"],
      completed: true,
      updatedAt: 1,
    };
    const b = { ...emptyLesson(), page: 0, visited: ["two"], updatedAt: 2 };
    const merged = mergeLearning(
      { "course:lesson": a },
      { "course:lesson": b },
    )["course:lesson"];
    expect(merged.completed).toBe(true);
    expect(merged.passed).toEqual(["quiz"]);
    expect(merged.visited).toEqual(["one", "two"]);
    expect(merged.page).toBe(0);
  });
});
import { explainLine } from "../../src/components/curriculum/CodeWalkthrough";
it("translates core code constructs without executing the template", () => {
  expect(explainLine("def solve(x):")).toContain("Define a function");
  expect(explainLine("for x in data:")).toContain("Repeat");
  expect(explainLine("return answer")).toContain("Send this result");
  expect(explainLine("  if d > dist[u]: continue")).toContain("Skip");
});
