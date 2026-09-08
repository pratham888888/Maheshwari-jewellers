"""Product image storage — S3-compatible object storage with local filesystem fallback.

Production (Render, etc.): set all S3_* env vars (Cloudflare R2 or any S3-compatible API).
Local development: leave S3_* unset to store under backend/uploads/ and serve via /api/media.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MiB

# Required together for object-storage mode (Cloudflare R2 / S3-compatible).
_S3_REQUIRED = (
    "S3_ENDPOINT_URL",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "S3_PUBLIC_BASE_URL",
)


def s3_configured() -> bool:
    """True only when every R2/S3 setting needed for production uploads is present."""
    return all((os.environ.get(key) or "").strip() for key in _S3_REQUIRED)


def _s3_client():
    import boto3

    return boto3.client(
        "s3",
        endpoint_url=os.environ["S3_ENDPOINT_URL"].strip(),
        aws_access_key_id=os.environ["S3_ACCESS_KEY_ID"].strip(),
        aws_secret_access_key=os.environ["S3_SECRET_ACCESS_KEY"].strip(),
        region_name=(os.environ.get("S3_REGION") or "auto").strip() or "auto",
    )


def _public_url_for_key(key: str) -> str:
    base = os.environ["S3_PUBLIC_BASE_URL"].strip().rstrip("/")
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
        key = f"products/{Path(filename).name}"
        extra: dict = {}
        if content_type:
            extra["ContentType"] = content_type
        _s3_client().put_object(
            Bucket=os.environ["S3_BUCKET_NAME"].strip(),
            Key=key,
            Body=data,
            **extra,
        )
        url = _public_url_for_key(key)
        logger.info("Uploaded image to object storage key=%s", key)
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
