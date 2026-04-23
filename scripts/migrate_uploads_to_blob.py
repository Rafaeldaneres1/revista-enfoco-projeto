import argparse
import asyncio
import mimetypes
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from vercel.blob import AsyncBlobClient


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


async def upload_file(client: AsyncBlobClient, file_path: Path, relative_path: str, token: str) -> str:
    content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    file_bytes = file_path.read_bytes()
    blob = await client.put(
        normalize_slashes(relative_path),
        file_bytes,
        access="public",
        content_type=content_type,
        overwrite=True,
        multipart=file_path.suffix.lower() == ".pdf",
        token=token,
    )
    return blob.url


async def migrate_uploads(mongo_url: str, db_name: str, token: str, backend_url: str) -> tuple[int, int]:
    client = AsyncBlobClient()
    mongo = AsyncIOMotorClient(mongo_url)
    db = mongo[db_name]

    replacements: dict[str, str] = {}
    uploaded_count = 0

    for file_path in UPLOADS_DIR.rglob("*"):
        if not file_path.is_file():
            continue

        relative_path = normalize_slashes(file_path.relative_to(UPLOADS_DIR).as_posix())
        blob_url = await upload_file(client, file_path, relative_path, token)
        uploaded_count += 1

        for candidate in build_reference_candidates(relative_path, backend_url):
            replacements[candidate] = blob_url

    updated_documents = 0

    for collection_name in await db.list_collection_names():
        collection = db[collection_name]
        async for document in collection.find({}):
            original = dict(document)
            transformed = replace_values(original, replacements)
            transformed.pop("_id", None)

            if transformed == {k: v for k, v in original.items() if k != "_id"}:
                continue

            await collection.update_one({"_id": document["_id"]}, {"$set": transformed})
            updated_documents += 1

    mongo.close()
    return uploaded_count, updated_documents


async def main() -> None:
    load_dotenv(ENV_FILE)

    parser = argparse.ArgumentParser(description="Migra uploads locais para o Vercel Blob e atualiza as referências no MongoDB.")
    parser.add_argument("--mongo-url", default=os.environ.get("MONGO_URL"), help="Connection string do MongoDB de destino.")
    parser.add_argument("--db-name", default=os.environ.get("DB_NAME", "revista_enfoco"), help="Nome do banco.")
    parser.add_argument("--token", default=os.environ.get("BLOB_READ_WRITE_TOKEN"), help="Token do Vercel Blob.")
    parser.add_argument("--backend-url", default=os.environ.get("RENDER_BACKEND_URL", "https://revista-enfoco-api.onrender.com"), help="URL pública antiga do backend usada nas referências /uploads.")
    args = parser.parse_args()

    if not args.mongo_url:
        raise SystemExit("MONGO_URL é obrigatório.")
    if not args.token:
        raise SystemExit("BLOB_READ_WRITE_TOKEN é obrigatório.")
    if not UPLOADS_DIR.exists():
        raise SystemExit(f"Pasta de uploads não encontrada: {UPLOADS_DIR}")

    uploaded_count, updated_documents = await migrate_uploads(
        mongo_url=args.mongo_url,
        db_name=args.db_name,
        token=args.token,
        backend_url=args.backend_url,
    )

    print(f"Arquivos enviados ao Blob: {uploaded_count}")
    print(f"Documentos atualizados no MongoDB: {updated_documents}")


if __name__ == "__main__":
    asyncio.run(main())
