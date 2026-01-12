/**
 * API endpoint для синхронизации папок и файлов из storage с БД
 * POST /api/files/sync
 */

import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  createFolder,
  getFolderByPath,
} from "../../repositories/folderRepository";
import { createFile, checkFileExists } from "../../repositories/fileRepository";
import { getFileExtension } from "../../utils/storage/fileUtils";

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
  if (folderPath.includes("Certificates") || folderPath.includes("Сертификат"))
    return "certificate_generated";
  if (folderPath.includes("Courses") || folderPath.includes("Курс"))
    return "course_material";
  if (folderPath.includes("Profiles") || folderPath.includes("Профил"))
    return "profile";
  if (folderPath.includes("Groups") || folderPath.includes("Групп"))
    return "group_file";
  if (folderPath.includes("Documents") || folderPath.includes("Документы"))
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

    let foldersImported = 0;
    let filesImported = 0;
    let errors: string[] = [];

    // Синхронизация папок
    async function syncFolders(
      dirPath: string,
      parentId: number | null = null,
      parentPath: string = ""
    ): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          // Игнорируем uploads, если он существует внутри storage, чтобы избежать дублирования старой структуры
          // Но это зависит от того, перенес ли пользователь файлы. В данном случае сканируем всё.
          // Если пользователь хочет переименовать uploads в storage, то содержимое уже там.

          const folderPath = parentPath
            ? `${parentPath}/${item.name}`
            : `/${item.name}`;

          try {
            const existing = await getFolderByPath(folderPath);
            let currentFolderId;

            if (!existing) {
              const folder = await createFolder({
                name: item.name,
                parentId: parentId,
                isSystem: false,
              });
              foldersImported++;
              currentFolderId = folder.id;
            } else {
              currentFolderId = existing.id;
            }

            const subDirPath = path.join(dirPath, item.name);
            await syncFolders(subDirPath, currentFolderId, folderPath);
          } catch (error: any) {
            errors.push(`Папка ${folderPath}: ${error.message}`);
          }
        }
      }
    }

    // Синхронизация файлов
    async function syncFiles(
      dirPath: string,
      relativePath: string = ""
    ): Promise<void> {
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        const itemRelativePath = relativePath
          ? `${relativePath}/${item.name}`
          : item.name;

        if (item.isDirectory()) {
          await syncFiles(itemPath, itemRelativePath);
        } else if (item.isFile()) {
          // Пропускаем системные файлы
          if (item.name.startsWith(".") || item.name === "Thumbs.db") continue;

          try {
            const stats = await fs.stat(itemPath);
            const extension = getFileExtension(item.name);
            const mimeType = getMimeType(extension);

            const folderPath = relativePath
              ? `/${relativePath.replace(/\\/g, "/")}`
              : "/";
            const folder = await getFolderByPath(folderPath);

            if (folder) {
              // Проверяем существование файла
              const existingFile = await checkFileExists(folder.id, item.name);

              if (existingFile) {
                // Файл уже существует, пропускаем
                continue;
              }

              const uuid = uuidv4();
              // storagePath - это путь папки относительно корня storage, а не полный путь
              const storagePath =
                itemRelativePath.substring(
                  0,
                  itemRelativePath.lastIndexOf("/")
                ) || "";
              const category = getCategoryByPath(folderPath);

              await createFile({
                uuid,
                filename: item.name,
                storedName: item.name,
                mimeType,
                sizeBytes: stats.size,
                extension,
                storagePath,
                fullPath: itemPath, // Сейчас это абсолютный путь?
                category: category as any,
                folderId: folder.id,
                uploadedBy: user.id,
              });

              filesImported++;
            }
          } catch (error: any) {
            errors.push(`Файл ${item.name}: ${error.message}`);
          }
        }
      }
    }

    // Запуск синхронизации
    await syncFolders(STORAGE_PATH);
    await syncFiles(STORAGE_PATH);

    return {
      success: true,
      foldersImported,
      filesImported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Синхронизация завершена: ${foldersImported} папок, ${filesImported} файлов`,
    };
  } catch (error: any) {
    console.error("Ошибка синхронизации:", error);

    throw createError({
      statusCode: 500,
      message: error?.message || "Ошибка при синхронизации",
    });
  }
});
