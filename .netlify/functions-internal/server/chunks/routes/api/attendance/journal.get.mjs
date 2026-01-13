import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { g as getJournalData, c as calculateAcademicHours } from '../../../_/attendanceRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

const journal_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const groupId = query.groupId;
    const disciplineId = query.disciplineId;
    if (!groupId || !disciplineId) {
      throw createError({
        statusCode: 400,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C groupId \u0438 disciplineId"
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
    const columns = data.events.map((evt) => {
      const allowedStudentIds = evt.allowed_student_ids ? JSON.parse(evt.allowed_student_ids) : null;
      return {
        scheduleEvent: {
          id: evt.id,
          title: evt.title,
          date: evt.start_time.toISOString().split("T")[0],
          startTime: evt.start_time.toISOString(),
          endTime: evt.end_time.toISOString(),
          eventType: evt.event_type,
          academicHours: calculateAcademicHours(evt.start_time, evt.end_time),
          isRetake: allowedStudentIds !== null && allowedStudentIds.length > 0,
          allowedStudentIds,
          originalEventId: evt.original_event_id || null
          // Связь с оригинальным занятием
        },
        // Оценки доступны для проверки знаний (assessment) и практики (practice)
        hasGrade: evt.event_type === "assessment" || evt.event_type === "practice"
      };
    });
    const rows = data.students.map((student) => {
      const cells = data.events.map((evt) => {
        const allowedStudentIds = evt.allowed_student_ids ? JSON.parse(evt.allowed_student_ids) : null;
        const isRetake = allowedStudentIds !== null && allowedStudentIds.length > 0;
        if (isRetake && !allowedStudentIds.includes(student.student_id)) {
          return {
            studentId: student.student_id,
            scheduleEventId: evt.id,
            attendance: void 0,
            grade: void 0,
            isHidden: true
            // Маркер для фронтенда
          };
        }
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
            notes: attendance.notes
          } : void 0,
          grade: grade ? {
            id: grade.id,
            grade: grade.grade,
            notes: grade.notes,
            isFromTest: grade.isFromTest,
            isModified: grade.isModified,
            originalGrade: grade.originalGrade
          } : void 0,
          isHidden: false
        };
      });
      const totalHoursAttended = cells.reduce(
        (sum, cell) => sum + (cell.attendance?.hoursAttended || 0),
        0
      );
      const totalMaxHours = cells.reduce((sum, cell) => {
        if (cell.attendance?.maxHours) {
          return sum + cell.attendance.maxHours;
        }
        const col = columns.find(
          (c) => c.scheduleEvent.id === cell.scheduleEventId
        );
        return sum + (col?.scheduleEvent.academicHours || 0);
      }, 0);
      const gradesByBaseEvent = /* @__PURE__ */ new Map();
      cells.forEach((cell, index) => {
        if (cell.isHidden || !cell.grade) return;
        const column = columns[index];
        if (!column) return;
        const baseEventId = column.scheduleEvent.originalEventId || cell.scheduleEventId;
        const eventDate = new Date(column.scheduleEvent.startTime);
        const existing = gradesByBaseEvent.get(baseEventId);
        if (!existing || eventDate > existing.date) {
          gradesByBaseEvent.set(baseEventId, {
            grade: cell.grade.grade,
            date: eventDate
          });
        }
      });
      const gradeValues = Array.from(gradesByBaseEvent.values()).map(
        (g) => g.grade
      );
      const averageGrade = gradeValues.length > 0 ? Math.round(
        gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length * 100
      ) / 100 : void 0;
      const finalGrade = data.finalGrades.find(
        (fg) => fg.studentId === student.student_id
      );
      return {
        student: {
          id: student.student_id,
          fullName: student.full_name,
          organization: student.organization
        },
        cells,
        totalHoursAttended,
        totalMaxHours,
        attendancePercent: totalMaxHours > 0 ? Math.round(totalHoursAttended / totalMaxHours * 100 * 100) / 100 : 0,
        averageGrade,
        assessmentCount: gradeValues.length,
        finalGrade: finalGrade || void 0
      };
    });
    const summary = {
      totalStudents: rows.length,
      totalEvents: columns.length,
      averageAttendance: rows.length > 0 ? Math.round(
        rows.reduce((sum, r) => sum + r.attendancePercent, 0) / rows.length * 100
      ) / 100 : 0,
      passedCount: data.finalGrades.filter((fg) => fg.status === "passed").length,
      failedCount: data.finalGrades.filter((fg) => fg.status === "failed").length,
      inProgressCount: data.finalGrades.filter(
        (fg) => fg.status === "in_progress"
      ).length
    };
    await logActivity(
      event,
      "VIEW",
      "ATTENDANCE",
      `${groupId}:${disciplineId}`,
      "\u0416\u0443\u0440\u043D\u0430\u043B \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438",
      { groupId, disciplineId }
    );
    return {
      success: true,
      columns,
      rows,
      summary
    };
  } catch (error) {
    console.error("Error fetching journal data:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0436\u0443\u0440\u043D\u0430\u043B\u0430"
    });
  }
});

export { journal_get as default };
//# sourceMappingURL=journal.get.mjs.map
