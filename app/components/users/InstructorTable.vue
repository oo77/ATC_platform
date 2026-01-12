<template>
  <div class="overflow-x-auto">
    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-2 text-left dark:bg-meta-4">
          <th class="min-w-[220px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
            ФИО
          </th>
          <th class="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
            Email
          </th>
          <th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Телефон
          </th>
          <th class="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
            Прием на работу
          </th>
          <th class="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
            Макс. часы
          </th>
          <th class="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
            Статус
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="6" class="text-center py-12">
            <div class="flex justify-center items-center">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных -->
        <tr v-else-if="instructors.length === 0">
          <td colspan="6" class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400">Инструкторы не найдены</p>
          </td>
        </tr>

        <!-- Список инструкторов -->
        <tr
          v-for="instructor in instructors"
          :key="instructor.id"
          class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
        >
          <td class="px-4 py-5 pl-9 xl:pl-11">
            <NuxtLink 
              :to="`/instructors/${instructor.id}`"
              class="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div class="shrink-0">
                <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-primary font-medium text-lg">
                    {{ getInitials(instructor.fullName) }}
                  </span>
                </div>
              </div>
              <div>
                <h5 class="font-medium text-black dark:text-white hover:text-primary transition-colors">
                  {{ instructor.fullName }}
                </h5>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  ID: {{ instructor.id.substring(0, 8) }}...
                </p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">{{ instructor.email || '—' }}</p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ instructor.phone || '—' }}
            </p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">
              {{ instructor.hireDate ? formatDate(instructor.hireDate) : '—' }}
            </p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white font-medium">
              {{ instructor.maxHours }}
            </p>
          </td>
          <td class="px-4 py-5">
            <span
              :class="[
                'inline-flex rounded-full px-3 py-1 text-sm font-medium',
                instructor.isActive
                  ? 'bg-success/10 text-success'
                  : 'bg-danger/10 text-danger'
              ]"
            >
              {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from '~/types/instructor';

interface Props {
  instructors?: Instructor[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  instructors: () => [],
  loading: false,
});

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
