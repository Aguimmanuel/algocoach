export interface LessonProgress {
  page: number;
  visited: string[];
  passed: string[];
  completed: boolean;
  updatedAt: number;
}
export type LearningState = Record<string, LessonProgress>;
export const emptyLesson = (): LessonProgress => ({
  page: 0,
  visited: [],
  passed: [],
  completed: false,
  updatedAt: Date.now(),
});
export function mergeLearning(
  a: LearningState,
  b: LearningState,
): LearningState {
  const result = { ...a };
  for (const [key, v] of Object.entries(b)) {
    const old = result[key];
    result[key] = old
      ? {
          ...((v.updatedAt ?? 0) > (old.updatedAt ?? 0) ? v : old),
          visited: [...new Set([...old.visited, ...v.visited])],
          passed: [...new Set([...old.passed, ...v.passed])],
          completed: old.completed || v.completed,
        }
      : v;
  }
  return result;
}
