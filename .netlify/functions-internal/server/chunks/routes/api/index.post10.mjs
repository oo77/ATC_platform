import { d as defineEventHandler, r as readBody, c as createError, e as executeQuery } from '../../nitro/nitro.mjs';
import { f as formatDateOnly, b as formatDateForDisplay, c as checkScheduleConflicts, j as createScheduleEvent, h as dateToLocalIso } from '../../_/scheduleRepository.mjs';
import { c as checkInstructorHoursLimit } from '../../_/instructorRepository.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
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
import 'jsonwebtoken';
import '../../_/activityLogRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("[Schedule API] \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u044B \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0437\u0430\u043D\u044F\u0442\u0438\u044F:", JSON.stringify(body, null, 2));
    if (!body.title?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"
      });
    }
    if (!body.startTime || !body.endTime) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0412\u0440\u0435\u043C\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0438 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B"
      });
    }
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);
    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0412\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430\u0447\u0430\u043B\u0430"
      });
    }
    if (body.groupId) {
      const groupRows = await executeQuery(
        "SELECT id, start_date, end_date, course_id FROM study_groups WHERE id = ? LIMIT 1",
        [body.groupId]
      );
      if (groupRows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
      const group = groupRows[0];
      const eventDate = formatDateOnly(startTime);
      const groupStartDate = formatDateOnly(group.start_date);
      const groupEndDate = formatDateOnly(group.end_date);
      if (eventDate < groupStartDate || eventDate > groupEndDate) {
        throw createError({
          statusCode: 400,
          statusMessage: `\u0414\u0430\u0442\u0430 \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u0432 \u043F\u0440\u0435\u0434\u0435\u043B\u0430\u0445 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B (${formatDateForDisplay(groupStartDate)} \u2014 ${formatDateForDisplay(groupEndDate)})`
        });
      }
      if (body.disciplineId && body.eventType && body.eventType !== "other") {
        const disciplineRows = await executeQuery(
          "SELECT id, theory_hours, practice_hours, assessment_hours FROM disciplines WHERE id = ? AND course_id = ? LIMIT 1",
          [body.disciplineId, group.course_id]
        );
        if (disciplineRows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u0433\u0440\u0443\u043F\u043F\u044B"
          });
        }
        const discipline = disciplineRows[0];
        let allocatedHours = 0;
        const eventType = body.eventType;
        if (eventType === "theory") {
          allocatedHours = discipline.theory_hours;
        } else if (eventType === "practice") {
          allocatedHours = discipline.practice_hours;
        } else if (eventType === "assessment") {
          allocatedHours = discipline.assessment_hours;
        }
        const usedHoursRows = await executeQuery(
          `SELECT SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
           FROM schedule_events
           WHERE group_id = ? AND discipline_id = ? AND event_type = ?`,
          [body.groupId, body.disciplineId, body.eventType]
        );
        const usedMinutes = usedHoursRows[0]?.total_minutes || 0;
        const usedAcademicHours = Math.ceil(usedMinutes / 45);
        const newEventMinutes = (endTime.getTime() - startTime.getTime()) / (1e3 * 60);
        const newEventHours = Math.ceil(newEventMinutes / 45);
        const remainingHours = allocatedHours - usedAcademicHours;
        if (newEventHours > remainingHours) {
          const typeNames = {
            theory: "\u0442\u0435\u043E\u0440\u0438\u0438",
            practice: "\u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438",
            assessment: "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0437\u043D\u0430\u043D\u0438\u0439"
          };
          throw createError({
            statusCode: 400,
            statusMessage: `\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D\u0438\u0435 \u043B\u0438\u043C\u0438\u0442\u0430 \u0447\u0430\u0441\u043E\u0432 \u0434\u043B\u044F ${typeNames[eventType]}! \u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ${remainingHours} \u0447., \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044F ${newEventHours} \u0447.`
          });
        }
      }
    }
    if (body.instructorId) {
      const eventDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1e3 * 60);
      const hoursCheck = await checkInstructorHoursLimit(body.instructorId, eventDurationMinutes);
      if (!hoursCheck.canTake) {
        throw createError({
          statusCode: 400,
          statusMessage: hoursCheck.message || "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0447\u0430\u0441\u043E\u0432 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443"
        });
      }
    }
    if (body.classroomId || body.instructorId || body.groupId) {
      const conflicts = await checkScheduleConflicts(body.startTime, body.endTime, {
        classroomId: body.classroomId,
        instructorId: body.instructorId,
        groupId: body.groupId
      });
      if (conflicts.length > 0) {
        const conflictMessages = [];
        for (const conflict of conflicts) {
          if (conflict.classroomId === body.classroomId && conflict.classroom) {
            conflictMessages.push(`\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F "${conflict.classroom.name}" \u0437\u0430\u043D\u044F\u0442\u0430`);
          }
          if (conflict.instructorId === body.instructorId && conflict.instructor) {
            conflictMessages.push(`\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 "${conflict.instructor.fullName}" \u0437\u0430\u043D\u044F\u0442`);
          }
          if (conflict.groupId === body.groupId && conflict.group) {
            conflictMessages.push(`\u0413\u0440\u0443\u043F\u043F\u0430 "${conflict.group.code}" \u0437\u0430\u043D\u044F\u0442\u0430`);
          }
        }
        if (conflictMessages.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: `\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F: ${[...new Set(conflictMessages)].join(", ")}`
          });
        }
      }
    }
    const scheduleEvent = await createScheduleEvent(body);
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      scheduleEvent.id,
      scheduleEvent.title,
      {
        startTime: scheduleEvent.startTime,
        endTime: scheduleEvent.endTime,
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        instructorId: body.instructorId,
        classroomId: body.classroomId,
        eventType: body.eventType
      }
    );
    return {
      success: true,
      event: {
        ...scheduleEvent,
        startTime: dateToLocalIso(scheduleEvent.startTime),
        endTime: dateToLocalIso(scheduleEvent.endTime),
        createdAt: scheduleEvent.createdAt.toISOString(),
        updatedAt: scheduleEvent.updatedAt.toISOString()
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error creating schedule event:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post10.mjs.map
