<template>
  <!-- Контейнер со скроллом: sticky-шапка таблицы остаётся видимой при длинном списке -->
  <div class="max-h-[calc(100vh-16rem)] min-h-[200px] overflow-auto">
    <table class="w-full border-collapse text-left text-sm">
      <!-- Шапка: обычный регистр, без uppercase; sticky, чтобы названия колонок не терялись -->
      <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Пользователь</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Телефон</th>
          <th v-if="showWorkplace" class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Место работы</th>
          <th v-if="showPosition" class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Должность</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Дата создания</th>
          <th class="w-24 px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <!-- Загрузка -->
        <tr v-if="loading">
          <td :colspan="columnCount" class="py-12 text-center">
            <div class="flex items-center justify-center">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных: единое пустое состояние -->
        <tr v-else-if="users.length === 0">
          <td :colspan="columnCount">
            <UiEmptyState title="Пользователи не найдены" description="Измените запрос поиска или добавьте нового пользователя" :icon="Users" />
          </td>
        </tr>

        <!-- Список пользователей -->
        <tr
          v-for="user in users"
          :key="user.id"
          class="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          <td class="px-4 py-3">
            <NuxtLink :to="`/users/${user.id}`" class="flex items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                {{ getUserInitials(user.name) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">{{ user.name }}</p>
                <!-- ID оставлен, но приглушён и мелким (не меньше 11px) шрифтом -->
                <p class="mt-0.5 text-[11px] text-gray-400">ID: {{ user.id.substring(0, 8) }}...</p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ user.email }}</td>
          <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{{ user.phone || "—" }}</td>
          <td v-if="showWorkplace" class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ user.workplace || "—" }}</td>
          <td v-if="showPosition" class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ user.position || "—" }}</td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ formatDate(user.created_at) }}</td>
          <!-- Действия: одна видимая иконка (редактировать) + «⋯» для остального; удаление — последним и красным -->
          <td class="px-4 py-3">
            <div class="flex items-center justify-end gap-1">
              <UiButton variant="ghost" size="sm" icon title="Редактировать" aria-label="Редактировать" @click="$emit('edit', user)">
                <Edit2 class="h-4 w-4" />
              </UiButton>
              <UiDropdown
                :groups="rowMenu(user)"
                icon-only
                variant="ghost"
                size="sm"
                aria-label="Ещё действия"
                @select="(key) => onRowAction(key, user)"
              />
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
import { Eye, Edit2, Key, Trash2, Users } from "lucide-vue-next";

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

// Эмиты (сохраняем в переменную, чтобы вызывать из меню «⋯»)
const emit = defineEmits<{
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

// Меню «⋯» строки: просмотр и сброс пароля — обычные пункты, удаление — отдельной группой внизу (danger).
// Себя удалить нельзя — пункт блокируется, как раньше блокировалась кнопка.
const rowMenu = (user: UserPublic) => [
  {
    items: [
      { key: "view", label: "Просмотр профиля", icon: Eye, to: `/users/${user.id}` },
      { key: "reset-password", label: "Сбросить пароль", icon: Key },
    ],
  },
  {
    items: [
      {
        key: "delete",
        label: isCurrentUser(user.id) ? "Нельзя удалить себя" : "Удалить",
        icon: Trash2,
        danger: true,
        disabled: isCurrentUser(user.id),
      },
    ],
  },
];

// Маршрутизируем выбор пункта меню в прежние события (контракт эмитов не изменён)
const onRowAction = (key: string, user: UserPublic) => {
  if (key === "reset-password") emit("reset-password", user);
  else if (key === "delete") emit("delete", user.id);
};
</script>
