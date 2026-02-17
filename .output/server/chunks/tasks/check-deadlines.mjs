import { e as defineTask, f as executeQuery } from '../_/nitro.mjs';
import { s as studentNotificationService } from '../_/studentNotificationService.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';

const checkDeadlines = defineTask({
  meta: {
    name: "check-deadlines",
    description: "Check for upcoming test deadlines and send notifications"
  },
  async run() {
    console.log("[Task: CheckDeadlines] Starting...");
    const assignments = await executeQuery(`
      SELECT 
        ta.id, 
        ta.test_template_id, 
        ta.group_id, 
        ta.end_date,
        tt.name as template_name,
        sg.code as group_name
      FROM test_assignments ta
      JOIN test_templates tt ON ta.test_template_id = tt.id
      JOIN study_groups sg ON ta.group_id = sg.id
      WHERE 
        ta.status IN ('scheduled', 'in_progress') 
        AND ta.end_date IS NOT NULL
        AND ta.end_date > NOW() 
        AND ta.end_date < DATE_ADD(NOW(), INTERVAL 3 DAY)
    `);
    console.log(`[Task: CheckDeadlines] Found ${assignments.length} assignments closing soon.`);
    for (const assignment of assignments) {
      const deadline = new Date(assignment.end_date);
      const now = /* @__PURE__ */ new Date();
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1e3 * 60 * 60);
      let notificationType = null;
      if (hoursLeft <= 24) {
        notificationType = "TEST_TODAY";
      } else if (hoursLeft <= 72) {
        notificationType = "TEST_UPCOMING";
      }
      if (!notificationType) continue;
      const students = await executeQuery(`
        SELECT s.id, s.user_id 
        FROM students s
        JOIN study_group_students sgs ON s.id = sgs.student_id
        WHERE sgs.group_id = ?
      `, [assignment.group_id]);
      for (const student of students) {
        const [session] = await executeQuery(`
          SELECT id, passed 
          FROM test_sessions 
          WHERE assignment_id = ? AND student_id = ? AND status = 'completed' AND passed = 1
          LIMIT 1
        `, [assignment.id, student.id]);
        if (session) continue;
        const [existingNotification] = await executeQuery(`
          SELECT id FROM student_notifications 
          WHERE 
            student_id = ? 
            AND type = ? 
            AND JSON_EXTRACT(metadata, '$.assignment_id') = ?
            AND created_at > DATE_SUB(NOW(), INTERVAL 20 HOUR) -- \u041D\u0435 \u0447\u0430\u0449\u0435 \u0440\u0430\u0437\u0430 \u0432 \u0441\u0443\u0442\u043A\u0438 \u0434\u043B\u044F \u0442\u043E\u0433\u043E \u0436\u0435 \u0442\u0438\u043F\u0430
          LIMIT 1
        `, [student.id, notificationType, assignment.id]);
        if (existingNotification) continue;
        const daysLeft = Math.ceil(hoursLeft / 24);
        const timeMsg = hoursLeft <= 24 ? `${Math.floor(hoursLeft)} \u0447.` : `${daysLeft} \u0434\u043D.`;
        const title = notificationType === "TEST_TODAY" ? `\u{1F525} \u0421\u0440\u043E\u043A \u0441\u0434\u0430\u0447\u0438 \u0442\u0435\u0441\u0442\u0430 \u0438\u0441\u0442\u0435\u043A\u0430\u0435\u0442 \u0441\u0435\u0433\u043E\u0434\u043D\u044F!` : `\u23F3 \u0421\u043A\u043E\u0440\u043E \u0434\u0435\u0434\u043B\u0430\u0439\u043D \u043F\u043E \u0442\u0435\u0441\u0442\u0443`;
        const message = `\u0422\u0435\u0441\u0442 "${assignment.template_name}" (\u0413\u0440\u0443\u043F\u043F\u0430 ${assignment.group_name}) \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0430\u0442\u044C \u0434\u043E ${deadline.toLocaleDateString()}. \u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C: ${timeMsg}`;
        await studentNotificationService.create({
          studentId: student.id,
          type: notificationType,
          priority: notificationType === "TEST_TODAY" ? "high" : "medium",
          title,
          message,
          link: `/tests/my?highlight=${assignment.id}`,
          metadata: {
            assignment_id: assignment.id,
            deadline: assignment.end_date
          }
        });
        console.log(`[Task: CheckDeadlines] Sent ${notificationType} to student ${student.id}`);
      }
    }
    console.log("[Task: CheckDeadlines] Finished.");
    return { result: "Success" };
  }
});

export { checkDeadlines as default };
//# sourceMappingURL=check-deadlines.mjs.map
