
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugDb() {
    const pool = createPool({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'atc_test',
    });

    try {
        console.log('--- TABLE SCHEMA: STUDY_GROUP_STUDENTS ---');
        const [sgsCols] = await pool.query('DESCRIBE study_group_students');
        console.table(sgsCols);

        console.log('--- TABLE SCHEMA: SCHEDULE_EVENTS ---');
        const [seCols] = await pool.query('DESCRIBE schedule_events');
        console.table(seCols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugDb();
