import { useState } from "react";
import { ArrowRight, Search, Clock3, Check, BookOpen } from "lucide-react";
import { COURSES, flattenLessons, type Course } from "../../data/curriculum";
import type { LearningState } from "../../lib/learning";
import CourseArt from "./CourseArt";
export const levelForCourse = (c: Course) =>
  ["foundations", "arrays", "pixel-pusher"].includes(c.id)
    ? "Beginner"
    : c.id === "recursion-dp"
      ? "Advanced"
      : "Intermediate";
export default function CourseCatalog({
  state,
  onCourse,
  onPattern,
}: {
  state: LearningState;
  onCourse: (id: string) => void;
  onPattern: () => void;
}) {
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All courses");
  const visible = COURSES.filter(
    (c) =>
      (filter === "All courses" || levelForCourse(c) === filter) &&
      (
        c.title +
        " " +
        c.tagline +
        " " +
        flattenLessons(c)
          .map((l) => l.title)
          .join(" ")
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const pixels = COURSES.find((c) => c.id === "pixel-pusher")!;
  return (
    <div className="studio-page new-catalog">
      <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
      <h1>There’s a way into every idea.</h1>
      <p className="page-intro">
        Start with a tiny example. Experiment. Build the confidence to solve
        something bigger.
      </p>
      <section className="catalog-feature">
        <div>
          <span className="feature-label">NEW · CREATIVE CODING</span>
          <h2>
            What if you could
            <br />
            see a function?
          </h2>
          <p>
            Turn colors into numbers, numbers into code, and code into a
            picture. Learn functions one pixel at a time.
          </p>
          <button className="studio-button" onClick={() => onCourse(pixels.id)}>
            Explore the image lab
            <ArrowRight size={17} />
          </button>
          <small>
            No coding experience needed · {flattenLessons(pixels).length}{" "}
            lessons
          </small>
        </div>
        <div>
          <CourseArt id="pixel-pusher" />
        </div>
      </section>
      <div className="catalog-tools">
        <div className="filter-pills" aria-label="Course difficulty filters">
          {["All courses", "Beginner", "Intermediate", "Advanced"].map((t) => (
            <button
              key={t}
              className={filter === t ? "selected" : ""}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <Search size={17} />
          <input
            aria-label="Search courses"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you curious about?"
          />
        </label>
      </div>
      <div className="section-heading">
        <h2>{query ? "Your search results" : "Find your next “aha!”"}</h2>
        <span>
          {visible.length} courses ·{" "}
          {visible.reduce((n, c) => n + flattenLessons(c).length, 0)} lessons
        </span>
      </div>
      <div className="full-course-grid">
        {visible.map((c) => {
          const lessons = flattenLessons(c),
            done = lessons.filter(
              (l) => state[`${c.id}:${l.id}`]?.completed,
            ).length;
          return (
            <button
              className={`full-course-card course-${c.id}`}
              key={c.id}
              onClick={() => onCourse(c.id)}
            >
              <div className="course-cover">
                <span className="track-level">{levelForCourse(c)}</span>
                <CourseArt id={c.id} />
              </div>
              <div className="course-card-copy">
                <span className="eyebrow">
                  {c.id === "pixel-pusher"
                    ? "CODE YOU CAN SEE"
                    : c.id === "foundations"
                      ? "YOUR FIRST STEP"
                      : "GROW YOUR TOOLKIT"}
                </span>
                <h3>{c.title}</h3>
                <p>{c.tagline}</p>
                <div className="course-facts">
                  <span>
                    <BookOpen size={13} />
                    {lessons.length} lessons
                  </span>
                  <span>
                    <Clock3 size={13} />
                    Self-paced
                  </span>
                </div>
                <div className="thin-progress">
                  <i style={{ width: `${(done / lessons.length) * 100}%` }} />
                </div>
                <div className="course-card-bottom">
                  <span>
                    {done === 0
                      ? "Start small. Go far."
                      : `${done} of ${lessons.length} complete`}
                  </span>
                  {done === lessons.length ? (
                    <Check size={17} />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!visible.length && (
        <div className="empty-state">
          <Search size={25} />
          <h3>No courses found</h3>
          <p>Try a broader phrase or another level.</p>
          <button
            className="studio-button secondary"
            onClick={() => {
              setQuery("");
              setFilter("All courses");
            }}
          >
            Reset search
          </button>
        </div>
      )}
      <section className="catalog-reference">
        <div>
          <h3>Know the pattern you’re looking for?</h3>
          <p>Explore 19 patterns through hands-on labs and worked examples.</p>
        </div>
        <button className="studio-button secondary" onClick={onPattern}>
          Explore pattern lessons
          <ArrowRight size={17} />
        </button>
      </section>
    </div>
  );
}
