/**
 * Список аттестаций текущего инструктора (для раздела "Аттестация" на его странице)
 * GET /api/attestation/my
 */

import { executeQuery } from "../../utils/db";
import { getInstructorByUserId } from "../../repositories/instructorRepository";
import type { RowDataPacket } from "mysql2/promise";

export default defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      return { success: false, message: "Не авторизован", items: [] };
    }

    const instructor = await getInstructorByUserId(userId);
    if (!instructor) {
      return { success: false, message: "Инструктор не найден", items: [] };
    }

    const rows = await executeQuery<RowDataPacket[]>(
      `SELECT
          ag.id as group_id,
          ag.code as group_code,
          ag.name as group_name,
          ag.exam_start,
          ag.exam_end,
          ag.location,
          ag.status as group_status,
          tt.id as template_id,
          tt.name as template_name,
          tt.time_limit_minutes,
          tt.passing_score,
          tt.max_attempts,
          (SELECT COUNT(*) FROM attestation_test_sessions ts WHERE ts.group_id = ag.id AND ts.instructor_id = ?) as attempts_used,
          (SELECT MAX(ts.score_percent) FROM attestation_test_sessions ts WHERE ts.group_id = ag.id AND ts.instructor_id = ? AND ts.status = 'completed') as best_score,
          (SELECT ts.id FROM attestation_test_sessions ts WHERE ts.group_id = ag.id AND ts.instructor_id = ? AND ts.status = 'in_progress' LIMIT 1) as active_session_id,
          ar.decision,
          ar.evaluation_sheet_file_id
       FROM attestation_group_instructors agi
       JOIN attestation_groups ag ON agi.group_id = ag.id
       LEFT JOIN test_templates tt ON ag.test_template_id = tt.id
       LEFT JOIN attestation_results ar ON ar.group_id = ag.id AND ar.instructor_id = agi.instructor_id
       WHERE agi.instructor_id = ?
       ORDER BY ag.exam_start DESC`,
      [instructor.id, instructor.id, instructor.id, instructor.id]
    );

    const now = new Date();
    const items = rows.map((row) => {
      const examStart = row.exam_start ? new Date(row.exam_start) : null;
      const examEnd = row.exam_end ? new Date(row.exam_end) : null;
      const available =
        !!examStart && !!examEnd && examStart <= now && examEnd >= now && row.group_status !== "cancelled";

      return {
        groupId: row.group_id,
        groupCode: row.group_code,
        groupName: row.group_name,
        examStart: row.exam_start,
        examEnd: row.exam_end,
        location: row.location,
        groupStatus: row.group_status,
        templateId: row.template_id,
        templateName: row.template_name,
        timeLimitMinutes: row.time_limit_minutes,
        passingScore: row.passing_score,
        maxAttempts: row.max_attempts,
        attemptsUsed: row.attempts_used || 0,
        bestScore: row.best_score !== null ? parseFloat(row.best_score) : null,
        activeSessionId: row.active_session_id || null,
        decision: row.decision || "pending",
        hasEvaluationSheet: !!row.evaluation_sheet_file_id,
        available,
      };
    });

    return { success: true, items };
  } catch (error) {
    console.error("Ошибка получения аттестаций инструктора:", error);
    return { success: false, message: "Ошибка при получении аттестаций", items: [] };
  }
});
