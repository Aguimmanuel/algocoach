import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  BookOpen,
  Play,
} from "lucide-react";
import { getCourse, flattenLessons } from "../../data/curriculum";
import type { LearningState } from "../../lib/learning";
import CourseArt from "./CourseArt";
import { GUIDANCE } from "../../data/teaching";
import { levelForCourse } from "./CourseCatalog";
export default function CourseOutline({
  id,
  state,
  onBack,
  onLesson,
  onCourse,
}: {
  id: string;
  state: LearningState;
  onBack: () => void;
  onLesson: (course: string, lesson: string) => void;
  onCourse: (id: string) => void;
}) {
  const course = getCourse(id)!;
  const flat = flattenLessons(course),
    completed = flat.filter((l) => state[`${id}:${l.id}`]?.completed).length;
  const guidance = GUIDANCE[id];
  const finished = completed === flat.length;
  const next = flat.find((l) => !state[`${id}:${l.id}`]?.completed) ?? flat[0];
  return (
    <div className="studio-page course-outline">
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={16} />
        All courses
      </button>
      <section className={`outline-hero course-${id}`}>
        <div>
          <span className="eyebrow">
            {levelForCourse(course).toUpperCase()} · HANDS-ON LEARNING
          </span>
          <h1>{course.title}</h1>
          {finished && (
            <p className="course-finished">
              <Check size={18} />
              Course completed · {completed} of {flat.length} lessons checked
            </p>
          )}
          <p>{course.description}</p>
          <div className="course-facts">
            <span>
              <BookOpen size={15} />
              {flat.length} lessons
            </span>
            <span>
              <Clock3 size={15} />
              At your own pace
            </span>
          </div>
          <button
            className="studio-button"
            onClick={() => onLesson(id, next.id)}
          >
            {finished
              ? "Review from the beginning"
              : completed
                ? "Continue learning"
                : "Start the first lesson"}
            <ArrowRight size={17} />
          </button>
        </div>
        <CourseArt id={id} />
      </section>
      <section className="course-readiness">
        <h2>{finished ? "What next?" : "Before you begin"}</h2>
        <p>{finished ? guidance.why : guidance.prerequisites}</p>
        {!finished && guidance.prior && (
          <button
            className="text-button"
            onClick={() => onCourse(guidance.prior!)}
          >
            Open the recommended preparation: {getCourse(guidance.prior)?.title}
            <ArrowRight size={16} />
          </button>
        )}
        {finished && guidance.next && (
          <button
            className="studio-button"
            onClick={() => onCourse(guidance.next!)}
          >
            Next course: {getCourse(guidance.next)?.title}
            <ArrowRight size={16} />
          </button>
        )}
        {finished && !guidance.next && (
          <button className="studio-button" onClick={onBack}>
            Choose another course
          </button>
        )}
      </section>
      <div className="outline-columns">
        <div className="unit-list">
          <div className="section-heading">
            <h2>Your path through this course</h2>
            <span>
              {completed}/{flat.length} complete
            </span>
          </div>
          {course.units.map((u, i) => (
            <section className="course-unit" key={u.id}>
              <header>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{u.title.replace(/Unit \d+ · /, "")}</h3>
                  <p>{u.blurb}</p>
                </div>
              </header>
              <ol>
                {u.lessons.map((l) => {
                  const p = state[`${id}:${l.id}`];
                  return (
                    <li key={l.id}>
                      <button onClick={() => onLesson(id, l.id)}>
                        <span
                          className={`outline-lesson-icon ${p?.completed ? "done" : ""}`}
                        >
                          {p?.completed ? (
                            <Check size={18} />
                          ) : (
                            <Play size={16} />
                          )}
                        </span>
                        <span>
                          <strong>{l.title}</strong>
                          <small>{l.subtitle}</small>
                        </span>
                        <span className="outline-duration">
                          {l.pages.length} steps
                        </span>
                        <ArrowRight size={17} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
        <aside>
          <section className="outcomes-card">
            <span className="eyebrow">BY THE END, YOU’LL BE ABLE TO…</span>
            {course.outcomes.map((t) => (
              <p key={t}>
                <Check size={16} />
                {t}
              </p>
            ))}
          </section>
          <section className="beginner-promise">
            <span>✳</span>
            <h3>You’re allowed to be a beginner.</h3>
            <p>
              Each lesson includes a consistent example, a prediction, a
              narrated trace, a different-case check, and a complete code
              example. Hints and worked recovery are available; no lives or
              penalties.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
