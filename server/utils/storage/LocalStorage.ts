import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { IStorage, UploadedFile, SavedFileInfo, FileCategory } from './IStorage';
import { getFileExtension, isPathSafe } from './fileUtils';

/**
 * Локальное хранилище файлов (кроссплатформенная реализация)
 * Использует файловую систему сервера для хранения файлов
 */
export class LocalStorage implements IStorage {
  private baseStoragePath: string;

  constructor(baseStoragePath: string = 'storage/uploads') {
    // Нормализация пути для кроссплатформенности
    this.baseStoragePath = path.resolve(process.cwd(), baseStoragePath);
  }

  /**
   * Сохранение файла на диск
   */
  async save(
    file: UploadedFile,
    category: FileCategory,
    relatedId?: string,
    folderPath?: string,
    metadata?: Record<string, any>
  ): Promise<SavedFileInfo> {
    try {
      // Генерация UUID для файла
      const uuid = uuidv4();

      // Определение пути хранения
      let storagePath: string;
      
      if (folderPath) {
        // Используем путь папки из БД (например: /Сертификаты)
        // Убираем начальный слеш и используем как путь
        storagePath = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;
      } else {
        // Fallback: используем категорию
        storagePath = this.getCategoryFolder(category);
      }

      // Получаем расширение файла
      const ext = getFileExtension(file.filename);

      // Генерация имени файла
      let storedName: string;
      
      // Специальная обработка для сертификатов
      if (category === 'certificate_generated' && metadata?.pinfl && metadata?.certificateNumber) {
        // Формат: {ПИНФЛ}_{серияНомер}.{расширение}
        const sanitizedNumber = metadata.certificateNumber.replace(/[^a-zA-Z0-9]/g, '_');
        storedName = `${metadata.pinfl}_${sanitizedNumber}${ext ? '.' + ext : ''}`;
      } else {
        // Обычная генерация имени файла
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        storedName = `${timestamp}-${random}${ext ? '.' + ext : ''}`;
      }

      // Полный путь к директории
      const fullDirectoryPath = path.join(this.baseStoragePath, storagePath);

      // Создание директории если не существует
      await fs.mkdir(fullDirectoryPath, { recursive: true });

      // Полный путь к файлу
      const fullFilePath = path.join(fullDirectoryPath, storedName);

      // Проверка безопасности пути (предотвращение path traversal)
      if (!isPathSafe(fullFilePath, this.baseStoragePath)) {
        throw new Error('Небезопасный путь к файлу');
      }

      // Сохранение файла
      await fs.writeFile(fullFilePath, file.data);

      // Извлечение метаданных изображения (если это изображение)
      let imageMetadata: Record<string, any> | undefined;
      if (file.mimeType.startsWith('image/')) {
        imageMetadata = await this.extractImageMetadata(file.data);
      }

      return {
        uuid,
        filename: file.filename,
        storedName,
        storagePath,
        fullPath: fullFilePath,
        mimeType: file.mimeType,
        sizeBytes: file.size,
        extension: getFileExtension(file.filename),
        metadata: imageMetadata,
      };
    } catch (error) {
      console.error('Ошибка сохранения файла:', error);
      throw new Error('Не удалось сохранить файл');
    }
  }

  /**
   * Получение папки для категории (fallback)
   */
  private getCategoryFolder(category: FileCategory): string {
    switch (category) {
      case 'profile':
        return 'Профили';
      case 'certificate_template':
      case 'certificate_generated':
        return 'Сертификаты';
      case 'course_material':
      case 'course_media':
      case 'course_cover':
        return 'Курсы';
      case 'group_gallery':
      case 'group_file':
        return 'Группы';
      case 'assignment':
      case 'other':
      default:
        return 'Прочее';
    }
  }

  /**
   * Получение файла с диска
   */
  async get(fullPath: string): Promise<Buffer> {
    try {
      // Проверка безопасности пути
      if (!isPathSafe(fullPath, this.baseStoragePath)) {
        throw new Error('Небезопасный путь к файлу');
      }

      // Проверка существования файла
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error('Файл не найден');
      }

      // Чтение файла
      return await fs.readFile(fullPath);
    } catch (error) {
      console.error('Ошибка чтения файла:', error);
      throw error;
    }
  }

  /**
   * Удаление файла с диска
   */
  async delete(fullPath: string): Promise<boolean> {
    try {
      // Проверка безопасности пути
      if (!isPathSafe(fullPath, this.baseStoragePath)) {
        throw new Error('Небезопасный путь к файлу');
      }

      // Удаление файла
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Файл уже не существует
        return false;
      }
      console.error('Ошибка удаления файла:', error);
      throw new Error('Не удалось удалить файл');
    }
  }

  /**
   * Получение URL для доступа к файлу
   */
  getPublicUrl(uuid: string): string {
    return `/api/files/${uuid}`;
  }

  /**
   * Извлечение метаданных изображения
   * (базовая реализация, для production можно использовать sharp)
   */
  private async extractImageMetadata(buffer: Buffer): Promise<Record<string, any> | undefined> {
    try {
      // Попытка использовать sharp для извлечения метаданных
      // Если sharp не установлен, возвращаем undefined
      const sharp = await import('sharp').catch(() => null);
      
      if (sharp) {
        const metadata = await sharp.default(buffer).metadata();
        return {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          hasAlpha: metadata.hasAlpha,
        };
      }
      
      return undefined;
    } catch (error) {
      // Если не удалось извлечь метаданные, это не критично
      console.warn('Не удалось извлечь метаданные изображения:', error);
      return undefined;
    }
  }
}
