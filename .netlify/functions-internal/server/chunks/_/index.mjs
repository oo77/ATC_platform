import fs from 'fs/promises';
import path__default from 'path';
import { v4 } from 'uuid';
import { g as getFileExtension, i as isPathSafe } from './fileUtils.mjs';

class LocalStorage {
  baseStoragePath;
  constructor(baseStoragePath = "storage/uploads") {
    this.baseStoragePath = path__default.resolve(process.cwd(), baseStoragePath);
  }
  /**
   * Сохранение файла на диск
   */
  async save(file, category, relatedId, folderPath, metadata) {
    try {
      const uuid = v4();
      let storagePath;
      if (folderPath) {
        storagePath = folderPath.startsWith("/") ? folderPath.substring(1) : folderPath;
      } else {
        storagePath = this.getCategoryFolder(category);
      }
      const ext = getFileExtension(file.filename);
      let storedName;
      if (category === "certificate_generated" && metadata?.pinfl && metadata?.certificateNumber) {
        const sanitizedNumber = metadata.certificateNumber.replace(/[^a-zA-Z0-9]/g, "_");
        storedName = `${metadata.pinfl}_${sanitizedNumber}${ext ? "." + ext : ""}`;
      } else {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        storedName = `${timestamp}-${random}${ext ? "." + ext : ""}`;
      }
      const fullDirectoryPath = path__default.join(this.baseStoragePath, storagePath);
      await fs.mkdir(fullDirectoryPath, { recursive: true });
      const fullFilePath = path__default.join(fullDirectoryPath, storedName);
      if (!isPathSafe(fullFilePath, this.baseStoragePath)) {
        throw new Error("\u041D\u0435\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443");
      }
      await fs.writeFile(fullFilePath, file.data);
      let imageMetadata;
      if (file.mimeType.startsWith("image/")) {
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
        metadata: imageMetadata
      };
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
      throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0444\u0430\u0439\u043B");
    }
  }
  /**
   * Получение папки для категории (fallback)
   */
  getCategoryFolder(category) {
    switch (category) {
      case "profile":
        return "\u041F\u0440\u043E\u0444\u0438\u043B\u0438";
      case "certificate_template":
      case "certificate_generated":
        return "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B";
      case "course_material":
      case "course_media":
      case "course_cover":
        return "\u041A\u0443\u0440\u0441\u044B";
      case "group_gallery":
      case "group_file":
        return "\u0413\u0440\u0443\u043F\u043F\u044B";
      case "assignment":
      case "other":
      default:
        return "\u041F\u0440\u043E\u0447\u0435\u0435";
    }
  }
  /**
   * Получение файла с диска
   */
  async get(fullPath) {
    try {
      if (!isPathSafe(fullPath, this.baseStoragePath)) {
        throw new Error("\u041D\u0435\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443");
      }
      try {
        await fs.access(fullPath);
      } catch {
        throw new Error("\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
      }
      return await fs.readFile(fullPath);
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
      throw error;
    }
  }
  /**
   * Удаление файла с диска
   */
  async delete(fullPath) {
    try {
      if (!isPathSafe(fullPath, this.baseStoragePath)) {
        throw new Error("\u041D\u0435\u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443");
      }
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      if (error.code === "ENOENT") {
        return false;
      }
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
      throw new Error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u0430\u0439\u043B");
    }
  }
  /**
   * Получение URL для доступа к файлу
   */
  getPublicUrl(uuid) {
    return `/api/files/${uuid}`;
  }
  /**
   * Извлечение метаданных изображения
   * (базовая реализация, для production можно использовать sharp)
   */
  async extractImageMetadata(buffer) {
    try {
      const sharp = await import('sharp').catch(() => null);
      if (sharp) {
        const metadata = await sharp.default(buffer).metadata();
        return {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          hasAlpha: metadata.hasAlpha
        };
      }
      return void 0;
    } catch (error) {
      console.warn("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438\u0437\u0432\u043B\u0435\u0447\u044C \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F:", error);
      return void 0;
    }
  }
}

const storage = new LocalStorage();

export { storage as s };
//# sourceMappingURL=index.mjs.map
