
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
        // 1. Берем первого пользователя-студента из БД для примера
        const [users] = await pool.query("SELECT id, email, role FROM users WHERE role = 'STUDENT' LIMIT 1");
        if ((users as any[]).length === 0) {
            console.log("No users with STUDENT role found.");
            return;
        }
        const user = (users as any[])[0];
        console.log(`\n=== CHECKING USER: ${user.email} (${user.id}) ===`);

        // 2. Ищем студента
        const [students] = await pool.query('SELECT id, full_name, user_id FROM students WHERE user_id = ?', [user.id]);

        if ((students as any[]).length === 0) {
            console.log("❌ No student record found for this user!");

            // Попробуем найти любого студента с user_id
            console.log("\nSearching for ANY student with user_id...");
            const [anyLinkedStudent] = await pool.query('SELECT * FROM students WHERE user_id IS NOT NULL LIMIT 1');
            console.table(anyLinkedStudent);
            return;
        }

        const student = (students as any[])[0];
        console.log(`✅ Student found: ${student.full_name} (${student.id})`);

        // 3. Ищем группы студента
        const [groups] = await pool.query(`
        SELECT sg.id, sg.code 
        FROM study_groups sg
        JOIN study_group_students sgs ON sg.id = sgs.group_id
        WHERE sgs.student_id = ?
    `, [student.id]);

        if ((groups as any[]).length === 0) {
            console.log("❌ Student is not in any study group!");
            return;
        }

        console.log(`✅ Student is in ${groups.length} groups:`);
        console.table(groups);

        // 4. Ищем тесты для этих групп
        const groupIds = (groups as any[]).map(g => g.id);
        // (для простоты запроса используем IN с параметрами - но тут просто цикл сделаем или map)

        for (const group of (groups as any[])) {
            console.log(`\nChecking assignments for group ${group.code} (${group.id})...`);
            const [assignments] = await pool.query(`
            SELECT id, test_template_id, status, start_date, end_date 
            FROM test_assignments 
            WHERE group_id = ?
        `, [group.id]);

            if ((assignments as any[]).length === 0) {
                console.log("  ⚠️ No assignments found for this group.");
            } else {
                console.log(`  ✅ Found ${(assignments as any[]).length} assignments:`);
                console.table(assignments);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

debugDb();
