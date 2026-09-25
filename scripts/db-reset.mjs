// Resets the local Docker Compose database: recreates the schema from Prisma migrations,
// loads prisma/seed.sql, and moves seeded activity forward so the newest day is today.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Matches docker-compose.yml. Never read DATABASE_URL here: it may point at production.
const LOCAL_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5434/trackcrow";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCli = path.join(rootDir, "node_modules", "prisma", "build", "index.js");

const SHIFT_TO_TODAY = `
WITH shift AS (
  SELECT date_trunc('day', now()) - date_trunc('day', max("timestamp")) AS d FROM "transaction"
), shifted_transactions AS (
  UPDATE "transaction" t
  SET "timestamp" = t."timestamp" + shift.d,
      "createdAt" = t."createdAt" + shift.d,
      "updatedAt" = t."updatedAt" + shift.d,
      classification_changed_at = t.classification_changed_at + shift.d
  FROM shift
  RETURNING 1
)
UPDATE raw_message r
SET received_at = r.received_at + shift.d,
    "createdAt" = r."createdAt" + shift.d
FROM shift;
`;

function psql(sql) {
  execFileSync(
    "docker",
    ["compose", "exec", "-T", "db", "psql", "-U", "postgres", "-d", "trackcrow", "-q", "-v", "ON_ERROR_STOP=1"],
    { cwd: rootDir, input: sql, stdio: ["pipe", "ignore", "inherit"] },
  );
}

execFileSync("docker", ["compose", "up", "-d", "--wait", "db"], { cwd: rootDir, stdio: "inherit" });

psql("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
  cwd: rootDir,
  env: { ...process.env, DATABASE_URL: LOCAL_DATABASE_URL },
  stdio: "inherit",
});
psql(readFileSync(path.join(rootDir, "prisma", "seed.sql"), "utf8"));
psql(SHIFT_TO_TODAY);

console.log("Local database reset from prisma/seed.sql.");
