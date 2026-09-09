"""Tests for multi-category products and reviews."""

import os
import uuid

import httpx
import pytest

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "MaheshAdmin2026")


@pytest.fixture
def authed(client: httpx.Client):
    r = client.post("/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return client


def test_multi_category_create_and_filter(authed: httpx.Client):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"Multi Cat Chain {suffix}",
        "sku": f"MC-{suffix}",
        "metal": "silver",
        "purity": "925",
        "category": "Silver Chains",
        "categories": ["Silver Chains", "Men's Silver Jewellery", "Other Silver Jewellery"],
        "weight": "10 g",
        "price_type": "on_request",
        "published": True,
        "images": [],
    }
    r = authed.post("/admin/products", json=payload)
    assert r.status_code == 200, r.text
    prod = r.json()
    pid = prod["id"]
    assert set(prod["categories"]) >= {"Silver Chains", "Men's Silver Jewellery"}
    assert prod["category"] in prod["categories"]

    for cat in payload["categories"]:
        page = authed.get("/products", params={"category": cat, "search": suffix})
        assert page.status_code == 200
        ids = [p["id"] for p in page.json()["items"]]
        assert pid in ids
        assert ids.count(pid) == 1

    # cleanup
    assert authed.delete(f"/admin/products/{pid}").status_code == 200


def test_legacy_single_category_still_filters(authed: httpx.Client):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "name": f"Legacy Cat Ring {suffix}",
        "sku": f"LC-{suffix}",
        "metal": "gold",
        "purity": "22K",
        "category": "Gold Rings",
        "categories": [],
        "price_type": "contact",
        "published": True,
        "images": [],
    }
    r = authed.post("/admin/products", json=payload)
    assert r.status_code == 200
    prod = r.json()
    assert "Gold Rings" in prod["categories"]
    page = authed.get("/products", params={"category": "Gold Rings", "search": suffix})
    assert prod["id"] in [p["id"] for p in page.json()["items"]]
    authed.delete(f"/admin/products/{prod['id']}")


def test_review_create_and_average_display_rule(authed: httpx.Client):
    suffix = uuid.uuid4().hex[:8]
    r = authed.post(
        "/admin/products",
        json={
            "name": f"Reviewable Item {suffix}",
            "sku": f"RV-{suffix}",
            "metal": "silver",
            "purity": "925",
            "category": "Silver Rings",
            "categories": ["Silver Rings"],
            "published": True,
            "images": [],
            "price_type": "on_request",
        },
    )
    assert r.status_code == 200
    pid = r.json()["id"]

    # no reviews
    detail = authed.get(f"/products/{pid}").json()
    assert detail["rating_count"] == 0
    reviews = authed.get(f"/products/{pid}/reviews").json()
    assert reviews["count"] == 0
    assert reviews["average"] == 0

    # invalid rating
    bad = authed.post(f"/products/{pid}/reviews", json={"rating": 0, "text": "bad"})
    assert bad.status_code == 422

    # low average (<=3) — still stored, product summary updated
    assert authed.post(f"/products/{pid}/reviews", json={"rating": 2, "text": "ok", "reviewer_name": "A"}).status_code == 200
    assert authed.post(f"/products/{pid}/reviews", json={"rating": 3, "text": "meh", "reviewer_name": "B"}).status_code == 200
    detail = authed.get(f"/products/{pid}").json()
    assert detail["rating_count"] == 2
    assert detail["rating_average"] <= 3

    # push average above 3
    assert authed.post(f"/products/{pid}/reviews", json={"rating": 5, "text": "great", "reviewer_name": "C"}).status_code == 200
    assert authed.post(f"/products/{pid}/reviews", json={"rating": 5, "text": "love", "reviewer_name": "D"}).status_code == 200
    detail = authed.get(f"/products/{pid}").json()
    assert detail["rating_count"] == 4
    assert detail["rating_average"] > 3

    page = authed.get("/admin/reviews", params={"product_id": pid}).json()
    assert page["total"] >= 4
    rid = page["items"][0]["id"]
    assert authed.delete(f"/admin/reviews/{rid}").status_code == 200

    authed.delete(f"/admin/products/{pid}")
