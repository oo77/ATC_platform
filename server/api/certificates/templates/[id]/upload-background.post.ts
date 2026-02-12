/**
 * POST /api/certificates/templates/[id]/upload-background
 * Загрузить фоновое изображение для шаблона сертификата
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById } from "../../../../repositories/certificateTemplateRepository";
import { logActivity } from "../../../../utils/activityLogger";

const UPLOAD_DIR = "./public/uploads/certificate-backgrounds";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, "id");

    if (!id) {
      throw createError({
        statusCode: 400,
        message: "ID шаблона обязателен",
      });
    }

    // Проверяем существование шаблона
    const template = await getTemplateById(id);
    if (!template) {
      throw createError({
        statusCode: 404,
        message: "Шаблон не найден",
      });
    }

    // Получаем файл из multipart/form-data
    const formData = await readMultipartFormData(event);
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: "Файл не найден",
      });
    }

    const fileData = formData.find((item) => item.name === "background");
    if (!fileData) {
      throw createError({
        statusCode: 400,
        message: "Поле 'background' не найдено",
      });
    }

    // Проверяем тип файла
    const contentType = fileData.type || "";
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw createError({
        statusCode: 400,
        message: `Неподдерживаемый тип файла. Разрешены: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // Проверяем размер
    if (fileData.data.length > MAX_FILE_SIZE) {
      throw createError({
        statusCode: 400,
        message: `Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Создаем директорию если не существует
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Генерируем уникальное имя файла
    const ext = contentType.split("/")[1];
    const filename = `${id}_${uuidv4()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Сохраняем файл
    await writeFile(filepath, fileData.data);

    // Формируем URL для доступа
    const url = `/uploads/certificate-backgrounds/${filename}`;

    // Логируем действие
    await logActivity(
      event,
      "UPLOAD",
      "CERTIFICATE_TEMPLATE_BACKGROUND",
      id,
      template.name,
      { filename, size: fileData.data.length },
    );

    console.log(
      `[POST /api/certificates/templates/${id}/upload-background] Загружен фон: ${filename}`,
    );

    return {
      success: true,
      url,
      filename,
      size: fileData.data.length,
      message: "Фоновое изображение успешно загружено",
    };
  } catch (error: any) {
    console.error(
      "[POST /api/certificates/templates/[id]/upload-background] Error:",
      error,
    );

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: error.message || "Ошибка загрузки изображения",
    });
  }
});
