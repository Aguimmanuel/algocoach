import structure from "./courseStructure.json" with { type: "json" };
import { teachLesson, GUIDANCE } from "./teaching";
import type { BeginnerExample } from "./beginner";
export interface QuizQ {
  id: string;
  kind: "mcq" | "order" | "spot";
  prompt: string;
  options?: string[];
  answer?: number;
  explain: string;
  items?: string[];
  correctOrder?: number[];
}

export interface LessonPage {
  id: string;
  kind: "story" | "concept" | "try" | "quiz" | "code" | "wrap";
  eyebrow: string;
  title: string;
  body: string[];
  bullets?: string[];
  goal?: string;
  words?: string[];
  required?: boolean;
  example?: BeginnerExample;
  widget?: string;
  quiz?: QuizQ;
  code?: { title: string; lang: string; text: string; highlight?: number[] };
  callout?: { emoji: string; text: string };
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  minutes: number;
  xp: number;
  patternId?: string;
  widget?: string;
  pages: LessonPage[];
}

export interface Unit {
  id: string;
  title: string;
  blurb: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  level: string;
  lessonsCount: number;
  hours: string;
  description: string;
  outcomes: string[];
  units: Unit[];
}

export const COURSES: Course[] = (structure as Course[]).map((c) => ({
  ...c,
  description: GUIDANCE[c.id].description,
  outcomes: GUIDANCE[c.id].outcomes,
  units: c.units.map((u, i) => ({
    ...u,
    title: `Unit ${i + 1} · ${i === 0 ? "Begin with a small example" : "Connect the next ideas"}`,
    blurb: "Follow one task from a narrated recipe to a tested result.",
    lessons: u.lessons.map(teachLesson),
  })),
  lessonsCount: c.units.reduce((n, u) => n + u.lessons.length, 0),
}));
export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}
export function getLesson(
  courseId: string,
  lessonId: string,
): { course: Course; lesson: Lesson } | null {
  const course = getCourse(courseId);
  if (!course) return null;
  const lesson = flattenLessons(course).find((l) => l.id === lessonId);
  return lesson ? { course, lesson } : null;
}
export function flattenLessons(course: Course): Lesson[] {
  return course.units.flatMap((u) => u.lessons);
}
export function nextLesson(course: Course, id: string): Lesson | null {
  const a = flattenLessons(course),
    i = a.findIndex((l) => l.id === id);
  return i >= 0 ? (a[i + 1] ?? null) : null;
}
export function prevLesson(course: Course, id: string): Lesson | null {
  const a = flattenLessons(course),
    i = a.findIndex((l) => l.id === id);
  return i > 0 ? a[i - 1] : null;
}
