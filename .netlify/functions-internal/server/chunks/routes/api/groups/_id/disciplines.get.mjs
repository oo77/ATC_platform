import { d as defineEventHandler, a as getRouterParam, c as createError, e as executeQuery } from '../../../../nitro/nitro.mjs';
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

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const disciplines_get = defineEventHandler(async (event) => {
  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) {
      throw createError({
        statusCode: 400,
        statusMessage: "ID \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      });
    }
    const groupRows = await executeQuery(
      `SELECT id, course_id, start_date, end_date FROM study_groups WHERE id = ? LIMIT 1`,
      [groupId]
    );
    if (groupRows.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430"
      });
    }
    const group = groupRows[0];
    const disciplineRows = await executeQuery(
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
          endDate: formatDateLocal(group.end_date)
        }
      };
    }
    const disciplineIds = disciplineRows.map((d) => d.id);
    const placeholders = disciplineIds.map(() => "?").join(", ");
    const instructorRows = await executeQuery(
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
    const usedHoursRows = await executeQuery(
      `SELECT 
        discipline_id,
        event_type,
        SUM(TIMESTAMPDIFF(MINUTE, start_time, end_time)) as total_minutes
      FROM schedule_events
      WHERE group_id = ? AND discipline_id IN (${placeholders})
      GROUP BY discipline_id, event_type`,
      [groupId, ...disciplineIds]
    );
    const instructorsByDiscipline = /* @__PURE__ */ new Map();
    for (const row of instructorRows) {
      const list = instructorsByDiscipline.get(row.discipline_id) || [];
      list.push({
        id: row.instructor_id,
        fullName: row.instructor_full_name,
        email: row.instructor_email,
        isPrimary: Boolean(row.is_primary)
      });
      instructorsByDiscipline.set(row.discipline_id, list);
    }
    const usedHoursByDiscipline = /* @__PURE__ */ new Map();
    for (const row of usedHoursRows) {
      const hours = usedHoursByDiscipline.get(row.discipline_id) || {
        theory: 0,
        practice: 0,
        assessment: 0
      };
      const academicHours = Math.ceil(row.total_minutes / 45);
      if (row.event_type === "theory") {
        hours.theory = academicHours;
      } else if (row.event_type === "practice") {
        hours.practice = academicHours;
      } else if (row.event_type === "assessment") {
        hours.assessment = academicHours;
      }
      usedHoursByDiscipline.set(row.discipline_id, hours);
    }
    const disciplines = disciplineRows.map((row) => {
      const usedHours = usedHoursByDiscipline.get(row.id) || {
        theory: 0,
        practice: 0,
        assessment: 0
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
          assessment: row.assessment_hours
        },
        // Использованные часы
        usedHours,
        // Оставшиеся часы
        remainingHours: {
          theory: Math.max(0, row.theory_hours - usedHours.theory),
          practice: Math.max(0, row.practice_hours - usedHours.practice),
          assessment: Math.max(0, row.assessment_hours - usedHours.assessment)
        },
        // Инструкторы дисциплины
        instructors: instructorsByDiscipline.get(row.id) || []
      };
    });
    return {
      success: true,
      disciplines,
      group: {
        id: group.id,
        courseId: group.course_id,
        startDate: formatDateLocal(group.start_date),
        endDate: formatDateLocal(group.end_date)
      }
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    console.error("Error fetching group disciplines:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D \u0433\u0440\u0443\u043F\u043F\u044B"
    });
  }
});

export { disciplines_get as default };
//# sourceMappingURL=disciplines.get.mjs.map
