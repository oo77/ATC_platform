import { d as defineEventHandler, c as createError, o as readMultipartFormData } from '../../../nitro/nitro.mjs';
import { s as storage } from '../../../_/index.mjs';
import { c as createFile } from '../../../_/fileRepository.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
import { v as validateFile } from '../../../_/fileUtils.mjs';
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
import '../../../_/activityLogRepository.mjs';

const upload_post = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    const formData = await readMultipartFormData(event);
    if (!formData) {
      return {
        success: false,
        message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D"
      };
    }
    const fileData = formData.find((item) => item.name === "file");
    if (!fileData || !fileData.data) {
      return {
        success: false,
        message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0437\u0430\u043F\u0440\u043E\u0441\u0435"
      };
    }
    const categoryData = formData.find((item) => item.name === "category");
    const category = categoryData?.data?.toString() || "other";
    const folderIdData = formData.find((item) => item.name === "folderId");
    const folderId = folderIdData?.data?.toString() ? parseInt(folderIdData.data.toString()) : null;
    const relatedIdData = formData.find((item) => item.name === "relatedId");
    const relatedId = relatedIdData?.data?.toString();
    const mimeType = fileData.type || "application/octet-stream";
    const filename = fileData.filename || "unnamed";
    try {
      validateFile(
        { size: fileData.data.length, mimeType },
        50 * 1024 * 1024
        // 50MB максимум
      );
    } catch (validationError) {
      return {
        success: false,
        message: validationError instanceof Error ? validationError.message : "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0444\u0430\u0439\u043B\u0430"
      };
    }
    let folderPath;
    if (folderId) {
      const { getFolderById } = await import('../../../_/folderRepository.mjs');
      const folder = await getFolderById(folderId);
      if (folder) {
        folderPath = folder.path;
      }
    }
    let metadata;
    const metadataField = formData.find((item) => item.name === "metadata");
    if (metadataField?.data) {
      try {
        metadata = JSON.parse(metadataField.data.toString());
      } catch (error) {
        console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0438\u0442\u044C metadata:", error);
      }
    }
    const savedFile = await storage.save(
      {
        filename,
        data: fileData.data,
        mimeType,
        size: fileData.data.length
      },
      category,
      relatedId,
      folderPath,
      metadata
    );
    const fileRecord = await createFile({
      uuid: savedFile.uuid,
      filename: savedFile.filename,
      storedName: savedFile.storedName,
      mimeType: savedFile.mimeType,
      sizeBytes: savedFile.sizeBytes,
      extension: savedFile.extension,
      storagePath: savedFile.storagePath,
      fullPath: savedFile.fullPath,
      category,
      folderId,
      metadata: savedFile.metadata,
      uploadedBy: user.id
    });
    await logActivity(
      event,
      "CREATE",
      "FILE",
      fileRecord.uuid,
      fileRecord.filename,
      { category, mimeType: fileRecord.mimeType, sizeBytes: fileRecord.sizeBytes }
    );
    return {
      success: true,
      file: {
        id: fileRecord.id,
        uuid: fileRecord.uuid,
        filename: fileRecord.filename,
        mimeType: fileRecord.mimeType,
        sizeBytes: fileRecord.sizeBytes,
        extension: fileRecord.extension,
        category: fileRecord.category,
        url: storage.getPublicUrl(fileRecord.uuid),
        createdAt: fileRecord.createdAt
      }
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0430\u0439\u043B\u0430:", error);
    return {
      success: false,
      message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0444\u0430\u0439\u043B\u0430"
    };
  }
});

export { upload_post as default };
//# sourceMappingURL=upload.post.mjs.map
