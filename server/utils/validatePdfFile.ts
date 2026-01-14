/**
 * Утилита для валидации PDF-файлов
 *
 * Проверяет:
 * - Расширение файла
 * - MIME-тип
 * - Размер файла
 * - Магические байты PDF (%PDF-)
 */

export interface PdfValidationResult {
  valid: boolean;
  error?: string;
  fileInfo?: {
    size: number;
    originalName: string;
  };
}

/**
 * Максимальный размер PDF-файла (10MB)
 */
const MAX_PDF_SIZE = 10 * 1024 * 1024;

/**
 * Магические байты PDF-файла: %PDF-
 */
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

/**
 * Валидация PDF-файла
 *
 * @param file - Файл для валидации (File или Buffer)
 * @param originalName - Оригинальное имя файла
 * @returns Результат валидации
 */
export async function validatePdfFile(
  file: File | Buffer,
  originalName?: string
): Promise<PdfValidationResult> {
  const fileName =
    originalName || (file instanceof File ? file.name : "unknown");

  // 1. Проверка расширения
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: "Файл должен иметь расширение .pdf",
    };
  }

  // 2. Проверка MIME-типа (если доступен)
  if (file instanceof File && file.type && file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Неверный MIME-тип файла. Ожидается application/pdf",
    };
  }

  // 3. Проверка размера
  const fileSize = file instanceof File ? file.size : file.length;

  if (fileSize > MAX_PDF_SIZE) {
    return {
      valid: false,
      error: `Размер файла не должен превышать ${MAX_PDF_SIZE / 1024 / 1024}MB`,
    };
  }

  if (fileSize === 0) {
    return {
      valid: false,
      error: "Файл пустой (0 байт)",
    };
  }

  // 4. Проверка магических байтов PDF (%PDF-)
  try {
    let buffer: Buffer;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // Проверяем первые 5 байтов
    const header = buffer.slice(0, 5);
    const isValidPdf = PDF_SIGNATURE.every(
      (byte, index) => header[index] === byte
    );

    if (!isValidPdf) {
      return {
        valid: false,
        error: "Файл не является корректным PDF-документом",
      };
    }
  } catch (error) {
    console.error("[PDF Validation] Error reading file:", error);
    return {
      valid: false,
      error: "Ошибка при чтении файла",
    };
  }

  return {
    valid: true,
    fileInfo: {
      size: fileSize,
      originalName: fileName,
    },
  };
}

/**
 * Быстрая проверка расширения файла
 */
export function isPdfExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(".pdf");
}

/**
 * Проверка размера файла
 */
export function isValidPdfSize(size: number): boolean {
  return size > 0 && size <= MAX_PDF_SIZE;
}
