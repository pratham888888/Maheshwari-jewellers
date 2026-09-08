"""Criterion: admin can update gold/silver rates and the new values appear on the
public GET /api/settings immediately."""

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


def test_update_rates_visible_publicly(admin_client):
    # capture current settings to restore other fields untouched
    current = admin_client.get("/settings").json()

    suffix = uuid.uuid4().hex[:4]
    new_gold = f"7{suffix}00"
    new_silver = f"9{suffix}0"

    payload = dict(current)
    payload["rates"] = dict(current.get("rates", {}))
    payload["rates"]["gold_24k"] = new_gold
    payload["rates"]["silver_999"] = new_silver

    put_resp = admin_client.put("/admin/settings", json=payload)
    assert put_resp.status_code == 200, put_resp.text

    fresh = admin_client.get("/settings")
    assert fresh.status_code == 200
    rates = fresh.json()["rates"]
    assert rates["gold_24k"] == new_gold
    assert rates["silver_999"] == new_silver

    # restore original rates
    restore_payload = dict(current)
    restore_resp = admin_client.put("/admin/settings", json=restore_payload)
    assert restore_resp.status_code == 200, restore_resp.text
