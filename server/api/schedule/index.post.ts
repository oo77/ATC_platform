/**
 * POST /api/schedule
 * Создание события расписания с валидацией часов и дат группы
 */

import { createScheduleEvent, checkScheduleConflicts } from '../../repositories/scheduleRepository';
import type { CreateScheduleEventInput } from '../../repositories/scheduleRepository';
import { checkInstructorHoursLimit } from '../../repositories/instructorRepository';
import { executeQuery } from '../../utils/db';
import { logActivity } from '../../utils/activityLogger';
import { dateToLocalIso, formatDateOnly, formatDateForDisplay } from '../../utils/timeUtils';
import type { RowDataPacket } from 'mysql2/promise';

interface GroupRow extends RowDataPacket {
  id: string;
  start_date: Date;
  end_date: Date;
  course_id: string;
}

interface DisciplineRow extends RowDataPacket {
  id: string;
  theory_hours: number;
  practice_hours: number;
  assessment_hours: number;
}

interface UsedHoursRow extends RowDataPacket {
  total_minutes: number;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateScheduleEventInput>(event);
    
    console.log('[Schedule API] Получены данные для создания занятия:', JSON.stringify(body, null, 2));

    // ===============================
    // БАЗОВАЯ ВАЛИДАЦИЯ
    // ===============================

    if (!body.title?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название события обязательно',
      });
    }

    if (!body.startTime || !body.endTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время начала и окончания обязательны',
      });
    }

    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время окончания должно быть позже времени начала',
      });
    }

    // ===============================
    // ВАЛИДАЦИЯ ГРУППЫ И ДАТ
    // ===============================

    if (body.groupId) {
      const groupRows = await executeQuery<GroupRow[]>(
        'SELECT id, start_date, end_date, course_id FROM study_groups WHERE id = ? LIMIT 1',
        [body.groupId]
      );

      if (groupRows.length === 0) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Группа не найдена',
        });
      }

      const group = groupRows[0];
      // Используем локальное форматирование для избежания сдвига временной зоны
      const eventDate = formatDateOnly(startTime);
      const groupStartDate = formatDateOnly(group.start_date);
      const groupEndDate = formatDateOnly(group.end_date);

      // Проверяем, что дата занятия входит в период обучения группы
      if (eventDate < groupStartDate || eventDate > groupEndDate) {
        throw createError({
          statusCode: 400,
          statusMessage: `Дата занятия должна быть в пределах периода обучения группы (${formatDateForDisplay(groupStartDate)} — ${formatDateForDisplay(groupEndDate)})`,
        });
      }

      // ===============================
      // ВАЛИДАЦИЯ ДИСЦИПЛИНЫ И ЧАСОВ
      // ===============================

      if (body.disciplineId && body.eventType && body.eventType !== 'other') {
        // Получаем информацию о дисциплине
        const disciplineRows = await executeQuery<DisciplineRow[]>(
          'SELECT id, theory_hours, practice_hours, assessment_hours FROM disciplines WHERE id = ? AND course_id = ? LIMIT 1',
          [body.disciplineId, group.course_id]
        );

        if (disciplineRows.length === 0) {
          throw createError({
            statusCode: 404,
            statusMessage: 'Дисциплина не найдена или не принадлежит учебной программе группы',
          });
        }

        const discipline = disciplineRows[0];
        
        // Получаем выделенные часы для данного типа занятия
        let allocatedHours = 0;
        const eventType = body.eventType as 'theory' | 'practice' | 'assessment';
        
        if (eventType === 'theory') {
          allocatedHours = discipline.theory_hours;
        } else if (eventType === 'practice') {
          allocatedHours = discipline.practice_hours;
        } else if (eventType === 'assessment') {
          allocatedHours = discipline.assessment_hours;
        }

        // Получаем уже использованные часы
        const usedHoursRows = await executeQuery<UsedHoursRow[]>(
          `SELECT SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
           FROM schedule_events
           WHERE group_id = ? AND discipline_id = ? AND event_type = ?`,
          [body.groupId, body.disciplineId, body.eventType]
        );

        const usedMinutes = usedHoursRows[0]?.total_minutes || 0;
        // Академический час = 45 минут
        const usedAcademicHours = Math.ceil(usedMinutes / 45);

        // Вычисляем длительность нового занятия в академических часах
        const newEventMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const newEventHours = Math.ceil(newEventMinutes / 45);

        const remainingHours = allocatedHours - usedAcademicHours;

        if (newEventHours > remainingHours) {
          const typeNames = {
            theory: 'теории',
            practice: 'практики',
            assessment: 'проверки знаний',
          };

          throw createError({
            statusCode: 400,
            statusMessage: `Превышение лимита часов для ${typeNames[eventType]}! Осталось ${remainingHours} ч., запрашивается ${newEventHours} ч.`,
          });
        }
      }
    }

    // ===============================
    // ПРОВЕРКА ЛИМИТА ЧАСОВ ИНСТРУКТОРА
    // ===============================

    if (body.instructorId) {
      // Вычисляем длительность нового занятия в минутах
      const eventDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      const hoursCheck = await checkInstructorHoursLimit(body.instructorId, eventDurationMinutes);
      
      if (!hoursCheck.canTake) {
        throw createError({
          statusCode: 400,
          statusMessage: hoursCheck.message || 'Превышен лимит часов инструктора по договору',
        });
      }
    }

    // ===============================
    // ПРОВЕРКА КОНФЛИКТОВ РАСПИСАНИЯ
    // ===============================

    if (body.classroomId || body.instructorId || body.groupId) {
      const conflicts = await checkScheduleConflicts(body.startTime, body.endTime, {
        classroomId: body.classroomId,
        instructorId: body.instructorId,
        groupId: body.groupId,
      });

      if (conflicts.length > 0) {
        const conflictMessages: string[] = [];
        
        for (const conflict of conflicts) {
          if (conflict.classroomId === body.classroomId && conflict.classroom) {
            conflictMessages.push(`Аудитория "${conflict.classroom.name}" занята`);
          }
          if (conflict.instructorId === body.instructorId && conflict.instructor) {
            conflictMessages.push(`Инструктор "${conflict.instructor.fullName}" занят`);
          }
          if (conflict.groupId === body.groupId && conflict.group) {
            conflictMessages.push(`Группа "${conflict.group.code}" занята`);
          }
        }

        if (conflictMessages.length > 0) {
          throw createError({
            statusCode: 409,
            statusMessage: `Конфликт расписания: ${[...new Set(conflictMessages)].join(', ')}`,
          });
        }
      }
    }

    // ===============================
    // СОЗДАНИЕ СОБЫТИЯ
    // ===============================

    const scheduleEvent = await createScheduleEvent(body);

    // Логирование действия
    await logActivity(
      event,
      'CREATE',
      'SCHEDULE',
      scheduleEvent.id,
      scheduleEvent.title,
      {
        startTime: scheduleEvent.startTime,
        endTime: scheduleEvent.endTime,
        groupId: body.groupId,
        disciplineId: body.disciplineId,
        instructorId: body.instructorId,
        classroomId: body.classroomId,
        eventType: body.eventType,
      }
    );

    return {
      success: true,
      event: {
        ...scheduleEvent,
        startTime: dateToLocalIso(scheduleEvent.startTime),
        endTime: dateToLocalIso(scheduleEvent.endTime),
        createdAt: scheduleEvent.createdAt.toISOString(),
        updatedAt: scheduleEvent.updatedAt.toISOString(),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error creating schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при создании события',
    });
  }
});
