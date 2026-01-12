/**
 * Скрипт для проверки ENUM в таблице activity_logs
 */
import { executeQuery, testConnection } from './server/utils/db';

async function checkEnum() {
    try {
        const connected = await testConnection();
        if (!connected) {
            console.error('Не удалось подключиться к БД');
            process.exit(1);
        }

        console.log('Подключение успешно, проверяем ENUM...\n');

        // Получаем структуру колонок
        const columns = await executeQuery<any[]>(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'activity_logs' 
        AND COLUMN_NAME IN ('action_type', 'entity_type')
    `);

        console.log('=== Текущие ENUM в базе данных ===\n');
        for (const col of columns) {
            console.log(`${col.COLUMN_NAME}:`);
            console.log(`  ${col.COLUMN_TYPE}\n`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

checkEnum();
