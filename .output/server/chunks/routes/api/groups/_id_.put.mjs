import { g as defineEventHandler, h as createError, j as getRouterParam, r as readBody, f as executeQuery } from '../../../_/nitro.mjs';
import { z } from 'zod';
import { g as getGroupById, a as groupCodeExists, c as courseExists, b as checkStudentConflicts } from '../../../_/groupRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import 'node:url';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const updateGroupSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  courseId: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  classroom: z.string().max(100).nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional()
  // Добавлено поле архивации
});
const _id__put = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F" });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({ statusCode: 403, message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432" });
  }
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw createError({ statusCode: 400, message: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D" });
    }
    const body = await readBody(event);
    const validationResult = updateGroupSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message
      }));
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        data: errors
      });
    }
    const data = validationResult.data;
    const existingGroup = await getGroupById(id);
    if (!existingGroup) {
      throw createError({ statusCode: 404, message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
    }
    if (data.isArchived !== void 0) {
      if (user.role !== "ADMIN") {
        throw createError({
          statusCode: 403,
          message: "\u0422\u043E\u043B\u044C\u043A\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u043C\u043E\u0436\u0435\u0442 \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C/\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0442\u044C \u0433\u0440\u0443\u043F\u043F\u044B"
        });
      }
    }
    if (data.startDate || data.endDate) {
      const now = /* @__PURE__ */ new Date();
      const currentEndDate = new Date(existingGroup.endDate);
      if (now > currentEndDate && user.role !== "ADMIN") {
        throw createError({
          statusCode: 403,
          message: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0441\u0440\u043E\u043A\u043E\u0432 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043D\u044B\u0445 \u0433\u0440\u0443\u043F\u043F \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430\u043C. \u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C \u0434\u0440\u0443\u0433\u0438\u0435 \u043F\u043E\u043B\u044F."
        });
      }
    }
    const newStartDate = data.startDate || (existingGroup.startDate instanceof Date ? existingGroup.startDate.toISOString().split("T")[0] : existingGroup.startDate);
    const newEndDate = data.endDate || (existingGroup.endDate instanceof Date ? existingGroup.endDate.toISOString().split("T")[0] : existingGroup.endDate);
    if (new Date(newEndDate) < new Date(newStartDate)) {
      throw createError({
        statusCode: 400,
        message: "\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0434\u0430\u0442\u044B \u043D\u0430\u0447\u0430\u043B\u0430"
      });
    }
    if (data.code && data.code !== existingGroup.code) {
      if (await groupCodeExists(data.code, id)) {
        throw createError({
          statusCode: 400,
          message: "\u0413\u0440\u0443\u043F\u043F\u0430 \u0441 \u0442\u0430\u043A\u0438\u043C \u043A\u043E\u0434\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
        });
      }
    }
    if (data.courseId && data.courseId !== existingGroup.courseId) {
      if (!await courseExists(data.courseId)) {
        throw createError({
          statusCode: 400,
          message: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u0430\u044F \u0443\u0447\u0435\u0431\u043D\u0430\u044F \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
        });
      }
    }
    if ((data.startDate || data.endDate) && existingGroup.students && existingGroup.students.length > 0) {
      const studentIds = existingGroup.students.map((s) => s.studentId);
      const conflicts = await checkStudentConflicts(
        studentIds,
        newStartDate,
        newEndDate,
        id
      );
      if (conflicts.length > 0) {
        throw createError({
          statusCode: 409,
          message: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0434\u0430\u0442 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B \u0434\u043B\u044F \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439",
          data: conflicts
        });
      }
    }
    const updates = [];
    const params = [];
    if (data.code !== void 0)
      updates.push("code = ?"), params.push(data.code);
    if (data.courseId !== void 0)
      updates.push("course_id = ?"), params.push(data.courseId);
    if (data.startDate !== void 0)
      updates.push("start_date = ?"), params.push(data.startDate);
    if (data.endDate !== void 0)
      updates.push("end_date = ?"), params.push(data.endDate);
    if (data.classroom !== void 0)
      updates.push("classroom = ?"), params.push(data.classroom);
    if (data.description !== void 0)
      updates.push("description = ?"), params.push(data.description);
    if (data.isActive !== void 0)
      updates.push("is_active = ?"), params.push(data.isActive ? 1 : 0);
    if (data.isArchived !== void 0) {
      updates.push("is_archived = ?");
      params.push(data.isArchived ? 1 : 0);
      if (data.isArchived) {
        updates.push("archived_at = NOW(3)");
        updates.push("archived_by = ?");
        params.push(user.id);
      } else {
        updates.push("archived_at = NULL");
        updates.push("archived_by = NULL");
      }
    }
    updates.push("updated_at = NOW(3)");
    if (updates.length > 0) {
      params.push(id);
      await executeQuery(
        `UPDATE study_groups SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }
    await logActivity(
      event,
      data.isArchived ? "ARCHIVE" : data.isArchived === false ? "RESTORE" : "UPDATE",
      // кастомные типы действий, если поддерживаются, или просто UPDATE
      "GROUP",
      id,
      data.code || existingGroup.code,
      {
        updatedFields: Object.keys(data),
        isArchived: data.isArchived
      }
    );
    const updatedGroup = await getGroupById(id);
    return {
      success: true,
      message: data.isArchived ? "\u0413\u0440\u0443\u043F\u043F\u0430 \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D\u0430" : data.isArchived === false ? "\u0413\u0440\u0443\u043F\u043F\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430" : "\u0413\u0440\u0443\u043F\u043F\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430",
      group: updatedGroup
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0433\u0440\u0443\u043F\u043F\u044B:", error);
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
