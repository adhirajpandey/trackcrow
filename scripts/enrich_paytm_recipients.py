import argparse
import csv
import os
import re
import sys
import uuid
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urlparse

import psycopg2


DEFAULT_STATEMENT_PATH = Path("scripts/inputs/paytm-statement.csv")
DEFAULT_REPORT_PATH = Path("scripts/outputs/recipient-enrichment-report.csv")
DETAILS_PATTERNS = (
    re.compile(r"^Paid to\s+(?P<name>.+)$"),
    re.compile(r"^Money sent to\s+(?P<name>.+)$"),
    re.compile(r"^Received from\s+(?P<name>.+)$"),
)
LOW_CONFIDENCE_NAMES = {
    "unknown",
    "upi recipient",
    "upi payee",
    "upi merchant",
}


@dataclass
class StatementMapping:
    upi_id: str
    normalized_upi: str
    canonical_name: str
    normalized_name: str
    raw_name_counts: Counter[str]


@dataclass
class RecipientRecord:
    id: int
    uuid: str
    display_name: str
    normalized_name: str


@dataclass
class IdentifierRecord:
    id: int
    recipient_id: int
    value: str
    normalized_value: str


def normalize_value(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def collapse_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def title_case_words(value: str) -> str:
    words = collapse_spaces(value).split(" ")
    return " ".join(word if word.isdigit() else word[:1].upper() + word[1:].lower() for word in words)


def load_env_defaults() -> None:
    env_paths = [Path(".env"), Path(".env.local")]
    defaults: dict[str, str] = {}
    for env_path in env_paths:
        if not env_path.exists():
            continue
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                defaults[key] = value

    for key, value in defaults.items():
        if key not in os.environ:
            os.environ[key] = value


def get_connection_kwargs() -> dict[str, str | int]:
    load_env_defaults()
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set in the environment or .env files")

    parsed = urlparse(database_url)
    if parsed.scheme not in {"postgres", "postgresql"}:
        raise RuntimeError("DATABASE_URL must use the postgres or postgresql scheme")

    supported_query_keys = {"sslmode", "connect_timeout", "application_name", "target_session_attrs"}
    query_params = parse_qs(parsed.query, keep_blank_values=False)
    connection_kwargs: dict[str, str | int] = {
        "dbname": parsed.path.lstrip("/"),
        "user": parsed.username or "",
        "password": parsed.password or "",
        "host": parsed.hostname or "",
    }
    if parsed.port:
        connection_kwargs["port"] = parsed.port

    for key in supported_query_keys:
        values = query_params.get(key)
        if values:
            connection_kwargs[key] = values[-1]

    return connection_kwargs


def choose_canonical_name(name_counts: Counter[str]) -> str:
    def score(name: str) -> tuple[int, int, int, str]:
        normalized = collapse_spaces(name)
        is_title = int(normalized == title_case_words(normalized))
        has_lower = int(any(char.islower() for char in normalized))
        return (name_counts[name], is_title, has_lower, normalized.casefold())

    best_name = max(name_counts, key=score)
    return title_case_words(best_name)


def parse_statement_rows(statement_path: Path) -> tuple[list[StatementMapping], list[dict[str, str]], int]:
    with statement_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)

    grouped_names: dict[str, Counter[str]] = {}
    representative_upis: dict[str, str] = {}
    skipped_rows: list[dict[str, str]] = []

    for row in rows:
        details = collapse_spaces(row.get("Transaction Details", ""))
        other_details = collapse_spaces(row.get("Other Transaction Details (UPI ID or A/c No)", ""))
        matched_name = None
        for pattern in DETAILS_PATTERNS:
            match = pattern.match(details)
            if match:
                matched_name = collapse_spaces(match.group("name"))
                break

        upi_id = collapse_spaces(other_details.split(" on ")[0]) if other_details else ""

        if not matched_name or not upi_id or "@" not in upi_id:
            skipped_rows.append(
                {
                    "transaction_details": details,
                    "other_details": other_details,
                }
            )
            continue

        normalized_upi = normalize_value(upi_id)
        grouped_names.setdefault(normalized_upi, Counter())[matched_name] += 1
        representative_upis.setdefault(normalized_upi, upi_id)

    mappings: list[StatementMapping] = []
    for normalized_upi, name_counts in sorted(grouped_names.items()):
        canonical_name = choose_canonical_name(name_counts)
        mappings.append(
            StatementMapping(
                upi_id=representative_upis[normalized_upi],
                normalized_upi=normalized_upi,
                canonical_name=canonical_name,
                normalized_name=normalize_value(canonical_name),
                raw_name_counts=name_counts,
            )
        )

    return mappings, skipped_rows, len(rows)


