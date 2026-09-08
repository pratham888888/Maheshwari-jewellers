"""Cookie-session admin auth. Sessions live in Mongo; the cookie is httpOnly."""

import hashlib
import logging
import os
import secrets
from datetime import datetime, timezone

from fastapi import Cookie, HTTPException

from lib.db import db

logger = logging.getLogger(__name__)

COOKIE_NAME = "mj_session"


def _admin_username() -> str:
    return os.environ.get("ADMIN_USERNAME", "admin")


def _admin_password() -> str | None:
    # Read at call time so tests / late-loaded env work. Never logged.
    return os.environ.get("ADMIN_PASSWORD")


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def normalize_username(username: str) -> str:
    """Usernames are stored and compared lowercase/trimmed: phone keyboards
    auto-capitalise the first letter, which would otherwise reject a valid login."""
    return username.strip().lower()


def normalize_password(password: str) -> str:
    """Only surrounding whitespace is stripped — copy-pasting a password very often
    drags along a trailing space or newline. Inner characters are untouched."""
    return password.strip()


def session_cookie_params() -> dict:
    """Environment-aware cookie flags for same-origin vs cross-origin (FE/BE split).

    Local same-origin / Vite proxy: COOKIE_SECURE=false, COOKIE_SAMESITE=lax (defaults).
    Production cross-origin (Render static + API): COOKIE_SECURE=true, COOKIE_SAMESITE=none.
    Browsers require Secure when SameSite=None.
    """
    secure = os.environ.get("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")
    samesite = (os.environ.get("COOKIE_SAMESITE") or ("none" if secure else "lax")).lower()
    if samesite not in ("lax", "strict", "none"):
        samesite = "lax"
    if samesite == "none":
        secure = True
    return {
        "httponly": True,
        "samesite": samesite,
        "secure": secure,
        "max_age": 60 * 60 * 24 * 14,
        "path": "/",
    }


async def ensure_default_admin() -> None:
    """Create the initial admin once. Idempotent — never duplicates accounts."""
    username = normalize_username(_admin_username())
    existing = await db.admins.find_one({"username": username})
    if existing:
        return
    password = _admin_password()
    if not password:
        raise RuntimeError(
            "No admin account exists and ADMIN_PASSWORD is not set. "
            "Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment for initial setup."
        )
    salt = secrets.token_hex(8)
    await db.admins.insert_one(
        {
            "username": username,
            "salt": salt,
            "password_hash": hash_password(normalize_password(password), salt),
        }
    )
    logger.info("Provisioned initial admin account for username=%s", username)


async def verify_credentials(username: str, password: str) -> bool:
    admin = await db.admins.find_one({"username": normalize_username(username)})
    if not admin:
        return False
    return hash_password(normalize_password(password), admin["salt"]) == admin["password_hash"]


async def set_password(username: str, new_password: str) -> None:
    """Rotate an admin password. Only the salted hash is ever stored."""
    salt = secrets.token_hex(8)
    await db.admins.update_one(
        {"username": normalize_username(username)},
        {
            "$set": {
                "salt": salt,
                "password_hash": hash_password(normalize_password(new_password), salt),
            }
        },
    )


async def create_session(username: str) -> str:
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one(
        {
            "token": token,
            "username": normalize_username(username),
            "created_at": datetime.now(timezone.utc),
        }
    )
    return token


async def destroy_session(token: str) -> None:
    await db.sessions.delete_one({"token": token})


async def require_admin(mj_session: str | None = Cookie(default=None)) -> str:
    """FastAPI dependency: 401 unless the request carries a valid admin session cookie."""
    if not mj_session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.sessions.find_one({"token": mj_session})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    return str(session["username"])
