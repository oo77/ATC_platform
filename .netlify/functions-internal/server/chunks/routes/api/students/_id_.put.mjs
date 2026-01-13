import { d as defineEventHandler, a as getRouterParam, r as readBody } from '../../../nitro/nitro.mjs';
import { s as studentExistsByPinfl, u as updateStudent } from '../../../_/studentRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const _id__put = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    if (body.pinfl !== void 0) {
      if (!body.pinfl.trim()) {
        return {
          success: false,
          message: "\u041F\u0418\u041D\u0424\u041B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C"
        };
      }
      if (!/^\d{14}$/.test(body.pinfl)) {
        return {
          success: false,
          message: "\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0440\u043E\u0432\u043D\u043E 14 \u0446\u0438\u0444\u0440"
        };
      }
      const exists = await studentExistsByPinfl(body.pinfl, id);
      if (exists) {
        return {
          success: false,
          message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u0441 \u0442\u0430\u043A\u0438\u043C \u041F\u0418\u041D\u0424\u041B \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442"
        };
      }
    }
    if (body.fullName !== void 0 && !body.fullName.trim()) {
      return {
        success: false,
        message: "\u0424.\u0418.\u041E \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u044B\u043C"
      };
    }
    if (body.organization !== void 0 && !body.organization.trim()) {
      return {
        success: false,
        message: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u043E\u0439"
      };
    }
    if (body.position !== void 0 && !body.position.trim()) {
      return {
        success: false,
        message: "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u0443\u0441\u0442\u043E\u0439"
      };
    }
    const updateData = {};
    if (body.fullName !== void 0) updateData.fullName = body.fullName.trim();
    if (body.pinfl !== void 0) updateData.pinfl = body.pinfl.trim();
    if (body.organization !== void 0) updateData.organization = body.organization.trim();
    if (body.department !== void 0) updateData.department = body.department?.trim() || void 0;
    if (body.position !== void 0) updateData.position = body.position.trim();
    const student = await updateStudent(id, updateData);
    if (!student) {
      return {
        success: false,
        message: "\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    await logActivity(
      event,
      "UPDATE",
      "STUDENT",
      student.id,
      student.fullName,
      { updatedFields: Object.keys(updateData) }
    );
    return {
      success: true,
      student
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430"
    };
  }
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
