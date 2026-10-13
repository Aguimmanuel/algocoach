import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Flame,
  Layers,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { LEARNING_PATH } from "../data/basics";
import { PATTERN_MAP, PATTERNS } from "../data/patterns";
import { PRACTICE } from "../data/practice";
import { dailyQuests, levelFor, milestones } from "../data/gamification";
import type { AccountUser, StreakInfo } from "../lib/api";
import { toISO } from "../lib/srs";
import AuthPanel from "./AuthPanel";
import ReviewSession from "./ReviewSession";
import StreakHeatmap from "./StreakHeatmap";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";

interface Props {
  learned: string[];
  solved: string[];
  activeDays: string[];
  duePatternIds: string[];
  dueCount: number;
  xp: number;
  /** total review sessions ever — feeds the milestones */
  sessions: number;
  /** today only, drives the goal and the quests */
  answeredToday: number;
  sessionsToday: number;
  goal: number;
  user: AccountUser | null;
  streak: StreakInfo;
  busy: boolean;
  error: string | null;
  onSignUp: (email: string, password: string, name: string) => Promise<boolean>;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => void;
  onClearError: () => void;
  onOpenPattern: (id: string) => void;
  onShaky: (key: string) => void;
  onAnswered: (patternId: string, correct: boolean) => void;
  onSessionComplete: (score: number, total: number) => void;
}

/** One fact from the status line — a label and a value, no card around it. */
function Fact({ icon: Icon, children }: { icon: typeof Flame; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="size-4 text-muted-foreground" />
      <span className="font-semibold tabular-nums">{children}</span>
    </span>
  );
}

/**
 * The dashboard.
 *
 * The rule this screen follows is that a learner should never have to scan:
 * one line tells you where you are, one card tells you what to do next, and
 * everything else — the numbers, the milestones, the account — is behind a tab
 * so it is there when you look for it and out of the way when you are not. The
 * review takes the whole screen rather than living inside a card, because doing
 * the work and reading about the work are different modes.
 */
