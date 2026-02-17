import mysql from "mysql2/promise";
import { runMigrations } from "./migrator";
import { runSeeds } from "./seed";

async function reinitDatabase() {
  const dbName = process.env.DATABASE_NAME || "atc_test";

  console.log(
    `\n🧨 WARNING: This will DROP the entire database "${dbName}" and recreate it.`,
  );
  console.log(
    '❓ All data will be LOST. This is intended to fix "Table doesn\'t exist in engine" errors.\n',
  );

  const config = {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
  };

  try {
    // Подключаемся без выбора БД, чтобы иметь возможность удалить её
    const connection = await mysql.createConnection(config);

    console.log(`🗑️  Dropping database ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);

    console.log(`ZE  Creating database ${dbName}...`);
    await connection.query(
      `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );

    await connection.end();
    console.log("✅ Database recreated.\n");

    // Теперь запускаем стандартные миграции
    // (они подключатся к уже существующей пустой БД через utils/db.ts)
    await runMigrations();

    // И сиды
    console.log("\n🌱 Seeding default data...");
    await runSeeds();

    console.log("\n✨ Database re-initialization completed successfully!");
    console.log("   Now try restarting your dev server.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Reinit failed:", error);
    process.exit(1);
  }
}

reinitDatabase();
