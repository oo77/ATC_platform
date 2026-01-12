
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
        console.log('--- TABLE SCHEMA: STUDENTS ---');
        const [studentCols] = await pool.query('DESCRIBE students');
        console.table(studentCols);

        console.log('--- TABLE SCHEMA: TEST_ASSIGNMENTS ---');
        const [assignCols] = await pool.query('DESCRIBE test_assignments');
        console.table(assignCols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugDb();
