import { getDbPool } from "./db";

/**
 * Composable для работы с базой данных в Nuxt 3
 * Используется в API endpoints
 */
export const useDatabase = () => {
  return getDbPool();
};
