import { d as defineEventHandler, r as readBody, c as createError } from '../../_/nitro.mjs';
import { b as bulkUpsertAttendance, u as upsertAttendance } from '../../_/attendanceRepository.mjs';
import { e as ensureMarkingStatus, c as checkMarkingAccess, u as updateMarkingStatus, a as updateMarkedCount } from '../../_/attendanceMarkingRepository.mjs';
import { g as getInstructorByUserId } from '../../_/instructorRepository.mjs';
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
    const userId = event.context.auth?.userId;
    const role = event.context.auth?.role;
    const scheduleEventId = body.scheduleEventId;
    if (!scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C scheduleEventId"
      });
    }
    console.log(
      `[Attendance] POST /api/attendance - User: ${userId}, Role: ${role}, Event: ${scheduleEventId}`
    );
    let instructorId;
    if (role === "TEACHER") {
      const instructor = await getInstructorByUserId(userId);
      instructorId = instructor?.id;
    }
    await ensureMarkingStatus(scheduleEventId);
    const accessCheck = await checkMarkingAccess(
      scheduleEventId,
      userId,
      role,
      instructorId
    );
    if (!accessCheck.allowed) {
      if (accessCheck.status === "requires_approval" || accessCheck.requiresApproval) {
        return {
          success: false,
          requiresApproval: true,
          message: accessCheck.message || "\u0421\u0440\u043E\u043A \u043E\u0442\u043C\u0435\u0442\u043A\u0438 \u0438\u0441\u0442\u0451\u043A. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430",
          scheduleEventId,
          deadline: accessCheck.deadline,
          lateDeadline: accessCheck.lateDeadline
        };
      }
      throw createError({
        statusCode: 403,
        message: accessCheck.message || "\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u043E\u0442\u043C\u0435\u0442\u043A\u0435 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D"
      });
    }
    let markingStatus = "on_time";
    if (accessCheck.isApprovedByAdmin) {
      markingStatus = "approved";
    } else if (accessCheck.existingRequestId) {
      markingStatus = "approved";
    } else if (accessCheck.status === "late") {
      markingStatus = "late";
    }
    if (body.bulk && Array.isArray(body.attendances)) {
      const count = await bulkUpsertAttendance({
        scheduleEventId: body.scheduleEventId,
        maxHours: body.maxHours,
        markedBy: userId,
        attendances: body.attendances
      });
      await updateMarkingStatus(scheduleEventId, {
        status: markingStatus,
        markedBy: userId,
        markedCount: count,
        lateReason: markingStatus === "late" ? body.lateReason : void 0
      });
      await updateMarkedCount(scheduleEventId);
      const logMessage = markingStatus === "late" ? `\u041C\u0430\u0441\u0441\u043E\u0432\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 (\u0441 \u043E\u043F\u043E\u0437\u0434\u0430\u043D\u0438\u0435\u043C)` : `\u041C\u0430\u0441\u0441\u043E\u0432\u0430\u044F \u043E\u0442\u043C\u0435\u0442\u043A\u0430 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438`;
      await logActivity(
        event,
        "UPDATE",
        "ATTENDANCE",
        body.scheduleEventId,
        logMessage,
        {
          count,
          scheduleEventId: body.scheduleEventId,
          markingStatus,
          lateReason: body.lateReason
        }
      );
      return {
        success: true,
        message: `\u041E\u0442\u043C\u0435\u0447\u0435\u043D\u043E ${count} \u0437\u0430\u043F\u0438\u0441\u0435\u0439`,
        count,
        markingStatus,
        isLate: markingStatus === "late"
      };
    }
    if (!body.studentId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C studentId"
      });
    }
    if (body.hoursAttended === void 0 || body.maxHours === void 0) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C hoursAttended \u0438 maxHours"
      });
    }
    if (body.hoursAttended < 0 || body.hoursAttended > body.maxHours) {
      throw createError({
        statusCode: 400,
        message: "hoursAttended \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043E\u0442 0 \u0434\u043E maxHours"
      });
    }
    const attendance = await upsertAttendance({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      hoursAttended: body.hoursAttended,
      maxHours: body.maxHours,
      notes: body.notes,
      markedBy: userId
    });
    await updateMarkingStatus(scheduleEventId, {
      status: "in_progress",
      markedBy: userId
    });
    await updateMarkedCount(scheduleEventId);
    await logActivity(
      event,
      "UPDATE",
      "ATTENDANCE",
      attendance.id,
      `\u041F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C: ${attendance.hoursAttended}/${attendance.maxHours} \u0430-\u0447`,
      {
        studentId: body.studentId,
        scheduleEventId: body.scheduleEventId,
        hoursAttended: body.hoursAttended,
        maxHours: body.maxHours,
        markingStatus
      }
    );
    return {
      success: true,
      attendance,
      markingStatus,
      isLate: markingStatus === "late"
    };
  } catch (error) {
    console.error("Error saving attendance:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
