/**
 * API: Получение списка шаблонов расписания
 * GET /api/schedule/templates
 */

import { executeQuery } from "../../../utils/db";
import type { RowDataPacket } from "mysql2/promise";

interface TemplateRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  source_group_id: string | null;
  events_data: string;
  created_by: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  source_group_code: string | null;
  created_by_name: string | null;
}

export default defineEventHandler(async (event) => {
  // Проверка авторизации
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Требуется авторизация",
    });
  }

  // Проверка прав (только ADMIN и MANAGER)
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Недостаточно прав для просмотра шаблонов",
    });
  }

  console.log(`[templates.get] User ${user.id} fetching templates`);

  try {
    const query = `
      SELECT 
        st.id,
        st.name,
        st.description,
        st.source_group_id,
        st.events_data,
        st.created_by,
        st.is_active,
        st.created_at,
        st.updated_at,
        sg.code AS source_group_code,
        u.name AS created_by_name
      FROM schedule_templates st
      LEFT JOIN study_groups sg ON st.source_group_id = sg.id
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.is_active = TRUE
      ORDER BY st.created_at DESC
    `;

    const rows = await executeQuery<TemplateRow[]>(query);

    const templates = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sourceGroupId: row.source_group_id,
      sourceGroupCode: row.source_group_code,
      eventsData:
        typeof row.events_data === "string"
          ? JSON.parse(row.events_data)
          : row.events_data,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    console.log(`[templates.get] Found ${templates.length} templates`);

    return {
      success: true,
      templates,
    };
  } catch (error: any) {
    console.error("[templates.get] Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Ошибка получения шаблонов",
    });
  }
});
