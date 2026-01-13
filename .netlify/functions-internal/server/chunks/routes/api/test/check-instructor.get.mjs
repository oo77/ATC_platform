import { d as defineEventHandler, e as executeQuery } from '../../../nitro/nitro.mjs';
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

const checkInstructor_get = defineEventHandler(async (event) => {
  const userId = "2e825de8-31ee-4faa-b39f-078515721379";
  try {
    console.log(`[Test] \u041F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u0434\u043B\u044F userId: ${userId}`);
    const [rows] = await executeQuery(
      "SELECT id, full_name as fullName, user_id FROM instructors WHERE user_id = ? LIMIT 1",
      [userId]
    );
    console.log(`[Test] \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430:`, rows);
    console.log(`[Test] \u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u043E\u043A: ${rows.length}`);
    if (rows.length > 0) {
      console.log(`[Test] \u041D\u0430\u0439\u0434\u0435\u043D \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440:`, rows[0]);
    } else {
      console.log(`[Test] \u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u041D\u0415 \u043D\u0430\u0439\u0434\u0435\u043D`);
      const [allInstructors] = await executeQuery(
        "SELECT id, full_name, user_id FROM instructors LIMIT 5"
      );
      console.log(`[Test] \u0412\u0441\u0435\u0433\u043E \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u0432 \u0432 \u0411\u0414: ${allInstructors.length}`);
      console.log(`[Test] \u041F\u0440\u0438\u043C\u0435\u0440\u044B:`, allInstructors);
    }
    return {
      success: true,
      userId,
      found: rows.length > 0,
      instructor: rows[0] || null,
      message: rows.length > 0 ? "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0430\u0439\u0434\u0435\u043D" : "\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u041D\u0415 \u043D\u0430\u0439\u0434\u0435\u043D"
    };
  } catch (error) {
    console.error("[Test] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});

export { checkInstructor_get as default };
//# sourceMappingURL=check-instructor.get.mjs.map
