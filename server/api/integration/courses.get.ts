import { defineEventHandler, getHeader, createError, getMethod } from "h3";
import { executeQuery } from "../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface CourseRow extends RowDataPacket {
  code: string;
  name: string;
  short_name: string;
  description: string | null;
  course_type: "КПП" | "КПК";
  total_hours: number;
  is_active: boolean;
}

async function verifyPlannerToken(event: any) {
  if (getMethod(event) === "OPTIONS") return;

  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, message: "Unauthorized: Bearer token required" });
  }
  const token = authHeader.substring(7);
  const expectedToken = process.env.PLANNER_API_TOKEN;
  if (!expectedToken) {
    throw createError({ statusCode: 500, message: "Server configuration error" });
  }
  if (token !== expectedToken) {
    throw createError({ statusCode: 401, message: "Invalid token" });
  }
}

export default defineEventHandler(async (event) => {
  await verifyPlannerToken(event);

  console.log("[Integration] GET /api/integration/courses");

  const sql = `
    SELECT code, name, short_name, description, course_type, total_hours, is_active
    FROM courses
    WHERE is_active = 1
      AND (is_archived = 0 OR is_archived IS NULL)
    ORDER BY name ASC
  `;

  const rows = await executeQuery<CourseRow[]>(sql);

  const courses = rows.map((row) => ({
    code: row.code,
    name: row.name,
    shortName: row.short_name,
    description: row.description,
    courseType: row.course_type,
    totalHours: row.total_hours,
    isActive: Boolean(row.is_active),
  }));

  console.log(`[Integration] ${courses.length} courses found`);

  return {
    success: true,
    courses,
  };
});