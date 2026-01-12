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

const details_get = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const sessionRows = await executeQuery(`
            SELECT 
                ts.id,
                ts.assignment_id,
                ts.student_id,
                s.full_name as student_name,
                s.pinfl as student_pinfl,
                ts.attempt_number,
                ts.status,
                ts.is_preview,
                ts.started_at,
                ts.completed_at,
                ts.time_spent_seconds,
                ts.total_points,
                ts.max_points,
                ts.score_percent,
                ts.passed,
                ts.grade,
                ts.violations,
                tt.id as template_id,
                tt.name as template_name,
                tt.code as template_code,
                tt.passing_score,
                tt.time_limit_minutes,
                sg.code as group_name,
                DATE(se.start_time) as event_date
            FROM test_sessions ts
            LEFT JOIN students s ON ts.student_id = s.id
            LEFT JOIN test_assignments ta ON ts.assignment_id = ta.id
            LEFT JOIN test_templates tt ON ta.test_template_id = tt.id
            LEFT JOIN study_groups sg ON ta.group_id = sg.id
            LEFT JOIN schedule_events se ON ta.schedule_event_id = se.id
            WHERE ts.id = ?
            LIMIT 1
        `, [id]);
    if (sessionRows.length === 0) {
      return {
        success: false,
        message: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const sessionRow = sessionRows[0];
    const answerRows = await executeQuery(`
            SELECT 
                ta.id as answer_id,
                ta.question_id,
                q.question_text,
                q.question_type,
                q.options as question_options,
                q.question_media,
                q.explanation as question_explanation,
                q.points as question_points,
                ta.answer_data,
                ta.is_correct,
                ta.points_earned,
                ta.answered_at,
                ta.time_spent_seconds
            FROM test_answers ta
            JOIN questions q ON ta.question_id = q.id
            WHERE ta.session_id = ?
            ORDER BY ta.answered_at ASC
        `, [id]);
    const parseJson = (jsonStr, defaultVal) => {
      if (!jsonStr) return defaultVal;
      try {
        return JSON.parse(jsonStr);
      } catch {
        return defaultVal;
      }
    };
    const answers = answerRows.map((row) => ({
      questionId: row.question_id,
      questionText: row.question_text,
      questionType: row.question_type,
      questionOptions: parseJson(row.question_options, null),
      questionMedia: parseJson(row.question_media, null),
      questionExplanation: row.question_explanation,
      questionPoints: row.question_points,
      studentAnswer: parseJson(row.answer_data, null),
      isCorrect: row.is_correct,
      pointsEarned: row.points_earned,
      answeredAt: row.answered_at,
      timeSpentSeconds: row.time_spent_seconds
    }));
    const session = {
      id: sessionRow.id,
      assignmentId: sessionRow.assignment_id,
      studentId: sessionRow.student_id,
      studentName: sessionRow.student_name,
      studentPinfl: sessionRow.student_pinfl,
      attemptNumber: sessionRow.attempt_number,
      status: sessionRow.status,
      isPreview: sessionRow.is_preview,
      startedAt: sessionRow.started_at,
      completedAt: sessionRow.completed_at,
      timeSpentSeconds: sessionRow.time_spent_seconds,
      totalPoints: sessionRow.total_points,
      maxPoints: sessionRow.max_points,
      scorePercent: sessionRow.score_percent,
      passed: sessionRow.passed,
      grade: sessionRow.grade,
      violations: parseJson(sessionRow.violations, [])
    };
    const template = {
      id: sessionRow.template_id,
      name: sessionRow.template_name,
      code: sessionRow.template_code,
      passingScore: sessionRow.passing_score,
      timeLimitMinutes: sessionRow.time_limit_minutes
    };
    const context = {
      groupName: sessionRow.group_name,
      eventDate: sessionRow.event_date
    };
    const stats = {
      totalQuestions: answers.length,
      answeredQuestions: answers.filter((a) => a.studentAnswer !== null).length,
      correctAnswers: answers.filter((a) => a.isCorrect === true).length,
      incorrectAnswers: answers.filter((a) => a.isCorrect === false).length,
      unanswered: answers.filter((a) => a.studentAnswer === null).length,
      totalPoints: session.maxPoints || 0,
      earnedPoints: session.totalPoints || 0
    };
    return {
      success: true,
      session,
      template,
      context,
      answers,
      stats
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0435\u0442\u0430\u043B\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438"
    };
  }
});

export { details_get as default };
//# sourceMappingURL=details.get.mjs.map
