import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { b as getStudentAssignments } from '../../../_/testAssignmentRepository.mjs';
import { h as getStudentByUserId } from '../../../_/studentRepository.mjs';
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

const my_get = defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    if (!userId) {
      return {
        success: false,
        message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D",
        assignments: []
      };
    }
    const student = await getStudentByUserId(userId);
    if (!student) {
      return {
        success: false,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D",
        assignments: []
      };
    }
    const query = getQuery(event);
    const assignments = await getStudentAssignments(student.id, {
      upcoming: query.upcoming === "true"
    });
    return {
      success: true,
      assignments
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0442\u0435\u0441\u0442\u043E\u0432",
      assignments: []
    };
  }
});

export { my_get as default };
//# sourceMappingURL=my.get.mjs.map
