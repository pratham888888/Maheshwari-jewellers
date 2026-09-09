"""First-run provisioning that must succeed on ANY database, including a fresh
production one. Called from server.py's lifespan, so a brand-new deployment comes
up with a usable admin account, business settings and the standard categories
without anyone running a script by hand.

Every write is idempotent and never clobbers later admin edits:
- settings uses $setOnInsert, so it only writes on first creation
- categories are inserted only when the collection is empty
"""

import logging

from lib.db import db
from models.catalogue import Category, Rates, Settings

logger = logging.getLogger(__name__)

SILVER_CATEGORIES = [
    "Silver Rings", "Silver Chains", "Silver Earrings", "Silver Tops", "Silver Bangles",
    "Silver Bracelets", "Silver Kada", "Silver Payal", "Silver Anklets", "Silver Necklaces",
    "Silver Pendants", "Silver Mangalsutra", "Silver Bridal Jewellery", "Silver Gift Items",
    "Men's Silver Jewellery", "Women's Silver Jewellery", "Silver Coins & Bars",
    "Other Silver Jewellery",
]

GOLD_CATEGORIES = [
    "Gold Rings", "Gold Chains", "Gold Earrings", "Gold Tops", "Gold Bangles",
    "Gold Bracelets", "Gold Kada", "Gold Pendants", "Gold Mangalsutra", "Gold Necklaces",
    "Gold Sets", "Men's Gold Jewellery", "Women's Gold Jewellery", "Gold Bridal Jewellery",
    "Other Gold Jewellery",
]

ABOUT_TEXT = (
    "Maheshwari Jewellers is a jewellery store offering a range of gold and silver jewellery. "
    "We have a special focus on silver jewellery, including Regular Silver, 925 Sterling Silver "
    "and 999 Fine Silver.\n\n"
    "Our collection includes jewellery for men and women, with designs suitable for everyday wear, "
    "gifting, festive occasions and special moments.\n\n"
    "We aim to make it convenient for customers to explore our jewellery collection and enquire "
    "with us directly."
)

DESCRIPTION = (
    "Gold and silver jewellery store in Modinagar, with a special focus on Regular Silver, "
    "925 Sterling Silver and 999 Fine Silver."
)


def slugify(value: str) -> str:
    import re

    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def default_settings() -> Settings:
    return Settings(
        about=ABOUT_TEXT,
        description=DESCRIPTION,
        rates=Rates(
            gold_24k="—", gold_22k="—", silver_999="—", silver_925="—", unit="per 10 gram"
        ),
    )


async def ensure_business_defaults() -> None:
    try:
        await db.settings.update_one(
            {"key": "site"},
            {"$setOnInsert": {"key": "site", **default_settings().model_dump()}},
            upsert=True,
        )

        if await db.categories.count_documents({}) == 0:
            docs = [
                Category(name=name, slug=slugify(name), metal="silver").model_dump()
                for name in SILVER_CATEGORIES
            ] + [
                Category(name=name, slug=slugify(name), metal="gold").model_dump()
                for name in GOLD_CATEGORIES
            ]
            await db.categories.insert_many(docs)
            logger.info("ensure_business_defaults: seeded %d categories", len(docs))

        await migrate_product_categories()
    except Exception as exc:  # never block boot
        logger.error("ensure_business_defaults failed: %s", exc)


async def migrate_product_categories() -> None:
    """Idempotent: copy legacy category string into categories[] without changing ids."""
    cursor = db.products.find(
        {
            "$or": [
                {"categories": {"$exists": False}},
                {"categories": None},
                {"categories": {"$size": 0}, "category": {"$nin": [None, ""]}},
            ]
        },
        {"_id": 0, "id": 1, "category": 1, "categories": 1},
    )
    updated = 0
    async for doc in cursor:
        primary = str(doc.get("category") or "").strip()
        existing = doc.get("categories")
        cats = [str(c).strip() for c in existing] if isinstance(existing, list) else []
        cats = [c for c in cats if c]
        if not cats and primary:
            cats = [primary]
        elif primary and primary not in cats:
            cats = [primary, *cats]
        if not cats:
            continue
        await db.products.update_one(
            {"id": doc["id"]},
            {
                "$set": {
                    "categories": cats,
                    "category": primary or cats[0],
                }
            },
        )
        await db.products.update_one(
            {"id": doc["id"], "rating_count": {"$exists": False}},
            {"$set": {"rating_average": 0.0, "rating_count": 0}},
        )
        updated += 1
    if updated:
        logger.info("migrate_product_categories: normalized %d products", updated)
