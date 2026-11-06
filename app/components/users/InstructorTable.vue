<template>
  <!-- Контейнер со скроллом: sticky-шапка не пропадает при длинном списке -->
  <div class="max-h-[calc(100vh-16rem)] min-h-[200px] overflow-auto">
    <table class="w-full border-collapse text-left text-sm">
      <!-- Шапка без uppercase; добавлена пропущенная колонка «Статус» (раньше 6 заголовков на 7 ячеек — всё съезжало) -->
      <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">ФИО</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Email</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Телефон</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Приём на работу</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Часы (отраб./макс.)</th>
          <th class="px-4 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
          <th class="w-24 px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="7" class="py-12 text-center">
            <div class="flex items-center justify-center">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных: единое пустое состояние -->
        <tr v-else-if="instructors.length === 0">
          <td colspan="7">
            <UiEmptyState title="Инструкторы не найдены" description="Измените запрос поиска или статус" :icon="Users" />
          </td>
        </tr>

        <!-- Список инструкторов -->
        <tr
          v-for="instructor in instructors"
          :key="instructor.id"
          class="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          <td class="px-4 py-3">
            <NuxtLink :to="`/instructors/${instructor.id}`" class="flex items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                {{ getInitials(instructor.fullName) }}
              </div>
              <div class="min-w-0">
                <p class="truncate font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">{{ instructor.fullName }}</p>
                <p class="mt-0.5 text-[11px] text-gray-400">ID: {{ instructor.id.substring(0, 8) }}...</p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ instructor.email || '—' }}</td>
          <td class="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">{{ instructor.phone || '—' }}</td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-300">{{ instructor.hireDate ? formatDate(instructor.hireDate) : '—' }}</td>
          <td class="px-4 py-3 font-medium tabular-nums text-gray-700 dark:text-gray-300">
            {{ instructor.usedHours !== undefined ? Math.round(instructor.usedHours) : 0 }} / {{ instructor.maxHours }}
          </td>
          <!-- Статус: единый UiBadge вместо самописной плашки uppercase -->
          <td class="px-4 py-3">
            <UiBadge :color="instructor.isActive ? 'success' : 'light'">
              {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
            </UiBadge>
          </td>
          <!-- Действия: одна иконка (редактировать) + «⋯» с просмотром профиля -->
          <td class="px-4 py-3">
            <div class="flex items-center justify-end gap-1">
              <UiButton variant="ghost" size="sm" icon title="Редактировать" aria-label="Редактировать" @click="$emit('edit', instructor)">
                <Edit2 class="h-4 w-4" />
              </UiButton>
              <UiDropdown
                :groups="rowMenu(instructor)"
                icon-only
                variant="ghost"
                size="sm"
                aria-label="Ещё действия"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from '~/types/instructor';
import { Eye, Edit2, Users } from 'lucide-vue-next';

interface Props {
  instructors?: Instructor[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  instructors: () => [],
  loading: false,
});

// Меню «⋯» строки: сейчас единственный пункт — переход в профиль (ссылка, без эмитов)
const rowMenu = (instructor: Instructor) => [
  { items: [{ key: 'view', label: 'Просмотр профиля', icon: Eye, to: `/instructors/${instructor.id}` }] },
];

// Утилиты
const getInitials = (name: string): string => {
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
