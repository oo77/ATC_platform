/**
 * Composable для выполнения авторизованных HTTP запросов
 * Автоматически добавляет токен авторизации в заголовки
 */

import { useCookie } from '#app';

export const useAuthFetch = () => {
  const token = useCookie('auth_token');

  /**
   * Выполняет авторизованный запрос
   * Автоматически добавляет Bearer токен в заголовки
   */
  const authFetch = async <T = any>(url: string, options: any = {}) => {
    const headers = {
      ...options.headers,
    };

    // Добавляем токен авторизации, если он есть
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`;
    }

    return $fetch<T>(url, {
      ...options,
      headers,
    });
  };

  return {
    authFetch,
  };
};
