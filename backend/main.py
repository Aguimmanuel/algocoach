"""AlgoCoach API — a thin Python layer between the React app and Gemini.

Run it:
    cd backend
    uvicorn main:app --reload --port 8000

Endpoints:
    GET  /api/health   → is the AI coach awake, and in which mode?
    POST /api/coach    → read a problem, return a thinking plan (never code)
    POST /api/solve    → staged reveal, only after the learner writes an attempt
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load backend/.env before anything reads the environment.
load_dotenv(Path(__file__).with_name(".env"))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import accounts  # noqa: E402
import coach as coach_engine  # noqa: E402
import security  # noqa: E402
from db import init_db  # noqa: E402

app = FastAPI(title="AlgoCoach API", version="1.0.0")

# Accounts, progress sync and activity tracking. Optional by design — the app
# works without them, which is why they live in their own router.
app.include_router(accounts.router)

# The React dev server proxies /api here, so CORS is only needed if someone
# serves the frontend from a different origin. Local learning tool — keep it
# permissive so setup never becomes the thing that blocks a learner.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A learner who types a real attempt writes at least this much. This is the
# gate on the staged reveal, so it should cost a moment of genuine effort.
MIN_ATTEMPT_CHARS = 40


class CandidateIn(BaseModel):
    """A pattern from the frontend's analyzer, passed through as grounding."""

    id: str = ""
    name: str = ""
    tagline: str = ""
    idea: str = ""
    signals: list[str] = Field(default_factory=list)
    steps: list[str] = Field(default_factory=list)
    hints: list[str] = Field(default_factory=list)
    pitfalls: list[str] = Field(default_factory=list)
    prerequisites: list[str] = Field(default_factory=list)
    matched: list[str] = Field(default_factory=list)
    time: str = ""
    space: str = ""


class KindIn(BaseModel):
    label: str = ""
    emoji: str = ""
    hint: str = ""


class CoachRequest(BaseModel):
    problem: str = Field(min_length=1, max_length=20_000)
    detected_n: int | None = None
    candidates: list[CandidateIn] = Field(default_factory=list)
    kinds: list[KindIn] = Field(default_factory=list)


class SolveRequest(CoachRequest):
    attempt: str = Field(default="", max_length=20_000)
    language: str = "Python"


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    if security.GENERATED_SECRET:
        print(
            "! SECRET_KEY is not set — sessions will be invalidated on every restart.\n"
            "  Set SECRET_KEY in the environment before going live."
        )


@app.get("/api/health")
def health() -> dict[str, Any]:
    live = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    from db import IS_SQLITE

    return {
        "ok": True,
        "mode": "gemini" if live else "demo",
        "model": os.getenv("GEMINI_MODEL", coach_engine.DEFAULT_MODEL) if live else None,
        "database": "sqlite" if IS_SQLITE else "postgres",
        "accounts": True,
        "message": (
            "AI coach is live."
            if live
            else "Running the offline coach. Add GEMINI_API_KEY to backend/.env to switch on the full AI coach."
        ),
    }


@app.post("/api/coach")
def coach_route(req: CoachRequest) -> dict[str, Any]:
    """Read a problem and return how to think about it. Never returns code."""
    plan, mode = coach_engine.coach(req.model_dump())
    return {"mode": mode, "plan": plan}


@app.post("/api/solve")
def solve_route(req: SolveRequest) -> dict[str, Any]:
    """Staged reveal. Requires the learner to have written something first."""
    if len(req.attempt.strip()) < MIN_ATTEMPT_CHARS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Write at least {MIN_ATTEMPT_CHARS} characters of your own attempt first. "
                "Struggling is where the learning happens — the solution is worth earning."
            ),
        )
    return coach_engine.solve(req.model_dump())


# Serve the built frontend when it exists (npm run build → dist/). Mounting it
# last means the /api routes above always win. This is what lets the single-file
# production build use the AI coach: same origin, so no proxy and no CORS.
_dist = Path(__file__).resolve().parent.parent / "dist"
if _dist.is_dir():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
