"""Built-in, deterministic pattern coaching. No Gemini/API-key inference."""
from __future__ import annotations
from typing import Any


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
    }


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------

def coach(req: dict[str, Any]) -> tuple[dict[str, Any], str]:
    """Offline-only release: no external inference, even if old API keys remain set."""
    return _demo_coach(req), "demo"


def solve(req: dict[str, Any]) -> dict[str, Any]:
    return {
        "available": False,
        "reason": "offline_mode",
        "message": "Explore a worked example in the matching lesson.",
    }
