import { d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import fs from 'fs/promises';
import path__default from 'path';
import { v4 } from 'uuid';
import { getFolderByPath, createFolder } from '../../../_/folderRepository.mjs';
import { c as createFile } from '../../../_/fileRepository.mjs';
import { g as getFileExtension } from '../../../_/fileUtils.mjs';
import 'grammy';
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

const STORAGE_PATH = path__default.resolve(process.cwd(), "storage/uploads");
function getMimeType(extension) {
  const mimeTypes = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
    "svg": "image/svg+xml",
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "txt": "text/plain",
    "csv": "text/csv",
    "zip": "application/zip",
    "mp4": "video/mp4"
  };
  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}
function getCategoryByPath(folderPath) {
  if (folderPath.includes("\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442")) return "certificate_generated";
  if (folderPath.includes("\u041A\u0443\u0440\u0441")) return "course_material";
  if (folderPath.includes("\u041F\u0440\u043E\u0444\u0438\u043B")) return "profile";
  if (folderPath.includes("\u0413\u0440\u0443\u043F\u043F")) return "group_file";
  return "other";
}
const sync_post = defineEventHandler(async (event) => {
  try {
    const user = event.context.user;
    if (!user) {
      throw createError({
        statusCode: 401,
        message: "\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F"
      });
    }
    let foldersImported = 0;
    let filesImported = 0;
    let errors = [];
    async function syncFolders(dirPath, parentId = null, parentPath = "") {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const folderPath = parentPath ? `${parentPath}/${item.name}` : `/${item.name}`;
          try {
            const existing = await getFolderByPath(folderPath);
            if (!existing) {
              const folder = await createFolder({
                name: item.name,
                parentId,
                isSystem: false
              });
              foldersImported++;
              const subDirPath = path__default.join(dirPath, item.name);
              await syncFolders(subDirPath, folder.id, folderPath);
            } else {
              const subDirPath = path__default.join(dirPath, item.name);
              await syncFolders(subDirPath, existing.id, folderPath);
            }
          } catch (error) {
            errors.push(`\u041F\u0430\u043F\u043A\u0430 ${folderPath}: ${error.message}`);
          }
        }
      }
    }
    async function syncFiles(dirPath, relativePath = "") {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      for (const item of items) {
        const itemPath = path__default.join(dirPath, item.name);
        const itemRelativePath = relativePath ? `${relativePath}/${item.name}` : item.name;
        if (item.isDirectory()) {
          await syncFiles(itemPath, itemRelativePath);
        } else if (item.isFile()) {
          try {
            const stats = await fs.stat(itemPath);
            const extension = getFileExtension(item.name);
            const mimeType = getMimeType(extension);
            const folderPath = relativePath ? `/${relativePath.replace(/\\/g, "/")}` : "/";
            const folder = await getFolderByPath(folderPath);
            if (folder) {
              const uuid = v4();
              const storagePath = itemRelativePath.substring(0, itemRelativePath.lastIndexOf("/")) || "";
              const category = getCategoryByPath(folderPath);
              await createFile({
                uuid,
                filename: item.name,
                storedName: item.name,
                mimeType,
                sizeBytes: stats.size,
                extension,
                storagePath,
                fullPath: itemPath,
                category,
                folderId: folder.id,
                uploadedBy: user.id
              });
              filesImported++;
            }
          } catch (error) {
            if (!error.message?.includes("Duplicate")) {
              errors.push(`\u0424\u0430\u0439\u043B ${item.name}: ${error.message}`);
            }
          }
        }
      }
    }
    await syncFolders(STORAGE_PATH);
    await syncFiles(STORAGE_PATH);
    return {
      success: true,
      foldersImported,
      filesImported,
      errors: errors.length > 0 ? errors : void 0,
      message: `\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430: ${foldersImported} \u043F\u0430\u043F\u043E\u043A, ${filesImported} \u0444\u0430\u0439\u043B\u043E\u0432`
    };
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438:", error);
    throw createError({
      statusCode: 500,
      message: error?.message || "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
    });
  }
});

export { sync_post as default };
//# sourceMappingURL=sync.post.mjs.map
