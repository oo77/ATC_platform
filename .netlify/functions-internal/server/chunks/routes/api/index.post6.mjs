import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { d as bulkUpsertGrades, e as getExistingGrade, f as upsertGrade } from '../../_/attendanceRepository.mjs';
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
    if (body.bulk && Array.isArray(body.grades)) {
      const count = await bulkUpsertGrades({
        scheduleEventId: body.scheduleEventId,
        gradedBy: userId,
        grades: body.grades
      });
      await logActivity(
        event,
        "UPDATE",
        "GRADE",
        body.scheduleEventId,
        `\u041C\u0430\u0441\u0441\u043E\u0432\u043E\u0435 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043E\u0446\u0435\u043D\u043E\u043A`,
        { count, scheduleEventId: body.scheduleEventId }
      );
      return {
        success: true,
        message: `\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E ${count} \u043E\u0446\u0435\u043D\u043E\u043A`,
        count
      };
    }
    if (!body.studentId || !body.scheduleEventId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C studentId \u0438 scheduleEventId"
      });
    }
    if (body.grade === void 0 || body.grade < 0 || body.grade > 100) {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0446\u0435\u043D\u043A\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043E\u0442 0 \u0434\u043E 100"
      });
    }
    const existingGrade = await getExistingGrade(body.studentId, body.scheduleEventId);
    const isModifyingAutoGrade = existingGrade?.isFromTest && !existingGrade?.isModified;
    const wasAlreadyModified = existingGrade?.isFromTest && existingGrade?.isModified;
    if (isModifyingAutoGrade && !body.confirmModify) {
      return {
        success: false,
        requireConfirmation: true,
        message: "\u042D\u0442\u0430 \u043E\u0446\u0435\u043D\u043A\u0430 \u0431\u044B\u043B\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430 \u0438\u0437 \u0442\u0435\u0441\u0442\u0430. \u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0435\u0451 \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C?",
        originalGrade: existingGrade.grade,
        newGrade: body.grade
      };
    }
    const grade = await upsertGrade({
      studentId: body.studentId,
      scheduleEventId: body.scheduleEventId,
      grade: body.grade,
      notes: body.notes,
      gradedBy: userId
    });
    await logActivity(
      event,
      "UPDATE",
      "GRADE",
      grade.id,
      isModifyingAutoGrade ? `\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430: ${existingGrade?.grade} \u2192 ${grade.grade}` : `\u041E\u0446\u0435\u043D\u043A\u0430: ${grade.grade}`,
      {
        studentId: body.studentId,
        scheduleEventId: body.scheduleEventId,
        grade: body.grade,
        wasAutoGrade: isModifyingAutoGrade,
        originalGrade: isModifyingAutoGrade ? existingGrade?.grade : void 0
      }
    );
    return {
      success: true,
      grade,
      wasModified: isModifyingAutoGrade || wasAlreadyModified,
      originalGrade: existingGrade?.originalGrade || (isModifyingAutoGrade ? existingGrade?.grade : null)
    };
  } catch (error) {
    console.error("Error saving grade:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043E\u0446\u0435\u043D\u043A\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post6.mjs.map
