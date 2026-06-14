from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path

from psycopg2.extras import RealDictCursor

from rewrite_migration_lib import (
    DEFAULT_EXPORT_DIR,
    LEGACY_EXPORT_TABLES,
    SOURCE_ENV_FILE,
    build_timestamp_sample,
    connect,
    count_tables,
    ensure_directory,
    fetch_all,
    format_counts,
    load_env,
    require_env,
    slugify_email,
    write_json,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export legacy Trackcrow data for rewrite import"
    )
    parser.add_argument(
        "--email",
        default=None,
        help="Optional user email to export. Omit for full-database export.",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Directory to write JSON files into",
    )
    return parser.parse_args()


def resolve_output_dir(email: str | None, explicit_output_dir: str | None) -> Path:
    if explicit_output_dir:
        return ensure_directory(Path(explicit_output_dir).resolve())
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    scope = slugify_email(email) if email else "full-export"
    folder_name = f"{scope}-{timestamp}"
    return ensure_directory(DEFAULT_EXPORT_DIR / folder_name)


def main() -> int:
    args = parse_args()
    load_env(SOURCE_ENV_FILE)
    source_url = require_env("DATABASE_URL")
    output_dir = resolve_output_dir(args.email, args.output_dir)

    with connect(source_url) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            preflight_counts = count_tables(cursor, LEGACY_EXPORT_TABLES)
            users_query = 'SELECT * FROM "user"'
            users_params: tuple[object, ...] = ()
            if args.email:
                users_query += " WHERE lower(email) = lower(%s)"
                users_params = (args.email,)
            users_query += " ORDER BY id"
            users = fetch_all(cursor, users_query, users_params)
            if args.email and not users:
                raise ValueError(f"No user found for email: {args.email}")

            user_uuids = [user["uuid"] for user in users]
            categories: list[dict] = []
            subcategories: list[dict] = []
            transactions: list[dict] = []
            if user_uuids:
                categories = fetch_all(
                    cursor,
                    'SELECT * FROM "category" WHERE user_uuid = ANY(%s) ORDER BY id',
                    (user_uuids,),
                )
                subcategories = fetch_all(
                    cursor,
                    'SELECT * FROM "subcategory" WHERE user_uuid = ANY(%s) ORDER BY id',
                    (user_uuids,),
                )
                transactions = fetch_all(
                    cursor,
                    'SELECT * FROM "transaction" WHERE user_uuid = ANY(%s) ORDER BY id',
                    (user_uuids,),
                )

    export_counts = {
        "user": len(users),
        "category": len(categories),
        "subcategory": len(subcategories),
        "transaction": len(transactions),
    }
    metadata = {
        "exportedAt": datetime.now().isoformat(),
        "scope": "single-user" if args.email else "full-database",
        "email": args.email,
        "userUuids": user_uuids,
        "preflight": format_counts("legacy-source", preflight_counts),
        "exported": format_counts("export-artifact", export_counts),
        "timestampSample": build_timestamp_sample(transactions),
    }

    write_json(output_dir / "metadata.json", metadata)
    write_json(output_dir / "users.json", users)
    write_json(output_dir / "categories.json", categories)
    write_json(output_dir / "subcategories.json", subcategories)
    write_json(output_dir / "transactions.json", transactions)

    print(f"Export completed: {output_dir}")
    print(metadata["exported"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
