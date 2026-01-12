import { d as defineEventHandler, r as readBody } from '../../../nitro/nitro.mjs';
import { t as testAssignmentExistsForEventAndTemplate, c as createTestAssignment } from '../../../_/testAssignmentRepository.mjs';
import { g as getTestTemplateById } from '../../../_/testTemplateRepository.mjs';
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
import '../../../_/questionRepository.mjs';

const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("[API tests/assignments] \u041F\u043E\u043B\u0443\u0447\u0435\u043D \u0437\u0430\u043F\u0440\u043E\u0441:", JSON.stringify(body, null, 2));
    if (!body.schedule_event_id) {
      console.log("[API tests/assignments] \u041E\u0448\u0438\u0431\u043A\u0430: ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
      return {
        success: false,
        message: "ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.test_template_id) {
      console.log("[API tests/assignments] \u041E\u0448\u0438\u0431\u043A\u0430: ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
      return {
        success: false,
        message: "ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    if (!body.group_id) {
      console.log("[API tests/assignments] \u041E\u0448\u0438\u0431\u043A\u0430: ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      };
    }
    console.log("[API tests/assignments] \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F...");
    const exists = await testAssignmentExistsForEventAndTemplate(body.schedule_event_id, body.test_template_id);
    if (exists) {
      console.log("[API tests/assignments] \u041E\u0448\u0438\u0431\u043A\u0430: \u0422\u0435\u0441\u0442 \u0443\u0436\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043D\u0430 \u044D\u0442\u043E \u0437\u0430\u043D\u044F\u0442\u0438\u0435");
      return {
        success: false,
        message: "\u042D\u0442\u043E\u0442 \u0442\u0435\u0441\u0442 \u0443\u0436\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043D\u0430 \u0434\u0430\u043D\u043D\u043E\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0435"
      };
    }
    console.log("[API tests/assignments] \u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0442\u0435\u0441\u0442\u0430:", body.test_template_id);
    const template = await getTestTemplateById(body.test_template_id);
    if (!template) {
      console.log("[API tests/assignments] \u041E\u0448\u0438\u0431\u043A\u0430: \u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
      return {
        success: false,
        message: "\u0428\u0430\u0431\u043B\u043E\u043D \u0442\u0435\u0441\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    console.log("[API tests/assignments] \u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0430\u0439\u0434\u0435\u043D:", template.name);
    const userId = event.context.user?.id;
    console.log("[API tests/assignments] User ID:", userId);
    console.log("[API tests/assignments] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F...");
    const assignment = await createTestAssignment({
      schedule_event_id: body.schedule_event_id,
      test_template_id: body.test_template_id,
      group_id: body.group_id,
      time_limit_override: body.time_limit_override,
      passing_score_override: body.passing_score_override,
      start_date: body.start_date,
      end_date: body.end_date
    }, userId);
    console.log("[API tests/assignments] \u041D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E:", assignment.id);
    return {
      success: true,
      message: "\u0422\u0435\u0441\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D \u043D\u0430 \u0437\u0430\u043D\u044F\u0442\u0438\u0435",
      assignment
    };
  } catch (error) {
    console.error("[API tests/assignments] \u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430:", error);
    console.error("[API tests/assignments] Stack:", error.stack);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0438 \u0442\u0435\u0441\u0442\u0430",
      error: error.message || String(error)
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
