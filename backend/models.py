from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import re

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
    author_member_id: Optional[str] = None
    author_name: Optional[str] = None
    author_image: Optional[str] = None
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
