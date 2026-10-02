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
