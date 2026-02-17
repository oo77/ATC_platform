import { g as defineEventHandler, i as getQuery, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const schedule_get = defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const { organizationId } = query;
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const now = /* @__PURE__ */ new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 60);
    const events = await executeQuery(
      `SELECT DISTINCT
        DATE(se.start_time) AS date,
        se.start_time AS startTime,
        se.end_time AS endTime,
        se.event_type AS eventType,
        d.name AS disciplineName,
        i.full_name AS instructorName,
        c.name AS classroomName,
        g.code AS groupName
      FROM schedule_events se
      INNER JOIN study_groups g ON se.group_id = g.id
      INNER JOIN study_group_students sgs ON g.id = sgs.group_id
      INNER JOIN students s ON sgs.student_id = s.id
      INNER JOIN disciplines d ON se.discipline_id = d.id
      INNER JOIN instructors i ON se.instructor_id = i.id
      LEFT JOIN classrooms c ON se.classroom_id = c.id
      WHERE s.organization_id = ?
        AND se.start_time >= ?
        AND se.start_time <= ?
      ORDER BY se.start_time ASC`,
      [
        organizationId,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      ]
    );
    const formattedSchedule = events.map((e) => {
      const formatTime = (val) => {
        if (val instanceof Date) {
          return val.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit"
          });
        }
        return String(val || "").substring(0, 5);
      };
      const formatDate = (val) => {
        if (val instanceof Date) {
          const year = val.getFullYear();
          const month = String(val.getMonth() + 1).padStart(2, "0");
          const day = String(val.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }
        return String(val);
      };
      return {
        date: formatDate(e.date),
        startTime: formatTime(e.startTime),
        endTime: formatTime(e.endTime),
        eventType: e.eventType,
        disciplineName: e.disciplineName,
        instructorName: e.instructorName,
        location: e.classroomName || void 0,
        groupName: e.groupName
      };
    });
    return {
      success: true,
      schedule: formattedSchedule
    };
  } catch (error) {
    console.error("[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430"
    });
  }
});

export { schedule_get as default };
//# sourceMappingURL=schedule.get.mjs.map
