<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider xl:pl-11"
          >
            Пользователь
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Email
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Телефон
          </th>
          <th
            v-if="showWorkplace"
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Место работы
          </th>
          <th
            v-if="showPosition"
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Должность
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Дата создания
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Действия
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <!-- Загрузка -->
        <tr v-if="loading">
          <td :colspan="columnCount" class="text-center py-12">
            <div class="flex justify-center items-center">
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
              ></div>
              <span class="ml-3 text-gray-600 dark:text-gray-400"
                >Загрузка...</span
              >
            </div>
          </td>
        </tr>

        <!-- Нет данных -->
        <tr v-else-if="users.length === 0">
          <td :colspan="columnCount" class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400">
              Пользователи не найдены
            </p>
          </td>
        </tr>

        <!-- Список пользователей -->
        <tr
          v-for="user in users"
          :key="user.id"
          class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
        >
          <td class="px-6 py-4 xl:pl-11">
            <NuxtLink
              :to="`/users/${user.id}`"
              class="flex items-center gap-3 group"
            >
              <div class="shrink-0">
                <div
                  class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20"
                >
                  <span class="text-primary font-bold text-sm">
                    {{ getUserInitials(user.name) }}
                  </span>
                </div>
              </div>
              <div>
                <h5
                  class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                >
                  {{ user.name }}
                </h5>
                <p class="text-xs font-bold text-slate-500 mt-0.5">
                  ID: {{ user.id.substring(0, 8) }}...
                </p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">{{ user.email }}</p>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300 font-mono">
              {{ user.phone || "—" }}
            </p>
          </td>
          <td v-if="showWorkplace" class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ user.workplace || "—" }}
            </p>
          </td>
          <td v-if="showPosition" class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ user.position || "—" }}
            </p>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ formatDate(user.created_at) }}
            </p>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <NuxtLink :to="`/users/${user.id}`">
                <UiButton variant="outline" size="sm" title="Просмотр профиля" class="h-8 w-8 p-0! flex items-center justify-center rounded-lg">
                  <Eye class="w-4 h-4 text-slate-500" />
                </UiButton>
              </NuxtLink>
              <UiButton
                variant="primary"
                size="sm"
                @click="$emit('edit', user)"
                title="Редактировать"
                class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
              >
                <Edit2 class="w-4 h-4" />
              </UiButton>
              <UiButton
                variant="warning"
                size="sm"
                @click="$emit('reset-password', user)"
                title="Сбросить пароль"
                class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
              >
                <Key class="w-4 h-4" />
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                @click="$emit('delete', user.id)"
                :disabled="isCurrentUser(user.id)"
                :title="
                  isCurrentUser(user.id)
                    ? 'Нельзя удалить самого себя'
                    : 'Удалить'
                "
                class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
              >
                <Trash2 class="w-4 h-4" />
              </UiButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { UserRole, UserPublic } from "~/types/auth";
import { Eye, Edit2, Key, Trash2 } from "lucide-vue-next";

interface Props {
  users: UserPublic[];
  loading: boolean;
  role: UserRole;
}

const props = defineProps<Props>();

// Определяем, какие колонки показывать в зависимости от роли
const showWorkplace = computed(() => {
  return ["ADMIN", "MANAGER", "TEACHER"].includes(props.role);
});

const showPosition = computed(() => {
  return ["ADMIN", "MANAGER", "TEACHER"].includes(props.role);
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
  "reset-password": [user: UserPublic];
  delete: [userId: string];
}>();

// Утилиты
const getUserInitials = (name: string): string => {
  const parts = name.split(" ").filter((p) => p.length > 0);
  if (
    parts.length >= 2 &&
    parts[0] &&
    parts[1] &&
    parts[0].length > 0 &&
    parts[1].length > 0
  ) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Получаем текущего пользователя
const { user: currentUser } = useAuth();

const isCurrentUser = (userId: string) => {
  return currentUser.value?.id === userId;
};
</script>
