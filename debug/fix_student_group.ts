
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Загружаем .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function fixData() {
    const pool = createPool({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'atc_test',
    });

    try {
        const studentId = '9fff5b1d-3304-4524-9dc2-91cb40f5ea3c'; // ID нашего студента

        // 1. Находим группу
        const [groups] = await pool.query('SELECT id, code FROM study_groups LIMIT 1');
        if ((groups as any[]).length === 0) {
            console.log("No groups found! Need to create one.");
            return;
        }
        const group = (groups as any[])[0];
        console.log(`Found group: ${group.code} (${group.id})`);

        // 2. Добавляем студента в группу
        try {
            await pool.query('INSERT INTO study_group_students (id, group_id, student_id, enrolled_at, created_at) VALUES (?, ?, ?, NOW(), NOW())', [
                uuidv4(),
                group.id,
                studentId
            ]);
            console.log(`✅ Student added to group ${group.code}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_ENTRY') {
                console.log(`⚠️ Student already in group ${group.code}`);
            } else {
                console.error('Error adding to group:', e);
            }
        }

        // 3. Проверяем тесты для этой группы
        const [assignments] = await pool.query(`
            SELECT id FROM test_assignments WHERE group_id = ?
        `, [group.id]);

        if ((assignments as any[]).length > 0) {
            console.log(`✅ Group already has ${(assignments as any[]).length} test assignments.`);
        } else {
            console.log("⚠️ Group has no assignments. Creating one...");

            // Находим шаблон теста
            const [templates] = await pool.query('SELECT id, name FROM test_templates LIMIT 1');
            if ((templates as any[]).length === 0) {
                console.log("❌ No test templates found!");
                return;
            }
            const template = (templates as any[])[0];

            // Находим событие расписания
            const [events] = await pool.query('SELECT id FROM schedule_events WHERE group_id = ? LIMIT 1', [group.id]);

            let eventId;
            if ((events as any[]).length > 0) {
                eventId = (events as any[])[0].id;
            } else {
                console.log("Creating dummy schedule event...");
                const [disciplines] = await pool.query('SELECT id FROM disciplines LIMIT 1');
                const disciplineId = (disciplines as any[])[0]?.id || null;

                eventId = uuidv4();
                await pool.query(`
                INSERT INTO schedule_events (id, group_id, discipline_id, title, start_time, end_time, event_type, created_at, updated_at)
                VALUES (?, ?, ?, 'Тестовое занятие', NOW(), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'practice', NOW(), NOW())
             `, [eventId, group.id, disciplineId]);
            }

            // Создаем назначение
            const assignmentId = uuidv4();
            await pool.query(`
            INSERT INTO test_assignments (
                id, schedule_event_id, test_template_id, group_id, 
                status, start_date, end_date, 
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'scheduled', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW())
        `, [assignmentId, eventId, template.id, group.id]);

            console.log(`✅ Created test assignment for group ${group.code}, template ${template.name}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixData();
