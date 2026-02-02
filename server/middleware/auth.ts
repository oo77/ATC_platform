import type { H3Event } from "h3";
import { verifyToken } from "../utils/auth";
import { UserRole } from "../types/auth";

/**
 * Публичные маршруты, которые не требуют аутентификации
 */
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/db/test",
  "/api/db/init",
  "/api/certificates/download", // Скачивание сертификатов (защищено UUID)
  "/api/debug", // Debug endpoints (только для разработки!)
  "/api/tg-app", // Telegram Mini App (использует свою систему авторизации)
];

/**
 * Маршруты, доступные только для определенных ролей
 * Формат: { path: string, roles: UserRole[] }
 */
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/api/admin": [UserRole.ADMIN],
  "/api/users": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/teachers": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/students/my-courses": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
  ],
  "/api/students/notifications": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
  ],
  "/api/students/dashboard": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
  ],
  "/api/students": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER],
  "/api/schedule/settings": [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
  ],
  "/api/schedule/periods": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER],
};

/**
 * Проверяет, является ли маршрут публичным
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}

/**
 * Получает требуемые роли для маршрута
 * Использует принцип "наиболее специфичного совпадения" (longest prefix match)
 */
function getRequiredRoles(path: string): UserRole[] | null {
  let matchedRoles: UserRole[] | null = null;
  let longestMatch = 0;

  for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (path.startsWith(route) && route.length > longestMatch) {
      matchedRoles = roles;
      longestMatch = route.length;
    }
  }

  return matchedRoles;
}

/**
 * Проверяет, имеет ли пользователь необходимую роль
 */
function hasRequiredRole(
  userRole: UserRole,
  requiredRoles: UserRole[],
): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Серверный middleware для проверки аутентификации и авторизации
 *
 * Логика работы:
 * 1. Пропускает публичные маршруты без проверки
 * 2. Для маршрутов с ROLE_PROTECTED_ROUTES - строго требует токен и проверяет роли
 * 3. Для остальных маршрутов - проверяет токен если он есть, но не блокирует если его нет
 * 4. Добавляет данные пользователя в event.context для использования в API handlers
 */
export default defineEventHandler(async (event: H3Event) => {
  const path = event.path;

  // Пропускаем не-API маршруты (статические файлы, страницы и т.д.)
  if (!path.startsWith("/api")) {
    return;
  }

  // Пропускаем публичные маршруты
  if (isPublicRoute(path)) {
    return;
  }

  // Проверяем, требует ли маршрут строгую проверку ролей
  const requiredRoles = getRequiredRoles(path);
  const requiresStrictAuth = requiredRoles !== null;

  // Извлекаем токен из заголовка Authorization или cookie
  let token: string | undefined;

  const authHeader = getHeader(event, "authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Убираем 'Bearer '
  } else {
    // Пытаемся получить из cookie
    token = getCookie(event, "auth_token");
  }

  // Если токена нет и маршрут требует строгую аутентификацию - блокируем
  if (!token && requiresStrictAuth) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Токен не предоставлен. Требуется аутентификация.",
    });
  }

  // Если токена нет, но маршрут не требует строгой аутентификации - пропускаем
  // (эндпоинт сам решит, нужна ли аутентификация через requireAuth)
  if (!token) {
    return;
  }

  // Верифицируем токен
  const payload = verifyToken(token);

  if (!payload) {
    // Если токен невалидный и маршрут требует строгую аутентификацию - блокируем
    if (requiresStrictAuth) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "Недействительный или истекший токен.",
      });
    }
    // Иначе просто не добавляем пользователя в контекст
    return;
  }

  // Проверяем роли для маршрутов с ограничениями
  if (requiredRoles && !hasRequiredRole(payload.role, requiredRoles)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Доступ запрещен. Требуется одна из ролей: ${requiredRoles.join(", ")}`,
    });
  }

  // Добавляем данные пользователя в контекст события
  // Теперь в API handlers можно получить доступ через event.context.user
  event.context.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  // Логируем успешную аутентификацию (опционально)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Auth] User ${payload.email} (${payload.role}) accessed ${path}`,
    );
  }
});
