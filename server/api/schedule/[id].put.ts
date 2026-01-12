/**
 * PUT /api/schedule/[id]
 * Обновление события расписания с валидацией часов и дат группы
 */

import { updateScheduleEvent, checkScheduleConflicts, getScheduleEventById } from '../../repositories/scheduleRepository';
import type { UpdateScheduleEventInput } from '../../repositories/scheduleRepository';
import { checkInstructorHoursLimit } from '../../repositories/instructorRepository';
import { executeQuery } from '../../utils/db';
import { logActivity } from '../../utils/activityLogger';
import { dateToLocalIso, dateToLocalIsoString, formatDateOnly, formatDateForDisplay } from '../../utils/timeUtils';
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
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID события обязателен',
      });
    }

    const existing = await getScheduleEventById(id);
    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    const body = await readBody<UpdateScheduleEventInput>(event);

    // Валидация времени
    const startTime = body.startTime ? new Date(body.startTime) : existing.startTime;
    const endTime = body.endTime ? new Date(body.endTime) : existing.endTime;

    if (endTime <= startTime) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Время окончания должно быть позже времени начала',
      });
    }

    // Определяем финальные значения для валидации
    const finalGroupId = body.groupId !== undefined ? body.groupId : existing.groupId;
    const finalDisciplineId = body.disciplineId !== undefined ? body.disciplineId : existing.disciplineId;
    const finalEventType = body.eventType !== undefined ? body.eventType : existing.eventType;
    const checkClassroom = body.classroomId !== undefined ? body.classroomId : existing.classroomId;
    const checkInstructor = body.instructorId !== undefined ? body.instructorId : existing.instructorId;

    // ===============================
    // ВАЛИДАЦИЯ ГРУППЫ И ДАТ
    // ===============================

    if (finalGroupId) {
      const groupRows = await executeQuery<GroupRow[]>(
        'SELECT id, start_date, end_date, course_id FROM study_groups WHERE id = ? LIMIT 1',
        [finalGroupId]
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

      if (finalDisciplineId && finalEventType && finalEventType !== 'other') {
        // Получаем информацию о дисциплине
        const disciplineRows = await executeQuery<DisciplineRow[]>(
          'SELECT id, theory_hours, practice_hours, assessment_hours FROM disciplines WHERE id = ? AND course_id = ? LIMIT 1',
          [finalDisciplineId, group.course_id]
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
        const eventType = finalEventType as 'theory' | 'practice' | 'assessment';
        
        if (eventType === 'theory') {
          allocatedHours = discipline.theory_hours;
        } else if (eventType === 'practice') {
          allocatedHours = discipline.practice_hours;
        } else if (eventType === 'assessment') {
          allocatedHours = discipline.assessment_hours;
        }

        // Получаем уже использованные часы (исключая текущее событие)
        const usedHoursRows = await executeQuery<UsedHoursRow[]>(
          `SELECT SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
           FROM schedule_events
           WHERE group_id = ? AND discipline_id = ? AND event_type = ? AND id != ?`,
          [finalGroupId, finalDisciplineId, finalEventType, id]
        );

        const usedMinutes = usedHoursRows[0]?.total_minutes || 0;
        // Академический час = 45 минут
        const usedAcademicHours = Math.ceil(usedMinutes / 45);

        // Вычисляем длительность занятия в академических часах
        const eventMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const eventHours = Math.ceil(eventMinutes / 45);

        const remainingHours = allocatedHours - usedAcademicHours;

        if (eventHours > remainingHours) {
          const typeNames = {
            theory: 'теории',
            practice: 'практики',
            assessment: 'проверки знаний',
          };

          throw createError({
            statusCode: 400,
            statusMessage: `Превышение лимита часов для ${typeNames[eventType]}! Осталось ${remainingHours} ч., запрашивается ${eventHours} ч.`,
          });
        }
      }
    }

    // ===============================
    // ПРОВЕРКА ЛИМИТА ЧАСОВ ИНСТРУКТОРА
    // ===============================

    if (checkInstructor) {
      // Вычисляем длительность занятия в минутах
      const eventDurationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      
      // Если меняется инструктор или время — проверяем лимит
      // При смене инструктора проверяем нового, иначе — только если изменилось время
      const instructorChanged = body.instructorId !== undefined && body.instructorId !== existing.instructorId;
      const timeChanged = body.startTime !== undefined || body.endTime !== undefined;
      
      if (instructorChanged || timeChanged) {
        // Вычисляем старую длительность для учёта в лимите
        const oldDurationMinutes = instructorChanged 
          ? 0 // Новый инструктор не имел этих часов, проверяем полную длительность
          : (existing.endTime.getTime() - existing.startTime.getTime()) / (1000 * 60);
        
        // При смене инструктора проверяем полную длительность, иначе только разницу (если увеличиваем)
        const additionalMinutes = instructorChanged 
          ? eventDurationMinutes 
          : Math.max(0, eventDurationMinutes - oldDurationMinutes);
        
        if (additionalMinutes > 0) {
          const hoursCheck = await checkInstructorHoursLimit(checkInstructor, additionalMinutes);
          
          if (!hoursCheck.canTake) {
            throw createError({
              statusCode: 400,
              statusMessage: hoursCheck.message || 'Превышен лимит часов инструктора по договору',
            });
          }
        }
      }
    }

    // ===============================
    // ПРОВЕРКА КОНФЛИКТОВ РАСПИСАНИЯ
    // ===============================

    if (checkClassroom || checkInstructor || finalGroupId) {
      const conflicts = await checkScheduleConflicts(
        dateToLocalIsoString(startTime),
        dateToLocalIsoString(endTime),
        {
          classroomId: checkClassroom || undefined,
          instructorId: checkInstructor || undefined,
          groupId: finalGroupId || undefined,
          excludeEventId: id,
        }
      );

      if (conflicts.length > 0) {
        const conflictMessages: string[] = [];
        
        for (const conflict of conflicts) {
          if (conflict.classroomId === checkClassroom && conflict.classroom) {
            conflictMessages.push(`Аудитория "${conflict.classroom.name}" занята`);
          }
          if (conflict.instructorId === checkInstructor && conflict.instructor) {
            conflictMessages.push(`Инструктор "${conflict.instructor.fullName}" занят`);
          }
          if (conflict.groupId === finalGroupId && conflict.group) {
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
    // ОБНОВЛЕНИЕ СОБЫТИЯ
    // ===============================

    const scheduleEvent = await updateScheduleEvent(id, body);

    if (!scheduleEvent) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Событие не найдено',
      });
    }

    // Логирование действия
    await logActivity(
      event,
      'UPDATE',
      'SCHEDULE',
      scheduleEvent.id,
      scheduleEvent.title,
      {
        changes: body,
        previousTitle: existing.title,
        groupId: finalGroupId,
        disciplineId: finalDisciplineId,
        eventType: finalEventType,
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
    console.error('Error updating schedule event:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при обновлении события',
    });
  }
});
