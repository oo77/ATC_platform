import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const connection = createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log("Connected to DB:", process.env.DATABASE_NAME);

  try {
    console.log("Checking tables...");
    const [rows] = await connection.query("SHOW TABLES");
    console.log("Tables in DB:", rows);
  } catch (err: any) {
    console.error("Error showing tables:", err.message);
  }

  try {
    console.log("Attempting to select from question_banks...");
    await connection.query("SELECT * FROM question_banks LIMIT 1");
    console.log("Select successful (empty or not)");
  } catch (err: any) {
    console.error("Error selecting from question_banks:", err.message);
    if (err.message && err.message.includes("doesn't exist in engine")) {
      console.log("Found the specific error!");
    }
  }

  process.exit(0);
}

main();
