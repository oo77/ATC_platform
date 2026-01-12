import { d as defineEventHandler, a as getRouterParam, e as executeQuery } from '../../../../../nitro/nitro.mjs';
import { a as getTestSessionById, d as calculateSessionResults, f as finishSession } from '../../../../../_/testSessionRepository.mjs';
import { g as getTestAssignmentById } from '../../../../../_/testAssignmentRepository.mjs';
import { v4 } from 'uuid';
import 'grammy';
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

const finish_post = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0441\u0441\u0438\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const session = await getTestSessionById(id);
    if (!session) {
      return {
        success: false,
        message: "\u0421\u0435\u0441\u0441\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    if (session.status !== "in_progress") {
      if (session.status === "completed") {
        return {
          success: true,
          message: "\u0422\u0435\u0441\u0442 \u0443\u0436\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D",
          results: {
            total_points: session.total_points,
            max_points: session.max_points,
            score_percent: session.score_percent,
            passed: session.passed,
            grade: session.grade
          }
        };
      }
      return {
        success: false,
        message: "\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0442\u0435\u0441\u0442 \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C \u0441\u0442\u0430\u0442\u0443\u0441\u0435"
      };
    }
    const results = await calculateSessionResults(id);
    await finishSession(id, {
      total_points: results.total_points,
      max_points: results.max_points,
      score_percent: results.score_percent,
      passed: results.passed,
      grade: results.grade,
      time_spent_seconds: results.time_spent_seconds
    });
    if (!session.is_preview && session.assignment_id) {
      try {
        const assignment = await getTestAssignmentById(session.assignment_id);
        if (assignment) {
          const gradeId = v4();
          const now = /* @__PURE__ */ new Date();
          await executeQuery(
            `INSERT INTO grades (id, student_id, schedule_event_id, grade, is_from_test, test_session_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, TRUE, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             grade = IF(is_modified = FALSE, VALUES(grade), grade),
             is_from_test = TRUE,
             test_session_id = IF(test_session_id IS NULL, VALUES(test_session_id), test_session_id),
             updated_at = VALUES(updated_at)`,
            [
              gradeId,
              session.student_id,
              assignment.schedule_event_id,
              results.grade,
              id,
              // test_session_id
              now,
              now
            ]
          );
        }
      } catch (gradeError) {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u043E\u0446\u0435\u043D\u043A\u0438 \u0432 \u0436\u0443\u0440\u043D\u0430\u043B:", gradeError);
      }
    }
    return {
      success: true,
      message: results.passed ? "\u0422\u0435\u0441\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u0434\u0430\u043D!" : "\u0422\u0435\u0441\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D",
      results: {
        total_points: results.total_points,
        max_points: results.max_points,
        score_percent: results.score_percent,
        passed: results.passed,
        grade: results.grade,
        answers_count: results.answers_count,
        correct_count: results.correct_count,
        time_spent_seconds: results.time_spent_seconds
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0438 \u0442\u0435\u0441\u0442\u0430"
    };
  }
});

export { finish_post as default };
//# sourceMappingURL=finish.post.mjs.map
