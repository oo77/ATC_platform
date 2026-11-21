/**
 * Начало теста слушателем (создание сессии).
 *
 * Общая логика для POST /api/tests/sessions/start (слушатель сам нажал
 * «Начать») и для входа с компьютера класса тестирования.
 */

import {
  createTestSession,
  getActiveSessionForStudent,
  getStudentAttemptCount,
} from "../repositories/testSessionRepository";
import { getTestAssignmentById } from "../repositories/testAssignmentRepository";
import {
  getTestTemplateById,
  getAvailableLanguagesForTemplate,
  getTemplateQuestions,
} from "../repositories/testTemplateRepository";
import {
  getQuestionsByBankId,
  getRandomQuestionsFromBank,
  getQuestionsByIds,
} from "../repositories/questionRepository";
import type { SessionQuestionOrder, QuestionLanguage } from "../types/testing";
import { executeQuery } from "../utils/db";

export interface StartTestInput {
  assignmentId: string;
  studentId: string;
  language: QuestionLanguage;
  ipAddress: string;
  userAgent: string;
}

export type StartTestResult =
  | {
      success: true;
      message: string;
      session: any;
      resumed?: boolean;
      template?: Record<string, unknown>;
      questions_count?: number;
    }
  | {
      success: false;
      message: string;
      /** Слушатель не из группы назначения (HTTP 403) */
      forbidden?: boolean;
      available_languages?: string[];
    };

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export async function startTestSessionForStudent(input: StartTestInput): Promise<StartTestResult> {
  const assignment = await getTestAssignmentById(input.assignmentId);
  if (!assignment) {
    return { success: false, message: "Назначение не найдено" };
  }

  // Слушатель может проходить только тесты, назначенные его группе
  const membership = await executeQuery<any[]>(
    "SELECT 1 FROM study_group_students WHERE group_id = ? AND student_id = ? LIMIT 1",
    [assignment.group_id, input.studentId],
  );
  if (membership.length === 0) {
    return { success: false, forbidden: true, message: "Этот тест назначен другой группе" };
  }

  if (assignment.status === "cancelled" || assignment.status === "completed") {
    return { success: false, message: "Тест недоступен" };
  }

  const now = new Date();
  if (assignment.start_date && new Date(assignment.start_date) > now) {
    return { success: false, message: "Тест ещё не открыт" };
  }
  if (assignment.end_date && new Date(assignment.end_date) < now) {
    return { success: false, message: "Срок сдачи теста истёк" };
  }

  const template = await getTestTemplateById(assignment.test_template_id);
  if (!template) {
    return { success: false, message: "Шаблон теста не найден" };
  }

  // Незавершённая сессия — продолжаем её
  const activeSession = await getActiveSessionForStudent(input.assignmentId, input.studentId);
  if (activeSession) {
    return { success: true, message: "Продолжение теста", session: activeSession, resumed: true };
  }

  const attemptCount = await getStudentAttemptCount(input.assignmentId, input.studentId);
  if (attemptCount >= template.max_attempts) {
    return { success: false, message: `Использованы все попытки (${template.max_attempts})` };
  }

  const availableLanguages = await getAvailableLanguagesForTemplate(template.id);
  if (!availableLanguages.includes(input.language)) {
    return {
      success: false,
      message: `Язык "${input.language}" недоступен для этого теста`,
      available_languages: availableLanguages,
    };
  }

  // Вопросы в зависимости от режима и выбранного языка
  let questions;
  switch (template.questions_mode) {
    case "random":
      questions = await getRandomQuestionsFromBank(template.bank_id, template.questions_count || 10, {
        activeOnly: true,
        language: input.language,
      });
      break;
    case "manual": {
      const templateQuestions = await getTemplateQuestions(template.id);
      const manualQuestions = await getQuestionsByIds(templateQuestions.map((tq) => tq.question_id));
      questions = manualQuestions.filter((q) => q.language === input.language);
      break;
    }
    case "all":
    default: {
      const allQuestions = await getQuestionsByBankId(template.bank_id, true);
      questions = allQuestions.filter((q) => q.language === input.language);
    }
  }

  if (!questions.length) {
    return { success: false, message: "В тесте нет вопросов" };
  }

  let orderedQuestions = [...questions];
  if (template.shuffle_questions) {
    orderedQuestions = shuffleArray(orderedQuestions);
  }

  // questions_order с перемешанными вариантами
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

  const session = await createTestSession(
    {
      assignment_id: input.assignmentId,
      student_id: input.studentId,
      language: input.language,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    },
    questionsOrder,
  );

  return {
    success: true,
    message: "Тест начат",
    session,
    template: {
      time_limit_minutes: assignment.time_limit_override || template.time_limit_minutes,
      passing_score: assignment.passing_score_override || template.passing_score,
      questions_per_page: template.questions_per_page,
      allow_back: template.allow_back,
      proctoring_enabled: template.proctoring_enabled,
      proctoring_settings: template.proctoring_settings,
      show_results: template.show_results,
    },
    questions_count: questionsOrder.length,
  };
}
