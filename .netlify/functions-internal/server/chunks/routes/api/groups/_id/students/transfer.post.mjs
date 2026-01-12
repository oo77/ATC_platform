import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { g as getGroupById, b as checkStudentConflicts, t as transferStudent } from '../../../../../_/groupRepository.mjs';
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

const transferSchema = z.object({
  studentId: z.string().min(1, "ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"),
  toGroupId: z.string().min(1, "ID \u0446\u0435\u043B\u0435\u0432\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D")
});
const transfer_post = defineEventHandler(async (event) => {
  try {
    const fromGroupId = getRouterParam(event, "id");
    if (!fromGroupId) {
      return {
        success: false,
        message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const validationResult = transferSchema.safeParse(body);
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
    const { studentId, toGroupId } = validationResult.data;
    const fromGroup = await getGroupById(fromGroupId);
    if (!fromGroup) {
      return {
        success: false,
        message: "\u0418\u0441\u0445\u043E\u0434\u043D\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const toGroup = await getGroupById(toGroupId);
    if (!toGroup) {
      return {
        success: false,
        message: "\u0426\u0435\u043B\u0435\u0432\u0430\u044F \u0433\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      };
    }
    const studentInGroup = fromGroup.students?.find((s) => s.studentId === studentId);
    if (!studentInGroup) {
      return {
        success: false,
        message: "\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u0435"
      };
    }
    const toStartDate = formatDateLocal(toGroup.startDate);
    const toEndDate = formatDateLocal(toGroup.endDate);
    const conflicts = await checkStudentConflicts(
      [studentId],
      toStartDate,
      toEndDate,
      fromGroupId
      // исключаем исходную группу (слушатель будет из неё удалён)
    );
    const realConflicts = conflicts.filter((c) => c.conflictGroupId !== toGroupId);
    if (realConflicts.length > 0) {
      return {
        success: false,
        message: "\u041F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442 \u0441 \u0434\u0440\u0443\u0433\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u043E\u0439",
        conflicts: realConflicts
      };
    }
    await transferStudent(studentId, fromGroupId, toGroupId);
    return {
      success: true,
      message: `\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0451\u043D \u0432 \u0433\u0440\u0443\u043F\u043F\u0443 ${toGroup.code}`
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u0438\u0438 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F"
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

export { transfer_post as default };
//# sourceMappingURL=transfer.post.mjs.map
