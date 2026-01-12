import path from 'path';
import type { FileCategory } from './IStorage';

/**
 * Утилиты для работы с файлами (кроссплатформенные)
 */

/**
 * Извлечение расширения файла
 */
export function getFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return ext.startsWith('.') ? ext.substring(1) : ext;
}

/**
 * Генерация пути хранения с партиционированием по датам
 * @param category - Категория файла
 * @param date - Дата (для партиционирования)
 * @returns Относительный путь (например: profiles/2025/01)
 */
export function generateStoragePath(category: FileCategory, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Используем path.join() для кроссплатформенности
  return path.join(getCategoryFolder(category), String(year), month);
}

/**
 * Получение папки для категории
 */
function getCategoryFolder(category: FileCategory): string {
  switch (category) {
    case 'profile':
      return 'profiles';
    case 'certificate_template':
      return path.join('certificates', 'templates');
    case 'certificate_generated':
      return path.join('certificates', 'generated');
    case 'course_material':
      return path.join('courses', 'materials');
    case 'course_media':
      return path.join('courses', 'media');
    case 'course_cover':
      return path.join('courses', 'covers');
    case 'group_gallery':
      return path.join('groups', 'gallery');
    case 'group_file':
      return path.join('groups', 'files');
    case 'assignment':
      return 'assignments';
    case 'other':
    default:
      return 'other';
  }
}

/**
 * Генерация уникального имени файла
 * @param originalFilename - Оригинальное имя файла
 * @param category - Категория файла
 * @param relatedId - ID связанной сущности (опционально)
 * @returns Уникальное имя файла
 */
export function generateUniqueFilename(
  originalFilename: string,
  category: FileCategory,
  relatedId?: string
): string {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  const parts: string[] = [category as string];
  if (relatedId) {
    parts.push(relatedId);
  }
  parts.push(timestamp.toString());
  parts.push(random);
  
  const filename = parts.join('-');
  return ext ? `${filename}.${ext}` : filename;
}

/**
 * Валидация файла
 * @param file - Данные файла
 * @param maxSizeBytes - Максимальный размер в байтах
 * @param allowedMimeTypes - Разрешенные MIME типы (необязательно)
 * @throws Error если файл не прошел валидацию
 */
export function validateFile(
  file: { size: number; mimeType: string },
  maxSizeBytes: number = 50 * 1024 * 1024, // 50MB по умолчанию
  allowedMimeTypes?: string[]
): void {
  // Проверка размера
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`Файл слишком большой. Максимальный размер: ${maxSizeMB}MB`);
  }

  // Проверка MIME типа
  if (allowedMimeTypes && allowedMimeTypes.length > 0) {
    if (!allowedMimeTypes.includes(file.mimeType)) {
      throw new Error(`Неподдерживаемый тип файла: ${file.mimeType}`);
    }
  }
}

/**
 * Безопасная проверка пути (предотвращение path traversal)
 * @param requestedPath - Запрашиваемый путь
 * @param basePath - Базовый путь
 * @returns true если путь безопасен
 */
export function isPathSafe(requestedPath: string, basePath: string): boolean {
  const normalizedRequested = path.normalize(requestedPath);
  const normalizedBase = path.normalize(basePath);
  
  // Проверяем что запрашиваемый путь находится внутри базового
  return normalizedRequested.startsWith(normalizedBase);
}

/**
 * Форматирование размера файла для отображения
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
