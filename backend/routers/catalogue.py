"""Public catalogue routes — products, categories, settings/rates, reviews."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from lib.db import db
from models.catalogue import (
    Category,
    Product,
    ProductPage,
    Review,
    ReviewCreate,
    ReviewPage,
    Settings,
)

router = APIRouter()


def _aware(doc: dict) -> dict:
    for key in ("created_at", "updated_at"):
        value = doc.get(key)
        if isinstance(value, datetime) and value.tzinfo is None:
            doc[key] = value.replace(tzinfo=timezone.utc)
    return doc


def _normalize_product_doc(doc: dict) -> dict:
    """Ensure categories[] exists for legacy single-category documents."""
    cats = doc.get("categories")
    if not isinstance(cats, list):
        cats = []
    cats = [str(c).strip() for c in cats if str(c).strip()]
    primary = str(doc.get("category") or "").strip()
    if not cats and primary:
        cats = [primary]
    if primary and primary not in cats:
        cats = [primary, *cats]
    if cats and not primary:
        primary = cats[0]
    doc["categories"] = cats
    doc["category"] = primary
    doc.setdefault("rating_average", 0.0)
    doc.setdefault("rating_count", 0)
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
    and_clauses: list[dict] = []

    if published_only:
        query["published"] = True
    if metal:
        query["metal"] = metal
    if purity:
        query["purity"] = purity
    if gender:
        query["gender"] = gender
    if availability:
        query["availability"] = availability
    if featured is not None:
        query["featured"] = featured
    if new_arrival is not None:
        query["new_arrival"] = new_arrival

    if category:
        # Match legacy single field OR multi-category array (one product, never duplicated).
        and_clauses.append(
            {
                "$or": [
                    {"category": category},
                    {"categories": category},
                ]
            }
        )

    if search:
        and_clauses.append(
            {
                "$or": [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"sku": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"category": {"$regex": search, "$options": "i"}},
                    {"categories": {"$regex": search, "$options": "i"}},
                ]
            }
        )

    price_filter: dict = {}
    if min_price is not None:
        price_filter["$gte"] = min_price
    if max_price is not None:
        price_filter["$lte"] = max_price
    if price_filter:
        query["price"] = price_filter

    if and_clauses:
        query["$and"] = and_clauses
    return query


async def refresh_product_rating_summary(product_id: str) -> None:
    pipeline = [
        {"$match": {"product_id": product_id}},
        {
            "$group": {
                "_id": "$product_id",
                "count": {"$sum": 1},
                "average": {"$avg": "$rating"},
            }
        },
    ]
    rows = await db.reviews.aggregate(pipeline).to_list(1)
    if not rows:
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"rating_average": 0.0, "rating_count": 0}},
        )
        return
    average = float(rows[0]["average"] or 0)
    count = int(rows[0]["count"] or 0)
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"rating_average": round(average, 2), "rating_count": count}},
    )


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
        items=[Product(**_aware(_normalize_product_doc(d))) for d in docs],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**_aware(_normalize_product_doc(doc)))


@router.get("/products/{product_id}/reviews", response_model=ReviewPage)
async def list_reviews(
    product_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
):
    product = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0, "id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    query = {"product_id": product_id}
    total = await db.reviews.count_documents(query)
    docs = (
        await db.reviews.find(query, {"_id": 0})
        .sort([("created_at", -1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(page_size)
    )
    average = 0.0
    if total:
        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "average": {"$avg": "$rating"}}},
        ]
        rows = await db.reviews.aggregate(pipeline).to_list(1)
        average = round(float(rows[0]["average"]), 2) if rows else 0.0
    items = []
    for d in docs:
        if isinstance(d.get("created_at"), datetime) and d["created_at"].tzinfo is None:
            d["created_at"] = d["created_at"].replace(tzinfo=timezone.utc)
        items.append(Review(**d))
    return ReviewPage(items=items, total=total, average=average, count=total)


@router.post("/products/{product_id}/reviews", response_model=Review)
async def create_review(product_id: str, payload: ReviewCreate):
    product = await db.products.find_one({"id": product_id, "published": True}, {"_id": 0, "id": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=422, detail="Rating must be between 1 and 5")
    review = Review(
        product_id=product_id,
        rating=payload.rating,
        text=payload.text[:2000],
        reviewer_name=(payload.reviewer_name or "Customer")[:80],
    )
    await db.reviews.insert_one(review.model_dump())
    await refresh_product_rating_summary(product_id)
    return review


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
