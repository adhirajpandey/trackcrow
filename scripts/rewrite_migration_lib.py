from __future__ import annotations

import hashlib
import json
import os
import re
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlparse

import psycopg2
from dotenv import load_dotenv
from psycopg2 import sql
from psycopg2.extras import execute_values

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DEFAULT_EXPORT_DIR = REPO_ROOT / "scripts" / "data"
SOURCE_ENV_FILE = REPO_ROOT / ".env"
LOCAL_ENV_FILE = REPO_ROOT / ".env.local"
DEFAULT_TARGET_PORT = 55432
DEFAULT_TARGET_DB = "trackcrow_rewrite"
DEFAULT_TARGET_USER = "trackcrow"
DEFAULT_TARGET_CONTAINER = "trackcrow-rewrite-postgres"
DEFAULT_TARGET_VOLUME = "trackcrow-rewrite-postgres-data"
LEGACY_DEVICE_TOKEN_LABEL = "Migrated legacy token"
LEGACY_RAW_MESSAGE_PARSER = "legacy-import"
IST_TIMEZONE = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")
LEGACY_EXPORT_TABLES = [
    "user",
    "category",
    "subcategory",
    "transaction",
]
REWRITE_IMPORT_TABLES = [
    "user",
    "category",
    "subcategory",
    "recipient",
    "recipient_identifier",
    "transaction",
    "raw_message",
    "device_token",
]


class MigrationError(Exception):
    pass


def load_env(path: Path) -> None:
    if path.exists():
        load_dotenv(dotenv_path=path, override=False)


def clean_postgres_url(raw_url: str) -> str:
    parts = urlparse(raw_url)
    allowed = {
        "sslmode",
        "connect_timeout",
        "application_name",
        "options",
        "keepalives",
        "keepalives_idle",
        "keepalives_interval",
        "keepalives_count",
        "target_session_attrs",
    }
    cleaned_query = "&".join(
        f"{key}={value}"
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key in allowed
    )
    return parts._replace(query=cleaned_query).geturl()


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise MigrationError(f"Missing required environment variable: {name}")
    return value


def connect(url: str):
    return psycopg2.connect(clean_postgres_url(url))


