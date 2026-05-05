import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'atc',
  });

  const [rows] = await connection.query('SELECT id, uuid, filename, deleted_at FROM files WHERE uuid = "2ef3f80d-bdc5-453a-849f-e77ef86f43ad"');
  console.log('Query Result:', rows);

  await connection.end();
}

main().catch(console.error);
