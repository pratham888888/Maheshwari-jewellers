"""Criterion: hiding (unpublishing) a product removes it from public catalogue/search
but keeps it in admin list; deleting removes it entirely."""

import os
import uuid

import pytest

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")


@pytest.fixture
def admin_client(client):
    resp = client.post(
        "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert resp.status_code == 200, resp.text
    yield client


def test_hide_then_delete_product(admin_client):
    suffix = uuid.uuid4().hex[:8]
    name = f"tscheck-hide-{suffix}"

    create_resp = admin_client.post(
        "/admin/products",
        json={
            "name": name,
            "sku": f"TSCHECK-HD-{suffix}",
            "metal": "gold",
            "purity": "22K",
            "category": "Gold Rings",
            "weight": "3 g",
            "price": 5000,
            "price_type": "exact",
            "published": True,
        },
    )
    assert create_resp.status_code in (200, 201), create_resp.text
    product_id = create_resp.json()["id"]

    # visible publicly while published
    pub = admin_client.get(f"/products/{product_id}")
    assert pub.status_code == 200, pub.text

    # hide it
    hide_resp = admin_client.put(
        f"/admin/products/{product_id}",
        json={
            "name": name,
            "sku": f"TSCHECK-HD-{suffix}",
            "metal": "gold",
            "purity": "22K",
            "category": "Gold Rings",
            "weight": "3 g",
            "price": 5000,
            "price_type": "exact",
            "published": False,
        },
    )
    assert hide_resp.status_code == 200, hide_resp.text
    assert hide_resp.json()["published"] is False

    # still present in admin list
    admin_list = admin_client.get("/admin/products")
    assert admin_list.status_code == 200
    admin_ids = [p["id"] for p in admin_list.json().get("items", admin_list.json())]
    assert product_id in admin_ids

    # gone from public detail (404/unavailable) and public search
    pub_after = admin_client.get(f"/products/{product_id}")
    assert pub_after.status_code == 404, pub_after.text

    search_resp = admin_client.get("/products", params={"search": name})
    ids_found = [p["id"] for p in search_resp.json()["items"]]
    assert product_id not in ids_found

    # now delete entirely
    del_resp = admin_client.delete(f"/admin/products/{product_id}")
    assert del_resp.status_code in (200, 204), del_resp.text

    admin_list_after = admin_client.get("/admin/products")
    ids_after = [p["id"] for p in admin_list_after.json().get("items", admin_list_after.json())]
    assert product_id not in ids_after
