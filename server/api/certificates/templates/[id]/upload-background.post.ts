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
// Сторона фона в пикселях: A4 при 300 dpi — 3508 px. Фон больше (например, 9909×14032 px, мало
// весит в файле, но занимает сотни МБ памяти при декодировании) тормозит редактор и предпросмотр
const MAX_SIDE_PX = 4000;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Размеры изображения из заголовка файла (PNG, JPEG, WebP) — без декодирования пикселей.
 * null — формат не разобран, тогда проверку размера пропускаем.
 */
function readImageSize(data: Buffer): { width: number; height: number } | null {
  // PNG: сразу после сигнатуры идёт IHDR с шириной и высотой (big-endian)
  if (data.length >= 24 && data.toString("ascii", 1, 4) === "PNG") {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }

  // JPEG: размеры в маркере SOF0–SOF2; остальные маркеры пропускаем по их длине
  if (data[0] === 0xff && data[1] === 0xd8) {
    let i = 2;
    while (i + 9 < data.length) {
      if (data[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = data[i + 1]!;
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker >= 0xc0 && marker <= 0xc2) {
        return { width: data.readUInt16BE(i + 7), height: data.readUInt16BE(i + 5) };
      }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
        i += 2; // маркеры без длины
        continue;
      }
      i += 2 + data.readUInt16BE(i + 2);
    }
    return null;
  }

  // WebP: RIFF....WEBP и заголовок VP8X / VP8L / VP8
  if (data.length >= 30 && data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
    const chunk = data.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return { width: data.readUIntLE(24, 3) + 1, height: data.readUIntLE(27, 3) + 1 };
    }
    if (chunk === "VP8L") {
      const bits = data.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8 ") {
      return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff };
    }
  }

  return null;
}

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

    const size = readImageSize(fileData.data);
    if (size && Math.max(size.width, size.height) > MAX_SIDE_PX) {
      throw createError({
        statusCode: 400,
        message: `Изображение слишком большое: ${size.width}×${size.height} px. Максимум — ${MAX_SIDE_PX} px по большей стороне. Уменьшите изображение и загрузите снова.`,
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
