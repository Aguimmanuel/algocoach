"""Accounts, progress sync, and activity tracking.

Design rules, because they matter more than the code:

1. **Google sign-in is required.** Sessions use HttpOnly cookies.
   Password sign-up/sign-in routes have been removed.
2. **First sign-in adopts local progress.** A learner who already used the app
   should not lose their work by creating an account. We merge, never replace.
3. **Activity is logged, never inferred.** One event per real action, so the
   streak and the "what to do next" card are built from facts.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import security
from db import get_db
from models import ActivityEvent, Feedback, Progress, User, GoogleIdentity

router = APIRouter(prefix="/api", tags=["account"])

MAX_LIST = 5000


# --------------------------------------------------------------------------
# Auth plumbing
# --------------------------------------------------------------------------

def optional_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = request.cookies.get(security.SESSION_COOKIE, "")
    user_id = security.user_id_from_token(token) if token else None
    if user_id is None or db.get(GoogleIdentity, user_id) is None:
        return None
    expected = request.headers.get("x-algocoach-account")
    if expected and expected != str(user_id):
        raise HTTPException(401, "The Google account changed in another tab. Verify your session again.")
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and not expected:
        raise HTTPException(403, "Refresh the app to verify the active account before saving.")
    return db.get(User, user_id)


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    user = optional_user(request, db)
    if user is None:
        raise HTTPException(401, "Sign in with Google to continue.")
    return user


def log(db: Session, user_id: int, kind: str, **detail: Any) -> None:
    db.add(ActivityEvent(user_id=user_id, kind=kind, detail=detail or {}))


# --------------------------------------------------------------------------
# Schemas
# --------------------------------------------------------------------------

class ProgressIn(BaseModel):
    learned: list[str] = Field(default_factory=list, max_length=MAX_LIST)
    solved: list[str] = Field(default_factory=list, max_length=MAX_LIST)
    shaky: list[str] = Field(default_factory=list, max_length=MAX_LIST)


class EventIn(BaseModel):
    kind: str = Field(max_length=40)
    detail: dict[str, Any] = Field(default_factory=dict)


class FeedbackIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    context: dict[str, Any] = Field(default_factory=dict)


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _clean(items: list[str]) -> list[str]:
    """De-duplicate while keeping order, and cap the size."""
    seen: dict[str, None] = {}
    for i in items:
        if isinstance(i, str) and i:
            seen[str(i)[:200]] = None
    return list(seen)[:MAX_LIST]


def progress_payload(p: Progress) -> dict[str, Any]:
    return {"learned": p.learned or [], "solved": p.solved or [], "shaky": p.shaky or []}


def _ensure_progress(db: Session, user: User) -> Progress:
    p = user.progress
    if p is None:
        p = Progress(user_id=user.id, learned=[], solved=[], shaky=[])
        db.add(p)
        db.flush()
    return p


def _streak_days(db: Session, user_id: int) -> tuple[int, int]:
    """(current streak, longest streak) measured in calendar days, UTC.

    A day counts if anything happened on it. Today not having activity yet does
    not break the streak — the day is still in progress.
    """
    rows = db.execute(
        select(ActivityEvent.created_at).where(ActivityEvent.user_id == user_id)
    ).scalars().all()
    if not rows:
        return 0, 0

    days = sorted({r.date() for r in rows})
    longest = 1
    run = 1
    for prev, cur in zip(days, days[1:]):
        if (cur - prev).days == 1:
            run += 1
            longest = max(longest, run)
        elif (cur - prev).days > 1:
            run = 1

    today = datetime.now(timezone.utc).date()
    current = 0
    cursor = today
    if today not in set(days) and (today - timedelta(days=1)) in set(days):
        cursor = today - timedelta(days=1)  # grace: today is still young
    if cursor in set(days):
        while cursor in set(days):
            current += 1
            cursor -= timedelta(days=1)
    return current, longest


def _daily_goal(db: Session, user_id: int) -> int:
    """How much this learner does per day, so the goal is theirs and not ours."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    total = db.execute(
        select(func.count(ActivityEvent.id)).where(
            ActivityEvent.user_id == user_id, ActivityEvent.created_at >= since
        )
    ).scalar_one()
    per_day = max(total // 7, 1)
    # Round up to something tidy: 3, 5, 8, 10. A goal you can hit beats a target.
    for target in (3, 5, 8, 10):
        if per_day <= target:
            return target
    return 15


def _today_count(db: Session, user_id: int) -> int:
    start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    return db.execute(
        select(func.count(ActivityEvent.id)).where(
            ActivityEvent.user_id == user_id, ActivityEvent.created_at >= start
        )
    ).scalar_one()


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

def _user_payload(user: User) -> dict[str, Any]:
    return {"id": user.id, "email": user.email, "display_name": user.display_name}


@router.get("/me")
def me(user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    p = _ensure_progress(db, user)
    current, longest = _streak_days(db, user.id)
    goal = _daily_goal(db, user.id)
    today = _today_count(db, user.id)
    db.commit()
    return {
        "user": _user_payload(user),
        "progress": progress_payload(p),
        "streak": {"current": current, "longest": longest},
        "today": {"count": today, "goal": goal, "met": today >= goal},
    }


@router.put("/progress")
def put_progress(
    body: ProgressIn, user: User = Depends(current_user), db: Session = Depends(get_db)
) -> dict[str, Any]:
    p = _ensure_progress(db, user)
    before = {"learned": set(p.learned or []), "solved": set(p.solved or [])}

    p.learned = _clean(body.learned)
    p.solved = _clean(body.solved)
    p.shaky = _clean(body.shaky)

    # Log the difference, not the whole state — the events are what we analyse.
    for pid in set(p.learned) - before["learned"]:
        log(db, user.id, "learned", pattern=pid)
    for pid in before["learned"] - set(p.learned):
        log(db, user.id, "unlearned", pattern=pid)
    for key in set(p.solved) - before["solved"]:
        log(db, user.id, "solved", problem=key)
    for key in before["solved"] - set(p.solved):
        log(db, user.id, "unsolved", problem=key)

    db.commit()
    return progress_payload(p)


@router.post("/events", status_code=202)
def post_event(
    body: EventIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Best-effort activity logging.

    Requires the current Google account; clients treat tracking as best effort.
    """
    if user is not None:
        log(db, user.id, body.kind[:40], **body.detail)
        db.commit()
    return {"status": "logged"}


@router.get("/me/activity")
def activity(
    days: int = 30, user: User = Depends(current_user), db: Session = Depends(get_db)
) -> dict[str, Any]:
    """A compact picture of what this learner has been doing.

    This is the honest replacement for guessing: it counts real events and names
    the patterns they marked learned, so the client can say what to do next.
    """
    days = max(1, min(days, 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = db.execute(
        select(ActivityEvent)
        .where(ActivityEvent.user_id == user.id, ActivityEvent.created_at >= since)
        .order_by(ActivityEvent.created_at.desc())
        .limit(2000)
    ).scalars().all()

    by_kind: dict[str, int] = {}
    by_day: dict[str, int] = {}
    for e in rows:
        by_kind[e.kind] = by_kind.get(e.kind, 0) + 1
        by_day[e.created_at.date().isoformat()] = by_day.get(e.created_at.date().isoformat(), 0) + 1

    current, longest = _streak_days(db, user.id)
    return {
        "window_days": days,
        "by_kind": by_kind,
        "by_day": sorted(by_day.items()),
        "streak": {"current": current, "longest": longest},
        "recent": [
            {"kind": e.kind, "detail": e.detail, "at": e.created_at.isoformat()}
            for e in rows[:40]
        ],
    }


@router.post("/feedback", status_code=201)
def feedback(
    body: FeedbackIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """Feedback belongs to the signed-in Google account."""
    db.add(
        Feedback(
            user_id=user.id if user else None,
            message=body.message[:4000],
            context=body.context,
        )
    )
    db.commit()
    return {"status": "thanks"}

# Curriculum completion uses the account identity, never a supplied device ID.
class LessonStateIn(BaseModel):
    page: int = Field(default=0, ge=0, le=100)
    visited: list[str] = Field(default_factory=list, max_length=100)
    passed: list[str] = Field(default_factory=list, max_length=100)
    completed: bool = False
    updatedAt: int = Field(default=0, ge=0)

class LearningIn(BaseModel):
    lessons: dict[str, LessonStateIn] = Field(default_factory=dict, max_length=300)

@router.get('/learning')
def get_learning(user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    from models import LearningState
    row = db.get(LearningState, user.id)
    return row.lessons if row else {}

@router.put('/learning')
def put_learning(body: LearningIn, user: User = Depends(current_user), db: Session = Depends(get_db)) -> dict[str, Any]:
    import re
    from models import LearningState
    if any(not re.fullmatch(r'[a-z0-9-]+:[a-z0-9-]+', key) for key in body.lessons):
        raise HTTPException(422, 'Invalid lesson key.')
    row = db.get(LearningState, user.id)
    if row is None:
        row = LearningState(user_id=user.id, lessons={})
        db.add(row)
    merged = dict(row.lessons or {})
    for key, value in body.lessons.items():
        new = value.model_dump()
        new['visited'] = _clean(new['visited'])[:100]
        new['passed'] = _clean(new['passed'])[:100]
        old = merged.get(key)
        if old:
            latest = new if new['updatedAt'] >= old.get('updatedAt', 0) else old
            new = {**latest, 'visited': list(dict.fromkeys(old.get('visited', []) + new['visited']))[:100],
                   'passed': list(dict.fromkeys(old.get('passed', []) + new['passed']))[:100],
                   'completed': old.get('completed', False) or new['completed']}
        if new['completed'] and not (old or {}).get('completed'):
            log(db, user.id, 'lesson_completed', lesson=key)
        merged[key] = new
    if len(merged) > 300:
        raise HTTPException(422, 'Too many saved lessons.')
    row.lessons = merged
    db.commit()
    return merged
