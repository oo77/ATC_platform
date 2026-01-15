/**
 * Migration: Link users with students and instructors by email
 * Связывает пользователей со студентами и инструкторами по email
 * Это более надёжный способ, чем через user_id
 */

import type { PoolConnection } from "mysql2/promise";

export const description =
  "Link users with students and instructors by matching email addresses";

export async function up(connection: PoolConnection): Promise<void> {
  console.log("🔄 Linking users with students by PINFL...");

  // Связываем пользователей со студентами по ПИНФЛ
  const [studentsResult] = await connection.query<any>(`
    UPDATE users u
    INNER JOIN students s ON u.pinfl = s.pinfl
    SET u.student_id = s.id
    WHERE u.role = 'STUDENT' AND u.student_id IS NULL AND u.pinfl IS NOT NULL AND s.pinfl IS NOT NULL
  `);

  console.log(
    `✅ Linked ${studentsResult.affectedRows} users with students via PINFL`
  );

  // Связываем пользователей с инструкторами по email
  const [instructorsResult] = await connection.query<any>(`
    UPDATE users u
    INNER JOIN instructors i ON u.email = i.email
    SET u.instructor_id = i.id
    WHERE u.role = 'TEACHER' AND u.instructor_id IS NULL AND i.email IS NOT NULL
  `);

  console.log(
    `✅ Linked ${instructorsResult.affectedRows} users with instructors via email`
  );

  // Выводим статистику
  const [stats] = await connection.query<any>(`
    SELECT 
      COUNT(*) as total_students,
      SUM(CASE WHEN student_id IS NOT NULL THEN 1 ELSE 0 END) as linked_students,
      SUM(CASE WHEN student_id IS NULL THEN 1 ELSE 0 END) as unlinked_students
    FROM users
    WHERE role = 'STUDENT'
  `);

  const [instructorStats] = await connection.query<any>(`
    SELECT 
      COUNT(*) as total_instructors,
      SUM(CASE WHEN instructor_id IS NOT NULL THEN 1 ELSE 0 END) as linked_instructors,
      SUM(CASE WHEN instructor_id IS NULL THEN 1 ELSE 0 END) as unlinked_instructors
    FROM users
    WHERE role = 'TEACHER'
  `);

  if (stats.length > 0) {
    console.log(
      `📊 Students: ${stats[0].linked_students}/${stats[0].total_students} linked (${stats[0].unlinked_students} unlinked)`
    );
  }

  if (instructorStats.length > 0) {
    console.log(
      `📊 Instructors: ${instructorStats[0].linked_instructors}/${instructorStats[0].total_instructors} linked (${instructorStats[0].unlinked_instructors} unlinked)`
    );
  }

  // Показываем примеры несвязанных пользователей для отладки
  const [unlinkedStudents] = await connection.query<any>(`
    SELECT u.id, u.name, u.email, u.pinfl
    FROM users u
    WHERE u.role = 'STUDENT' AND u.student_id IS NULL
    LIMIT 5
  `);

  if (unlinkedStudents.length > 0) {
    console.log("\n⚠️  Sample unlinked students:");
    unlinkedStudents.forEach((student: any) => {
      console.log(`   - ${student.name} (PINFL: ${student.pinfl || "N/A"})`);
    });
  }

  const [unlinkedInstructors] = await connection.query<any>(`
    SELECT u.id, u.name, u.email
    FROM users u
    WHERE u.role = 'TEACHER' AND u.instructor_id IS NULL
    LIMIT 5
  `);

  if (unlinkedInstructors.length > 0) {
    console.log("\n⚠️  Sample unlinked instructors:");
    unlinkedInstructors.forEach((instructor: any) => {
      console.log(`   - ${instructor.name} (${instructor.email})`);
    });
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
