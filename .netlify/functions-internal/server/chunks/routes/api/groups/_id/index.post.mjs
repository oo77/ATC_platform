import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getGroupById, b as checkStudentConflicts, e as addStudentsToGroup } from '../../../../_/groupRepository.mjs';
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

const addStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E\u0433\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F")
});
const index_post = defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) {
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const validationResult = addStudentsSchema.safeParse(body);
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
    const { studentIds } = validationResult.data;
    const group = await getGroupById(groupId);
    if (!group) {
      return {
        success: false,
        message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const startDate = formatDateLocal(group.startDate);
    const endDate = formatDateLocal(group.endDate);
    const conflicts = await checkStudentConflicts(
      studentIds,
      startDate,
      endDate,
      groupId
      // исключаем текущую группу
    );
    if (conflicts.length > 0) {
      return {
        success: false,
        message: "\u041D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438 \u0443\u0436\u0435 \u043D\u0430\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0432 \u0433\u0440\u0443\u043F\u043F\u0430\u0445 \u0441 \u043F\u0435\u0440\u0435\u0441\u0435\u043A\u0430\u044E\u0449\u0438\u043C\u0438\u0441\u044F \u0434\u0430\u0442\u0430\u043C\u0438",
        conflicts
      };
    }
    const result = await addStudentsToGroup(groupId, studentIds);
    return {
      success: true,
      message: `\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439: ${result.added.length}`,
      added: result.added,
      alreadyInGroup: result.alreadyInGroup
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439"
    };
  }
});
function formatDateLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
