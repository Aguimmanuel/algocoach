/**
 * Client for the AlgoCoach Python backend.
 *
 * Everything is a relative URL on purpose: the Vite dev server proxies /api
 * to the Python process, so the browser never needs to know a port number and
 * the app keeps working from any host.
 */

import type { Analysis } from "./analyze";
import type { Pattern } from "../data/patterns";

export interface ThinkingStep {
  title: string;
  detail: string;
}

export interface CoachPlan {
  summary: string;
  pattern: { id: string; name: string; confidence: "high" | "medium" | "low"; why: string };
  alternatives?: { id: string; name: string; why_not: string }[];
  thinking_steps: ThinkingStep[];
  questions: string[];
  traps: string[];
  complexity: { time: string; space: string };
  prereqs?: string[];
  degraded?: boolean;
  demo_note?: string;
}

export interface SolutionResult {
  available: boolean;
  reason?: string;
  message?: string;
  approach?: string;
  code?: string;
  language?: string;
  walkthrough?: { line: string; explain: string }[];
  complexity?: { time: string; space: string; why?: string };
  compare_note?: string;
}

export interface Health {
  ok: boolean;
  mode: "gemini" | "demo";
  model: string | null;
  message: string;
}

const TIMEOUT_MS = 75_000;

class ApiError extends Error {}

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => ctrl.abort());

  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      // FastAPI puts human-readable messages in `detail`.
      let detail = `Request failed (${res.status})`;
      try {
        const data = await res.json();
        if (typeof data?.detail === "string") detail = data.detail;
      } catch {
        /* keep the default */
      }
      throw new ApiError(detail);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkHealth(): Promise<Health | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch("/api/health", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as Health;
  } catch {
    return null;
  }
}

/** Trim a pattern down to what the coach actually needs (keeps tokens low). */
function briefPattern(p: Pattern, matched: string[]) {
  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    idea: p.idea,
    signals: p.signals,
    steps: p.steps,
    hints: p.hints,
    pitfalls: p.pitfalls,
    prerequisites: p.prerequisites ?? [],
    matched,
    time: p.time,
    space: p.space,
  };
}

function buildBody(problem: string, analysis: Analysis | null) {
  return {
    problem,
    detected_n: analysis?.detectedN ?? null,
    candidates: (analysis?.candidates ?? []).map((c) => briefPattern(c.pattern, c.matched)),
    kinds: (analysis?.kinds ?? []).map((k) => ({ label: k.label, emoji: k.emoji, hint: k.hint })),
  };
}

export async function getCoaching(
  problem: string,
  analysis: Analysis | null,
  signal?: AbortSignal,
): Promise<{ mode: string; plan: CoachPlan }> {
  return post<{ mode: string; plan: CoachPlan }>("/api/coach", buildBody(problem, analysis), signal);
}

export async function getSolution(
  problem: string,
  analysis: Analysis | null,
  attempt: string,
  language: string,
): Promise<SolutionResult> {
  return post<SolutionResult>("/api/solve", { ...buildBody(problem, analysis), attempt, language });
}

export { ApiError };

/* ------------------------------------------------------------------ accounts
 *
 * Everything here is optional. The app is fully usable signed out, and every
 * call below fails soft: a learner must never see an error because tracking or
 * sync was unavailable.
 */

export interface AccountUser {
  id: number;
  email: string;
  display_name: string;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export interface TodayInfo {
  count: number;
  goal: number;
  met: boolean;
}

export interface MeResponse {
  user: AccountUser;
  progress: { learned: string[]; solved: string[]; shaky: string[] };
  streak: StreakInfo;
  today: TodayInfo;
}

export interface ProgressState {
  learned: string[];
  solved: string[];
  shaky: string[];
}

const TOKEN_KEY = "algocoach-token";

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode — session simply won't persist */
  }
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { authorization: `Bearer ${t}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (typeof data?.detail === "string") detail = data.detail;
    } catch {
      /* keep the default */
    }
    throw new ApiError(detail);
  }
  return (await res.json()) as T;
}

export function signUp(body: {
  email: string;
  password: string;
  display_name?: string;
  learned: string[];
  solved: string[];
  shaky: string[];
}): Promise<{ token: string; user: AccountUser }> {
  return request("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });
}

export function signIn(body: { email: string; password: string }): Promise<{ token: string; user: AccountUser }> {
  return request("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function getMe(): Promise<MeResponse> {
  return request("/api/me");
}

export function putProgress(progress: ProgressState): Promise<ProgressState> {
  return request("/api/progress", { method: "PUT", body: JSON.stringify(progress) });
}

/**
 * Fire-and-forget activity logging.
 *
 * Never awaited by callers and never surfaced to the learner: if this fails we
 * lose a data point, not a lesson. `keepalive` lets the final event of a
 * session still land while the tab is closing.
 */
export function logEvent(kind: string, detail: Record<string, unknown> = {}): void {
  if (!getToken()) return; // nothing to attribute it to
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders() },
      body: JSON.stringify({ kind, detail }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function sendFeedback(message: string, context: Record<string, unknown> = {}): Promise<{ status: string }> {
  return request("/api/feedback", { method: "POST", body: JSON.stringify({ message, context }) });
}
