import { executeQuery } from "./server/utils/db";

async function checkColumns() {
  try {
    const rows = await executeQuery("SHOW COLUMNS FROM instructors");
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkColumns();
