import {
  ArrowRight,
  Flame,
  Sparkles,
  Target,
  Check,
  RotateCcw,
  Zap,
  Clock3,
  ChevronRight,
} from "lucide-react";
import { COURSES, flattenLessons } from "../../data/curriculum";
import type { LearningState } from "../../lib/learning";
import CourseArt from "../curriculum/CourseArt";
import { dailyQuests, levelFor } from "../../data/gamification";
import { today, toISO } from "../../lib/srs";
interface Props {
  learned: string[];
  learning: LearningState;
  onCourse: (id: string) => void;
  onCourseLesson: (course: string, lesson: string) => void;
  activeDays: string[];
  xp: number;
  streak: number;
  answered: number;
  sessions: number;
  goal: number;
  due: number;
  name?: string;
  onLesson: (id: string) => void;
  onNavigate: (tab: string) => void;
}
export default function Dashboard(p: Props) {
  const foundations = COURSES[0];
  const recommendation = COURSES.flatMap((c) =>
    flattenLessons(c).map((l) => ({ course: c, lesson: l })),
  ).find(
    ({ course, lesson }) => !p.learning[`${course.id}:${lesson.id}`]?.completed,
  );
  const activeCourse = recommendation?.course ?? foundations;
  const next = recommendation?.lesson ?? flattenLessons(foundations)[0];
  const allDone = !recommendation;
  const completed = Object.values(p.learning).filter((l) => l.completed).length;
  const lev = levelFor(p.xp);
  const quests = dailyQuests({
    answered: p.answered,
    sessions: p.sessions,
    goal: p.goal,
  });
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return (
    <div className="dashboard studio-page">
      <div className="dashboard-title">
        <div>
          <div className="eyebrow">YOUR DAILY DOSE OF DISCOVERY</div>
          <h1>
            {p.name
              ? `Welcome back, ${p.name.split(" ")[0]}.`
              : "Big ideas. Small steps."}
          </h1>
          <p className="page-intro">
            A few minutes today. A new way of thinking tomorrow.
          </p>
        </div>
        <span className="date-chip">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="home-columns">
        <div className="home-primary">
          <section className="continue-card">
            <div className="continue-copy">
              <span className="eyebrow">
                <span className="live-dot" />{" "}
                {p.learned.length
                  ? "KEEP YOUR MOMENTUM"
                  : "YOUR JOURNEY STARTS HERE"}
              </span>
              <h2>{allDone ? "All courses checked" : next.title}</h2>
              <p>
                {allDone
                  ? "Choose a course to review, or explore a pattern lesson."
                  : next.subtitle}
              </p>
              <div className="continue-meta">
                <Clock3 size={15} /> Self-paced <span>·</span> Interactive
                lesson
              </div>
              <button
                className="studio-button"
                onClick={() =>
                  allDone
                    ? p.onNavigate("courses")
                    : p.onCourseLesson(activeCourse.id, next.id)
                }
              >
                {allDone
                  ? "Choose a course to review"
                  : completed
                    ? "Continue learning"
                    : "Let’s get started"}
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="continue-art">
              <CourseArt id={activeCourse.id} />
              <span className="art-caption">
                NO SHORTCUTS. JUST MOMENTS THAT CLICK.
              </span>
            </div>
          </section>
          <div className="section-heading">
            <h2>Your learning paths</h2>
            <button onClick={() => p.onNavigate("courses")}>
              View all courses <ArrowRight size={16} />
            </button>
          </div>
          <div className="home-track-grid">
            {[
              COURSES[0],
              COURSES[1],
              COURSES.find((c) => c.id === "pixel-pusher")!,
            ].map((c, i) => {
              const lessons = flattenLessons(c),
                done = lessons.filter(
                  (l) => p.learning[`${c.id}:${l.id}`]?.completed,
                ).length;
              return (
                <button
                  className={`track-card tone-${i}`}
                  key={c.id}
                  onClick={() => p.onCourse(c.id)}
                >
                  <div className="track-image">
                    <CourseArt id={c.id} />
                    <span className="track-level">
                      {c.id === "pixel-pusher" ? "Creative coding" : "Beginner"}
                    </span>
                  </div>
                  <div className="track-copy">
                    <h3>{c.title}</h3>
                    <p>{lessons.length} step-by-step lessons</p>
                    <div className="thin-progress">
                      <i
                        style={{ width: `${(done / lessons.length) * 100}%` }}
                      />
                    </div>
                    <div className="track-meta">
                      <span>
                        {done
                          ? `${done} of ${lessons.length} complete`
                          : "Start with a little curiosity"}
                      </span>
                      <ChevronRight size={17} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <section className="practice-banner">
            <div className="practice-symbol">
              <RotateCcw size={26} />
            </div>
            <div>
              <h3>A little practice makes it stick.</h3>
              <p>
                {p.due
                  ? `${p.due} patterns are ready for a refresh.`
                  : "Build your recall with a quick, five-question review."}
              </p>
            </div>
            <button
              className="studio-button secondary"
              onClick={() => p.onNavigate("progress")}
            >
              Daily review <ArrowRight size={17} />
            </button>
          </section>
          <section className="discovery-note">
            <Sparkles size={21} />
            <div>
              <h3>Understanding beats memorizing.</h3>
              <p>
                Play with an algorithm, make a prediction, then see what
                happens. That’s how an idea becomes yours.
              </p>
            </div>
            <button
              onClick={() => p.onNavigate("visualize")}
              aria-label="Explore visualizers"
            >
              <ArrowRight size={20} />
            </button>
          </section>
        </div>
        <aside className="home-aside">
          <section className="daily-card">
            <div className="section-heading">
              <h3>Your daily rhythm</h3>
              <Flame size={21} className="orange-icon" />
            </div>
            <div className="streak-number">
              {p.streak}
              <span>day streak</span>
            </div>
            <p>
              {p.streak
                ? "Keep the curiosity going."
                : "Your next streak starts today."}
            </p>
            <div className="week-circles">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const iso = toISO(d);
                const active = p.activeDays.includes(iso);
                return (
                  <div key={i}>
                    <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                    <i
                      className={`${active ? "active" : ""} ${iso === today() ? "is-today" : ""}`}
                      aria-label={`${iso}: ${active ? "active" : "not active"}`}
                    >
                      {active ? (
                        <Check size={14} />
                      ) : iso === today() ? (
                        <span className="little-dot" />
                      ) : null}
                    </i>
                  </div>
                );
              })}
            </div>
            <div className="daily-divider" />
            <div className="goal-heading">
              <span>
                <Target size={17} /> Daily goal
              </span>
              <strong>
                {Math.min(p.answered, p.goal)}/{p.goal}
              </strong>
            </div>
            <div className="thin-progress">
              <i
                style={{ width: `${Math.min(p.answered / p.goal, 1) * 100}%` }}
              />
            </div>
            <small>
              {p.answered >= p.goal
                ? "Goal complete. Nicely done!"
                : "Answer a few questions to build your habit."}
            </small>
          </section>
          <section className="quest-card">
            <div className="section-heading">
              <h3>Today’s little wins</h3>
              <Zap size={19} />
            </div>
            {quests.map((q) => (
              <div className="quest-row" key={q.id}>
                <span className={`quest-check ${q.done ? "done" : ""}`}>
                  {q.done ? <Check size={14} /> : null}
                </span>
                <div>
                  <strong>{q.label}</strong>
                  <small>
                    {q.progress}/{q.target} completed
                  </small>
                </div>
                <span className="xp-label">+{q.xp}</span>
              </div>
            ))}
          </section>
          <section className="level-card">
            <span className="level-medal">✦</span>
            <div>
              <small>LEVEL {lev.level.n}</small>
              <h3>{lev.level.title}</h3>
              <p>{p.xp} XP earned</p>
            </div>
            <div className="thin-progress">
              <i style={{ width: `${lev.pct}%` }} />
            </div>
            <small>
              {lev.next
                ? `${lev.remaining} XP to ${lev.next.title}`
                : "You’ve reached the top level."}
            </small>
          </section>
          <div className="aside-tip">
            <span>✳</span>
            <p>“The best way to learn an idea is to discover it yourself.”</p>
            <small>THE ALGOCOACH WAY</small>
          </div>
        </aside>
      </div>
    </div>
  );
}
