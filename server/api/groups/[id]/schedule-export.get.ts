/**
 * GET /api/groups/:id/schedule-export
 * Excel «Расписание занятий» всей группы: все дни и занятия всех инструкторов — то же
 * оформление, что у расписания инструктора (GET /api/instructors/:id/schedule-export).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import {
  loadInstructorScheduleModel,
  buildInstructorScheduleWorkbook,
} from "../../../services/instructorScheduleExcelService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";

export default defineEventHandler(async (event) => {
  try {
    const context = await getPermissionContext(event);
    if (!context) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Требуется авторизация",
      });
    }

    const canView =
      roleHasPermission(context, Permission.GROUPS_VIEW_ALL) ||
      roleHasPermission(context, Permission.GROUPS_VIEW_OWN);
    if (!canView) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Недостаточно прав для просмотра группы",
      });
    }

    const groupId = getRouterParam(event, "id");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "ID группы не указан",
      });
    }

    if (!(await canAccessGroup(context, groupId))) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Нет доступа к этой группе",
      });
    }

    const model = await loadInstructorScheduleModel(null, groupId);
    if (!model) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Группа не найдена",
      });
    }
    if (model.days.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "В расписании группы нет занятий",
      });
    }

    const buffer = await buildInstructorScheduleWorkbook(model);

    const firstDay = model.days[0]!.date;
    const lastDay = model.days[model.days.length - 1]!.date;
    const fileNameAscii = `Raspisanie_${sanitizeFilename(model.groupCode)}_${firstDay.slice(0, 5)}-${lastDay.slice(0, 5)}.xlsx`;
    const fileNameRu = `${model.groupCode} ${firstDay}-${lastDay}.xlsx`;

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileNameAscii}"; filename*=UTF-8''${encodeURIComponent(fileNameRu)}`,
    );
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    return send(event, buffer);
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[API] Ошибка формирования расписания группы:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования расписания группы",
    });
  }
});
