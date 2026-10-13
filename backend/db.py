"""Database wiring.

One engine for both environments, chosen by DATABASE_URL:

    dev  → sqlite:///./algocoach.db           (no setup, no server needed)
    prod → postgresql+psycopg://…             (Aiven, in production)

Nothing in the app is aware of which one is running. The only place the
difference leaks is JSON columns, which SQLAlchemy handles on both.
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# Default to a local file so `uvicorn main:app` works with zero configuration.
DEFAULT_SQLITE = f"sqlite:///{Path(__file__).with_name('algocoach.db')}"


def _normalise(url: str) -> str:
    """Accept the URL exactly as Aiven hands it to you.

    Aiven shows `postgres://user:pass@host:port/db?sslmode=require`. SQLAlchemy
    needs a driver in the scheme, and the old `postgres://` alias was removed in
    SQLAlchemy 2 — so fix both up rather than making the user edit it.
    """
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DATABASE_URL = _normalise(os.getenv("DATABASE_URL") or DEFAULT_SQLITE)
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# pool_pre_ping keeps the app alive when Aiven drops an idle connection, which
# managed Postgres does routinely. Without it the first request after a quiet
# spell fails for no visible reason.
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
    connect_args={"check_same_thread": False} if IS_SQLITE else {},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — one session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables if they don't exist.

    Deliberately not Alembic. There is one schema and one deploy; migrations
    would be ceremony. When the schema starts changing, add Alembic then.
    """
    import models  # noqa: F401  (importing registers the tables)
    Base.metadata.create_all(bind=engine)
