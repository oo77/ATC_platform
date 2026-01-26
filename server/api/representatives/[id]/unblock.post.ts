import { defineEventHandler, createError } from "h3";
import {
  unblockRepresentative,
  getRepresentativeById,
} from "../../../repositories/representativeRepository";
import { logActivity } from "../../../utils/activityLogger";

/**
 * POST /api/representatives/:id/unblock
 * Разблокировка представителя
 */
export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const userId = event.context.user?.id;

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID представителя не указан",
      });
    }

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: "Необходима авторизация",
      });
    }

    const existing = await getRepresentativeById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: "Представитель не найден",
      });
    }

    if (existing.status !== "blocked") {
      throw createError({
        statusCode: 400,
        statusMessage: "Представитель не заблокирован",
      });
    }

    const updated = await unblockRepresentative(id, userId);

    // Логирование действия
    await logActivity(
      event,
      "UNBLOCK",
      "REPRESENTATIVE",
      id,
      existing.fullName,
      {
        previousStatus: existing.status,
        organizationId: existing.organizationId,
        organizationName: existing.organizationName,
      },
    );

    return {
      success: true,
      data: updated,
      message: "Представитель разблокирован",
    };
  } catch (error: any) {
    console.error("Error unblocking representative:", error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка при разблокировке представителя",
    });
  }
});
