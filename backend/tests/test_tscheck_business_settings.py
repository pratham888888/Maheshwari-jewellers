"""Criterion: phone/whatsapp/hours/closed_days business facts are correct in settings.

Public GET /api/settings backs the UI (header/footer/contact/about phone & hours
display). Verifies the exact values the briefing specifies and that the old
phone number is nowhere in the payload.
"""


def test_settings_business_info(client):
    resp = client.get("/settings")
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["phone"] == "9837149835"
    assert data["whatsapp"] == "919837149835"
    assert data["opening_hours"] == "10:00 AM \u2013 8:00 PM"
    assert data["closed_days"] == "Tuesday"
    assert data["maps_url"] == "https://maps.app.goo.gl/oWX8MP7Jm5HNGFD56?g_st=ac"

    raw = str(data)
    assert "8477950556" not in raw, "old phone number must not appear in settings"
