<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.stop="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11 bg-linear-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
        {{ userInitials }}
      </span>

      <span class="hidden sm:block mr-1 font-medium text-theme-sm">{{ userName }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="dropdownOpen"
        class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-99999"
      >
        <div>
          <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {{ user?.name || 'Пользователь' }}
          </span>
          <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {{ user?.email || 'Нет email' }}
          </span>
          <span 
            class="mt-1 inline-block px-2 py-0.5 text-xs font-medium rounded-full"
            :class="getRoleBadgeClass(user?.role)"
          >
            {{ getRoleLabel(user?.role) }}
          </span>
        </div>

        <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li v-for="item in menuItems" :key="item.href">
            <NuxtLink
              :to="item.href"
              @click="closeDropdown"
              class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <component
                :is="item.icon"
                class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
              />
              {{ item.text }}
            </NuxtLink>
          </li>
        </ul>
        
        <button
          @click="handleSignOut"
          class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <LogoutIcon
            class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
          />
          Выйти
        </button>
      </div>
    </Transition>
    <!-- Dropdown End -->
  </div>
</template>

<script setup lang="ts">
import UserCircleIcon from '~/components/icons/UserCircleIcon.vue'
import ChevronDownIcon from '~/components/icons/ChevronDownIcon.vue'
import LogoutIcon from '~/components/icons/LogoutIcon.vue'
import SettingsIcon from '~/components/icons/SettingsIcon.vue'
import InfoCircleIcon from '~/components/icons/InfoCircleIcon.vue'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '~/composables/useAuth'

const { user, logout } = useAuth()

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const menuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Профиль' },
  { href: '/settings', icon: SettingsIcon, text: 'Настройки' },
  { href: '/support', icon: InfoCircleIcon, text: 'Поддержка' },
]

// Вычисляемые свойства для отображения данных пользователя
const userName = computed(() => {
  if (!user.value) return 'Гость'
  return user.value.name || 'Пользователь'
})

const userInitials = computed(() => {
  if (!user.value || !user.value.name) return 'U'
  
  const parts = user.value.name.split(' ').filter(p => p.length > 0)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0][0]
    const second = parts[1][0]
    if (first && second) {
      return (first + second).toUpperCase()
    }
  }
  if (parts.length >= 1 && parts[0]) {
    const first = parts[0][0]
    if (first) {
      return first.toUpperCase()
    }
  }
  return 'U'
})

// Получение метки роли на русском
const getRoleLabel = (role?: string) => {
  const labels: Record<string, string> = {
    'ADMIN': 'Администратор',
    'MANAGER': 'Менеджер',
    'TEACHER': 'Преподаватель',
    'STUDENT': 'Студент',
  }
  return labels[role || ''] || role || 'Неизвестно'
}

// Получение CSS классов для бейджа роли
const getRoleBadgeClass = (role?: string) => {
  const classes: Record<string, string> = {
    'ADMIN': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'MANAGER': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'TEACHER': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'STUDENT': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  }
  return classes[role || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleSignOut = async () => {
  closeDropdown()
  await logout()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  // Небольшая задержка, чтобы избежать немедленного закрытия при открытии
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside)
  }, 100)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
