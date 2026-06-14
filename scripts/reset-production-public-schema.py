from __future__ import annotations

import argparse

from rewrite_migration_lib import SOURCE_ENV_FILE, connect, load_env, require_env


CONFIRMATION = "RESET PRODUCTION PUBLIC SCHEMA"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Drop and recreate the public schema for the production rewrite migration"
    )
    parser.add_argument(
        "--database-url-env",
        default="DATABASE_URL",
        help="Environment variable containing the production database URL",
    )
    parser.add_argument(
        "--confirm",
        required=True,
        help=f'Exact confirmation phrase: "{CONFIRMATION}"',
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.confirm != CONFIRMATION:
        raise ValueError(f'Confirmation phrase must be exactly: "{CONFIRMATION}"')

    load_env(SOURCE_ENV_FILE)
    database_url = require_env(args.database_url_env)

    statements = [
        "DROP SCHEMA IF EXISTS public CASCADE",
        "CREATE SCHEMA public",
        """
        DO $$
        DECLARE
          role_name text;
        BEGIN
          EXECUTE format('ALTER SCHEMA public OWNER TO %I', current_user);
          EXECUTE format('GRANT ALL ON SCHEMA public TO %I', current_user);

          FOREACH role_name IN ARRAY ARRAY['postgres', 'service_role', 'anon', 'authenticated']
          LOOP
            IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
              EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', role_name);
            END IF;
          END LOOP;

          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
            EXECUTE 'GRANT ALL ON SCHEMA public TO service_role';
          END IF;
        END
        $$;
        """,
    ]

    with connect(database_url) as conn:
        conn.autocommit = True
        with conn.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)

    print("Production public schema reset completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