export default function ProgressHome({
  learned,
  solved,
  activeDays,
  duePatternIds,
  dueCount,
  xp,
  sessions,
  answeredToday,
  sessionsToday,
  goal,
  user,
  streak,
  busy,
  error,
  onSignUp,
  onSignIn,
  onSignOut,
  onClearError,
  onOpenPattern,
  onShaky,
  onAnswered,
  onSessionComplete,
}: Props) {
  const [mode, setMode] = useState<"home" | "review">("home");

  const totalProblems = Object.values(PRACTICE).reduce((n, list) => n + list.length, 0);
  const lvl = levelFor(xp);
  const quests = dailyQuests({ answered: answeredToday, sessions: sessionsToday, goal });
  const questsDone = quests.filter((q) => q.done).length;
  const earnedMilestones = milestones({
    learned: learned.length,
    solved: solved.length,
    streak: streak.current,
    level: lvl.level.n,
    sessions,
  });
  const earnedCount = earnedMilestones.filter((m) => m.earned).length;

  const nextStep = LEARNING_PATH.find((s) => s.patternId && !learned.includes(s.patternId));
  const nextPattern = nextStep?.patternId ? PATTERN_MAP[nextStep.patternId] : null;

  const goalPct = goal > 0 ? Math.min(100, (answeredToday / goal) * 100) : 0;
  /**
   * Exactly one action is offered, chosen in this order: work that is due,
   * then the next new thing, then practice once there is nothing new left.
   */
  const reviewIsNext = dueCount > 0 || !nextPattern;

  /* ------------------------------------------------------------ the session */

  if (mode === "review") {
    return (
      <ReviewSession
        learned={learned}
        solved={solved}
        duePatternIds={duePatternIds}
        dueCount={dueCount}
        onShaky={onShaky}
        onOpenPattern={onOpenPattern}
        onAnswered={onAnswered}
        onComplete={onSessionComplete}
        onExit={() => setMode("home")}
      />
    );
  }

  /* --------------------------------------------------------------- the week */

  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0 is Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISO(d);
    return { iso, label: "MTWTFSS"[i], isToday: i === dow, future: i > dow, active: activeDays.includes(iso) };
  });
  const weekDays = week.filter((d) => !d.future && d.active).length;

  return (
    <div className="space-y-6">
      {/* ================================================= where you are, one line */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 surface rounded-xl px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
            {lvl.level.n}
          </span>
          <div className="min-w-40">
            <p className="text-sm leading-tight font-bold">
              Level {lvl.level.n} · {lvl.level.title}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <Progress value={lvl.pct} className="h-1.5 w-28" />
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {lvl.next ? `${lvl.remaining.toLocaleString()} XP to go` : "top level"}
              </span>
            </div>
          </div>
        </div>

        <Separator orientation="vertical" className="hidden h-8 sm:block" />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Fact icon={Flame}>
            {streak.current}
            <span className="ml-1 font-normal text-muted-foreground">
              {streak.current === 1 ? "day" : "days"}
            </span>
          </Fact>
          <Fact icon={Target}>
            {answeredToday >= goal ? answeredToday : `${answeredToday} / ${goal}`}
            <span className="ml-1 font-normal text-muted-foreground">
              {answeredToday >= goal ? "today · goal met" : "today"}
            </span>
          </Fact>
          <Fact icon={Layers}>
            {learned.length}
            <span className="ml-1 font-normal text-muted-foreground">/ {PATTERNS.length} patterns</span>
          </Fact>
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Progress value={goalPct} className="h-1.5 w-20" />
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {answeredToday >= goal ? "Goal met" : "Daily goal"}
          </span>
        </div>
      </div>

      {/* ================================================= the one thing to do now */}
      <Card className="slab lift gap-0 overflow-hidden border-transparent text-strong-foreground">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 py-2">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-strong-foreground/10">
              {reviewIsNext ? <RotateCcw className="size-6" /> : <BookOpen className="size-6" />}
            </span>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase opacity-85">
                {dueCount > 0 ? "Today's review" : nextPattern ? (learned.length ? "Next up" : "Start here") : "Keep it sharp"}
              </p>
              <p className="mt-1 text-xl font-bold">
                {dueCount > 0
                  ? `${dueCount} ${dueCount === 1 ? "pattern is" : "patterns are"} due`
                  : (nextPattern?.name ?? "Practise anything you like")}
              </p>
              <p className="mt-1 max-w-xl text-sm opacity-90">
                {dueCount > 0
                  ? "Five questions, one at a time. Anything you miss is scheduled sooner."
                  : (nextPattern?.plain ??
                    "Every pattern is learned. Pick one and keep it fresh — the schedule decides what comes back.")}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="hidden text-right text-xs leading-tight opacity-85 sm:block">
              <p>
                {questsDone} of {quests.length} quests done
              </p>
              <p>
                {quests.reduce((n, q) => n + (q.done ? 0 : q.xp), 0)} XP left today
              </p>
            </div>
            <Button
              size="lg"
              className="bg-strong-foreground text-strong hover:bg-strong-foreground/90"
              onClick={reviewIsNext ? () => setMode("review") : () => nextPattern && onOpenPattern(nextPattern.id)}
            >
              {dueCount > 0 ? "Start the review" : nextPattern ? "Open the lesson" : "Practise a round"}
              <ArrowRight />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================================================= three things, in a line */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm tracking-wide uppercase">
            <Sparkles className="size-4 text-muted-foreground" />
            Today's quests
          </CardTitle>
          <CardDescription>
            {questsDone === quests.length
              ? "All three done for today."
              : "Short and daily beats long and rare."}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {quests.map((q) => (
            <div key={q.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition",
                  q.done
                    ? "animate-pop border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {q.done ? (
                  <Check className="size-4" />
                ) : q.target > 1 ? (
                  <span className="text-xs font-bold tabular-nums">{q.progress}</span>
                ) : null}
              </span>

              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", q.done && "text-muted-foreground line-through")}>{q.label}</p>
                <p className="text-xs text-muted-foreground">{q.hint}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden w-24 sm:block">
                  <Progress value={(q.progress / q.target) * 100} className="h-1.5" />
                </div>
                <Badge variant={q.done ? "default" : "secondary"} className="tabular-nums">
                  +{q.xp} XP
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ================================================= the week, as a straight line */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm tracking-wide uppercase">
            <CalendarDays className="size-4 text-muted-foreground" />
            This week
          </CardTitle>
          <CardDescription>
            {weekDays === 0
              ? "Nothing yet this week — today still counts."
              : `${weekDays} ${weekDays === 1 ? "day" : "days"} this week · best streak ${streak.longest}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            {week.map((d, i) => (
              <div key={d.iso} className={cn("flex items-center", i > 0 && "flex-1")}>
                {i > 0 && (
                  <span
                    aria-hidden
                    className={cn("h-0.5 flex-1 rounded-full", week[i - 1].active && d.active ? "bg-primary" : "bg-border")}
                  />
                )}
                <span
                  aria-label={`${d.iso}${d.active ? " — active" : ""}`}
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition",
                    d.active && "border-primary bg-primary text-primary-foreground",
                    !d.active && d.isToday && "border-primary text-primary",
                    !d.active && !d.isToday && "border-border text-muted-foreground",
                    d.future && "opacity-40",
                  )}
                >
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ================================================= everything else, one tab at a time */}
      <Tabs defaultValue="progress">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="progress">
            <Layers className="size-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <Trophy className="size-4" />
            Milestones
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-[10px] tabular-nums">
              {earnedCount}/{earnedMilestones.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="account">{user ? "Account" : "Sign in"}</TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm tracking-wide uppercase">Last 12 weeks</CardTitle>
              <CardDescription>Every day you did anything at all.</CardDescription>
            </CardHeader>
            <CardContent>
              <StreakHeatmap activeDays={activeDays} />
            </CardContent>
          </Card>

          <div className="grid gap-x-6 gap-y-4 rounded-xl border border-border bg-card px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Patterns learned", value: learned.length, of: PATTERNS.length },
              { label: "Problems solved", value: solved.length, of: totalProblems },
              { label: "Best streak", value: streak.longest, of: 0 },
              { label: "Review sessions", value: sessions, of: 0 },
            ].map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.label}</p>
                <p className="text-2xl font-extrabold tabular-nums">
                  {s.value}
                  {s.of > 0 && <span className="text-base font-semibold text-muted-foreground"> / {s.of}</span>}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm tracking-wide uppercase">Milestones</CardTitle>
              <CardDescription>
                {earnedCount} of {earnedMilestones.length} earned.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {earnedMilestones.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition",
                    m.earned ? "border-transparent bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  <span className={cn("text-2xl", !m.earned && "opacity-40 grayscale")} aria-hidden>
                    {m.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold", !m.earned && "text-muted-foreground")}>{m.label}</p>
                    <p className={cn("text-xs", m.earned ? "opacity-80" : "text-muted-foreground")}>{m.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <AuthPanel
            user={user}
            busy={busy}
            error={error}
            onSignUp={onSignUp}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            onClearError={onClearError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
