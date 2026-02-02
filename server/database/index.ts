/**
 * Database utilities re-export
 * Упрощает импорты в других частях приложения
 */

export {
  getDbPool,
  executeQuery,
  executeTransaction,
  testConnection,
} from "../utils/db";
