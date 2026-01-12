/**
 * ============================================================================
 * КРОССПЛАТФОРМЕННЫЕ УТИЛИТЫ ДЛЯ ESM
 * ============================================================================
 * 
 * Эти утилиты решают проблемы с ESM импортами на разных платформах:
 * - Windows: Абсолютные пути должны быть file:// URLs
 * - Linux/Mac: Работают напрямую
 * 
 * Использование:
 * - createSafeRequire() - для импорта CommonJS модулей в ESM
 * - pathToFileUrl() - для конвертации путей в file:// URLs
 * - dynamicImport() - для безопасного динамического импорта
 * ============================================================================
 */

import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Создаёт функцию require для использования в ESM модулях
 * Работает одинаково на Windows, Linux и Mac
 * 
 * @param importMetaUrl - import.meta.url вызывающего модуля
 * @returns Функция require для импорта CommonJS модулей
 * 
 * @example
 * const require = createSafeRequire(import.meta.url);
 * const xlsx = require('xlsx');
 */
export function createSafeRequire(importMetaUrl: string): NodeRequire {
  return createRequire(importMetaUrl);
}

/**
 * Конвертирует путь файловой системы в file:// URL
 * Необходимо для динамических импортов на Windows
 * 
 * @param filePath - Абсолютный или относительный путь к файлу
 * @returns file:// URL строка
 * 
 * @example
 * const url = pathToFileUrl('d:\\project\\file.js');
 * // Результат: 'file:///d:/project/file.js'
 */
export function pathToFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

/**
 * Получает путь к директории из import.meta.url
 * Эквивалент __dirname для ESM
 * 
 * @param importMetaUrl - import.meta.url вызывающего модуля
 * @returns Абсолютный путь к директории модуля
 * 
 * @example
 * const __dirname = getDirname(import.meta.url);
 */
export function getDirname(importMetaUrl: string): string {
  return dirname(fileURLToPath(importMetaUrl));
}

/**
 * Получает путь к файлу из import.meta.url
 * Эквивалент __filename для ESM
 * 
 * @param importMetaUrl - import.meta.url вызывающего модуля
 * @returns Абсолютный путь к файлу модуля
 * 
 * @example
 * const __filename = getFilename(import.meta.url);
 */
export function getFilename(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl);
}

/**
 * Безопасный динамический импорт с поддержкой Windows
 * Автоматически конвертирует пути в file:// URLs
 * 
 * @param modulePath - Путь к модулю (относительный или абсолютный)
 * @param importMetaUrl - import.meta.url вызывающего модуля (для относительных путей)
 * @returns Promise с импортированным модулем
 * 
 * @example
 * // Относительный путь
 * const module = await dynamicImport('./migrations/001_create_table.js', import.meta.url);
 * 
 * // Абсолютный путь
 * const module = await dynamicImport('d:\\project\\module.js');
 */
export async function dynamicImport<T = any>(
  modulePath: string,
  importMetaUrl?: string
): Promise<T> {
  let fullPath: string;
  
  // Проверяем, является ли путь относительным
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    if (!importMetaUrl) {
      throw new Error('importMetaUrl is required for relative paths');
    }
    // Резолвим относительный путь от директории вызывающего модуля
    const callerDir = getDirname(importMetaUrl);
    fullPath = resolve(callerDir, modulePath);
  } else if (modulePath.startsWith('file://')) {
    // Уже file:// URL, импортируем напрямую
    return import(modulePath);
  } else if (/^[a-zA-Z]:/.test(modulePath)) {
    // Windows абсолютный путь (например, d:\...)
    fullPath = modulePath;
  } else {
    // Unix абсолютный путь или npm модуль
    // npm модули импортируем напрямую
    if (!modulePath.startsWith('/')) {
      return import(modulePath);
    }
    fullPath = modulePath;
  }
  
  // Конвертируем в file:// URL для совместимости с Windows ESM
  const fileUrl = pathToFileURL(fullPath).href;
  return import(fileUrl);
}

/**
 * Создаёт функцию для безопасного динамического импорта
 * с предустановленным import.meta.url
 * 
 * @param importMetaUrl - import.meta.url вызывающего модуля
 * @returns Функция для динамического импорта относительных модулей
 * 
 * @example
 * const safeImport = createDynamicImporter(import.meta.url);
 * const migration = await safeImport('./migrations/001_create_table.js');
 */
export function createDynamicImporter(importMetaUrl: string) {
  return <T = any>(modulePath: string): Promise<T> => {
    return dynamicImport<T>(modulePath, importMetaUrl);
  };
}
