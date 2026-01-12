
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

async function checkDashboard() {
    try {
        // Находим любого студента
        const [students] = await pool.query('SELECT * FROM students LIMIT 1');
        if ((students as any[]).length === 0) {
            console.log('No students found');
            return;
        }
        const student = (students as any[])[0];
        console.log('Found student:', student.id, student.full_name);

        const studentId = student.id;
        const now = new Date();

        // 1. Upcoming Events
        const upcomingEventsQuery = `
        SELECT 
          se.id,
          se.title,
          se.start_time,
          se.end_time,
          se.event_type,
          c.name as course_name,
          cr.name as classroom_name
        FROM schedule_events se
        JOIN study_group_students sgs ON se.group_id = sgs.group_id
        JOIN study_groups sg ON se.group_id = sg.id
        JOIN courses c ON sg.course_id = c.id
        LEFT JOIN classrooms cr ON se.classroom_id = cr.id
        WHERE sgs.student_id = ? 
          AND se.end_time > ?
        ORDER BY se.start_time ASC
        LIMIT 3
      `;
        const [events] = await pool.query(upcomingEventsQuery, [studentId, now]);
        console.log('Events:', (events as any[]).length);

        // 2. Active Courses
        const activeCoursesQuery = `
        SELECT 
          sg.id as group_id, 
          c.name as course_name, 
          sg.code as group_name,
          sg.end_date,
          (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id) as total_lessons,
          (SELECT COUNT(*) FROM schedule_events se WHERE se.group_id = sg.id AND se.end_time < ?) as passed_lessons
        FROM study_group_students sgs
        JOIN study_groups sg ON sgs.group_id = sg.id
        JOIN courses c ON sg.course_id = c.id
        WHERE sgs.student_id = ?
      `;
        const [courses] = await pool.query(activeCoursesQuery, [now, studentId]);
        console.log('Courses:', (courses as any[]).length);

        // 3. Deadlines
        try {
            const deadlinesQuery = `
          SELECT 
            ta.id,
            tt.name as test_name,
            ta.end_date,
            c.name as course_name
          FROM test_assignments ta
          JOIN study_group_students sgs ON ta.group_id = sgs.group_id
          JOIN test_templates tt ON ta.test_template_id = tt.id
          JOIN study_groups sg ON ta.group_id = sg.id
          JOIN courses c ON sg.course_id = c.id
          LEFT JOIN test_sessions ts ON ta.id = ts.assignment_id AND ts.student_id = ?
          WHERE sgs.student_id = ?
            AND ta.end_date > ?
            AND ta.status = 'scheduled'
            AND (ts.id IS NULL OR ts.status = 'in_progress')
          ORDER BY ta.end_date ASC
          LIMIT 3
        `;
            const [deadlines] = await pool.query(deadlinesQuery, [studentId, studentId, now]);
            console.log('Deadlines:', (deadlines as any[]).length);
        } catch (e) {
            console.log('Deadlines error (maybe table missing):', e);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

checkDashboard();
