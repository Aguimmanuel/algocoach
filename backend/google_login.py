"""Google-only web-server OAuth. No Google tokens or app JWTs reach JavaScript.

Only identity scopes are requested. Google sign-in never accesses Gemini.
The userinfo endpoint is called with a server-exchanged access token over TLS;
we do not accept client-supplied profiles or decode unverified ID tokens.
"""
from __future__ import annotations

import base64
import hashlib
import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlsplit

import httpx
import jwt
from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from starlette.responses import JSONResponse, RedirectResponse

import security
from accounts import _ensure_progress, log, optional_user
from db import get_db
from models import GoogleIdentity, User, utcnow

class OAuthQueryFilter(logging.Filter):
    """Do not put one-time Google codes/state into Uvicorn access logs."""
    def filter(self, record):
        if isinstance(record.args, tuple) and len(record.args) == 5:
            args=list(record.args)
            if isinstance(args[2],str) and args[2].startswith("/api/auth/google/") and "?" in args[2]:
                args[2]=args[2].split("?",1)[0]+"?[redacted]"
                record.args=tuple(args)
        return True

logging.getLogger("uvicorn.access").addFilter(OAuthQueryFilter())

router = APIRouter(prefix="/api/auth", tags=["Google sign-in"])
STATE_COOKIE = "algocoach_google_state"
AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo"


def settings() -> tuple[str, str, str]:
    return tuple(os.getenv(name, "").strip() for name in (
        "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI"
    ))


def configured() -> bool:
    client_id, client_secret, redirect = settings()
    parsed = urlsplit(redirect)
    valid_scheme = parsed.scheme == "https" or (
        parsed.scheme == "http" and parsed.hostname in {"localhost", "127.0.0.1"}
    )
    return bool(client_id and client_secret and not security.GENERATED_SECRET and
                valid_scheme and parsed.hostname and not parsed.username and
                not parsed.query and not parsed.fragment and
                parsed.path == "/api/auth/google/callback")


def secure_cookie() -> bool:
    return urlsplit(settings()[2]).scheme == "https"


def safe_next(value: str) -> str:
    return value if re.fullmatch(
        r"#(?:today|courses|path|library|coach|visualize|cheat|progress|"
        r"course/[a-z0-9-]+|lesson/[a-z0-9-]+|learn/[a-z0-9-]+/[a-z0-9-]+)", value
    ) else "#today"


@router.get("/config")
def auth_config():
    return {"provider": "google", "configured": configured(), "coach_mode": "offline"}


@router.get("/google/start")
def start(next: str = "#today"):
    if not configured():
        return RedirectResponse("/?auth_error=not_configured", status_code=303)
    client_id, _, redirect = settings()
    state, verifier = secrets.token_urlsafe(32), secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    now = datetime.now(timezone.utc)
    binding = jwt.encode({"kind": "google-state", "state": state, "verifier": verifier,
                          "next": safe_next(next), "iat": now, "exp": now + timedelta(minutes=10)},
                         security.SECRET_KEY, algorithm=security.ALGORITHM)
    query = urlencode({"client_id": client_id, "redirect_uri": redirect,
                       "response_type": "code", "scope": "openid email profile",
                       "state": state, "code_challenge": challenge,
                       "code_challenge_method": "S256", "prompt": "select_account"})
    response = RedirectResponse(AUTH_ENDPOINT + "?" + query, status_code=303)
    response.set_cookie(STATE_COOKIE, binding, max_age=600, httponly=True,
                        secure=secure_cookie(), samesite="lax", path="/api/auth/google")
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


class LoginFailure(Exception):
    pass


async def exchange_code(code: str, verifier: str) -> dict:
    """Production transport. Browser tests replace this function in a test-only app."""
    client_id, client_secret, redirect = settings()
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
        response = await client.post(TOKEN_ENDPOINT, data={
            "client_id": client_id, "client_secret": client_secret,
            "redirect_uri": redirect, "code": code, "code_verifier": verifier,
            "grant_type": "authorization_code",
        })
        response.raise_for_status()
        token = response.json().get("access_token")
        if not isinstance(token, str) or not token:
            raise LoginFailure("provider_error")
        profile = await client.get(USERINFO_ENDPOINT, headers={"Authorization": f"Bearer {token}"})
        profile.raise_for_status()
        return profile.json()


