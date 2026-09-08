"""Storage helpers: local fallback vs S3 configuration detection (no live S3)."""

import pytest

from lib.storage import ALLOWED_EXTENSIONS, save_image_bytes, s3_configured


def _clear_s3(monkeypatch):
    for key in (
        "S3_ENDPOINT_URL",
        "S3_ACCESS_KEY_ID",
        "S3_SECRET_ACCESS_KEY",
        "S3_BUCKET_NAME",
        "S3_PUBLIC_BASE_URL",
        "S3_REGION",
    ):
        monkeypatch.delenv(key, raising=False)


def test_s3_not_configured_without_env(monkeypatch):
    _clear_s3(monkeypatch)
    assert s3_configured() is False


def test_s3_requires_all_five_settings(monkeypatch):
    _clear_s3(monkeypatch)
    monkeypatch.setenv("S3_ENDPOINT_URL", "https://example.r2.cloudflarestorage.com")
    monkeypatch.setenv("S3_ACCESS_KEY_ID", "key")
    monkeypatch.setenv("S3_SECRET_ACCESS_KEY", "secret")
    monkeypatch.setenv("S3_BUCKET_NAME", "bucket")
    assert s3_configured() is False  # missing public base URL
    monkeypatch.setenv("S3_PUBLIC_BASE_URL", "https://pub.example")
    assert s3_configured() is True


def test_local_save_writes_file_and_relative_url(tmp_path, monkeypatch):
    _clear_s3(monkeypatch)
    monkeypatch.delenv("PUBLIC_API_URL", raising=False)
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    url = save_image_bytes(b"fake-jpeg-bytes", "shot.jpg", "image/jpeg")
    assert url == "/api/media/shot.jpg"
    assert (tmp_path / "shot.jpg").read_bytes() == b"fake-jpeg-bytes"


def test_local_save_uses_public_api_url(tmp_path, monkeypatch):
    _clear_s3(monkeypatch)
    monkeypatch.setenv("PUBLIC_API_URL", "http://localhost:8000")
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    url = save_image_bytes(b"bytes", "pic.webp")
    assert url == "http://localhost:8000/api/media/pic.webp"


def test_rejects_disallowed_extension(tmp_path, monkeypatch):
    _clear_s3(monkeypatch)
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    with pytest.raises(ValueError, match="Unsupported"):
        save_image_bytes(b"x", "malware.exe")


def test_allowed_extensions_cover_common_images():
    assert {".jpg", ".jpeg", ".png", ".webp", ".gif"} <= ALLOWED_EXTENSIONS
