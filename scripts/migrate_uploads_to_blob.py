import argparse
import asyncio
import mimetypes
import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
UPLOADS_DIR = BACKEND_DIR / "uploads"
ENV_FILE = BACKEND_DIR / ".env"


def normalize_slashes(value: str) -> str:
    return value.replace("\\", "/")


def build_reference_candidates(relative_path: str, backend_url: str) -> list[str]:
    normalized = normalize_slashes(relative_path).lstrip("/")
    candidates = [f"/uploads/{normalized}"]
    if backend_url:
        backend_url = backend_url.rstrip("/")
        candidates.append(f"{backend_url}/uploads/{normalized}")
    return candidates


def replace_values(payload: Any, replacements: dict[str, str]) -> Any:
    if isinstance(payload, dict):
        return {key: replace_values(value, replacements) for key, value in payload.items()}
    if isinstance(payload, list):
        return [replace_values(item, replacements) for item in payload]
    if isinstance(payload, str):
        return replacements.get(payload, payload)
    return payload


def login(base_url: str, email: str, password: str) -> str:
    response = requests.post(
        f"{base_url.rstrip('/')}/api/auth/login",
        json={"email": email, "password": password},
        timeout=60,
    )
    response.raise_for_status()

    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("Login succeeded but no access_token was returned")

    return token


def upload_file(base_url: str, access_token: str, file_path: Path) -> str:
    route = "/api/media/upload-pdf" if file_path.suffix.lower() == ".pdf" else "/api/media/upload"
    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"

    with file_path.open("rb") as handle:
        response = requests.post(
            f"{base_url.rstrip('/')}{route}",
            headers={"Authorization": f"Bearer {access_token}"},
            files={"file": (file_path.name, handle, content_type)},
            timeout=900,
        )

    response.raise_for_status()
    payload = response.json()
    url = payload.get("url")
    if not url:
        raise RuntimeError(f"Upload succeeded for {file_path.name} but no URL was returned")
    return url


async def migrate_uploads(
    mongo_url: str,
    db_name: str,
    backend_url: str,
    admin_email: str,
    admin_password: str,
) -> tuple[int, int]:
    mongo = MongoClient(mongo_url)
    db = mongo[db_name]
    access_token = login(backend_url, admin_email, admin_password)

    replacements: dict[str, str] = {}
    uploaded_count = 0

    for file_path in UPLOADS_DIR.rglob("*"):
        if not file_path.is_file():
            continue

        relative_path = normalize_slashes(file_path.relative_to(UPLOADS_DIR).as_posix())
        uploaded_url = upload_file(backend_url, access_token, file_path)
        uploaded_count += 1

        for candidate in build_reference_candidates(relative_path, backend_url):
            replacements[candidate] = uploaded_url

    updated_documents = 0

    for collection_name in db.list_collection_names():
        collection = db[collection_name]
        for document in collection.find({}):
            original = dict(document)
            transformed = replace_values(original, replacements)
            transformed.pop("_id", None)

            if transformed == {key: value for key, value in original.items() if key != "_id"}:
                continue

            collection.update_one({"_id": document["_id"]}, {"$set": transformed})
            updated_documents += 1

    mongo.close()
    return uploaded_count, updated_documents


async def main() -> None:
    load_dotenv(ENV_FILE)

    parser = argparse.ArgumentParser(
        description="Migra uploads locais para o backend online e atualiza as referências no MongoDB."
    )
    parser.add_argument("--mongo-url", default=os.environ.get("MONGO_URL"), help="Connection string do MongoDB de destino.")
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "revista_enfoco"), help="Nome do banco.")
    parser.add_argument(
        "--backend-url",
        default=os.environ.get("RENDER_BACKEND_URL", "https://revista-enfoco-api.onrender.com"),
        help="URL pública do backend usada para upload e referências antigas /uploads.",
    )
    parser.add_argument(
        "--admin-email",
        default=os.environ.get("MIGRATION_ADMIN_EMAIL", "admin@enfoco.com"),
        help="E-mail do admin usado para autenticar os uploads.",
    )
    parser.add_argument(
        "--admin-password",
        default=os.environ.get("MIGRATION_ADMIN_PASSWORD", "Enfoco@2026"),
        help="Senha do admin usada para autenticar os uploads.",
    )
    args = parser.parse_args()

    if not args.mongo_url:
        raise SystemExit("MONGO_URL é obrigatório.")
    if not UPLOADS_DIR.exists():
        raise SystemExit(f"Pasta de uploads não encontrada: {UPLOADS_DIR}")

    uploaded_count, updated_documents = await migrate_uploads(
        mongo_url=args.mongo_url,
        db_name=args.db_name,
        backend_url=args.backend_url,
        admin_email=args.admin_email,
        admin_password=args.admin_password,
    )

    print(f"Arquivos enviados ao backend online: {uploaded_count}")
    print(f"Documentos atualizados no MongoDB: {updated_documents}")


if __name__ == "__main__":
    asyncio.run(main())
