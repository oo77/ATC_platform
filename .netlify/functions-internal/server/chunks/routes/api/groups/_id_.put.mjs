import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getGroupById, a as groupCodeExists, c as courseExists, b as checkStudentConflicts, u as updateGroup } from '../../../_/groupRepository.mjs';
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

const updateGroupSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  courseId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classroom: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional()
});
const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const validationResult = updateGroupSchema.safeParse(body);
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
    const existingGroup = await getGroupById(id);
    if (!existingGroup) {
      return {
        success: false,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const newStartDate = data.startDate || existingGroup.startDate.toString().split("T")[0];
    const newEndDate = data.endDate || existingGroup.endDate.toString().split("T")[0];
    if (new Date(newEndDate) < new Date(newStartDate)) {
      return {
        success: false,
        message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430",
        errors: [{ field: "endDate", message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430" }]
      };
    }
    if (data.code && data.code !== existingGroup.code) {
      if (await groupCodeExists(data.code, id)) {
        return {
          success: false,
          message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          errors: [{ field: "code", message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" }]
        };
      }
    }
    if (data.courseId && data.courseId !== existingGroup.courseId) {
      if (!await courseExists(data.courseId)) {
        return {
          success: false,
          message: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0443\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430",
          errors: [{ field: "courseId", message: "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }]
        };
      }
    }
    if ((data.startDate || data.endDate) && existingGroup.students && existingGroup.students.length > 0) {
      const studentIds = existingGroup.students.map((s) => s.studentId);
      const conflicts = await checkStudentConflicts(
        studentIds,
        newStartDate,
        newEndDate,
        id
        // исключаем текущую группу
      );
      if (conflicts.length > 0) {
        return {
          success: false,
          message: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0434\u0430\u0442 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B \u0434\u043B\u044F \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439",
          conflicts
        };
      }
    }
    const group = await updateGroup(id, data);
    return {
      success: true,
      message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430",
      group
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
