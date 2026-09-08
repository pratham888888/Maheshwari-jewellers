"""Admin routes — auth, product CRUD, categories, rates/settings, image upload."""

import io
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile
from fastapi.responses import FileResponse

from lib.auth import (
    COOKIE_NAME,
    create_session,
    require_admin,
    session_cookie_params,
    set_password,
    verify_credentials,
)
from lib.db import db
from lib.storage import ALLOWED_EXTENSIONS, local_media_path, save_image_bytes
from models.catalogue import (
    AdminUser,
    Category,
    CategoryCreate,
    LoginRequest,
    OkResponse,
    PasswordChange,
    Product,
    ProductCreate,
    ProductPage,
    Settings,
    UploadResult,
)
from routers.catalogue import _aware, build_query, load_settings

router = APIRouter()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


# ---------- auth ----------


@router.post("/auth/login", response_model=AdminUser)
async def login(payload: LoginRequest, response: Response):
    if not await verify_credentials(payload.username, payload.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = await create_session(payload.username)
    response.set_cookie(COOKIE_NAME, token, **session_cookie_params())
    return AdminUser(username=payload.username)


@router.post("/auth/logout", response_model=OkResponse)
async def logout(response: Response, username: str = Depends(require_admin)):
    await db.sessions.delete_many({"username": username})
    params = session_cookie_params()
    response.delete_cookie(
        COOKIE_NAME,
        path=params["path"],
        samesite=params["samesite"],
        secure=params["secure"],
    )
    return OkResponse()


@router.get("/auth/me", response_model=AdminUser)
async def me(username: str = Depends(require_admin)):
    return AdminUser(username=username)


@router.post("/auth/change-password", response_model=OkResponse)
async def change_password(
    payload: PasswordChange, response: Response, username: str = Depends(require_admin)
):
    if not await verify_credentials(username, payload.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    await set_password(username, payload.new_password)
    # Invalidate every existing session, then re-issue one so the caller stays signed in.
    await db.sessions.delete_many({"username": username})
    token = await create_session(username)
    response.set_cookie(COOKIE_NAME, token, **session_cookie_params())
    return OkResponse()


# ---------- products ----------


@router.get("/admin/products", response_model=ProductPage)
async def admin_list_products(
    search: Optional[str] = None,
    metal: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=100, ge=1, le=200),
    _: str = Depends(require_admin),
):
    query = build_query(metal, None, None, None, None, None, None, search, None, None, False)
    total = await db.products.count_documents(query)
    docs = (
        await db.products.find(query, {"_id": 0})
        .sort([("created_at", -1)])
        .skip((page - 1) * page_size)
        .limit(page_size)
        .to_list(page_size)
    )
    return ProductPage(
        items=[Product(**_aware(d)) for d in docs], total=total, page=page, page_size=page_size
    )


@router.get("/admin/products/{product_id}", response_model=Product)
async def admin_get_product(product_id: str, _: str = Depends(require_admin)):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**_aware(doc))


@router.post("/admin/products", response_model=Product)
async def create_product(payload: ProductCreate, _: str = Depends(require_admin)):
    product = Product(**payload.model_dump())
    if not product.sku:
        product.sku = f"MJ-{product.id[:6].upper()}"
    await db.products.insert_one(product.model_dump())
    return product


@router.put("/admin/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str, payload: ProductCreate, _: str = Depends(require_admin)
):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    data = payload.model_dump()
    data["updated_at"] = datetime.now(timezone.utc)
    await db.products.update_one({"id": product_id}, {"$set": data})
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    return Product(**_aware(doc))


@router.delete("/admin/products/{product_id}", response_model=OkResponse)
async def delete_product(product_id: str, _: str = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return OkResponse()


# ---------- categories ----------


@router.post("/admin/categories", response_model=Category)
async def create_category(payload: CategoryCreate, _: str = Depends(require_admin)):
    slug = slugify(payload.name)
    if await db.categories.find_one({"slug": slug}):
        raise HTTPException(status_code=409, detail="Category already exists")
    category = Category(name=payload.name, slug=slug, metal=payload.metal)
    await db.categories.insert_one(category.model_dump())
    return category


@router.delete("/admin/categories/{category_id}", response_model=OkResponse)
async def delete_category(category_id: str, _: str = Depends(require_admin)):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return OkResponse()


# ---------- settings & rates ----------


@router.put("/admin/settings", response_model=Settings)
async def update_settings(payload: Settings, _: str = Depends(require_admin)):
    await db.settings.update_one(
        {"key": "site"}, {"$set": {"key": "site", **payload.model_dump()}}, upsert=True
    )
    return await load_settings()


# ---------- images ----------


@router.post("/admin/upload", response_model=UploadResult)
async def upload_images(files: list[UploadFile] = File(...), _: str = Depends(require_admin)):
    urls: list[str] = []
    for upload in files:
        raw = await upload.read()
        if not raw:
            continue
        suffix = Path(upload.filename or "img.jpg").suffix.lower() or ".jpg"
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")
        name = f"{uuid.uuid4().hex}{suffix}"
        data = raw
        content_type = upload.content_type
        try:  # optional downscale keeps the catalogue fast
            from PIL import Image  # type: ignore

            img = Image.open(io.BytesIO(raw))
            img.thumbnail((1400, 1400))
            buf = io.BytesIO()
            fmt = "PNG" if suffix == ".png" else "JPEG"
            if fmt == "JPEG" and img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            img.save(buf, format=fmt, quality=82, optimize=True)
            data = buf.getvalue()
            name = f"{Path(name).stem}{'.png' if fmt == 'PNG' else '.jpg'}"
            content_type = "image/png" if fmt == "PNG" else "image/jpeg"
        except Exception:
            pass
        try:
            urls.append(save_image_bytes(data, name, content_type))
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Image storage upload failed") from exc
    if not urls:
        raise HTTPException(status_code=400, detail="No files received")
    return UploadResult(urls=urls)


@router.get("/media/{filename}")
async def get_media(filename: str):
    """Serve locally stored uploads (dev fallback). Object-storage URLs are absolute."""
    path = local_media_path(filename)
    if not path:
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=31536000"})
