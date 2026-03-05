import { useDatabase } from "./server/utils/useDatabase";

async function check() {
  const db = await useDatabase();
  const [rows] = await db.query<any[]>(
    "SELECT name FROM migrations ORDER BY executed_at ASC",
  );
  console.log("Executed migrations in DB:");
  rows.forEach((r, i) => console.log(`${i + 1}: ${r.name}`));
  process.exit(0);
}

check();
