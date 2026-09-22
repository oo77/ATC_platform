/**
 * GET /api/groups/:id/assessment-sheet?format=docx|pdf
 * «Ведомость проведения контроля знаний» группы — бланк для фиксации баллов по дисциплинам
 * во время контроля знаний, по утверждённому образцу («Ведомость AOP-01PK.docx»).
 *
 * Query:
 *  - format — docx (по умолчанию) или pdf
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import {
  loadAssessmentSheetModel,
  renderAssessmentSheetDocx,
} from "../../../services/assessmentSheetService";
import { renderAssessmentSheetPdf } from "../../../services/assessmentSheetPdfService";
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

    const model = await loadAssessmentSheetModel(groupId);
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
    if (model.disciplines.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message:
          "У группы нет ни одного контроля знаний в расписании, ни дисциплин с проверкой знаний в программе курса — печатать не по чему",
      });
    }

    const buffer =
      format === "pdf"
        ? await renderAssessmentSheetPdf(model)
        : await renderAssessmentSheetDocx(model);

    const fileName = `Vedomost_${sanitizeFilename(model.groupCode)}.${format}`;

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

    console.error("[API] Ошибка формирования ведомости контроля знаний:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования ведомости контроля знаний",
    });
  }
});
