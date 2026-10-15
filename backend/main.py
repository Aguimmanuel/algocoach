"""AlgoCoach API — Google-only identity, progress sync and an offline coach.

Run it:
    cd backend
    uvicorn main:app --reload --port 8000

Endpoints:
    GET  /api/health   → offline coach status and Google configuration
    POST /api/coach    → read a problem, return a thinking plan (never code)
    POST /api/solve    → compatibility response: offline solutions are not generated
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load backend/.env before anything reads the environment.
load_dotenv(Path(__file__).with_name(".env"))

from fastapi import FastAPI, HTTPException, Depends  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from guardrails import protect  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import accounts  # noqa: E402
import google_login  # noqa: E402
import coach as coach_engine  # noqa: E402
import security  # noqa: E402
from db import init_db  # noqa: E402

app = FastAPI(title="AlgoCoach API", version="2.3.0")

# Google identity, required before protected account/learning APIs.
app.include_router(accounts.router)
app.include_router(google_login.router)
app.middleware("http")(protect)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# The React dev server proxies /api here, so CORS is only needed if someone
# serves the frontend from a different origin. Local learning tool — keep it
# explicit when a separate frontend origin is configured.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# A learner who types a real attempt writes at least this much. This is the
# compatibility validation on the old solve endpoint; no AI solution is generated.
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
    candidates: list[CandidateIn] = Field(default_factory=list, max_length=19)
    kinds: list[KindIn] = Field(default_factory=list, max_length=20)


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
    from db import IS_SQLITE
    return {
        "ok": True, "mode": "demo", "model": None,
        "database": "sqlite" if IS_SQLITE else "postgres", "accounts": True,
        "auth_provider": "google", "google_sign_in_configured": google_login.configured(),
        "message": "Ready to learn.",
    }



@app.post("/api/coach", dependencies=[Depends(accounts.current_user)])
def coach_route(req: CoachRequest) -> dict[str, Any]:
    """Read a problem and return how to think about it. Never returns code."""
    plan, mode = coach_engine.coach(req.model_dump())
    return {"mode": mode, "plan": plan}


@app.post("/api/solve", dependencies=[Depends(accounts.current_user)])
def solve_route(req: SolveRequest) -> dict[str, Any]:
    """Compatibility endpoint: validates the old request but generates no solution."""
    if len(req.attempt.strip()) < MIN_ATTEMPT_CHARS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Write at least {MIN_ATTEMPT_CHARS} characters of your own attempt first. "
                "The offline coach does not generate custom solutions."
            ),
        )
    return coach_engine.solve(req.model_dump())


# Serve the built frontend when it exists (npm run build → dist/). Mounting it
# last means the /api routes above always win. This is what lets the single-file
# production build use the offline coach: same origin, no proxy or CORS.
_dist = Path(__file__).resolve().parent.parent / "dist"
if _dist.is_dir():
    from fastapi.staticfiles import StaticFiles

    app.mount("/", StaticFiles(directory=str(_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
