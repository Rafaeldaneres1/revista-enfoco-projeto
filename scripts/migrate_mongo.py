from __future__ import annotations

import argparse
from typing import Iterable

from pymongo import MongoClient


def iter_collection_names(source_db) -> Iterable[str]:
    return sorted(name for name in source_db.list_collection_names() if not name.startswith("system."))


def clone_collection(source_db, target_db, collection_name: str, drop_existing: bool) -> int:
    source_collection = source_db[collection_name]
    target_collection = target_db[collection_name]

    if drop_existing:
        target_collection.drop()

    documents = list(source_collection.find())
    if not documents:
        return 0

    target_collection.insert_many(documents)
    return len(documents)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Copia todas as coleções de um MongoDB de origem para um MongoDB de destino."
    )
    parser.add_argument("--source-uri", required=True, help="URI do Mongo de origem")
    parser.add_argument("--source-db", required=True, help="Nome do banco de origem")
    parser.add_argument("--target-uri", required=True, help="URI do Mongo de destino")
    parser.add_argument("--target-db", required=True, help="Nome do banco de destino")
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Apaga a coleção de destino antes de copiar os documentos",
    )
    args = parser.parse_args()

    source_client = MongoClient(args.source_uri)
    target_client = MongoClient(args.target_uri)

    source_db = source_client[args.source_db]
    target_db = target_client[args.target_db]

    copied_total = 0
    for collection_name in iter_collection_names(source_db):
        copied = clone_collection(source_db, target_db, collection_name, args.drop_existing)
        copied_total += copied
        print(f"{collection_name}: {copied} documento(s) copiado(s)")

    print(f"Concluído. Total de documentos copiados: {copied_total}")


if __name__ == "__main__":
    main()
