/**
 * API: Применение шаблона расписания
 * POST /api/schedule/templates/[id]/apply
 */

import { executeQuery, executeTransaction } from "../../../../utils/db";
import { v4 as uuidv4 } from "uuid";
import { isoToMySqlDatetime } from "../../../../utils/timeUtils";
import { logActivity } from "../../../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import { Permission, roleHasPermission } from "../../../../utils/permissions";
import {
  findBatchConflicts,
  throwScheduleConflict,
} from "../../../../repositories/scheduleRepository";
import { withScheduleWriteLock } from "../../../../utils/scheduleLock";

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
  if (!roleHasPermission(user, Permission.SCHEDULE_CREATE)) {
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

    // Сортируем по порядковому индексу
    const sortedEvents = [...eventsData].sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    // Всё считаем заранее, до любой записи в БД
    const planned = sortedEvents.map((templateEvent) => {
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

      return {
        templateEvent,
        instructorId,
        classroomId,
        newStart: isoToMySqlDatetime(newStartTime.toISOString()),
        newEnd: isoToMySqlDatetime(newEndTime.toISOString()),
      };
    });

    // Проверка и запись — под общей блокировкой. Шаблон применяется целиком
    // или не применяется вовсе.
    await withScheduleWriteLock(async () => {
      const conflictMessages = await findBatchConflicts(
        planned.map(({ templateEvent, instructorId, classroomId, newStart, newEnd }) => ({
          label: templateEvent.title,
          classroomId,
          instructorId,
          groupId: targetGroupId,
          start: newStart,
          end: newEnd,
        })),
      );
      if (conflictMessages.length > 0) {
        throwScheduleConflict(conflictMessages);
      }

      await executeTransaction(async (connection: PoolConnection) => {
        for (const { templateEvent, instructorId, classroomId, newStart, newEnd } of planned) {
          const newId = uuidv4();
          await connection.query(
            `INSERT INTO schedule_events (
              id, title, description, group_id, discipline_id, instructor_id,
              classroom_id, start_time, end_time, is_all_day, color, event_type,
              duration_minutes, academic_hours, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId,
              templateEvent.title,
              templateEvent.description || null,
              targetGroupId,
              templateEvent.disciplineId || null,
              instructorId,
              classroomId,
              newStart,
              newEnd,
              false,
              templateEvent.color || "primary",
              templateEvent.eventType || "theory",
              templateEvent.durationMinutes,
              templateEvent.academicHours || null,
              user.id,
            ],
          );
          createdEventIds.push(newId);
        }
      });
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
