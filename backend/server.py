from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, File, UploadFile, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
import os
import logging
import re
import unicodedata
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import Dict, List, Optional
import uuid
import mimetypes
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import shutil
from slugify import slugify
from io import BytesIO
from collections import defaultdict, deque
from xml.etree import ElementTree
from PIL import Image, ImageOps, UnidentifiedImageError
import cloudinary
import cloudinary.uploader
from vercel.blob import put_async

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - optional dependency in some environments
    fitz = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
uploads_dir_env = os.environ.get("UPLOADS_DIR")
UPLOADS_DIR = Path(uploads_dir_env).expanduser() if uploads_dir_env else ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
BLOB_READ_WRITE_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN")
USE_VERCEL_BLOB = bool(BLOB_READ_WRITE_TOKEN)
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET")
USE_CLOUDINARY = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if USE_CLOUDINARY:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )

MAX_IMAGE_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
LOGIN_RATE_LIMIT_ATTEMPTS = 5
LOGIN_RATE_LIMIT_WINDOW = timedelta(minutes=15)
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff"}
AUTH_COOKIE_NAME = "revista_enfoco_token"


def parse_cors_origins(raw_origins: Optional[str]) -> List[str]:
    if not raw_origins:
        raise RuntimeError("CORS_ORIGINS environment variable is required")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    if not origins:
        raise RuntimeError("CORS_ORIGINS environment variable must contain at least one origin")
    if "*" in origins:
        raise RuntimeError("CORS_ORIGINS cannot contain wildcard '*' in production configuration")
    return origins


ALLOWED_CORS_ORIGINS = parse_cors_origins(os.environ.get('CORS_ORIGINS'))
COOKIE_IS_SECURE = any(origin.startswith("https://") for origin in ALLOWED_CORS_ORIGINS)
COOKIE_SAMESITE = "none" if COOKIE_IS_SECURE else "lax"
AUTH_COOKIE_MAX_AGE = 60 * 60 * 2  # 2 hours in seconds

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120  # 2 hours

# Security
security = HTTPBearer(auto_error=False)
login_attempts: Dict[str, deque] = defaultdict(deque)

# Create the main app
app = FastAPI(title="Revista Enfoco API")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

class PublicCacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method != "GET" or response.status_code >= 400:
            return response

        path = request.url.path
        if path.startswith("/uploads/"):
            response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        elif path in {"/api/home", "/api/home-lite"}:
            response.headers.setdefault("Cache-Control", "public, max-age=90, stale-while-revalidate=300")
        elif path == "/api/home-settings":
            response.headers.setdefault("Cache-Control", "public, max-age=300, stale-while-revalidate=600")
        elif (
            path == "/api/posts"
            or path.startswith("/api/posts/")
            or path == "/api/columns"
            or path.startswith("/api/columns/")
            or path == "/api/columnists"
            or path.startswith("/api/columnists/")
        ):
            response.headers.setdefault("Cache-Control", "public, max-age=120, stale-while-revalidate=300")

        return response

app.add_middleware(PublicCacheMiddleware)

raw_hosts = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1")
allowed_hosts = [h.strip() for h in raw_hosts.split(",") if h.strip()]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

@app.on_event("startup")
async def startup_db_client():
    # Setup MongoDB indexes
    try:
        await db.posts.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.posts.create_index([("slug", pymongo.ASCENDING)])

    await db.posts.create_index([("published", pymongo.ASCENDING)])
    await db.posts.create_index([("category_id", pymongo.ASCENDING)])

    try:
        await db.categories.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.categories.create_index([("slug", pymongo.ASCENDING)])

    try:
        await db.columns.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.columns.create_index([("slug", pymongo.ASCENDING)])

    await db.columns.create_index([("columnist_id", pymongo.ASCENDING)])

    try:
        await db.columnists.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.columnists.create_index([("slug", pymongo.ASCENDING)])

    try:
        await db.events.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.events.create_index([("slug", pymongo.ASCENDING)])

    try:
        await db.editions.create_index([("slug", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.editions.create_index([("slug", pymongo.ASCENDING)])

    try:
        await db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
    except Exception:
        await db.users.create_index([("email", pymongo.ASCENDING)])
    await db.revoked_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("key", unique=True)
    await db.login_attempts.create_index("expires_at", expireAfterSeconds=0)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

from models import *

# ============ HELPER FUNCTIONS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def ensure_admin(current_user: User) -> None:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can perform this action"
        )

async def enforce_login_rate_limit(client_key: str) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - LOGIN_RATE_LIMIT_WINDOW

    doc = await db.login_attempts.find_one({"key": client_key})
    attempts = doc.get("attempts", []) if doc else []

    valid_attempts = []
    for t in attempts:
        t_aware = t.replace(tzinfo=timezone.utc) if t.tzinfo is None else t
        if t_aware >= cutoff:
            valid_attempts.append(t_aware)

    if len(valid_attempts) >= LOGIN_RATE_LIMIT_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )

    valid_attempts.append(now)
    expires_at = valid_attempts[0] + LOGIN_RATE_LIMIT_WINDOW

    await db.login_attempts.update_one(
        {"key": client_key},
        {"$set": {"attempts": valid_attempts, "expires_at": expires_at}},
        upsert=True
    )

async def clear_login_rate_limit(client_key: str) -> None:
    await db.login_attempts.delete_one({"key": client_key})

def get_request_client_key(request: Request, email: Optional[str] = None) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    client_ip = forwarded_for.split(",")[0].strip() if forwarded_for else ""
    if not client_ip and request.client:
        client_ip = request.client.host
    return f"{client_ip or 'unknown'}:{(email or '').strip().lower()}"

def validate_and_prepare_image_upload(file: UploadFile, file_bytes: bytes, file_extension: str) -> None:
    if len(file_bytes) > MAX_IMAGE_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Image file is too large. Maximum size is {MAX_IMAGE_UPLOAD_SIZE // (1024 * 1024)} MB."
        )

    content_type = (file.content_type or "").lower()
    normalized_extension = file_extension.lower()

    if normalized_extension == ".svg" or content_type == "image/svg+xml":
        try:
            root = ElementTree.fromstring(file_bytes.decode("utf-8"))
        except (UnicodeDecodeError, ElementTree.ParseError):
            raise HTTPException(status_code=400, detail="Invalid SVG image")
        if not root.tag.lower().endswith("svg"):
            raise HTTPException(status_code=400, detail="Invalid SVG image")

        for elem in root.iter():
            tag_name = elem.tag.split("}")[-1].lower() if "}" in elem.tag else elem.tag.lower()
            if tag_name in ("script", "foreignobject"):
                raise HTTPException(status_code=400, detail="SVG contém código potencialmente malicioso e não pode ser aceito")

            for attr_name, attr_value in elem.attrib.items():
                attr_name_lower = attr_name.lower()
                attr_val_lower = attr_value.lower().strip()
                if attr_name_lower.startswith("on"):
                    raise HTTPException(status_code=400, detail="SVG contém código potencialmente malicioso e não pode ser aceito")
                if attr_name_lower in ("href", "xlink:href") and (attr_val_lower.startswith("javascript:") or attr_val_lower.startswith("data:text/html")):
                    raise HTTPException(status_code=400, detail="SVG contém código potencialmente malicioso e não pode ser aceito")
                if attr_name_lower == "src" and attr_val_lower.startswith("javascript:"):
                    raise HTTPException(status_code=400, detail="SVG contém código potencialmente malicioso e não pode ser aceito")

        return

    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")

def optimize_public_image_upload(file_bytes: bytes, file_extension: str, content_type: str) -> tuple[bytes, str, str]:
    normalized_extension = file_extension.lower()
    normalized_content_type = (content_type or "").lower()
    if normalized_extension in {".svg", ".gif"} or normalized_content_type in {"image/svg+xml", "image/gif"}:
        return file_bytes, file_extension, content_type

    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image = ImageOps.exif_transpose(image)
            if max(image.size) > 2200:
                image.thumbnail((2200, 2200), Image.Resampling.LANCZOS)

            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "A" in image.getbands() else "RGB")

            output = BytesIO()
            image.save(output, format="WEBP", quality=84, method=6)
            optimized_bytes = output.getvalue()
            if len(optimized_bytes) < len(file_bytes):
                return optimized_bytes, ".webp", "image/webp"
    except Exception as error:
        logging.warning("Image optimization skipped: %s", error)

    return file_bytes, file_extension, content_type

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def set_auth_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=COOKIE_IS_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=AUTH_COOKIE_MAX_AGE,
        expires=AUTH_COOKIE_MAX_AGE,
        path="/"
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        httponly=True,
        secure=COOKIE_IS_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/"
    )


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
):
    token = credentials.credentials if credentials else request.cookies.get(AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        revoked = await db.revoked_tokens.find_one({"token": token})
        if revoked:
            raise HTTPException(status_code=401, detail="Sessão encerrada")

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])

    return User(**{k: v for k, v in user.items() if k != 'hashed_password'})

