"""Passwords and session tokens.

Passwords are hashed with Argon2id (the current default recommendation) and
tokens are signed JWTs. Both are small enough to do directly rather than pulling
in an auth framework.

One deployment note: if SECRET_KEY is not set we generate a random one at boot.
That is safe — it just means every server restart invalidates existing sessions,
which on Render happens on each deploy. Set SECRET_KEY in the environment to
keep people signed in.
"""

from __future__ import annotations

import os
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError

ALGORITHM = "HS256"
TOKEN_DAYS = 30

_ph = PasswordHasher()

# Random fallback: sessions don't survive a restart, but nothing is insecure.
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
GENERATED_SECRET = not os.getenv("SECRET_KEY")


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        _ph.verify(password_hash, password)
        return True
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": str(user_id), "iat": now, "exp": now + timedelta(days=TOKEN_DAYS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def user_id_from_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        return None


def check_password_strength(password: str) -> str | None:
    """Return a human-readable problem, or None if the password is acceptable.

    Deliberately only length. Composition rules push people towards predictable
    substitutions; length is the part that actually helps.
    """
    if len(password) < 8:
        return "Use at least 8 characters."
    if len(password) > 200:
        return "That password is too long."
    return None
