"""Criterion: login normalizes username (trim + lowercase) and strips surrounding
whitespace from the password, so real-world input variants (auto-capitalised
username, pasted trailing space) still log in — while genuinely wrong credentials,
an unknown username, and an INNER space in the password are still rejected."""

import os

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")


def _login(client, username, password):
    return client.post("/auth/login", json={"username": username, "password": password})


def test_login_tolerates_case_and_whitespace_variants(client):
    variants = [
        ("Admin", ADMIN_PASSWORD),  # Android auto-capitalised username
        ("ADMIN", ADMIN_PASSWORD),
        (f"{ADMIN_USERNAME} ", ADMIN_PASSWORD),  # trailing space on username
        (ADMIN_USERNAME, f"{ADMIN_PASSWORD} "),  # trailing space on password (pasted)
        (f" {ADMIN_USERNAME} ", f" {ADMIN_PASSWORD} "),  # both padded
    ]
    for username, password in variants:
        resp = _login(client, username, password)
        assert resp.status_code == 200, f"variant {username!r}/{password!r} -> {resp.text}"
        assert "mj_session" in resp.cookies, f"no session cookie for variant {username!r}"
        me = client.get("/auth/me")
        assert me.status_code == 200, me.text


def test_wrong_password_still_rejected(client):
    resp = _login(client, ADMIN_USERNAME, "TotallyWrong1")
    assert resp.status_code == 401, resp.text
    assert "mj_session" not in resp.cookies


def test_unknown_username_still_rejected(client):
    resp = _login(client, "notadmin", ADMIN_PASSWORD)
    assert resp.status_code == 401, resp.text
    assert "mj_session" not in resp.cookies


def test_inner_space_in_password_still_rejected(client):
    inner_spaced = ADMIN_PASSWORD.replace("@", " @")  # 'Mahesh @2026'
    assert inner_spaced != ADMIN_PASSWORD
    resp = _login(client, ADMIN_USERNAME, inner_spaced)
    assert resp.status_code == 401, resp.text
    assert "mj_session" not in resp.cookies


def test_admin_products_requires_auth_no_cookie(client):
    resp = client.get("/admin/products")
    assert resp.status_code == 401, resp.text
