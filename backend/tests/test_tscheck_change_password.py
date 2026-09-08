"""Criterion: admin can change password (wrong current password rejected; correct
current + valid new password succeeds); new password then works for login.
Restores the password to the original at the end regardless of outcome."""

import os

import pytest

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Mahesh@2026")
TEMP_PASSWORD = "TscheckTemp123!"


@pytest.fixture
def admin_client(client):
    resp = client.post(
        "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert resp.status_code == 200, resp.text
    yield client


def test_wrong_current_password_rejected(admin_client):
    resp = admin_client.post(
        "/auth/change-password",
        json={"current_password": "totally-wrong", "new_password": TEMP_PASSWORD},
    )
    assert resp.status_code in (400, 401, 403), resp.text

    # original password still works
    login_check = admin_client.post(
        "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    assert login_check.status_code == 200, login_check.text


def test_change_password_then_restore(admin_client):
    try:
        change_resp = admin_client.post(
            "/auth/change-password",
            json={"current_password": ADMIN_PASSWORD, "new_password": TEMP_PASSWORD},
        )
        assert change_resp.status_code == 200, change_resp.text

        # caller stays signed in
        me = admin_client.get("/auth/me")
        assert me.status_code == 200, me.text

        # old password now rejected
        old_login = admin_client.post(
            "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert old_login.status_code in (401, 400), old_login.text

        # new password works
        new_login = admin_client.post(
            "/auth/login", json={"username": ADMIN_USERNAME, "password": TEMP_PASSWORD}
        )
        assert new_login.status_code == 200, new_login.text
    finally:
        # restore original password using whichever credential currently works
        restore_client = admin_client
        r = restore_client.post(
            "/auth/login", json={"username": ADMIN_USERNAME, "password": TEMP_PASSWORD}
        )
        if r.status_code == 200:
            restore_resp = restore_client.post(
                "/auth/change-password",
                json={"current_password": TEMP_PASSWORD, "new_password": ADMIN_PASSWORD},
            )
            assert restore_resp.status_code == 200, restore_resp.text
        # verify restored
        final_check = restore_client.post(
            "/auth/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert final_check.status_code == 200, final_check.text
