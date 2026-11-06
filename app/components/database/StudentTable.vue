<template>
  <!-- Контейнер с ограничением высоты: шапка таблицы остаётся на виду при прокрутке длинного списка -->
  <div class="max-h-[70vh] overflow-auto">
    <table class="w-full border-collapse text-left">
      <!-- Sticky-шапка: непрозрачный фон, чтобы строки не просвечивали; без uppercase и мелкого шрифта -->
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Ф.И.О</th>
          <!-- Новая колонка: ПИНФЛ скрыт маской (чувствительные данные) -->
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">ПИНФЛ</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Организация</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Должность</th>
          <th class="sticky top-0 z-10 w-28 bg-white px-4 py-3 text-right text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <span class="sr-only">Действия</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <!-- Загрузка: компактный спиннер вместо большого блока -->
        <tr v-if="loading">
          <td colspan="5" class="py-12 text-center">
            <div class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Пусто: единый UiEmptyState с подсказкой следующего шага -->
        <tr v-else-if="students.length === 0">
          <td colspan="5">
            <UiEmptyState
              title="Слушатели не найдены"
              description="Измените параметры поиска или добавьте нового слушателя"
              :icon="Users"
            />
          </td>
        </tr>

        <!-- Список студентов: строка кликабельна (как и раньше) -->
        <tr
          v-for="student in students"
          :key="student.id"
          @click="navigateToStudent(student.id)"
          class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
        >
          <!-- ФИО + аватар с инициалами (меньше и спокойнее: 36px) -->
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                {{ getInitials(student.fullName) }}
              </div>
              <span class="text-sm font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                {{ student.fullName }}
              </span>
            </div>
          </td>

          <!-- ПИНФЛ через UiSensitiveValue; .stop — чтобы «глаз»/копирование не открывали профиль -->
          <td class="px-4 py-3" @click.stop>
            <UiSensitiveValue :value="student.pinfl" />
          </td>

          <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
            {{ student.organization }}
          </td>
          <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
            {{ student.position }}
          </td>

          <!-- Действия: 1 видимая иконка (редактирование) + «⋯» с остальным; опасное — последним. На touch видно всегда -->
          <td class="px-4 py-3" @click.stop>
            <div class="flex items-center justify-end gap-1">
              <UiButton
                variant="ghost"
                size="sm"
                icon
                title="Редактировать"
                aria-label="Редактировать слушателя"
                @click="$emit('edit', student)"
              >
                <Edit2 class="h-4 w-4" />
              </UiButton>
              <UiDropdown
                icon-only
                variant="ghost"
                size="sm"
                aria-label="Другие действия"
                :groups="rowMenu"
                @select="(key: string) => onRowAction(key, student)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Student } from "~/types/student";
import { Edit2, Trash2, Award, Users } from "lucide-vue-next";

interface Props {
  students: Student[];
  loading: boolean;
}

defineProps<Props>();

// Эмиты
const emit = defineEmits<{
  edit: [student: Student];
  delete: [studentId: string];
  "view-certificates": [student: Student];
}>();

// Навигация
const router = useRouter();

const navigateToStudent = (studentId: string) => {
  router.push(`/students/${studentId}`);
};

// Меню строки «⋯»: сначала безопасное (сертификаты), опасное «Удалить» — отдельной группой в самом конце
const rowMenu = [
  { items: [{ key: "certificates", label: "Сертификаты", icon: Award }] },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];

// Маршрутизация выбора пункта меню в уже существующие эмиты (контракт компонента не изменён);
// подтверждение удаления делает родитель через UiConfirmModal, как и раньше
const onRowAction = (key: string, student: Student) => {
  if (key === "certificates") emit("view-certificates", student);
  else if (key === "delete") emit("delete", student.id);
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
</script>
