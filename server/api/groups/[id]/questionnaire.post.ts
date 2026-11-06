/**
 * POST /api/groups/:id/questionnaire
 * «Обезличенный вопросник» (SHAXSI KOʻRSATILMAGAN SOʻROVNOMA) — Word по образцу
 * (server/assets/templates/questionnaire-template.docx): название программы, номер группы,
 * число слушателей, период обучения и дисциплина подставляются из базы.
 *
 * В теле запроса — то, что пользователь вводит перед скачиванием: место проведения на
 * узбекском и русском (placeUz, placeRu), дата заполнения (filledDate, ГГГГ-ММ-ДД) и,
 * по желанию, инструктор из расписания группы (instructorId, см.
 * GET /api/groups/:id/empty-journal-instructors).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { z } from "zod";
import {
  loadQuestionnaireGroup,
  loadQuestionnaireInstructor,
  renderQuestionnaireDocx,
} from "../../../services/questionnaireService";
import { UnknownInstructorError } from "../../../services/acquaintanceSheetService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";

/** Текст без лишних пробелов; пустой не допускается */
const text = (label: string, max: number) =>
  z
    .string(`Заполните поле «${label}»`)
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, `Заполните поле «${label}»`)
        .max(max, `Поле «${label}» не должно превышать ${max} символов`),
    );

const isCalendarDate = (ymd: string) => {
  const date = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === ymd;
};

const questionnaireSchema = z.object({
  placeUz: text("Место проведения (узбекский)", 200),
  placeRu: text("Место проведения (русский)", 200),
  filledDate: z
    .string("Укажите дату заполнения")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату заполнения")
    .refine(isCalendarDate, "Укажите дату заполнения"),
  instructorId: z.string().nullish(),
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

    if (!(await canAccessGroup(context, groupId))) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
        message: "Нет доступа к этой группе",
      });
    }

    const form = questionnaireSchema.safeParse(await readBody(event));
    if (!form.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: form.error.issues[0]?.message ?? "Некорректные данные вопросника",
      });
    }

    const group = await loadQuestionnaireGroup(groupId);
    if (!group) {
      throw createError({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Группа не найдена",
      });
    }

    const instructor = await loadQuestionnaireInstructor(
      groupId,
      form.data.instructorId || null,
    );

    const buffer = await renderQuestionnaireDocx(group, {
      placeUz: form.data.placeUz,
      placeRu: form.data.placeRu,
      filledDate: form.data.filledDate,
      instructor,
    });

    const fileName = `Savolnoma_${sanitizeFilename(group.groupCode)}.docx`;

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

    console.error("[API] Ошибка формирования вопросника:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования вопросника",
    });
  }
});
