/**
 * API: Создание шаблона расписания
 * POST /api/schedule/templates
 */

import { executeQuery } from "../../../utils/db";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../../../utils/activityLogger";
import type { RowDataPacket } from "mysql2/promise";

interface ScheduleEventRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  discipline_id: string | null;
  discipline_name: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  classroom_id: string | null;
  classroom_name: string | null;
  start_time: Date;
  end_time: Date;
  color: string;
  event_type: string;
  duration_minutes: number | null;
  academic_hours: number | null;
  group_id: string | null;
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
      statusMessage: "Недостаточно прав для создания шаблонов",
    });
  }

  const body = await readBody(event);
  const { name, description, eventIds, sourceGroupId } = body;

  // Валидация
  if (!name || name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Название шаблона обязательно",
    });
  }

  if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Необходимо выбрать хотя бы одно занятие",
    });
  }

  console.log(
    `[templates.post] User ${user.id} creating template "${name}" from ${eventIds.length} events`,
  );

  try {
    // Получаем исходные занятия
    const placeholders = eventIds.map(() => "?").join(",");
    const eventsQuery = `
      SELECT 
        se.id,
        se.title,
        se.description,
        se.discipline_id,
        d.name AS discipline_name,
        se.instructor_id,
        i.full_name AS instructor_name,
        se.classroom_id,
        c.name AS classroom_name,
        se.start_time,
        se.end_time,
        se.color,
        se.event_type,
        se.duration_minutes,
        se.academic_hours,
        se.group_id
      FROM schedule_events se
      LEFT JOIN disciplines d ON se.discipline_id = d.id
      LEFT JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN classrooms c ON se.classroom_id = c.id
      WHERE se.id IN (${placeholders})
      ORDER BY se.start_time ASC
    `;

    const sourceEvents = await executeQuery<ScheduleEventRow[]>(
      eventsQuery,
      eventIds,
    );

    if (sourceEvents.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Занятия не найдены",
      });
    }

    // Определяем базовое время первого занятия
    const firstEventStart = new Date(sourceEvents[0].start_time);

    // Преобразуем занятия в формат шаблона
    const eventsData = sourceEvents.map((evt, index) => {
      const eventStart = new Date(evt.start_time);
      const eventEnd = new Date(evt.end_time);

      // Смещение от начала дня в минутах
      const startOffset = eventStart.getHours() * 60 + eventStart.getMinutes();

      // Длительность
      const durationMinutes =
        evt.duration_minutes ||
        Math.round((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60));

      return {
        title: evt.title,
        description: evt.description,
        disciplineId: evt.discipline_id,
        disciplineName: evt.discipline_name,
        instructorId: evt.instructor_id,
        instructorName: evt.instructor_name,
        classroomId: evt.classroom_id,
        classroomName: evt.classroom_name,
        eventType: evt.event_type,
        color: evt.color,
        startOffset,
        durationMinutes,
        academicHours: evt.academic_hours,
        orderIndex: index,
      };
    });

    // Создаем шаблон
    const templateId = uuidv4();
    const insertQuery = `
      INSERT INTO schedule_templates (
        id, name, description, source_group_id, events_data, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      templateId,
      name.trim(),
      description?.trim() || null,
      sourceGroupId || sourceEvents[0].group_id || null,
      JSON.stringify(eventsData),
      user.id,
    ]);

    // Логирование
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      templateId,
      `Шаблон расписания: ${name}`,
      {
        templateName: name,
        eventsCount: eventsData.length,
        sourceEventIds: eventIds,
      },
    );

    console.log(
      `[templates.post] Created template ${templateId} with ${eventsData.length} events`,
    );

    return {
      success: true,
      template: {
        id: templateId,
        name: name.trim(),
        description: description?.trim() || null,
        sourceGroupId: sourceGroupId || sourceEvents[0].group_id || null,
        eventsData,
        createdBy: user.id,
        isActive: true,
      },
    };
  } catch (error: any) {
    console.error("[templates.post] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Ошибка создания шаблона",
    });
  }
});
