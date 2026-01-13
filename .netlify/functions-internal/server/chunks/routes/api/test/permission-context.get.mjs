import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { c as getPermissionContext, e as getTeacherGroups } from '../../../_/permissions.mjs';
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

const permissionContext_get = defineEventHandler(async (event) => {
  try {
    const context = await getPermissionContext(event);
    if (!context) {
      return {
        success: false,
        message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D"
      };
    }
    let groups = [];
    if (context.instructorId) {
      groups = await getTeacherGroups(context.instructorId);
    }
    return {
      success: true,
      context: {
        userId: context.userId,
        role: context.role,
        instructorId: context.instructorId || null,
        studentId: context.studentId || null
      },
      groups,
      groupsCount: groups.length
    };
  } catch (error) {
    console.error("[Test API] Error:", error);
    return {
      success: false,
      message: error.message
    };
  }
});

export { permissionContext_get as default };
//# sourceMappingURL=permission-context.get.mjs.map
