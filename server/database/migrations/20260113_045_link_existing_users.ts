/**
 * Migration: Link existing users with students and instructors
 * Автоматически связывает существующих пользователей со студентами и инструкторами
 * на основе существующего поля user_id в таблицах students и instructors
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Link existing users with students and instructors based on user_id field";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Linking existing users with students...");

  // Связываем пользователей со студентами через существующее поле user_id
  const [studentsResult] = await connection.query<any>(`
    UPDATE users u
    INNER JOIN students s ON u.id = s.user_id
    SET u.student_id = s.id
    WHERE u.role = 'STUDENT' AND u.student_id IS NULL
  `);

  console.log(
    `✅ Linked ${studentsResult.affectedRows} users with students via user_id`
  );

  // Связываем пользователей с инструкторами через существующее поле user_id
  const [instructorsResult] = await connection.query<any>(`
    UPDATE users u
    INNER JOIN instructors i ON u.id = i.user_id
    SET u.instructor_id = i.id
    WHERE u.role = 'TEACHER' AND u.instructor_id IS NULL
  `);

  console.log(
    `✅ Linked ${instructorsResult.affectedRows} users with instructors via user_id`
  );

  // Выводим статистику
  const [stats] = await connection.query<any>(`
    SELECT 
      COUNT(*) as total_students,
      SUM(CASE WHEN student_id IS NOT NULL THEN 1 ELSE 0 END) as linked_students
    FROM users
    WHERE role = 'STUDENT'
  `);

  const [instructorStats] = await connection.query<any>(`
    SELECT 
      COUNT(*) as total_instructors,
      SUM(CASE WHEN instructor_id IS NOT NULL THEN 1 ELSE 0 END) as linked_instructors
    FROM users
    WHERE role = 'TEACHER'
  `);

  if (stats.length > 0) {
    console.log(
      `📊 Students: ${stats[0].linked_students}/${stats[0].total_students} linked`
    );
  }

  if (instructorStats.length > 0) {
    console.log(
      `📊 Instructors: ${instructorStats[0].linked_instructors}/${instructorStats[0].total_instructors} linked`
    );
  }
}

export async function down(connection: PoolConnection): Promise<void> {
  console.log("🔄 Unlinking users from students and instructors...");

  // Очищаем связи
  await connection.query(`
    UPDATE users
    SET student_id = NULL, instructor_id = NULL
  `);

  console.log("✅ All user links removed");
}
