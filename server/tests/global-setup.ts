import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "..");

export default async function setup() {
  if (process.env.AUTO_PROVISION_TEST_DB !== "1") {
    return;
  }

  const testDbUrl = process.env.DATABASE_URL;
  const adminDbUrl = process.env.ADMIN_DATABASE_URL;
  const testDbName = process.env.AUTO_PROVISION_TEST_DB_NAME || "toktickit_vitest_test";

  if (!testDbUrl || !adminDbUrl) {
    return;
  }

  const adminPrisma = new PrismaClient({
    datasources: { db: { url: adminDbUrl } },
  });

  try {
    await adminPrisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${testDbName}' AND pid <> pg_backend_pid();
    `);
    await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testDbName}";`);
    await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${testDbName}";`);
  } finally {
    await adminPrisma.$disconnect();
  }

  const childEnv = {
    ...process.env,
    DATABASE_URL: testDbUrl,
  };

  execSync("npx prisma migrate deploy", {
    cwd: serverDir,
    env: childEnv,
    stdio: "pipe",
  });

  execSync("npx tsx prisma/seed.ts", {
    cwd: serverDir,
    env: childEnv,
    stdio: "pipe",
  });

  return async () => {
    const cleanupPrisma = new PrismaClient({
      datasources: { db: { url: adminDbUrl } },
    });
    try {
      await cleanupPrisma.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${testDbName}' AND pid <> pg_backend_pid();
      `);
      await cleanupPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${testDbName}";`);
    } catch {
      // Ignore cleanup errors on exit
    } finally {
      await cleanupPrisma.$disconnect();
    }
  };
}
