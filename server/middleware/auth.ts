import type { H3Event } from "h3";
import { verifyToken } from "../utils/auth";
import { UserRole } from "../types/auth";
import { getUserAccess, type UserAccess } from "../utils/roleRegistry";

/**
 * Публичные маршруты, которые не требуют аутентификации.
 *
 * ВСЁ остальное под /api требует действительный токен (deny by default).
 * Добавлять сюда путь можно только если эндпоинт сам проверяет доступ
 * (свой токен, подпись Telegram, секрет вебхука) или действительно публичен.
 *
 * prefix: true  — совпадение по префиксу
 * methods        — если задано, публичен только для этих методов
 */
interface PublicRoute {
  path: string;
  prefix?: boolean;
  methods?: string[];
}

const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "/api/auth/login" },
  { path: "/api/auth/register" },
  { path: "/api/auth/refresh" },
  { path: "/api/auth/verify" }, // сам проверяет Bearer-токен
  { path: "/api/auth/logout" }, // выход должен работать и с истёкшим токеном
  // Мастер первичной настройки: каждый эндпоинт /api/environment/* сам вызывает
  // requireSetupModeOrPermission (без входа — только при первичной установке).
  // Исключение: check-db — только факт подключения, без деталей ошибки.
  { path: "/api/environment/", prefix: true },
  { path: "/api/db/init", methods: ["GET"] }, // отключён в production, сам проверяет режим настройки
  // Telegram Mini App: каждый эндпоинт (кроме auth/register/organizations) вызывает
  // requireTgRepresentative() — проверка подписи initData, представитель из БД
  { path: "/api/tg-app/", prefix: true },
  { path: "/api/telegram/webhook", methods: ["POST"] }, // Telegram (секрет вебхука)
  // Только GET: иначе h3 при отсутствии обработчика метода может уйти в соседний
  // маршрут (например PATCH /api/certificates/verify/x → certificates/[id]/x)
  { path: "/api/certificates/verify/", prefix: true, methods: ["GET"] }, // проверка по номеру
  { path: "/api/public/", prefix: true, methods: ["GET"] }, // публичные stats/превью/скачивание по номеру
  { path: "/api/public-dashboard/", prefix: true, methods: ["GET"] }, // дашборды по ссылке (свой токен + пароль)
  { path: "/api/integration/", prefix: true, methods: ["GET", "OPTIONS"] }, // интеграция с планировщиком (свой токен)
  { path: "/api/integration", methods: ["GET", "OPTIONS"] },
];

/**
 * Маршруты, доступные только для определенных ролей
 * Формат: { path: string, roles: UserRole[] }
 */
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  "/api/admin": [UserRole.ADMIN],
  "/api/public-dashboards": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/users": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/teachers": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/instructors/": [UserRole.TEACHER, UserRole.ADMIN, UserRole.MANAGER],
  "/api/instructors": [UserRole.ADMIN, UserRole.MANAGER],
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
  "/api/students/": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
  ],
  "/api/students": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER],
  // Чтение нужно календарю всех ролей (иначе у слушателя стандартные пары вместо настроенных);
  // изменение (PUT) эндпоинты сами разрешают только администратору
  "/api/schedule/settings": [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER,
    UserRole.STUDENT,
  ],
  "/api/schedule/periods": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER, UserRole.STUDENT],
  "/api/attestation/my": [UserRole.TEACHER, UserRole.ADMIN, UserRole.MANAGER],
  "/api/attestation/sessions": [UserRole.TEACHER, UserRole.ADMIN, UserRole.MANAGER],
  "/api/attestation/journal": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/attestation/commission-members": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/attestation/groups": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/attestation/results": [UserRole.ADMIN, UserRole.MANAGER],
};

/**
 * Проверяет, является ли маршрут публичным
 */
function isPublicRoute(path: string, method: string): boolean {
  const cleanPath = path.split("?")[0] || "";
  return PUBLIC_ROUTES.some((route) => {
    const matches = route.prefix
      ? cleanPath.startsWith(route.path)
      : cleanPath === route.path || cleanPath === `${route.path}/`;
    if (!matches) return false;
    return !route.methods || route.methods.includes(method.toUpperCase());
  });
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
 * Токен из заголовка Authorization (Bearer) или cookie auth_token
 */
function extractRequestToken(event: H3Event): string | undefined {
  const authHeader = getHeader(event, "authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return getCookie(event, "auth_token") || undefined;
}

/**
 * Пользователь в event.context: role — профиль кабинета, permissions — права его роли
 */
function toContextUser(access: UserAccess) {
  return {
    id: access.userId,
    email: access.email,
    name: access.name,
    role: access.baseRole,
    roleId: access.roleId,
    roleName: access.roleName,
    permissions: access.permissions,
    instructorId: access.instructorId,
    studentId: access.studentId,
  };
}

/**
 * Серверный middleware для проверки аутентификации и авторизации
 *
 * Логика работы:
 * 1. Пропускает публичные маршруты без проверки
 * 2. Все остальные маршруты /api требуют действительный токен (401 без него)
 * 3. Для маршрутов из ROLE_PROTECTED_ROUTES дополнительно проверяет роль.
 *    Точные права проверяет сам эндпоинт через requirePermission()
 * 4. Добавляет данные пользователя в event.context для использования в API handlers
 */
export default defineEventHandler(async (event: H3Event) => {
  const path = event.path;

  // Пропускаем не-API маршруты (статические файлы, страницы и т.д.)
  if (!path.startsWith("/api")) {
    return;
  }

  // Пропускаем публичные маршруты
  if (isPublicRoute(path, event.method || "GET")) {
    // Если токен всё же есть — кладём пользователя в контекст (для журнала),
    // но не блокируем запрос
    const optionalToken = extractRequestToken(event);
    const optionalPayload = optionalToken ? verifyToken(optionalToken) : null;
    if (optionalPayload) {
      try {
        const access = await getUserAccess(optionalPayload.userId);
        if (access) event.context.user = toContextUser(access);
      } catch {
        // Публичный маршрут (например, мастер настройки при недоступной БД) — без пользователя
      }
    }
    return;
  }

  // Все непубличные API-маршруты требуют аутентификацию
  const requiredRoles = getRequiredRoles(path);

  // Извлекаем токен из заголовка Authorization или cookie
  const token = extractRequestToken(event);

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Токен не предоставлен. Требуется аутентификация.",
    });
  }

  // Верифицируем токен
  const payload = verifyToken(token);

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Недействительный или истекший токен.",
    });
  }

  // Роль и права — из БД (кэш 15 с), а не из JWT: смена роли и удаление
  // пользователя действуют сразу, без ожидания истечения токена
  const access = await getUserAccess(payload.userId);
  if (!access) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "Пользователь не найден. Войдите заново.",
    });
  }

  // Проверяем профиль кабинета для маршрутов с ограничениями по профилю
  if (requiredRoles && !hasRequiredRole(access.baseRole, requiredRoles)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `Доступ запрещен. Требуется одна из ролей: ${requiredRoles.join(", ")}`,
    });
  }

  // Добавляем данные пользователя в контекст события
  // Теперь в API handlers можно получить доступ через event.context.user
  event.context.user = toContextUser(access);
});
