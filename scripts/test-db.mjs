// Runs the PostgreSQL OAuth integration suite against a disposable database in the
// local Docker Compose container. Recreates trackcrow_oauth_test on every run.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Matches docker-compose.yml. Never read DATABASE_URL here: it may point at production.
const TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5434/trackcrow_oauth_test";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCli = path.join(rootDir, "node_modules", "prisma", "build", "index.js");
const jestCli = path.join(rootDir, "node_modules", "jest", "bin", "jest.js");

execFileSync("docker", ["compose", "up", "-d", "--wait", "db"], { cwd: rootDir, stdio: "inherit" });
execFileSync(
  "docker",
  ["compose", "exec", "-T", "db", "psql", "-U", "postgres", "-d", "trackcrow", "-q", "-v", "ON_ERROR_STOP=1"],
  {
    cwd: rootDir,
    input: "DROP DATABASE IF EXISTS trackcrow_oauth_test WITH (FORCE); CREATE DATABASE trackcrow_oauth_test;",
    stdio: ["pipe", "ignore", "inherit"],
  },
);

const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, OAUTH_TEST_DATABASE_URL: TEST_DATABASE_URL };
execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], { cwd: rootDir, env, stdio: "inherit" });
execFileSync(
  process.execPath,
  [jestCli, "src/server/modules/oauth/service.integration.test.ts", "--runInBand", "--detectOpenHandles"],
  { cwd: rootDir, env, stdio: "inherit" },
);
