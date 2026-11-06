/**
 * GET /api/organizations/:id/training-export?year=2026
 * Excel-отчёт об обучении сотрудников организации: сводка по программам, группы,
 * слушатели с названиями и номерами выданных сертификатов.
 */

import {
  loadOrganizationTraining,
  buildOrganizationTrainingWorkbook,
} from "../../../services/organizationTrainingService";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { sanitizeFilename } from "../../../utils/sanitizeFilename";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ORGANIZATIONS_VIEW);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID организации обязателен" });
  }
  const year = Number(getQuery(event).year) || null;

  try {
    const model = await loadOrganizationTraining(id, year);
    if (!model) {
      throw createError({ statusCode: 404, message: "Организация не найдена" });
    }

    const buffer = await buildOrganizationTrainingWorkbook(model);

    const suffix = year ? ` ${year}` : "";
    const fileNameRu = `Обучение ${model.organization.name}${suffix}.xlsx`;
    const fileNameAscii = sanitizeFilename(`Obuchenie_${model.organization.name}${suffix}.xlsx`);

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
    console.error("[Organization Training Export] Error:", error);
    throw createError({
      statusCode: 500,
      message: "Ошибка формирования отчёта",
    });
  }
});
