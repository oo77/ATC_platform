import { getDbPool } from "../utils/db";

async function checkMigrations() {
    try {
        const pool = getDbPool();
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query<any[]>(
                "SELECT name, executed_at FROM migrations ORDER BY executed_at ASC"
            );

            console.log("\n📋 Миграции в базе данных:");
            console.log(`Всего: ${rows.length}\n`);

            rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.name}`);
                console.log(`   Выполнена: ${row.executed_at}\n`);
            });
        } finally {
            connection.release();
            await pool.end();
        }
    } catch (error) {
        console.error("❌ Ошибка:", error);
        process.exit(1);
    }
}

checkMigrations();
