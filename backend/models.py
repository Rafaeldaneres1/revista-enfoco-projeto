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

# Post Models (Reportagens)
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
    heyzine_url: Optional[str] = None
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
    slug: Optional[str] = None

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
    whatsapp: Optional[str] = None
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
    hero_secondary_cta_label: str = "Mais reportagens"
    hero_secondary_label: str = "Também em Destaque"
    featured_edition_label: str = "Em Destaque"
    featured_edition_title: str = "Edição Atual"
    featured_edition_primary_cta_label: str = "Abrir Revista"
    featured_edition_secondary_cta_label: str = "Ver Edição"
    recommended_label: str = "Leitura Recomendada"
    recommended_title_prefix: str = "Artigos em"
    recommended_title_emphasis: str = "Destaque"
    recommended_link_label: str = "Ver Todos"
    recommended_empty_message: str = "As chamadas editoriais da home serão exibidas aqui assim que as primeiras reportagens forem cadastradas no backend."
    archive_label: str = "Acervo da Revista"
    archive_title: str = "Edições para navegar"
    archive_description: str = "Clique na capa para abrir o PDF e use as setas para navegar pelo acervo ou pelas páginas de prévia."
    archive_primary_cta_label: str = "Abrir PDF Completo"
    archive_secondary_cta_label: str = "Ver Edição"
    archive_empty_message: str = "As edições da revista serão exibidas aqui assim que forem cadastradas no backend."

    columns_label: str = "Colunas"
    columns_title: str = "Colunas em destaque"
    columns_description: str = "Opinioes, analises e leituras autorais selecionadas pela curadoria editorial da Revista Enfoco."
    columns_link_label: str = "Ver Colunas"
    columns_empty_message: str = "As colunas publicadas aparecerão aqui assim que a curadoria editorial desta seção for preenchida."

class HomeSettingsUpdate(HomeSettingsBase):
    pass