def google_user(db: Session, profile: dict) -> User:
    subject, email = profile.get("sub"), profile.get("email")
    if (profile.get("email_verified") is not True or not isinstance(subject, str)
            or not 1 <= len(subject) <= 255 or not isinstance(email, str)
            or "@" not in email or len(email) > 255):
        raise LoginFailure("unverified_account")
    email = email.strip().lower()
    identity = db.execute(select(GoogleIdentity).where(GoogleIdentity.google_sub == subject)).scalar_one_or_none()
    existing_email = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if identity:
        user = db.get(User, identity.user_id)
        if user is None or (existing_email and existing_email.id != user.id):
            raise LoginFailure("account_conflict")
        user.email = email
    else:
        # Never attach a Google identity to a legacy password account merely
        # because email strings match. Preserve that account for explicit migration.
        if existing_email:
            raise LoginFailure("account_conflict")
        user = User(email=email, password_hash="GOOGLE_ONLY_NO_PASSWORD", display_name="")
        db.add(user)
        db.flush()
        db.add(GoogleIdentity(user_id=user.id, google_sub=subject))
        _ensure_progress(db, user)
        log(db, user.id, "signup", provider="google")
    name = profile.get("name")
    if isinstance(name, str):
        user.display_name = name.strip()[:80]
    user.last_seen_at = utcnow()
    log(db, user.id, "login", provider="google")
    db.commit()
    return user


@router.get("/google/callback")
async def callback(request: Request, db: Session = Depends(get_db)):
    next_route = "#today"
    error = "invalid_session"
    try:
        if not configured():
            raise LoginFailure("not_configured")
        payload = jwt.decode(request.cookies.get(STATE_COOKIE, ""), security.SECRET_KEY,
                             algorithms=[security.ALGORITHM], options={"require": ["exp", "iat"]})
        state = request.query_params.get("state", "")
        if (payload.get("kind") != "google-state" or not state or
                not isinstance(payload.get("state"), str) or
                not secrets.compare_digest(state, payload["state"])):
            raise LoginFailure("invalid_session")
        next_route = safe_next(payload.get("next", ""))
        if request.query_params.get("error"):
            raise LoginFailure("cancelled")
        code = request.query_params.get("code", "")
        if not code or len(code) > 4096:
            raise LoginFailure("provider_error")
        profile = await exchange_code(code, payload["verifier"])
        if not isinstance(profile, dict):
            raise LoginFailure("provider_error")
        try:
            user = google_user(db, profile)
        except IntegrityError:
            db.rollback()
            # A simultaneous callback for the SAME verified subject may have won.
            identity = db.execute(select(GoogleIdentity).where(GoogleIdentity.google_sub == profile.get("sub"))).scalar_one_or_none()
            if not identity:
                raise LoginFailure("account_conflict")
            user = db.get(User, identity.user_id)
            if user is None:
                raise LoginFailure("account_conflict")
        response = RedirectResponse("/" + next_route, status_code=303)
        response.set_cookie(security.SESSION_COOKIE, security.create_token(user.id),
                            max_age=security.TOKEN_DAYS * 86400, httponly=True,
                            secure=secure_cookie(), samesite="lax", path="/")
    except LoginFailure as exc:
        error = str(exc)
        db.rollback()
        response = RedirectResponse("/?" + urlencode({"auth_error": error}) + next_route, status_code=303)
    except jwt.PyJWTError:
        db.rollback()
        response = RedirectResponse("/?auth_error=invalid_session" + next_route, status_code=303)
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        db.rollback()
        response = RedirectResponse("/?auth_error=provider_error" + next_route, status_code=303)
    response.delete_cookie(STATE_COOKIE, path="/api/auth/google", secure=secure_cookie(), httponly=True, samesite="lax")
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


@router.post("/logout")
def logout(request: Request, db: Session = Depends(get_db)):
    user = optional_user(request, db)
    if user:
        log(db, user.id, "logout")
        db.commit()
    response = JSONResponse({"ok": True})
    response.delete_cookie(security.SESSION_COOKIE, path="/", secure=secure_cookie(), httponly=True, samesite="lax")
    return response
