import { g as defineEventHandler, h as createError, f as executeQuery } from '../../../_/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
    });
  }
  if (!["ADMIN", "MANAGER"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432"
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
    const rows = await executeQuery(query);
    const templates = rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      sourceGroupId: row.source_group_id,
      sourceGroupCode: row.source_group_code,
      eventsData: typeof row.events_data === "string" ? JSON.parse(row.events_data) : row.events_data,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));
    console.log(`[templates.get] Found ${templates.length} templates`);
    return {
      success: true,
      templates
    };
  } catch (error) {
    console.error("[templates.get] Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432"
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get3.mjs.map
