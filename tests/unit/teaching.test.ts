import { describe, it, expect } from "vitest";
import { CASES, lessonTrace } from "../../src/lib/lessonTraces";
import { PLANS } from "../../src/data/teaching";
import { COURSES, flattenLessons } from "../../src/data/curriculum";
const normalize = (s: string) =>
  s
    .replace(/\s/g, "")
    .replaceAll("'", '"')
    .replaceAll("(", "[")
    .replaceAll(")", "]");
describe("the authored recipe and browser simulation agree", () => {
  for (const [id, p] of Object.entries(PLANS))
    it(id, () => {
      const frames = lessonTrace(id);
      expect(normalize(frames.at(-1)!.output!)).toBe(normalize(p.expected));
      for (const c of CASES[id]) {
        const trace = lessonTrace(id, c);
        expect(trace.length).toBeGreaterThanOrEqual(2);
        expect(trace.at(-1)!.title).toBe("Result");
        expect(trace.at(-1)!.output).toBeDefined();
        for (const f of trace) {
          expect(f.explanation.length).toBeGreaterThan(20);
          for (const e of f.edges ?? []) {
            expect(f.nodes?.some((n) => n.id === e.from)).toBe(true);
            expect(f.nodes?.some((n) => n.id === e.to)).toBe(true);
          }
        }
      }
    });
});
it("every lesson has aligned practice, a real code-line task and a different final question", () => {
  for (const l of COURSES.flatMap(flattenLessons)) {
    const p = PLANS[l.id];
    expect(l.widget).toBe("guide-" + l.id);
    expect(l.pages.filter((p) => p.required)).toHaveLength(1);
    expect(l.pages.some((p) => p.example)).toBe(true);
    expect(l.pages.some((p) => p.code?.text === PLANS[l.id].code)).toBe(true);
    expect(p.final.prompt).not.toBe(p.predict.prompt);
    expect(
      p.code
        .split("\n")
        .some((line) =>
          line.split(" # ")[0].includes(p.gap.options[p.gap.answer]),
        ),
    ).toBe(true);
  }
});
it("covers failure cases rather than guaranteeing a successful lookup", () => {
  expect(
    lessonTrace("binary-search-lesson", CASES["binary-search-lesson"][1]).at(
      -1,
    )!.output,
  ).toBe("None");
  expect(
    lessonTrace("dijkstra-lesson", CASES["dijkstra-lesson"][1]).at(-1)!.output,
  ).toBe("None");
  expect(
    lessonTrace("dijkstra-lesson", CASES["dijkstra-lesson"][2]).at(-1)!.output,
  ).toBe("Negative weight rejected");
  expect(
    lessonTrace("what-is-algorithm", CASES["what-is-algorithm"][1]).at(-1)!
      .output,
  ).toBe("-2");
});
