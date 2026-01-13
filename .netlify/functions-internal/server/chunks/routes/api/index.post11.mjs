import { d as defineEventHandler, r as readBody, e as executeQuery, k as hashPassword } from '../../nitro/nitro.mjs';
import { randomUUID } from 'crypto';
import { s as studentExistsByPinfl, c as createStudent, l as linkStudentToUser } from '../../_/studentRepository.mjs';
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

const studentSchema = z.object({
  fullName: z.string().min(1, "\u0424\u0418\u041E \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  pinfl: z.string().regex(/^\d{14}$/, "\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0440\u043E\u0432\u043D\u043E 14 \u0446\u0438\u0444\u0440"),
  organization: z.string().min(1, "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430"),
  department: z.string().optional(),
  position: z.string().min(1, "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430"),
  // Опциональный пароль (если не указан — используется ПИНФЛ)
  accountPassword: z.string().min(8, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").optional()
});
const index_post = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    console.log("[Students API] \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", {
      fullName: body.fullName,
      pinfl: body.pinfl,
      createAccount: body.createAccount
    });
    const validationResult = studentSchema.safeParse(body);
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
    const exists = await studentExistsByPinfl(data.pinfl);
    if (exists) {
      return {
        success: false,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u0441 \u0442\u0430\u043A\u0438\u043C \u041F\u0418\u041D\u0424\u041B \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
        field: "pinfl"
      };
    }
    let userId = null;
    let accountEmail = null;
    accountEmail = `${data.pinfl}@student.local`;
    const existingUsers = await executeQuery(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [accountEmail]
    );
    if (existingUsers.length === 0) {
      const password = data.accountPassword || data.pinfl;
      const passwordHash = await hashPassword(password);
      userId = randomUUID();
      await executeQuery(
        `INSERT INTO users (id, role, name, email, password_hash, pinfl, workplace, position, created_at, updated_at)
         VALUES (?, 'STUDENT', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [userId, data.fullName, accountEmail, passwordHash, data.pinfl, data.organization, data.position]
      );
      console.log(`[Students API] \u0421\u043E\u0437\u0434\u0430\u043D \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C: ${accountEmail} (role=STUDENT, password=${data.accountPassword ? "custom" : "\u041F\u0418\u041D\u0424\u041B"})`);
    } else {
      userId = existingUsers[0].id;
      console.log(`[Students API] \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ${accountEmail} \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442, \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u0435\u043C \u0441\u043E \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u043C`);
    }
    const student = await createStudent({
      fullName: data.fullName.trim(),
      pinfl: data.pinfl.trim(),
      organization: data.organization.trim(),
      department: data.department?.trim() || void 0,
      position: data.position.trim()
    });
    if (userId) {
      await linkStudentToUser(student.id, userId);
      console.log(`[Students API] \u0421\u0432\u044F\u0437\u0430\u043D student.id=${student.id} \u0441 user.id=${userId}`);
    }
    await logActivity(
      event,
      "CREATE",
      "STUDENT",
      student.id,
      student.fullName,
      {
        pinfl: student.pinfl,
        organization: student.organization,
        accountCreated: !!userId,
        accountEmail: accountEmail || void 0
      }
    );
    return {
      success: true,
      message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u0438 \u0443\u0447\u0451\u0442\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u044B",
      student,
      accountEmail
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430"
    };
  }
});

export { index_post as default };
//# sourceMappingURL=index.post11.mjs.map
