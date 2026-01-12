import { d as defineEventHandler, c as createError, a as getRouterParam, r as readBody } from '../../../../nitro/nitro.mjs';
import { g as getIssuedCertificateById, r as revokeCertificate } from '../../../../_/certificateTemplateRepository.mjs';
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

const revoke_patch = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const body = await readBody(event);
    const reason = body?.reason?.trim();
    if (!reason) {
      return {
        success: false,
        message: "\u041D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u0438\u0447\u0438\u043D\u0443 \u043E\u0442\u0437\u044B\u0432\u0430"
      };
    }
    const certificate = await getIssuedCertificateById(id);
    if (!certificate) {
      return {
        success: false,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    if (certificate.status === "revoked") {
      return {
        success: false,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0436\u0435 \u043E\u0442\u043E\u0437\u0432\u0430\u043D"
      };
    }
    if (certificate.status === "draft") {
      return {
        success: false,
        message: "\u041D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
      };
    }
    const revokedCertificate = await revokeCertificate(id, user.id, reason);
    if (!revokedCertificate) {
      return {
        success: false,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442"
      };
    }
    await logActivity(
      event,
      "REVOKE",
      "ISSUED_CERTIFICATE",
      id,
      `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificate.certificateNumber}`,
      {
        certificateNumber: certificate.certificateNumber,
        studentId: certificate.studentId,
        reason,
        previousStatus: certificate.status
      }
    );
    console.log(`\u2705 \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificate.certificateNumber} \u043E\u0442\u043E\u0437\u0432\u0430\u043D \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u043C ${user.id}. \u041F\u0440\u0438\u0447\u0438\u043D\u0430: ${reason}`);
    return {
      success: true,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u043D",
      certificate: revokedCertificate
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u0437\u044B\u0432\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u0437\u044B\u0432\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    };
  }
});

export { revoke_patch as default };
//# sourceMappingURL=revoke.patch.mjs.map
