/**
 * POST /api/final-grades/bulk
 * Массовое выставление итоговых оценок для группы и дисциплины
 */

import { upsertFinalGrade } from "../../repositories/attendanceRepository";
import { logActivity } from "../../utils/activityLogger";

interface BulkFinalGradeInput {
  groupId: string;
  disciplineId: string;
  /** Массив оценок */
  grades: Array<{
    studentId: string;
    finalGrade?: number;
    status?: "in_progress" | "passed" | "failed" | "not_allowed";
    notes?: string;
  }>;
  /** Режим выставления: manual - только указанные, auto - автоматически по порогу */
  mode?: "manual" | "auto";
  /** Порог для автоматического выставления статуса (по умолчанию 60) */
  passThreshold?: number;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BulkFinalGradeInput>(event);
    const userId = event.context.auth?.userId;

    console.log(
      `[Bulk Final Grades] User ${userId} выставляет массовые итоговые оценки`,
    );

    // Валидация
    if (!body.groupId || !body.disciplineId) {
      throw createError({
        statusCode: 400,
        message: "Необходимо указать groupId и disciplineId",
      });
    }

    if (
      !body.grades ||
      !Array.isArray(body.grades) ||
      body.grades.length === 0
    ) {
      throw createError({
        statusCode: 400,
        message: "Необходимо указать массив grades",
      });
    }

    const passThreshold = body.passThreshold ?? 60;
    const results: Array<{
      studentId: string;
      success: boolean;
      finalGrade?: number;
      status?: string;
      error?: string;
    }> = [];

    for (const gradeData of body.grades) {
      try {
        // Валидация оценки
        if (
          gradeData.finalGrade !== undefined &&
          (gradeData.finalGrade < 0 || gradeData.finalGrade > 100)
        ) {
          results.push({
            studentId: gradeData.studentId,
            success: false,
            error: "Оценка должна быть от 0 до 100",
          });
          continue;
        }

        // Определяем статус автоматически, если не задан
        let status = gradeData.status;
        if (!status && gradeData.finalGrade !== undefined) {
          status = gradeData.finalGrade >= passThreshold ? "passed" : "failed";
        }

        const finalGrade = await upsertFinalGrade({
          studentId: gradeData.studentId,
          groupId: body.groupId,
          disciplineId: body.disciplineId,
          finalGrade: gradeData.finalGrade,
          status: status,
          notes: gradeData.notes,
          gradedBy: userId,
        });

        results.push({
          studentId: gradeData.studentId,
          success: true,
          finalGrade: finalGrade.finalGrade ?? undefined,
          status: finalGrade.status,
        });
      } catch (err: any) {
        console.error(
          `[Bulk Final Grades] Ошибка для студента ${gradeData.studentId}:`,
          err,
        );
        results.push({
          studentId: gradeData.studentId,
          success: false,
          error: err.message || "Неизвестная ошибка",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Логирование
    await logActivity(
      event,
      "UPDATE",
      "GRADE",
      body.groupId,
      `Массовые итоговые оценки: ${successCount} успешно, ${failCount} ошибок`,
      {
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        successCount,
        failCount,
        passThreshold,
      },
    );

    console.log(
      `[Bulk Final Grades] Завершено: ${successCount} успешно, ${failCount} ошибок`,
    );

    return {
      success: true,
      message: `Выставлено ${successCount} итоговых оценок${failCount > 0 ? `, ${failCount} ошибок` : ""}`,
      results,
      successCount,
      failCount,
    };
  } catch (error: any) {
    console.error("[Bulk Final Grades] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message:
        error.message || "Ошибка при массовом выставлении итоговых оценок",
    });
  }
});
