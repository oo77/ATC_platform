/**
 * GET /api/groups/:id/group-list?instructorId=…
 * «Список группы» — Word по образцу (server/assets/templates/group-list-template.docx):
 * код группы, даты обучения, Ф.И.О. (латиницей), должности (на русском) и организации слушателей
 * подставляются из базы; остальные колонки и курс заполняются от руки.
 *
 * instructorId — инструктор из расписания группы для строки «Образец»
 * (см. GET /api/groups/:id/empty-journal-instructors); без него строка остаётся пустой.
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import {
  loadGroupListModel,
  renderGroupListDocx,
  UnknownInstructorError,
} from "../../../services/groupListService";
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

    const { instructorId } = getQuery(event);
    const model = await loadGroupListModel(
      groupId,
      typeof instructorId === "string" && instructorId ? instructorId : null,
    );
    if (!model) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Группа не найдена",
      });
    }

    const buffer = await renderGroupListDocx(model);

    const fileName = `Spisok_gruppy_${sanitizeFilename(model.groupCode)}.docx`;

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="${fileName}"`,
    );
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    return send(event, buffer);
  } catch (error: any) {
    if (error.statusCode) throw error;
    if (error instanceof UnknownInstructorError) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: error.message,
      });
    }

    console.error("[API] Ошибка формирования списка группы:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования списка группы",
    });
  }
});
