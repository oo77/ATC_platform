import { g as defineEventHandler, r as readBody, h as createError } from '../../../_/nitro.mjs';
import { a as upsertFinalGrade } from '../../../_/attendanceRepository.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const bulk_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const userId = event.context.auth?.userId;
    console.log(
      `[Bulk Final Grades] User ${userId} \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043C\u0430\u0441\u0441\u043E\u0432\u044B\u0435 \u0438\u0442\u043E\u0433\u043E\u0432\u044B\u0435 \u043E\u0446\u0435\u043D\u043A\u0438`
    );
    if (!body.groupId || !body.disciplineId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C groupId \u0438 disciplineId"
      });
    }
    if (!body.grades || !Array.isArray(body.grades) || body.grades.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432 grades"
      });
    }
    const passThreshold = body.passThreshold ?? 60;
    const results = [];
    for (const gradeData of body.grades) {
      try {
        if (gradeData.finalGrade !== void 0 && (gradeData.finalGrade < 0 || gradeData.finalGrade > 100)) {
          results.push({
            studentId: gradeData.studentId,
            success: false,
            error: "\u041E\u0446\u0435\u043D\u043A\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0431\u044B\u0442\u044C \u043E\u0442 0 \u0434\u043E 100"
          });
          continue;
        }
        let status = gradeData.status;
        if (!status && gradeData.finalGrade !== void 0) {
          status = gradeData.finalGrade >= passThreshold ? "passed" : "failed";
        }
        const finalGrade = await upsertFinalGrade({
          studentId: gradeData.studentId,
          groupId: body.groupId,
          disciplineId: body.disciplineId,
          finalGrade: gradeData.finalGrade,
          status,
          notes: gradeData.notes,
          gradedBy: userId
        });
        results.push({
          studentId: gradeData.studentId,
          success: true,
          finalGrade: finalGrade.finalGrade ?? void 0,
          status: finalGrade.status
        });
      } catch (err) {
        console.error(
          `[Bulk Final Grades] \u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 ${gradeData.studentId}:`,
          err
        );
        results.push({
          studentId: gradeData.studentId,
          success: false,
          error: err.message || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"
        });
      }
    }
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    await logActivity(
      event,
      "UPDATE",
      "GRADE",
      body.groupId,
      `\u041C\u0430\u0441\u0441\u043E\u0432\u044B\u0435 \u0438\u0442\u043E\u0433\u043E\u0432\u044B\u0435 \u043E\u0446\u0435\u043D\u043A\u0438: ${successCount} \u0443\u0441\u043F\u0435\u0448\u043D\u043E, ${failCount} \u043E\u0448\u0438\u0431\u043E\u043A`,
      {
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        successCount,
        failCount,
        passThreshold
      }
    );
    console.log(
      `[Bulk Final Grades] \u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E: ${successCount} \u0443\u0441\u043F\u0435\u0448\u043D\u043E, ${failCount} \u043E\u0448\u0438\u0431\u043E\u043A`
    );
    return {
      success: true,
      message: `\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E ${successCount} \u0438\u0442\u043E\u0433\u043E\u0432\u044B\u0445 \u043E\u0446\u0435\u043D\u043E\u043A${failCount > 0 ? `, ${failCount} \u043E\u0448\u0438\u0431\u043E\u043A` : ""}`,
      results,
      successCount,
      failCount
    };
  } catch (error) {
    console.error("[Bulk Final Grades] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u043C \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0438\u0442\u043E\u0433\u043E\u0432\u044B\u0445 \u043E\u0446\u0435\u043D\u043E\u043A"
    });
  }
});

export { bulk_post as default };
//# sourceMappingURL=bulk.post.mjs.map
