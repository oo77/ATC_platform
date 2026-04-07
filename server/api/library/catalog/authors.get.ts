import { defineEventHandler, createError } from "h3";
import { requireAuth } from "../../../utils/auth";
import { executeQuery } from "../../../utils/db";

export default defineEventHandler(async (event) => {
  requireAuth(event);

  try {
    const sql = `
      SELECT DISTINCT author
      FROM books
      WHERE status = 'ready' AND deleted_at IS NULL AND author IS NOT NULL AND author != ''
      ORDER BY author ASC
    `;
    const rows = await executeQuery<{author: string}[]>(sql);
    
    return { authors: rows.map(r => r.author).filter(Boolean) };
  } catch (error: any) {
    console.error(`[Library] Failed to fetch authors:`, error);
    throw createError({
      statusCode: 500,
      message: `Ошибка при получении списка авторов: ${error.message}`,
    });
  }
});
