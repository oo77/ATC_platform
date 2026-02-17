#!/usr/bin/env node

/**
 * CLI для управления миграциями базы данных
 *
 * Использование:
 *   npm run db:migrate        - Применить все непримененные миграции
 *   npm run db:rollback       - Откатить последнюю миграцию
 *   npm run db:rollback:all   - Откатить все миграции
 *   npm run db:status         - Показать статус миграций
 */

import fs from "fs";
import path from "path";

// 1. Load .env before importing database modules
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    // Basic .env parser
    const match = line.match(/^\s*([\w]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"'))
        value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'"))
        value = value.slice(1, -1);

      process.env[key] = value.trim();
    }
  });
  console.log("✅ Loaded .env file");
}

const command = process.argv[2];

async function main() {
  try {
    // 2. Dynamic import of migrator after env is loaded
    const {
      runMigrations,
      rollbackMigration,
      rollbackAllMigrations,
      getMigrationStatus,
    } = await import("./migrator");

    switch (command) {
      case "up":
      case "migrate":
        await runMigrations();
        break;

      case "down":
      case "rollback":
        await rollbackMigration();
        break;

      case "rollback:all":
      case "reset":
        await rollbackAllMigrations();
        break;

      case "status":
        await getMigrationStatus();
        break;

      default:
        console.log("📚 Database Migration CLI\n");
        console.log("Available commands:");
        console.log("  migrate, up          - Run all pending migrations");
        console.log("  rollback, down       - Rollback last migration");
        console.log("  rollback:all, reset  - Rollback all migrations");
        console.log("  status               - Show migration status");
        console.log("\nUsage:");
        console.log("  npm run db:migrate");
        console.log("  npm run db:rollback");
        console.log("  npm run db:status");
        process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Command failed:", error);
    process.exit(1);
  }
}

main();
