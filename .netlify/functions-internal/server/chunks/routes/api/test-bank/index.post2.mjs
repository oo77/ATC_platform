import { d as defineEventHandler, r as readBody } from '../../../nitro/nitro.mjs';
import { h as getNextOrderIndex, i as createQuestion } from '../../../_/questionRepository.mjs';
import { g as getQuestionBankById } from '../../../_/questionBankRepository.mjs';
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

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    if (!body.bank_id) {
      return {
        success: false,
        message: "ID \u0431\u0430\u043D\u043A\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.question_text?.trim()) {
      return {
        success: false,
        message: "\u0422\u0435\u043A\u0441\u0442 \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.options) {
      return {
        success: false,
        message: "\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B"
      };
    }
    const bank = await getQuestionBankById(body.bank_id);
    if (!bank) {
      return {
        success: false,
        message: "\u0411\u0430\u043D\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (body.question_type === "single" && body.options) {
      const options = body.options.options || [];
      const hasCorrect = options.some((o) => o.correct === true);
      if (!hasCorrect) {
        return {
          success: false,
          message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043E\u0442\u0432\u0435\u0442"
        };
      }
    }
    if (body.order_index === void 0) {
      body.order_index = await getNextOrderIndex(body.bank_id);
    }
    const question = await createQuestion({
      bank_id: body.bank_id,
      question_type: body.question_type || "single",
      question_text: body.question_text.trim(),
      question_media: body.question_media,
      options: body.options,
      points: body.points || 1,
      explanation: body.explanation?.trim(),
      difficulty: body.difficulty || "medium",
      language: body.language,
      tags: body.tags,
      order_index: body.order_index,
      is_active: body.is_active !== false
    });
    return {
      success: true,
      message: "\u0412\u043E\u043F\u0440\u043E\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D",
      question
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u0430"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
