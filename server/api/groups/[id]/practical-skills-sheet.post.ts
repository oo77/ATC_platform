/**
 * POST /api/groups/:id/practical-skills-sheet
 * «Ведомость практических работ» (Amaliy koʻnikmalarni tekshirish QAYDNOMASI) группы — Word,
 * по странице на слушателя, по образцу
 * (server/assets/templates/practical-skills-sheet-template.docx).
 *
 * В теле — данные, которые пользователь вводит перед скачиванием: служба, дата, время
 * начала/окончания, состав комиссии (см. PracticalSkillsSheetForm). Должность (на узбекском)
 * и ФИО слушателей берутся из базы.
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { z } from "zod";
import {
  loadPracticalSkillsSheetModel,
  renderPracticalSkillsSheetDocx,
} from "../../../services/practicalSkillsSheetService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";
import {
  MAX_PRACTICAL_COMMISSION_MEMBERS,
  PRACTICAL_SKILLS_SERVICES,
} from "../../../../shared/utils/practicalSkillsSheet";

const time = (label: string) =>
  z
    .string(`Укажите ${label}`)
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, `Укажите ${label} в формате ЧЧ:ММ`);

const formSchema = z.object({
  service: z.enum(PRACTICAL_SKILLS_SERVICES, "Выберите Aviatsiya xavfsizligi xizmati"),
  date: z
    .string("Укажите дату проведения")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату проведения")
    .refine((ymd) => {
      const d = new Date(`${ymd}T00:00:00Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
    }, "Укажите дату проведения"),
  timeStart: time("время начала"),
  timeEnd: time("время окончания"),
  commission: z
    .array(
      z
        .string()
        .transform((v) => v.replace(/\s+/g, " ").trim())
        .pipe(z.string().min(1, "Заполните ФИО члена комиссии").max(100, "ФИО члена комиссии слишком длинное")),
      "Укажите членов комиссии",
    )
    .min(1, "Укажите хотя бы одного члена комиссии")
    .max(MAX_PRACTICAL_COMMISSION_MEMBERS, `Членов комиссии не больше ${MAX_PRACTICAL_COMMISSION_MEMBERS}`),
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

    const form = formSchema.safeParse(await readBody(event));
    if (!form.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: form.error.issues[0]?.message ?? "Некорректные данные ведомости",
      });
    }

    const model = await loadPracticalSkillsSheetModel(groupId);
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

    const buffer = await renderPracticalSkillsSheetDocx(model, form.data);
    const fileName = `Amaliy_qaydnoma_${sanitizeFilename(model.groupCode)}.docx`;

    setHeader(
      event,
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    setHeader(event, "Content-Disposition", `attachment; filename="${fileName}"`);
    setHeader(event, "Content-Length", buffer.byteLength);
    setHeader(event, "Cache-Control", "no-store");

    return send(event, buffer);
  } catch (error: any) {
    if (error.statusCode) throw error;

    console.error("[API] Ошибка формирования ведомости практических работ:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования ведомости практических работ",
    });
  }
});
