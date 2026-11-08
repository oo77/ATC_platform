/**
 * POST /api/groups/:id/final-exam-protocol-test
 * «Bayonnoma (тест)» — протокол заседания комиссии итогового экзамена, проведённого в виде
 * компьютерного теста (Word), по утверждённому образцу
 * (server/assets/templates/final-exam-protocol-test-template.docx).
 *
 * В теле запроса — данные, которые пользователь заполняет перед скачиванием: дата и номер
 * протокола, место, сведения об экзамене, приказ и состав комиссии (см. FinalExamProtocolForm;
 * заместителя председателя в этом протоколе нет). «Imtihon tartibi» — либо название курса
 * (courseTitle), либо свой текст целиком (examOrderText). Группа, список слушателей, их баллы
 * и оценки берутся из базы (результаты тестов группы).
 *
 * Доступ: как к странице группы — GROUPS_VIEW_ALL / GROUPS_VIEW_OWN (инструктор — только своя группа).
 */

import { z } from "zod";
import {
  loadFinalExamProtocolTestModel,
  renderFinalExamProtocolTestDocx,
} from "../../../services/finalExamProtocolTestService";
import {
  canAccessGroup,
  getPermissionContext,
  roleHasPermission,
} from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";
import { MAX_PROTOCOL_MEMBERS } from "../../../../shared/utils/finalExamProtocol";

/** Текст без лишних пробелов */
const squeeze = (value: string) => value.replace(/\s+/g, " ").trim();

/** Текст без лишних пробелов; пустой не допускается */
const text = (label: string, max = 300) =>
  z
    .string(`Заполните поле «${label}»`)
    .transform(squeeze)
    .pipe(
      z
        .string()
        .min(1, `Заполните поле «${label}»`)
        .max(max, `Поле «${label}» не должно превышать ${max} символов`),
    );

const person = (who: string) =>
  z.object(
    { fullName: text(`ФИО — ${who}`, 100), position: text(`Должность — ${who}`) },
    `Укажите ФИО и должность: ${who}`,
  );

const membersCount = (label: string) =>
  z
    .number(`Укажите число: ${label}`)
    .int(`Укажите целое число: ${label}`)
    .min(1, `Укажите число: ${label}`)
    .max(99, `Слишком большое число: ${label}`);

const isCalendarDate = (ymd: string) => {
  const date = new Date(`${ymd}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === ymd;
};

const protocolSchema = z
  .object({
    date: z
      .string("Укажите дату протокола")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату протокола")
      .refine(isCalendarDate, "Укажите дату протокола"),
    number: text("Номер протокола", 50),
    place: text("Место", 200),
    presiding: person("Raislik qiluvchi"),
    approvedMembers: membersCount("членов комиссии по приказу"),
    presentMembers: membersCount("членов комиссии, которые участвовали"),
    examForm: text("Imtihon shakli"),
    examTime: text("Imtihon vaqti", 100),
    examPlace: text("Imtihon joyi"),
    videoRecorded: z.boolean("Укажите, велась ли видеозапись экзамена"),
    courseTitle: z.string().default("").transform(squeeze).pipe(z.string().max(200)),
    examOrderText: z
      .string()
      .nullish()
      .transform((value) => squeeze(value ?? ""))
      .pipe(z.string().max(500, "Текст «Imtihon tartibi» не должен превышать 500 символов")),
    commissionList: text("Перечень в скобках под «Imtihon tartibi»"),
    order: text("Приказ о составе комиссии", 400),
    chairman: person("председатель комиссии"),
    members: z
      .array(person("член комиссии"), "Укажите хотя бы одного члена комиссии")
      .min(1, "Укажите хотя бы одного члена комиссии")
      .max(MAX_PROTOCOL_MEMBERS, `Членов комиссии может быть не больше ${MAX_PROTOCOL_MEMBERS}`),
  })
  .refine((form) => form.presentMembers <= form.approvedMembers, {
    message: "Участвовавших членов комиссии не может быть больше, чем утверждено приказом",
  })
  .refine((form) => form.examOrderText || form.courseTitle, {
    message: "Укажите название курса или свой текст для «Imtihon tartibi»",
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

    const form = protocolSchema.safeParse(await readBody(event));
    if (!form.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: form.error.issues[0]?.message ?? "Некорректные данные протокола",
      });
    }

    const model = await loadFinalExamProtocolTestModel(groupId);
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

    // В протоколе-тесте заместителя председателя нет
    const buffer = await renderFinalExamProtocolTestDocx(model, { ...form.data, deputy: null });

    const fileName = `Bayonnoma_${sanitizeFilename(form.data.number)}_${sanitizeFilename(model.groupCode)}_test.docx`;

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

    console.error("[API] Ошибка формирования протокола экзамена (тест):", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования протокола экзамена (тест)",
    });
  }
});
