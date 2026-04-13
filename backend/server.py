from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
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
from PIL import Image, UnidentifiedImageError

try:
    import fitz  # PyMuPDF
except ImportError:  # pragma: no cover - optional dependency in some environments
    fitz = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')
uploads_dir_env = os.environ.get("UPLOADS_DIR")
UPLOADS_DIR = Path(uploads_dir_env).expanduser() if uploads_dir_env else ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_UPLOAD_SIZE = 15 * 1024 * 1024  # 15 MB
LOGIN_RATE_LIMIT_ATTEMPTS = 5
LOGIN_RATE_LIMIT_WINDOW = timedelta(minutes=15)
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".bmp", ".tiff"}


def parse_cors_origins(raw_origins: Optional[str]) -> List[str]:
    if not raw_origins:
        raise RuntimeError("CORS_ORIGINS environment variable is required")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    if not origins:
        raise RuntimeError("CORS_ORIGINS environment variable must contain at least one origin")
    if "*" in origins:
        raise RuntimeError("CORS_ORIGINS cannot contain wildcard '*' in production configuration")
    return origins

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
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()
login_attempts: Dict[str, deque] = defaultdict(deque)

# Create the main app
app = FastAPI(title="Revista Enfoco API")
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "editor"  # admin or editor

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Post Models (Notícias)
class PostBase(BaseModel):
    title: str
    content: str
    excerpt: str
    category: str = "Geral"
    category_id: Optional[str] = None
    category_slug: Optional[str] = None
    featured_image: Optional[str] = None
    image_position: Optional[str] = None
    author_name: Optional[str] = None
    destaque_principal_home: bool = False
    destaque_secundario_home: bool = False
    ordem_destaque: int = 0
    published: bool = True

class PostCreate(PostBase):
    pass

