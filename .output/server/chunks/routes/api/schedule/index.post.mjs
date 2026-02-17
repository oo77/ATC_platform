import { g as defineEventHandler, h as createError, r as readBody, f as executeQuery } from '../../../_/nitro.mjs';
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

const index_post = defineEventHandler(async (event) => {
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
      statusMessage: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432"
    });
  }
  const body = await readBody(event);
  const { name, description, eventIds, sourceGroupId } = body;
  if (!name || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
    });
  }
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0435"
    });
  }
  console.log(
    `[templates.post] User ${user.id} creating template "${name}" from ${eventIds.length} events`
  );
  try {
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT 
        se.id,
        se.title,
        se.description,
        se.discipline_id,
        d.name AS discipline_name,
        se.instructor_id,
        i.full_name AS instructor_name,
        se.classroom_id,
        c.name AS classroom_name,
        se.start_time,
        se.end_time,
        se.color,
        se.event_type,
        se.duration_minutes,
        se.academic_hours,
        se.group_id
      FROM schedule_events se
      LEFT JOIN disciplines d ON se.discipline_id = d.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN classrooms c ON se.classroom_id = c.id
      WHERE se.id IN (${placeholders})
      ORDER BY se.start_time ASC
    `;
    const sourceEvents = await executeQuery(
      eventsQuery,
      eventIds
    );
    if (sourceEvents.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0417\u0430\u043D\u044F\u0442\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B"
      });
    }
    const firstEventStart = new Date(sourceEvents[0].start_time);
    const eventsData = sourceEvents.map((evt, index) => {
      const eventStart = new Date(evt.start_time);
      const eventEnd = new Date(evt.end_time);
      const startOffset = eventStart.getHours() * 60 + eventStart.getMinutes();
      const durationMinutes = evt.duration_minutes || Math.round((eventEnd.getTime() - eventStart.getTime()) / (1e3 * 60));
      return {
        title: evt.title,
        description: evt.description,
        disciplineId: evt.discipline_id,
        disciplineName: evt.discipline_name,
        instructorId: evt.instructor_id,
        instructorName: evt.instructor_name,
        classroomId: evt.classroom_id,
        classroomName: evt.classroom_name,
        eventType: evt.event_type,
        color: evt.color,
        startOffset,
        durationMinutes,
        academicHours: evt.academic_hours,
        orderIndex: index
      };
    });
    const templateId = v4();
    const insertQuery = `
      INSERT INTO schedule_templates (
        id, name, description, source_group_id, events_data, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    await executeQuery(insertQuery, [
      templateId,
      name.trim(),
      description?.trim() || null,
      sourceGroupId || sourceEvents[0].group_id || null,
      JSON.stringify(eventsData),
      user.id
    ]);
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      templateId,
      `\u0428\u0430\u0431\u043B\u043E\u043D \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F: ${name}`,
      {
        templateName: name,
        eventsCount: eventsData.length,
        sourceEventIds: eventIds
      }
    );
    console.log(
      `[templates.post] Created template ${templateId} with ${eventsData.length} events`
    );
    return {
      success: true,
      template: {
        id: templateId,
        name: name.trim(),
        description: description?.trim() || null,
        sourceGroupId: sourceGroupId || sourceEvents[0].group_id || null,
        eventsData,
        createdBy: user.id,
        isActive: true
      }
    };
  } catch (error) {
    console.error("[templates.post] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
