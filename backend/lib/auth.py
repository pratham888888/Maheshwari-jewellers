"""Cookie-session admin auth. Sessions live in Mongo; the cookie is httpOnly."""

import hashlib
import os
import secrets
from datetime import datetime, timezone

from fastapi import Cookie, HTTPException

from lib.db import db

COOKIE_NAME = "mj_session"
DEFAULT_ADMIN_USER = os.environ.get("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_PASS = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


async def ensure_default_admin() -> None:
    existing = await db.admins.find_one({"username": DEFAULT_ADMIN_USER})
    if existing:
        return
    salt = secrets.token_hex(8)
    await db.admins.insert_one(
        {
            "username": DEFAULT_ADMIN_USER,
            "salt": salt,
            "password_hash": hash_password(DEFAULT_ADMIN_PASS, salt),
        }
    )


async def verify_credentials(username: str, password: str) -> bool:
    admin = await db.admins.find_one({"username": username})
    if not admin:
        return False
    return hash_password(password, admin["salt"]) == admin["password_hash"]


async def set_password(username: str, new_password: str) -> None:
    """Rotate an admin password. Only the salted hash is ever stored."""
    salt = secrets.token_hex(8)
    await db.admins.update_one(
        {"username": username},
        {"$set": {"salt": salt, "password_hash": hash_password(new_password, salt)}},
    )


async def create_session(username: str) -> str:
    token = secrets.token_urlsafe(32)
    await db.sessions.insert_one(
        {"token": token, "username": username, "created_at": datetime.now(timezone.utc)}
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