def is_low_quality_name(value: str) -> bool:
    trimmed = collapse_spaces(value)
    if not trimmed:
        return True
    if normalize_value(trimmed) in LOW_CONFIDENCE_NAMES:
        return True
    if "@" in trimmed:
        return True
    if len(trimmed) <= 1:
        return True
    letters_only = re.sub(r"[^A-Za-z]+", "", trimmed)
    if len(letters_only) <= 1:
        return True
    return False


def fetch_user_uuid(cursor: psycopg2.extensions.cursor, user_email: str) -> str:
    cursor.execute('SELECT uuid FROM "user" WHERE email = %s', (user_email,))
    row = cursor.fetchone()
    if not row:
        raise RuntimeError(f"No user found for email: {user_email}")
    return row[0]


def fetch_recipients(
    cursor: psycopg2.extensions.cursor, user_uuid: str
) -> tuple[dict[int, RecipientRecord], dict[str, RecipientRecord], dict[str, IdentifierRecord]]:
    cursor.execute(
        """
        SELECT id, uuid, "displayName", normalized_name
        FROM recipient
        WHERE user_uuid = %s
        """,
        (user_uuid,),
    )
    recipients_by_id: dict[int, RecipientRecord] = {}
    recipients_by_normalized_name: dict[str, RecipientRecord] = {}
    for row in cursor.fetchall():
        record = RecipientRecord(
            id=row[0],
            uuid=row[1],
            display_name=row[2],
            normalized_name=row[3],
        )
        recipients_by_id[record.id] = record
        recipients_by_normalized_name[record.normalized_name] = record

    cursor.execute(
        """
        SELECT id, recipient_id, value, normalized_value
        FROM recipient_identifier
        WHERE user_uuid = %s AND kind = 'UPI_ID'
        """,
        (user_uuid,),
    )
    identifiers_by_upi: dict[str, IdentifierRecord] = {}
    for row in cursor.fetchall():
        record = IdentifierRecord(
            id=row[0],
            recipient_id=row[1],
            value=row[2],
            normalized_value=row[3],
        )
        identifiers_by_upi[record.normalized_value] = record

    return recipients_by_id, recipients_by_normalized_name, identifiers_by_upi


def render_name_variants(name_counts: Counter[str]) -> str:
    ordered = sorted(name_counts.items(), key=lambda item: (-item[1], item[0].casefold()))
    return "; ".join(f"{name} ({count})" for name, count in ordered)


