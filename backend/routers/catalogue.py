"""Public catalogue routes — products, categories, settings/rates (read-only)."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.catalogue import Category, Product, ProductPage, Settings

router = APIRouter()


def _aware(doc: dict) -> dict:
    for key in ("created_at", "updated_at"):
        value = doc.get(key)
        if isinstance(value, datetime) and value.tzinfo is None:
            doc[key] = value.replace(tzinfo=timezone.utc)
    return doc


async def load_settings() -> Settings:
    doc = await db.settings.find_one({"key": "site"})
    if not doc:
        return Settings()
    doc.pop("_id", None)
    doc.pop("key", None)
    return Settings(**doc)


def build_query(
    metal: Optional[str],
    purity: Optional[str],
    gender: Optional[str],
    category: Optional[str],
    availability: Optional[str],
    featured: Optional[bool],
    new_arrival: Optional[bool],
    search: Optional[str],
    min_price: Optional[float],
    max_price: Optional[float],
    published_only: bool,
) -> dict:
    query: dict = {}
    if published_only:
        query["published"] = True
    if metal:
        query["metal"] = metal
    if purity:
        query["purity"] = purity
    if gender:
        query["gender"] = gender
    if category:
        query["category"] = category
    if availability:
        query["availability"] = availability
    if featured is not None:
        query["featured"] = featured
    if new_arrival is not None:
        query["new_arrival"] = new_arrival
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]
    price_filter: dict = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        query["price"] = price_filter
    return query


@router.get("/products", response_model=ProductPage)
async def list_products(
    metal: Optional[str] = None,
    purity: Optional[str] = None,
    gender: Optional[str] = None,
    category: Optional[str] = None,
    availability: Optional[str] = None,
    featured: Optional[bool] = None,
    new_arrival: Optional[bool] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: str = "newest",
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100),
):
    query = build_query(
        metal, purity, gender, category, availability,
        featured, new_arrival, search, min_price, max_price, True,
    )
    sort_spec = {"newest": [("created_at", -1)], "name": [("name", 1)]}.get(
        sort, [("created_at", -1)]
    )
    total = await db.products.count_documents(query)
    cursor = db.products.find(query, {"_id": 0}).sort(sort_spec).skip((page - 1) * page_size).limit(page_size)
    docs = await cursor.to_list(page_size)
    return ProductPage(
        items=[Product(**_aware(d)) for d in docs], total=total, page=page, page_size=page_size
    )


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**_aware(doc))


@router.get("/categories", response_model=list[Category])
async def list_categories(metal: Optional[str] = None):
    query: dict = {}
    if metal:
        query["metal"] = {"$in": [metal, "both"]}
    docs = await db.categories.find(query, {"_id": 0}).sort([("name", 1)]).to_list(300)
    return [Category(**d) for d in docs]


@router.get("/settings", response_model=Settings)
async def get_settings():
    return await load_settings()
