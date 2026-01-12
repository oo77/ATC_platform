<script setup lang="ts">
/**
 * Компонент-обёртка для условного отображения контента на основе разрешений
 * 
 * Использование:
 * ```vue
 * <PermissionGuard :permission="Permission.USERS_CREATE">
 *   <button>Создать пользователя</button>
 * </PermissionGuard>
 * 
 * <PermissionGuard :any-permissions="[Permission.STUDENTS_VIEW_ALL, Permission.STUDENTS_VIEW_OWN]">
 *   <StudentList />
 * </PermissionGuard>
 * 
 * <PermissionGuard :all-permissions="[Permission.USERS_VIEW, Permission.USERS_UPDATE]" fallback>
 *   <template #default>Контент для авторизованных</template>
 *   <template #fallback>У вас нет прав для просмотра</template>
 * </PermissionGuard>
 * ```
 */

import { computed } from 'vue'
import { usePermissions } from '~/composables/usePermissions'
import { Permission } from '~/types/permissions'
import { UserRole } from '~/types/auth'

interface Props {
  /** Одно требуемое разрешение */
  permission?: Permission
  /** Все разрешения должны быть (AND) */
  allPermissions?: Permission[]
  /** Хотя бы одно разрешение (OR) */
  anyPermissions?: Permission[]
  /** Разрешённые роли */
  allowedRoles?: UserRole[]
  /** Показывать fallback слот при отсутствии доступа */
  fallback?: boolean
}

const props = defineProps<Props>()

const { hasPermission, hasAllPermissions, hasAnyPermission, currentRole } = usePermissions()

/**
 * Вычисляем, есть ли доступ
 */
const hasAccess = computed<boolean>(() => {
  // Проверка одного разрешения
  if (props.permission) {
    if (!hasPermission(props.permission)) return false
  }

  // Проверка всех разрешений (AND)
  if (props.allPermissions && props.allPermissions.length > 0) {
    if (!hasAllPermissions(props.allPermissions)) return false
  }

  // Проверка любого разрешения (OR)
  if (props.anyPermissions && props.anyPermissions.length > 0) {
    if (!hasAnyPermission(props.anyPermissions)) return false
  }

  // Проверка ролей
  if (props.allowedRoles && props.allowedRoles.length > 0) {
    if (!currentRole.value || !props.allowedRoles.includes(currentRole.value)) {
      return false
    }
  }

  return true
})
</script>

<template>
  <slot v-if="hasAccess" />
  <slot v-else-if="fallback" name="fallback" />
</template>
