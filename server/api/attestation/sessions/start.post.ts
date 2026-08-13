/**
 * Начать (или продолжить) прохождение аттестационного теста
 * POST /api/attestation/sessions/start
 */

import {
  createSession,
  getActiveSessionForInstructor,
  getInstructorAttemptCount,
} from "../../../repositories/attestationSessionRepository";
import {
  getAttestationGroupById,
  isInstructorInGroup,
} from "../../../repositories/attestationGroupRepository";
import { getTestTemplateById, getTemplateQuestions } from "../../../repositories/testTemplateRepository";
import {
  getQuestionsByBankId,
  getRandomQuestionsFromBank,
  getQuestionsByIds,
} from "../../../repositories/questionRepository";
import { getInstructorByUserId } from "../../../repositories/instructorRepository";
import type { SessionQuestionOrder } from "../../../types/testing";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ group_id: string }>(event);
    if (!body.group_id) {
      return { success: false, message: "ID группы обязателен" };
    }

    const userId = event.context.user?.id;
    if (!userId) return { success: false, message: "Не авторизован" };

    const instructor = await getInstructorByUserId(userId);
    if (!instructor) return { success: false, message: "Инструктор не найден" };

    const inGroup = await isInstructorInGroup(body.group_id, instructor.id);
    if (!inGroup) return { success: false, message: "Вы не включены в эту группу аттестации" };

    const group = await getAttestationGroupById(body.group_id);
    if (!group || !group.testTemplateId) {
      return { success: false, message: "Тест для группы ещё не назначен" };
    }

    const now = new Date();
    if (group.examStart && new Date(group.examStart) > now) {
      return { success: false, message: "Экзамен ещё не начался" };
    }
    if (group.examEnd && new Date(group.examEnd) < now) {
      return { success: false, message: "Срок прохождения экзамена истёк" };
    }

    const template = await getTestTemplateById(group.testTemplateId);
    if (!template) return { success: false, message: "Шаблон теста не найден" };

    const activeSession = await getActiveSessionForInstructor(body.group_id, instructor.id);
    if (activeSession) {
      return { success: true, message: "Продолжение теста", session: activeSession, resumed: true };
    }

    const attemptCount = await getInstructorAttemptCount(body.group_id, instructor.id);
    if (attemptCount >= template.max_attempts) {
      return { success: false, message: `Использованы все попытки (${template.max_attempts})` };
    }

    let questions;
    switch (template.questions_mode) {
      case "random":
        questions = await getRandomQuestionsFromBank(template.bank_id, template.questions_count || 10, {
          activeOnly: true,
        });
        break;
      case "manual": {
        const templateQuestions = await getTemplateQuestions(template.id);
        questions = await getQuestionsByIds(templateQuestions.map((tq) => tq.question_id));
        break;
      }
      case "all":
      default:
        questions = await getQuestionsByBankId(template.bank_id, true);
    }

    if (!questions.length) {
      return { success: false, message: "В тесте нет вопросов" };
    }

    let orderedQuestions = [...questions];
    if (template.shuffle_questions) {
      orderedQuestions = shuffleArray(orderedQuestions);
    }

    const questionsOrder: SessionQuestionOrder[] = orderedQuestions.map((q) => {
      const result: SessionQuestionOrder = { questionId: q.id };
      if (template.shuffle_options && q.options) {
        const options = (q.options as any).options;
        if (Array.isArray(options)) {
          result.shuffledOptions = shuffleArray(options.map((o: any) => o.id));
        }
      }
      return result;
    });

    const headers = getHeaders(event);
    const ipAddress = (headers["x-forwarded-for"] || headers["x-real-ip"] || "").toString().split(",")[0].trim();
    const userAgent = headers["user-agent"] || "";

    const session = await createSession(
      { groupId: body.group_id, instructorId: instructor.id, ipAddress, userAgent },
      questionsOrder
    );

    return {
      success: true,
      message: "Тест начат",
      session,
      template: {
        time_limit_minutes: template.time_limit_minutes,
        passing_score: template.passing_score,
        questions_per_page: template.questions_per_page,
        allow_back: template.allow_back,
      },
      questions_count: questionsOrder.length,
    };
  } catch (error) {
    console.error("Ошибка начала аттестационного теста:", error);
    return { success: false, message: "Ошибка при начале теста" };
  }
});
