import { d as defineEventHandler, r as readBody } from '../../nitro/nitro.mjs';
import { c as courseCodeExists, h as createCourse } from '../../_/courseRepository.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
import { z } from 'zod';
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
import '../../_/activityLogRepository.mjs';

const disciplineSchema = z.object({
  name: z.string().min(1, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  description: z.string().optional(),
  theoryHours: z.number().min(0, "\u0427\u0430\u0441\u044B \u0442\u0435\u043E\u0440\u0438\u0438 \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438"),
  practiceHours: z.number().min(0, "\u0427\u0430\u0441\u044B \u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0438 \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438"),
  assessmentHours: z.number().min(0, "\u0427\u0430\u0441\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0437\u043D\u0430\u043D\u0438\u0439 \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438"),
  orderIndex: z.number().optional(),
  instructorIds: z.array(z.string()).min(1, "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430").optional()
}).refine(
  (data) => data.theoryHours + data.practiceHours + data.assessmentHours > 0,
  { message: "\u041E\u0431\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0447\u0430\u0441\u043E\u0432 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0443\u043B\u044F", path: ["hours"] }
);
const courseSchema = z.object({
  name: z.string().min(1, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  shortName: z.string().min(2).max(10, "\u041A\u043E\u0440\u043E\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043E\u0442 2 \u0434\u043E 10 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"),
  code: z.string().min(1, "\u041A\u043E\u0434 \u043A\u0443\u0440\u0441\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  description: z.string().optional(),
  certificateTemplateId: z.string().optional(),
  isActive: z.boolean().optional(),
  disciplines: z.array(disciplineSchema).optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validationResult = courseSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        message: firstError?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        field: firstError?.path.join("."),
        errors: validationResult.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      };
    }
    const data = validationResult.data;
    const codeExists = await courseCodeExists(data.code);
    if (codeExists) {
      return {
        success: false,
        message: "\u041A\u0443\u0440\u0441 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
        field: "code"
      };
    }
    const course = await createCourse(data);
    await logActivity(
      event,
      "CREATE",
      "COURSE",
      String(course.id),
      course.name,
      { code: course.code, shortName: course.shortName }
    );
    return {
      success: true,
      message: "\u041A\u0443\u0440\u0441 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D",
      course
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043A\u0443\u0440\u0441\u0430:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043A\u0443\u0440\u0441\u0430"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
