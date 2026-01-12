import { d as defineEventHandler, g as getQuery, e as executeQuery, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireAuth } from '../../../_/permissions.mjs';
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

const activity_get = defineEventHandler(async (event) => {
  const context = await requireAuth(event);
  const query = getQuery(event);
  const limit = parseInt(query.limit) || 10;
  const offset = parseInt(query.offset) || 0;
  try {
    const activities = await executeQuery(
      `
      SELECT 
        id,
        action_type,
        entity_type,
        entity_id,
        entity_name,
        details,
        ip_address,
        user_agent,
        created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [context.userId, limit, offset]
    );
    const countResult = await executeQuery(
      `
      SELECT COUNT(*) as total
      FROM activity_logs
      WHERE user_id = ?
      `,
      [context.userId]
    );
    const total = countResult[0]?.total || 0;
    return {
      success: true,
      activities: activities || [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  } catch (error) {
    console.error("Error fetching user activity:", error);
    throw createError({
      statusCode: 500,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F"
    });
  }
});

export { activity_get as default };
//# sourceMappingURL=activity.get.mjs.map
