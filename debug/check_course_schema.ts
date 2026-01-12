
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Загружаем .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = createPool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

async function checkSchema() {
    try {
        const [sgCols] = await pool.query(`SHOW COLUMNS FROM study_groups`);
        console.log('--- study_groups ---');
        (sgCols as any[]).forEach(c => console.log(c.Field));

        const [seCols] = await pool.query(`SHOW COLUMNS FROM schedule_events`);
        console.log('--- schedule_events ---');
        (seCols as any[]).forEach(c => console.log(c.Field));

        const [attCols] = await pool.query(`SHOW COLUMNS FROM attendance`);
        console.log('--- attendance ---');
        (attCols as any[]).forEach(c => console.log(c.Field));

        const [insCols] = await pool.query(`SHOW COLUMNS FROM instructors`);
        console.log('--- instructors ---');
        (insCols as any[]).forEach(c => console.log(c.Field));

        const [cCols] = await pool.query(`SHOW COLUMNS FROM courses`);
        console.log('--- courses ---');
        (cCols as any[]).forEach(c => console.log(c.Field));

        const [crCols] = await pool.query(`SHOW COLUMNS FROM classrooms`);
        console.log('--- classrooms ---');
        (crCols as any[]).forEach(c => console.log(c.Field));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkSchema();
