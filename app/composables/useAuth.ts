import { computed, readonly } from 'vue';
import { useState, useCookie, navigateTo, useRequestURL } from '#app';
import type { UserPublic, AuthResponse, LoginData, RegisterData } from '../types/auth';

/**
 * Composable для управления аутентификацией
 * Использует cookies для SSR-совместимости
 */
export const useAuth = () => {
  // Состояние пользователя
  const user = useState<UserPublic | null>('auth:user', () => null);
  // Secure-cookie только когда страница открыта по https (atc-platform.uz через
  // Cloudflare). По http в локальной сети (http://192.168.x.x:3005) браузер
  // Secure-cookie не сохраняет — вход бы «не держался».
  const secure = import.meta.client
    ? window.location.protocol === 'https:'
    : useRequestURL({ xForwardedProto: true }).protocol === 'https:';
  const token = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 дней
    sameSite: 'lax',
    secure,
  });
  const refreshToken = useCookie('auth_refresh_token', {
    maxAge: 60 * 60 * 24 * 30, // 30 дней
    sameSite: 'lax',
    secure,
  });

  // Вычисляемые свойства
  const isAuthenticated = computed(() => !!user.value && !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isManager = computed(() => user.value?.role === 'MANAGER');
  const isTeacher = computed(() => user.value?.role === 'TEACHER');
  const isStudent = computed(() => user.value?.role === 'STUDENT');

  /**
   * Вход в систему
   */
  const login = async (credentials: LoginData, rememberMe: boolean = false) => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: credentials,
      });

      if (response.success) {
        // Сохранение токенов
        token.value = response.token;
        if (response.refreshToken) {
          refreshToken.value = response.refreshToken;
        }

        // Если "Запомнить меня", увеличиваем срок жизни cookie
        if (rememberMe) {
          token.value = response.token; // Cookie уже настроен на 7 дней
        }

        // Сохранение пользователя
        user.value = response.user;

        return { success: true, user: response.user };
      }

      return { success: false, error: 'Ошибка входа' };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Обработка ошибок от сервера
      if (error.data?.message) {
        return { success: false, error: error.data.message };
      }
      
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  /**
   * Регистрация
   */
  const register = async (data: RegisterData) => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: data,
      });

      if (response.success) {
        // Сохранение токенов
        token.value = response.token;
        if (response.refreshToken) {
          refreshToken.value = response.refreshToken;
        }

        // Сохранение пользователя
        user.value = response.user;

        return { success: true, user: response.user };
      }

      return { success: false, error: 'Ошибка регистрации' };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.data?.message) {
        return { success: false, error: error.data.message, errors: error.data.errors };
      }
      
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  };

  /**
   * Выход из системы
   */
  const logout = async () => {
    try {
      // Вызов API logout (для логирования)
      await $fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Очистка состояния
      user.value = null;
      token.value = null;
      refreshToken.value = null;

      // Редирект на страницу входа
      await navigateTo('/auth/signin');
    }
  };

  /**
   * Верификация токена и получение данных пользователя
   */
  const fetchUser = async () => {
    if (!token.value) {
      user.value = null;
      return null;
    }

    try {
      const response = await $fetch<{ success: boolean; user: UserPublic }>('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      });

      if (response.success) {
        user.value = response.user;
        return response.user;
      }

      // Токен невалидный, очищаем
      user.value = null;
      token.value = null;
      return null;
    } catch (error) {
      console.error('Fetch user error:', error);
      
      // Попытка обновить токен
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return await fetchUser();
      }

      // Не удалось обновить, очищаем
      user.value = null;
      token.value = null;
      return null;
    }
  };

  /**
   * Обновление access токена с помощью refresh токена
   */
  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      return false;
    }

    try {
      const response = await $fetch<{ success: boolean; token: string; refreshToken: string }>('/api/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: refreshToken.value,
        },
      });

      if (response.success) {
        token.value = response.token;
        refreshToken.value = response.refreshToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  };

  /**
   * Проверка прав доступа по роли
   */
  const hasRole = (roles: string | string[]) => {
    if (!user.value) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.value.role);
  };

  /**
   * Проверка прав доступа (минимальная роль)
   * Иерархия: ADMIN > MANAGER > TEACHER > STUDENT
   */
  const hasMinRole = (minRole: string) => {
    if (!user.value) return false;

    const hierarchy = ['STUDENT', 'TEACHER', 'MANAGER', 'ADMIN'];
    const userRoleIndex = hierarchy.indexOf(user.value.role);
    const minRoleIndex = hierarchy.indexOf(minRole);

    return userRoleIndex >= minRoleIndex;
  };

  /**
   * Инициализация аутентификации
   * Вызывается при загрузке приложения для восстановления сессии
   */
  const init = async () => {
    // Если токен есть, пытаемся восстановить сессию
    if (token.value) {
      await fetchUser();
    }
  };

  return {
    // Состояние
    user: readonly(user),
    token: readonly(token),
    isAuthenticated,
    isAdmin,
    isManager,
    isTeacher,
    isStudent,

    // Методы
    init,
    login,
    register,
    logout,
    fetchUser,
    refreshAccessToken,
    hasRole,
    hasMinRole,
  };
};
