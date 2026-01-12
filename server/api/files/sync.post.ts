/**
 * API endpoint для синхронизации папок и файлов из storage с БД
 * POST /api/files/sync
 */

import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { executeQuery } from "../../utils/db";
import {
  createFolder,
  deleteFolder,
  type Folder,
} from "../../repositories/folderRepository";
import {
  createFile,
  deleteFile,
  updateFile,
  type FileRecord,
} from "../../repositories/fileRepository";
import { getFileExtension } from "../../utils/storage/fileUtils";
import { logActivity } from "../../utils/activityLogger";

const STORAGE_PATH = path.resolve(process.cwd(), "storage");

// Определение MIME типа по расширению
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
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
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
}

function getCategoryByPath(folderPath: string): string {
  const lowerPath = folderPath.toLowerCase();

  if (lowerPath.includes("certificates") || lowerPath.includes("сертификат"))
    return "certificate_generated";
  if (lowerPath.includes("courses") || lowerPath.includes("курс"))
    return "course_material";
  if (lowerPath.includes("profiles") || lowerPath.includes("профил"))
    return "profile";
  if (lowerPath.includes("groups") || lowerPath.includes("групп"))
    return "group_file";
  if (lowerPath.includes("documents") || lowerPath.includes("документы"))
    return "other";

  return "other";
}

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user;

    if (!user) {
      throw createError({
        statusCode: 401,
        message: "Требуется авторизация",
      });
    }

    const stats = {
      foldersCreated: 0,
      foldersDeleted: 0,
      filesCreated: 0,
      filesUpdated: 0,
      filesDeleted: 0,
      errors: [] as string[],
    };

    // 1. Загружаем текущее состояние БД
    // --------------------------------------------------------------------------

    // Все папки
    const dbFolders = await executeQuery<
      { id: number; path: string; is_system: number }[]
    >("SELECT id, path, is_system FROM folders WHERE deleted_at IS NULL");
    const dbFoldersMap = new Map<string, { id: number; isSystem: boolean }>();
    dbFolders.forEach((f) =>
      dbFoldersMap.set(f.path, { id: f.id, isSystem: !!f.is_system })
    );

    // Все файлы
    const dbFiles = await executeQuery<
      {
        id: number;
        uuid: string;
        folder_id: number | null;
        filename: string;
        size_bytes: number;
      }[]
    >(
      "SELECT id, uuid, folder_id, filename, size_bytes FROM files WHERE deleted_at IS NULL"
    );
    // Ключ: "folderId:filename" (folderId может быть 'null')
    const dbFilesMap = new Map<
      string,
      { id: number; uuid: string; sizeBytes: number }
    >();
    dbFiles.forEach((f) => {
      const key = `${f.folder_id === null ? "null" : f.folder_id}:${
        f.filename
      }`;
      dbFilesMap.set(key, { id: f.id, uuid: f.uuid, sizeBytes: f.size_bytes });
    });

    // Множества для отслеживания найденных элементов (для последующего удаления отсутствующих)
    const visitedFolderIds = new Set<number>();
    const visitedFileIds = new Set<number>(); // используем ID, а не UUID для консистентности

    // 2. Рекурсивное сканирование файловой системы
    // --------------------------------------------------------------------------

    async function scanDirectory(
      physicalPath: string,
      relativePath: string, // Путь относительно корня (пустая строка или /FolderName...)
      parentDbId: number | null
    ) {
      try {
        const items = await fs.readdir(physicalPath, { withFileTypes: true });

        for (const item of items) {
          const itemPhysicalPath = path.join(physicalPath, item.name);

          // Пропускаем системные файлы и папки
          if (
            item.name.startsWith(".") ||
            item.name === "Thumbs.db" ||
            item.name === "node_modules"
          )
            continue;

          // Пропускаем uploads в корне, как в оригинальной логике, если нужно
          // if (relativePath === "" && item.name === "uploads") continue;

          if (item.isDirectory()) {
            // === ПАПКА ===
            const folderPath = relativePath
              ? `${relativePath}/${item.name}`
              : `/${item.name}`;

            let currentFolderId: number;
            const existingFolder = dbFoldersMap.get(folderPath);

            if (existingFolder) {
              // Папка существует в БД
              currentFolderId = existingFolder.id;
              visitedFolderIds.add(currentFolderId);
            } else {
              // Папка новая - создаем
              try {
                const newFolder = await createFolder({
                  name: item.name,
                  parentId: parentDbId,
                  isSystem: false,
                  userId: user.id, // Опционально сохраняем кто запустил синк, или null
                });
                currentFolderId = newFolder.id;

                // Добавляем в мап, чтобы избежать дублей если вдруг
                dbFoldersMap.set(folderPath, {
                  id: currentFolderId,
                  isSystem: false,
                });
                visitedFolderIds.add(currentFolderId);
                stats.foldersCreated++;
              } catch (folderErr: any) {
                stats.errors.push(
                  `Ошибка создания папки ${folderPath}: ${folderErr.message}`
                );
                continue; // Пропускаем содержимое если не смогли создать папку
              }
            }

            // Рекурсия
            await scanDirectory(itemPhysicalPath, folderPath, currentFolderId);
          } else if (item.isFile()) {
            // === ФАЙЛ ===
            const mapKey = `${parentDbId === null ? "null" : parentDbId}:${
              item.name
            }`;
            const existingFile = dbFilesMap.get(mapKey);

            // Получаем размер файла
            let size = 0;
            try {
              const fileStats = await fs.stat(itemPhysicalPath);
              size = fileStats.size;
            } catch (e) {
              console.warn(`Не удалось прочитать размер файла ${item.name}`);
            }

            if (existingFile) {
              // Файл существует в БД
              visitedFileIds.add(existingFile.id);

              // Проверяем изменения (например, размер изменился)
              if (existingFile.sizeBytes !== size) {
                await executeQuery(
                  "UPDATE files SET size_bytes = ?, updated_at = NOW() WHERE id = ?",
                  [size, existingFile.id]
                );
                stats.filesUpdated++;
              }
            } else {
              // Файл новый - создаем
              try {
                const extension = getFileExtension(item.name);
                const mimeType = getMimeType(extension);
                const category = getCategoryByPath(relativePath || "/");

                const fileStoragePath = relativePath.startsWith("/")
                  ? relativePath.substring(1)
                  : relativePath;

                await createFile({
                  uuid: uuidv4(),
                  filename: item.name,
                  storedName: item.name,
                  mimeType,
                  sizeBytes: size,
                  extension,
                  storagePath: fileStoragePath,
                  fullPath: itemPhysicalPath,
                  category: category as any,
                  folderId: parentDbId,
                  uploadedBy: user.id,
                });

                stats.filesCreated++;
              } catch (fileErr: any) {
                stats.errors.push(
                  `Ошибка создания файла ${item.name}: ${fileErr.message}`
                );
              }
            }
          }
        }
      } catch (err: any) {
        stats.errors.push(
          `Ошибка доступа к папке ${physicalPath}: ${err.message}`
        );
      }
    }

    // Запускаем сканирование
    await scanDirectory(STORAGE_PATH, "", null); // Root, relative="", parentId=null

    // 3. Удаление несуществующих элементов (Cleanup)
    // --------------------------------------------------------------------------

    // Папки
    for (const [path, info] of dbFoldersMap.entries()) {
      if (!visitedFolderIds.has(info.id)) {
        // if (info.isSystem) {
        //   continue;
        // }

        try {
          await deleteFolder(info.id, true);
          stats.foldersDeleted++;
        } catch (delErr: any) {
          stats.errors.push(
            `Ошибка удаления папки ${path} (ID: ${info.id}): ${delErr.message}`
          );
        }
      }
    }

    // Файлы
    for (const [key, info] of dbFilesMap.entries()) {
      if (!visitedFileIds.has(info.id)) {
        try {
          await deleteFile(info.uuid);
          stats.filesDeleted++;
        } catch (delErr: any) {
          stats.errors.push(
            `Ошибка удаления файла (ID: ${info.id}): ${delErr.message}`
          );
        }
      }
    }

    // Логирование действия
    await logActivity(
      event,
      "IMPORT",
      "SYSTEM",
      undefined,
      "Синхронизация файлового менеджера",
      stats
    );

    return {
      success: true,
      foldersImported: stats.foldersCreated,
      filesImported: stats.filesCreated,
      stats: stats,
      errors: stats.errors.length > 0 ? stats.errors : undefined,
      message: `Синхронизация завершена: 
        +Папок: ${stats.foldersCreated}, -Папок: ${stats.foldersDeleted}
        +Файлов: ${stats.filesCreated}, ~Обновлено: ${stats.filesUpdated}, -Удалено: ${stats.filesDeleted}`,
    };
  } catch (error: any) {
    console.error("Ошибка синхронизации:", error);

    throw createError({
      statusCode: 500,
      message: error?.message || "Ошибка при синхронизации",
    });
  }
});
