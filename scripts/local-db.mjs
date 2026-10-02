// Local Docker Compose database tasks.
//   node scripts/local-db.mjs reset  recreate trackcrow from migrations and load prisma/seed.sql
//   node scripts/local-db.mjs test   recreate trackcrow_oauth_test and run the OAuth, mobile auth, and SMS import integration suites
//   node scripts/local-db.mjs migrate [prisma migrate dev options]  create and apply a migration locally
//   node scripts/local-db.mjs screenshot-reset  replace only the Android screenshot account's data and print its token
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
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

// Local-only credential for the screenshot account, kept outside Git. Reused across resets so the
// phone's saved session stays valid.
const SCREENSHOT_USER_UUID = "5c7ee75a-0000-4000-8000-000000000001";
const SCREENSHOT_TOKEN_FILE = path.join(rootDir, ".screenshot-token");

function screenshotToken() {
  const saved = fs.existsSync(SCREENSHOT_TOKEN_FILE) ? fs.readFileSync(SCREENSHOT_TOKEN_FILE, "utf8").trim() : "";
  if (/^[0-9a-f]{48}$/.test(saved)) return saved;
  // Same shape as createApiToken in src/server/modules/api-tokens/service.ts.
  const token = randomBytes(24).toString("hex");
  fs.writeFileSync(SCREENSHOT_TOKEN_FILE, `${token}\n`, { mode: 0o600 });
  return token;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port });
    socket.setTimeout(1000);
    const done = (open) => {
      socket.destroy();
      resolve(open);
    };
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
  });
}

const task = process.argv[2];

if (task === "screenshot-reset" && (await portOpen(5434))) {
  // Reuse the running database even if another Compose project name started it.
} else {
  run("docker", ["compose", "up", "-d", "--wait", "db"]);
}

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
    [
      bin("jest", "bin/jest.js"),
      "src/server/modules/oauth/service.integration.test.ts",
      "src/server/modules/mobile-auth/service.integration.test.ts",
      "src/server/modules/imports/service.integration.test.ts",
      "--runInBand",
      "--detectOpenHandles",
    ],
    { env: { DATABASE_URL: url, OAUTH_TEST_DATABASE_URL: url } },
  );
} else if (task === "screenshot-reset") {
  const token = screenshotToken();
  // The token row uses the hash that resolveApiToken looks up.
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const sql = `${fs.readFileSync(path.join(rootDir, "prisma/screenshot-fixture.sql"), "utf8")}
INSERT INTO device_token (uuid, user_uuid, label, token_hash, token_prefix, scopes)
VALUES (gen_random_uuid(), '${SCREENSHOT_USER_UUID}', 'Android screenshots', '${tokenHash}', '${token.slice(0, 8)}',
  ARRAY['transactions:read', 'transactions:write']::"ApiTokenScope"[]);
`;
  prisma(["db", "execute", "--url", `${SERVER_URL}/trackcrow`, "--stdin"], { input: sql });
  console.log(`Screenshot account reset. Token saved in ${path.relative(rootDir, SCREENSHOT_TOKEN_FILE)}.`);
} else {
  console.error("Usage: node scripts/local-db.mjs reset|test|migrate|screenshot-reset");
  process.exit(1);
}
