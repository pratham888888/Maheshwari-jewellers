"""Product image storage — S3-compatible object storage with local filesystem fallback.

Production (Render, etc.): set S3_* env vars (Cloudflare R2 or any S3-compatible API).
Local development: omit S3_BUCKET_NAME to store under backend/uploads/ and serve via /api/media.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MiB


def s3_configured() -> bool:
    return bool(
        os.environ.get("S3_BUCKET_NAME")
        and os.environ.get("S3_ACCESS_KEY_ID")
        and os.environ.get("S3_SECRET_ACCESS_KEY")
    )


def _s3_client():
    import boto3

    kwargs: dict = {
        "aws_access_key_id": os.environ["S3_ACCESS_KEY_ID"],
        "aws_secret_access_key": os.environ["S3_SECRET_ACCESS_KEY"],
        "region_name": os.environ.get("S3_REGION") or "auto",
    }
    endpoint = (os.environ.get("S3_ENDPOINT_URL") or "").strip()
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    return boto3.client("s3", **kwargs)


def _public_url_for_key(key: str) -> str:
    base = (os.environ.get("S3_PUBLIC_BASE_URL") or "").rstrip("/")
    if not base:
        raise RuntimeError(
            "S3_PUBLIC_BASE_URL is required when using object storage "
            "(e.g. https://pub-xxxx.r2.dev or your custom media domain)."
        )
    return f"{base}/{key.lstrip('/')}"


def _local_public_url(filename: str) -> str:
    """Absolute URL when PUBLIC_API_URL is set; otherwise relative /api/media path."""
    public = (os.environ.get("PUBLIC_API_URL") or "").rstrip("/")
    path = f"/api/media/{filename}"
    return f"{public}{path}" if public else path


def save_image_bytes(data: bytes, filename: str, content_type: str | None = None) -> str:
    """Persist image bytes and return the public URL to store in MongoDB."""
    if not data:
        raise ValueError("Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File exceeds maximum size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}")

    if s3_configured():
        key = f"products/{filename}"
        client = _s3_client()
        extra: dict = {}
        if content_type:
            extra["ContentType"] = content_type
        client.put_object(
            Bucket=os.environ["S3_BUCKET_NAME"],
            Key=key,
            Body=data,
            **extra,
        )
        url = _public_url_for_key(key)
        logger.info("Uploaded image to object storage: %s", key)
        return url

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = UPLOAD_DIR / Path(filename).name
    dest.write_bytes(data)
    return _local_public_url(dest.name)


def local_media_path(filename: str) -> Path | None:
    """Resolve a safe path under uploads/ for the local media endpoint."""
    safe = Path(filename).name
    path = UPLOAD_DIR / safe
    if path.is_file():
        return path
    return None
