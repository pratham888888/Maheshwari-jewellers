"""Idempotent seed: categories, demo products, default settings/rates. Run: python seed.py"""

import asyncio

from lib.auth import ensure_default_admin
from lib.bootstrap import ensure_business_defaults
from lib.db import db, ensure_indexes
from models.catalogue import Product

IMG = {
    "silver_set": "https://images.unsplash.com/photo-1697713465161-d872b22723a2?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "silver_ring": "https://images.unsplash.com/photo-1583937443566-6fe1a1c6e400?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "silver_bridal": "https://images.unsplash.com/photo-1744822220368-c380740bfc7f?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "silver_daily": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "gold_earrings": "https://images.unsplash.com/photo-1651160670627-2896ddf7822f?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "gold_necklace": "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "gold_set": "https://images.unsplash.com/photo-1721807644561-9efcabee5c42?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "silver_bars": "https://images.unsplash.com/photo-1720637594911-fb18f28eb913?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
    "silver_coins": "https://images.unsplash.com/photo-1623743558917-37d9ab9e3b34?crop=entropy&cs=srgb&fm=jpg&w=900&q=80",
}


DEMO_PRODUCTS = [
    dict(name="DEMO Silver Ring – 925 Sterling", sku="DEMO-SR-925", metal="silver", purity="925",
         category="Silver Rings", weight="4.2 g", price=1850.0, price_type="exact",
         gender="women", finish="High Polish", stone_details="Cubic zirconia accents",
         size="Adjustable", featured=True, new_arrival=True,
         description="Sample product for testing. A 925 sterling silver band with a delicate stone setting, suitable for daily wear.",
         images=[IMG["silver_ring"], IMG["silver_set"]]),
    dict(name="DEMO Silver Chain – 925 Sterling", sku="DEMO-SC-925", metal="silver", purity="925",
         category="Silver Chains", weight="12.8 g", price=None, price_type="contact",
         gender="unisex", finish="Rhodium Polish", size="20 inch", featured=True,
         description="Sample product for testing. A classic 925 sterling silver chain, available in multiple lengths.",
         images=[IMG["silver_daily"]]),
    dict(name="DEMO Silver Payal (Regular Silver)", sku="DEMO-PY-REG", metal="silver",
         purity="regular", category="Silver Payal", weight="48 g", price=None,
         price_type="on_request", gender="women", finish="Oxidised", new_arrival=True,
         description="Sample product for testing. Traditional silver payal with ghungroo detailing.",
         images=[IMG["silver_set"]]),
    dict(name="DEMO 999 Fine Silver Coin – 10g", sku="DEMO-999-COIN", metal="silver", purity="999",
         category="Silver Coins & Bars", weight="10 g", price=1150.0, price_type="exact",
         gender="unisex", finish="Mirror Finish", featured=True,
         description="Sample product for testing. 999 fine silver coin, suitable for gifting and puja occasions.",
         images=[IMG["silver_coins"], IMG["silver_bars"]]),
    dict(name="DEMO Gold Ring – 22K", sku="DEMO-GR-22K", metal="gold", purity="22K",
         category="Gold Rings", weight="3.1 g", price=None, price_type="contact",
         gender="men", finish="Matte & Polish", size="18",
         description="Sample product for testing. A 22K gold ring with a clean contemporary profile.",
         images=[IMG["gold_set"]]),
    dict(name="DEMO Gold Chain – 22K", sku="DEMO-GC-22K", metal="gold", purity="22K",
         category="Gold Chains", weight="9.6 g", price=None, price_type="on_request",
         gender="unisex", finish="High Polish", new_arrival=True, featured=True,
         description="Sample product for testing. A 22K gold chain suitable for everyday and festive wear.",
         images=[IMG["gold_necklace"], IMG["gold_earrings"]]),
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


async def main() -> None:
    await ensure_indexes()
    await ensure_default_admin()
    await ensure_business_defaults()

    for spec in DEMO_PRODUCTS:
        if await db.products.find_one({"sku": spec["sku"]}):
            continue
        images = [{"url": u, "alt": f"{spec['name']} - Maheshwari Jewellers"} for u in spec.pop("images")]
        product = Product(**spec, images=images, is_demo=True, published=True)
        await db.products.insert_one(product.model_dump())

    if not await db.settings.find_one({"key": "site"}):
        await ensure_business_defaults()

    # Contact details and trading hours are authoritative business facts: re-apply them
    # on every seed run so an existing settings document is migrated too.
    await db.settings.update_one(
        {"key": "site"},
        {
            "$set": {
                "phone": "9837149835",
                "whatsapp": "919837149835",
                "opening_hours": "10:00 AM – 8:00 PM",
                "closed_days": "Tuesday",
            }
        },
        upsert=True,
    )

    print("seed complete:", await db.products.count_documents({}), "products,",
          await db.categories.count_documents({}), "categories")


if __name__ == "__main__":
    asyncio.run(main())
