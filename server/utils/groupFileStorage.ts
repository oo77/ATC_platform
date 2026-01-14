/**
 * Утилита для работы с файлами отчетов групп
 *
 * Обеспечивает:
 * - Сохранение файлов в структурированную директорию
 * - Безопасные имена файлов (транслитерация, санитизация)
 * - Управление файлами отчетов
 */

import fs from "fs/promises";
import path from "path";
import { sanitizeFilename } from "./sanitizeFilename";

export interface SaveGroupFileOptions {
  groupId: string | number;
  file: File | Buffer;
  originalFilename: string;
  userId: string;
}

export interface SaveGroupFileResult {
  filePath: string;
  fileUrl: string;
  storedName: string;
}

/**
 * Сохраняет файл отчета группы
 *
 * Структура: /storage/groups/{groupId}/reports/{timestamp}_{sanitized_filename}.pdf
 *
 * @param options - Опции сохранения файла
 * @returns Информация о сохраненном файле
 */
export async function saveGroupReportFile(
  options: SaveGroupFileOptions
): Promise<SaveGroupFileResult> {
  const { groupId, file, originalFilename, userId } = options;

  // Создаем безопасное имя файла
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalFilename);
  const storedName = `${timestamp}_${sanitized}`;

  // Формируем путь: /storage/groups/{groupId}/reports/
  const relativePath = path.join("groups", String(groupId), "reports");
  const absolutePath = path.join(process.cwd(), "storage", relativePath);

  // Создаем директории если не существуют
  await fs.mkdir(absolutePath, { recursive: true });

  // Полный путь к файлу
  const fullPath = path.join(absolutePath, storedName);

  // Сохраняем файл
  let buffer: Buffer;

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  await fs.writeFile(fullPath, buffer);

  // Формируем относительный путь для БД (с прямыми слешами)
  const dbPath = path.join(relativePath, storedName).replace(/\\/g, "/");

  // URL для доступа к файлу
  const fileUrl = `/storage/${dbPath}`;

  console.log(`[Group File Storage] Saved file: ${dbPath}`);

  return {
    filePath: dbPath,
    fileUrl,
    storedName,
  };
}

/**
 * Удаляет файл отчета группы
 *
 * @param filePath - Относительный путь к файлу в storage
 */
export async function deleteGroupReportFile(filePath: string): Promise<void> {
  const absolutePath = path.join(process.cwd(), "storage", filePath);

  try {
    await fs.unlink(absolutePath);
    console.log(`[Group File Storage] Deleted file: ${filePath}`);
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.error("[Group File Storage] Error deleting file:", error);
    }
    // Не бросаем ошибку, файл может быть уже удален
  }
}

/**
 * Получает список всех отчетов группы
 *
 * @param groupId - ID группы
 * @returns Массив относительных путей к файлам
 */
export async function getGroupReportFiles(
  groupId: string | number
): Promise<string[]> {
  const relativePath = path.join("groups", String(groupId), "reports");
  const absolutePath = path.join(process.cwd(), "storage", relativePath);

  try {
    const files = await fs.readdir(absolutePath);
    return files.map((f) => path.join(relativePath, f).replace(/\\/g, "/"));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // Директория не существует
      return [];
    }
    throw error;
  }
}

/**
 * Проверяет существование файла
 *
 * @param filePath - Относительный путь к файлу
 * @returns true если файл существует
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const absolutePath = path.join(process.cwd(), "storage", filePath);

  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Получает информацию о файле
 *
 * @param filePath - Относительный путь к файлу
 * @returns Статистика файла или null
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
} | null> {
  const absolutePath = path.join(process.cwd(), "storage", filePath);

  try {
    const stats = await fs.stat(absolutePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  } catch {
    return null;
  }
}

/**
 * Создает директорию для группы если не существует
 *
 * @param groupId - ID группы
 */
export async function ensureGroupDirectory(
  groupId: string | number
): Promise<void> {
  const relativePath = path.join("groups", String(groupId), "reports");
  const absolutePath = path.join(process.cwd(), "storage", relativePath);

  await fs.mkdir(absolutePath, { recursive: true });
}
