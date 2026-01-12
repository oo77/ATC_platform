/**
 * Интерфейс для абстракции хранилища файлов
 * Позволяет легко переключаться между локальным хранением и облачным (S3, R2 и т.д.)
 */

export type FileCategory =
  | 'profile'
  | 'certificate_template'
  | 'certificate_generated'
  | 'course_material'
  | 'course_media'
  | 'course_cover'
  | 'group_gallery'
  | 'group_file'
  | 'assignment'
  | 'other';

export interface UploadedFile {
  filename: string;
  data: Buffer;
  mimeType: string;
  size: number;
}

export interface SavedFileInfo {
  uuid: string;
  filename: string;
  storedName: string;
  storagePath: string;
  fullPath: string;
  mimeType: string;
  sizeBytes: number;
  extension: string;
  metadata?: Record<string, any>;
}

export interface IStorage {
  /**
   * Сохранить файл
   * @param file Файл для сохранения
   * @param category Категория файла
   * @param relatedId Связанный ID (опционально)
   * @param folderPath Путь папки из БД (опционально)
   * @param metadata Дополнительные метаданные (опционально)
   */
  save(
    file: UploadedFile,
    category: FileCategory,
    relatedId?: string,
    folderPath?: string,
    metadata?: Record<string, any>
  ): Promise<SavedFileInfo>;

  /**
   * Получение файла по UUID
   * @param uuid - UUID файла
   * @returns Буфер с данными файла
   */
  get(uuid: string): Promise<Buffer>;

  /**
   * Удаление файла
   * @param fullPath - Полный путь к файлу
   * @returns true если файл успешно удален
   */
  delete(fullPath: string): Promise<boolean>;

  /**
   * Получение публичного URL файла
   * @param uuid - UUID файла
   * @returns URL для доступа к файлу
   */
  getPublicUrl(uuid: string): string;
}
