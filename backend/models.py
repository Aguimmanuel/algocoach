"""Tables.

Three of them, and the shape is deliberate:

  User          — an account. Optional: the app works fully without one.
  Progress      — one row per user holding what they have learned and solved.
  ActivityEvent — an append-only log of what the learner actually did.

Progress is a single denormalised row rather than a row per pattern, because the
client sends its whole state on every change. At this size that is one small
write instead of a diffing algorithm, and it cannot drift out of sync.

ActivityEvent is what makes "track users' activities" real: streaks are computed
from it, and it is the raw material for seeing where a learner gets stuck.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    progress: Mapped["Progress"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class Progress(Base):
    __tablename__ = "progress"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    # ["dp", "bfs", …] — pattern ids the learner marked as learned
    learned: Mapped[list] = mapped_column(JSON, default=list)
    # ["sliding-window::Longest Substring…", …] — practice problems solved
    solved: Mapped[list] = mapped_column(JSON, default=list)
    # Practice attempts that were answered wrong, so review can target them
    shaky: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow
    )

    user: Mapped[User] = relationship(back_populates="progress")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # signup | login | learned | unlearned | solved | unsolved
    # | coach_run | solution_reveal | quiz | visit
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    __table_args__ = (
        # Streaks and the activity feed both read "this user, newest first".
        Index("ix_events_user_created", "user_id", "created_at"),
        Index("ix_events_kind", "kind"),
    )


class Feedback(Base):
    """Free-text notes. The thing a learner writes when the app got it wrong."""

    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
