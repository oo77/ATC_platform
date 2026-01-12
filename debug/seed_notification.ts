
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Загружаем .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function seedNotification() {
    const pool = createPool({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'atc_test',
    });

    try {
        const studentId = '9fff5b1d-3304-4524-9dc2-91cb40f5ea3c'; // Наш студент

        // Проверяем, есть ли уведомления
        const [existing] = await pool.query('SELECT * FROM student_notifications WHERE student_id = ?', [studentId]);
        if ((existing as any[]).length > 0) {
            console.log(`Student already has ${(existing as any[]).length} notifications.`);
            console.table(existing);
            return;
        }

        console.log("Seeding a test notification...");

        await pool.query(`
        INSERT INTO student_notifications (
            id, student_id, type, priority, title, message, link, metadata, created_at, is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)
    `, [
            uuidv4(),
            studentId,
            'TEST_UPCOMING',
            'medium',
            'Новый тест доступен!',
            'Вам назначен тест "ОЭБ-основной". У вас есть 7 дней на выполнение.',
            '/tests/my',
            JSON.stringify({ created_manually: true })
        ]);

        console.log("✅ Notification created.");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

seedNotification();
