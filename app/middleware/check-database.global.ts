/**
 * Middleware для проверки подключения к БД
 * Если БД не настроена - редирект на /environment
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем саму страницу настройки
  if (to.path === "/environment") {
    return;
  }

  // Только на клиенте
  if (process.server) {
    return;
  }

  try {
    // Проверяем подключение к БД
    const dbStatus = await $fetch("/api/environment/check-db");

    if (!dbStatus.connected) {
      // БД не настроена → редирект на настройку
      console.warn(
        "[MIDDLEWARE] Database not connected, redirecting to /environment",
      );
      return navigateTo("/environment");
    }
  } catch (error) {
    // Ошибка подключения → редирект на настройку
    console.error(
      "[MIDDLEWARE] Database check failed, redirecting to /environment:",
      error,
    );
    return navigateTo("/environment");
  }
});
