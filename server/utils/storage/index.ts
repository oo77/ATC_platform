import { LocalStorage } from './LocalStorage';
import type { IStorage } from './IStorage';

/**
 * Экспорт storage instance
 * 
 * Сейчас используется локальное хранилище.
 * В будущем можно переключиться на облако через переменную окружения:
 * 
 * const storage: IStorage = 
 *   process.env.STORAGE_TYPE === 'cloud' 
 *     ? new CloudStorage() 
 *     : new LocalStorage();
 */

export const storage: IStorage = new LocalStorage();

// Реэкспорт типов и утилит
export * from './IStorage';
export * from './fileUtils';
// Примечание: LocalStorage не реэкспортируем, чтобы избежать дублирования в Nuxt auto-import
// Используйте: import { LocalStorage } from '~/server/utils/storage/LocalStorage';

