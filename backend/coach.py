"""The coaching brain.

Two modes, one contract:

  * LLM mode  — Gemini reads the problem and writes a tailored coaching plan.
  * Demo mode — no API key? We compose a real coaching plan out of the
                pattern knowledge the frontend already sent us.

Both return the exact same JSON shape, so the UI never knows the difference.
The frontend sends its own analyzer's candidate patterns along with the
problem. That doubles as grounding: the model can only talk about patterns
that actually exist in AlgoCoach.
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
DEFAULT_MODEL = "gemini-2.5-flash"
TIMEOUT = httpx.Timeout(60.0, connect=10.0)


# --------------------------------------------------------------------------
# The contract
# --------------------------------------------------------------------------

# Gemini accepts an OpenAPI-subset schema. Declaring the shape here is what
# turns "a wall of chatbot text" into something we can render as clean cards.
COACH_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "One or two sentences restating the problem in plain English, as a coach would say it back to check understanding.",
        },
        "pattern": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "The id of the best-fit pattern. MUST be one of the ids given in the candidate list.",
                },
                "name": {"type": "string"},
                "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                "why": {
                    "type": "string",
                    "description": "Why this pattern fits THIS problem, quoting the exact words in the problem that gave it away.",
                },
            },
            "required": ["id", "name", "confidence", "why"],
        },
        "alternatives": {
            "type": "array",
            "description": "Other candidates worth ruling out, at most 2.",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"},
                    "why_not": {"type": "string", "description": "Why it is a weaker fit here."},
                },
                "required": ["id", "name", "why_not"],
            },
        },
        "thinking_steps": {
            "type": "array",
            "description": "3 to 5 steps describing HOW to think about the problem, in order. This is the core of the answer.",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short imperative title, e.g. 'Pick your window's meaning'."},
                    "detail": {"type": "string", "description": "One or two sentences explaining what to actually do or ask yourself."},
                },
                "required": ["title", "detail"],
            },
        },
        "questions": {
            "type": "array",
            "description": "3 or 4 Socratic questions the learner should answer themselves. Never answer them here.",
            "items": {"type": "string"},
        },
        "traps": {
            "type": "array",
            "description": "2 or 3 specific mistakes this problem invites.",
            "items": {"type": "string"},
        },
        "complexity": {
            "type": "object",
            "properties": {
                "time": {"type": "string"},
                "space": {"type": "string"},
            },
            "required": ["time", "space"],
        },
        "prereqs": {
            "type": "array",
            "description": "Ids of patterns to study first if this one feels too hard. May be empty.",
            "items": {"type": "string"},
        },
    },
    "required": [
        "summary",
        "pattern",
        "thinking_steps",
        "questions",
        "traps",
        "complexity",
    ],
}

SOLVE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "approach": {
            "type": "string",
            "description": "A plain-English walkthrough of the solution strategy, 3 to 6 sentences. No code here.",
        },
        "code": {"type": "string", "description": "The complete, runnable reference solution in the requested language."},
        "walkthrough": {
            "type": "array",
            "description": "Line-by-line explanation of the code's key moves.",
            "items": {
                "type": "object",
                "properties": {
                    "line": {"type": "string", "description": "The code fragment being explained."},
                    "explain": {"type": "string"},
                },
                "required": ["line", "explain"],
            },
        },
        "complexity": {
            "type": "object",
            "properties": {
                "time": {"type": "string"},
                "space": {"type": "string"},
                "why": {"type": "string"},
            },
            "required": ["time", "space"],
        },
        "compare_note": {
            "type": "string",
            "description": "A short, non-condescending note telling the learner what to check in their own attempt now that they have seen this.",
        },
    },
    "required": ["approach", "code", "walkthrough", "complexity"],
}


# --------------------------------------------------------------------------
# Prompts
# --------------------------------------------------------------------------

COACH_SYSTEM = """You are AlgoCoach: a patient, sharp algorithms mentor for people who can code but freeze when they meet a new problem.

Your single goal is to help the learner CHOOSE and UNDERSTAND an approach. You are not a solution generator.

Hard rules:
- NEVER write code, pseudocode, or a step-by-step algorithm that simply hands over the answer.
- NEVER name the final data structure or trick so plainly that the learner has nothing left to work out. Point at it; do not hand it over.
- Only ever refer to patterns by the ids in the candidate list you are given. Never invent a pattern.
- Speak directly to the learner as "you". Warm, concrete, zero filler. No "Great question!", no "As an AI".
- Prefer short sentences. If a sentence could be cut, cut it.
- Ground every claim in the actual problem text. Quote its real words back when you explain the match.

For thinking_steps, describe how to REASON, not what to type. Good: "Decide what your window represents before you move it." Bad: "Initialize left = 0 and expand right while the set has no duplicates."

For questions, ask things only the learner can answer about their own problem. Never answer your own questions.

If the constraints make an approach impossible, say so plainly and explain the arithmetic."""

SOLVE_SYSTEM = """You are AlgoCoach. The learner has already been coached, has written their own attempt, and still asked for help. Now you may show a reference solution.

