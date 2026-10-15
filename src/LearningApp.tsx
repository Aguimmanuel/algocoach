import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  Map,
  Play,
  ShieldQuestion,
  ArrowUpRight,
  Flame,
  Zap,
  Menu,
  X,
  UserRound,
  Search,
  ChevronRight,
  ChartNoAxesCombined,
} from "lucide-react";
const Coach = lazy(() => import("./components/Coach"));
const Library = lazy(() => import("./components/Library"));
const Visualizer = lazy(() => import("./components/Visualizer"));
const CheatSheet = lazy(() => import("./components/CheatSheet"));
const StartHere = lazy(() => import("./components/StartHere"));
const ProgressHome = lazy(() => import("./components/ProgressHome"));
const LearningPath = lazy(() => import("./components/LearningPath"));

import Dashboard from "./components/studio/Dashboard";
import {
  COURSES,
  getCourse,
  getLesson,
  flattenLessons,
} from "./data/curriculum";
import { useLearningSync } from "./hooks/useLearningSync";
import type { LearningState } from "./lib/learning";
const CourseCatalog = lazy(
  () => import("./components/curriculum/CourseCatalog"),
);
const CourseOutline = lazy(
  () => import("./components/curriculum/CourseOutline"),
);
const CourseLesson = lazy(() => import("./components/curriculum/CourseLesson"));
const GuidedLesson = lazy(() => import("./components/studio/GuidedLesson"));
import AuthPanel from "./components/AuthPanel";
import type { MeResponse } from "./lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { Toaster } from "./components/ui/sonner";
import { PATTERNS, PATTERN_MAP } from "./data/patterns";
import { computeXP, dailyQuests, levelFor, XP } from "./data/gamification";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAccount } from "./hooks/useAccount";
import {
  dueCards,
  dueCount,
  review as srsReview,
  today as isoToday,
  type Deck,
} from "./lib/srs";
import {
  EMPTY_TODAY_LOG,
  localStreak,
  readToday,
  todayKey,
  type TodayLog,
} from "./lib/activity";
import Confetti from "./components/Confetti";
import { toast } from "sonner";

type Tab =
  | "today"
  | "courses"
  | "path"
  | "library"
  | "coach"
  | "visualize"
  | "cheat"
  | "progress";

/** Order matters: what to do now, then where you are, then reference. */
const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "today", label: "My learning", icon: LayoutGrid },
  { id: "courses", label: "Explore courses", icon: BookOpen },
  { id: "path", label: "Learning path", icon: Map },
  { id: "visualize", label: "Algorithm playground", icon: Play },
  { id: "coach", label: "Problem coach", icon: GraduationCap },
  { id: "library", label: "Pattern library", icon: ListChecks },
  { id: "cheat", label: "Quick reference", icon: ShieldQuestion },
  { id: "progress", label: "My progress", icon: ChartNoAxesCombined },
];
function readRoute() {
  const raw = window.location.hash.slice(1).split("/");
  return {
    tab: TABS.some((t) => t.id === raw[0]) ? (raw[0] as Tab) : ("today" as Tab),
    lesson: raw[0] === "lesson" && PATTERN_MAP[raw[1]] ? raw[1] : null,
    course: raw[0] === "course" && getCourse(raw[1]) ? raw[1] : null,
    courseLesson:
      raw[0] === "learn" && getLesson(raw[1], raw[2])
        ? { course: raw[1], lesson: raw[2] }
        : null,
  };
}