def slugify_email(email: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", email.lower()).strip("-")


def ensure_directory(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def json_default(value: Any) -> Any:
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    raise TypeError(f"Unsupported JSON value: {type(value)!r}")


def write_json(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, indent=2, default=json_default),
        encoding="utf-8",
    )


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def fetch_all(cursor, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    cursor.execute(query, params)
    return list(cursor.fetchall())


def count_rows(cursor, table_name: str) -> int:
    cursor.execute(
        sql.SQL('SELECT COUNT(*) FROM {table_name}').format(
            table_name=sql.Identifier(table_name),
        )
    )
    row = cursor.fetchone()
    if row is None:
        return 0
    if isinstance(row, dict):
        return int(next(iter(row.values())))
    return int(row[0])


def count_tables(cursor, table_names: list[str]) -> dict[str, int]:
    return {table_name: count_rows(cursor, table_name) for table_name in table_names}


def normalize_value(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def detect_identifier_kind(value: str) -> str:
    trimmed = value.strip()
    if "@" in trimmed:
        return "UPI_ID"
    if re.fullmatch(r"[0-9]{10,}", re.sub(r"\D", "", trimmed)):
        return "PHONE"
    if trimmed == trimmed.upper() and len(trimmed) > 4:
        return "CARD_MERCHANT"
    return "TEXT"


def map_transaction_source(input_mode: str) -> str:
    normalized = input_mode.strip().upper()
    if normalized == "AUTO":
        return "SMS"
    if normalized == "MANUAL":
        return "MANUAL"
    raise MigrationError(f"Unsupported input mode: {input_mode}")


def coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    raise MigrationError(f"Unsupported datetime value: {value!r}")


def legacy_timestamp_to_utc(value: Any) -> datetime | None:
    coerced = coerce_datetime(value)
    if coerced is None:
        return None
    if coerced.tzinfo is None:
        return coerced.replace(tzinfo=timezone.utc)
    return coerced.astimezone(timezone.utc)


def render_ist(value: Any) -> str | None:
    coerced = legacy_timestamp_to_utc(value)
    if coerced is None:
        return None
    return coerced.astimezone(IST_TIMEZONE).isoformat()


def stable_uuid(namespace: str, *parts: Any) -> str:
    joined = "::".join("" if part is None else str(part) for part in parts)
    return str(uuid.uuid5(uuid.uuid5(uuid.NAMESPACE_URL, namespace), joined))


def build_target_url(password: str, host: str, port: int = DEFAULT_TARGET_PORT) -> str:
    return (
        f"postgresql://{DEFAULT_TARGET_USER}:{password}@{host}:{port}/{DEFAULT_TARGET_DB}"
    )


def hash_legacy_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def token_prefix(token: str) -> str:
    return token[:8]


def quote_env_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def update_env_local_database_url(target_url: str) -> None:
    existing_lines: list[str] = []
    if LOCAL_ENV_FILE.exists():
        existing_lines = LOCAL_ENV_FILE.read_text(encoding="utf-8").splitlines()

    updated_lines: list[str] = []
    replaced = False
    for line in existing_lines:
        if line.startswith("DATABASE_URL="):
            updated_lines.append(f"DATABASE_URL={quote_env_value(target_url)}")
            replaced = True
        else:
            updated_lines.append(line)

    if not replaced:
        if updated_lines and updated_lines[-1] != "":
            updated_lines.append("")
        updated_lines.append(f"DATABASE_URL={quote_env_value(target_url)}")

    LOCAL_ENV_FILE.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")


def prisma_generate_command(target_url: str) -> str:
    escaped = target_url.replace("'", "''")
    return f"$env:DATABASE_URL='{escaped}'; pnpm exec prisma generate"


def prisma_migrate_deploy_command(target_url: str) -> str:
    escaped = target_url.replace("'", "''")
    return f"$env:DATABASE_URL='{escaped}'; pnpm exec prisma migrate deploy"


def format_counts(label: str, counts: dict[str, int]) -> dict[str, Any]:
    return {"label": label, "counts": counts}


def build_timestamp_sample(transactions: list[dict[str, Any]]) -> dict[str, Any] | None:
    target_transaction = next(
        (row for row in transactions if int(row["id"]) == 4878),
        None,
    )
    if target_transaction is None:
        return None
    source_timestamp = target_transaction["timestamp"]
    return {
        "transactionId": 4878,
        "sourceTimestamp": (
            source_timestamp.isoformat()
            if isinstance(source_timestamp, datetime)
            else str(source_timestamp)
        ),
        "migratedInstant": legacy_timestamp_to_utc(source_timestamp).isoformat(),
        "renderedIst": render_ist(source_timestamp),
    }


@dataclass
class LegacyRecipient:
    id: int
    uuid: str
    user_uuid: str
    display_name: str
    normalized_name: str
    created_at: datetime
    updated_at: datetime


@dataclass
class LegacyRecipientIdentifier:
    id: int
    uuid: str
    user_uuid: str
    recipient_id: int
    kind: str
    value: str
    normalized_value: str
    created_at: datetime
    updated_at: datetime


def build_recipient_graph(
    transactions: list[dict[str, Any]]
) -> tuple[list[LegacyRecipient], list[LegacyRecipientIdentifier], dict[int, int]]:
    recipients_by_name: dict[tuple[str, str], LegacyRecipient] = {}
    identifiers_by_key: dict[tuple[str, str, str], LegacyRecipientIdentifier] = {}
    transaction_recipient_ids: dict[int, int] = {}
    recipient_id = 1
    identifier_id = 1

    ordered_transactions = sorted(
        transactions,
        key=lambda row: (
            row["user_uuid"],
            legacy_timestamp_to_utc(row["createdAt"])
            or datetime.min.replace(tzinfo=timezone.utc),
            row["id"],
        ),
    )

    for transaction in ordered_transactions:
        user_uuid = transaction["user_uuid"]
        recipient_raw = (transaction["recipient"] or "").strip()
        if not recipient_raw:
            raise MigrationError(f"Transaction {transaction['id']} has empty recipient")
        display_name = (transaction.get("recipient_name") or recipient_raw).strip()
        normalized_name = normalize_value(display_name)
        normalized_raw = normalize_value(recipient_raw)
        identifier_kind = detect_identifier_kind(recipient_raw)
        recipient_key = (user_uuid, normalized_name)
        identifier_key = (user_uuid, identifier_kind, normalized_raw)
        created_at = legacy_timestamp_to_utc(transaction["createdAt"]) or datetime.now(
            timezone.utc
        )
        updated_at = legacy_timestamp_to_utc(transaction["updatedAt"]) or created_at

        identifier = identifiers_by_key.get(identifier_key)
        if identifier:
            transaction_recipient_ids[transaction["id"]] = identifier.recipient_id
            continue

        recipient = recipients_by_name.get(recipient_key)
        if recipient is None:
            recipient = LegacyRecipient(
                id=recipient_id,
                uuid=stable_uuid("trackcrow:recipient", user_uuid, normalized_name),
                user_uuid=user_uuid,
                display_name=display_name,
                normalized_name=normalized_name,
                created_at=created_at,
                updated_at=updated_at,
            )
            recipients_by_name[recipient_key] = recipient
            recipient_id += 1
        else:
            if created_at < recipient.created_at:
                recipient.created_at = created_at
            if updated_at > recipient.updated_at:
                recipient.updated_at = updated_at

        identifier = LegacyRecipientIdentifier(
            id=identifier_id,
            uuid=stable_uuid(
                "trackcrow:recipient-identifier",
                user_uuid,
                identifier_kind,
                normalized_raw,
            ),
            user_uuid=user_uuid,
            recipient_id=recipient.id,
            kind=identifier_kind,
            value=recipient_raw,
            normalized_value=normalized_raw,
            created_at=created_at,
            updated_at=updated_at,
        )
        identifiers_by_key[identifier_key] = identifier
        transaction_recipient_ids[transaction["id"]] = recipient.id
        identifier_id += 1

    recipients = sorted(recipients_by_name.values(), key=lambda item: item.id)
    identifiers = sorted(identifiers_by_key.values(), key=lambda item: item.id)
    return recipients, identifiers, transaction_recipient_ids


def reset_sequence(cursor, table_name: str, id_column: str = "id") -> None:
    query = sql.SQL(
        """
        SELECT setval(
          pg_get_serial_sequence(%s, %s),
          COALESCE((SELECT MAX({id_column}) FROM {table_name}), 1),
          COALESCE((SELECT MAX({id_column}) FROM {table_name}), 0) > 0
        )
        """
    ).format(
        id_column=sql.Identifier(id_column),
        table_name=sql.Identifier(table_name),
    )
    cursor.execute(query, (table_name, id_column))


def chunked_insert(
    cursor,
    table_name: str,
    columns: list[str],
    rows: list[tuple[Any, ...]],
    page_size: int = 100,
) -> None:
    if not rows:
        return
    column_sql = ", ".join(f'"{column}"' for column in columns)
    query = f'INSERT INTO "{table_name}" ({column_sql}) VALUES %s'
    execute_values(cursor, query, rows, page_size=page_size)
