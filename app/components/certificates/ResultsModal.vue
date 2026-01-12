<template>
  <UiModal
    :is-open="isOpen"
    title="Результаты выдачи"
    size="md"
    @close="emit('close')"
  >
    <!-- Иконка -->
    <div class="flex flex-col items-center text-center mb-6">
      <div class="mx-auto mb-4 h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <p class="text-gray-500 dark:text-gray-400">
        Успешно: <span class="text-success font-semibold">{{ successCount }}</span> • 
        Ошибок: <span class="text-danger font-semibold">{{ errorCount }}</span>
      </p>
    </div>

    <!-- Результаты -->
    <div class="max-h-80 overflow-y-auto space-y-2">
      <div
        v-for="result in results"
        :key="result.studentId"
        :class="[
          'flex items-center gap-3 p-3 rounded-lg',
          result.success
            ? 'bg-success/5 border border-success/20'
            : 'bg-danger/5 border border-danger/20'
        ]"
      >
        <div :class="[
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          result.success ? 'bg-success/10' : 'bg-danger/10'
        ]">
          <svg v-if="result.success" class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ result.studentName }}
          </p>
          <p v-if="result.success" class="text-sm text-success">
            Сертификат № {{ result.certificateNumber }}
          </p>
          <p v-else class="text-sm text-danger">
            {{ result.error }}
          </p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-center">
        <UiButton @click="emit('close')">
          Закрыть
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { IssueCertificatesResponse } from '~/types/certificate';

const props = defineProps<{
  isOpen: boolean;
  results: IssueCertificatesResponse['results'];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const successCount = computed(() => props.results.filter(r => r.success).length);
const errorCount = computed(() => props.results.filter(r => !r.success).length);
</script>
