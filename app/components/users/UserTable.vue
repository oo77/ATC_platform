<template>
  <div class="overflow-x-auto">
    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-2 text-left dark:bg-meta-4">
          <th class="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
            Пользователь
          </th>
          <th class="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
            Email
          </th>
          <th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Телефон
          </th>
          <th v-if="showWorkplace" class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Место работы
          </th>
          <th v-if="showPosition" class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Должность
          </th>
          <th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Дата создания
          </th>
          <th class="px-4 py-4 font-medium text-black dark:text-white">
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Загрузка -->
        <tr v-if="loading">
          <td :colspan="columnCount" class="text-center py-12">
            <div class="flex justify-center items-center">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных -->
        <tr v-else-if="users.length === 0">
          <td :colspan="columnCount" class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400">Пользователи не найдены</p>
          </td>
        </tr>

        <!-- Список пользователей -->
        <tr
          v-for="user in users"
          :key="user.id"
          class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
        >
          <td class="px-4 py-5 pl-9 xl:pl-11">
            <NuxtLink 
              :to="`/users/${user.id}`"
              class="flex items-center gap-3 group"
            >
              <div class="shrink-0">
                <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <span class="text-primary font-medium text-lg">
                    {{ getUserInitials(user.name) }}
                  </span>
                </div>
              </div>
              <div>
                <h5 class="font-medium text-black dark:text-white group-hover:text-primary transition-colors">
                  {{ user.name }}
                </h5>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  ID: {{ user.id.substring(0, 8) }}...
                </p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">{{ user.email }}</p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ user.phone || '—' }}
            </p>
          </td>
          <td v-if="showWorkplace" class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ user.workplace || '—' }}
            </p>
          </td>
          <td v-if="showPosition" class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ user.position || '—' }}
            </p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ formatDate(user.created_at) }}
            </p>
          </td>
          <td class="px-4 py-5">
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/users/${user.id}`">
                <UiButton
                  variant="outline"
                  size="sm"
                  title="Просмотр профиля"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </UiButton>
              </NuxtLink>
              <UiButton
                variant="primary"
                size="sm"
                @click="$emit('edit', user)"
                title="Редактировать"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </UiButton>
              <UiButton
                variant="warning"
                size="sm"
                @click="$emit('reset-password', user)"
                title="Сбросить пароль"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                @click="$emit('delete', user.id)"
                title="Удалить"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  />
                </svg>
              </UiButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UserRole, UserPublic } from '~/types/auth';

interface Props {
  users: UserPublic[];
  loading: boolean;
  role: UserRole;
}

const props = defineProps<Props>();

// Определяем, какие колонки показывать в зависимости от роли
const showWorkplace = computed(() => {
  return ['ADMIN', 'MANAGER', 'TEACHER'].includes(props.role);
});

const showPosition = computed(() => {
  return ['ADMIN', 'MANAGER', 'TEACHER'].includes(props.role);
});

const columnCount = computed(() => {
  let count = 5; // Базовые колонки: Пользователь, Email, Телефон, Дата создания, Действия
  if (showWorkplace.value) count++;
  if (showPosition.value) count++;
  return count;
});

// Эмиты
defineEmits<{
  edit: [user: UserPublic];
  'reset-password': [user: UserPublic];
  delete: [userId: string];
}>();

// Утилиты
const getUserInitials = (name: string): string => {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>