def create_slug(title: str) -> str:
    return slugify(title)

async def create_unique_slug(collection, title: str, current_id: Optional[str] = None) -> str:
    base_slug = create_slug(title) or str(uuid.uuid4())
    slug = base_slug
    suffix = 2

    while True:
        query = {"slug": slug}
        if current_id:
            query["id"] = {"$ne": current_id}

        existing = await collection.find_one(query, {"_id": 0, "id": 1})
        if not existing:
            return slug

        slug = f"{base_slug}-{suffix}"
        suffix += 1

def is_blob_url(value: Optional[str]) -> bool:
    if not value:
        return False
    return ".blob.vercel-storage.com/" in str(value)

def is_cloudinary_url(value: Optional[str]) -> bool:
    if not value:
        return False
    return "res.cloudinary.com/" in str(value)

def build_upload_public_url(filename: str) -> str:
    return filename if is_blob_url(filename) or is_cloudinary_url(filename) else f"/uploads/{filename}"

def build_upload_storage_path(relative_path: str) -> Path:
    normalized = Path(relative_path)
    return UPLOADS_DIR / normalized

def normalize_blob_path(pathname: str) -> str:
    return str(pathname).replace("\\", "/").lstrip("/")

def normalize_media_path(pathname: str) -> str:
    normalized = normalize_blob_path(pathname)
    return normalized.rsplit(".", 1)[0]

async def upload_bytes_to_blob(
    pathname: str,
    file_bytes: bytes,
    *,
    content_type: Optional[str] = None,
    multipart: Optional[bool] = None
) -> str:
    if not USE_VERCEL_BLOB:
        raise RuntimeError("BLOB_READ_WRITE_TOKEN environment variable is required for blob uploads")
    blob = await put_async(
        normalize_blob_path(pathname),
        file_bytes,
        access="public",
        content_type=content_type,
        add_random_suffix=False,
        overwrite=True,
        token=BLOB_READ_WRITE_TOKEN,
        multipart=multipart,
    )
    return blob.url

async def upload_bytes_to_cloudinary(
    pathname: str,
    file_bytes: bytes,
    *,
    content_type: Optional[str] = None,
) -> str:
    if not USE_CLOUDINARY:
        raise RuntimeError("Cloudinary environment variables are required for Cloudinary uploads")
    public_id = normalize_media_path(pathname)
    folder, _, public_name = public_id.rpartition("/")
    upload_options = {
        "public_id": public_name or public_id,
        "folder": folder or None,
        "resource_type": "image",
        "overwrite": True,
        "invalidate": True,
    }
    if content_type:
        upload_options["resource_type"] = "image" if content_type.startswith("image/") else "raw"
    result = cloudinary.uploader.upload(file_bytes, **upload_options)
    return result["secure_url"]

