/**
 * GET /api/attendance/journal
 * Получить данные журнала посещаемости и оценок
 */

import {
  getJournalData,
  calculateAcademicHours,
} from "../../repositories/attendanceRepository";
import { logActivity } from "../../utils/activityLogger";
import type { RowDataPacket } from "mysql2/promise";

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: "theory" | "practice" | "assessment" | "other";
    academicHours: number;
    isRetake: boolean;
    allowedStudentIds: string[] | null;
    originalEventId: string | null; // ID оригинального события для пересдач
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
  isHidden?: boolean;
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
        message: "Необходимо указать groupId и disciplineId",
      });
    }

    console.log(
      "[Journal API] Loading journal for groupId:",
      groupId,
      "disciplineId:",
      disciplineId
    );

    const data = await getJournalData(groupId, disciplineId);

    console.log(
      "[Journal API] Found events:",
      data.events.length,
      "students:",
      data.students.length
    );

    // Формируем столбцы (занятия)
    const columns: JournalColumn[] = data.events.map((evt) => {
      const allowedStudentIds = evt.allowed_student_ids
        ? JSON.parse(evt.allowed_student_ids)
        : null;

      return {
        scheduleEvent: {
          id: evt.id,
          title: evt.title,
          date: evt.start_time.toISOString().split("T")[0],
          startTime: evt.start_time.toISOString(),
          endTime: evt.end_time.toISOString(),
          eventType: evt.event_type as
            | "theory"
            | "practice"
            | "assessment"
            | "other",
          academicHours: calculateAcademicHours(evt.start_time, evt.end_time),
          isRetake: allowedStudentIds !== null && allowedStudentIds.length > 0,
          allowedStudentIds: allowedStudentIds,
          originalEventId: evt.original_event_id || null, // Связь с оригинальным занятием
        },
        // Оценки доступны для проверки знаний (assessment) и практики (practice)
        hasGrade:
          evt.event_type === "assessment" || evt.event_type === "practice",
      };
    });

    // Формируем строки (студенты)
    const rows: JournalRow[] = data.students.map((student) => {
      // Ячейки для каждого занятия
      const cells: JournalCell[] = data.events.map((evt) => {
        // Проверяем, является ли это пересдачей
        const allowedStudentIds = evt.allowed_student_ids
          ? JSON.parse(evt.allowed_student_ids)
          : null;
        const isRetake =
          allowedStudentIds !== null && allowedStudentIds.length > 0;

        // Если это пересдача и студент не в списке разрешенных - возвращаем пустую ячейку
        if (isRetake && !allowedStudentIds.includes(student.student_id)) {
          return {
            studentId: student.student_id,
            scheduleEventId: evt.id,
            attendance: undefined,
            grade: undefined,
            isHidden: true, // Маркер для фронтенда
          };
        }

        const attendance = data.attendances.find(
          (a) =>
            a.studentId === student.student_id && a.scheduleEventId === evt.id
        );
        const grade = data.grades.find(
          (g) =>
            g.studentId === student.student_id && g.scheduleEventId === evt.id
        );

        return {
          studentId: student.student_id,
          scheduleEventId: evt.id,
          attendance: attendance
            ? {
                id: attendance.id,
                hoursAttended: attendance.hoursAttended,
                maxHours: attendance.maxHours,
                notes: attendance.notes,
              }
            : undefined,
          grade: grade
            ? {
                id: grade.id,
                grade: grade.grade,
                notes: grade.notes,
                isFromTest: grade.isFromTest,
                isModified: grade.isModified,
                originalGrade: grade.originalGrade,
              }
            : undefined,
          isHidden: false,
        };
      });

      // Расчёт статистики
      // Исключаем скрытые ячейки (перездачи для других студентов)
      const totalHoursAttended = cells.reduce((sum: number, cell) => {
        if (cell.isHidden) return sum;
        return sum + (cell.attendance?.hoursAttended || 0);
      }, 0);

      const totalMaxHours = cells.reduce((sum: number, cell) => {
        // Пропускаем скрытые ячейки (перездачи для других студентов)
        if (cell.isHidden) return sum;

        if (cell.attendance?.maxHours) {
          return sum + cell.attendance.maxHours;
        }
        const col = columns.find(
          (c) => c.scheduleEvent.id === cell.scheduleEventId
        );
        return sum + (col?.scheduleEvent.academicHours || 0);
      }, 0);

      // Средняя оценка с учётом связанных пересдач
      // Для каждого "базового" занятия берём только последнюю оценку
      const gradesByBaseEvent = new Map<
        string,
        { grade: number; date: Date }
      >();

      cells.forEach((cell, index) => {
        if (cell.isHidden || !cell.grade) return;

        const column = columns[index];
        if (!column) return;

        // Определяем базовое событие (оригинал или само событие)
        const baseEventId =
          column.scheduleEvent.originalEventId || cell.scheduleEventId;
        const eventDate = new Date(column.scheduleEvent.startTime);

        const existing = gradesByBaseEvent.get(baseEventId);

        // Берём более позднюю оценку (пересдача всегда позже)
        if (!existing || eventDate > existing.date) {
          gradesByBaseEvent.set(baseEventId, {
            grade: cell.grade.grade,
            date: eventDate,
          });
        }
      });

      const gradeValues = Array.from(gradesByBaseEvent.values()).map(
        (g) => g.grade
      );
      const averageGrade =
        gradeValues.length > 0
          ? Math.round(
              (gradeValues.reduce((a: number, b: number) => a + b, 0) /
                gradeValues.length) *
                100
            ) / 100
          : undefined;

      // Итоговая оценка
      const finalGrade = data.finalGrades.find(
        (fg) => fg.studentId === student.student_id
      );

      return {
        student: {
          id: student.student_id,
          fullName: student.full_name,
          organization: student.organization,
        },
        cells,
        totalHoursAttended,
        totalMaxHours,
        attendancePercent:
          totalMaxHours > 0
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
      averageAttendance:
        rows.length > 0
          ? Math.round(
              (rows.reduce((sum: number, r) => sum + r.attendancePercent, 0) /
                rows.length) *
                100
            ) / 100
          : 0,
      passedCount: data.finalGrades.filter((fg) => fg.status === "passed")
        .length,
      failedCount: data.finalGrades.filter((fg) => fg.status === "failed")
        .length,
      inProgressCount: data.finalGrades.filter(
        (fg) => fg.status === "in_progress"
      ).length,
    };

    // Логируем просмотр журнала
    await logActivity(
      event,
      "VIEW",
      "ATTENDANCE",
      `${groupId}:${disciplineId}`,
      "Журнал посещаемости",
      { groupId, disciplineId }
    );

    return {
      success: true,
      columns,
      rows,
      summary,
    };
  } catch (error: any) {
    console.error("Error fetching journal data:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка при загрузке журнала",
    });
  }
});
