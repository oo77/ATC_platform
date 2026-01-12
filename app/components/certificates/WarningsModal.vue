<template>
  <UiModal
    :is-open="isOpen"
    title="Предупреждения перед выдачей"
    size="sm"
    @close="emit('close')"
  >
    <!-- Иконка предупреждения -->
    <div class="flex flex-col items-center text-center mb-6">
      <div class="mx-auto mb-4 h-14 w-14 rounded-full bg-warning/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>

      <p v-if="student" class="text-gray-500 dark:text-gray-400 mb-4">
        Студент: <span class="font-medium text-gray-900 dark:text-white">{{ student.fullName }}</span>
      </p>
    </div>

    <!-- Список предупреждений -->
    <div class="space-y-3 mb-6">
      <div
        v-for="(warning, idx) in warnings"
        :key="idx"
        class="flex gap-3 p-3 bg-warning/5 border border-warning/20 rounded-lg"
      >
        <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ warningLabels[warning.type] || warning.type }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ warning.message }}
          </p>
        </div>
      </div>
    </div>

    <p class="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
      Вы уверены, что хотите выдать сертификат несмотря на предупреждения?
    </p>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="emit('close')">
          Отмена
        </UiButton>
        <UiButton variant="warning" @click="emit('confirm')">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Всё равно выдать
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { IssueWarning } from '~/types/certificate';

defineProps<{
  isOpen: boolean;
  student: { id: string; fullName: string } | null;
  warnings: IssueWarning[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const warningLabels: Record<string, string> = {
  low_attendance: 'Низкая посещаемость',
  missing_grades: 'Не все оценки выставлены',
  low_grade: 'Низкий балл',
  incomplete_disciplines: 'Пройдены не все дисциплины',
};
</script>
