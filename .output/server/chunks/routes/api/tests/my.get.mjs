import { g as defineEventHandler, i as getQuery } from '../../../_/nitro.mjs';
import { b as getStudentAssignments } from '../../../_/testAssignmentRepository.mjs';
import { i as getStudentByUserId } from '../../../_/studentRepository.mjs';
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
import 'node:url';
import 'jsonwebtoken';

const my_get = defineEventHandler(async (event) => {
  try {
    const userId = event.context.user?.id;
    console.log("[API /tests/my] User ID:", userId);
    if (!userId) {
      console.log("[API /tests/my] \u274C \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D");
      return {
        success: false,
        message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D",
        assignments: []
      };
    }
    const student = await getStudentByUserId(userId);
    console.log("[API /tests/my] Student:", student ? { id: student.id, fullName: student.fullName } : null);
    if (!student) {
      console.log("[API /tests/my] \u274C \u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F user_id:", userId);
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
    console.log("[API /tests/my] \u2705 \u041D\u0430\u0439\u0434\u0435\u043D\u043E \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439:", assignments.length);
    if (assignments.length > 0) {
      console.log("[API /tests/my] \u041F\u0435\u0440\u0432\u043E\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435:", {
        id: assignments[0].id,
        template_name: assignments[0].template_name,
        group_name: assignments[0].group_name,
        status: assignments[0].status
      });
    }
    return {
      success: true,
      assignments
    };
  } catch (error) {
    console.error("[API /tests/my] \u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0442\u0435\u0441\u0442\u043E\u0432 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0442\u0435\u0441\u0442\u043E\u0432",
      assignments: []
    };
  }
});

export { my_get as default };
//# sourceMappingURL=my.get.mjs.map
