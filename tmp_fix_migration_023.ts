import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

async function fix() {
  // Load .env
  const envPath = path.resolve(process.cwd(), ".env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const env: any = {};
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w]+)\s*=\s*(.*)?\s*$/);
    if (match)
      env[match[1]] = (match[2] || "").trim().replace(/^['"]|['"]$/g, "");
  });

  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST || "localhost",
    port: parseInt(env.DATABASE_PORT || "3306"),
    user: env.DATABASE_USER || "root",
    password: env.DATABASE_PASSWORD || "",
    database: env.DATABASE_NAME || "atc_test",
  });

  console.log(`Connected to ${env.DATABASE_NAME || "atc_test"}`);

  // 1. Remove migration record
  const [res] = await connection.query(
    "DELETE FROM migrations WHERE name = '20260305_023_report_builder'",
  );
  console.log("Deleted migration record:", res);

  // 2. Drop tables if they partially exist (cleanup)
  await connection.query("DROP TABLE IF EXISTS report_template_columns");
  await connection.query("DROP TABLE IF EXISTS report_templates");
  console.log("Cleaned up partial tables");

  await connection.end();
  process.exit(0);
}

fix();
