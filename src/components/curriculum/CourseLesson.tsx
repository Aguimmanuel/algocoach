import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  Lightbulb,
  Trophy,
  BookOpen,
} from "lucide-react";
import { getLesson, flattenLessons } from "../../data/curriculum";
import { BEGINNER, type BeginnerExample } from "../../data/beginner";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { emptyLesson, type LearningState } from "../../lib/learning";
import WorkedExample from "./WorkedExample";
import CodeWalkthrough from "./CodeWalkthrough";
import GuidedPractice, { PracticeCheck } from "./GuidedPractice";
import { PLANS, planExample } from "../../data/teaching";
interface Props {
  courseId: string;
  lessonId: string;
  onExit: () => void;
  onNext: (course: string, lesson: string) => void;
  onPattern: (id: string) => void;
  onComplete: (pattern?: string) => void;
  onAnswered: (id: string, correct: boolean) => void;
}
export function exampleFor(
  pattern: string | undefined,
  lessonId: string,
): BeginnerExample {
  return (
    BEGINNER[pattern ?? ""] ??
    BEGINNER[
      lessonId.includes("big-o")
        ? "big-o"
        : lessonId.includes("reading")
          ? "reading"
          : lessonId.includes("composing")
            ? "compose"
            : lessonId.includes("inverting")
              ? "invert"
              : lessonId.includes("debugging")
                ? "debug"
                : lessonId.includes("filtering")
                  ? "pixels"
                  : "foundations"
    ]
  );
}
export function enrichedPages(courseId: string, lessonId: string) {
  return getLesson(courseId, lessonId)?.lesson.pages ?? [];
}
export default function CourseLesson({
  courseId,
  lessonId,
  onExit,
  onNext,
  onPattern,
  onComplete,
  onAnswered,
}: Props) {
  const found = getLesson(courseId, lessonId)!;
  const { course, lesson } = found;
  const key = `${courseId}:${lessonId}`;
  const [state, setState] = useLocalStorage<LearningState>(
    "algocoach-learning",
    {},
  );
  const progress = state[key] ?? emptyLesson();
  const pages = useMemo(
    () => enrichedPages(courseId, lessonId),
    [courseId, lessonId],
  );
  const pageIndex = Math.min(Math.max(0, progress.page), pages.length - 1);
  const page = pages[pageIndex];
  const [celebrate, setCelebrate] = useState(false),
    [notes, setNotes] = useState(false);
  const [journal, setJournal] = useLocalStorage<string>(
    `algocoach-notes-${key}`,
    "",
  );
  const flat = flattenLessons(course),
    next = flat[flat.findIndex((l) => l.id === lessonId) + 1];
  const example = planExample(lessonId);
  const plan = PLANS[lessonId];
  const vocabulary = page.words ?? plan.words;
  const reached = (i: number) =>
    progress.completed ||
    i === pageIndex ||
    progress.visited.includes(pages[i].id);
  useEffect(() => {
    window.scrollTo(0, 0);
    setState((s) => {
      let old = s[key] ?? emptyLesson();
      if (
        old.visited.length &&
        !old.visited.some((v) => pages.some((p) => p.id === v))
      ) {
        old = { ...old, page: 0, visited: [pages[0].id] };
        return { ...s, [key]: { ...old, updatedAt: Date.now() } };
      }
      if (old.visited.includes(page.id)) return s;
      return {
        ...s,
        [key]: {
          ...old,
          visited: [...old.visited, page.id],
          updatedAt: Date.now(),
        },
      };
    });
  }, [key, page.id, setState]);
  const navigate = (index: number) => {
    setState((s) => ({
      ...s,
      [key]: {
        ...(s[key] ?? emptyLesson()),
        page: index,
        visited: [...new Set([...(s[key]?.visited ?? []), pages[index].id])],
        updatedAt: Date.now(),
      },
    }));
    setNotes(false);
  };
  const pass = (id = page.id) =>
    setState((s) => ({
      ...s,
      [key]: {
        ...(s[key] ?? emptyLesson()),
        passed: [...new Set([...(s[key]?.passed ?? []), id])],
        updatedAt: Date.now(),
      },
    }));
  const allPassed = pages
    .filter((p) => p.quiz || p.required)
    .every((p) => progress.passed.includes(p.id));
  const complete = () => {
    if (
      progress.completed ||
      !allPassed ||
      pages.some((p) => !progress.visited.includes(p.id))
    )
      return;
    setState((s) => ({
      ...s,
      [key]: {
        ...(s[key] ?? emptyLesson()),
        completed: true,
        updatedAt: Date.now(),
      },
    }));
    onComplete(lesson.patternId);
    setCelebrate(true);
  };
  return (
    <div className="lesson-shell course-lesson-shell">
      <header className="lesson-top">
        <button onClick={onExit} aria-label="Exit course lesson">
          <X size={20} />
        </button>
        <span>
          <BookOpen size={17} />
          {course.title}
        </span>
        <div className="lesson-progress">
          {pages.map((p, i) => (
            <i key={p.id} className={i <= pageIndex ? "filled" : ""} />
          ))}
        </div>
        <span className="lesson-step-label">
          {pageIndex + 1} / {pages.length}
        </span>
      </header>
      {celebrate ? (
        <main className="lesson-success">
          <span className="success-medal">
            <Trophy size={43} />
          </span>
          <div className="eyebrow">ONE MORE IDEA YOU UNDERSTAND</div>
          <h1>Look what you can do.</h1>
          <p>
            You finished {lesson.title.toLowerCase()}. You checked a prediction,
            a different case, and a code line. This is a first step—not a claim
            of mastery.
          </p>
          <div className="success-stats">
            <span>
              <Check size={18} />
              Checks completed
            </span>
            <span>✦ +{lesson.xp} lesson XP · awarded once</span>
          </div>
          <button
            className="studio-button"
            onClick={() => (next ? onNext(courseId, next.id) : onExit())}
          >
            {next ? "Try the next lesson" : "Back to the course"}
            <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={onExit}>
            Back to the course outline
          </button>
          <button
            className="text-button"
            onClick={() => {
              setCelebrate(false);
              navigate(0);
            }}
          >
            Revisit this lesson
          </button>
        </main>
      ) : (
        <>
          <div className="course-lesson-layout">
            <aside className="course-rail">
              <button className="text-button" onClick={onExit}>
                <ArrowLeft size={16} />
                Course outline
              </button>
              <span className="eyebrow">
                LESSON {flat.findIndex((l) => l.id === lessonId) + 1} OF{" "}
                {flat.length}
              </span>
              <h3>{lesson.title}</h3>
              <p>Self-paced · {pages.length} sections</p>
              <nav aria-label="Lesson sections">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    className={i === pageIndex ? "current" : ""}
                    disabled={!reached(i)}
                    onClick={() => navigate(i)}
                  >
                    <span>
                      {progress.passed.includes(p.id) || i < pageIndex ? (
                        <Check size={12} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {p.example ? "Worked example" : p.eyebrow}
                  </button>
                ))}
              </nav>
              <div className="outline-note">
                <Lightbulb size={20} />
                <p>
                  Definitions are also available in Sections & help above the
                  page. Revisit any section you have reached.
                </p>
              </div>
            </aside>
            <main className="course-reading" key={page.id}>
              <div className="reading-meta">
                <span className="eyebrow">
                  {page.example
                    ? "LET’S SLOW IT DOWN"
                    : page.eyebrow.toUpperCase()}
                </span>
                <span>
                  {pageIndex + 1} of {pages.length}
                </span>
              </div>
              <details className="lesson-help">
                <summary>Sections & help</summary>
                <nav aria-label="Mobile and desktop lesson sections">
                  {pages.map((p, i) => (
                    <button
                      key={p.id}
                      disabled={!reached(i)}
                      aria-current={pageIndex === i ? "step" : undefined}
                      onClick={(e) => {
                        navigate(i);
                        e.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      {i + 1}. {p.title}
                      {progress.passed.includes(p.id) ? " · checked" : ""}
                    </button>
                  ))}
                </nav>
                <div>
                  <h3>Words on this page</h3>
                  {vocabulary.map((word) => (
                    <p key={word}>{word}</p>
                  ))}
                  <h3>Useful caution</h3>
                  <p>{example.caution}</p>
                </div>
              </details>
              <h1>{page.title}</h1>
              <div className="lesson-goal">
                <strong>What you are doing</strong>
                <p>{page.goal ?? plan.goal}</p>
              </div>
              <div className="course-body">
                {page.body.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
              {page.bullets && (
                <ul className="concept-list">
                  {page.bullets.map((t) => (
                    <li key={t}>
                      <Check size={16} />
                      {t}
                    </li>
                  ))}
                </ul>
              )}
              {page.example && <WorkedExample example={page.example} />}{" "}
              {page.callout && (
                <div className="course-callout">
                  <Lightbulb size={20} />
                  <p>{page.callout.text}</p>
                </div>
              )}
              {page.widget && (
                <div className="curriculum-widget">
                  {page.widget.startsWith("guide-") ? (
                    <GuidedPractice
                      id={lessonId}
                      passed={progress.passed.includes(page.id)}
                      predictionPassed={progress.passed.includes(
                        page.id + "-prediction",
                      )}
                      onPrediction={() => pass(page.id + "-prediction")}
                      onSolved={() => pass()}
                    />
                  ) : null}
                </div>
              )}
              {page.code && (
                <CodeWalkthrough
                  title={page.code.title}
                  lang={page.code.lang}
                  text={page.code.text}
                  expected={plan.expected}
                  maskedLine={
                    progress.passed.includes(page.id)
                      ? undefined
                      : plan.gap.options[plan.gap.answer]
                  }
                />
              )}
              {page.kind === "wrap" && (
                <>
                  <WorkedExample compact example={example} />
                  {lesson.patternId && (
                    <button
                      className="studio-button secondary"
                      onClick={() => onPattern(lesson.patternId!)}
                    >
                      Explore this pattern <ArrowRight size={17} />
                    </button>
                  )}
                </>
              )}
              {page.quiz && (
                <PracticeCheck
                  key={page.id}
                  q={{
                    prompt: page.quiz.prompt,
                    options: page.quiz.options!,
                    answer: page.quiz.answer!,
                    explain: page.quiz.explain,
                  }}
                  hint={plan.hint}
                  label="Check answer"
                  passed={progress.passed.includes(page.id)}
                  onAttempt={(correct) =>
                    onAnswered(lesson.patternId ?? key, correct)
                  }
                  onPass={() => pass()}
                  onReview={() => navigate(pages.findIndex((p) => p.example))}
                />
              )}
              <button
                className="text-button notes-toggle"
                onClick={() => setNotes(!notes)}
              >
                ✎{" "}
                {notes ? "Close my notes" : "Write the idea in your own words"}
              </button>
              {notes && (
                <label className="lesson-notes">
                  Your notes
                  <textarea
                    aria-label="My lesson notes"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="The input is… The output should be… The recipe remembers… Its next move changes… My contrasting test case is…"
                    rows={4}
                  />
                </label>
              )}
            </main>
            <aside className="reading-companion">
              <div className="plain-card">
                <span className="companion-spark">✳</span>
                <span className="eyebrow">IN PLAIN WORDS</span>
                {vocabulary.map((word) => (
                  <p key={word}>{word}</p>
                ))}
              </div>
              <div className="watch-card">
                <strong>A useful caution</strong>
                <p>{example.caution}</p>
              </div>
              <p className="quiet-reassurance">
                You don’t need to remember every line. Understand the move. The
                code will follow.
              </p>
            </aside>
          </div>
          <footer className="lesson-bottom">
            <button
              className="text-button"
              onClick={() =>
                pageIndex > 0 ? navigate(pageIndex - 1) : onExit()
              }
            >
              <ArrowLeft size={16} />
              {pageIndex > 0 ? "Back" : "Course outline"}
            </button>
            <span>
              {(page.quiz || page.required) &&
              !progress.passed.includes(page.id)
                ? "Complete the check on this page to continue."
                : progress.completed
                  ? "Revisiting is free. XP is not awarded twice."
                  : "A little understanding goes a long way."}
            </span>
            {pageIndex < pages.length - 1 ? (
              <button
                className="studio-button"
                disabled={
                  !!(page.quiz || page.required) &&
                  !progress.passed.includes(page.id)
                }
                onClick={() => navigate(pageIndex + 1)}
              >
                Continue
                <ArrowRight size={17} />
              </button>
            ) : progress.completed ? (
              <button
                className="studio-button"
                onClick={() => (next ? onNext(courseId, next.id) : onExit())}
              >
                {next ? "Next lesson" : "Course outline"}
                <ArrowRight size={17} />
              </button>
            ) : (
              <button
                className="studio-button"
                disabled={
                  !allPassed ||
                  pages.some((p) => !progress.visited.includes(p.id))
                }
                onClick={complete}
              >
                Finish lesson
                <Check size={17} />
              </button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}
