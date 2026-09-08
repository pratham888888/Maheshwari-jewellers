"""Pydantic v2 models for the jewellery catalogue. Mirror in frontend/src/lib/types.ts."""

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uid() -> str:
    return str(uuid.uuid4())


PriceType = Literal["exact", "on_request", "contact"]


class ProductImage(BaseModel):
    url: str
    alt: str = ""


class ProductBase(BaseModel):
    name: str
    sku: str = ""
    metal: Literal["gold", "silver"] = "silver"
    purity: str = ""  # "925", "999", "regular", "22K", "18K"
    category: str = ""
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