class Post(PostBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    author_id: str
    author_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Column Models (Colunas)
class ColumnBase(BaseModel):
    title: str
    content: str
    excerpt: str
    featured_image: Optional[str] = None
    image_position: Optional[str] = None
    columnist_id: Optional[str] = None
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    author_bio: Optional[str] = None
    author_image: Optional[str] = None
    published: bool = True

class ColumnCreate(ColumnBase):
    pass

class Column(ColumnBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    author_id: str
    author_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Event Models (Eventos)
class EventBase(BaseModel):
    title: str
    description: str
    event_date: datetime
    location: Optional[str] = None
    event_images: List[str] = Field(default_factory=list)
    published: bool = True

class EventCreate(EventBase):
    pass

class Event(EventBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Edition Models (Edições)
class EditionBase(BaseModel):
    title: str
    description: str
    cover_image: Optional[str] = None
    edition_number: int
    pdf_url: Optional[str] = None
    page_count: Optional[int] = None
    pages_base_path: Optional[str] = None
    reader_pages: List[str] = Field(default_factory=list)
    preview_pages: List[str] = Field(default_factory=list)
    published: bool = True

class EditionCreate(EditionBase):
    pass

class Edition(EditionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Category Models
HEX_COLOR_RE = re.compile(r"^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$")

class CategoryBase(BaseModel):
    name: str
    color: str = "#3B82F6"
    active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Category name is required")
        return normalized

    @field_validator("color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        normalized = value.strip()
        if not HEX_COLOR_RE.fullmatch(normalized):
            raise ValueError("Color must be a valid HEX value like #3B82F6")
        return normalized.upper()

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    slug: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Editorial Team Models
class TeamMemberBase(BaseModel):
    name: str
    role: str
    image: Optional[str] = None
    bio: str
    display_order: int = 0
    published: bool = True

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMember(TeamMemberBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Columnist Models
class ColumnistBase(BaseModel):
    name: str
    role: str
    bio: str
    image: Optional[str] = None

class ColumnistCreate(ColumnistBase):
    pass

class Columnist(ColumnistBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AboutValueItem(BaseModel):
    title: str
    description: str

class AboutSocialLinks(BaseModel):
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    linkedin: Optional[str] = None

class AboutSettingsBase(BaseModel):
    location: str = "Santa Maria - RS"
    cover_image: Optional[str] = None
    eyebrow: str
    hero_title: str
    intro: str
    paragraphs: List[str] = Field(default_factory=list)
    mission: str
    values: List[AboutValueItem] = Field(default_factory=list)
    team_title: str = "Equipe Editorial"
    team_description: str = "Rostos e vozes que ajudam a construir a presença editorial da EnFoco com sensibilidade e identidade."
    contact_title: str = "Entre em Contato"
    contact_description: str = "Os canais oficiais serão publicados assim que o material institucional definitivo for enviado."
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_city: str = "Santa Maria - RS"
    social: AboutSocialLinks = Field(default_factory=AboutSocialLinks)

class AboutSettingsUpdate(AboutSettingsBase):
    pass

class AboutSettings(AboutSettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str = "about-page"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HomeSettingsBase(BaseModel):
    archive_editions: List[dict] = Field(default_factory=list)
    home_columns: List[dict] = Field(default_factory=list)
    hero_display_mode: str = "fixed"
    hero_featured_post_id: Optional[str] = None
    selected_post_ids: List[str] = Field(default_factory=list)
    featured_edition_id: Optional[str] = None
    hero_override_image: Optional[str] = None
    featured_edition_override_image: Optional[str] = None
    hero_primary_cta_label: str = "Ler Matéria"
    hero_secondary_cta_label: str = "Mais notícias"
    hero_secondary_label: str = "Também em Destaque"
    featured_edition_label: str = "Em Destaque"
    featured_edition_title: str = "Edição Atual"
    featured_edition_primary_cta_label: str = "Abrir Revista"
    featured_edition_secondary_cta_label: str = "Ver Edição"
    recommended_label: str = "Leitura Recomendada"
    recommended_title_prefix: str = "Artigos em"
    recommended_title_emphasis: str = "Destaque"
    recommended_link_label: str = "Ver Todos"
    recommended_empty_message: str = "As chamadas editoriais da home serão exibidas aqui assim que as primeiras notícias forem cadastradas no backend."
    archive_label: str = "Acervo da Revista"
    archive_title: str = "Edições para navegar"
    archive_description: str = "Clique na capa para abrir o PDF e use as setas para navegar pelo acervo ou pelas páginas de prévia."
    archive_primary_cta_label: str = "Abrir PDF Completo"
    archive_secondary_cta_label: str = "Ver Edição"
    archive_empty_message: str = "As edições da revista serão exibidas aqui assim que forem cadastradas no backend."

    columns_label: str = "Colunas"
    columns_title: str = "Vozes em destaque"
    columns_description: str = "Textos autorais, leituras de contexto e pontos de vista que ampliam a experiÃªncia editorial da Revista Enfoco."
    columns_link_label: str = "Ver Colunas"
    columns_empty_message: str = "As colunas publicadas aparecerÃ£o aqui assim que a curadoria editorial desta seÃ§Ã£o for preenchida."

class HomeSettingsUpdate(HomeSettingsBase):
    pass

class HomeSettings(HomeSettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str = "home-page"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Media Models
class Media(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    url: str
    uploaded_by: str
    generated_pages: List[str] = Field(default_factory=list)
    generated_preview_pages: List[str] = Field(default_factory=list)
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

def _prune_login_attempts(client_key: str, now: datetime) -> deque:
    attempts = login_attempts[client_key]
    cutoff = now - LOGIN_RATE_LIMIT_WINDOW
    while attempts and attempts[0] < cutoff:
        attempts.popleft()
    return attempts

def enforce_login_rate_limit(client_key: str) -> None:
    now = datetime.now(timezone.utc)
    attempts = _prune_login_attempts(client_key, now)
    if len(attempts) >= LOGIN_RATE_LIMIT_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    attempts.append(now)

def clear_login_rate_limit(client_key: str) -> None:
    login_attempts.pop(client_key, None)

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
        return

    try:
        with Image.open(BytesIO(file_bytes)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**{k: v for k, v in user.items() if k != 'hashed_password'})

def create_slug(title: str) -> str:
    return slugify(title)

def build_upload_public_url(filename: str) -> str:
    return f"/uploads/{filename}"

def build_upload_storage_path(relative_path: str) -> Path:
    normalized = Path(relative_path)
    return UPLOADS_DIR / normalized

def generate_pdf_page_images(pdf_path: Path, source_stem: str) -> dict:
    if fitz is None:
        return {"generated_pages": [], "generated_preview_pages": []}

    try:
        document = fitz.open(pdf_path)
    except Exception as error:
        logging.exception("Failed to open uploaded PDF for page generation: %s", error)
        return {"generated_pages": [], "generated_preview_pages": []}

    relative_dir = Path("editions") / source_stem
    output_dir = build_upload_storage_path(relative_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    generated_pages = []

    try:
        for index in range(document.page_count):
            page = document.load_page(index)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
            relative_file = relative_dir / f"page-{index + 1}.png"
            output_path = build_upload_storage_path(relative_file)
            pix.save(output_path)
            generated_pages.append(build_upload_public_url(relative_file.as_posix()))
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

def hydrate_column_with_columnist(column: Optional[dict], columnist: Optional[dict]) -> Optional[dict]:
    if not column or not columnist:
        return column

    column["columnist_id"] = columnist.get("id")
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
async def login(user_data: UserLogin, request: Request):
    client_key = get_request_client_key(request, user_data.email)
    enforce_login_rate_limit(client_key)
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not verify_password(user_data.password, user['hashed_password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    clear_login_rate_limit(client_key)
    access_token = create_access_token(data={"sub": user['id']})
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'hashed_password'})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

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

    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        if isinstance(post.get('updated_at'), str):
            post['updated_at'] = datetime.fromisoformat(post['updated_at'])

    posts = dedupe_posts(posts)
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

    return post

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post_dict = post_data.model_dump()
    post_dict = await resolve_post_category_reference(post_dict)
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
    post_dict = await enforce_home_highlight_rules(post_dict, current_post_id=post_id)
    post_dict['slug'] = create_slug(post_data.title)
    post_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.posts.update_one({"id": post_id}, {"$set": post_dict})
    
    updated_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if isinstance(updated_post.get('created_at'), str):
        updated_post['created_at'] = datetime.fromisoformat(updated_post['created_at'])
    if isinstance(updated_post.get('updated_at'), str):
        updated_post['updated_at'] = datetime.fromisoformat(updated_post['updated_at'])
    
    return updated_post

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

@api_router.get("/home-highlights")
async def get_home_highlights():
    featured_candidates = await db.posts.find(
        {"published": True, "destaque_principal_home": True},
        {"_id": 0}
    ).sort([("updated_at", -1), ("created_at", -1)]).to_list(10)

    featured_candidates = dedupe_posts([normalize_post_datetimes(post) for post in featured_candidates])
    featured_post = featured_candidates[0] if featured_candidates else None

    secondary_posts = await db.posts.find(
        {"published": True, "destaque_secundario_home": True},
        {"_id": 0}
    ).to_list(50)

    secondary_posts = [
        post
        for post in dedupe_posts(
            [normalize_post_datetimes(post) for post in sort_highlighted_posts(secondary_posts)]
        )
        if not featured_post or get_post_identity(post) != get_post_identity(featured_post)
    ]

    return {
        "featured_post": featured_post,
        "secondary_posts": secondary_posts
    }

# ============ COLUMNS ROUTES (Colunas) ============

@api_router.get("/columns", response_model=List[Column])
async def get_columns(limit: int = 100, skip: int = 0, published: Optional[bool] = None):
    query = {}
    if published is not None:
        query['published'] = published
    
    columns = await db.columns.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    columnists_map = await get_columnists_map([column.get("columnist_id") for column in columns])

    for column in columns:
        serialize_datetimes(column, 'created_at', 'updated_at')
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
    return [serialize_datetimes(columnist, "created_at", "updated_at") for columnist in columnists]

@api_router.get("/columnists/{columnist_id}", response_model=Columnist)
async def get_columnist(columnist_id: str):
    columnist = await db.columnists.find_one({"id": columnist_id}, {"_id": 0})
    if not columnist:
        raise HTTPException(status_code=404, detail="Columnist not found")

    return serialize_datetimes(columnist, "created_at", "updated_at")

@api_router.post("/columnists", response_model=Columnist)
async def create_columnist(columnist_data: ColumnistCreate, current_user: User = Depends(get_current_user)):
    columnist_obj = Columnist(**columnist_data.model_dump())
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

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOADS_DIR / unique_filename

    with file_path.open("wb") as buffer:
        buffer.write(file_bytes)

    media_obj = Media(
        filename=file.filename,
        url=build_upload_public_url(unique_filename),
        uploaded_by=current_user.id
    )
    
    doc = media_obj.model_dump()
    doc['uploaded_at'] = doc['uploaded_at'].isoformat()
    
    await db.media.insert_one(doc)
    return media_obj

@api_router.post("/media/upload-pdf", response_model=Media)
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    content_type = (file.content_type or "").lower()
    file_extension = Path(file.filename).suffix.lower()

    if content_type not in {"application/pdf", "application/x-pdf"} and file_extension != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF uploads are allowed")

    unique_filename = f"{uuid.uuid4()}.pdf"
    file_path = UPLOADS_DIR / unique_filename

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    generated_assets = generate_pdf_page_images(file_path, Path(unique_filename).stem)

    media_obj = Media(
        filename=file.filename,
        url=build_upload_public_url(unique_filename),
        uploaded_by=current_user.id,
        generated_pages=generated_assets["generated_pages"],
        generated_preview_pages=generated_assets["generated_preview_pages"]
    )

    doc = media_obj.model_dump()
    doc['uploaded_at'] = doc['uploaded_at'].isoformat()

    await db.media.insert_one(doc)
    return media_obj

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

@api_router.get("/home")
async def get_home_data():
    settings = await db.home_settings.find_one({"id": "home-page"}, {"_id": 0})

    # Get latest post
    latest_posts = await db.posts.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    # Get latest columns
    latest_columns = await db.columns.find({"published": True}, {"_id": 0}).sort("created_at", -1).limit(12).to_list(12)
    
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
        {"_id": 0}
    ).sort([("updated_at", -1), ("created_at", -1)]).to_list(10)
    highlighted_featured_candidates = dedupe_posts(
        [normalize_post_datetimes(post) for post in highlighted_featured_candidates]
    )
    highlighted_featured_post = highlighted_featured_candidates[0] if highlighted_featured_candidates else None

    selected_featured_post = None
    if featured_post_id:
        selected_featured_post = await db.posts.find_one(
            {"id": featured_post_id, "published": True},
            {"_id": 0}
        )
        selected_featured_post = normalize_post_datetimes(selected_featured_post)

    featured_post = highlighted_featured_post or selected_featured_post
    if not featured_post and latest_posts:
        featured_post = latest_posts[0].copy()

    recent_posts = []
    used_post_keys = {get_post_identity(featured_post)} if featured_post else set()

    highlighted_secondary_posts = await db.posts.find(
        {"published": True, "destaque_secundario_home": True},
        {"_id": 0}
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
    allow_origins=parse_cors_origins(os.environ.get('CORS_ORIGINS')),
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
