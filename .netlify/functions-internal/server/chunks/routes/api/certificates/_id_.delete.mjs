import { d as defineEventHandler, a as getRouterParam } from '../../../nitro/nitro.mjs';
import { g as getIssuedCertificateById, d as deleteCertificate } from '../../../_/certificateTemplateRepository.mjs';
import { g as getFileByUuid, d as deleteFile } from '../../../_/fileRepository.mjs';
import { s as storage } from '../../../_/index.mjs';
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
import 'fs/promises';
import 'path';
import '../../../_/fileUtils.mjs';
import '../../../_/activityLogRepository.mjs';

const _id__delete = defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");
    if (!id) {
      return {
        success: false,
        message: "ID \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"
      };
    }
    const certificate = await getIssuedCertificateById(id);
    if (!certificate) {
      return {
        success: false,
        message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D"
      };
    }
    const courseName = certificate.variablesData?.courseName || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043A\u0443\u0440\u0441";
    if (certificate.pdfFileUrl) {
      try {
        const fileUrl = certificate.pdfFileUrl;
        let fileUuid = null;
        const uuidPattern = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
        const match = fileUrl.match(uuidPattern);
        if (match) {
          fileUuid = match[1];
          const fileRecord = await getFileByUuid(fileUuid);
          if (fileRecord) {
            await deleteFile(fileUuid);
            try {
              await storage.delete(fileRecord.fullPath);
              console.log(`\u2705 \u0424\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u0443\u0434\u0430\u043B\u0435\u043D: ${fileUuid}`);
            } catch (fileError) {
              console.warn("\u26A0\uFE0F \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0444\u0430\u0439\u043B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", fileError);
            }
          }
        }
      } catch (fileError) {
        console.warn("\u26A0\uFE0F \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", fileError);
      }
    }
    const deleted = await deleteCertificate(id);
    if (!deleted) {
      return {
        success: false,
        message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442"
      };
    }
    await logActivity(
      event,
      "DELETE",
      "ISSUED_CERTIFICATE",
      id,
      courseName,
      {
        certificateNumber: certificate.certificateNumber,
        studentId: certificate.studentId,
        issueDate: certificate.issueDate
      }
    );
    return {
      success: true,
      message: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D"
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430"
    };
  }
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