Tone: a mentor reviewing work, not a machine dumping an answer.
- Lead with the STRATEGY in plain English before any code.
- Then give complete, correct, idiomatic {language} code with sensible names.
- Then explain the key moves, not every brace.
- Be honest about the complexity and say why.
- In compare_note, tell the learner exactly what to look at in their own attempt — where the thinking usually goes wrong. Never be condescending. Never make them feel stupid."""


def _candidate_brief(candidates: list[dict[str, Any]]) -> str:
    """Compact, token-efficient view of the knowledge base for the prompt."""
    if not candidates:
        return "(the analyzer found no matching patterns)"
    lines = []
    for i, c in enumerate(candidates, 1):
        lines.append(f"{i}. id={c.get('id')} | {c.get('name')}")
        if c.get("matched"):
            lines.append(f"   matched clue words: {', '.join(c['matched'])}")
        if c.get("tagline"):
            lines.append(f"   tagline: {c['tagline']}")
        if c.get("idea"):
            lines.append(f"   core idea: {c['idea']}")
        if c.get("signals"):
            lines.append(f"   signals: {'; '.join(c['signals'][:4])}")
        if c.get("time"):
            lines.append(f"   typical cost: time {c.get('time')}, space {c.get('space')}")
        if c.get("prerequisites"):
            lines.append(f"   prerequisites: {', '.join(c['prerequisites'])}")
    return "\n".join(lines)


def _build_user_prompt(req: dict[str, Any]) -> str:
    parts = ["# The problem the learner pasted\n", req.get("problem", "").strip()]

    n = req.get("detected_n")
    parts.append(
        "\n# Constraint analysis\n"
        + (f"Largest input size found in the text: n ≈ {n:,}" if n else "No explicit input size was found in the text.")
    )
    if req.get("kinds"):
        kinds = ", ".join(k.get("label", "") for k in req["kinds"] if k.get("label"))
        if kinds:
            parts.append(f"Question type detected: {kinds}")

    parts.append("\n# Candidate patterns from our own analyzer (best first)\n" + _candidate_brief(req.get("candidates", [])))

    parts.append(
        "\n# Your task\n"
        "Write the coaching plan for this specific problem. Pick the best-fit pattern from the candidate "
        "ids above (or the closest one if none fit). Make the thinking_steps specific to THIS problem — "
        "not generic advice that would apply to any problem."
    )
    return "\n".join(parts)


# --------------------------------------------------------------------------
# Gemini
# --------------------------------------------------------------------------

class LLMError(RuntimeError):
    pass


def _extract_text(payload: dict[str, Any]) -> str:
    try:
        parts = payload["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError) as exc:
        blocked = payload.get("promptFeedback", {}).get("blockReason")
        raise LLMError(f"Model returned no content (blockReason={blocked})") from exc

    # Gemini 2.5 can return internal "thought" parts — never show those.
    text = "".join(p.get("text", "") for p in parts if not p.get("thought"))
    if not text.strip():
        raise LLMError("Model returned an empty response")
    return text


def _call_gemini(*, system: str, user: str, schema: dict[str, Any], max_tokens: int) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise LLMError("No GEMINI_API_KEY set")

    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
    body: dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": max_tokens,
            "responseMimeType": "application/json",
            "responseSchema": schema,
        },
    }
    # 2.5 models "think" before answering, which adds several seconds of
    # dead air. For a coaching panel, latency hurts more than the extra
    # reasoning helps — but the field isn't accepted by every model, so we
    # retry without it if the API rejects it.
    if "2.5" in model:
        body["generationConfig"]["thinkingConfig"] = {"thinkingBudget": 0}

    headers = {"x-goog-api-key": api_key, "content-type": "application/json"}
    url = GEMINI_URL.format(model=model)

    with httpx.Client(timeout=TIMEOUT) as client:
        resp = client.post(url, headers=headers, json=body)
        if resp.status_code == 400 and "thinkingConfig" in body["generationConfig"]:
            body["generationConfig"].pop("thinkingConfig", None)
            resp = client.post(url, headers=headers, json=body)
        if resp.status_code == 429:
            raise LLMError("Rate limited by Gemini — try again shortly")
        if resp.status_code >= 400:
            raise LLMError(f"Gemini error {resp.status_code}: {resp.text[:300]}")

    raw = _extract_text(resp.json())
    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise LLMError(f"Model did not return valid JSON: {raw[:200]}") from exc


# --------------------------------------------------------------------------
# Demo mode — real coaching, composed from the pattern knowledge base
# --------------------------------------------------------------------------

DEMO_NOTE = (
    "Offline coach — no API key configured, so this plan is composed from "
    "AlgoCoach's own pattern library rather than written for your problem specifically."
)


def _demo_coach(req: dict[str, Any]) -> dict[str, Any]:
    candidates = req.get("candidates") or []
    problem = (req.get("problem") or "").strip()

    if not candidates:
        return {
            "summary": "I could not match any pattern in the library to this problem.",
            "pattern": {
                "id": "",
                "name": "No confident match",
                "confidence": "low",
                "why": "None of the library's clue words appear in your text. Try the guided wizard below — "
                "it asks about the shape of the problem instead of its wording.",
            },
            "alternatives": [],
            "thinking_steps": [
                {"title": "Say the goal out loud", "detail": "Write, in one sentence, exactly what the problem gives you and exactly what it wants back."},
                {"title": "Classify the output", "detail": "Is it one value, a count, a list of all answers, or a path? Each points at a different family of patterns."},
                {"title": "Find the size limit", "detail": "Look for a line like '1 <= n <= 10^5'. That single number rules most approaches in or out."},
                {"title": "Walk the wizard", "detail": "Use the guided wizard below — it reasons from the shape of the problem, not from wording."},
            ],
            "questions": [
                "What exactly is the input, and what exactly is the output?",
                "What is the largest n the problem allows, and how many operations does that permit?",
                "Can you solve a tiny example by hand? What did you actually do?",
            ],
            "traps": ["Starting to code before you can state the output in one sentence."],
            "complexity": {"time": "—", "space": "—"},
            "prereqs": [],
            "degraded": True,
            "demo_note": DEMO_NOTE,
        }

    top = candidates[0]
    rest = candidates[1:3]

    why = f"It best matches the wording of your problem"
    if top.get("matched"):
        why += f" — I latched onto: {', '.join(top['matched'])}"
    why += "."

    # The library's steps are already short imperative sentences, so they read
    # better as standalone items than as a heading plus a duplicate sentence.
    # An empty title tells the UI to render the step on its own.
    steps = [{"title": "", "detail": s} for s in top.get("steps", [])[:5]]
    if not steps:
        steps = [{"title": "", "detail": top.get("idea", "Start from the core idea of this pattern.")}]

    complexity = {"time": top.get("time", "—"), "space": top.get("space", "—")}

    return {
        "summary": (
            f"This looks like a {top.get('name')} problem. {(top.get('tagline') or '').strip()}"
        ).strip(),
        "pattern": {
            "id": top.get("id", ""),
            "name": top.get("name", ""),
            "confidence": "medium",
            "why": why,
        },
        "alternatives": [
            {
                "id": c.get("id", ""),
                "name": c.get("name", ""),
                "why_not": "A weaker keyword match, but it is worth checking its signal list before ruling it out.",
            }
            for c in rest
        ],
        "thinking_steps": steps,
        "questions": top.get("hints", [])[:4],
        "traps": top.get("pitfalls", [])[:3],
        "complexity": complexity,
        "prereqs": top.get("prerequisites", []) or [],
        "degraded": True,
        "demo_note": DEMO_NOTE,
    }


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------

def coach(req: dict[str, Any]) -> tuple[dict[str, Any], str]:
    """Return (plan, mode) where mode is 'gemini' or 'demo'."""
    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        return _demo_coach(req), "demo"

    try:
        plan = _call_gemini(
            system=COACH_SYSTEM,
            user=_build_user_prompt(req),
            schema=COACH_SCHEMA,
            max_tokens=2048,
        )
        plan["degraded"] = False
        return plan, "gemini"
    except (LLMError, httpx.HTTPError) as exc:
        # Never break the learner's flow because a model call failed.
        plan = _demo_coach(req)
        plan["demo_note"] = f"The AI coach was unavailable ({exc}). Showing the offline plan instead."
        return plan, "demo"


def solve(req: dict[str, Any]) -> dict[str, Any]:
    """Staged reveal: only reachable after the learner writes an attempt."""
    problem = (req.get("problem") or "").strip()
    attempt = (req.get("attempt") or "").strip()
    language = (req.get("language") or "Python").strip() or "Python"

    if not os.getenv("GEMINI_API_KEY") and not os.getenv("GOOGLE_API_KEY"):
        return {
            "available": False,
            "reason": "no_key",
            "message": (
                "The reference solution needs the AI coach, which is offline right now "
                "(no GEMINI_API_KEY configured). Your attempt is safe — add a key and try again."
            ),
        }

    top = (req.get("candidates") or [{}])[0]
    user = (
        f"# Problem\n{problem}\n\n"
        f"# The learner's own attempt (read it carefully — respect the thinking in it)\n{attempt}\n\n"
        f"# Approach they were being coached toward\n{top.get('name', 'unknown')} (id={top.get('id', '')})\n\n"
        f"# Your task\nWrite the reference solution in {language}."
    )

    try:
        result = _call_gemini(
            system=SOLVE_SYSTEM.format(language=language),
            user=user,
            schema=SOLVE_SCHEMA,
            max_tokens=4096,
        )
    except (LLMError, httpx.HTTPError) as exc:
        return {
            "available": False,
            "reason": "llm_error",
            "message": f"The AI coach could not be reached ({exc}). Your attempt is safe — try again in a moment.",
        }

    result["available"] = True
    result["language"] = language
    return result
