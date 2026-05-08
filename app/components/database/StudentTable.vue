<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr
          class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
        >
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider xl:pl-11"
          >
            Ф.И.О
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Организация
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            Должность
          </th>
          <th
            class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
          >
            Действия
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="4" class="text-center py-12">
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
          class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
        >
          <td class="px-6 py-4 xl:pl-11">
            <div class="flex items-center gap-3 group">
              <div class="shrink-0">
                <div
                  class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20"
                >
                  <span class="text-primary font-bold text-sm">
                    {{ getInitials(student.fullName) }}
                  </span>
                </div>
              </div>
              <div>
                <h5
                  class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors"
                >
                  {{ student.fullName }}
                </h5>
                <!-- <p class="text-xs font-bold text-slate-500 mt-0.5">
                  ПИНФЛ: {{ student.pinfl }}
                </p> -->
              </div>
            </div>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ student.organization }}
            </p>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ student.position }}
            </p>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center justify-center gap-2">
              <UiButton
                variant="primary"
                size="sm"
                @click.stop="$emit('edit', student)"
                title="Редактировать"
                class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
              >
                <Edit2 class="w-4 h-4" />
              </UiButton>
              <UiButton
                variant="danger"
                size="sm"
                @click.stop="$emit('delete', student.id)"
                title="Удалить"
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
import type { Student } from "~/types/student";
import { Edit2, Trash2 } from "lucide-vue-next";

interface Props {
  students: Student[];
  loading: boolean;
}

defineProps<Props>();

// Эмиты
defineEmits<{
  edit: [student: Student];
  delete: [studentId: string];
  "view-certificates": [student: Student];
}>();

// Навигация
const router = useRouter();

const navigateToStudent = (studentId: string) => {
  router.push(`/students/${studentId}`);
};

// Утилиты
const getInitials = (fullName: string): string => {
  const parts = fullName.split(" ").filter((p) => p.length > 0);
  if (
    parts.length >= 2 &&
    parts[0] &&
    parts[1] &&
    parts[0].length > 0 &&
    parts[1].length > 0
  ) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (fullName.length >= 2) {
    return fullName.substring(0, 2).toUpperCase();
  }
  return fullName.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>
