import { e as executeQuery, d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { g as getInstructorById, i as instructorEmailExists, l as linkInstructorToUser, u as updateInstructor } from '../../../_/instructorRepository.mjs';
import { v4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import { z } from 'zod';
import 'grammy';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'crypto';
import 'jsonwebtoken';
import '../../../_/activityLogRepository.mjs';

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function userEmailExists(email, excludeId) {
  let query = "SELECT id FROM users WHERE email = ?";
  const params = [email];
  const rows = await executeQuery(query, params);
  return rows.length > 0;
}
async function createUser(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO users (id, email, password_hash, name, role, phone, workplace, position, pinfl, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.email,
      data.password,
      data.name,
      data.role,
      data.phone || null,
      data.workplace || null,
      data.position || null,
      data.pinfl || null,
      now,
      now
    ]
  );
  return {
    id,
    email: data.email,
    password: data.password,
    name: data.name,
    role: data.role,
    phone: data.phone || null,
    workplace: data.workplace || null,
    position: data.position || null,
    pinfl: data.pinfl || null,
    created_at: now,
    updated_at: now
  };
}
async function updateUserPassword(userId, hashedPassword) {
  await executeQuery(
    "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
    [hashedPassword, /* @__PURE__ */ new Date(), userId]
  );
}

const updateInstructorSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email").nullable().optional(),
  phone: z.string().nullable().optional(),
  hireDate: z.string().nullable().optional(),
  contractInfo: z.string().nullable().optional(),
  maxHours: z.number().min(0, "\u0427\u0430\u0441\u044B \u043D\u0435 \u043C\u043E\u0433\u0443\u0442 \u0431\u044B\u0442\u044C \u043E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u043C\u0438").optional(),
  isActive: z.boolean().optional(),
  // Поля для смены пароля
  changePassword: z.boolean().optional(),
  newPassword: z.string().min(8, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").optional(),
  // Поля для создания аккаунта
  createAccount: z.boolean().optional(),
  accountEmail: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email").optional(),
  accountPassword: z.string().min(8, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432").optional()
});
const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const validationResult = updateInstructorSchema.safeParse(body);
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
    const existingInstructor = await getInstructorById(id);
    if (!existingInstructor) {
      return {
        success: false,
        message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (data.email && data.email !== "") {
      const emailExists = await instructorEmailExists(data.email, id);
      if (emailExists) {
        return {
          success: false,
          message: "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          field: "email"
        };
      }
    }
    let accountEmail;
    if (data.changePassword && existingInstructor.userId) {
      if (!data.newPassword || data.newPassword.length < 8) {
        return {
          success: false,
          message: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
          field: "newPassword"
        };
      }
      const hashedPassword = await hashPassword(data.newPassword);
      await updateUserPassword(existingInstructor.userId, hashedPassword);
      accountEmail = existingInstructor.email || void 0;
      await logActivity(
        event,
        "UPDATE",
        "USER",
        existingInstructor.userId,
        `\u0421\u043C\u0435\u043D\u0430 \u043F\u0430\u0440\u043E\u043B\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430: ${existingInstructor.fullName}`,
        { action: "password_change" }
      );
    }
    if (data.createAccount && !existingInstructor.userId) {
      accountEmail = data.accountEmail || existingInstructor.email || `instructor_${id}@local`;
      const userExists = await userEmailExists(accountEmail);
      if (userExists) {
        return {
          success: false,
          message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
          field: "accountEmail"
        };
      }
      if (!data.accountPassword || data.accountPassword.length < 8) {
        return {
          success: false,
          message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 8 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432",
          field: "accountPassword"
        };
      }
      const hashedPassword = await hashPassword(data.accountPassword);
      const newUser = await createUser({
        email: accountEmail,
        password: hashedPassword,
        name: existingInstructor.fullName,
        role: "TEACHER"
      });
      await linkInstructorToUser(id, newUser.id);
      await logActivity(
        event,
        "CREATE",
        "USER",
        newUser.id,
        `\u0421\u043E\u0437\u0434\u0430\u043D \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0434\u043B\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430: ${existingInstructor.fullName}`,
        { instructorId: id, email: accountEmail }
      );
    }
    const updateData = {};
    if (data.fullName !== void 0) updateData.fullName = data.fullName;
    if (data.email !== void 0) updateData.email = data.email ?? null;
    if (data.phone !== void 0) updateData.phone = data.phone ?? null;
    if (data.hireDate !== void 0) updateData.hireDate = data.hireDate ?? null;
    if (data.contractInfo !== void 0) updateData.contractInfo = data.contractInfo ?? null;
    if (data.maxHours !== void 0) updateData.maxHours = data.maxHours ?? 0;
    if (data.isActive !== void 0) updateData.isActive = data.isActive;
    const instructor = await updateInstructor(id, updateData);
    await logActivity(
      event,
      "UPDATE",
      "INSTRUCTOR",
      id,
      instructor?.fullName || existingInstructor.fullName,
      { updatedFields: Object.keys(updateData) }
    );
    return {
      success: true,
      message: data.changePassword ? "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0451\u043D" : data.createAccount ? "\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D" : "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D",
      instructor
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
