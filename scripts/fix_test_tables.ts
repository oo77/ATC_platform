import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const tables = [
  "test_answers",
  "test_sessions",
  "test_assignments",
  "discipline_tests",
  "test_template_questions",
  "test_templates",
  "questions",
  "question_banks",
];

const migrationName = "20260104_028_testing_system";

async function main() {
  const connection = createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    multipleStatements: true,
  });

  console.log("🛠 Starting repair for testing system tables...");

  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("🔓 Foreign key checks disabled.");

    for (const table of tables) {
      try {
        process.stdout.write(`🗑 Dropping table ${table}... `);
        await connection.query(`DROP TABLE IF EXISTS ${table}`);
        console.log("✅ Success");
      } catch (e: any) {
        console.log("❌ Failed");
        console.error(`   Error: ${e.message}`);

        // If specific error about known table in standard engine
        if (
          e.message.includes("atc_test") &&
          e.message.includes("doesn't exist")
        ) {
          console.log(
            `   ⚠️ Table '${table}' seems corrupted (file missing). Trying to ignore.`,
          );
        }
      }
    }

    console.log(`📝 Removing migration record for '${migrationName}'...`);
    const [res] = await connection.query(
      `DELETE FROM migrations WHERE name = ?`,
      [migrationName],
    );
    // @ts-ignore
    if (res.affectedRows > 0) {
      console.log("✅ Migration record removed.");
    } else {
      console.log("ℹ️ Migration record not found (that is okay).");
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🔒 Foreign key checks re-enabled.");

    console.log(
      '\n✨ Cleanup complete. Please run "npm run db:migrate" to restore the tables.',
    );
  } catch (e: any) {
    console.error("💥 Critical Error:", e);
  } finally {
    await connection.end();
  }
}

main();
