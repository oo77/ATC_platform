
import { defineTask } from 'nitropack/runtime';
import { executeQuery } from '../utils/db';
import { studentNotificationService } from '../services/studentNotificationService';

export default defineTask({
    meta: {
        name: 'check-deadlines',
        description: 'Check for upcoming test deadlines and send notifications',
    },
    async run() {
        console.log('[Task: CheckDeadlines] Starting...');

        // 1. Получаем активные назначения, у которых есть дедлайн
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
    `); // Берем тесты с дедлайном в ближайшие 3 дня

        console.log(`[Task: CheckDeadlines] Found ${assignments.length} assignments closing soon.`);

        for (const assignment of assignments) {
            const deadline = new Date(assignment.end_date);
            const now = new Date();
            const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

            let notificationType: 'TEST_TODAY' | 'TEST_UPCOMING' | null = null;

            if (hoursLeft <= 24) {
                notificationType = 'TEST_TODAY';
            } else if (hoursLeft <= 72) {
                notificationType = 'TEST_UPCOMING';
            }

            if (!notificationType) continue;

            // 2. Получаем студентов группы
            const students = await executeQuery(`
        SELECT s.id, s.user_id 
        FROM students s
        JOIN study_group_students sgs ON s.id = sgs.student_id
        WHERE sgs.group_id = ?
      `, [assignment.group_id]);

            for (const student of students) {
                // 3. Проверяем, сдал ли студент этот тест
                const [session] = await executeQuery(`
          SELECT id, passed, best_score 
          FROM test_sessions 
          WHERE assignment_id = ? AND student_id = ? AND status = 'completed' AND passed = 1
          LIMIT 1
        `, [assignment.id, student.id]);

                if (session) continue; // Уже сдал

                // 4. Проверяем, не отправляли ли мы уже такое уведомление недавно (чтобы не спамить)
                // Для этого ищем в метаданных assignment_id и тип уведомления
                const [existingNotification] = await executeQuery(`
          SELECT id FROM student_notifications 
          WHERE 
            student_id = ? 
            AND type = ? 
            AND JSON_EXTRACT(metadata, '$.assignment_id') = ?
            AND created_at > DATE_SUB(NOW(), INTERVAL 20 HOUR) -- Не чаще раза в сутки для того же типа
          LIMIT 1
        `, [student.id, notificationType, assignment.id]);

                if (existingNotification) continue;

                // 5. Отправляем уведомление
                const daysLeft = Math.ceil(hoursLeft / 24);
                const timeMsg = hoursLeft <= 24 ? `${Math.floor(hoursLeft)} ч.` : `${daysLeft} дн.`;

                const title = notificationType === 'TEST_TODAY'
                    ? `🔥 Срок сдачи теста истекает сегодня!`
                    : `⏳ Скоро дедлайн по тесту`;

                const message = `Тест "${assignment.template_name}" (Группа ${assignment.group_name}) нужно сдать до ${deadline.toLocaleDateString()}. Осталось: ${timeMsg}`;

                await studentNotificationService.create({
                    studentId: student.id,
                    type: notificationType,
                    priority: notificationType === 'TEST_TODAY' ? 'high' : 'medium',
                    title: title,
                    message: message,
                    link: `/tests/my?highlight=${assignment.id}`,
                    metadata: {
                        assignment_id: assignment.id,
                        deadline: assignment.end_date
                    }
                });

                console.log(`[Task: CheckDeadlines] Sent ${notificationType} to student ${student.id}`);
            }
        }

        // TODO: Обработка просроченных тестов (TEST_OVERDUE) - аналогично, но date < NOW() и статус != completed

        console.log('[Task: CheckDeadlines] Finished.');
        return { result: 'Success' };
    }
});
