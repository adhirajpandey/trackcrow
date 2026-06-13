from __future__ import annotations

import argparse
from datetime import datetime
from pathlib import Path

from psycopg2.extras import RealDictCursor

from rewrite_migration_lib import (
    DEFAULT_EXPORT_DIR,
    SOURCE_ENV_FILE,
    MigrationError,
    connect,
    ensure_directory,
    fetch_all,
    load_env,
    require_env,
    slugify_email,
    write_json,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export one legacy Trackcrow user for rewrite import")
    parser.add_argument("--email", required=True, help="User email to export from the source database")
    parser.add_argument("--output-dir", default=None, help="Directory to write JSON files into")
    return parser.parse_args()


def resolve_output_dir(email: str, explicit_output_dir: str | None) -> Path:
    if explicit_output_dir:
        return ensure_directory(Path(explicit_output_dir).resolve())
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    folder_name = f"{slugify_email(email)}-{timestamp}"
    return ensure_directory(DEFAULT_EXPORT_DIR / folder_name)


def main() -> int:
    args = parse_args()
    load_env(SOURCE_ENV_FILE)
    source_url = require_env("DATABASE_URL")
    output_dir = resolve_output_dir(args.email, args.output_dir)

    with connect(source_url) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                'SELECT * FROM "user" WHERE lower(email) = lower(%s)',
                (args.email,),
            )
            user = cursor.fetchone()
            if user is None:
                raise MigrationError(f"No user found for email: {args.email}")

            user_uuid = user["uuid"]

            categories = fetch_all(
                cursor,
                'SELECT * FROM "category" WHERE user_uuid = %s ORDER BY id',
                (user_uuid,),
            )
            subcategories = fetch_all(
                cursor,
                'SELECT * FROM "subcategory" WHERE user_uuid = %s ORDER BY id',
                (user_uuid,),
            )
            transactions = fetch_all(
                cursor,
                'SELECT * FROM "transaction" WHERE user_uuid = %s ORDER BY id',
                (user_uuid,),
            )

    metadata = {
        "exportedAt": datetime.now().isoformat(),
        "email": args.email,
        "userUuid": user["uuid"],
        "counts": {
            "users": 1,
            "categories": len(categories),
            "subcategories": len(subcategories),
            "transactions": len(transactions),
        },
    }

    write_json(output_dir / "metadata.json", metadata)
    write_json(output_dir / "user.json", user)
    write_json(output_dir / "categories.json", categories)
    write_json(output_dir / "subcategories.json", subcategories)
    write_json(output_dir / "transactions.json", transactions)

    print(f"Export completed: {output_dir}")
    print(metadata["counts"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
