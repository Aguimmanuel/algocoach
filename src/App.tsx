import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, GraduationCap, LayoutGrid, ListChecks, Map, Play, ShieldQuestion } from "lucide-react";
import Coach from "./components/Coach";
import Library from "./components/Library";
import Visualizer from "./components/Visualizer";
import CheatSheet from "./components/CheatSheet";
import StartHere from "./components/StartHere";
import ProgressHome from "./components/ProgressHome";
import LearningPath from "./components/LearningPath";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";

import { Tabs, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Toaster } from "./components/ui/sonner";
import { PATTERNS, PATTERN_MAP } from "./data/patterns";
import { computeXP, dailyQuests, levelFor, XP } from "./data/gamification";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAccount } from "./hooks/useAccount";
import { dueCards, dueCount, review as srsReview, today as isoToday, type Deck } from "./lib/srs";
import { EMPTY_TODAY_LOG, localStreak, readToday, todayKey, type TodayLog } from "./lib/activity";
import Confetti from "./components/Confetti";
import { toast } from "sonner";

type Tab = "today" | "path" | "library" | "coach" | "visualize" | "cheat";

/** Order matters: what to do now, then where you are, then reference. */
const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "today", label: "Today", icon: LayoutGrid },
  { id: "path", label: "Path", icon: Map },
  { id: "library", label: "Patterns", icon: BookOpen },
  { id: "coach", label: "Coach", icon: GraduationCap },
  { id: "visualize", label: "Visualize", icon: Play },
  { id: "cheat", label: "Cheat Sheet", icon: ListChecks },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("today");
  /** XP won inside the current review session, for the running toast */
  const sessionXp = useRef(0);
  const [libraryId, setLibraryId] = useState<string | undefined>();
  /** the algorithm the Visualize tab should open on */
  const [visualizeId, setVisualizeId] = useState<string | undefined>();

  const [learned, setLearned] = useLocalStorage<string[]>("algocoach-learned", []);
  const [solved] = useLocalStorage<string[]>("algocoach-solved", []);
  const [shaky, setShaky] = useLocalStorage<string[]>("algocoach-shaky", []);
  const [deck, setDeck] = useLocalStorage<Deck>("algocoach-deck", {});
  const [activeDays, setActiveDays] = useLocalStorage<string[]>("algocoach-active-days", []);
  const [answers, setAnswers] = useLocalStorage<Record<string, number>>("algocoach-answers", {});
  const [sessions, setSessions] = useLocalStorage<number>("algocoach-sessions", 0);
  /** today only — resets itself when the date rolls over */
  const [todayLog, setTodayLog] = useLocalStorage<TodayLog>("algocoach-today", EMPTY_TODAY_LOG);
  /** XP paid out by completed quests, which is why it cannot be derived */
  const [questXp, setQuestXp] = useLocalStorage<number>("algocoach-quest-xp", 0);

  const progress = useMemo(() => ({ learned, solved, shaky }), [learned, solved, shaky]);
  const account = useAccount(progress);

  const { answered: answeredToday, sessions: sessionsToday } = readToday(todayLog);

  /** Roll the day over on first write, then add to it. */
  const bumpToday = useCallback(
    (patch: { answered?: number; sessions?: number }) => {
      setTodayLog((log) => {
        const now = todayKey();
        const base = log.date === now ? log : { date: now, answered: 0, sessions: 0, claimed: [] };
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
          setDeck((d) => (d[id] ? d : { ...d, [id]: { interval: 1, ease: 2.5, due: isoToday(), reps: 0 } }));
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
      setDeck((d) => {
        const card = d[patternId] ?? { interval: 1, ease: 2.5, due: isoToday(), reps: 0 };
        return { ...d, [patternId]: srsReview(card, correct) };
      });
      if (correct) setAnswers((a) => ({ ...a, [patternId]: (a[patternId] ?? 0) + 1 }));
      bumpToday({ answered: 1 });
      if (correct) {
        // One toast that keeps a running total, rather than five that stack up.
        const won = (sessionXp.current += XP.correct);
        toast(`+${won} XP`, { id: "xp-gain", description: "this session", duration: 1800 });
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

  const correctAnswers = useMemo(() => Object.values(answers).reduce((a, b) => a + b, 0), [answers]);
  const xp = computeXP({
    learned: learned.length,
    solved: solved.length,
    correctAnswers,
    sessions,
  }) + questXp;

  const goal = account.today.goal || 3;
  const level = levelFor(xp).level;

  /**
   * Quests pay out the moment they are done.
   *
   * The XP is added to the real total the levels read, and claimed ids are
   * remembered for the day, so refreshing the page cannot pay twice.
   */
  useEffect(() => {
    const done = dailyQuests({ answered: answeredToday, sessions: sessionsToday, goal }).filter(
      (q) => q.done && !todayLog.claimed.includes(q.id),
    );
    if (!done.length) return;

    const now = todayKey();
    // Re-read inside the updater so a stale log from another tab cannot win.
    setTodayLog((log) => {
      const base = log.date === now ? log : { date: now, answered: 0, sessions: 0, claimed: [] };
      const fresh = done.filter((q) => !base.claimed.includes(q.id));
      if (!fresh.length) return log;
      setQuestXp((x) => x + fresh.reduce((n, q) => n + q.xp, 0));
      return { ...base, claimed: [...base.claimed, ...fresh.map((q) => q.id)] };
    });

    for (const q of done) {
      toast.success(`Quest complete · +${q.xp} XP`, { id: `quest-${q.id}`, description: q.label });
    }
  }, [answeredToday, sessionsToday, goal, todayLog.claimed, setTodayLog, setQuestXp]);

  /* A level is worth a small fuss — it is the one number that only ever goes up. */
  const [burst, setBurst] = useState(0);
  const seenLevel = useRef(level.n);
  useEffect(() => {
    if (level.n > seenLevel.current) {
      toast.success(`Level ${level.n} · ${level.title}`, {
        id: "level-up",
        description: "Every pattern you learn from here is worth more than the last.",
      });
      setBurst((b) => b + 1);
    }
    seenLevel.current = level.n;
  }, [level.n, level.title]);

  const due = useMemo(
    () => dueCards(deck, 8).map((id) => PATTERN_MAP[id]?.id).filter(Boolean) as string[],
    [deck],
  );
  const pending = useMemo(() => dueCount(deck), [deck]);

  const pct = Math.round((learned.length / PATTERNS.length) * 100);

  /**
   * The streak the learner should see.
   *
   * The server knows it once signed in, but the whole app works signed out, so
   * fall back to counting the days this device recorded rather than showing a
   * permanent zero.
   */
  const effectiveStreak = useMemo(() => {
    const local = localStreak(activeDays);
    return {
      current: Math.max(account.streak.current, local.current),
      longest: Math.max(account.streak.longest, local.longest),
    };
  }, [activeDays, account.streak]);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => setTab("today")}
            className="h-auto gap-2.5 px-2 py-1.5"
            aria-label="Go to Today"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldQuestion className="size-5" />
            </span>
            <span className="text-left leading-tight">
              <span className="block text-base font-extrabold tracking-tight">AlgoCoach</span>
              <span className="hidden text-[11px] font-normal text-muted-foreground sm:block">
                Learn to choose the right algorithm
              </span>
            </span>
          </Button>

          {/* Radix Tabs is a controlled tablist here — the panels live below, so
              the nav keeps a single source of truth for the active section. */}
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="order-3 w-full sm:order-none sm:w-auto sm:flex-1"
          >
            <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                  <t.icon className="size-4" />
                  {t.label}
                  {t.id === "today" && pending > 0 && tab !== "today" && (
                    <Badge variant="default" className="ml-0.5 animate-pop px-1.5 py-0 text-[10px] tabular-nums">
                      {pending}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setTab("today")}
              className="h-auto gap-2.5 rounded-full px-3 py-1.5"
              title="Your progress"
            >
              <span className="relative size-8">
                <svg viewBox="0 0 36 36" className="size-8 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" className="stroke-muted" strokeWidth="4" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="animate-ring stroke-primary"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
                  {pct}%
                </span>
              </span>
              {/* The HUD stays deliberately thin: the ring is the progress, and
                  these are the two live counters. Everything else about levels
                  lives on the page, so the header never competes with it. */}
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-xs font-semibold">
                  {effectiveStreak.current > 0
                    ? `${effectiveStreak.current} day streak`
                    : "No streak yet"}
                </span>
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {xp.toLocaleString()} XP
                </span>
              </span>
            </Button>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {tab === "today" && (
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
            onSignUp={account.signUp}
            onSignIn={account.signIn}
            onSignOut={account.signOut}
            onClearError={account.clearError}
            onOpenPattern={openInLibrary}
            onShaky={markShaky}
            onAnswered={onAnswered}
            onSessionComplete={onSessionComplete}
          />
        )}

        {tab === "path" && (
          /* The basics fold into one row so the trail is the first thing you see. */
          <div className="space-y-6">
            <StartHere />
            <LearningPath learned={learned} solved={solved} onOpenPattern={openInLibrary} />
          </div>
        )}

        {tab === "coach" && (
          <Coach learned={learned} onToggleLearned={toggleLearned} onVisualize={openInVisualizer} />
        )}
        {tab === "library" && (
          <Library
            learned={learned}
            onToggleLearned={toggleLearned}
            onVisualize={openInVisualizer}
            initialId={libraryId}
          />
        )}
        {tab === "visualize" && <Visualizer onOpenPattern={openInLibrary} initialId={visualizeId} />}
        {tab === "cheat" && <CheatSheet onOpenPattern={openInLibrary} />}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-muted-foreground">
        Every problem is a pattern in disguise.
      </footer>

      {burst > 0 && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          <Confetti fire={burst} />
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}
