import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, ".env");

const fileEnv: Record<string, string> = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) {
      fileEnv[key] = val;
    }
  }
}

const rawDbUrl = process.env.DATABASE_URL || fileEnv.DATABASE_URL;
if (rawDbUrl) {
  try {
    const parsed = new URL(rawDbUrl);
    const dbName = parsed.pathname.replace(/^\//, "");
    if (!dbName.toLowerCase().includes("test")) {
      const testDbName = `${dbName || "toktickit"}_vitest_test`;
      const adminUrl = new URL(rawDbUrl);
      adminUrl.pathname = "/postgres";

      parsed.pathname = `/${testDbName}`;
      process.env.DATABASE_URL = parsed.toString();
      process.env.ADMIN_DATABASE_URL = adminUrl.toString();
      process.env.AUTO_PROVISION_TEST_DB = "1";
      process.env.AUTO_PROVISION_TEST_DB_NAME = testDbName;
    } else {
      process.env.DATABASE_URL = rawDbUrl;
    }
  } catch {
    process.env.DATABASE_URL = rawDbUrl;
  }
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = fileEnv.JWT_SECRET || "vitest_default_jwt_secret_256_bits_toktickit";
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
