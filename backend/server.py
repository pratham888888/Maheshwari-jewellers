from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# MongoDB connection
from lib.db import client, db, ensure_indexes, ping_database
from lib.auth import ensure_default_admin
from lib.bootstrap import ensure_business_defaults
from routers.admin import router as admin_router
from routers.catalogue import router as catalogue_router


def _cors_origins() -> list[str]:
    """Allowed frontend origins. Never defaults to '*' when credentials are enabled."""
    raw_parts: list[str] = []
    for key in ("FRONTEND_URL", "CORS_ORIGINS"):
        value = (os.environ.get(key) or "").strip()
        if value:
            raw_parts.extend(value.split(","))
    origins = [o.strip().rstrip("/") for o in raw_parts if o.strip() and o.strip() != "*"]
    # Always keep common local origins so 127.0.0.1 vs localhost does not break admin login.
    for local in (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ):
        if local not in origins:
            origins.append(local)
    # Preserve order, drop duplicates
    seen: set[str] = set()
    unique: list[str] = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique.append(origin)
    return unique


async def _boot() -> None:
    await ensure_indexes()
    await ensure_default_admin()
    await ensure_business_defaults()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Await provisioning so missing ADMIN_PASSWORD / DB issues fail startup clearly.
    await _boot()
    yield
    client.close()


app = FastAPI(title="Maheshwari Jewellers API", lifespan=lifespan)

api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class StatusCheckCreate(BaseModel):
    client_name: str


@api_router.get("/")
async def root():
    return {"message": "Maheshwari Jewellers API"}


@api_router.get("/health")
async def health():
    """Render / uptime health check. Verifies MongoDB connectivity."""
    if not await ping_database():
        raise HTTPException(status_code=503, detail="database unavailable")
    return {"status": "ok", "database": "connected"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


api_router.include_router(catalogue_router)
api_router.include_router(admin_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
