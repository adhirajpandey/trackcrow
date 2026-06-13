from __future__ import annotations

import argparse

from rewrite_migration_lib import update_env_local_database_url


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Set DATABASE_URL in .env.local for rewrite database testing")
    parser.add_argument("--database-url", required=True, help="Target database URL to write into .env.local")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    update_env_local_database_url(args.database_url)
    print(".env.local updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
