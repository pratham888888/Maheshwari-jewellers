"""Criterion: admin login works with valid creds; admin API is unreachable without auth."""

import os

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")


def test_admin_products_requires_auth(client):
    resp = client.get("/admin/products")
    assert resp.status_code == 401, resp.text


def test_login_wrong_password_rejected(client):
    resp = client.post(
        "/auth/login", json={"username": ADMIN_USERNAME, "password": "wrong-password-xyz"}
    )
    assert resp.status_code in (401, 400), resp.text
    # session cookie must not be set on failed login
    assert "mj_session" not in resp.cookies


def test_login_correct_password_grants_access(client):
    resp = client.post(
        "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert resp.status_code == 200, resp.text
    assert "mj_session" in resp.cookies

    me = client.get("/auth/me")
    assert me.status_code == 200, me.text
    assert me.json().get("username") == ADMIN_USERNAME

    admin_products = client.get("/admin/products")
    assert admin_products.status_code == 200, admin_products.text
