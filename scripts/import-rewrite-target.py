from __future__ import annotations

import argparse
from pathlib import Path

from psycopg2.extras import RealDictCursor

from rewrite_migration_lib import (
    LEGACY_DEVICE_TOKEN_LABEL,
    LEGACY_RAW_MESSAGE_PARSER,
    LOCAL_ENV_FILE,
    REWRITE_IMPORT_TABLES,
    MigrationError,
    build_recipient_graph,
    chunked_insert,
    connect,
    count_tables,
    format_counts,
    hash_legacy_token,
    legacy_timestamp_to_utc,
    load_env,
    map_transaction_source,
    read_json,
    render_ist,
    require_env,
    reset_sequence,
    stable_uuid,
    token_prefix,
    write_json,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import a legacy Trackcrow export into the rewrite schema"
    )
    parser.add_argument(
        "--input-dir",
        required=True,
        help="Directory containing exported JSON files",
    )
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


def load_export(
    input_dir: Path,
) -> tuple[dict, list[dict], list[dict], list[dict], list[dict]]:
    metadata = read_json(input_dir / "metadata.json")
    users = read_json(input_dir / "users.json")
    categories = read_json(input_dir / "categories.json")
    subcategories = read_json(input_dir / "subcategories.json")
    transactions = read_json(input_dir / "transactions.json")
    return metadata, users, categories, subcategories, transactions


def ensure_target_is_empty(cursor, allow_non_empty_db: bool) -> None:
    if allow_non_empty_db:
        return
    for table in REWRITE_IMPORT_TABLES:
        count = count_tables(cursor, [table])[table]
        if count > 0:
            raise MigrationError(
                f'Target database is not empty: table "{table}" already has {count} rows'
            )


def build_verification_report(
    metadata: dict,
    users: list[dict],
    categories: list[dict],
    subcategories: list[dict],
    transactions: list[dict],
    recipients_count: int,
    identifiers_count: int,
    raw_messages_count: int,
    device_tokens_count: int,
    target_counts: dict[str, int],
) -> dict:
    exported_counts = metadata.get("exported", {}).get("counts", {})
    expected_counts = {
        "user": len(users),
        "category": len(categories),
        "subcategory": len(subcategories),
        "transaction": len(transactions),
        "recipient": recipients_count,
        "recipient_identifier": identifiers_count,
        "raw_message": raw_messages_count,
        "device_token": device_tokens_count,
    }
    count_checks = {
        table_name: {
            "expected": expected_counts[table_name],
            "actual": target_counts.get(table_name, 0),
            "matches": expected_counts[table_name] == target_counts.get(table_name, 0),
        }
        for table_name in expected_counts
    }
    return {
        "scope": metadata.get("scope"),
        "sourcePreflight": metadata.get("preflight"),
        "exported": format_counts("export-artifact", exported_counts),
        "target": format_counts("rewrite-target", target_counts),
        "countChecks": count_checks,
        "timestampSample": metadata.get("timestampSample")
        or {
            "transactionId": None,
            "status": "not-present-in-export",
        },
        "timestampRule": {
            "legacyInterpretation": "utc-semantic naive timestamp",
            "rewriteStorage": "timestamptz same instant",
            "renderedTimezone": "Asia/Kolkata",
            "sampleRenderedIst": (
                render_ist(metadata["timestampSample"]["sourceTimestamp"])
                if metadata.get("timestampSample")
                else None
            ),
        },
    }


def assert_verification_passed(verification_report: dict) -> None:
    failed_checks = [
        table_name
        for table_name, check in verification_report["countChecks"].items()
        if not check["matches"]
    ]
    if failed_checks:
        raise MigrationError(
            "Verification count checks failed for: " + ", ".join(failed_checks)
        )

    timestamp_sample = verification_report.get("timestampSample") or {}
    if timestamp_sample.get("transactionId") == 4878:
        rendered_ist = timestamp_sample.get("renderedIst")
        if rendered_ist != "2026-06-12T22:20:34.186000+05:30":
            raise MigrationError(
                "Timestamp verification failed for transaction 4878: "
                f"renderedIst={rendered_ist!r}"
            )


def main() -> int:
    args = parse_args()
    input_dir = Path(args.input_dir).resolve()
    if not input_dir.exists():
        raise MigrationError(f"Input directory does not exist: {input_dir}")

    load_env(LOCAL_ENV_FILE)
    target_url = require_env(args.target_url_env)

    metadata, users, categories, subcategories, transactions = load_export(input_dir)
    recipients, identifiers, transaction_recipient_ids = build_recipient_graph(
        transactions,
    )

    raw_message_rows: list[tuple] = []
    raw_message_id = 1
    for row in transactions:
        if not row.get("raw_message"):
            continue
        timestamp = legacy_timestamp_to_utc(row["timestamp"])
        created_at = legacy_timestamp_to_utc(row["createdAt"]) or timestamp
        raw_message_rows.append(
            (
                raw_message_id,
                stable_uuid(
                    "trackcrow:raw-message",
                    row["user_uuid"],
                    row["id"],
                    raw_message_id,
                ),
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

    device_token_rows: list[tuple] = []
    device_token_id = 1
    for user in users:
        legacy_token = user.get("lt_token")
        if not legacy_token:
            continue
        created_at = legacy_timestamp_to_utc(user["createdAt"])
        device_token_rows.append(
            (
                device_token_id,
                stable_uuid("trackcrow:device-token", user["uuid"], legacy_token),
                user["uuid"],
                LEGACY_DEVICE_TOKEN_LABEL,
                hash_legacy_token(legacy_token),
                token_prefix(legacy_token),
                created_at,
                None,
                None,
            )
        )
        device_token_id += 1

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
                        legacy_timestamp_to_utc(user["createdAt"]),
                        legacy_timestamp_to_utc(user["updatedAt"]),
                    )
                    for user in users
                ],
            )

            chunked_insert(
                cursor,
                "category",
                ["id", "uuid", "user_uuid", "name", "createdAt", "updatedAt"],
                [
                    (
                        row["id"],
                        stable_uuid(
                            "trackcrow:category",
                            row["user_uuid"],
                            row["id"],
                            row["name"],
                        ),
                        row["user_uuid"],
                        row["name"],
                        legacy_timestamp_to_utc(row["createdAt"]),
                        legacy_timestamp_to_utc(row["updatedAt"]),
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
                            row["user_uuid"],
                            row["id"],
                            row["categoryId"],
                            row["name"],
                        ),
                        row["user_uuid"],
                        row["categoryId"],
                        row["name"],
                        legacy_timestamp_to_utc(row["createdAt"]),
                        legacy_timestamp_to_utc(row["updatedAt"]),
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
                        legacy_timestamp_to_utc(row["timestamp"]),
                        legacy_timestamp_to_utc(row["createdAt"]),
                        legacy_timestamp_to_utc(row["updatedAt"]),
                    )
                    for row in transactions
                ],
            )

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

            for table in REWRITE_IMPORT_TABLES:
                reset_sequence(cursor, table)

            target_counts = count_tables(cursor, REWRITE_IMPORT_TABLES)

        conn.commit()

    verification_report = build_verification_report(
        metadata,
        users,
        categories,
        subcategories,
        transactions,
        len(recipients),
        len(identifiers),
        len(raw_message_rows),
        len(device_token_rows),
        target_counts,
    )
    write_json(input_dir / "verification.json", verification_report)
    assert_verification_passed(verification_report)
    print(verification_report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
