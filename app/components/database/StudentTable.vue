<template>
  <div class="overflow-x-auto">
    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-2 text-left dark:bg-meta-4">
          <th class="min-w-[250px] px-4 py-4 font-medium text-black dark:text-white xl:pl-11">
            Ф.И.О
          </th>
          <th class="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
            Организация
          </th>
          <th class="min-w-[180px] px-4 py-4 font-medium text-black dark:text-white">
            Должность
          </th>
          <th class="px-4 py-4 font-medium text-black dark:text-white text-center">
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="4" class="text-center py-12">
            <div class="flex justify-center items-center">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных -->
        <tr v-else-if="students.length === 0">
          <td colspan="4" class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400">Студенты не найдены</p>
          </td>
        </tr>

        <!-- Список студентов -->
        <tr
          v-for="student in students"
          :key="student.id"
          @click="navigateToStudent(student.id)"
          class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"
        >
          <td class="px-4 py-5 pl-9 xl:pl-11">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span class="text-primary font-medium text-lg">
                    {{ getInitials(student.fullName) }}
                  </span>
                </div>
              </div>
              <div>
                <h5 class="font-medium text-black dark:text-white">
                  {{ student.fullName }}
                </h5>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  ПИНФЛ: {{ student.pinfl }}
                </p>
              </div>
            </div>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">{{ student.organization }}</p>
          </td>
          <td class="px-4 py-5">
            <p class="text-black dark:text-white">{{ student.position }}</p>
          </td>
          <td class="px-4 py-5">
            <div class="flex items-center justify-center gap-2">
              <UiButton
                variant="primary"
                size="sm"
                @click.stop="$emit('edit', student)"
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
                variant="danger"
                size="sm"
                @click.stop="$emit('delete', student.id)"
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
import type { Student } from '~/types/student';

interface Props {
  students: Student[];
  loading: boolean;
}

defineProps<Props>();

// Эмиты
defineEmits<{
  edit: [student: Student];
  delete: [studentId: string];
  'view-certificates': [student: Student];
}>();

// Навигация
const router = useRouter();

const navigateToStudent = (studentId: string) => {
  router.push(`/students/${studentId}`);
};

// Утилиты
const getInitials = (fullName: string): string => {
  const parts = fullName.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (fullName.length >= 2) {
    return fullName.substring(0, 2).toUpperCase();
  }
  return fullName.toUpperCase();
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
