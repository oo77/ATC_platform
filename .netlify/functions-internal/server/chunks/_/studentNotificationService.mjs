import { e as executeQuery } from './nitro.mjs';

async function markNotificationAsRead(id, studentId) {
  await executeQuery(
    "UPDATE student_notifications SET is_read = TRUE WHERE id = ? AND student_id = ?",
    [id, studentId]
  );
}
async function getStudentNotifications(studentId, unreadOnly = false, limit = 50) {
  let query = `SELECT * FROM student_notifications WHERE student_id = ?`;
  const params = [studentId];
  if (unreadOnly) {
    query += ` AND is_read = FALSE`;
  }
  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);
  return executeQuery(query, params);
}
async function getUpcomingDeadlines(studentId) {
  let query = `
    SELECT 
      s.id as student_id,
      ta.id as assignment_id,
      ta.end_date,
      tt.name as test_name,
      DATEDIFF(ta.end_date, NOW()) as days_left
    FROM test_assignments ta
    JOIN study_group_students sgs ON ta.group_id = sgs.group_id
    JOIN students s ON sgs.student_id = s.id
    JOIN test_templates tt ON ta.test_template_id = tt.id
    WHERE 
      ta.status IN ('scheduled', 'in_progress')
      AND ta.end_date > NOW()
      AND ta.end_date < DATE_ADD(NOW(), INTERVAL 7 DAY)
  `;
  const params = [];
  if (studentId) {
    query += ` AND s.id = ?`;
    params.push(studentId);
  }
  query += `
    AND NOT EXISTS (
      SELECT 1 FROM test_sessions ts 
      WHERE ts.assignment_id = ta.id 
      AND ts.student_id = s.id 
      AND ts.status = 'completed' 
      AND ts.passed = 1
    )
  `;
  query += ` ORDER BY ta.end_date ASC`;
  const rows = await executeQuery(query, params);
  return rows;
}

export { getUpcomingDeadlines as a, getStudentNotifications as g, markNotificationAsRead as m };
//# sourceMappingURL=studentNotificationService.mjs.map
