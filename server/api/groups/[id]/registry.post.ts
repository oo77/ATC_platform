/**
 * POST /api/groups/:id/registry
 * «Реестр» группы — лист регистрации слушателей и подтверждения личности (Word) со списком
 * слушателей и их должностями, по образцу (server/assets/templates/registry-template.docx).
 *
 * В теле запроса — данные, которые пользователь заполняет перед скачиванием:
 * { date: "ГГГГ-ММ-ДД", time: string, place: string, chairman: string, deputy: string | null }
 * (см. RegistryForm). Группа и слушатели берутся из базы.
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { z } from "zod";
import { loadRegistryModel, renderRegistryDocx } from "../../../services/registryService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";

/** Текст без лишних пробелов; пустой не допускается */
const text = (label: string, max = 200) =>
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

const registrySchema = z.object({
  date: z
    .string("Укажите дату")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату")
    .refine(isCalendarDate, "Укажите дату"),
  time: text("Vaqti", 100),
  place: text("Joy"),
  chairman: text("Komissiya raisi", 100),
  deputy: text("Komissiya rais o‘rinbosari", 100).nullable(),
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

    const form = registrySchema.safeParse(await readBody(event));
    if (!form.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: form.error.issues[0]?.message ?? "Некорректные данные реестра",
      });
    }

    const model = await loadRegistryModel(groupId);
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

    const buffer = await renderRegistryDocx(model, form.data);

    const fileName = `Reestr_${sanitizeFilename(model.groupCode)}.docx`;

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

    console.error("[API] Ошибка формирования реестра:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования реестра",
    });
  }
});
