/**
 * POST /api/groups/:id/evaluation-sheets
 * «Оценочные листы» (BAHOLASH VARAQASI) группы — по одному листу на слушателя, все листы
 * в одном Word-файле, по утверждённому образцу
 * (server/assets/templates/evaluation-sheets-template.docx).
 *
 * В теле запроса — состав комиссии, который пользователь заполняет перед скачиванием:
 * { chairman: string, deputy: string | null, members: string[] } (см. EvaluationSheetsCommission).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { z } from "zod";
import {
  loadEvaluationSheetsModel,
  renderEvaluationSheetsDocx,
} from "../../../services/evaluationSheetsService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";
import { MAX_COMMISSION_MEMBERS } from "../../../../shared/utils/evaluationSheets";

/** ФИО без лишних пробелов; пустое не допускается */
const personName = (who: string) =>
  z
    .string()
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, `Укажите ФИО ${who}`)
        .max(100, `ФИО ${who} не должно превышать 100 символов`),
    );

const commissionSchema = z.object({
  chairman: personName("председателя комиссии"),
  deputy: personName("заместителя председателя комиссии").nullable(),
  members: z
    .array(personName("члена комиссии"))
    .min(1, "Укажите хотя бы одного члена комиссии")
    .max(MAX_COMMISSION_MEMBERS, `Членов комиссии может быть не больше ${MAX_COMMISSION_MEMBERS}`),
});

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

    const commission = commissionSchema.safeParse(await readBody(event));
    if (!commission.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: commission.error.issues[0]?.message ?? "Некорректный состав комиссии",
      });
    }

    const model = await loadEvaluationSheetsModel(groupId);
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

    const buffer = await renderEvaluationSheetsDocx(model, commission.data);

    const fileName = `Otsenochnye_Listy_${sanitizeFilename(model.groupCode)}.docx`;

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

    console.error("[API] Ошибка формирования оценочных листов:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования оценочных листов",
    });
  }
});