def classify_mappings(
    mappings: Iterable[StatementMapping],
    recipients_by_id: dict[int, RecipientRecord],
    recipients_by_normalized_name: dict[str, RecipientRecord],
    identifiers_by_upi: dict[str, IdentifierRecord],
) -> list[dict[str, str | int | None]]:
    report_rows: list[dict[str, str | int | None]] = []

    for mapping in mappings:
        identifier = identifiers_by_upi.get(mapping.normalized_upi)
        matched_recipient = recipients_by_normalized_name.get(mapping.normalized_name)
        status = "already_good"
        target_recipient: RecipientRecord | None = None
        identifier_recipient: RecipientRecord | None = None
        name_match_recipient: RecipientRecord | None = matched_recipient
        display_name_update: str | None = None
        recommended_action = "none"
        notes = ""

        if identifier:
            identifier_recipient = recipients_by_id[identifier.recipient_id]
            target_recipient = identifier_recipient
            if matched_recipient and matched_recipient.id != identifier_recipient.id:
                status = "merge_candidate"
                recommended_action = "review_duplicate_recipients"
                notes = (
                    f"identifier linked to '{identifier_recipient.display_name}' "
                    f"but statement name matches existing recipient '{matched_recipient.display_name}'"
                )
            elif (
                normalize_value(identifier_recipient.display_name) != mapping.normalized_name
                and is_low_quality_name(identifier_recipient.display_name)
            ):
                status = "update_display_name"
                display_name_update = mapping.canonical_name
                recommended_action = "update_display_name"
                notes = "existing recipient display name is low confidence"
            else:
                recommended_action = "none"
                notes = "identifier already linked and recipient display name is acceptable"
        elif matched_recipient:
            status = "create_identifier"
            target_recipient = matched_recipient
            recommended_action = "create_identifier"
            notes = "existing recipient match found by normalized name"
        else:
            status = "unmatched"
            recommended_action = "review_unmatched"
            notes = "no existing recipient matches the statement name"

        report_rows.append(
            {
                "status": status,
                "upi_id": mapping.upi_id,
                "statement_name": mapping.canonical_name,
                "statement_name_variants": render_name_variants(mapping.raw_name_counts),
                "recipient_id": target_recipient.id if target_recipient else "",
                "recipient_uuid": target_recipient.uuid if target_recipient else "",
                "recipient_display_name": target_recipient.display_name if target_recipient else "",
                "recipient_normalized_name": target_recipient.normalized_name if target_recipient else "",
                "identifier_recipient_id": identifier_recipient.id if identifier_recipient else "",
                "identifier_recipient_uuid": identifier_recipient.uuid if identifier_recipient else "",
                "identifier_recipient_display_name": (
                    identifier_recipient.display_name if identifier_recipient else ""
                ),
                "name_match_recipient_id": name_match_recipient.id if name_match_recipient else "",
                "name_match_recipient_uuid": name_match_recipient.uuid if name_match_recipient else "",
                "name_match_recipient_display_name": (
                    name_match_recipient.display_name if name_match_recipient else ""
                ),
                "display_name_update": display_name_update or "",
                "recommended_action": recommended_action,
                "notes": notes,
            }
        )

    # Prevent display-name writes that would collapse multiple recipients onto the same
    # normalized recipient name in this run. Those need manual duplicate review.
    update_targets = Counter(
        normalize_value(str(row["display_name_update"]))
        for row in report_rows
        if row["status"] == "update_display_name" and row["display_name_update"]
    )
    for row in report_rows:
        if row["status"] != "update_display_name" or not row["display_name_update"]:
            continue

        target_normalized_name = normalize_value(str(row["display_name_update"]))
        if update_targets[target_normalized_name] <= 1:
            continue

        row["status"] = "merge_candidate"
        row["recommended_action"] = "review_duplicate_recipients"
        row["notes"] = (
            "multiple recipients in this run would normalize to the same display name; "
            "manual duplicate review required"
        )
        row["name_match_recipient_id"] = row["recipient_id"]
        row["name_match_recipient_uuid"] = row["recipient_uuid"]
        row["name_match_recipient_display_name"] = str(row["display_name_update"])
        row["display_name_update"] = ""

    return report_rows


def write_report(report_path: Path, report_rows: list[dict[str, str | int | None]]) -> None:
    report_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "status",
        "upi_id",
        "statement_name",
        "statement_name_variants",
        "recipient_id",
        "recipient_uuid",
        "recipient_display_name",
        "recipient_normalized_name",
        "identifier_recipient_id",
        "identifier_recipient_uuid",
        "identifier_recipient_display_name",
        "name_match_recipient_id",
        "name_match_recipient_uuid",
        "name_match_recipient_display_name",
        "display_name_update",
        "recommended_action",
        "notes",
    ]
    with report_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(report_rows)


