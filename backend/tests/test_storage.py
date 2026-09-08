"""Storage helpers: local fallback vs S3 configuration detection (no live S3)."""

import pytest

from lib.storage import ALLOWED_EXTENSIONS, save_image_bytes, s3_configured


def test_s3_not_configured_without_env(monkeypatch):
    monkeypatch.delenv("S3_BUCKET_NAME", raising=False)
    monkeypatch.delenv("S3_ACCESS_KEY_ID", raising=False)
    monkeypatch.delenv("S3_SECRET_ACCESS_KEY", raising=False)
    assert s3_configured() is False


def test_local_save_writes_file_and_relative_url(tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET_NAME", raising=False)
    monkeypatch.delenv("PUBLIC_API_URL", raising=False)
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    url = save_image_bytes(b"fake-jpeg-bytes", "shot.jpg", "image/jpeg")
    assert url == "/api/media/shot.jpg"
    assert (tmp_path / "shot.jpg").read_bytes() == b"fake-jpeg-bytes"


def test_local_save_uses_public_api_url(tmp_path, monkeypatch):
    monkeypatch.delenv("S3_BUCKET_NAME", raising=False)
    monkeypatch.setenv("PUBLIC_API_URL", "http://localhost:8000")
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    url = save_image_bytes(b"bytes", "pic.webp")
    assert url == "http://localhost:8000/api/media/pic.webp"


def test_rejects_disallowed_extension(tmp_path, monkeypatch):
    monkeypatch.setattr("lib.storage.UPLOAD_DIR", tmp_path)
    with pytest.raises(ValueError, match="Unsupported"):
        save_image_bytes(b"x", "malware.exe")


def test_allowed_extensions_cover_common_images():
    assert {".jpg", ".jpeg", ".png", ".webp", ".gif"} <= ALLOWED_EXTENSIONS
