/**
 * POST /api/schedule/retake
 * Создать пересдачу для занятия
 *
 * Body:
 * - originalEventId: string - ID оригинального занятия
 * - studentIds: string[] - Список студентов для пересдачи
 * - date: string - Дата пересдачи (YYYY-MM-DD)
 * - startTime: string - Время начала (HH:MM)
 * - endTime: string - Время окончания (HH:MM)
 * - instructorId?: string - ID преподавателя (опционально)
 * - classroomId?: string - ID аудитории (опционально)
 * - testTemplateId?: string - ID шаблона теста (если тип assessment)
 */

import { v4 as uuidv4 } from "uuid";
import { executeQuery, executeTransaction } from "../../utils/db";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";

interface OriginalEventRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  group_id: string;
  discipline_id: string;
  instructor_id: string | null;
  classroom_id: string | null;
  event_type: "theory" | "practice" | "assessment" | "other";
  notes: string | null;
}

interface TestAssignmentRow extends RowDataPacket {
  id: string;
  test_template_id: string;
}

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // Проверка роли
  const allowedRoles = ["ADMIN", "MANAGER", "MODERATOR"];
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: "Недостаточно прав для создания пересдачи",
    });
  }

  const body = await readBody(event);

  // Валидация обязательных полей
  if (!body.originalEventId) {
    throw createError({
      statusCode: 400,
      message: "Не указано оригинальное занятие (originalEventId)",
    });
  }

  if (
    !body.studentIds ||
    !Array.isArray(body.studentIds) ||
    body.studentIds.length === 0
  ) {
    throw createError({
      statusCode: 400,
      message: "Не указаны студенты для пересдачи (studentIds)",
    });
  }

  if (!body.date || !body.startTime || !body.endTime) {
    throw createError({
      statusCode: 400,
      message: "Не указаны дата и время пересдачи",
    });
  }

  console.log("[Retake API] Создание пересдачи:", {
    originalEventId: body.originalEventId,
    studentIds: body.studentIds,
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
  });

  try {
    // 1. Получаем оригинальное занятие
    const originalEvents = await executeQuery<OriginalEventRow[]>(
      `SELECT id, title, description, group_id, discipline_id, 
              instructor_id, classroom_id, event_type, notes
       FROM schedule_events 
       WHERE id = ?`,
      [body.originalEventId]
    );

    if (!originalEvents || originalEvents.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Оригинальное занятие не найдено",
      });
    }

    const originalEvent = originalEvents[0];

    // 2. Формируем datetime для пересдачи
    const startDateTime = new Date(`${body.date}T${body.startTime}:00`);
    const endDateTime = new Date(`${body.date}T${body.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw createError({
        statusCode: 400,
        message: "Некорректный формат даты или времени",
      });
    }

    if (endDateTime <= startDateTime) {
      throw createError({
        statusCode: 400,
        message: "Время окончания должно быть больше времени начала",
      });
    }

    // 3. Создаём событие пересдачи внутри транзакции
    const result = await executeTransaction(
      async (connection: PoolConnection) => {
        const retakeEventId = uuidv4();

        // Формируем название пересдачи
        const retakeTitle = `Пересдача: ${originalEvent.title}`;

        // Создаём событие расписания
        await connection.query(
          `INSERT INTO schedule_events (
          id, title, description, group_id, discipline_id, 
          instructor_id, classroom_id, start_time, end_time,
          is_all_day, color, event_type, is_recurring, 
          recurrence_rule, notes, original_event_id, allowed_student_ids, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            retakeEventId,
            retakeTitle,
            originalEvent.description ||
              `Пересдача занятия от ${new Date(body.date).toLocaleDateString(
                "ru-RU"
              )}`,
            originalEvent.group_id,
            originalEvent.discipline_id,
            body.instructorId || originalEvent.instructor_id,
            body.classroomId || originalEvent.classroom_id,
            startDateTime,
            endDateTime,
            false, // is_all_day
            "warning", // color - оранжевый для пересдач
            originalEvent.event_type,
            false, // is_recurring
            null, // recurrence_rule
            `Студенты на пересдаче: ${body.studentIds.length}`,
            body.originalEventId, // Связь с оригинальным занятием!
            JSON.stringify(body.studentIds), // <--- ВАЖНО: записываем список студентов
          ]
        );

        console.log("[Retake API] Создано событие пересдачи:", retakeEventId);

        // 4. Если это тестирование (assessment), создаём test_assignment с ограничением студентов
        if (originalEvent.event_type === "assessment") {
          // Получаем test_template_id из оригинального теста или из body
          let testTemplateId = body.testTemplateId;

          if (!testTemplateId) {
            // Пытаемся найти шаблон теста из оригинального занятия
            const [originalAssignments] = await connection.query<
              TestAssignmentRow[]
            >(
              `SELECT id, test_template_id FROM test_assignments 
             WHERE schedule_event_id = ? LIMIT 1`,
              [body.originalEventId]
            );

            if (originalAssignments && originalAssignments.length > 0) {
              testTemplateId = originalAssignments[0].test_template_id;
            }
          }

          if (testTemplateId) {
            const assignmentId = uuidv4();

            await connection.query(
              `INSERT INTO test_assignments (
              id, test_template_id, group_id, schedule_event_id,
              status, assigned_by, allowed_student_ids, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
              [
                assignmentId,
                testTemplateId,
                originalEvent.group_id,
                retakeEventId,
                "published",
                user.id,
                JSON.stringify(body.studentIds), // Ограничиваем доступ к тесту
              ]
            );

            console.log(
              "[Retake API] Создан test_assignment с ограничением студентов:",
              {
                assignmentId,
                testTemplateId,
                allowedStudents: body.studentIds.length,
              }
            );
          }
        }

        return {
          retakeEventId,
          title: retakeTitle,
          originalEventId: body.originalEventId,
          studentCount: body.studentIds.length,
        };
      }
    );

    // 5. Логируем создание пересдачи
    await logActivity(
      event,
      "CREATE",
      "SCHEDULE",
      result.retakeEventId,
      result.title,
      {
        originalEventId: body.originalEventId,
        studentIds: body.studentIds,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        isRetake: true,
      }
    );

    console.log("[Retake API] Пересдача успешно создана:", result);

    return {
      success: true,
      message: `Пересдача создана для ${result.studentCount} студентов`,
      retakeEventId: result.retakeEventId,
      originalEventId: result.originalEventId,
    };
  } catch (error: any) {
    console.error("[Retake API] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка создания пересдачи",
    });
  }
});
