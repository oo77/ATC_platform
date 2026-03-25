/**
 * GET /api/instructors/:id/course-history
 * Получить историю курсов инструктора (пройденные занятия с информацией о посещаемости и оценках)
 */

import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";
import { getAcademicHourMinutes } from "../../../utils/academicHours";

interface CourseHistoryRow extends RowDataPacket {
  event_id: string;
  event_title: string;
  event_date: Date;
  event_start_time: Date;
  event_end_time: Date;
  event_type: "theory" | "practice" | "assessment" | "other";
  academic_hours: number;
  group_id: string;
  group_code: string;
  course_name: string;
  discipline_name: string;
  total_students: number;
  students_marked: number;
  students_graded: number;
  avg_attendance_hours: number;
  avg_grade: number | null;
}

interface CourseHistoryEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: "theory" | "practice" | "assessment" | "other";
  academicHours: number;
  group: {
    id: string;
    code: string;
    courseName: string;
  };
  discipline: {
    name: string;
  };
  statistics: {
    totalStudents: number;
    studentsMarked: number;
    studentsGraded: number;
    avgAttendanceHours: number;
    avgGrade: number | null;
    completionPercent: number;
  };
}

export default defineEventHandler(async (event) => {
  try {
    const instructorId = getRouterParam(event, "id");
    const query = getQuery(event);

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const offset = (page - 1) * limit;

    if (!instructorId) {
      throw createError({
        statusCode: 400,
        message: "ID инструктора обязателен",
      });
    }

    // Проверяем существование инструктора
    const instructorCheck = await executeQuery<RowDataPacket[]>(
      "SELECT id FROM instructors WHERE id = ?",
      [instructorId],
    );

    if (instructorCheck.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Инструктор не найден",
      });
    }

    // Получаем длительность академического часа из настроек
    const academicHourMinutes = await getAcademicHourMinutes();

    // 1. Получаем глобальную статистику и общее количество (для пагинации)
    const statsSql = `
      SELECT 
        COUNT(se.id) as total_events,
        SUM(COALESCE(se.academic_hours, CEIL(COALESCE(se.duration_minutes, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) / ?))) as total_hours,
        SUM(IF(se.event_type = 'theory', 1, 0)) as theory_events,
        SUM(IF(se.event_type = 'practice', 1, 0)) as practice_events,
        SUM(IF(se.event_type = 'assessment', 1, 0)) as assessment_events
      FROM schedule_events se
      WHERE se.instructor_id = ?
        AND se.end_time < NOW()
    `;
    const [statsResult] = await executeQuery<RowDataPacket[]>(statsSql, [
      academicHourMinutes,
      instructorId,
    ]);
    const globalStats = statsResult || {
      total_events: 0,
      total_hours: 0,
      theory_events: 0,
      practice_events: 0,
      assessment_events: 0
    };
    
    const totalItems = Number(globalStats.total_events || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // 2. Получаем историю занятий на текущей странице с агрегированной статистикой
    const sql = `
      SELECT 
        se.id as event_id,
        se.title as event_title,
        DATE(se.start_time) as event_date,
        se.start_time as event_start_time,
        se.end_time as event_end_time,
        se.event_type,
        COALESCE(se.academic_hours, CEIL(COALESCE(se.duration_minutes, TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time)) / ?)) as academic_hours,
        sg.id as group_id,
        sg.code as group_code,
        c.name as course_name,
        d.name as discipline_name,
        COUNT(DISTINCT sgs.student_id) as total_students,
        COUNT(DISTINCT a.student_id) as students_marked,
        COUNT(DISTINCT g.student_id) as students_graded,
        COALESCE(AVG(a.hours_attended), 0) as avg_attendance_hours,
        AVG(g.grade) as avg_grade
      FROM schedule_events se
      LEFT JOIN study_groups sg ON se.group_id = sg.id
      LEFT JOIN courses c ON sg.course_id = c.id
      LEFT JOIN disciplines d ON se.discipline_id = d.id
      LEFT JOIN study_group_students sgs ON sg.id = sgs.group_id
      LEFT JOIN attendance a ON se.id = a.schedule_event_id
      LEFT JOIN grades g ON se.id = g.schedule_event_id
      WHERE se.instructor_id = ?
        AND se.end_time < NOW()
      GROUP BY 
        se.id, se.title, se.start_time, se.end_time, se.event_type,
        sg.id, sg.code, c.name, d.name
      ORDER BY se.start_time DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await executeQuery<CourseHistoryRow[]>(sql, [
      academicHourMinutes,
      instructorId,
      limit,
      offset,
    ]);

    // Форматируем результаты
    const history: CourseHistoryEvent[] = rows.map((row) => {
      const totalStudents = Number(row.total_students);
      const studentsMarked = Number(row.students_marked);
      const studentsGraded = Number(row.students_graded);

      // Для теории и практики смотрим на посещаемость, для проверки знаний - на оценки
      const completionPercent =
        row.event_type === "assessment"
          ? totalStudents > 0
            ? Math.round((studentsGraded / totalStudents) * 100)
            : 0
          : totalStudents > 0
            ? Math.round((studentsMarked / totalStudents) * 100)
            : 0;

      return {
        id: row.event_id,
        title: row.event_title,
        date: row.event_date.toISOString().split("T")[0],
        startTime: row.event_start_time.toISOString(),
        endTime: row.event_end_time.toISOString(),
        eventType: row.event_type,
        academicHours: Math.round(Number(row.academic_hours) * 10) / 10,
        group: {
          id: row.group_id,
          code: row.group_code,
          courseName: row.course_name,
        },
        discipline: {
          name: row.discipline_name,
        },
        statistics: {
          totalStudents,
          studentsMarked,
          studentsGraded,
          avgAttendanceHours:
            Math.round(Number(row.avg_attendance_hours) * 10) / 10,
          avgGrade: row.avg_grade
            ? Math.round(Number(row.avg_grade) * 10) / 10
            : null,
          completionPercent,
        },
      };
    });

    return {
      success: true,
      history,
      total: totalItems,
      page,
      limit,
      totalPages,
      summary: {
        totalEvents: Number(globalStats.total_events || 0),
        totalHours: Math.round(Number(globalStats.total_hours || 0) * 10) / 10,
        theoryEvents: Number(globalStats.theory_events || 0),
        practiceEvents: Number(globalStats.practice_events || 0),
        assessmentEvents: Number(globalStats.assessment_events || 0),
      },
    };
  } catch (error: any) {
    console.error("[Instructor Course History] Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Ошибка при загрузке истории курсов",
    });
  }
});
