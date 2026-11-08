/**
 * GET /api/instructors/:id/schedule-export?groupId=...
 * Excel «Расписание занятий» группы: только дни и занятия, которые этот инструктор ведёт в группе.
 */

import {
  loadInstructorScheduleModel,
  buildInstructorScheduleWorkbook,
} from "../../../services/instructorScheduleExcelService";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";
import { Permission } from "../../../utils/permissions";
import { requireInstructorSelfOrPermission } from "../../../utils/resourceAccess";

export default defineEventHandler(async (event) => {
  // P0-ACCESS: проверка прав доступа
  await requireInstructorSelfOrPermission(event, getRouterParam(event, "id"), Permission.INSTRUCTORS_VIEW);

  try {
    const instructorId = getRouterParam(event, "id");
    const groupId = String(getQuery(event).groupId ?? "");
    if (!instructorId || !groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Не указан инструктор или группа",
      });
    }

    const model = await loadInstructorScheduleModel(instructorId, groupId);
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
        message: "У инструктора нет занятий в этой группе",
      });
    }

    const buffer = await buildInstructorScheduleWorkbook(model);

    const first = model.days[0]!.date.slice(0, 5);
    const last = model.days[model.days.length - 1]!.date.slice(0, 5);
    const fileNameAscii = `Raspisanie_${sanitizeFilename(model.groupCode)}_${first}-${last}.xlsx`;
    const fileNameRu = `${model.groupCode} ${model.days[0]!.date}-${model.days[model.days.length - 1]!.date}.xlsx`;

    setHeader(event, "Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
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
    console.error("[Instructor Schedule Export] Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка формирования расписания",
    });
  }
});
