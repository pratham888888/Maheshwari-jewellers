"""Criterion: admin can create a product and edit its name/description/price/category,
and the change is visible on the public site (GET /api/products/{id})."""

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


def test_create_edit_product_visible_publicly(admin_client):
    suffix = uuid.uuid4().hex[:8]
    name = f"tscheck-product-{suffix}"

    create_resp = admin_client.post(
        "/admin/products",
        json={
            "name": name,
            "sku": f"TSCHECK-{suffix}",
            "metal": "silver",
            "purity": "925",
            "category": "Silver Rings",
            "weight": "5 g",
            "price": 999,
            "price_type": "exact",
            "description": "initial description",
            "published": True,
        },
    )
    assert create_resp.status_code in (200, 201), create_resp.text
    product = create_resp.json()
    product_id = product["id"]

    try:
        # Edit name/description/price/category
        new_name = f"{name}-edited"
        update_resp = admin_client.put(
            f"/admin/products/{product_id}",
            json={
                "name": new_name,
                "sku": f"TSCHECK-{suffix}",
                "metal": "silver",
                "purity": "925",
                "category": "Silver Chains",
                "weight": "5 g",
                "price": 1234,
                "price_type": "exact",
                "description": "edited description",
                "published": True,
            },
        )
        assert update_resp.status_code == 200, update_resp.text
        updated = update_resp.json()
        assert updated["name"] == new_name
        assert updated["price"] == 1234
        assert updated["category"] == "Silver Chains"
        assert updated["description"] == "edited description"

        # Public detail page reflects the change
        public_resp = admin_client.get(f"/products/{product_id}")
        assert public_resp.status_code == 200, public_resp.text
        public_product = public_resp.json()
        assert public_product["name"] == new_name
        assert public_product["price"] == 1234
        assert public_product["description"] == "edited description"

        # Findable via public search
        search_resp = admin_client.get("/products", params={"search": new_name})
        assert search_resp.status_code == 200, search_resp.text
        items = search_resp.json()["items"]
        assert any(p["id"] == product_id for p in items), items
    finally:
        del_resp = admin_client.delete(f"/admin/products/{product_id}")
        assert del_resp.status_code in (200, 204), del_resp.text
