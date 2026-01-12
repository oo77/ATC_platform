import { d as defineEventHandler, r as readBody } from '../../nitro/nitro.mjs';
import { z } from 'zod';
import { a as groupCodeExists, c as courseExists, b as checkStudentConflicts, i as createGroup } from '../../_/groupRepository.mjs';
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

const createGroupSchema = z.object({
  code: z.string().min(1, "\u041A\u043E\u0434 \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D").max(50, "\u041A\u043E\u0434 \u0433\u0440\u0443\u043F\u043F\u044B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439"),
  courseId: z.string().min(1, "ID \u043A\u0443\u0440\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  startDate: z.string().min(1, "\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430"),
  endDate: z.string().min(1, "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430"),
  classroom: z.string().max(100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  studentIds: z.array(z.string()).optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validationResult = createGroupSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message
      }));
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        errors
      };
    }
    const data = validationResult.data;
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate < startDate) {
      return {
        success: false,
        message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430",
        errors: [{ field: "endDate", message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430" }]
      };
    }
    if (await groupCodeExists(data.code)) {
      return {
        success: false,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
        errors: [{ field: "code", message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" }]
      };
    }
    if (!await courseExists(data.courseId)) {
      return {
        success: false,
        message: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0443\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430",
        errors: [{ field: "courseId", message: "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }]
      };
    }
    if (data.studentIds && data.studentIds.length > 0) {
      const conflicts = await checkStudentConflicts(
        data.studentIds,
        data.startDate,
        data.endDate
      );
      if (conflicts.length > 0) {
        return {
          success: false,
          message: "\u041D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438 \u0443\u0436\u0435 \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0432 \u0433\u0440\u0443\u043F\u043F\u0430\u0445 \u0441 \u043F\u0435\u0440\u0435\u0441\u0435\u043A\u0430\u044E\u0449\u0438\u043C\u0438\u0441\u044F \u0434\u0430\u0442\u0430\u043C\u0438",
          conflicts
        };
      }
    }
    const group = await createGroup(data);
    return {
      success: true,
      message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0430",
      group
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post7.mjs.map
