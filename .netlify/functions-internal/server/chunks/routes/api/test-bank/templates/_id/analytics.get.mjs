import { d as defineEventHandler, a as getRouterParam, e as executeQuery } from '../../../../../nitro/nitro.mjs';
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

const analytics_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const templateCheck = await executeQuery(
      "SELECT id, name FROM test_templates WHERE id = ?",
      [id]
    );
    if (templateCheck.length === 0) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const summaryRows = await executeQuery(`
            SELECT 
                COUNT(*) as total_sessions,
                COUNT(DISTINCT ts.student_id) as unique_students,
                ROUND(AVG(ts.score_percent), 1) as avg_score,
                ROUND(SUM(CASE WHEN ts.passed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as pass_rate,
                ROUND(AVG(ts.time_spent_seconds)) as avg_time_seconds,
                MAX(ts.score_percent) as best_score,
                MIN(ts.score_percent) as worst_score,
                COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as total_completed
            FROM test_sessions ts
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
        `, [id]);
    const summary = summaryRows[0] ? {
      totalSessions: summaryRows[0].total_sessions || 0,
      uniqueStudents: summaryRows[0].unique_students || 0,
      averageScore: summaryRows[0].avg_score || 0,
      passRate: summaryRows[0].pass_rate || 0,
      averageTimeSeconds: summaryRows[0].avg_time_seconds || 0,
      bestScore: summaryRows[0].best_score || 0,
      worstScore: summaryRows[0].worst_score || 0
    } : {
      totalSessions: 0,
      uniqueStudents: 0,
      averageScore: 0,
      passRate: 0,
      averageTimeSeconds: 0,
      bestScore: 0,
      worstScore: 0
    };
    const sessionRows = await executeQuery(`
            SELECT 
                ts.id as session_id,
                ts.student_id,
                s.full_name as student_name,
                s.pinfl as student_pinfl,
                sg.code as group_code,
                sg.code as group_name,
                ts.score_percent,
                ts.total_points,
                ts.max_points,
                ts.passed,
                ts.grade,
                ts.time_spent_seconds,
                ts.completed_at,
                ts.attempt_number
            FROM test_sessions ts
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            LEFT JOIN students s ON ts.student_id = s.id
            LEFT JOIN study_groups sg ON ta.group_id = sg.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
            ORDER BY ts.completed_at DESC
            LIMIT 100
        `, [id]);
    const sessions = sessionRows.map((row) => ({
      sessionId: row.session_id,
      studentId: row.student_id,
      studentName: row.student_name || "\u041D/\u0414",
      studentPinfl: row.student_pinfl || "",
      groupCode: row.group_code || "",
      groupName: row.group_name || "",
      score: Math.round(row.score_percent || 0),
      totalPoints: row.total_points || 0,
      maxPoints: row.max_points || 0,
      passed: row.passed,
      grade: row.grade,
      timeSpentSeconds: row.time_spent_seconds || 0,
      completedAt: row.completed_at,
      attemptNumber: row.attempt_number
    }));
    const questionStatsRows = await executeQuery(`
            SELECT 
                q.id as question_id,
                q.question_text,
                q.question_type,
                COUNT(an.id) as total_answers,
                SUM(CASE WHEN an.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
                ROUND(AVG(an.time_spent_seconds)) as avg_time_seconds
            FROM test_answers an
            JOIN questions q ON an.question_id = q.id
            JOIN test_sessions ts ON an.session_id = ts.id
            JOIN test_assignments ta ON ts.assignment_id = ta.id
            WHERE ta.test_template_id = ?
              AND ts.status = 'completed'
              AND ts.is_preview = false
            GROUP BY q.id, q.question_text, q.question_type
            ORDER BY (SUM(CASE WHEN an.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(an.id), 0)) ASC
        `, [id]);
    const questionStats = questionStatsRows.map((row) => ({
      questionId: row.question_id,
      questionText: row.question_text.length > 100 ? row.question_text.substring(0, 100) + "..." : row.question_text,
      questionType: row.question_type,
      totalAnswers: row.total_answers,
      correctCount: row.correct_count,
      correctRate: row.total_answers > 0 ? Math.round(row.correct_count / row.total_answers * 100) : 0,
      averageTimeSeconds: row.avg_time_seconds || 0
    }));
    const gradeDistribution = {
      excellent: sessions.filter((s) => s.score >= 90).length,
      good: sessions.filter((s) => s.score >= 70 && s.score < 90).length,
      satisfactory: sessions.filter((s) => s.score >= 50 && s.score < 70).length,
      unsatisfactory: sessions.filter((s) => s.score < 50).length
    };
    return {
      success: true,
      templateId: id,
      templateName: templateCheck[0]?.name,
      summary,
      sessions,
      questionStats,
      gradeDistribution
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438"
    };
  }
});

export { analytics_get as default };
//# sourceMappingURL=analytics.get.mjs.map
