from __future__ import annotations

import argparse
from pathlib import Path

from psycopg2.extras import RealDictCursor

from rewrite_migration_lib import (
    LEGACY_DEVICE_TOKEN_LABEL,
    LEGACY_RAW_MESSAGE_PARSER,
    LOCAL_ENV_FILE,
    MigrationError,
    build_recipient_graph,
    chunked_insert,
    coerce_datetime,
    connect,
    hash_legacy_token,
    load_env,
    map_transaction_source,
    read_json,
    require_env,
    reset_sequence,
    stable_uuid,
    token_prefix,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import a legacy Trackcrow export into the rewrite schema")
    parser.add_argument("--input-dir", required=True, help="Directory containing exported JSON files")
    parser.add_argument(
        "--target-url-env",
        default="DATABASE_URL",
        help="Environment variable containing the target database URL",
    )
    parser.add_argument(
        "--allow-non-empty-db",
        action="store_true",
        help="Skip the empty database check",
    )
    return parser.parse_args()


def load_export(input_dir: Path) -> tuple[dict, dict, list[dict], list[dict], list[dict]]:
    metadata = read_json(input_dir / "metadata.json")
    user = read_json(input_dir / "user.json")
    categories = read_json(input_dir / "categories.json")
    subcategories = read_json(input_dir / "subcategories.json")
    transactions = read_json(input_dir / "transactions.json")
    return metadata, user, categories, subcategories, transactions


def ensure_target_is_empty(cursor, allow_non_empty_db: bool) -> None:
    if allow_non_empty_db:
        return
    tables = [
        "user",
        "category",
        "subcategory",
        "recipient",
        "recipient_identifier",
        "transaction",
        "raw_message",
        "device_token",
    ]
    for table in tables:
        cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
        row = cursor.fetchone()
        count = int(next(iter(row.values()))) if isinstance(row, dict) else int(row[0])
        if count > 0:
            raise MigrationError(
                f'Target database is not empty: table "{table}" already has {count} rows'
            )


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir).resolve()
    if not input_dir.exists():
        raise MigrationError(f"Input directory does not exist: {input_dir}")

    load_env(LOCAL_ENV_FILE)
    target_url = require_env(args.target_url_env)

    metadata, user, categories, subcategories, transactions = load_export(input_dir)
    user_uuid = user["uuid"]

    recipients, identifiers, transaction_recipient_ids = build_recipient_graph(
        user_uuid,
        transactions,
    )

    with connect(target_url) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            ensure_target_is_empty(cursor, args.allow_non_empty_db)

            chunked_insert(
                cursor,
                "user",
                [
                    "uuid",
                    "id",
                    "email",
                    "name",
                    "image",
                    "provider",
                    "subscription",
                    "createdAt",
                    "updatedAt",
                ],
                [
                    (
                        user["uuid"],
                        user["id"],
                        user["email"],
                        user["name"],
                        user["image"],
                        str(user["provider"]).lower(),
                        user["subscription"],
                        coerce_datetime(user["createdAt"]),
                        coerce_datetime(user["updatedAt"]),
                    )
                ],
            )

            chunked_insert(
                cursor,
                "category",
                ["id", "uuid", "user_uuid", "name", "createdAt", "updatedAt"],
                [
                    (
                        row["id"],
                        stable_uuid("trackcrow:category", user_uuid, row["id"], row["name"]),
                        row["user_uuid"],
                        row["name"],
                        coerce_datetime(row["createdAt"]),
                        coerce_datetime(row["updatedAt"]),
                    )
                    for row in categories
                ],
            )

            chunked_insert(
                cursor,
                "subcategory",
                ["id", "uuid", "user_uuid", "categoryId", "name", "createdAt", "updatedAt"],
                [
                    (
                        row["id"],
                        stable_uuid(
                            "trackcrow:subcategory",
                            user_uuid,
                            row["id"],
                            row["categoryId"],
                            row["name"],
                        ),
                        row["user_uuid"],
                        row["categoryId"],
                        row["name"],
                        coerce_datetime(row["createdAt"]),
                        coerce_datetime(row["updatedAt"]),
                    )
                    for row in subcategories
                ],
            )

            chunked_insert(
                cursor,
                "recipient",
                ["id", "uuid", "user_uuid", "displayName", "normalized_name", "createdAt", "updatedAt"],
                [
                    (
                        row.id,
                        row.uuid,
                        row.user_uuid,
                        row.display_name,
                        row.normalized_name,
                        row.created_at,
                        row.updated_at,
                    )
                    for row in recipients
                ],
            )

            chunked_insert(
                cursor,
                "recipient_identifier",
                [
                    "id",
                    "uuid",
                    "user_uuid",
                    "recipient_id",
                    "kind",
                    "value",
                    "normalized_value",
                    "createdAt",
                    "updatedAt",
                ],
                [
                    (
                        row.id,
                        row.uuid,
                        row.user_uuid,
                        row.recipient_id,
                        row.kind,
                        row.value,
                        row.normalized_value,
                        row.created_at,
                        row.updated_at,
                    )
                    for row in identifiers
                ],
            )

            chunked_insert(
                cursor,
                "transaction",
                [
                    "id",
                    "uuid",
                    "user_uuid",
                    "recipient_id",
                    "category_id",
                    "subcategory_id",
                    "amount",
                    "currency",
                    "type",
                    "source",
                    "recipient_raw",
                    "recipient_name",
                    "reference",
                    "account_label",
                    "remarks",
                    "location_raw",
                    "timestamp",
                    "createdAt",
                    "updatedAt",
                ],
                [
                    (
                        row["id"],
                        row["uuid"],
                        row["user_uuid"],
                        transaction_recipient_ids[row["id"]],
                        row["categoryId"],
                        row["subcategoryId"],
                        row["amount"],
                        "INR",
                        row["type"],
                        map_transaction_source(row["input_mode"]),
                        row["recipient"],
                        row["recipient_name"],
                        row["reference"],
                        row["account"],
                        row["remarks"],
                        row["location"],
                        coerce_datetime(row["timestamp"]),
                        coerce_datetime(row["createdAt"]),
                        coerce_datetime(row["updatedAt"]),
                    )
                    for row in transactions
                ],
            )

            raw_message_rows = []
            raw_message_id = 1
            for row in transactions:
                if not row.get("raw_message"):
                    continue
                timestamp = coerce_datetime(row["timestamp"])
                created_at = coerce_datetime(row["createdAt"]) or timestamp
                raw_message_rows.append(
                    (
                        raw_message_id,
                        stable_uuid("trackcrow:raw-message", user_uuid, row["id"], raw_message_id),
                        row["user_uuid"],
                        row["id"],
                        row["raw_message"],
                        "SMS",
                        "PARSED",
                        LEGACY_RAW_MESSAGE_PARSER,
                        None,
                        None,
                        row["location"],
                        timestamp,
                        created_at,
                    )
                )
                raw_message_id += 1

            chunked_insert(
                cursor,
                "raw_message",
                [
                    "id",
                    "uuid",
                    "user_uuid",
                    "transaction_id",
                    "body",
                    "source",
                    "parse_status",
                    "parser_name",
                    "failure_reason",
                    "parsed_payload",
                    "location_raw",
                    "received_at",
                    "createdAt",
                ],
                raw_message_rows,
            )

            device_token_rows = []
            legacy_token = user.get("lt_token")
            if legacy_token:
                created_at = coerce_datetime(user["createdAt"])
                device_token_rows.append(
                    (
                        1,
                        stable_uuid("trackcrow:device-token", user_uuid, legacy_token),
                        user_uuid,
                        LEGACY_DEVICE_TOKEN_LABEL,
                        hash_legacy_token(legacy_token),
                        token_prefix(legacy_token),
                        created_at,
                        None,
                        None,
                    )
                )

            chunked_insert(
                cursor,
                "device_token",
                [
                    "id",
                    "uuid",
                    "user_uuid",
                    "label",
                    "token_hash",
                    "token_prefix",
                    "createdAt",
                    "last_used_at",
                    "revoked_at",
                ],
                device_token_rows,
            )

            for table in [
                "user",
                "category",
                "subcategory",
                "recipient",
                "recipient_identifier",
                "transaction",
                "raw_message",
                "device_token",
            ]:
                reset_sequence(cursor, table)

        conn.commit()

    print(
        {
            "email": metadata["email"],
            "userUuid": user_uuid,
            "categories": len(categories),
            "subcategories": len(subcategories),
            "recipients": len(recipients),
            "recipientIdentifiers": len(identifiers),
            "transactions": len(transactions),
            "rawMessages": len(raw_message_rows),
            "deviceTokens": len(device_token_rows),
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
