import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody, e as executeQuery } from '../../../nitro/nitro.mjs';
import { a as getScheduleEventById, f as formatDateOnly, b as formatDateForDisplay, c as checkScheduleConflicts, e as dateToLocalIsoString, u as updateScheduleEvent, h as dateToLocalIso } from '../../../_/scheduleRepository.mjs';
import { c as checkInstructorHoursLimit } from '../../../_/instructorRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const existing = await getScheduleEventById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    const body = await readBody(event);
    const startTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : existing.endTime;
    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: "\u0412\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u043D\u0430\u0447\u0430\u043B\u0430"
      });
    }
    const finalGroupId = body.groupId !== void 0 ? body.groupId : existing.groupId;
    const finalDisciplineId = body.disciplineId !== void 0 ? body.disciplineId : existing.disciplineId;
    const finalEventType = body.eventType !== void 0 ? body.eventType : existing.eventType;
    const checkClassroom = body.classroomId !== void 0 ? body.classroomId : existing.classroomId;
    const checkInstructor = body.instructorId !== void 0 ? body.instructorId : existing.instructorId;
    if (finalGroupId) {
      const groupRows = await executeQuery(
        "SELECT id, start_date, end_date, course_id FROM study_groups WHERE id = ? LIMIT 1",
        [finalGroupId]
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
      if (finalDisciplineId && finalEventType && finalEventType !== "other") {
        const disciplineRows = await executeQuery(
          "SELECT id, theory_hours, practice_hours, assessment_hours FROM disciplines WHERE id = ? AND course_id = ? LIMIT 1",
          [finalDisciplineId, group.course_id]
        );
        if (disciplineRows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: "\u0414\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0438\u043B\u0438 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0435 \u0433\u0440\u0443\u043F\u043F\u044B"
          });
        }
        const discipline = disciplineRows[0];
        let allocatedHours = 0;
        const eventType = finalEventType;
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
           WHERE group_id = ? AND discipline_id = ? AND event_type = ? AND id != ?`,
          [finalGroupId, finalDisciplineId, finalEventType, id]
        );
        const usedMinutes = usedHoursRows[0]?.total_minutes || 0;
        const usedAcademicHours = Math.ceil(usedMinutes / 45);
        const eventMinutes = (endTime.getTime() - startTime.getTime()) / (1e3 * 60);
        const eventHours = Math.ceil(eventMinutes / 45);
        const remainingHours = allocatedHours - usedAcademicHours;
        if (eventHours > remainingHours) {
          const typeNames = {
            theory: "\u0442\u0435\u043E\u0440\u0438\u0438",
            practice: "\u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438",
            assessment: "\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0437\u043D\u0430\u043D\u0438\u0439"
          };
          throw createError({
            statusCode: 400,
            statusMessage: `\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D\u0438\u0435 \u043B\u0438\u043C\u0438\u0442\u0430 \u0447\u0430\u0441\u043E\u0432 \u0434\u043B\u044F ${typeNames[eventType]}! \u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ${remainingHours} \u0447., \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044F ${eventHours} \u0447.`
          });
        }
      }
    }
    if (checkInstructor) {
      const eventDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1e3 * 60);
      const instructorChanged = body.instructorId !== void 0 && body.instructorId !== existing.instructorId;
      const timeChanged = body.startTime !== void 0 || body.endTime !== void 0;
      if (instructorChanged || timeChanged) {
        const oldDurationMinutes = instructorChanged ? 0 : (existing.endTime.getTime() - existing.startTime.getTime()) / (1e3 * 60);
        const additionalMinutes = instructorChanged ? eventDurationMinutes : Math.max(0, eventDurationMinutes - oldDurationMinutes);
        if (additionalMinutes > 0) {
          const hoursCheck = await checkInstructorHoursLimit(checkInstructor, additionalMinutes);
          if (!hoursCheck.canTake) {
            throw createError({
              statusCode: 400,
              statusMessage: hoursCheck.message || "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0447\u0430\u0441\u043E\u0432 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443"
            });
          }
        }
      }
    }
    if (checkClassroom || checkInstructor || finalGroupId) {
      const conflicts = await checkScheduleConflicts(
        dateToLocalIsoString(startTime),
        dateToLocalIsoString(endTime),
        {
          classroomId: checkClassroom || void 0,
          instructorId: checkInstructor || void 0,
          groupId: finalGroupId || void 0,
          excludeEventId: id
        }
      );
      if (conflicts.length > 0) {
        const conflictMessages = [];
        for (const conflict of conflicts) {
          if (conflict.classroomId === checkClassroom && conflict.classroom) {
            conflictMessages.push(`\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F "${conflict.classroom.name}" \u0437\u0430\u043D\u044F\u0442\u0430`);
          }
          if (conflict.instructorId === checkInstructor && conflict.instructor) {
            conflictMessages.push(`\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 "${conflict.instructor.fullName}" \u0437\u0430\u043D\u044F\u0442`);
          }
          if (conflict.groupId === finalGroupId && conflict.group) {
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
    const scheduleEvent = await updateScheduleEvent(id, body);
    if (!scheduleEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      });
    }
    await logActivity(
      event,
      "UPDATE",
      "SCHEDULE",
      scheduleEvent.id,
      scheduleEvent.title,
      {
        changes: body,
        previousTitle: existing.title,
        groupId: finalGroupId,
        disciplineId: finalDisciplineId,
        eventType: finalEventType
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
    console.error("Error updating schedule event:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
