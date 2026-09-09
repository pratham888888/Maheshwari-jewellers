"""Shared Mongo handle — import `client`/`db` from here (server.py, routers, seed.py)."""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel

load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

_mongo_url = os.environ.get("MONGO_URL", "").strip()
_db_name = os.environ.get("DB_NAME", "").strip()

if not _mongo_url:
    logger.error("MONGO_URL is not set. Add it to backend/.env or the process environment.")
    sys.exit("FATAL: MONGO_URL environment variable is required")
if not _db_name:
    logger.error("DB_NAME is not set. Add it to backend/.env or the process environment.")
    sys.exit("FATAL: DB_NAME environment variable is required")

mongo_url = _mongo_url
client = AsyncIOMotorClient(mongo_url)
db = client[_db_name]

# One entry per collection: every field a route filters, sorts, or dedupes on. Applied by ensure_indexes() at startup.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [IndexModel([("timestamp", DESCENDING)], name="timestamp_desc")],
    "products": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("sku", ASCENDING)], name="sku"),
        IndexModel([("published", ASCENDING), ("created_at", DESCENDING)], name="pub_created"),
        IndexModel([("metal", ASCENDING), ("purity", ASCENDING)], name="metal_purity"),
        IndexModel([("gender", ASCENDING)], name="gender"),
        IndexModel([("category", ASCENDING)], name="category"),
        IndexModel([("categories", ASCENDING)], name="categories"),
    ],
    "categories": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("slug", ASCENDING)], name="slug", unique=True),
    ],
    "sessions": [
        IndexModel([("token", ASCENDING)], name="token", unique=True),
        IndexModel([("created_at", ASCENDING)], name="ttl", expireAfterSeconds=60 * 60 * 24 * 14),
    ],
    "admins": [IndexModel([("username", ASCENDING)], name="username", unique=True)],
    "settings": [IndexModel([("key", ASCENDING)], name="key", unique=True)],
    "reviews": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("product_id", ASCENDING), ("created_at", DESCENDING)], name="product_created"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logger.error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)


async def ping_database() -> bool:
    """Return True if MongoDB responds to ping."""
    try:
        await client.admin.command("ping")
        return True
    except Exception as exc:
        logger.warning("MongoDB ping failed: %s", exc)
        return False
