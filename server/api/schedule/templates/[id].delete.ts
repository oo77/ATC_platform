/**
 * API: Удаление шаблона расписания
 * DELETE /api/schedule/templates/[id]
 */

import { executeQuery } from "../../../utils/db";
import { logActivity } from "../../../utils/activityLogger";
import type { RowDataPacket } from "mysql2/promise";

interface TemplateRow extends RowDataPacket {
  id: string;
  name: string;
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Требуется авторизация",
    });
  }

  // Проверка прав (только ADMIN)
  if (user.role !== "ADMIN") {
    throw createError({
      statusCode: 403,
      statusMessage: "Только администратор может удалять шаблоны",
    });
  }

  const templateId = getRouterParam(event, "id");

  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID шаблона обязателен",
    });
  }

  console.log(
    `[templates.delete] User ${user.id} deleting template ${templateId}`,
  );

  try {
    // Получаем информацию о шаблоне
    const templateQuery = `SELECT id, name FROM schedule_templates WHERE id = ?`;
    const templates = await executeQuery<TemplateRow[]>(templateQuery, [
      templateId,
    ]);

    if (templates.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Шаблон не найден",
      });
    }

    const template = templates[0];

    // Мягкое удаление (деактивация)
    await executeQuery(
      `UPDATE schedule_templates SET is_active = FALSE WHERE id = ?`,
      [templateId],
    );

    // Логирование
    await logActivity(
      event,
      "DELETE",
      "SCHEDULE",
      templateId,
      `Шаблон расписания: ${template.name}`,
      {
        templateId,
        templateName: template.name,
      },
    );

    console.log(`[templates.delete] Deleted template ${templateId}`);

    return {
      success: true,
      message: "Шаблон успешно удалён",
    };
  } catch (error: any) {
    console.error("[templates.delete] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка удаления шаблона",
    });
  }
});