async def persist_upload(
    pathname: str,
    file_bytes: bytes,
    *,
    content_type: Optional[str] = None,
    multipart: Optional[bool] = None
) -> str:
    normalized_path = normalize_blob_path(pathname)
    if USE_CLOUDINARY:
        return await upload_bytes_to_cloudinary(
            normalized_path,
            file_bytes,
            content_type=content_type,
        )
    if USE_VERCEL_BLOB:
        return await upload_bytes_to_blob(
            normalized_path,
            file_bytes,
            content_type=content_type,
            multipart=multipart,
        )

    file_path = build_upload_storage_path(normalized_path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with file_path.open("wb") as buffer:
        buffer.write(file_bytes)
    return build_upload_public_url(normalized_path)

async def generate_pdf_page_images(pdf_bytes: bytes, source_stem: str) -> dict:
    if fitz is None:
        return {"generated_pages": [], "generated_preview_pages": []}

    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as error:
        logging.exception("Failed to open uploaded PDF for page generation: %s", error)
        return {"generated_pages": [], "generated_preview_pages": []}

    relative_dir = Path("editions") / source_stem
    generated_pages = []

    try:
        for index in range(document.page_count):
            page = document.load_page(index)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
            relative_file = relative_dir / f"page-{index + 1}.png"
            image_bytes = pix.tobytes("png")
            generated_pages.append(
                await persist_upload(
                    relative_file.as_posix(),
                    image_bytes,
                    content_type="image/png",
                )
            )
    except Exception as error:
        logging.exception("Failed to generate images from uploaded PDF: %s", error)
        generated_pages = []
    finally:
        document.close()

    return {
        "generated_pages": generated_pages,
        "generated_preview_pages": generated_pages[:4]
    }

def serialize_datetimes(document: dict, *fields: str) -> dict:
    for field in fields:
        if isinstance(document.get(field), str):
            document[field] = datetime.fromisoformat(document[field])
    return document

def normalize_post_datetimes(post: Optional[dict]) -> Optional[dict]:
    if not post:
        return post

    return serialize_datetimes(post, "created_at", "updated_at")

def get_post_identity(post: Optional[dict]) -> Optional[str]:
    if not post:
        return None

    return post.get("slug") or post.get("id")

def dedupe_posts(posts: List[dict]) -> List[dict]:
    unique_posts = []
    seen_keys = set()

    for post in posts:
        key = get_post_identity(post)
        if not key or key in seen_keys:
            continue

        seen_keys.add(key)
        unique_posts.append(post)

    return unique_posts

def normalize_author_lookup_key(value: Optional[str]) -> str:
    normalized = unicodedata.normalize("NFD", str(value or ""))
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    return re.sub(r"\s+", " ", without_accents).strip().lower()

def hydrate_post_with_team_member(post: Optional[dict], member: Optional[dict]) -> Optional[dict]:
    if not post or not member:
        return post

    post["author_member_id"] = member.get("id") or post.get("author_member_id")
    post["author_name"] = member.get("name") or post.get("author_name")
    post["author_image"] = member.get("image") or post.get("author_image")
    return post

async def hydrate_posts_with_team_members(posts: List[dict]) -> List[dict]:
    if not posts:
        return posts

    author_member_ids = sorted({
        post.get("author_member_id")
        for post in posts
        if post.get("author_member_id")
    })
    author_names = sorted({
        normalize_author_lookup_key(post.get("author_name"))
        for post in posts
        if post.get("author_name") and not post.get("author_member_id")
    })

    team_members = await db.team.find({"published": True}, {"_id": 0}).to_list(500)
    serialized_members = [
        serialize_datetimes(member, "created_at", "updated_at")
        for member in team_members
    ]

    members_by_id = {
        member["id"]: member
        for member in serialized_members
        if member.get("id") in author_member_ids
    }
    members_by_name = {
        normalize_author_lookup_key(member.get("name")): member
        for member in serialized_members
        if normalize_author_lookup_key(member.get("name")) in author_names
    }

    for post in posts:
        member = None
        if post.get("author_member_id"):
            member = members_by_id.get(post.get("author_member_id"))
        if not member and post.get("author_name"):
            member = members_by_name.get(normalize_author_lookup_key(post.get("author_name")))
        hydrate_post_with_team_member(post, member)

    return posts

async def apply_team_member_to_post_payload(post_dict: dict) -> dict:
    author_member_id = post_dict.get("author_member_id")

    if author_member_id:
        member = await db.team.find_one(
            {"id": author_member_id, "published": True},
            {"_id": 0}
        )
        if not member:
            raise HTTPException(status_code=400, detail="Author not found")

        post_dict["author_name"] = member.get("name") or ""
        post_dict["author_image"] = member.get("image") or ""
        return post_dict

    post_dict["author_member_id"] = None
    post_dict["author_image"] = None
    return post_dict

def hydrate_column_with_columnist(column: Optional[dict], columnist: Optional[dict]) -> Optional[dict]:
    if not column or not columnist:
        return column

    column["columnist_id"] = columnist.get("id")
    column["columnist_slug"] = columnist.get("slug")
    column["author_name"] = columnist.get("name") or column.get("author_name")
    column["author_role"] = columnist.get("role") or column.get("author_role")
    column["author_bio"] = columnist.get("bio") or column.get("author_bio")
    column["author_image"] = columnist.get("image") or column.get("author_image")
    return column

async def get_columnists_map(columnist_ids: List[str]) -> dict:
    normalized_ids = sorted({columnist_id for columnist_id in columnist_ids if columnist_id})
    if not normalized_ids:
        return {}

    columnists = await db.columnists.find(
        {"id": {"$in": normalized_ids}},
        {"_id": 0}
    ).to_list(len(normalized_ids))

    serialized_columnists = [
        serialize_datetimes(columnist, "created_at", "updated_at")
        for columnist in columnists
    ]
    return {columnist["id"]: columnist for columnist in serialized_columnists}

async def ensure_columnist_slug(columnist: Optional[dict]) -> Optional[dict]:
    if not columnist:
        return columnist

    if columnist.get("slug"):
        return columnist

    next_slug = await create_unique_slug(db.columnists, columnist.get("name") or columnist.get("id") or "colunista", columnist.get("id"))
    await db.columnists.update_one({"id": columnist["id"]}, {"$set": {"slug": next_slug}})
    columnist["slug"] = next_slug
    return columnist

async def ensure_columnist_slugs(columnists: List[dict]) -> List[dict]:
    return [await ensure_columnist_slug(columnist) for columnist in columnists]

async def apply_columnist_to_column_payload(column_dict: dict) -> dict:
    columnist_id = column_dict.get("columnist_id")
    if not columnist_id:
        return column_dict

    columnist = await db.columnists.find_one({"id": columnist_id}, {"_id": 0})
    if not columnist:
        raise HTTPException(status_code=400, detail="Columnist not found")

    column_dict["author_name"] = columnist.get("name") or ""
    column_dict["author_role"] = columnist.get("role") or ""
    column_dict["author_bio"] = columnist.get("bio") or ""
    column_dict["author_image"] = columnist.get("image") or ""
    return column_dict

def sort_highlighted_posts(posts: List[dict]) -> List[dict]:
    def sort_key(item: dict):
        updated_at = item.get("updated_at")
        created_at = item.get("created_at")

        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at)
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)

        timestamp = updated_at or created_at or datetime.min.replace(tzinfo=timezone.utc)
        return (
            int(item.get("ordem_destaque", 0) or 0),
            -timestamp.timestamp()
        )

    return sorted(posts, key=sort_key)

async def resolve_post_category_reference(post_dict: dict, allow_inactive_id: Optional[str] = None) -> dict:
    category_lookup = None

    if post_dict.get("category_id"):
        category_lookup = {"id": post_dict["category_id"]}
    elif post_dict.get("category_slug"):
        category_lookup = {"slug": post_dict["category_slug"]}
    elif post_dict.get("category"):
        candidate_slug = create_slug(post_dict["category"])
        category_lookup = {"slug": candidate_slug}

    if not category_lookup:
        raise HTTPException(status_code=400, detail="Category is required")

    category = await db.categories.find_one(category_lookup, {"_id": 0})
    if not category:
        raise HTTPException(status_code=400, detail="Selected category does not exist")

    if not category.get("active", True) and category.get("id") != allow_inactive_id:
        raise HTTPException(status_code=400, detail="Selected category is inactive")

    post_dict["category"] = category["name"]
    post_dict["category_id"] = category["id"]
    post_dict["category_slug"] = category["slug"]
    return post_dict

async def enforce_home_highlight_rules(post_dict: dict, current_post_id: Optional[str] = None) -> dict:
    post_dict["destaque_principal_home"] = bool(post_dict.get("destaque_principal_home", False))
    post_dict["destaque_secundario_home"] = bool(post_dict.get("destaque_secundario_home", False))
    post_dict["ordem_destaque"] = int(post_dict.get("ordem_destaque", 0) or 0)

    if post_dict["destaque_principal_home"]:
        await db.posts.update_many(
            {
                "destaque_principal_home": True,
                **({"id": {"$ne": current_post_id}} if current_post_id else {})
            },
            {"$set": {"destaque_principal_home": False}}
        )

    if post_dict["destaque_principal_home"]:
        post_dict["destaque_secundario_home"] = False

    return post_dict

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    ensure_admin(current_user)
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump(exclude={'password'})
    user_obj = User(**user_dict)

    user_in_db = UserInDB(**user_obj.model_dump(), hashed_password=hashed_password)
    doc = user_in_db.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, request: Request, response: Response):
    client_key = get_request_client_key(request, user_data.email)
    await enforce_login_rate_limit(client_key)
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    if not verify_password(user_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    await clear_login_rate_limit(client_key)
    access_token = create_access_token(data={"sub": user['id']})
    set_auth_cookie(response, access_token)

    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])

    user_obj = User(**{k: v for k, v in user.items() if k != 'hashed_password'})

    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    auth_header = request.headers.get("Authorization")
    token = auth_header.replace("Bearer ", "") if auth_header and auth_header.startswith("Bearer ") else request.cookies.get(AUTH_COOKIE_NAME)

    if token:
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            if "exp" in payload:
                await db.revoked_tokens.insert_one({
                    "token": token,
                    "expires_at": datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
                })
        except Exception:
            pass

    clear_auth_cookie(response)
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ POSTS ROUTES (Notícias) ============

@api_router.get("/posts", response_model=List[Post])
async def get_posts(limit: int = 100, skip: int = 0, published: Optional[bool] = None):
    query = {}
    if published is not None:
        query['published'] = published

    posts = await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

    posts = [
        normalize_post_datetimes(post)
        for post in posts
    ]
    posts = await hydrate_posts_with_team_members(dedupe_posts(posts))
    return posts[skip:skip + limit]

