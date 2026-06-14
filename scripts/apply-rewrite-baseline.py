from __future__ import annotations

import argparse
import hashlib
import uuid
from datetime import datetime, timezone
from pathlib import Path

from rewrite_migration_lib import REPO_ROOT, SOURCE_ENV_FILE, connect, load_env, require_env


MIGRATION_NAME = "20260614_rewrite_baseline"
MIGRATION_SQL = REPO_ROOT / "prisma" / "migrations" / MIGRATION_NAME / "migration.sql"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply the rewrite baseline SQL and mark it as applied for Prisma"
    )
    parser.add_argument(
        "--database-url-env",
        default="DATABASE_URL",
        help="Environment variable containing the target database URL",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_env(SOURCE_ENV_FILE)
    database_url = require_env(args.database_url_env)
    migration_sql = MIGRATION_SQL.read_text(encoding="utf-8")
    checksum = hashlib.sha256(migration_sql.encode("utf-8")).hexdigest()
    now = datetime.now(timezone.utc)

    with connect(database_url) as conn:
        with conn.cursor() as cursor:
            cursor.execute(migration_sql)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
                  "id" VARCHAR(36) PRIMARY KEY NOT NULL,
                  "checksum" VARCHAR(64) NOT NULL,
                  "finished_at" TIMESTAMPTZ,
                  "migration_name" VARCHAR(255) NOT NULL,
                  "logs" TEXT,
                  "rolled_back_at" TIMESTAMPTZ,
                  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            cursor.execute(
                """
                INSERT INTO "_prisma_migrations" (
                  "id",
                  "checksum",
                  "finished_at",
                  "migration_name",
                  "logs",
                  "rolled_back_at",
                  "started_at",
                  "applied_steps_count"
                )
                VALUES (%s, %s, %s, %s, NULL, NULL, %s, 1)
                ON CONFLICT ("id") DO NOTHING
                """,
                (str(uuid.uuid4()), checksum, now, MIGRATION_NAME, now),
            )
        conn.commit()

    print(f"Applied rewrite baseline: {MIGRATION_NAME}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
