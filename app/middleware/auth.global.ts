import { UserRole } from '~/types/auth'
import { 
  Permission, 
  PAGE_PERMISSIONS, 
  roleHasPermission, 
  roleHasAllPermissions, 
  roleHasAnyPermission,
  type RoutePermissionConfig 
} from '~/types/permissions'

/**
 * Публичные страницы, доступные без аутентификации
 */
const PUBLIC_PAGES = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
]

/**
 * Проверяет, является ли страница публичной
 */
function isPublicPage(path: string): boolean {
  return PUBLIC_PAGES.some(page => path.startsWith(page))
}

/**
 * Сопоставляет путь с паттерном (поддерживает [id] wildcard)
 */
function matchPath(path: string, pattern: string): boolean {
  // Преобразуем паттерн в регулярное выражение
  const regexPattern = pattern
    .replace(/\[.*?\]/g, '[^/]+') // [id] -> любой сегмент
    .replace(/\//g, '\\/') // экранируем слеши
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(path)
}

/**
 * Находит конфигурацию разрешений для страницы
 */
function findPagePermissionConfig(path: string): RoutePermissionConfig | null {
  for (const config of PAGE_PERMISSIONS) {
    if (matchPath(path, config.path)) {
      return config
    }
  }
  return null
}

/**
 * Проверяет доступ пользователя к странице
 */
function checkPageAccess(path: string, userRole: UserRole): { allowed: boolean; reason?: string } {
  const config = findPagePermissionConfig(path)
  
  // Если конфигурация не найдена — разрешаем (может быть страница без ограничений)
  if (!config) {
    return { allowed: true }
  }

  // Проверяем разрешённые роли
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (!config.allowedRoles.includes(userRole)) {
      return { 
        allowed: false, 
        reason: `Требуется одна из ролей: ${config.allowedRoles.join(', ')}` 
      }
    }
  }

  // Проверяем обязательные разрешения (AND)
  if (config.requiredPermissions && config.requiredPermissions.length > 0) {
    if (!roleHasAllPermissions(userRole, config.requiredPermissions)) {
      const missing = config.requiredPermissions.filter(p => !roleHasPermission(userRole, p))
      return { 
        allowed: false, 
        reason: `Недостаточно прав: ${missing.join(', ')}` 
      }
    }
  }

  // Проверяем альтернативные разрешения (OR)
  if (config.anyPermissions && config.anyPermissions.length > 0) {
    if (!roleHasAnyPermission(userRole, config.anyPermissions)) {
      return { 
        allowed: false, 
        reason: `Требуется одно из разрешений: ${config.anyPermissions.join(', ')}` 
      }
    }
  }

  return { allowed: true }
}

/**
 * Клиентский middleware для защиты страниц
 * 
 * Логика работы:
 * 1. Пропускает публичные страницы без проверки
 * 2. Для защищенных страниц проверяет наличие токена
 * 3. Использует кэшированное состояние пользователя (быстро)
 * 4. Верифицирует токен через API только если пользователь не загружен
 * 5. Проверяет разрешения (permissions) на основе роли пользователя
 * 6. Редиректит на /auth/signin если не авторизован
 * 7. Редиректит на главную если недостаточно прав
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // Пропускаем публичные страницы
  if (isPublicPage(to.path)) {
    return
  }

  // Получаем токен из cookie
  const token = useCookie('auth_token')

  // Если токена нет - редирект на страницу входа
  if (!token.value) {
    return navigateTo({
      path: '/auth/signin',
      query: { redirect: to.fullPath },
    })
  }

  // Получаем состояние пользователя из useState (кэш)
  const userState = useState<any>('auth:user')
  let user = userState.value

  // Если пользователь не загружен, верифицируем токен через API
  if (!user) {
    try {
      const response = await $fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      // Проверяем успешность верификации
      if (!response.success || !response.user) {
        throw new Error('Верификация не удалась')
      }

      // Сохраняем пользователя в состояние для последующих переходов
      user = response.user
      userState.value = user
    } catch (error) {
      // Токен невалиден или произошла ошибка
      console.error('[Auth Middleware] Ошибка верификации:', error)

      // Удаляем невалидный токен
      token.value = null
      userState.value = null

      // Редирект на страницу входа
      return navigateTo({
        path: '/auth/signin',
        query: { 
          redirect: to.fullPath,
          error: 'session_expired',
        },
      })
    }
  }

  // Проверяем разрешения для страницы
  const accessCheck = checkPageAccess(to.path, user.role as UserRole)

  if (!accessCheck.allowed) {
    console.warn(`[Auth Middleware] Доступ запрещён для ${user.email} (${user.role}) к ${to.path}: ${accessCheck.reason}`)
    
    // Недостаточно прав - редирект на главную с сообщением
    return navigateTo({
      path: '/',
      query: { 
        error: 'access_denied',
        message: accessCheck.reason,
      },
    })
  }

  // Все проверки пройдены, пользователь может получить доступ к странице
})