@api_router.get("/posts/{slug}", response_model=Post)
async def get_post(slug: str):
    post_candidates = await db.posts.find({"slug": slug}, {"_id": 0}).sort([
        ("updated_at", -1),
        ("created_at", -1)
    ]).to_list(10)
    post = normalize_post_datetimes(dedupe_posts(post_candidates)[0]) if post_candidates else None
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    await hydrate_posts_with_team_members([post])
    return post

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post_dict = post_data.model_dump()
    post_dict = await resolve_post_category_reference(post_dict)
    post_dict = await apply_team_member_to_post_payload(post_dict)
    post_dict = await enforce_home_highlight_rules(post_dict)
    post_dict['slug'] = create_slug(post_data.title)
    post_dict['author_id'] = current_user.id
    post_dict['author_name'] = post_dict.get('author_name') or current_user.name

    post_obj = Post(**post_dict)
    doc = post_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.posts.insert_one(doc)
    return post_obj

@api_router.put("/posts/{post_id}", response_model=Post)
async def update_post(post_id: str, post_data: PostCreate, current_user: User = Depends(get_current_user)):
    existing_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not existing_post:
        raise HTTPException(status_code=404, detail="Post not found")

    post_dict = post_data.model_dump()
    post_dict = await resolve_post_category_reference(post_dict, allow_inactive_id=existing_post.get("category_id"))
    post_dict = await apply_team_member_to_post_payload(post_dict)
    post_dict = await enforce_home_highlight_rules(post_dict, current_post_id=post_id)
    post_dict['slug'] = create_slug(post_data.title)
    post_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    await db.posts.update_one({"id": post_id}, {"$set": post_dict})

    updated_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    normalize_post_datetimes(updated_post)
    await hydrate_posts_with_team_members([updated_post])

    return updated_post

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

@api_router.get("/home-highlights")
async def get_home_highlights():
    post_card_projection = {"_id": 0, "content": 0}

    featured_candidates = await db.posts.find(
        {"published": True, "destaque_principal_home": True},
        post_card_projection
    ).sort([("updated_at", -1), ("created_at", -1)]).to_list(10)

    featured_candidates = dedupe_posts([normalize_post_datetimes(post) for post in featured_candidates])
    featured_candidates = await hydrate_posts_with_team_members(featured_candidates)
    featured_post = featured_candidates[0] if featured_candidates else None

    secondary_posts = await db.posts.find(
        {"published": True, "destaque_secundario_home": True},
        post_card_projection
    ).to_list(50)

    secondary_posts = [
        post
        for post in dedupe_posts(
            [normalize_post_datetimes(post) for post in sort_highlighted_posts(secondary_posts)]
        )
        if not featured_post or get_post_identity(post) != get_post_identity(featured_post)
    ]
    secondary_posts = await hydrate_posts_with_team_members(secondary_posts)

    return {
        "featured_post": featured_post,
        "secondary_posts": secondary_posts
    }

# ============ COLUMNS ROUTES (Colunas) ============

@api_router.get("/columns", response_model=List[Column])
async def get_columns(
    limit: int = 100,
    skip: int = 0,
    published: Optional[bool] = None,
    columnist_id: Optional[str] = None
):
    query = {}
    if published is not None:
        query['published'] = published
    if columnist_id:
        query['columnist_id'] = columnist_id

    columns = await db.columns.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    columnists_map = await get_columnists_map([column.get("columnist_id") for column in columns])

    for column in columns:
        serialize_datetimes(column, 'created_at', 'updated_at')
        hydrate_column_with_columnist(column, columnists_map.get(column.get("columnist_id")))

    return columns