export default function LearningApp({
  initialMe,
  onSignedOut,
}: {
  initialMe: MeResponse;
  onSignedOut: () => void;
}) {
  const [tab, setTabState] = useState<Tab>(() => readRoute().tab);
  const [lesson, setLesson] = useState<string | null>(() => readRoute().lesson);
  const [course, setCourse] = useState<string | null>(() => readRoute().course);
  const [courseLesson, setCourseLesson] = useState<{
    course: string;
    lesson: string;
  } | null>(() => readRoute().courseLesson);
  const [learning, setLearning] = useLocalStorage<LearningState>(
    "algocoach-learning",
    {},
  );
  const openCourse = useCallback((id: string) => {
    window.location.hash = `course/${id}`;
    setCourse(id);
    setTabState("courses");
    setCourseLesson(null);
    setLesson(null);
    window.scrollTo(0, 0);
  }, []);
  const openCourseLesson = useCallback((c: string, l: string) => {
    window.location.hash = `learn/${c}/${l}`;
    setCourseLesson({ course: c, lesson: l });
    setCourse(null);
    setTabState("courses");
    setLesson(null);
    window.scrollTo(0, 0);
  }, []);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const setTab = useCallback((t: Tab) => {
    window.location.hash = t;
    setTabState(t);
    setLesson(null);
    setCourse(null);
    setCourseLesson(null);
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, []);
  const openLesson = useCallback((id: string) => {
    window.location.hash = `lesson/${id}`;
    setLesson(id);
    setCourse(null);
    setCourseLesson(null);
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    const change = () => {
      const r = readRoute();
      setTabState(r.tab);
      setLesson(r.lesson);
      setCourse(r.course);
      setCourseLesson(r.courseLesson);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  /** XP won inside the current review session, for the running toast */
  const sessionXp = useRef(0);
  const [libraryId, setLibraryId] = useState<string | undefined>();
  /** the algorithm the Visualize tab should open on */
  const [visualizeId, setVisualizeId] = useState<string | undefined>();

  const [learned, setLearned] = useLocalStorage<string[]>(
    "algocoach-learned",
    [],
  );
  const [solved] = useLocalStorage<string[]>("algocoach-solved", []);
  const [shaky, setShaky] = useLocalStorage<string[]>("algocoach-shaky", []);
  const [deck, setDeck] = useLocalStorage<Deck>("algocoach-deck", {});
  const [activeDays, setActiveDays] = useLocalStorage<string[]>(
    "algocoach-active-days",
    [],
  );
  const [answers, setAnswers] = useLocalStorage<Record<string, number>>(
    "algocoach-answers",
    {},
  );
  const [sessions, setSessions] = useLocalStorage<number>(
    "algocoach-sessions",
    0,
  );
  /** today only — resets itself when the date rolls over */
  const [todayLog, setTodayLog] = useLocalStorage<TodayLog>(
    "algocoach-today",
    EMPTY_TODAY_LOG,
  );
  /** XP paid out by completed quests, which is why it cannot be derived */
  const [questXp, setQuestXp] = useLocalStorage<number>(
    "algocoach-quest-xp",
    0,
  );

  const progress = useMemo(
    () => ({ learned, solved, shaky }),
    [learned, solved, shaky],
  );
  const account = useAccount(progress, initialMe, onSignedOut);
  useLearningSync(account.user?.id, learning, setLearning);

  const { answered: answeredToday, sessions: sessionsToday } =
    readToday(todayLog);

  /** Roll the day over on first write, then add to it. */
  const bumpToday = useCallback(
    (patch: { answered?: number; sessions?: number }) => {
      setTodayLog((log) => {
        const now = todayKey();
        const base =
          log.date === now
            ? log
            : { date: now, answered: 0, sessions: 0, claimed: [] };
        return {
          ...base,
          answered: base.answered + (patch.answered ?? 0),
          sessions: base.sessions + (patch.sessions ?? 0),
        };
      });
    },
    [setTodayLog],
  );

  /** Anything the learner does today counts towards the streak and the heatmap. */
  const markActive = useCallback(() => {
    const now = isoToday();
    setActiveDays((days) => (days.includes(now) ? days : [...days, now]));
  }, [setActiveDays]);

  const toggleLearned = useCallback(
    (id: string) => {
      setLearned((l) => {
        const adding = !l.includes(id);
        account.track(adding ? "learned" : "unlearned", { pattern: id });
        if (adding) {
          markActive();
          // Meeting a pattern for the first time puts it in the review deck.
          setDeck((d) =>
            d[id]
              ? d
              : {
                  ...d,
                  [id]: { interval: 1, ease: 2.5, due: isoToday(), reps: 0 },
                },
          );
        }
        return adding ? [...l, id] : l.filter((x) => x !== id);
      });
    },
    [setLearned, setDeck, markActive, account],
  );

  const markShaky = useCallback(
    (key: string) => setShaky((s) => (s.includes(key) ? s : [...s, key])),
    [setShaky],
  );

  /** A review answer: update the schedule and the running total. */
  const onAnswered = useCallback(
    (patternId: string, correct: boolean) => {
      markActive();
      if (PATTERN_MAP[patternId])
        setDeck((d) => {
          const card = d[patternId] ?? {
            interval: 1,
            ease: 2.5,
            due: isoToday(),
            reps: 0,
          };
          return { ...d, [patternId]: srsReview(card, correct) };
        });
      if (correct)
        setAnswers((a) => ({ ...a, [patternId]: (a[patternId] ?? 0) + 1 }));
      bumpToday({ answered: 1 });
      if (correct) {
        // One toast that keeps a running total, rather than five that stack up.
        const won = (sessionXp.current += XP.correct);
        toast(`+${won} XP`, {
          id: "xp-gain",
          description: "this session",
          duration: 1800,
        });
      }
      account.track("quiz", { pattern: patternId, correct });
    },
    [setDeck, setAnswers, markActive, account, bumpToday],
  );

  const onSessionComplete = useCallback(
    (score: number, total: number) => {
      setSessions((s) => s + 1);
      bumpToday({ sessions: 1 });
      sessionXp.current = 0;
      markActive();
      account.track("review_session", { score, total });
    },
    [setSessions, markActive, account, bumpToday],
  );

  const openInLibrary = useCallback((id: string) => {
    setLibraryId(id);
    setTab("library");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openInVisualizer = useCallback((id: string) => {
    setVisualizeId(id);
    setTab("visualize");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const correctAnswers = useMemo(
    () => Object.values(answers).reduce((a, b) => a + b, 0),
    [answers],
  );
  const xp =
    computeXP({
      learned: learned.length,
      solved: solved.length,
      correctAnswers,
      sessions,
    }) +
    questXp +
    COURSES.reduce(
      (n, c) =>
        n +
        flattenLessons(c).reduce(
          (sum, l) => sum + (learning[`${c.id}:${l.id}`]?.completed ? l.xp : 0),
          0,
        ),
      0,
    );

  const goal = account.today.goal || 3;
  const level = levelFor(xp).level;

  /**
   * Quests pay out the moment they are done.
   *
   * The XP is added to the real total the levels read, and claimed ids are
   * remembered for the day, so refreshing the page cannot pay twice.
   */
  useEffect(() => {
    const done = dailyQuests({
      answered: answeredToday,
      sessions: sessionsToday,
      goal,
    }).filter(
      (q) =>
        q.done &&
        !(todayLog.date === todayKey() ? todayLog.claimed : []).includes(q.id),
    );
    if (!done.length) return;

    const now = todayKey();
    let rewards: typeof done = [];
    // The storage hook resolves functional updates synchronously, outside render.
    // Re-read the current claims so StrictMode cannot award the same quest twice.
    setTodayLog((log) => {
      const base =
        log.date === now
          ? log
          : { date: now, answered: 0, sessions: 0, claimed: [] };
      rewards = done.filter((q) => !base.claimed.includes(q.id));
      return rewards.length
        ? { ...base, claimed: [...base.claimed, ...rewards.map((q) => q.id)] }
        : base;
    });
    if (!rewards.length) return;
    setQuestXp((x) => x + rewards.reduce((sum, q) => sum + q.xp, 0));
    for (const q of rewards) {
      toast.success(`Quest complete · +${q.xp} XP`, {
        id: `quest-${q.id}`,
        description: q.label,
      });
    }
  }, [
    answeredToday,
    sessionsToday,
    goal,
    todayLog.claimed,
    setTodayLog,
    setQuestXp,
  ]);

  /* A level is worth a small fuss — it is the one number that only ever goes up. */
  const [burst, setBurst] = useState(0);
  const seenLevel = useRef(level.n);
  useEffect(() => {
    if (level.n > seenLevel.current) {
      toast.success(`Level ${level.n} · ${level.title}`, {
        id: "level-up",
        description:
          "Every pattern you learn from here is worth more than the last.",
      });
      setBurst((b) => b + 1);
    }
    seenLevel.current = level.n;
  }, [level.n, level.title]);

  const due = useMemo(
    () =>
      dueCards(deck, 8)
        .map((id) => PATTERN_MAP[id]?.id)
        .filter(Boolean) as string[],
    [deck],
  );
  const pending = useMemo(() => dueCount(deck), [deck]);

  /**
   * The streak the learner should see.
   *
   * Combine authenticated activity with this account’s device-local practice
   * days, including work completed while the network was unavailable.
   */
  const effectiveStreak = useMemo(() => {
    const local = localStreak(activeDays);
    return {
      current: Math.max(account.streak.current, local.current),
      longest: Math.max(account.streak.longest, local.longest),
    };
  }, [activeDays, account.streak]);

  const completeLesson = (id: string) => {
    if (!learned.includes(id)) toggleLearned(id);
  };
  if (courseLesson)
    return (
      <>
        <Suspense
          fallback={
            <div className="loading-classroom">Opening your lesson…</div>
          }
        >
          <CourseLesson
            key={`${courseLesson.course}:${courseLesson.lesson}`}
            courseId={courseLesson.course}
            lessonId={courseLesson.lesson}
            onExit={() => openCourse(courseLesson.course)}
            onNext={openCourseLesson}
            onPattern={openLesson}
            onComplete={(pattern) => {
              if (pattern && !learned.includes(pattern)) toggleLearned(pattern);
              markActive();
              account.track("course_completed", {
                course: courseLesson.course,
                lesson: courseLesson.lesson,
              });
            }}
            onAnswered={onAnswered}
          />
        </Suspense>
        <Toaster position="bottom-right" />
      </>
    );
  if (lesson)
    return (
      <>
        <Suspense
          fallback={
            <div className="loading-classroom" role="status">
              Opening your lesson…
            </div>
          }
        >
          <GuidedLesson
            key={lesson}
            id={lesson}
            learned={learned.includes(lesson)}
            onExit={() => setTab("today")}
            onComplete={completeLesson}
            onAnswered={onAnswered}
            onNext={openLesson}
          />
        </Suspense>
        <Toaster position="bottom-right" />
      </>
    );
  const current = TABS.find((t) => t.id === (course ? "courses" : tab))!;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`app-sidebar ${mobileOpen ? "open" : ""}`}>
        <button className="brand" onClick={() => setTab("today")}>
          <span className="brand-mark">
            a<span>✳</span>
          </span>
          <span>
            algocoach<span className="brand-period">.</span>
          </span>
        </button>
        <div className="sidebar-caption">LEARN SOMETHING NEW</div>
        <nav aria-label="Main navigation">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""} ${i === 3 ? "nav-separated" : ""}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <t.icon size={19} />
              <span>{t.label}</span>
              {t.id === "today" && pending > 0 && (
                <span className="nav-counter">{pending}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar encouragement">
            <span>✳</span>
            <h3>
              A little every day.
              <br />A lot over time.
            </h3>
            <p>Your next “aha!” is waiting.</p>
            <button
              onClick={() =>
                openLesson(
                  (PATTERNS.find((p) => !learned.includes(p.id)) ?? PATTERNS[0])
                    .id,
                )
              }
            >
              Find your next idea <ArrowUpRight size={16} />
            </button>
          </div>
          <button className="sidebar-profile" onClick={() => setAuthOpen(true)}>
            <span className="profile-avatar">
              {account.user?.display_name?.[0]?.toUpperCase() ?? (
                <UserRound size={18} />
              )}
            </span>
            <span>
              <strong>
                {account.user?.display_name ?? "Your learning space"}
              </strong>
              <small>
                {account.user
                  ? "Account settings"
                  : "Sign in to save across devices"}
              </small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span className="breadcrumb-label">Your classroom</span>
            <ChevronRight size={13} />
            <strong>{current.label}</strong>
          </div>
          <div className="header-stats">
            <button
              className="header-search"
              onClick={() => setTab("courses")}
              aria-label="Find a course"
            >
              <Search size={18} />
            </button>
            <span className="header-streak">
              <Flame size={18} /> {effectiveStreak.current}
              <span className="header-stat-text"> day streak</span>
            </span>
            <span className="header-xp">
              <Zap size={17} /> {xp} XP
            </span>
            <button
              className="header-avatar"
              onClick={() => setAuthOpen(true)}
              aria-label="Open account"
            >
              {account.user?.display_name?.[0]?.toUpperCase() ?? (
                <UserRound size={18} />
              )}
            </button>
          </div>
        </header>
        <main
          id="main-content"
          className={`app-main ${tab === "today" || tab === "courses" ? "" : "legacy-main"}`}
        >
          <Suspense
            fallback={
              <div className="loading-classroom" role="status">
                Getting your classroom ready…
              </div>
            }
          >
            {course && (
              <CourseOutline
                id={course}
                state={learning}
                onBack={() => setTab("courses")}
                onLesson={openCourseLesson}
                onCourse={openCourse}
              />
            )}
            {!course && tab === "today" && (
              <Dashboard
                learned={learned}
                activeDays={activeDays}
                xp={xp}
                streak={effectiveStreak.current}
                answered={answeredToday}
                sessions={sessionsToday}
                goal={goal}
                due={pending}
                name={account.user?.display_name}
                learning={learning}
                onCourse={openCourse}
                onCourseLesson={openCourseLesson}
                onLesson={openLesson}
                onNavigate={(t) => setTab(t as Tab)}
              />
            )}
            {!course && tab === "courses" && (
              <CourseCatalog
                state={learning}
                onCourse={openCourse}
                onPattern={() => setTab("library")}
              />
            )}
            {!course && tab !== "today" && tab !== "courses" && (
              <div className="workspace-heading">
                <div className="eyebrow">YOUR ALGORITHM TOOLKIT</div>
                <h1>{current.label}</h1>
                <p className="page-intro">
                  {
                    (
                      {
                        path: "A guided route from first principles to powerful ideas.",
                        library:
                          "All 19 patterns, thoughtfully explained and ready to practice.",
                        coach:
                          "Bring a problem. Discover a way to think about it.",
                        visualize:
                          "Make a prediction. Take a step. See the algorithm come alive.",
                        cheat:
                          "The right clue, complexity, or pattern—just when you need it.",
                        progress:
                          "Your effort adds up. See how far you’ve come.",
                      } as Record<string, string>
                    )[tab]
                  }
                </p>
              </div>
            )}
            {tab === "progress" && (
              <ProgressHome
                learned={learned}
                solved={solved}
                activeDays={activeDays}
                duePatternIds={due}
                dueCount={pending}
                xp={xp}
                sessions={sessions}
                answeredToday={answeredToday}
                sessionsToday={sessionsToday}
                goal={goal}
                user={account.user}
                streak={effectiveStreak}
                busy={account.busy}
                error={account.error}
                onSignOut={account.signOut}
                onClearError={account.clearError}
                onOpenPattern={openLesson}
                onShaky={markShaky}
                onAnswered={onAnswered}
                onSessionComplete={onSessionComplete}
              />
            )}

            {tab === "path" && (
              /* The basics fold into one row so the trail is the first thing you see. */
              <div className="space-y-6">
                <StartHere />
                <LearningPath
                  learned={learned}
                  solved={solved}
                  onOpenPattern={openLesson}
                />
              </div>
            )}

            {tab === "coach" && (
              <Coach
                learned={learned}
                onToggleLearned={toggleLearned}
                onVisualize={openInVisualizer}
              />
            )}
            {tab === "library" && (
              <Library
                learned={learned}
                onToggleLearned={toggleLearned}
                onVisualize={openInVisualizer}
                initialId={libraryId}
              />
            )}
            {tab === "visualize" && (
              <Visualizer
                onOpenPattern={openInLibrary}
                initialId={visualizeId}
              />
            )}
            {tab === "cheat" && <CheatSheet onOpenPattern={openInLibrary} />}
          </Suspense>
        </main>

        <footer className="app-footer">
          <span>Made for curious minds.</span>
          <span>
            One idea at a time. <span className="footer-spark">✳</span>
          </span>
        </footer>
      </div>
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your learning space</DialogTitle>
            <DialogDescription>
              Keep your algorithm journey going, on any device.
            </DialogDescription>
          </DialogHeader>
          <AuthPanel
            user={account.user}
            busy={account.busy}
            error={account.error}
            onSignOut={account.signOut}
            onClearError={account.clearError}
          />
        </DialogContent>
      </Dialog>

      {burst > 0 && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
          <Confetti fire={burst} />
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}
