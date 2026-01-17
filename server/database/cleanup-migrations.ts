import { getDbPool } from "../utils/db";

/**
 * Скрипт для очистки устаревших миграций из таблицы migrations
 * Удаляет записи о миграциях, которые больше не существуют в проекте
 */

// Список устаревших миграций для удаления
const OBSOLETE_MIGRATIONS = [
    "20260111_041_group_announcements",
    "20260111_042_training_requests",
    "20260111_043_request_employees",
    "20260111_044_request_history",
    "20260111_045_add_representative_role",
    "20260111_050_announcements",
    "20260111_051_announcement_groups",
    "20260111_052_announcement_requests",
    "20260111_053_announcement_request_groups",
    "20260111_054_announcement_request_employees",
    "20260111_055_announcement_history",
    "20260111_056_remove_group_announcement_fields",
];

async function cleanupMigrations() {
    console.log("🔄 Начинаем очистку устаревших миграций...\n");

    try {
        const pool = getDbPool();
        const connection = await pool.getConnection();

        try {
            // Проверяем, какие из устаревших миграций есть в БД
            const [existingRows] = await connection.query<any[]>(
                "SELECT name FROM migrations WHERE name IN (?)",
                [OBSOLETE_MIGRATIONS]
            );

            if (existingRows.length === 0) {
                console.log("✅ Устаревших миграций в базе данных не найдено.");
                return;
            }

            console.log(`📋 Найдено ${existingRows.length} устаревших миграций:\n`);
            existingRows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.name}`);
            });

            console.log("\n🗑️  Удаляем устаревшие миграции...\n");

            // Удаляем каждую миграцию
            for (const migration of OBSOLETE_MIGRATIONS) {
                const [result] = await connection.query<any>(
                    "DELETE FROM migrations WHERE name = ?",
                    [migration]
                );

                if (result.affectedRows > 0) {
                    console.log(`✅ Удалена: ${migration}`);
                }
            }

            // Проверяем итоговое состояние
            const [finalRows] = await connection.query<any[]>(
                "SELECT COUNT(*) as count FROM migrations"
            );

            console.log(`\n✅ Очистка завершена!`);
            console.log(`📊 Осталось миграций в БД: ${finalRows[0].count}`);
        } finally {
            connection.release();
            await pool.end();
        }
    } catch (error) {
        console.error("❌ Ошибка при очистке миграций:", error);
        process.exit(1);
    }
}

cleanupMigrations();