@api_router.get("/columns/by-columnist/{columnist_id}")
async def get_columns_by_columnist(
    columnist_id: str,
    limit: int = 24,
    skip: int = 0,
    published: Optional[bool] = True
):
    query = {"columnist_id": columnist_id}
    if published is not None:
        query["published"] = published

    columns = await db.columns.find(
        query,
        {"_id": 0, "content": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    columnists_map = await get_columnists_map([column.get("columnist_id") for column in columns])

    for column in columns:
        serialize_datetimes(column, "created_at", "updated_at")
        hydrate_column_with_columnist(column, columnists_map.get(column.get("columnist_id")))

    return columns

@api_router.get("/columns/{slug}", response_model=Column)
async def get_column(slug: str):
    column = await db.columns.find_one({"slug": slug}, {"_id": 0})
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")

    serialize_datetimes(column, 'created_at', 'updated_at')
    columnist = None
    if column.get("columnist_id"):
        columnist = await db.columnists.find_one({"id": column["columnist_id"]}, {"_id": 0})
        if columnist:
            serialize_datetimes(columnist, "created_at", "updated_at")
    hydrate_column_with_columnist(column, columnist)

    return column

@api_router.post("/columns", response_model=Column)
async def create_column(column_data: ColumnCreate, current_user: User = Depends(get_current_user)):
    column_dict = column_data.model_dump()
    column_dict = await apply_columnist_to_column_payload(column_dict)
    column_dict['slug'] = create_slug(column_data.title)
    column_dict['author_id'] = current_user.id
    column_dict['author_name'] = column_dict.get('author_name') or current_user.name

    column_obj = Column(**column_dict)
    doc = column_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.columns.insert_one(doc)
    return column_obj

@api_router.put("/columns/{column_id}", response_model=Column)
async def update_column(column_id: str, column_data: ColumnCreate, current_user: User = Depends(get_current_user)):
    existing_column = await db.columns.find_one({"id": column_id}, {"_id": 0})
    if not existing_column:
        raise HTTPException(status_code=404, detail="Column not found")

    column_dict = column_data.model_dump()
    column_dict = await apply_columnist_to_column_payload(column_dict)
    column_dict['slug'] = create_slug(column_data.title)
    column_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    await db.columns.update_one({"id": column_id}, {"$set": column_dict})

    updated_column = await db.columns.find_one({"id": column_id}, {"_id": 0})
    serialize_datetimes(updated_column, 'created_at', 'updated_at')
    columnist = None
    if updated_column.get("columnist_id"):
        columnist = await db.columnists.find_one({"id": updated_column["columnist_id"]}, {"_id": 0})
        if columnist:
            serialize_datetimes(columnist, "created_at", "updated_at")
    hydrate_column_with_columnist(updated_column, columnist)

    return updated_column

@api_router.delete("/columns/{column_id}")
async def delete_column(column_id: str, current_user: User = Depends(get_current_user)):
    result = await db.columns.delete_one({"id": column_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "Column deleted successfully"}

# ============ EVENTS ROUTES (Eventos) ============

@api_router.get("/events", response_model=List[Event])
async def get_events(limit: int = 100, skip: int = 0, published: Optional[bool] = None):
    query = {}
    if published is not None:
        query['published'] = published

    events = await db.events.find(query, {"_id": 0}).sort("event_date", 1).skip(skip).limit(limit).to_list(limit)

    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
        if isinstance(event.get('updated_at'), str):
            event['updated_at'] = datetime.fromisoformat(event['updated_at'])
        if isinstance(event.get('event_date'), str):
            event['event_date'] = datetime.fromisoformat(event['event_date'])

    return events

@api_router.get("/events/{slug}", response_model=Event)
async def get_event(slug: str):
    event = await db.events.find_one({"slug": slug}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if isinstance(event.get('created_at'), str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    if isinstance(event.get('updated_at'), str):
        event['updated_at'] = datetime.fromisoformat(event['updated_at'])
    if isinstance(event.get('event_date'), str):
        event['event_date'] = datetime.fromisoformat(event['event_date'])

    return event

@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_current_user)):
    event_dict = event_data.model_dump()
    event_dict['slug'] = create_slug(event_data.title)
    event_dict['event_date'] = event_dict['event_date'].isoformat()

    event_obj = Event(**event_dict)
    doc = event_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.events.insert_one(doc)
    created_event = await db.events.find_one({"id": event_obj.id}, {"_id": 0})
    if isinstance(created_event.get('created_at'), str):
        created_event['created_at'] = datetime.fromisoformat(created_event['created_at'])
    if isinstance(created_event.get('updated_at'), str):
        created_event['updated_at'] = datetime.fromisoformat(created_event['updated_at'])
    if isinstance(created_event.get('event_date'), str):
        created_event['event_date'] = datetime.fromisoformat(created_event['event_date'])

    return created_event

@api_router.put("/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventCreate, current_user: User = Depends(get_current_user)):
    existing_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not existing_event:
        raise HTTPException(status_code=404, detail="Event not found")

    event_dict = event_data.model_dump()
    event_dict['slug'] = create_slug(event_data.title)
    event_dict['event_date'] = event_dict['event_date'].isoformat()
    event_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    await db.events.update_one({"id": event_id}, {"$set": event_dict})

    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated_event.get('created_at'), str):
        updated_event['created_at'] = datetime.fromisoformat(updated_event['created_at'])
    if isinstance(updated_event.get('updated_at'), str):
        updated_event['updated_at'] = datetime.fromisoformat(updated_event['updated_at'])
    if isinstance(updated_event.get('event_date'), str):
        updated_event['event_date'] = datetime.fromisoformat(updated_event['event_date'])

    return updated_event

@api_router.delete("/events/{event_id}")
async def delete_event(event_id: str, current_user: User = Depends(get_current_user)):
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# ============ EDITIONS ROUTES (Edições) ============

@api_router.get("/editions", response_model=List[Edition])
async def get_editions(limit: int = 100, skip: int = 0, published: Optional[bool] = None):
    query = {}
    if published is not None:
        query['published'] = published

    editions = await db.editions.find(query, {"_id": 0}).sort("edition_number", -1).skip(skip).limit(limit).to_list(limit)

    for edition in editions:
        if isinstance(edition.get('created_at'), str):
            edition['created_at'] = datetime.fromisoformat(edition['created_at'])
        if isinstance(edition.get('updated_at'), str):
            edition['updated_at'] = datetime.fromisoformat(edition['updated_at'])

    return editions

@api_router.get("/editions/{slug}", response_model=Edition)
async def get_edition(slug: str):
    edition = await db.editions.find_one({"slug": slug}, {"_id": 0})
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")

    if isinstance(edition.get('created_at'), str):
        edition['created_at'] = datetime.fromisoformat(edition['created_at'])
    if isinstance(edition.get('updated_at'), str):
        edition['updated_at'] = datetime.fromisoformat(edition['updated_at'])

    return edition

@api_router.post("/editions", response_model=Edition)
async def create_edition(edition_data: EditionCreate, current_user: User = Depends(get_current_user)):
    edition_dict = edition_data.model_dump()
    edition_dict['slug'] = create_slug(edition_data.title)

    edition_obj = Edition(**edition_dict)
    doc = edition_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.editions.insert_one(doc)
    return edition_obj

@api_router.put("/editions/{edition_id}", response_model=Edition)
async def update_edition(edition_id: str, edition_data: EditionCreate, current_user: User = Depends(get_current_user)):
    existing_edition = await db.editions.find_one({"id": edition_id}, {"_id": 0})
    if not existing_edition:
        raise HTTPException(status_code=404, detail="Edition not found")

    edition_dict = edition_data.model_dump()
    edition_dict['slug'] = create_slug(edition_data.title)
    edition_dict['updated_at'] = datetime.now(timezone.utc).isoformat()

    await db.editions.update_one({"id": edition_id}, {"$set": edition_dict})

    updated_edition = await db.editions.find_one({"id": edition_id}, {"_id": 0})
    if isinstance(updated_edition.get('created_at'), str):
        updated_edition['created_at'] = datetime.fromisoformat(updated_edition['created_at'])
    if isinstance(updated_edition.get('updated_at'), str):
        updated_edition['updated_at'] = datetime.fromisoformat(updated_edition['updated_at'])

    return updated_edition

@api_router.delete("/editions/{edition_id}")
async def delete_edition(edition_id: str, current_user: User = Depends(get_current_user)):
    result = await db.editions.delete_one({"id": edition_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Edition not found")
    return {"message": "Edition deleted successfully"}

# ============ CATEGORIES ROUTES ============

@api_router.get("/categories", response_model=List[Category])
async def get_categories(active: Optional[bool] = None):
    query = {}
    if active is not None:
        query["active"] = active

    categories = await db.categories.find(query, {"_id": 0}).sort("name", 1).to_list(200)
    return [serialize_datetimes(category, "created_at", "updated_at") for category in categories]

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    slug = create_slug(category_data.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Could not generate slug for category")

    existing_category = await db.categories.find_one({"slug": slug}, {"_id": 0})
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    category_obj = Category(**category_data.model_dump(), slug=slug)
    doc = category_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()

    await db.categories.insert_one(doc)
    return category_obj

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_data: CategoryCreate, current_user: User = Depends(get_current_user)):
    existing_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    if not existing_category:
        raise HTTPException(status_code=404, detail="Category not found")

    slug = create_slug(category_data.name)
    if not slug:
        raise HTTPException(status_code=400, detail="Could not generate slug for category")

    duplicate_category = await db.categories.find_one({"slug": slug, "id": {"$ne": category_id}}, {"_id": 0})
    if duplicate_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    payload = category_data.model_dump()
    payload["slug"] = slug
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.categories.update_one({"id": category_id}, {"$set": payload})

    updated_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return serialize_datetimes(updated_category, "created_at", "updated_at")

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, current_user: User = Depends(get_current_user)):
    related_post = await db.posts.find_one({"category_id": category_id}, {"_id": 0})
    if related_post:
        raise HTTPException(status_code=400, detail="Category is linked to existing posts")

    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ============ COLUMNISTS ROUTES (Colunistas) ============

@api_router.get("/columnists", response_model=List[Columnist])
async def get_columnists(limit: int = 100, skip: int = 0):
    columnists = (
        await db.columnists
        .find({}, {"_id": 0})
        .sort([("name", 1), ("created_at", -1)])
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    columnists = await ensure_columnist_slugs(columnists)
    return [serialize_datetimes(columnist, "created_at", "updated_at") for columnist in columnists]

@api_router.get("/columnists/slug/{slug}", response_model=Columnist)
async def get_columnist_by_slug(slug: str):
    columnist = await db.columnists.find_one({"slug": slug}, {"_id": 0})
    if not columnist:
        legacy_candidates = await db.columnists.find({}, {"_id": 0}).to_list(200)
        legacy_candidates = await ensure_columnist_slugs(legacy_candidates)
        columnist = next((candidate for candidate in legacy_candidates if candidate.get("slug") == slug), None)

    if not columnist:
        raise HTTPException(status_code=404, detail="Columnist not found")

    return serialize_datetimes(columnist, "created_at", "updated_at")

@api_router.get("/columnists/{columnist_id}", response_model=Columnist)
async def get_columnist(columnist_id: str):
    columnist = await db.columnists.find_one({"id": columnist_id}, {"_id": 0})
    if not columnist:
        raise HTTPException(status_code=404, detail="Columnist not found")

    columnist = await ensure_columnist_slug(columnist)
    return serialize_datetimes(columnist, "created_at", "updated_at")

@api_router.post("/columnists", response_model=Columnist)
async def create_columnist(columnist_data: ColumnistCreate, current_user: User = Depends(get_current_user)):
    columnist_dict = columnist_data.model_dump()
    columnist_dict["slug"] = await create_unique_slug(db.columnists, columnist_dict.get("name", "colunista"))
    columnist_obj = Columnist(**columnist_dict)
    doc = columnist_obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()

    await db.columnists.insert_one(doc)
    return columnist_obj

@api_router.put("/columnists/{columnist_id}", response_model=Columnist)
async def update_columnist(columnist_id: str, columnist_data: ColumnistCreate, current_user: User = Depends(get_current_user)):
    existing_columnist = await db.columnists.find_one({"id": columnist_id}, {"_id": 0})
    if not existing_columnist:
        raise HTTPException(status_code=404, detail="Columnist not found")

    payload = columnist_data.model_dump()
    payload["slug"] = await create_unique_slug(db.columnists, payload.get("name", "colunista"), columnist_id)
    payload["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.columnists.update_one({"id": columnist_id}, {"$set": payload})
    updated_columnist = await db.columnists.find_one({"id": columnist_id}, {"_id": 0})
    return serialize_datetimes(updated_columnist, "created_at", "updated_at")

@api_router.delete("/columnists/{columnist_id}")
async def delete_columnist(columnist_id: str, current_user: User = Depends(get_current_user)):
    linked_column = await db.columns.find_one({"columnist_id": columnist_id}, {"_id": 0})
    if linked_column:
        raise HTTPException(status_code=400, detail="Columnist is linked to existing columns")

    result = await db.columnists.delete_one({"id": columnist_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Columnist not found")
    return {"message": "Columnist deleted successfully"}

# ============ TEAM ROUTES (Equipe Editorial) ============

@api_router.get("/team", response_model=List[TeamMember])
async def get_team(limit: int = 100, skip: int = 0, published: Optional[bool] = None):
    query = {}
    if published is not None:
        query['published'] = published

    team_members = (
        await db.team
        .find(query, {"_id": 0})
        .sort([("display_order", 1), ("created_at", 1)])
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )

    for member in team_members:
        if isinstance(member.get('created_at'), str):
            member['created_at'] = datetime.fromisoformat(member['created_at'])
        if isinstance(member.get('updated_at'), str):
            member['updated_at'] = datetime.fromisoformat(member['updated_at'])

    return team_members

@api_router.get("/team/{team_member_id}", response_model=TeamMember)
async def get_team_member(team_member_id: str):
    member = await db.team.find_one({"id": team_member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")

    if isinstance(member.get('created_at'), str):
        member['created_at'] = datetime.fromisoformat(member['created_at'])
    if isinstance(member.get('updated_at'), str):
        member['updated_at'] = datetime.fromisoformat(member['updated_at'])

    return member

@api_router.post("/team", response_model=TeamMember)
async def create_team_member(team_member_data: TeamMemberCreate, current_user: User = Depends(get_current_user)):
    team_member_obj = TeamMember(**team_member_data.model_dump())
    doc = team_member_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.team.insert_one(doc)
    return team_member_obj

@api_router.put("/team/{team_member_id}", response_model=TeamMember)
async def update_team_member(team_member_id: str, team_member_data: TeamMemberCreate, current_user: User = Depends(get_current_user)):
    existing_member = await db.team.find_one({"id": team_member_id}, {"_id": 0})
    if not existing_member:
        raise HTTPException(status_code=404, detail="Team member not found")

    payload = team_member_data.model_dump()
    payload['updated_at'] = datetime.now(timezone.utc).isoformat()

    await db.team.update_one({"id": team_member_id}, {"$set": payload})

    updated_member = await db.team.find_one({"id": team_member_id}, {"_id": 0})
    if isinstance(updated_member.get('created_at'), str):
        updated_member['created_at'] = datetime.fromisoformat(updated_member['created_at'])
    if isinstance(updated_member.get('updated_at'), str):
        updated_member['updated_at'] = datetime.fromisoformat(updated_member['updated_at'])

    return updated_member

@api_router.delete("/team/{team_member_id}")
async def delete_team_member(team_member_id: str, current_user: User = Depends(get_current_user)):
    result = await db.team.delete_one({"id": team_member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted successfully"}

# ============ ABOUT ROUTES (Quem Somos) ============

@api_router.get("/about", response_model=AboutSettings)
async def get_about_settings():
    settings = await db.about_settings.find_one({"id": "about-page"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=404, detail="About settings not found")

    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])

    return settings

@api_router.put("/about", response_model=AboutSettings)
async def update_about_settings(about_data: AboutSettingsUpdate, current_user: User = Depends(get_current_user)):
    settings_obj = AboutSettings(**about_data.model_dump(), updated_at=datetime.now(timezone.utc))
    doc = settings_obj.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.about_settings.update_one({"id": "about-page"}, {"$set": doc}, upsert=True)
    return settings_obj

# ============ HOME SETTINGS ROUTES ============

@api_router.get("/home-settings", response_model=HomeSettings)
async def get_home_settings():
    settings = await db.home_settings.find_one({"id": "home-page"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=404, detail="Home settings not found")

    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])

    return settings

@api_router.put("/home-settings", response_model=HomeSettings)
async def update_home_settings(home_data: HomeSettingsUpdate, current_user: User = Depends(get_current_user)):
    settings_obj = HomeSettings(**home_data.model_dump(), updated_at=datetime.now(timezone.utc))
    doc = settings_obj.model_dump()
    doc['updated_at'] = doc['updated_at'].isoformat()

    await db.home_settings.update_one({"id": "home-page"}, {"$set": doc}, upsert=True)
    return settings_obj

# ============ MEDIA ROUTES (Upload de imagens) ============

@api_router.post("/media/upload", response_model=Media)
async def upload_media(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")

        file_extension = Path(file.filename).suffix.lower()
        content_type = (file.content_type or "").lower()
        if not content_type.startswith("image/") and file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Only image uploads are allowed")

        if not file_extension:
            file_extension = mimetypes.guess_extension(content_type) or ".jpg"

        file_bytes = await file.read()
        validate_and_prepare_image_upload(file, file_bytes, file_extension)
        file_bytes, file_extension, content_type = optimize_public_image_upload(
            file_bytes,
            file_extension,
            content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream",
        )

        unique_filename = f"{uuid.uuid4()}{file_extension}"
        public_url = await persist_upload(
            unique_filename,
            file_bytes,
            content_type=content_type or None,
        )

        media_obj = Media(
            filename=file.filename,
            url=public_url,
            uploaded_by=current_user.id
        )

        doc = media_obj.model_dump()
        doc['uploaded_at'] = doc['uploaded_at'].isoformat()

        await db.media.insert_one(doc)
        return media_obj
    except HTTPException:
        raise
    except Exception as error:
        logging.exception("Image upload failed: %s", error)
        raise HTTPException(status_code=500, detail=f"Image upload failed: {error}")

@api_router.post("/media/upload-pdf", response_model=Media)
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    raise HTTPException(
        status_code=400,
        detail="PDF upload was disabled. Please provide an external PDF URL in the edition form."
    )

@api_router.get("/media", response_model=List[Media])
async def get_media(current_user: User = Depends(get_current_user)):
    media_list = await db.media.find({}, {"_id": 0}).sort("uploaded_at", -1).to_list(100)

    for media in media_list:
        if isinstance(media.get('uploaded_at'), str):
            media['uploaded_at'] = datetime.fromisoformat(media['uploaded_at'])

    return media_list

@api_router.get("/media/{filename}")
async def get_media_file(filename: str):
    safe_filename = Path(filename).name
    if safe_filename != filename:
        raise HTTPException(status_code=400, detail="Invalid file path")

    file_path = UPLOADS_DIR / safe_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ============ HOME/DASHBOARD ROUTE ============

def trim_text(value: Optional[str], max_length: int = 220) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(" ", 1)[0].strip() + "..."

def compact_post_card(post: Optional[dict]) -> Optional[dict]:
    if not post:
        return None
    return {
        "id": post.get("id"),
        "slug": post.get("slug"),
        "title": post.get("title"),
        "excerpt": trim_text(post.get("excerpt")),
        "category": post.get("category"),
        "category_id": post.get("category_id"),
        "category_slug": post.get("category_slug"),
        "featured_image": post.get("featured_image"),
        "image_position": post.get("image_position"),
        "author_name": post.get("author_name"),
        "author_image": post.get("author_image"),
        "created_at": post.get("created_at"),
        "updated_at": post.get("updated_at"),
    }

def compact_columnist_card(columnist: dict) -> dict:
    return {
        "id": columnist.get("id"),
        "slug": columnist.get("slug"),
        "name": columnist.get("name"),
        "role": columnist.get("role"),
        "bio": trim_text(columnist.get("bio"), 180),
        "image": columnist.get("image"),
        "created_at": columnist.get("created_at"),
        "updated_at": columnist.get("updated_at"),
    }

def compact_edition_card(edition: Optional[dict], preview_limit: int = 2) -> Optional[dict]:
    if not edition:
        return None
    preview_pages = edition.get("preview_pages") or []
    return {
        "id": edition.get("id"),
        "slug": edition.get("slug"),
        "title": edition.get("title"),
        "description": trim_text(edition.get("description"), 260),
        "cover_image": edition.get("cover_image"),
        "edition_number": edition.get("edition_number"),
        "pdf_url": edition.get("pdf_url"),
        "page_count": edition.get("page_count"),
        "preview_pages": preview_pages[:preview_limit],
        "created_at": edition.get("created_at"),
        "updated_at": edition.get("updated_at"),
    }

async def build_home_post_groups(settings: Optional[dict], latest_posts_limit: int = 40) -> tuple[Optional[dict], List[dict], List[dict]]:
    post_card_projection = {"_id": 0, "content": 0}
    latest_posts = await db.posts.find(
        {"published": True},
        post_card_projection
    ).sort("created_at", -1).to_list(latest_posts_limit)
    latest_posts = dedupe_posts([normalize_post_datetimes(post) for post in latest_posts])

    featured_post_id = settings.get("hero_featured_post_id") if settings else None
    selected_post_ids = settings.get("selected_post_ids", []) if settings else []

    highlighted_featured_candidates = await db.posts.find(
        {"published": True, "destaque_principal_home": True},
        post_card_projection
    ).sort([("updated_at", -1), ("created_at", -1)]).to_list(5)
    highlighted_featured_candidates = dedupe_posts(
        [normalize_post_datetimes(post) for post in highlighted_featured_candidates]
    )
    highlighted_featured_post = highlighted_featured_candidates[0] if highlighted_featured_candidates else None

    selected_featured_post = None
    if featured_post_id:
        selected_featured_post = await db.posts.find_one(
            {"id": featured_post_id, "published": True},
            post_card_projection
        )
        selected_featured_post = normalize_post_datetimes(selected_featured_post)

    featured_post = highlighted_featured_post or selected_featured_post
    if not featured_post and latest_posts:
        featured_post = latest_posts[0].copy()

    recent_posts = []
    used_post_keys = {get_post_identity(featured_post)} if featured_post else set()

    highlighted_secondary_posts = await db.posts.find(
        {"published": True, "destaque_secundario_home": True},
        post_card_projection
    ).to_list(20)
    highlighted_secondary_posts = [
        post
        for post in dedupe_posts(
            [normalize_post_datetimes(post) for post in sort_highlighted_posts(highlighted_secondary_posts)]
        )
        if get_post_identity(post) not in used_post_keys
    ]

    for post in highlighted_secondary_posts:
        recent_posts.append(post)
        used_post_keys.add(get_post_identity(post))
        if len(recent_posts) >= 3:
            break

    if len(recent_posts) < 3:
        for post_id in selected_post_ids:
            selected_post = next(
                (
                    post.copy()
                    for post in latest_posts
                    if post["id"] == post_id and get_post_identity(post) not in used_post_keys
                ),
                None
            )
            if selected_post:
                recent_posts.append(selected_post)
                used_post_keys.add(get_post_identity(selected_post))
            if len(recent_posts) >= 3:
                break

    if len(recent_posts) < 3:
        for post in latest_posts:
            if get_post_identity(post) in used_post_keys:
                continue
            recent_posts.append(post.copy())
            used_post_keys.add(get_post_identity(post))
            if len(recent_posts) >= 3:
                break

    recommended_posts = []
    recommended_used_keys = {get_post_identity(featured_post)} if featured_post else set()
    recommended_used_keys.update(get_post_identity(post) for post in recent_posts)

    for post in latest_posts:
        if get_post_identity(post) in recommended_used_keys:
            continue
        recommended_posts.append(post.copy())
        recommended_used_keys.add(get_post_identity(post))
        if len(recommended_posts) >= 3:
            break

    if not recommended_posts:
        recommended_posts = [post.copy() for post in recent_posts]

    hero_override_image = settings.get("hero_override_image") if settings else None
    if featured_post and hero_override_image:
        featured_post["featured_image"] = hero_override_image

    return featured_post, recent_posts[:3], recommended_posts[:3]

@api_router.get("/home-lite")
async def get_home_lite_data():
    settings = await db.home_settings.find_one({"id": "home-page"}, {"_id": 0})
    featured_post, recent_posts, recommended_posts = await build_home_post_groups(settings, latest_posts_limit=24)

    latest_editions = await db.editions.find(
        {"published": True},
        {"_id": 0, "reader_pages": 0, "pages_base_path": 0}
    ).sort("edition_number", -1).limit(4).to_list(4)
    for edition in latest_editions:
        serialize_datetimes(edition, "created_at", "updated_at")

    featured_edition_id = settings.get("featured_edition_id") if settings else None
    featured_edition_override_image = settings.get("featured_edition_override_image") if settings else None
    featured_edition = next((edition.copy() for edition in latest_editions if edition["id"] == featured_edition_id), None)
    if not featured_edition and latest_editions:
        featured_edition = latest_editions[0].copy()
    if featured_edition and featured_edition_override_image:
        featured_edition["cover_image"] = featured_edition_override_image

    home_columnists = await db.columnists.find(
        {},
        {"_id": 0, "name": 1, "role": 1, "bio": 1, "image": 1, "slug": 1, "id": 1, "created_at": 1, "updated_at": 1}
    ).sort([("name", 1), ("created_at", -1)]).limit(8).to_list(8)
    home_columnists = await ensure_columnist_slugs(home_columnists)

    return {
        "featured_post": compact_post_card(featured_post),
        "recent_posts": [compact_post_card(post) for post in recent_posts],
        "recommended_posts": [compact_post_card(post) for post in recommended_posts],
        "columns": [],
        "columnists": [
            compact_columnist_card(serialize_datetimes(columnist, "created_at", "updated_at"))
            for columnist in home_columnists
        ],
        "events": [],
        "featured_edition": compact_edition_card(featured_edition),
        "editions": [compact_edition_card(edition) for edition in latest_editions],
    }

@api_router.get("/home")
async def get_home_data():
    post_card_projection = {"_id": 0, "content": 0}
    column_card_projection = {"_id": 0, "content": 0}

    settings = await db.home_settings.find_one({"id": "home-page"}, {"_id": 0})

    # Get latest post
    latest_posts = await db.posts.find({"published": True}, post_card_projection).sort("created_at", -1).to_list(80)

    # Get latest columns
    latest_columns = await db.columns.find({"published": True}, column_card_projection).sort("created_at", -1).limit(12).to_list(12)

    # Get registered columnists for the public columnists shelf
    home_columnists = await db.columnists.find({}, {"_id": 0}).sort([("name", 1), ("created_at", -1)]).limit(24).to_list(24)
    home_columnists = await ensure_columnist_slugs(home_columnists)

    # Get upcoming events
    upcoming_events = await db.events.find({"published": True}, {"_id": 0}).sort("event_date", 1).limit(3).to_list(3)

    # Get latest editions
    latest_editions = await db.editions.find({"published": True}, {"_id": 0}).sort("edition_number", -1).limit(10).to_list(10)

    # Convert datetime strings
    for post in latest_posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        if isinstance(post.get('updated_at'), str):
            post['updated_at'] = datetime.fromisoformat(post['updated_at'])

    latest_posts = dedupe_posts(latest_posts)

    for column in latest_columns:
        if isinstance(column.get('created_at'), str):
            column['created_at'] = datetime.fromisoformat(column['created_at'])
        if isinstance(column.get('updated_at'), str):
            column['updated_at'] = datetime.fromisoformat(column['updated_at'])

    for event in upcoming_events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
        if isinstance(event.get('updated_at'), str):
            event['updated_at'] = datetime.fromisoformat(event['updated_at'])
        if isinstance(event.get('event_date'), str):
            event['event_date'] = datetime.fromisoformat(event['event_date'])

    for edition in latest_editions:
        if isinstance(edition.get('created_at'), str):
            edition['created_at'] = datetime.fromisoformat(edition['created_at'])
        if isinstance(edition.get('updated_at'), str):
            edition['updated_at'] = datetime.fromisoformat(edition['updated_at'])

    featured_post_id = settings.get("hero_featured_post_id") if settings else None
    selected_post_ids = settings.get("selected_post_ids", []) if settings else []
    featured_edition_id = settings.get("featured_edition_id") if settings else None
    hero_override_image = settings.get("hero_override_image") if settings else None
    featured_edition_override_image = settings.get("featured_edition_override_image") if settings else None
    archive_edition_items = settings.get("archive_editions", []) if settings else []
    home_column_items = settings.get("home_columns", []) if settings else []

    highlighted_featured_candidates = await db.posts.find(
        {"published": True, "destaque_principal_home": True},
        post_card_projection
    ).sort([("updated_at", -1), ("created_at", -1)]).to_list(10)
    highlighted_featured_candidates = dedupe_posts(
        [normalize_post_datetimes(post) for post in highlighted_featured_candidates]
    )
    highlighted_featured_post = highlighted_featured_candidates[0] if highlighted_featured_candidates else None

    selected_featured_post = None
    if featured_post_id:
        selected_featured_post = await db.posts.find_one(
            {"id": featured_post_id, "published": True},
            post_card_projection
        )
        selected_featured_post = normalize_post_datetimes(selected_featured_post)

    featured_post = highlighted_featured_post or selected_featured_post
    if not featured_post and latest_posts:
        featured_post = latest_posts[0].copy()

    recent_posts = []
    used_post_keys = {get_post_identity(featured_post)} if featured_post else set()

    highlighted_secondary_posts = await db.posts.find(
        {"published": True, "destaque_secundario_home": True},
        post_card_projection
    ).to_list(50)
    highlighted_secondary_posts = [
        post
        for post in dedupe_posts(
            [normalize_post_datetimes(post) for post in sort_highlighted_posts(highlighted_secondary_posts)]
        )
        if get_post_identity(post) not in used_post_keys
    ]

    for post in highlighted_secondary_posts:
        recent_posts.append(post)
        used_post_keys.add(get_post_identity(post))
        if len(recent_posts) >= 3:
            break

    if len(recent_posts) < 3:
        for post_id in selected_post_ids:
            selected_post = next(
                (
                    post.copy()
                    for post in latest_posts
                    if post["id"] == post_id and get_post_identity(post) not in used_post_keys
                ),
                None
            )
            if selected_post:
                recent_posts.append(selected_post)
                used_post_keys.add(get_post_identity(selected_post))
            if len(recent_posts) >= 3:
                break

    if len(recent_posts) < 3:
        for post in latest_posts:
            if get_post_identity(post) in used_post_keys:
                continue
            recent_posts.append(post.copy())
            used_post_keys.add(get_post_identity(post))
            if len(recent_posts) >= 3:
                break

    recommended_posts = []
    recommended_used_keys = {get_post_identity(featured_post)} if featured_post else set()
    recommended_used_keys.update(get_post_identity(post) for post in recent_posts)

    for post in latest_posts:
        if get_post_identity(post) in recommended_used_keys:
            continue
        recommended_posts.append(post.copy())
        recommended_used_keys.add(get_post_identity(post))
        if len(recommended_posts) >= 3:
            break

    if not recommended_posts:
        recommended_posts = [post.copy() for post in recent_posts]

    if featured_post and hero_override_image:
        featured_post["featured_image"] = hero_override_image

    featured_edition = next((edition.copy() for edition in latest_editions if edition["id"] == featured_edition_id), None)
    if not featured_edition and latest_editions:
        featured_edition = latest_editions[0].copy()

    if featured_edition and featured_edition_override_image:
        featured_edition["cover_image"] = featured_edition_override_image

    ordered_editions = []
    used_edition_ids = set()

    for archive_item in archive_edition_items:
        edition_id = archive_item.get("edition_id")
        if not edition_id or edition_id in used_edition_ids:
            continue

        selected_edition = next((edition.copy() for edition in latest_editions if edition["id"] == edition_id), None)
        if not selected_edition:
            continue

        if archive_item.get("override_image"):
            selected_edition["cover_image"] = archive_item["override_image"]

        ordered_editions.append(selected_edition)
        used_edition_ids.add(edition_id)

    if not ordered_editions:
        for edition in latest_editions:
            ordered_editions.append(edition.copy())
            if len(ordered_editions) >= 6:
                break

    column_overrides = {
        item.get("column_id"): item
        for item in home_column_items
        if item.get("column_id")
    }

    ordered_columns = []
    used_column_ids = set()

    for column_item in home_column_items:
        column_id = column_item.get("column_id")
        if not column_id or column_id in used_column_ids:
            continue

        selected_column = next((column.copy() for column in latest_columns if column["id"] == column_id), None)
        if not selected_column:
            continue

        if column_item.get("override_image"):
            selected_column["featured_image"] = column_item["override_image"]

        ordered_columns.append(selected_column)
        used_column_ids.add(column_id)

    for column in latest_columns:
        if column["id"] in used_column_ids:
            continue

        selected_column = column.copy()
        override_item = column_overrides.get(column["id"])
        if override_item and override_item.get("override_image"):
            selected_column["featured_image"] = override_item["override_image"]

        ordered_columns.append(selected_column)

    return {
        "featured_post": featured_post,
        "recent_posts": recent_posts[:3],
        "recommended_posts": recommended_posts[:3],
        "columns": ordered_columns,
        "columnists": [serialize_datetimes(columnist, "created_at", "updated_at") for columnist in home_columnists],
        "events": upcoming_events,
        "featured_edition": featured_edition,
        "editions": ordered_editions
    }

# Include the router in the main app
app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
