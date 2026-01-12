import { d as defineEventHandler, r as readBody, V as getHeaders } from '../../../../nitro/nitro.mjs';
import { i as getActiveSessionForStudent, j as getStudentAttemptCount, c as createTestSession } from '../../../../_/testSessionRepository.mjs';
import { g as getTestAssignmentById } from '../../../../_/testAssignmentRepository.mjs';
import { g as getTestTemplateById, f as getAvailableLanguagesForTemplate, a as getTemplateQuestions } from '../../../../_/testTemplateRepository.mjs';
import { m as getQuestionsByBankId, l as getQuestionsByIds, o as getRandomQuestionsFromBank } from '../../../../_/questionRepository.mjs';
import { h as getStudentByUserId } from '../../../../_/studentRepository.mjs';
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

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
const start_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.assignment_id) {
      return {
        success: false,
        message: "ID \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.language) {
      return {
        success: false,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u044F\u0437\u044B\u043A \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F"
      };
    }
    const userId = event.context.user?.id;
    if (!userId) {
      return {
        success: false,
        message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D"
      };
    }
    const student = await getStudentByUserId(userId);
    if (!student) {
      return {
        success: false,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const assignment = await getTestAssignmentById(body.assignment_id);
    if (!assignment) {
      return {
        success: false,
        message: "\u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E"
      };
    }
    if (assignment.status === "cancelled" || assignment.status === "completed") {
      return {
        success: false,
        message: "\u0422\u0435\u0441\u0442 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D"
      };
    }
    const now = /* @__PURE__ */ new Date();
    if (assignment.start_date && new Date(assignment.start_date) > now) {
      return {
        success: false,
        message: "\u0422\u0435\u0441\u0442 \u0435\u0449\u0451 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442"
      };
    }
    if (assignment.end_date && new Date(assignment.end_date) < now) {
      return {
        success: false,
        message: "\u0421\u0440\u043E\u043A \u0441\u0434\u0430\u0447\u0438 \u0442\u0435\u0441\u0442\u0430 \u0438\u0441\u0442\u0451\u043A"
      };
    }
    const template = await getTestTemplateById(assignment.test_template_id);
    if (!template) {
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const activeSession = await getActiveSessionForStudent(body.assignment_id, student.id);
    if (activeSession) {
      return {
        success: true,
        message: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0435\u043D\u0438\u0435 \u0442\u0435\u0441\u0442\u0430",
        session: activeSession,
        resumed: true
      };
    }
    const attemptCount = await getStudentAttemptCount(body.assignment_id, student.id);
    if (attemptCount >= template.max_attempts) {
      return {
        success: false,
        message: `\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u044B \u0432\u0441\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 (${template.max_attempts})`
      };
    }
    const availableLanguages = await getAvailableLanguagesForTemplate(template.id);
    if (!availableLanguages.includes(body.language)) {
      return {
        success: false,
        message: `\u042F\u0437\u044B\u043A "${body.language}" \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0442\u0435\u0441\u0442\u0430`,
        available_languages: availableLanguages
      };
    }
    let questions;
    switch (template.questions_mode) {
      case "all":
        const allQuestions = await getQuestionsByBankId(template.bank_id, true);
        questions = allQuestions.filter((q) => q.language === body.language);
        break;
      case "random":
        questions = await getRandomQuestionsFromBank(
          template.bank_id,
          template.questions_count || 10,
          { activeOnly: true, language: body.language }
        );
        break;
      case "manual":
        const templateQuestions = await getTemplateQuestions(template.id);
        const questionIds = templateQuestions.map((tq) => tq.question_id);
        const manualQuestions = await getQuestionsByIds(questionIds);
        questions = manualQuestions.filter((q) => q.language === body.language);
        break;
      default:
        const defaultQuestions = await getQuestionsByBankId(template.bank_id, true);
        questions = defaultQuestions.filter((q) => q.language === body.language);
    }
    if (!questions.length) {
      return {
        success: false,
        message: "\u0412 \u0442\u0435\u0441\u0442\u0435 \u043D\u0435\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
      };
    }
    let orderedQuestions = [...questions];
    if (template.shuffle_questions) {
      orderedQuestions = shuffleArray(orderedQuestions);
    }
    const questionsOrder = orderedQuestions.map((q) => {
      const result = {
        questionId: q.id
      };
      if (template.shuffle_options && q.options) {
        const options = q.options.options;
        if (Array.isArray(options)) {
          result.shuffledOptions = shuffleArray(options.map((o) => o.id));
        }
      }
      return result;
    });
    const headers = getHeaders(event);
    const ipAddress = headers["x-forwarded-for"] || headers["x-real-ip"] || "";
    const userAgent = headers["user-agent"] || "";
    const session = await createTestSession({
      assignment_id: body.assignment_id,
      student_id: student.id,
      language: body.language,
      ip_address: ipAddress.toString().split(",")[0].trim(),
      user_agent: userAgent
    }, questionsOrder);
    return {
      success: true,
      message: "\u0422\u0435\u0441\u0442 \u043D\u0430\u0447\u0430\u0442",
      session,
      template: {
        time_limit_minutes: assignment.time_limit_override || template.time_limit_minutes,
        passing_score: assignment.passing_score_override || template.passing_score,
        questions_per_page: template.questions_per_page,
        allow_back: template.allow_back,
        proctoring_enabled: template.proctoring_enabled,
        proctoring_settings: template.proctoring_settings,
        show_results: template.show_results
      },
      questions_count: questionsOrder.length
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u0442\u0435\u0441\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0447\u0430\u043B\u0435 \u0442\u0435\u0441\u0442\u0430"
    };
  }
});

export { start_post as default };
//# sourceMappingURL=start.post.mjs.map
