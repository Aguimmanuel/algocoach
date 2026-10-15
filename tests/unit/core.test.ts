import { describe, it, expect, vi, afterEach } from "vitest";
import { detectN, analyze } from "../../src/lib/analyze";
import { review, newCard, dueCards, today } from "../../src/lib/srs";
import { levelFor, computeXP, dailyQuests } from "../../src/data/gamification";
import { PATTERNS } from "../../src/data/patterns";
import { VISUALS } from "../../src/data/visuals";
import { localStreak, readToday } from "../../src/lib/activity";
afterEach(() => vi.useRealTimers());
describe("constraint analyzer", () => {
  it("understands exponent and superscript bounds", () => {
    expect(detectN("1 <= n <= 10^5")).toBe(100000);
    expect(detectN("n ≤ 10⁵")).toBe(100000);
  });
  it("handles missing bounds", () =>
    expect(detectN("Find a pair.")).toBeNull());
  it("ranks a contiguous window problem", () =>
    expect(
      analyze(
        "Find the longest substring without repeating characters. n <= 10^5",
      ).candidates.some((c) => c.pattern.id === "sliding-window"),
    ).toBe(true));
});
describe("spaced repetition", () => {
  it("resets a missed card", () => {
    const c = review(newCard(), false);
    expect(c.reps).toBe(0);
    expect(c.interval).toBe(1);
    expect(c.due > today()).toBe(true);
  });
  it("caps growth and retains a valid date", () => {
    let c = newCard();
    for (let i = 0; i < 100; i++) c = review(c, true);
    expect(c.interval).toBeLessThanOrEqual(365);
    expect(c.due).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("finds only due cards", () =>
    expect(
      dueCards({ a: newCard(), b: { ...newCard(), due: "2099-01-01" } }, 8),
    ).toEqual(["a"]));
});
describe("content and progress integrity", () => {
  it("has unique patterns and usable labs and visualizers", () => {
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(19);
    for (const p of PATTERNS) {
      expect(p.steps.length).toBeGreaterThan(1);
      expect(p.pitfalls.length).toBeGreaterThan(1);
      expect(p.signals.length).toBeGreaterThan(0);
      expect(
        p.skeleton
          .split("\n")
          .filter(
            (l) => l.trim() && !l.trim().startsWith("#") && l.trim().length > 8,
          ).length,
      ).toBeGreaterThanOrEqual(3);
      expect(VISUALS[p.id].frames.length).toBeGreaterThan(0);
    }
  });
  it("calculates XP and level without invented activity", () => {
    expect(
      computeXP({ learned: 0, solved: 0, correctAnswers: 0, sessions: 0 }),
    ).toBe(0);
    expect(levelFor(0).level.n).toBe(1);
    expect(levelFor(1000).level.n).toBeGreaterThan(1);
  });
  it("resets a previous daily log", () =>
    expect(
      readToday({
        date: "2000-01-01",
        answered: 8,
        sessions: 2,
        claimed: ["warmup"],
      }),
    ).toEqual({ answered: 0, sessions: 0 }));
  it("counts a real streak and completes daily quests", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T12:00:00"));
    expect(
      localStreak(["2026-10-12", "2026-10-13", "2026-10-14"]).current,
    ).toBe(3);
    expect(
      dailyQuests({ answered: 3, sessions: 1, goal: 3 }).every((q) => q.done),
    ).toBe(true);
  });
});
import { validStorage } from "../../src/lib/storageValidation";
describe("storage safety", () => {
  it("rejects wrong shapes and corrupted progress", () => {
    expect(validStorage("algocoach-learned", null, [])).toBe(false);
    expect(validStorage("algocoach-learned", [42], [])).toBe(false);
    expect(validStorage("algocoach-today", {}, {})).toBe(false);
    expect(validStorage("algocoach-deck", { a: { due: null } }, {})).toBe(
      false,
    );
  });
  it("accepts valid persisted data", () => {
    expect(validStorage("algocoach-learned", ["brute"], [])).toBe(true);
    expect(validStorage("algocoach-deck", { a: newCard() }, {})).toBe(true);
  });
});
