import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { a as upsertFinalGrade } from '../../_/attendanceRepository.mjs';
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
    if (!body.studentId || !body.groupId || !body.disciplineId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C studentId, groupId \u0438 disciplineId"
      });
    }
    if (body.finalGrade !== void 0 && (body.finalGrade < 0 || body.finalGrade > 100)) {
      throw createError({
        statusCode: 400,
        message: "\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043E\u0442 0 \u0434\u043E 100"
      });
    }
    const validStatuses = ["in_progress", "passed", "failed", "not_allowed"];
    if (body.status && !validStatuses.includes(body.status)) {
      throw createError({
        statusCode: 400,
        message: `\u0421\u0442\u0430\u0442\u0443\u0441 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043E\u0434\u043D\u0438\u043C \u0438\u0437: ${validStatuses.join(", ")}`
      });
    }
    const finalGrade = await upsertFinalGrade({
      studentId: body.studentId,
      groupId: body.groupId,
      disciplineId: body.disciplineId,
      finalGrade: body.finalGrade,
      status: body.status,
      notes: body.notes,
      gradedBy: userId
    });
    await logActivity(
      event,
      "UPDATE",
      "GRADE",
      finalGrade.id,
      `\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430: ${finalGrade.finalGrade || "\u043D\u0435 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430"}`,
      {
        studentId: body.studentId,
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        finalGrade: body.finalGrade,
        status: body.status
      }
    );
    return {
      success: true,
      finalGrade
    };
  } catch (error) {
    console.error("Error saving final grade:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u0438\u0442\u043E\u0433\u043E\u0432\u043E\u0439 \u043E\u0446\u0435\u043D\u043A\u0438"
    });
  }
});

export { index_post as default };
//# sourceMappingURL=index.post4.mjs.map
