/**
 * Миграция: Исправление типа group_id в таблице files
 * Дата: 2026-01-22
 * Описание: Изменение типа group_id с INT UNSIGNED на VARCHAR(191) для поддержки UUID
 */

import type { PoolConnection } from "mysql2/promise";

export const name = "20260122_002_fix_files_group_id_type";
export const description =
    "Исправление типа group_id в таблице files с INT UNSIGNED на VARCHAR(191)";

export async function up(connection: PoolConnection): Promise<void> {
    console.log("  ⬆️  Изменение типа group_id в таблице files...");

    // Изменяем тип колонки group_id
    await connection.execute(`
    ALTER TABLE files 
    MODIFY COLUMN group_id VARCHAR(191) NULL 
    COMMENT 'Ссылка на study_groups'
  `);

    console.log("  ✅ Тип group_id успешно изменён на VARCHAR(191)");
}

export async function down(connection: PoolConnection): Promise<void> {
    console.log("  ⬇️  Откат изменения типа group_id в таблице files...");

    // Возвращаем старый тип (если нужно откатить)
    // ВНИМАНИЕ: Это может привести к потере данных, если в колонке есть UUID
    await connection.execute(`
    ALTER TABLE files 
    MODIFY COLUMN group_id INT UNSIGNED NULL
  `);

    console.log("  ✅ Тип group_id возвращён к INT UNSIGNED");
}
