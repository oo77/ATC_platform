import { d as defineEventHandler, c as createError, e as executeQuery } from '../../../nitro/nitro.mjs';
import fs from 'fs/promises';
import path__default from 'path';
import { v4 } from 'uuid';
import { createFolder, deleteFolder } from '../../../_/folderRepository.mjs';
import { c as createFile, d as deleteFile } from '../../../_/fileRepository.mjs';
import { g as getFileExtension } from '../../../_/fileUtils.mjs';
import { l as logActivity } from '../../../_/activityLogger.mjs';
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
import '../../../_/activityLogRepository.mjs';

const STORAGE_PATH = path__default.resolve(process.cwd(), "storage");
function getMimeType(extension) {
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    mp4: "video/mp4",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}
function getCategoryByPath(folderPath) {
  const lowerPath = folderPath.toLowerCase();
  if (lowerPath.includes("certificates") || lowerPath.includes("\u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442"))
    return "certificate_generated";
  if (lowerPath.includes("courses") || lowerPath.includes("\u043A\u0443\u0440\u0441"))
    return "course_material";
  if (lowerPath.includes("profiles") || lowerPath.includes("\u043F\u0440\u043E\u0444\u0438\u043B"))
    return "profile";
  if (lowerPath.includes("groups") || lowerPath.includes("\u0433\u0440\u0443\u043F\u043F"))
    return "group_file";
  if (lowerPath.includes("documents") || lowerPath.includes("\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B"))
    return "other";
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
    const stats = {
      foldersCreated: 0,
      foldersDeleted: 0,
      filesCreated: 0,
      filesUpdated: 0,
      filesDeleted: 0,
      errors: []
    };
    const dbFolders = await executeQuery("SELECT id, path, is_system FROM folders WHERE deleted_at IS NULL");
    const dbFoldersMap = /* @__PURE__ */ new Map();
    dbFolders.forEach(
      (f) => dbFoldersMap.set(f.path, { id: f.id, isSystem: !!f.is_system })
    );
    const dbFiles = await executeQuery(
      "SELECT id, uuid, folder_id, filename, size_bytes FROM files WHERE deleted_at IS NULL"
    );
    const dbFilesMap = /* @__PURE__ */ new Map();
    dbFiles.forEach((f) => {
      const key = `${f.folder_id === null ? "null" : f.folder_id}:${f.filename}`;
      dbFilesMap.set(key, { id: f.id, uuid: f.uuid, sizeBytes: f.size_bytes });
    });
    const visitedFolderIds = /* @__PURE__ */ new Set();
    const visitedFileIds = /* @__PURE__ */ new Set();
    async function scanDirectory(physicalPath, relativePath, parentDbId) {
      try {
        const items = await fs.readdir(physicalPath, { withFileTypes: true });
        for (const item of items) {
          const itemPhysicalPath = path__default.join(physicalPath, item.name);
          if (item.name.startsWith(".") || item.name === "Thumbs.db" || item.name === "node_modules")
            continue;
          if (item.isDirectory()) {
            const folderPath = relativePath ? `${relativePath}/${item.name}` : `/${item.name}`;
            let currentFolderId;
            const existingFolder = dbFoldersMap.get(folderPath);
            if (existingFolder) {
              currentFolderId = existingFolder.id;
              visitedFolderIds.add(currentFolderId);
            } else {
              try {
                const newFolder = await createFolder({
                  name: item.name,
                  parentId: parentDbId,
                  isSystem: false,
                  userId: user.id
                  // Опционально сохраняем кто запустил синк, или null
                });
                currentFolderId = newFolder.id;
                dbFoldersMap.set(folderPath, {
                  id: currentFolderId,
                  isSystem: false
                });
                visitedFolderIds.add(currentFolderId);
                stats.foldersCreated++;
              } catch (folderErr) {
                stats.errors.push(
                  `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438 ${folderPath}: ${folderErr.message}`
                );
                continue;
              }
            }
            await scanDirectory(itemPhysicalPath, folderPath, currentFolderId);
          } else if (item.isFile()) {
            const mapKey = `${parentDbId === null ? "null" : parentDbId}:${item.name}`;
            const existingFile = dbFilesMap.get(mapKey);
            let size = 0;
            try {
              const fileStats = await fs.stat(itemPhysicalPath);
              size = fileStats.size;
            } catch (e) {
              console.warn(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0440\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430 ${item.name}`);
            }
            if (existingFile) {
              visitedFileIds.add(existingFile.id);
              if (existingFile.sizeBytes !== size) {
                await executeQuery(
                  "UPDATE files SET size_bytes = ?, updated_at = NOW() WHERE id = ?",
                  [size, existingFile.id]
                );
                stats.filesUpdated++;
              }
            } else {
              try {
                const extension = getFileExtension(item.name);
                const mimeType = getMimeType(extension);
                const category = getCategoryByPath(relativePath || "/");
                const fileStoragePath = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
                await createFile({
                  uuid: v4(),
                  filename: item.name,
                  storedName: item.name,
                  mimeType,
                  sizeBytes: size,
                  extension,
                  storagePath: fileStoragePath,
                  fullPath: itemPhysicalPath,
                  category,
                  folderId: parentDbId,
                  uploadedBy: user.id
                });
                stats.filesCreated++;
              } catch (fileErr) {
                stats.errors.push(
                  `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430 ${item.name}: ${fileErr.message}`
                );
              }
            }
          }
        }
      } catch (err) {
        stats.errors.push(
          `\u041E\u0448\u0438\u0431\u043A\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0430\u043F\u043A\u0435 ${physicalPath}: ${err.message}`
        );
      }
    }
    await scanDirectory(STORAGE_PATH, "", null);
    for (const [path2, info] of dbFoldersMap.entries()) {
      if (!visitedFolderIds.has(info.id)) {
        try {
          await deleteFolder(info.id, true);
          stats.foldersDeleted++;
        } catch (delErr) {
          stats.errors.push(
            `\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043F\u0430\u043F\u043A\u0438 ${path2} (ID: ${info.id}): ${delErr.message}`
          );
        }
      }
    }
    for (const [key, info] of dbFilesMap.entries()) {
      if (!visitedFileIds.has(info.id)) {
        try {
          await deleteFile(info.uuid);
          stats.filesDeleted++;
        } catch (delErr) {
          stats.errors.push(
            `\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430 (ID: ${info.id}): ${delErr.message}`
          );
        }
      }
    }
    await logActivity(
      event,
      "IMPORT",
      "SYSTEM",
      void 0,
      "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0444\u0430\u0439\u043B\u043E\u0432\u043E\u0433\u043E \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430",
      stats
    );
    return {
      success: true,
      foldersImported: stats.foldersCreated,
      filesImported: stats.filesCreated,
      stats,
      errors: stats.errors.length > 0 ? stats.errors : void 0,
      message: `\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430: 
        +\u041F\u0430\u043F\u043E\u043A: ${stats.foldersCreated}, -\u041F\u0430\u043F\u043E\u043A: ${stats.foldersDeleted}
        +\u0424\u0430\u0439\u043B\u043E\u0432: ${stats.filesCreated}, ~\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${stats.filesUpdated}, -\u0423\u0434\u0430\u043B\u0435\u043D\u043E: ${stats.filesDeleted}`
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
