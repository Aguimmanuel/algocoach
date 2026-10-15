"""Server-signed Google-only sessions in HttpOnly cookies.

A persistent SECRET_KEY is required before Google sign-in is enabled. Legacy
password tokens are rejected: issuer, audience, expiry and provider are checked.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt

SESSION_COOKIE = "algocoach_session"
ALGORITHM = "HS256"
TOKEN_DAYS = 30

# Random fallback: sessions don't survive a restart, but nothing is insecure.
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
GENERATED_SECRET = not os.getenv("SECRET_KEY")


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(days=TOKEN_DAYS),
               "iss": "algocoach", "aud": "algocoach-web", "auth_provider": "google"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def user_id_from_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM],
                             issuer="algocoach", audience="algocoach-web",
                             options={"require": ["exp", "iat", "sub", "auth_provider"]})
        if payload.get("auth_provider") != "google":
            return None
        user_id = int(payload["sub"])
        return user_id if user_id > 0 else None
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None
