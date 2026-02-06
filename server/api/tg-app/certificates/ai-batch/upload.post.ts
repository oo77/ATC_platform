/**
 * API endpoint для загрузки нескольких файлов сертификатов через AI
 * Используется представителями организаций в Telegram Mini App
 *
 * POST /api/tg-app/certificates/ai-batch/upload
 */

import { aiCertificateRepository } from "../../../../repositories/aiCertificateRepository";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import os from "os";
import type { ProcessingLogStatus } from "../../../../types/aiCertificateImport";

// Константы
const MAX_FILES = 10; // Максимум файлов за раз для ТГ (меньше чем в веб-платформе)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

interface UploadResult {
  fileId: string;
  filename: string;
  success: boolean;
  error?: string;
}

export default defineEventHandler(
  async (
    event,
  ): Promise<{
    success: boolean;
    files: UploadResult[];
    message?: string;
  }> => {
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/upload - Загрузка файлов",
    );

    // Получаем файлы из FormData
    const formData = await readMultipartFormData(event);

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Файлы не переданы",
      });
    }

    // Извлекаем organizationId и representativeId из FormData
    let organizationId: string | null = null;
    let representativeId: string | null = null;
    const files: typeof formData = [];

    for (const item of formData) {
      if (item.name === "organizationId") {
        organizationId = item.data.toString("utf-8");
      } else if (item.name === "representativeId") {
        representativeId = item.data.toString("utf-8");
      } else if (item.name === "files" || item.name === "file") {
        files.push(item);
      }
    }

    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId обязателен",
      });
    }

    if (!representativeId) {
      throw createError({
        statusCode: 400,
        message: "representativeId обязателен",
      });
    }

    if (files.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Файлы не переданы",
      });
    }

    if (files.length > MAX_FILES) {
      throw createError({
        statusCode: 400,
        message: `Максимум ${MAX_FILES} файлов за раз`,
      });
    }

    console.log(
      `[TG-App] Загружается ${files.length} файлов от organizationId=${organizationId}`,
    );

    const results: UploadResult[] = [];
    const tempDir = path.join(os.tmpdir(), "tg-cert-uploads");

    // Создаём временную директорию
    await fs.mkdir(tempDir, { recursive: true });

    for (const file of files) {
      const filename = file.filename || `file_${Date.now()}`;
      const fileId = uuidv4();

      try {
        // Проверяем тип файла
        const mimeType = file.type || "";
        if (!ALLOWED_TYPES.includes(mimeType)) {
          results.push({
            fileId,
            filename,
            success: false,
            error: `Недопустимый тип файла: ${mimeType}. Разрешены: JPG, PNG, PDF`,
          });
          continue;
        }

        // Проверяем размер
        if (file.data.length > MAX_FILE_SIZE) {
          results.push({
            fileId,
            filename,
            success: false,
            error: `Файл слишком большой. Максимум ${MAX_FILE_SIZE / 1024 / 1024} МБ`,
          });
          continue;
        }

        // Сохраняем во временное хранилище
        const tempFilePath = path.join(tempDir, `${fileId}_${filename}`);
        await fs.writeFile(tempFilePath, file.data);

        // Создаём запись в БД (createLog возвращает созданный лог)
        const log = await aiCertificateRepository.createLog({
          originalFilename: filename,
          fileSizeBytes: file.data.length,
          processingStartedAt: new Date(),
          aiModel: "pending", // Будет обновлено при анализе
          processedBy: representativeId!, // Уже проверено на null выше
          status: "pending" as ProcessingLogStatus,
          extractedData: {
            _internal: {
              tempFilePath,
              mimeType,
              organizationId,
              representativeId,
            },
          } as any, // Приводим к any, так как _internal не в типе (но JSON.stringify сохранит всё)
        });

        results.push({
          fileId: log.id,
          filename,
          success: true,
        });

        console.log(`[TG-App] Файл загружен: ${filename} -> ${log.id}`);
      } catch (error: any) {
        console.error(`[TG-App] Ошибка загрузки файла ${filename}:`, error);
        results.push({
          fileId,
          filename,
          success: false,
          error: error.message || "Ошибка загрузки файла",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    console.log(
      `[TG-App] Загрузка завершена: ${successCount} успешно, ${errorCount} ошибок`,
    );

    return {
      success: successCount > 0,
      files: results,
      message:
        successCount > 0
          ? `Загружено ${successCount} из ${results.length} файлов`
          : "Не удалось загрузить файлы",
    };
  },
);
