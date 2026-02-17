import { g as defineEventHandler, h as createError, j as getRouterParam, r as readBody, f as executeQuery, k as executeTransaction } from '../../../../../_/nitro.mjs';
import { v4 } from 'uuid';
import { i as isoToMySqlDatetime } from '../../../../../_/timeUtils.mjs';
import { l as logActivity } from '../../../../../_/activityLogger.mjs';
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
import '../../../../../_/activityLogRepository.mjs';

const apply_post = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432"
    });
  }
  const templateId = getRouterParam(event, "id");
  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
    });
  }
  const body = await readBody(event);
  const {
    targetGroupId,
    targetDate,
    overrideInstructorId,
    overrideClassroomId
  } = body;
  if (!targetGroupId) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u0446\u0435\u043B\u0435\u0432\u0443\u044E \u0433\u0440\u0443\u043F\u043F\u0443"
    });
  }
  if (!targetDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u0434\u0430\u0442\u0443"
    });
  }
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B"
    });
  }
  console.log(
    `[templates.apply] User ${user.id} applying template ${templateId} to group ${targetGroupId} on ${targetDate}`
  );
  try {
    const templateQuery = `
      SELECT id, name, events_data
      FROM schedule_templates
      WHERE id = ? AND is_active = TRUE
    `;
    const templates = await executeQuery(templateQuery, [
      templateId
    ]);
    if (templates.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const template = templates[0];
    const eventsData = typeof template.events_data === "string" ? JSON.parse(template.events_data) : template.events_data;
    if (!eventsData || eventsData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u0437\u0430\u043D\u044F\u0442\u0438\u0439"
      });
    }
    const createdEventIds = [];
    const errors = [];
    await executeTransaction(async (connection) => {
      const sortedEvents = [...eventsData].sort(
        (a, b) => a.orderIndex - b.orderIndex
      );
      for (const templateEvent of sortedEvents) {
        try {
          const newId = v4();
          const startHours = Math.floor(templateEvent.startOffset / 60);
          const startMinutes = templateEvent.startOffset % 60;
          const newStartTime = new Date(target);
          newStartTime.setHours(startHours, startMinutes, 0, 0);
          const newEndTime = new Date(
            newStartTime.getTime() + templateEvent.durationMinutes * 60 * 1e3
          );
          const instructorId = overrideInstructorId || templateEvent.instructorId || null;
          const classroomId = overrideClassroomId || templateEvent.classroomId || null;
          await connection.query(
            `INSERT INTO schedule_events (
              id, title, description, group_id, discipline_id, instructor_id,
              classroom_id, start_time, end_time, is_all_day, color, event_type,
              duration_minutes, academic_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              templateEvent.title,
              templateEvent.description || null,
              targetGroupId,
              templateEvent.disciplineId || null,
              instructorId,
              classroomId,
              isoToMySqlDatetime(newStartTime.toISOString()),
              isoToMySqlDatetime(newEndTime.toISOString()),
              false,
              templateEvent.color || "primary",
              templateEvent.eventType || "theory",
              templateEvent.durationMinutes,
              templateEvent.academicHours || null
            ]
          );
          createdEventIds.push(newId);
        } catch (err) {
          console.error(`[templates.apply] Error creating event:`, err);
          errors.push(
            `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F "${templateEvent.title}": ${err.message}`
          );
        }
      }
    });
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      createdEventIds[0] || void 0,
      `\u041F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430: ${template.name}`,
      {
        templateId,
        templateName: template.name,
        targetGroupId,
        targetDate,
        createdEventIds,
        overrideInstructorId,
        overrideClassroomId
      }
    );
    console.log(
      `[templates.apply] Created ${createdEventIds.length} events from template`
    );
    return {
      success: true,
      createdCount: createdEventIds.length,
      createdEventIds,
      errors
    };
  } catch (error) {
    console.error("[templates.apply] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { apply_post as default };
//# sourceMappingURL=apply.post.mjs.map
