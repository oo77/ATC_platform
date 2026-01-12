import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../../nitro/nitro.mjs';
import { a as getTestSessionById, e as addViolation, h as updateSessionStatus } from '../../../../../_/testSessionRepository.mjs';
import { g as getTestAssignmentById } from '../../../../../_/testAssignmentRepository.mjs';
import { g as getTestTemplateById } from '../../../../../_/testTemplateRepository.mjs';
import { T as TestSessionStatus } from '../../../../../_/questionRepository.mjs';
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

const violation_post = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    const body = await readBody(event);
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
      return {
        success: false,
        message: "\u0422\u0435\u0441\u0442 \u0443\u0436\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D"
      };
    }
    const violation = {
      type: body.type || "other",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      details: body.details
    };
    await addViolation(id, violation);
    const assignment = await getTestAssignmentById(session.assignment_id);
    if (assignment) {
      const template = await getTestTemplateById(assignment.test_template_id);
      if (template?.proctoring_settings) {
        const settings = template.proctoring_settings;
        const currentViolations = (session.violations?.length || 0) + 1;
        if (settings.maxViolations && currentViolations >= settings.maxViolations) {
          if (settings.autoSubmitOnViolation) {
            await updateSessionStatus(id, TestSessionStatus.VIOLATION);
            return {
              success: true,
              message: "\u0422\u0435\u0441\u0442 \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D \u0438\u0437-\u0437\u0430 \u043F\u0440\u0435\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043B\u0438\u043C\u0438\u0442\u0430 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0439",
              terminated: true,
              violations_count: currentViolations
            };
          }
        }
      }
    }
    return {
      success: true,
      message: "\u041D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u043E",
      violations_count: (session.violations?.length || 0) + 1
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u044F:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u043F\u0438\u0441\u0438 \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0438\u044F"
    };
  }
});

export { violation_post as default };
//# sourceMappingURL=violation.post.mjs.map
