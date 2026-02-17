import { g as defineEventHandler, h as createError, r as readBody, f as executeQuery, k as executeTransaction } from '../../../_/nitro.mjs';
import { v4 } from 'uuid';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import 'grammy';
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
import '../../../_/activityLogRepository.mjs';

const retake_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }
  const allowedRoles = ["ADMIN", "MANAGER", "MODERATOR"];
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438"
    });
  }
  const body = await readBody(event);
  if (!body.originalEventId) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0435 (originalEventId)"
    });
  }
  if (!body.studentIds || !Array.isArray(body.studentIds) || body.studentIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438 (studentIds)"
    });
  }
  if (!body.date || !body.startTime || !body.endTime) {
    throw createError({
      statusCode: 400,
      message: "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438"
    });
  }
  console.log("[Retake API] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438:", {
    originalEventId: body.originalEventId,
    studentIds: body.studentIds,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime
  });
  try {
    const originalEvents = await executeQuery(
      `SELECT id, title, description, group_id, discipline_id, 
              instructor_id, classroom_id, event_type, notes
       FROM schedule_events 
       WHERE id = ?`,
      [body.originalEventId]
    );
    if (!originalEvents || originalEvents.length === 0) {
      throw createError({
        statusCode: 404,
        message: "\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    const originalEvent = originalEvents[0];
    const startDateTime = /* @__PURE__ */ new Date(`${body.date}T${body.startTime}:00`);
    const endDateTime = /* @__PURE__ */ new Date(`${body.date}T${body.endTime}:00`);
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B \u0438\u043B\u0438 \u0432\u0440\u0435\u043C\u0435\u043D\u0438"
      });
    }
    if (endDateTime <= startDateTime) {
      throw createError({
        statusCode: 400,
        message: "\u0412\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430\u0447\u0430\u043B\u0430"
      });
    }
    const result = await executeTransaction(
      async (connection) => {
        const retakeEventId = v4();
        const retakeTitle = `\u041F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0430: ${originalEvent.title}`;
        await connection.query(
          `INSERT INTO schedule_events (
          id, title, description, group_id, discipline_id, 
          instructor_id, classroom_id, start_time, end_time,
          is_all_day, color, event_type, is_recurring, 
          recurrence_rule, notes, original_event_id, allowed_student_ids, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            retakeEventId,
            retakeTitle,
            originalEvent.description || `\u041F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0430 \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u043E\u0442 ${new Date(body.date).toLocaleDateString(
              "ru-RU"
            )}`,
            originalEvent.group_id,
            originalEvent.discipline_id,
            body.instructorId || originalEvent.instructor_id,
            body.classroomId || originalEvent.classroom_id,
            startDateTime,
            endDateTime,
            false,
            // is_all_day
            "warning",
            // color - оранжевый для пересдач
            originalEvent.event_type,
            false,
            // is_recurring
            null,
            // recurrence_rule
            `\u0421\u0442\u0443\u0434\u0435\u043D\u0442\u044B \u043D\u0430 \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0435: ${body.studentIds.length}`,
            body.originalEventId,
            // Связь с оригинальным занятием!
            JSON.stringify(body.studentIds)
            // <--- ВАЖНО: записываем список студентов
          ]
        );
        console.log("[Retake API] \u0421\u043E\u0437\u0434\u0430\u043D\u043E \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438:", retakeEventId);
        if (originalEvent.event_type === "assessment") {
          let testTemplateId = body.testTemplateId;
          if (!testTemplateId) {
            const [originalAssignments] = await connection.query(
              `SELECT id, test_template_id FROM test_assignments 
             WHERE schedule_event_id = ? LIMIT 1`,
              [body.originalEventId]
            );
            if (originalAssignments && originalAssignments.length > 0) {
              testTemplateId = originalAssignments[0].test_template_id;
            }
          }
          if (testTemplateId) {
            const assignmentId = v4();
            await connection.query(
              `INSERT INTO test_assignments (
              id, test_template_id, group_id, schedule_event_id,
              status, assigned_by, allowed_student_ids, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
              [
                assignmentId,
                testTemplateId,
                originalEvent.group_id,
                retakeEventId,
                "published",
                user.id,
                JSON.stringify(body.studentIds)
                // Ограничиваем доступ к тесту
              ]
            );
            console.log(
              "[Retake API] \u0421\u043E\u0437\u0434\u0430\u043D test_assignment \u0441 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435\u043C \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432:",
              {
                assignmentId,
                testTemplateId,
                allowedStudents: body.studentIds.length
              }
            );
          }
        }
        return {
          retakeEventId,
          title: retakeTitle,
          originalEventId: body.originalEventId,
          studentCount: body.studentIds.length
        };
      }
    );
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      result.retakeEventId,
      result.title,
      {
        originalEventId: body.originalEventId,
        studentIds: body.studentIds,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        isRetake: true
      }
    );
    console.log("[Retake API] \u041F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0430:", result);
    return {
      success: true,
      message: `\u041F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0434\u043B\u044F ${result.studentCount} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432`,
      retakeEventId: result.retakeEventId,
      originalEventId: result.originalEventId
    };
  } catch (error) {
    console.error("[Retake API] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u0441\u0434\u0430\u0447\u0438"
    });
  }
});

export { retake_post as default };
//# sourceMappingURL=retake.post.mjs.map
