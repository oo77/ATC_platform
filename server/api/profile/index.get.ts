/**
 * API endpoint для получения данных профиля текущего пользователя
 * GET /api/profile
 */

import { defineEventHandler } from "h3";
import { requireAuth } from "../../utils/auth";
import { executeQuery } from "../../utils/db";

export default defineEventHandler(async (event) => {
  // Проверяем авторизацию
  const authUser = requireAuth(event);

  try {
    // Получаем данные пользователя
    const users = await executeQuery<any[]>(
      `
      SELECT 
        id,
        role,
        name,
        email,
        phone,
        workplace,
        position,
        pinfl,
        student_id,
        instructor_id,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      `,
      [authUser.id],
    );

    if (!users || users.length === 0) {
      throw createError({
        statusCode: 404,
        message: "Пользователь не найден",
      });
    }

    const row = users[0];
    const user = {
      ...row,
      studentId: row.student_id,
      instructorId: row.instructor_id,
    };

    return {
      success: true,
      user,
    };
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      message: "Ошибка при получении данных профиля",
    });
  }
});