def apply_changes(
    cursor: psycopg2.extensions.cursor,
    user_uuid: str,
    report_rows: list[dict[str, str | int | None]],
) -> dict[str, int]:
    created_identifiers = 0
    updated_display_names = 0

    for row in report_rows:
        recipient_id = row["recipient_id"]
        if row["status"] == "create_identifier" and recipient_id:
            cursor.execute(
                """
                INSERT INTO recipient_identifier
                  (uuid, user_uuid, recipient_id, kind, value, normalized_value, "createdAt", "updatedAt")
                VALUES
                  (%s, %s, %s, 'UPI_ID', %s, %s, NOW(), NOW())
                """,
                (
                    str(uuid.uuid4()),
                    user_uuid,
                    recipient_id,
                    row["upi_id"],
                    normalize_value(str(row["upi_id"])),
                ),
            )
            created_identifiers += 1

        if row["status"] == "update_display_name" and recipient_id and row["display_name_update"]:
            new_display_name = str(row["display_name_update"])
            cursor.execute(
                """
                UPDATE recipient
                SET "displayName" = %s,
                    normalized_name = %s,
                    "updatedAt" = NOW()
                WHERE id = %s AND user_uuid = %s
                """,
                (new_display_name, normalize_value(new_display_name), recipient_id, user_uuid),
            )
            updated_display_names += 1

    return {
        "created_identifiers": created_identifiers,
        "updated_display_names": updated_display_names,
    }


def print_summary(total_rows: int, mappings: list[StatementMapping], skipped_rows: list[dict[str, str]], report_rows: list[dict[str, str | int | None]], apply_mode: bool, report_path: Path, write_counts: dict[str, int] | None = None) -> None:
    status_counts = Counter(str(row["status"]) for row in report_rows)
    print(f"Statement rows read: {total_rows}")
    print(f"Unique UPI mappings: {len(mappings)}")
    print(f"Skipped rows: {len(skipped_rows)}")
    print(f"Identifiers to create: {status_counts['create_identifier']}")
    print(f"Display names to improve: {status_counts['update_display_name']}")
    print(f"Already good: {status_counts['already_good']}")
    print(f"Unmatched mappings: {status_counts['unmatched']}")
    print(f"Merge candidates: {status_counts['merge_candidate']}")
    print(f"Mode: {'apply' if apply_mode else 'dry-run'}")
    print(f"Report: {report_path}")

    if skipped_rows:
        print("\nSkipped rows:")
        for row in skipped_rows[:10]:
            print(f"- {row['transaction_details']} | {row['other_details']}")
        if len(skipped_rows) > 10:
            print(f"- ... {len(skipped_rows) - 10} more")

    if write_counts is not None:
        print("\nApplied changes:")
        print(f"- Created identifiers: {write_counts['created_identifiers']}")
        print(f"- Updated display names: {write_counts['updated_display_names']}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Enrich existing recipients from a Paytm statement without creating new recipients."
    )
    parser.add_argument(
        "--statement",
        default=str(DEFAULT_STATEMENT_PATH),
        help="Path to the Paytm statement CSV.",
    )
    parser.add_argument(
        "--user-email",
        required=True,
        help="Email address of the user whose recipients should be enriched.",
    )
    parser.add_argument(
        "--report",
        default=str(DEFAULT_REPORT_PATH),
        help="Path to write the CSV report.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply identifier and low-confidence display-name updates.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    statement_path = Path(args.statement)
    report_path = Path(args.report)

    if not statement_path.exists():
        print(f"Statement file not found: {statement_path}", file=sys.stderr)
        return 1

    try:
        mappings, skipped_rows, total_rows = parse_statement_rows(statement_path)
        connection_kwargs = get_connection_kwargs()
        with psycopg2.connect(**connection_kwargs) as connection:
            with connection.cursor() as cursor:
                user_uuid = fetch_user_uuid(cursor, args.user_email.strip())
                recipients_by_id, recipients_by_name, identifiers_by_upi = fetch_recipients(
                    cursor, user_uuid
                )
                report_rows = classify_mappings(
                    mappings,
                    recipients_by_id,
                    recipients_by_name,
                    identifiers_by_upi,
                )
                write_report(report_path, report_rows)

                write_counts = None
                if args.apply:
                    write_counts = apply_changes(cursor, user_uuid, report_rows)
                else:
                    connection.rollback()

                print_summary(
                    total_rows,
                    mappings,
                    skipped_rows,
                    report_rows,
                    args.apply,
                    report_path,
                    write_counts=write_counts,
                )
        return 0
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