class HomeSettings(HomeSettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str = "home-page"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Banner Models
BANNER_POSITION_VALUES = {
    "home_after_highlights",
    "home_before_editions",
    "posts_after_filters",
    "columns_after_hero",
    "events_after_hero",
    "editions_after_hero",
    "article_middle",
    "article_footer",
}

class BannerBase(BaseModel):
    title: str
    image: str
    link_url: Optional[str] = None
    active: bool = True
    display_order: int = 0
    positions: List[str] = Field(default_factory=list)

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Banner title is required")
        return normalized

    @field_validator("image")
    @classmethod
    def validate_image(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Banner image is required")
        return normalized

    @field_validator("link_url")
    @classmethod
    def normalize_link_url(cls, value: Optional[str]) -> Optional[str]:
        normalized = (value or "").strip()
        return normalized or None

    @field_validator("positions")
    @classmethod
    def validate_positions(cls, value: List[str]) -> List[str]:
        normalized = [item.strip() for item in value if item and item.strip()]
        invalid = [item for item in normalized if item not in BANNER_POSITION_VALUES]
        if invalid:
            raise ValueError("Invalid banner position")
        if not normalized:
            raise ValueError("At least one banner position is required")
        return list(dict.fromkeys(normalized))

class BannerCreate(BannerBase):
    pass

class Banner(BannerBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Privacy / LGPD Models
DEFAULT_PRIVACY_POLICY_TEXT = """A Revista Enfoco respeita a privacidade dos leitores e trata dados pessoais apenas quando necessario para funcionamento do site, seguranca, moderacao de comentarios, atendimento, comunicacao institucional e medicao de audiencia autorizada pelo usuario.

Dados que podem ser tratados: nome, e-mail, comentario enviado para moderacao, dados tecnicos de acesso, cookies necessarios e, quando autorizado, cookies de analytics e marketing.

Os comentarios enviados ao site ficam pendentes de aprovacao e o e-mail do leitor nao aparece publicamente. Comentarios, logs basicos e registros de moderacao podem ser mantidos por ate 12 meses, salvo obrigacao legal, necessidade de seguranca ou pedido de exclusao aplicavel.

O leitor pode solicitar informacoes, correcao ou exclusao de dados pessoais pelo contato Comercial@revistaenfoco.com.br.

Esta politica deve ser revisada pelo responsavel juridico antes do lancamento oficial."""

DEFAULT_COOKIE_POLICY_TEXT = """A Revista Enfoco usa cookies necessarios para funcionamento basico, seguranca, sessao administrativa e preferencias essenciais.

Cookies de analytics ajudam a medir audiencia e desempenho do site. Cookies de marketing podem ser usados para campanhas, mensuracao de anuncios, remarketing e pixels de plataformas como Google e Meta.

Cookies de analytics e marketing so serao carregados apos consentimento do leitor. O leitor pode aceitar todos, rejeitar nao essenciais ou gerenciar preferencias a qualquer momento no rodape do site.

Ao alterar a versao da politica, a Revista Enfoco pode solicitar novo consentimento."""

class PrivacySettingsBase(BaseModel):
    policy_version: str = "2026.06.01"
    company_name: str = "Revista Enfoco"
    cnpj: str = "61.432.454/0001-26"
    privacy_contact_email: EmailStr = "Comercial@revistaenfoco.com.br"
    privacy_policy_text: str = DEFAULT_PRIVACY_POLICY_TEXT
    cookie_policy_text: str = DEFAULT_COOKIE_POLICY_TEXT
    analytics_enabled: bool = False
    marketing_enabled: bool = False
    google_analytics_id: Optional[str] = None
    google_ads_id: Optional[str] = None
    meta_pixel_id: Optional[str] = None
    consent_banner_title: str = "Privacidade e cookies"
    consent_banner_text: str = (
        "Usamos cookies necessarios para o site funcionar. Com sua permissao, tambem usamos "
        "analytics e marketing para melhorar a experiencia e medir campanhas."
    )

    @field_validator(
        "policy_version",
        "company_name",
        "cnpj",
        "privacy_policy_text",
        "cookie_policy_text",
        "consent_banner_title",
        "consent_banner_text",
    )
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = re.sub(r"\s+", " ", (value or "").strip()) if "\n" not in (value or "") else (value or "").strip()
        if not normalized:
            raise ValueError("Field is required")
        return normalized

    @field_validator("google_analytics_id", "google_ads_id", "meta_pixel_id")
    @classmethod
    def normalize_tracking_id(cls, value: Optional[str]) -> Optional[str]:
        normalized = (value or "").strip()
        return normalized or None

class PrivacySettingsUpdate(PrivacySettingsBase):
    pass

class PrivacySettings(PrivacySettingsBase):
    model_config = ConfigDict(extra="ignore")
    id: str = "privacy-settings"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Comment Models
COMMENT_CONTENT_TYPES = {"post", "column"}
COMMENT_STATUS_VALUES = {"pending", "approved", "rejected"}

class CommentCreate(BaseModel):
    content_type: str
    content_slug: str
    author_name: str
    author_email: EmailStr
    body: str
    website: Optional[str] = None
    privacy_consent: bool = False

    @field_validator("content_type")
    @classmethod
    def validate_content_type(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in COMMENT_CONTENT_TYPES:
            raise ValueError("Invalid comment content type")
        return normalized

    @field_validator("content_slug")
    @classmethod
    def validate_content_slug(cls, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise ValueError("Content slug is required")
        return normalized

    @field_validator("author_name")
    @classmethod
    def validate_author_name(cls, value: str) -> str:
        normalized = re.sub(r"\s+", " ", (value or "").strip())
        if len(normalized) < 2:
            raise ValueError("Name is required")
        if len(normalized) > 80:
            raise ValueError("Name is too long")
        return normalized

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        normalized = re.sub(r"\s+", " ", (value or "").strip())
        if len(normalized) < 3:
            raise ValueError("Comment is required")
        if len(normalized) > 1200:
            raise ValueError("Comment is too long")
        return normalized

class CommentStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        normalized = (value or "").strip().lower()
        if normalized not in COMMENT_STATUS_VALUES:
            raise ValueError("Invalid comment status")
        return normalized

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content_type: str
    content_id: Optional[str] = None
    content_slug: str
    content_title: Optional[str] = None
    author_name: str
    author_email: EmailStr
    body: str
    status: str = "pending"
    privacy_consent: bool = True
    privacy_consent_at: Optional[datetime] = None
    retention_until: Optional[datetime] = None
    client_key: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    moderated_by: Optional[str] = None

class PublicComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content_type: str
    content_slug: str
    author_name: str
    body: str
    created_at: datetime

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
