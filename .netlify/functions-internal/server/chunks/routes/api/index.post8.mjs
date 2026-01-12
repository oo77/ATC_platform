import { d as defineEventHandler, r as readBody, e as executeQuery, k as hashPassword } from '../../nitro/nitro.mjs';
import { randomUUID } from 'crypto';
import { i as instructorEmailExists, f as createInstructor, l as linkInstructorToUser } from '../../_/instructorRepository.mjs';
import { l as logActivity } from '../../_/activityLogger.mjs';
import { z } from 'zod';
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
import 'jsonwebtoken';
import '../../_/activityLogRepository.mjs';

const instructorSchema = z.object({
  fullName: z.string().min(1, "\u0424\u0418\u041E \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email").optional().or(z.literal("")),
  phone: z.string().optional(),
  hireDate: z.string().optional().or(z.literal("")),
  contractInfo: z.string().optional(),
  maxHours: z.number().min(0, "\u0427\u0430\u0441\u044B \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438").optional(),
  isActive: z.boolean().optional(),
  // Поля для создания учётной записи
  createAccount: z.boolean().optional().default(false),
  accountEmail: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email \u0434\u043B\u044F \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430").optional(),
  accountPassword: z.string().min(8, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("[Instructors API] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430:", {
      fullName: body.fullName,
      createAccount: body.createAccount
    });
    const validationResult = instructorSchema.safeParse(body);
    if (!validationResult.success) {
      return {
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
        errors: validationResult.error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message
        }))
      };
    }
    const data = validationResult.data;
    if (data.email && data.email !== "") {
      const emailExists = await instructorEmailExists(data.email);
      if (emailExists) {
        return {
          success: false,
          message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          field: "email"
        };
      }
    }
    let userId = null;
    if (data.createAccount) {
      const accountEmail = data.accountEmail || data.email;
      if (!accountEmail) {
        return {
          success: false,
          message: "Email \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0443\u0447\u0451\u0442\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438",
          field: "accountEmail"
        };
      }
      const existingUsers = await executeQuery(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [accountEmail]
      );
      if (existingUsers.length > 0) {
        return {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435",
          field: "accountEmail"
        };
      }
      const password = data.accountPassword;
      if (!password || password.length < 8) {
        return {
          success: false,
          message: "\u041F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D \u0438 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
          field: "accountPassword"
        };
      }
      const passwordHash = await hashPassword(password);
      userId = randomUUID();
      await executeQuery(
        `INSERT INTO users (id, role, name, email, password_hash, phone, created_at, updated_at)
         VALUES (?, 'TEACHER', ?, ?, ?, ?, NOW(3), NOW(3))`,
        [userId, data.fullName, accountEmail, passwordHash, data.phone || null]
      );
      console.log(`[Instructors API] \u0421\u043E\u0437\u0434\u0430\u043D \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C: ${accountEmail} (role=TEACHER)`);
    }
    const instructor = await createInstructor(data);
    if (userId) {
      await linkInstructorToUser(instructor.id, userId);
      console.log(`[Instructors API] \u0421\u0432\u044F\u0437\u0430\u043D instructor.id=${instructor.id} \u0441 user.id=${userId}`);
    }
    await logActivity(
      event,
      "CREATE",
      "INSTRUCTOR",
      String(instructor.id),
      instructor.fullName,
      {
        email: instructor.email,
        accountCreated: !!userId,
        accountEmail: data.createAccount ? data.accountEmail || data.email : void 0
      }
    );
    return {
      success: true,
      message: data.createAccount ? "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0438 \u0443\u0447\u0451\u0442\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u044B" : "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D",
      instructor
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post8.mjs.map
