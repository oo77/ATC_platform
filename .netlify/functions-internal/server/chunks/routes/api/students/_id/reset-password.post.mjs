import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody, e as executeQuery, k as hashPassword } from '../../../../nitro/nitro.mjs';
import { z } from 'zod';
import { a as getStudentById } from '../../../../_/studentRepository.mjs';
import { l as logActivity } from '../../../../_/activityLogger.mjs';
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
import '../../../../_/activityLogRepository.mjs';

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").optional(),
  resetToPinfl: z.boolean().optional().default(false)
});
const resetPassword_post = defineEventHandler(async (event) => {
  try {
    const studentId = getRouterParam(event, "id");
    if (!studentId) {
      throw createError({
        statusCode: 400,
        message: "ID \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    const user = event.context.user;
    if (!user || !["ADMIN", "MANAGER"].includes(user.role)) {
      throw createError({
        statusCode: 403,
        message: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0430\u0432 \u0434\u043B\u044F \u0441\u0431\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u043E\u043B\u044F"
      });
    }
    const body = await readBody(event);
    const data = resetPasswordSchema.parse(body);
    const student = await getStudentById(studentId);
    if (!student) {
      throw createError({
        statusCode: 404,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      });
    }
    const email = `${student.pinfl}@student.local`;
    const [existingUser] = await executeQuery(
      "SELECT id FROM users WHERE email = ? OR pinfl = ? LIMIT 1",
      [email, student.pinfl]
    );
    if (!existingUser) {
      const { randomUUID } = await import('crypto');
      const userId = randomUUID();
      const password = data.newPassword || student.pinfl;
      const passwordHash2 = await hashPassword(password);
      await executeQuery(
        `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
         VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [userId, student.fullName, email, passwordHash2, student.pinfl, student.organization, student.position]
      );
      await executeQuery(
        "UPDATE students SET user_id = ? WHERE id = ?",
        [userId, studentId]
      );
      await logActivity(
        event,
        "CREATE",
        "USER",
        userId,
        `\u0423\u0447\u0451\u0442\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0434\u043B\u044F ${student.fullName}`,
        { studentId, email }
      );
      return {
        success: true,
        message: "\u0423\u0447\u0451\u0442\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u043D\u0430",
        accountEmail: email,
        passwordReset: true
      };
    }
    const newPassword = data.resetToPinfl ? student.pinfl : data.newPassword || student.pinfl;
    const passwordHash = await hashPassword(newPassword);
    await executeQuery(
      "UPDATE users SET password_hash = ?, updated_at = NOW(3) WHERE id = ?",
      [passwordHash, existingUser.id]
    );
    await logActivity(
      event,
      "UPDATE",
      "USER",
      existingUser.id,
      `\u0421\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F \u0434\u043B\u044F ${student.fullName}`,
      { studentId, resetToPinfl: data.resetToPinfl }
    );
    return {
      success: true,
      message: data.resetToPinfl ? "\u041F\u0430\u0440\u043E\u043B\u044C \u0441\u0431\u0440\u043E\u0448\u0435\u043D \u043D\u0430 \u041F\u0418\u041D\u0424\u041B" : "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0451\u043D",
      accountEmail: email
    };
  } catch (error) {
    console.error("[POST /api/students/[id]/reset-password] Error:", error);
    if (error.statusCode) {
      throw error;
    }
    if (error.name === "ZodError") {
      throw createError({
        statusCode: 400,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438",
        data: error.errors
      });
    }
    throw createError({
      statusCode: 500,
      message: error.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0431\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u043E\u043B\u044F"
    });
  }
});

export { resetPassword_post as default };
//# sourceMappingURL=reset-password.post.mjs.map
