import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const connection = createPool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  });

  try {
    const [rows] = await connection.query(
      "SELECT * FROM migrations ORDER BY executed_at",
    );
    const outPath = path.resolve(process.cwd(), "migrations_dump.txt");
    // @ts-ignore
    const content = rows.map((r: any) => `${r.name}`).join("\n");
    fs.writeFileSync(outPath, content);
    console.log(`Dumped execution list to ${outPath}`);
  } catch (e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}

main();
