/**
 * POST /api/certificates/[id]/regenerate
 * Перерисовать PDF выданного сертификата по текущей версии его шаблона.
 * Номер, дата выдачи и статус не меняются.
 *
 * Body: { instructorId?: string | null } — инструктор для старых сертификатов,
 * у которых он не сохранён в снимке
 */

import { z } from "zod";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";
import { logActivity } from "../../../utils/activityLogger";
import {
  regenerateIssuedCertificatePdf,
  RegenerateError,
} from "../../../services/certificateRegenerationService";

const bodySchema = z.object({
  instructorId: z.string().uuid().nullable().optional(),
});

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "ID сертификата обязателен" });
  }

  const parsed = bodySchema.safeParse(
    (await readBody(event).catch(() => null)) || {},
  );
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: "Некорректный ID инструктора" });
  }

  try {
    const result = await regenerateIssuedCertificatePdf(
      id,
      parsed.data.instructorId,
    );

    await logActivity(
      event,
      "UPDATE",
      "ISSUED_CERTIFICATE",
      result.certificateId,
      `${result.certificateNumber} — ${result.studentName}`,
      {
        action: "regenerate_pdf",
        templateName: result.templateName,
      },
    );

    return { success: true, ...result };
  } catch (error: any) {
    if (error instanceof RegenerateError) {
      throw createError({ statusCode: error.statusCode, message: error.message });
    }
    console.error(`[POST /api/certificates/${id}/regenerate] Error:`, error);
    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка перегенерации сертификата",
    });
  }
});
