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

const fixInstructorLink_post = defineEventHandler(async (event) => {
  const userId = "2e825de8-31ee-4faa-b39f-078515721379";
  try {
    console.log("[Fix] \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0432\u044F\u0437\u0438 \u0434\u043B\u044F userId:", userId);
    const [users] = await executeQuery(
      "SELECT id, email, name, role FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      return {
        success: false,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0411\u0414"
      };
    }
    const user = users[0];
    console.log("[Fix] \u041D\u0430\u0439\u0434\u0435\u043D \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C:", user.name, user.email);
    const [instructors] = await executeQuery(
      "SELECT id, full_name, email, user_id FROM instructors WHERE email = ? OR full_name = ?",
      [user.email, user.name]
    );
    if (instructors.length === 0) {
      return {
        success: false,
        message: `\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043F\u043E email (${user.email}) \u0438\u043B\u0438 \u0438\u043C\u0435\u043D\u0438 (${user.name})`,
        hint: "\u041D\u0443\u0436\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430 \u0447\u0435\u0440\u0435\u0437 \u0430\u0434\u043C\u0438\u043D\u043A\u0443"
      };
    }
    const instructor = instructors[0];
    console.log("[Fix] \u041D\u0430\u0439\u0434\u0435\u043D \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440:", instructor.full_name, "ID:", instructor.id);
    if (instructor.user_id === userId) {
      return {
        success: true,
        message: "\u0421\u0432\u044F\u0437\u044C \u0443\u0436\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430",
        instructor: {
          id: instructor.id,
          fullName: instructor.full_name,
          email: instructor.email,
          userId: instructor.user_id
        }
      };
    }
    if (instructor.user_id && instructor.user_id !== userId) {
      return {
        success: false,
        message: `\u0418\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0443\u0436\u0435 \u0441\u0432\u044F\u0437\u0430\u043D \u0441 \u0434\u0440\u0443\u0433\u0438\u043C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C: ${instructor.user_id}`,
        instructor: {
          id: instructor.id,
          fullName: instructor.full_name,
          currentUserId: instructor.user_id
        }
      };
    }
    console.log("[Fix] \u0423\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u043C \u0441\u0432\u044F\u0437\u044C: instructor.id =", instructor.id, "user_id =", userId);
    await executeQuery(
      "UPDATE instructors SET user_id = ? WHERE id = ?",
      [userId, instructor.id]
    );
    console.log("[Fix] \u2705 \u0421\u0432\u044F\u0437\u044C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430!");
    const [updated] = await executeQuery(
      "SELECT id, full_name, email, user_id FROM instructors WHERE id = ?",
      [instructor.id]
    );
    return {
      success: true,
      message: "\u0421\u0432\u044F\u0437\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430!",
      before: {
        userId: instructor.user_id
      },
      after: {
        id: updated[0].id,
        fullName: updated[0].full_name,
        email: updated[0].email,
        userId: updated[0].user_id
      }
    };
  } catch (error) {
    console.error("[Fix] \u041E\u0448\u0438\u0431\u043A\u0430:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
});

export { fixInstructorLink_post as default };
//# sourceMappingURL=fix-instructor-link.post.mjs.map
