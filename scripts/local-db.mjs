// Local Docker Compose database tasks.
//   node scripts/local-db.mjs reset  recreate trackcrow from migrations and load prisma/seed.sql
//   node scripts/local-db.mjs test   recreate trackcrow_oauth_test and run the OAuth integration suite
//   node scripts/local-db.mjs migrate [prisma migrate dev options]  create and apply a migration locally
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Matches docker-compose.yml. Never read DATABASE_URL here: it may point at production.
const SERVER_URL = "postgresql://postgres:postgres@127.0.0.1:5434";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = (pkg, file) => path.join(rootDir, "node_modules", pkg, file);

function run(command, args, { env, input } = {}) {
  execFileSync(command, args, {
    cwd: rootDir,
    env: { ...process.env, ...env },
    input,
    stdio: [input ? "pipe" : "inherit", "inherit", "inherit"],
  });
}

function prisma(args, options) {
  run(process.execPath, [bin("prisma", "build/index.js"), ...args], options);
}

// Drops the database, then lets `prisma migrate deploy` create it and apply every migration.
function recreateDatabase(name) {
  const url = `${SERVER_URL}/${name}`;
  prisma(["db", "execute", "--url", `${SERVER_URL}/postgres`, "--stdin"], {
    input: `DROP DATABASE IF EXISTS ${name} WITH (FORCE)`,
  });
  prisma(["migrate", "deploy"], { env: { DATABASE_URL: url } });
  return url;
}

const task = process.argv[2];

run("docker", ["compose", "up", "-d", "--wait", "db"]);

if (task === "reset") {
  const url = recreateDatabase("trackcrow");
  prisma(["db", "execute", "--url", url, "--file", "prisma/seed.sql"]);
  console.log("Local database reset from prisma/seed.sql.");
} else if (task === "migrate") {
  prisma(["migrate", "dev", ...process.argv.slice(3)], { env: { DATABASE_URL: `${SERVER_URL}/trackcrow` } });
} else if (task === "test") {
  const url = recreateDatabase("trackcrow_oauth_test");
  run(
    process.execPath,
    [bin("jest", "bin/jest.js"), "src/server/modules/oauth/service.integration.test.ts", "--runInBand", "--detectOpenHandles"],
    { env: { DATABASE_URL: url, OAUTH_TEST_DATABASE_URL: url } },
  );
} else {
  console.error("Usage: node scripts/local-db.mjs reset|test|migrate");
  process.exit(1);
}
