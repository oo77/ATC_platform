import { g as defineEventHandler, h as createError, r as readBody, f as executeQuery, k as executeTransaction } from '../../../_/nitro.mjs';
import { v4 } from 'uuid';
import { i as isoToMySqlDatetime } from '../../../_/timeUtils.mjs';
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

const bulkCopy_post = defineEventHandler(async (event) => {
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
      statusMessage: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0433\u043E \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F"
    });
  }
  const body = await readBody(event);
  const { eventIds, targetDate, preserveSequence = true } = body;
  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0435"
    });
  }
  if (!targetDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u0446\u0435\u043B\u0435\u0432\u0443\u044E \u0434\u0430\u0442\u0443"
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
    `[bulk-copy] User ${user.id} copying ${eventIds.length} events to ${targetDate}`
  );
  try {
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT 
        id, title, description, group_id, discipline_id, instructor_id, 
        classroom_id, start_time, end_time, is_all_day, color, event_type,
        duration_minutes, academic_hours
      FROM schedule_events
      WHERE id IN (${placeholders})
      ORDER BY start_time ASC
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
    const createdEventIds = [];
    const errors = [];
    await executeTransaction(async (connection) => {
      const firstEvent = sourceEvents[0];
      const firstEventStart = new Date(firstEvent.start_time);
      const baseOffset = firstEventStart.getHours() * 60 + firstEventStart.getMinutes();
      for (let i = 0; i < sourceEvents.length; i++) {
        const sourceEvent = sourceEvents[i];
        try {
          const newId = v4();
          let newStartTime;
          let newEndTime;
          if (preserveSequence && i > 0) {
            const eventStart = new Date(sourceEvent.start_time);
            const eventEnd = new Date(sourceEvent.end_time);
            const offsetFromFirst = eventStart.getTime() - firstEventStart.getTime();
            newStartTime = new Date(target);
            newStartTime.setHours(
              firstEventStart.getHours(),
              firstEventStart.getMinutes(),
              0,
              0
            );
            newStartTime = new Date(newStartTime.getTime() + offsetFromFirst);
            const duration = eventEnd.getTime() - eventStart.getTime();
            newEndTime = new Date(newStartTime.getTime() + duration);
          } else {
            const eventStart = new Date(sourceEvent.start_time);
            const eventEnd = new Date(sourceEvent.end_time);
            newStartTime = new Date(target);
            newStartTime.setHours(
              eventStart.getHours(),
              eventStart.getMinutes(),
              eventStart.getSeconds(),
              0
            );
            const duration = eventEnd.getTime() - eventStart.getTime();
            newEndTime = new Date(newStartTime.getTime() + duration);
          }
          await connection.query(
            `INSERT INTO schedule_events (
              id, title, description, group_id, discipline_id, instructor_id,
              classroom_id, start_time, end_time, is_all_day, color, event_type,
              duration_minutes, academic_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              sourceEvent.title,
              sourceEvent.description,
              sourceEvent.group_id,
              sourceEvent.discipline_id,
              sourceEvent.instructor_id,
              sourceEvent.classroom_id,
              isoToMySqlDatetime(newStartTime.toISOString()),
              isoToMySqlDatetime(newEndTime.toISOString()),
              sourceEvent.is_all_day,
              sourceEvent.color,
              sourceEvent.event_type,
              sourceEvent.duration_minutes,
              sourceEvent.academic_hours
            ]
          );
          createdEventIds.push(newId);
        } catch (err) {
          console.error(
            `[bulk-copy] Error copying event ${sourceEvent.id}:`,
            err
          );
          errors.push(
            `\u041E\u0448\u0438\u0431\u043A\u0430 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F "${sourceEvent.title}": ${err.message}`
          );
        }
      }
    });
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      createdEventIds[0] || void 0,
      `\u041C\u0430\u0441\u0441\u043E\u0432\u043E\u0435 \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 ${createdEventIds.length} \u0437\u0430\u043D\u044F\u0442\u0438\u0439`,
      {
        sourceEventIds: eventIds,
        targetDate,
        createdEventIds,
        preserveSequence
      }
    );
    console.log(
      `[bulk-copy] Successfully copied ${createdEventIds.length} events`
    );
    return {
      success: true,
      copiedCount: createdEventIds.length,
      createdEventIds,
      errors
    };
  } catch (error) {
    console.error("[bulk-copy] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0433\u043E \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F"
    });
  }
});

export { bulkCopy_post as default };
//# sourceMappingURL=bulk-copy.post.mjs.map
