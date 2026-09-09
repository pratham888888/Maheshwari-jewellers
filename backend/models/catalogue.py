"""Pydantic v2 models for the jewellery catalogue. Mirror in frontend/src/lib/types.ts."""

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid.uuid4())


PriceType = Literal["exact", "on_request", "contact"]


class ProductImage(BaseModel):
    url: str
    alt: str = ""


def _dedupe_names(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in values:
        name = (raw or "").strip()
        if name and name not in seen:
            seen.add(name)
            out.append(name)
    return out


class ProductBase(BaseModel):
    name: str
    sku: str = ""
    metal: Literal["gold", "silver"] = "silver"
    purity: str = ""  # "925", "999", "regular", "22K", "18K"
    category: str = ""  # primary/legacy single category (kept for backward compatibility)
    categories: list[str] = Field(default_factory=list)  # multi-category support
    subcategory: str = ""
    weight: str = ""
    price: Optional[float] = None
    price_type: PriceType = "on_request"
    description: str = ""
    gender: Literal["women", "men", "unisex"] = "unisex"
    finish: str = ""
    stone_details: str = ""
    size: str = ""
    availability: Literal["in_stock", "made_to_order", "out_of_stock"] = "in_stock"
    featured: bool = False
    new_arrival: bool = False
    published: bool = True
    is_demo: bool = False
    images: list[ProductImage] = Field(default_factory=list)
    # Denormalized rating summary (updated when reviews change)
    rating_average: float = 0.0
    rating_count: int = 0

    @model_validator(mode="after")
    def sync_categories(self) -> "ProductBase":
        cats = _dedupe_names(list(self.categories or []))
        primary = (self.category or "").strip()
        if not cats and primary:
            cats = [primary]
        if primary and primary not in cats:
            cats = [primary, *cats]
        if cats and not primary:
            primary = cats[0]
        self.categories = cats
        self.category = primary
        return self


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: str = Field(default_factory=_uid)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class ProductPage(BaseModel):
    items: list[Product]
    total: int
    page: int
    page_size: int


class Category(BaseModel):
    id: str = Field(default_factory=_uid)
    name: str
    slug: str
    metal: Literal["gold", "silver", "both"] = "silver"


class CategoryCreate(BaseModel):
    name: str
    metal: Literal["gold", "silver", "both"] = "silver"


class Rates(BaseModel):
    gold_24k: str = ""
    gold_22k: str = ""
    silver_999: str = ""
    silver_925: str = ""
    unit: str = "per 10 gram"
    updated_on: str = ""


class Settings(BaseModel):
    business_name: str = "Maheshwari Jewellers"
    phone: str = "9837149835"
    whatsapp: str = "919837149835"
    maps_url: str = "https://maps.app.goo.gl/oWX8MP7Jm5HNGFD56?g_st=ac"
    address: str = "Modinagar, Uttar Pradesh"
    opening_hours: str = "10:00 AM – 8:00 PM"
    closed_days: str = "Tuesday"
    about: str = ""
    description: str = ""
    instagram: str = ""
    facebook: str = ""
    other_social: str = ""
    logo_url: str = ""
    banner_url: str = ""
    rates: Rates = Field(default_factory=Rates)


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminUser(BaseModel):
    username: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class UploadResult(BaseModel):
    urls: list[str]


class OkResponse(BaseModel):
    ok: bool = True


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(default="", max_length=2000)
    reviewer_name: str = Field(default="", max_length=80)

    @field_validator("text", "reviewer_name")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return (value or "").strip()


class Review(BaseModel):
    id: str = Field(default_factory=_uid)
    product_id: str
    rating: int = Field(ge=1, le=5)
    text: str = ""
    reviewer_name: str = ""
    created_at: datetime = Field(default_factory=_now)


class ReviewPage(BaseModel):
    items: list[Review]
    total: int
    average: float = 0.0
    count: int = 0
