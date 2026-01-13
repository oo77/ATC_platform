import { d as defineEventHandler, r as readBody } from '../../../../nitro/nitro.mjs';
import { Q as QuestionType, e as bulkCreateQuestions } from '../../../../_/questionRepository.mjs';
import { g as getQuestionBankById } from '../../../../_/questionBankRepository.mjs';
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

function isNewFormat(q) {
  return "question_text" in q && "bank_id" in q;
}
const import_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.questions?.length) {
      return {
        success: false,
        message: "\u0421\u043F\u0438\u0441\u043E\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043F\u0443\u0441\u0442"
      };
    }
    const firstQuestion = body.questions[0];
    const isNew = isNewFormat(firstQuestion);
    const bankId = isNew ? firstQuestion.bank_id : body.bank_id;
    if (!bankId) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    const bank = await getQuestionBankById(bankId);
    if (!bank) {
      return {
        success: false,
        message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    let questionsToCreate;
    if (isNew) {
      questionsToCreate = body.questions.map((q, index) => ({
        bank_id: q.bank_id,
        question_type: q.question_type || "single",
        question_text: q.question_text,
        options: q.options,
        points: q.points || 1,
        difficulty: q.difficulty || "medium",
        explanation: q.explanation,
        language: q.language,
        order_index: index,
        is_active: q.is_active !== false
      }));
    } else {
      questionsToCreate = body.questions.map((q, index) => {
        const options = {
          options: [
            { id: "a", text: q.optionA, correct: q.correct.toUpperCase() === "A" },
            { id: "b", text: q.optionB, correct: q.correct.toUpperCase() === "B" }
          ]
        };
        if (q.optionC) {
          options.options.push({ id: "c", text: q.optionC, correct: q.correct.toUpperCase() === "C" });
        }
        if (q.optionD) {
          options.options.push({ id: "d", text: q.optionD, correct: q.correct.toUpperCase() === "D" });
        }
        return {
          bank_id: bankId,
          question_type: QuestionType.SINGLE,
          question_text: q.question,
          options,
          points: q.points || 1,
          difficulty: q.difficulty || "medium",
          explanation: q.explanation,
          language: q.language,
          order_index: index,
          is_active: true
        };
      });
    }
    const result = await bulkCreateQuestions(questionsToCreate);
    return {
      success: true,
      message: `\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E ${result.created} \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432`,
      imported: result.created,
      errors: result.errors
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0438\u043C\u043F\u043E\u0440\u0442\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432"
    };
  }
});

export { import_post as default };
//# sourceMappingURL=import.post.mjs.map
