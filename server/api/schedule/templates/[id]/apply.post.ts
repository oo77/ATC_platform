/**
 * API: Применение шаблона расписания
 * POST /api/schedule/templates/[id]/apply
 */

import { executeQuery, executeTransaction } from "../../../../utils/db";
import { v4 as uuidv4 } from "uuid";
import { isoToMySqlDatetime } from "../../../../utils/timeUtils";
import { logActivity } from "../../../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";

interface TemplateRow extends RowDataPacket {
  id: string;
  name: string;
  events_data: string;
}

interface TemplateEvent {
  title: string;
  description?: string;
  disciplineId?: string;
  instructorId?: string;
  classroomId?: string;
  eventType: string;
  color: string;
  startOffset: number;
  durationMinutes: number;
  academicHours?: number;
  orderIndex: number;
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

  // Проверка прав (только ADMIN и MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Недостаточно прав для применения шаблонов",
    });
  }

  const templateId = getRouterParam(event, "id");

  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID шаблона обязателен",
    });
  }

  const body = await readBody(event);
  const {
    targetGroupId,
    targetDate,
    overrideInstructorId,
    overrideClassroomId,
  } = body;

  // Валидация
  if (!targetGroupId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо указать целевую группу",
    });
  }

  if (!targetDate) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо указать дату",
    });
  }

  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректный формат даты",
    });
  }

  console.log(
    `[templates.apply] User ${user.id} applying template ${templateId} to group ${targetGroupId} on ${targetDate}`,
  );

  try {
    // Получаем шаблон
    const templateQuery = `
      SELECT id, name, events_data
      FROM schedule_templates
      WHERE id = ? AND is_active = TRUE
    `;
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
    const eventsData: TemplateEvent[] =
      typeof template.events_data === "string"
        ? JSON.parse(template.events_data)
        : template.events_data;

    if (!eventsData || eventsData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Шаблон не содержит занятий",
      });
    }

    const createdEventIds: string[] = [];
    const errors: string[] = [];

    await executeTransaction(async (connection: PoolConnection) => {
      // Сортируем по порядковому индексу
      const sortedEvents = [...eventsData].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );

      for (const templateEvent of sortedEvents) {
        try {
          const newId = uuidv4();

          // Вычисляем время начала и окончания
          const startHours = Math.floor(templateEvent.startOffset / 60);
          const startMinutes = templateEvent.startOffset % 60;

          const newStartTime = new Date(target);
          newStartTime.setHours(startHours, startMinutes, 0, 0);

          const newEndTime = new Date(
            newStartTime.getTime() + templateEvent.durationMinutes * 60 * 1000,
          );

          // Определяем инструктора (override или из шаблона)
          const instructorId =
            overrideInstructorId || templateEvent.instructorId || null;

          // Определяем аудиторию (override или из шаблона)
          const classroomId =
            overrideClassroomId || templateEvent.classroomId || null;

          // Создаем занятие
          await connection.query(
            `INSERT INTO schedule_events (
              id, title, description, group_id, discipline_id, instructor_id,
              classroom_id, start_time, end_time, is_all_day, color, event_type,
              duration_minutes, academic_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              templateEvent.title,
              templateEvent.description || null,
              targetGroupId,
              templateEvent.disciplineId || null,
              instructorId,
              classroomId,
              isoToMySqlDatetime(newStartTime.toISOString()),
              isoToMySqlDatetime(newEndTime.toISOString()),
              false,
              templateEvent.color || "primary",
              templateEvent.eventType || "theory",
              templateEvent.durationMinutes,
              templateEvent.academicHours || null,
            ],
          );

          createdEventIds.push(newId);
        } catch (err: any) {
          console.error(`[templates.apply] Error creating event:`, err);
          errors.push(
            `Ошибка создания "${templateEvent.title}": ${err.message}`,
          );
        }
      }
    });

    // Логирование
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      createdEventIds[0] || undefined,
      `Применение шаблона: ${template.name}`,
      {
        templateId,
        templateName: template.name,
        targetGroupId,
        targetDate,
        createdEventIds,
        overrideInstructorId,
        overrideClassroomId,
      },
    );

    console.log(
      `[templates.apply] Created ${createdEventIds.length} events from template`,
    );

    return {
      success: true,
      createdCount: createdEventIds.length,
      createdEventIds,
      errors,
    };
  } catch (error: any) {
    console.error("[templates.apply] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка применения шаблона",
    });
  }
});
