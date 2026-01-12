/**
 * GET /api/groups/:id/disciplines
 * Получение дисциплин учебной программы группы с информацией о часах и инструкторах
 */

import { executeQuery } from '../../../utils/db';
import type { RowDataPacket } from 'mysql2/promise';

interface DisciplineRow extends RowDataPacket {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  hours: number;
  theory_hours: number;
  practice_hours: number;
  assessment_hours: number;
  order_index: number;
}

interface DisciplineInstructorRow extends RowDataPacket {
  discipline_id: string;
  instructor_id: string;
  is_primary: boolean;
  instructor_full_name: string;
  instructor_email: string | null;
}

interface UsedHoursRow extends RowDataPacket {
  discipline_id: string;
  event_type: string;
  total_minutes: number;
}

interface GroupRow extends RowDataPacket {
  id: string;
  course_id: string;
  start_date: Date;
  end_date: Date;
}

// Вспомогательная функция для форматирования даты без сдвига временной зоны
const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, 'id');

    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID группы не указан',
      });
    }

    // Получаем информацию о группе
    const groupRows = await executeQuery<GroupRow[]>(
      `SELECT id, course_id, start_date, end_date FROM study_groups WHERE id = ? LIMIT 1`,
      [groupId]
    );

    if (groupRows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Группа не найдена',
      });
    }

    const group = groupRows[0];

    // Получаем дисциплины курса
    const disciplineRows = await executeQuery<DisciplineRow[]>(
      `SELECT * FROM disciplines WHERE course_id = ? ORDER BY order_index, name`,
      [group.course_id]
    );

    if (disciplineRows.length === 0) {
      return {
        success: true,
        disciplines: [],
        group: {
          id: group.id,
          courseId: group.course_id,
          startDate: formatDateLocal(group.start_date),
          endDate: formatDateLocal(group.end_date),
        },
      };
    }

    const disciplineIds = disciplineRows.map(d => d.id);
    const placeholders = disciplineIds.map(() => '?').join(', ');

    // Получаем инструкторов для дисциплин
    const instructorRows = await executeQuery<DisciplineInstructorRow[]>(
      `SELECT 
        di.discipline_id,
        di.instructor_id,
        di.is_primary,
        i.full_name as instructor_full_name,
        i.email as instructor_email
      FROM discipline_instructors di
      JOIN instructors i ON di.instructor_id = i.id
      WHERE di.discipline_id IN (${placeholders}) AND i.is_active = true`,
      disciplineIds
    );

    // Получаем использованные часы по всем занятиям этой группы
    const usedHoursRows = await executeQuery<UsedHoursRow[]>(
      `SELECT 
        discipline_id,
        event_type,
        SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
      FROM schedule_events
      WHERE group_id = ? AND discipline_id IN (${placeholders})
      GROUP BY discipline_id, event_type`,
      [groupId, ...disciplineIds]
    );

    // Группируем инструкторов по дисциплинам
    const instructorsByDiscipline = new Map<string, Array<{
      id: string;
      fullName: string;
      email: string | null;
      isPrimary: boolean;
    }>>();

    for (const row of instructorRows) {
      const list = instructorsByDiscipline.get(row.discipline_id) || [];
      list.push({
        id: row.instructor_id,
        fullName: row.instructor_full_name,
        email: row.instructor_email,
        isPrimary: Boolean(row.is_primary),
      });
      instructorsByDiscipline.set(row.discipline_id, list);
    }

    // Группируем использованные часы по дисциплинам и типам
    const usedHoursByDiscipline = new Map<string, {
      theory: number;
      practice: number;
      assessment: number;
    }>();

    for (const row of usedHoursRows) {
      const hours = usedHoursByDiscipline.get(row.discipline_id) || {
        theory: 0,
        practice: 0,
        assessment: 0,
      };

      // Переводим минуты в часы (академические часы = 45 минут)
      const academicHours = Math.ceil(row.total_minutes / 45);

      if (row.event_type === 'theory') {
        hours.theory = academicHours;
      } else if (row.event_type === 'practice') {
        hours.practice = academicHours;
      } else if (row.event_type === 'assessment') {
        hours.assessment = academicHours;
      }

      usedHoursByDiscipline.set(row.discipline_id, hours);
    }

    // Формируем результат
    const disciplines = disciplineRows.map(row => {
      const usedHours = usedHoursByDiscipline.get(row.id) || {
        theory: 0,
        practice: 0,
        assessment: 0,
      };

      return {
        id: row.id,
        courseId: row.course_id,
        name: row.name,
        description: row.description,
        orderIndex: row.order_index,
        // Общие выделенные часы
        totalHours: {
          theory: row.theory_hours,
          practice: row.practice_hours,
          assessment: row.assessment_hours,
        },
        // Использованные часы
        usedHours,
        // Оставшиеся часы
        remainingHours: {
          theory: Math.max(0, row.theory_hours - usedHours.theory),
          practice: Math.max(0, row.practice_hours - usedHours.practice),
          assessment: Math.max(0, row.assessment_hours - usedHours.assessment),
        },
        // Инструкторы дисциплины
        instructors: instructorsByDiscipline.get(row.id) || [],
      };
    });

    return {
      success: true,
      disciplines,
      group: {
        id: group.id,
        courseId: group.course_id,
        startDate: formatDateLocal(group.start_date),
        endDate: formatDateLocal(group.end_date),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    console.error('Error fetching group disciplines:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка при получении дисциплин группы',
    });
  }
});
