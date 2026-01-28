import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const badMigrations = [
  "20260105_029_test_preview_mode",
  "20260105_030_preview_sessions_nullable_assignment",
  "20260105_031_preview_sessions_nullable_student",
  "20260105_032_multilang_questions",
  "20260106_033_grades_from_test",
];

async function main() {
  const connection = createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  console.log("🛠 Starting repair for missing test table columns...");

  try {
    console.log(
      "Deleting migration records for migrations that modify test tables...",
    );

    for (const migration of badMigrations) {
      const [res] = await connection.query(
        `DELETE FROM migrations WHERE name = ?`,
        [migration],
      );
      // @ts-ignore
      if (res.affectedRows > 0) {
        console.log(`✅ Removed record: ${migration}`);
      } else {
        console.log(
          `ℹ️  Record not found: ${migration} (may be already clean)`,
        );
      }
    }

    console.log(
      '\n✨ Cleanup complete. Please run "npm run db:migrate" to apply changes.',
    );
  } catch (e: any) {
    console.error("💥 Critical Error:", e);
  } finally {
    await connection.end();
  }
}

main();
