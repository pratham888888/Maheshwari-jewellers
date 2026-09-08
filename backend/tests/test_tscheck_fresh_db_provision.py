"""Criterion: a fresh/production-style database self-provisions a working admin
account, business settings and 33 categories on boot, and the normalized
credentials work for both the exact-cased and auto-capitalised username. Runs
against a temporary database (never the 'app' database) and is idempotent."""

import os

import pytest
import pytest_asyncio
from motor.motor_asyncio import AsyncIOMotorClient

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")
TEMP_DB_NAME = "tscheck_fresh_provision_db"


@pytest_asyncio.fixture
async def temp_db():
    """Points lib.db/lib.auth/lib.bootstrap at a throwaway database for the
    duration of the test, then restores the real handle and drops the temp db."""
    import lib.auth as auth_mod
    import lib.bootstrap as bootstrap_mod
    import lib.db as db_mod

    mongo_url = os.environ["MONGO_URL"]
    client = AsyncIOMotorClient(mongo_url)
    temp = client[TEMP_DB_NAME]

    original_db = db_mod.db
    db_mod.db = temp
    auth_mod.db = temp
    bootstrap_mod.db = temp
    try:
        yield temp
    finally:
        db_mod.db = original_db
        auth_mod.db = original_db
        bootstrap_mod.db = original_db
        await client.drop_database(TEMP_DB_NAME)
        client.close()


@pytest.mark.asyncio
async def test_fresh_database_self_provisions_admin(temp_db):
    import lib.auth as auth_mod
    import lib.bootstrap as bootstrap_mod
    import lib.db as db_mod

    # First boot on a brand-new database
    await db_mod.ensure_indexes()
    await auth_mod.ensure_default_admin()
    await bootstrap_mod.ensure_business_defaults()

    admins = await temp_db.admins.find().to_list(length=10)
    assert len(admins) == 1, f"expected exactly one admin, got {len(admins)}"
    assert admins[0]["username"] == "admin", "username must be stored lowercase"

    assert await auth_mod.verify_credentials("Admin", ADMIN_PASSWORD) is True
    assert await auth_mod.verify_credentials("admin", ADMIN_PASSWORD) is True
    assert await auth_mod.verify_credentials("admin", "wrong") is False

    settings_doc = await temp_db.settings.find_one({"key": "site"})
    assert settings_doc is not None, "expected a settings document to be seeded"

    categories = await temp_db.categories.find().to_list(length=100)
    assert len(categories) == 33, f"expected 33 seeded categories, got {len(categories)}"

    # Re-run everything: must stay idempotent
    await db_mod.ensure_indexes()
    await auth_mod.ensure_default_admin()
    await bootstrap_mod.ensure_business_defaults()

    admins_after = await temp_db.admins.find().to_list(length=10)
    assert len(admins_after) == 1, f"expected still exactly one admin, got {len(admins_after)}"

    categories_after = await temp_db.categories.find().to_list(length=100)
    assert len(categories_after) == 33, f"expected still 33 categories, got {len(categories_after)}"
