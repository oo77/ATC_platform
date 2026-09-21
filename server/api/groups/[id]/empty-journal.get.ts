/**
 * GET /api/groups/:id/empty-journal?format=docx|pdf
 * «Пустой журнал» группы — бланк для ручного заполнения по утверждённому шаблону
 * (server/assets/templates/journal-template.docx).
 *
 * Query:
 *  - format — docx (по умолчанию) или pdf
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import {
  loadEmptyJournalModel,
  renderEmptyJournalDocx,
} from "../../../services/emptyJournalService";
import { renderEmptyJournalPdf } from "../../../services/emptyJournalPdfService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";

const FORMATS = {
  docx: {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  pdf: { contentType: "application/pdf" },
} as const;

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
      roleHasPermission(context.role, Permission.GROUPS_VIEW_ALL) ||
      roleHasPermission(context.role, Permission.GROUPS_VIEW_OWN);
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

    const format = String(getQuery(event).format ?? "docx");
    if (format !== "docx" && format !== "pdf") {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Формат должен быть docx или pdf",
      });
    }

    if (!(await canAccessGroup(context, groupId))) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Нет доступа к этой группе",
      });
    }

    const model = await loadEmptyJournalModel(groupId);
    if (!model) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Группа не найдена",
      });
    }
    if (model.students.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "В группе нет слушателей",
      });
    }

    const buffer =
      format === "pdf"
        ? await renderEmptyJournalPdf(model)
        : await renderEmptyJournalDocx(model);

    const fileName = `Pustoy_Zhurnal_${sanitizeFilename(model.groupCode)}.${format}`;

    setHeader(event, "Content-Type", FORMATS[format].contentType);
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

    console.error("[API] Ошибка формирования пустого журнала:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования пустого журнала",
    });
  }
});
