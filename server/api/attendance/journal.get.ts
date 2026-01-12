/**
 * GET /api/attendance/journal
 * Получить данные журнала посещаемости и оценок
 */

import { getJournalData, calculateAcademicHours } from '../../repositories/attendanceRepository';
import { logActivity } from '../../utils/activityLogger';
import type { RowDataPacket } from 'mysql2/promise';

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: 'theory' | 'practice' | 'assessment' | 'other';
    academicHours: number;
  };
  hasGrade: boolean;
}

interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes: string | null;
  };
  grade?: {
    id: string;
    grade: number;
    notes: string | null;
    isFromTest: boolean;
    isModified: boolean;
    originalGrade: number | null;
  };
}

interface JournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string | null;
  };
  cells: JournalCell[];
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  averageGrade?: number;
  assessmentCount: number;
  finalGrade?: any;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const groupId = query.groupId as string;
    const disciplineId = query.disciplineId as string;

    if (!groupId || !disciplineId) {
      throw createError({
        statusCode: 400,
        message: 'Необходимо указать groupId и disciplineId',
      });
    }

    console.log('[Journal API] Loading journal for groupId:', groupId, 'disciplineId:', disciplineId);

    const data = await getJournalData(groupId, disciplineId);

    console.log('[Journal API] Found events:', data.events.length, 'students:', data.students.length);

    // Формируем столбцы (занятия)
    const columns: JournalColumn[] = data.events.map((evt) => ({
      scheduleEvent: {
        id: evt.id,
        title: evt.title,
        date: evt.start_time.toISOString().split('T')[0],
        startTime: evt.start_time.toISOString(),
        endTime: evt.end_time.toISOString(),
        eventType: evt.event_type as 'theory' | 'practice' | 'assessment' | 'other',
        academicHours: calculateAcademicHours(evt.start_time, evt.end_time),
      },
      hasGrade: evt.event_type === 'assessment',
    }));

    // Формируем строки (студенты)
    const rows: JournalRow[] = data.students.map((student) => {
      // Ячейки для каждого занятия
      const cells: JournalCell[] = data.events.map((evt) => {
        const attendance = data.attendances.find(
          (a) => a.studentId === student.student_id && a.scheduleEventId === evt.id
        );
        const grade = data.grades.find(
          (g) => g.studentId === student.student_id && g.scheduleEventId === evt.id
        );

        return {
          studentId: student.student_id,
          scheduleEventId: evt.id,
          attendance: attendance ? {
            id: attendance.id,
            hoursAttended: attendance.hoursAttended,
            maxHours: attendance.maxHours,
            notes: attendance.notes,
          } : undefined,
          grade: grade ? {
            id: grade.id,
            grade: grade.grade,
            notes: grade.notes,
            isFromTest: grade.isFromTest,
            isModified: grade.isModified,
            originalGrade: grade.originalGrade,
          } : undefined,
        };
      });

      // Расчёт статистики
      const totalHoursAttended = cells.reduce((sum: number, cell) =>
        sum + (cell.attendance?.hoursAttended || 0), 0
      );

      const totalMaxHours = cells.reduce((sum: number, cell) => {
        if (cell.attendance?.maxHours) {
          return sum + cell.attendance.maxHours;
        }
        const col = columns.find((c) => c.scheduleEvent.id === cell.scheduleEventId);
        return sum + (col?.scheduleEvent.academicHours || 0);
      }, 0);

      // Средняя оценка
      const gradeValues = cells
        .filter((cell) => cell.grade)
        .map((cell) => cell.grade!.grade);
      const averageGrade = gradeValues.length > 0
        ? Math.round(gradeValues.reduce((a: number, b: number) => a + b, 0) / gradeValues.length * 100) / 100
        : undefined;

      // Итоговая оценка
      const finalGrade = data.finalGrades.find((fg) => fg.studentId === student.student_id);

      return {
        student: {
          id: student.student_id,
          fullName: student.full_name,
          organization: student.organization,
        },
        cells,
        totalHoursAttended,
        totalMaxHours,
        attendancePercent: totalMaxHours > 0
          ? Math.round((totalHoursAttended / totalMaxHours) * 100 * 100) / 100
          : 0,
        averageGrade,
        assessmentCount: gradeValues.length,
        finalGrade: finalGrade || undefined,
      };
    });

    // Общая статистика
    const summary = {
      totalStudents: rows.length,
      totalEvents: columns.length,
      averageAttendance: rows.length > 0
        ? Math.round(rows.reduce((sum: number, r) => sum + r.attendancePercent, 0) / rows.length * 100) / 100
        : 0,
      passedCount: data.finalGrades.filter((fg) => fg.status === 'passed').length,
      failedCount: data.finalGrades.filter((fg) => fg.status === 'failed').length,
      inProgressCount: data.finalGrades.filter((fg) => fg.status === 'in_progress').length,
    };

    // Логируем просмотр журнала
    await logActivity(
      event,
      'VIEW',
      'ATTENDANCE',
      `${groupId}:${disciplineId}`,
      'Журнал посещаемости',
      { groupId, disciplineId }
    );

    return {
      success: true,
      columns,
      rows,
      summary,
    };
  } catch (error: any) {
    console.error('Error fetching journal data:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при загрузке журнала',
    });
  }
});
