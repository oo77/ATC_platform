<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-9999 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="handleBackdropClick"
        ></div>

        <!-- Modal -->
        <div class="relative bg-white dark:bg-boxdark rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ isProcessing ? 'Выдача сертификатов' : 'Подтверждение выдачи' }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ isProcessing ? 'Пожалуйста, подождите...' : `${studentsCount} слушателей` }}
                </p>
              </div>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-6">
            <!-- До начала обработки -->
            <template v-if="!isProcessing && !isCompleted">
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                Вы собираетесь выдать сертификаты <strong>{{ studentsCount }}</strong> слушателям.
              </p>
              
              <!-- Информация о шаблоне -->
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ templateName }}</p>
                    <p class="text-xs text-gray-500">Шаблон сертификата</p>
                  </div>
                </div>
              </div>

              <p class="text-sm text-gray-500 dark:text-gray-400">
                Продолжить выдачу?
              </p>
            </template>

            <!-- Прогресс выдачи -->
            <template v-else-if="isProcessing">
              <div class="space-y-4">
                <!-- Прогресс-бар -->
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600 dark:text-gray-400">Прогресс</span>
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ processedCount }} / {{ studentsCount }}
                    </span>
                  </div>
                  <div class="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      class="absolute left-0 top-0 h-full bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                      :style="{ width: `${progressPercent}%` }"
                    ></div>
                    <!-- Анимация пульса -->
                    <div 
                      v-if="progressPercent < 100"
                      class="absolute right-0 top-0 h-full w-12 bg-linear-to-l from-primary/30 to-transparent animate-pulse"
                      :style="{ left: `${Math.max(0, progressPercent - 5)}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Текущий студент -->
                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <svg class="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {{ currentStudentName || 'Обработка...' }}
                    </p>
                    <p class="text-xs text-gray-500">Создание сертификата...</p>
                  </div>
                </div>

                <!-- Статистика -->
                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="p-2 bg-success/10 rounded-lg">
                    <p class="text-lg font-bold text-success">{{ successCount }}</p>
                    <p class="text-xs text-success/80">Успешно</p>
                  </div>
                  <div class="p-2 bg-warning/10 rounded-lg">
                    <p class="text-lg font-bold text-warning">{{ warningCount }}</p>
                    <p class="text-xs text-warning/80">С замечаниями</p>
                  </div>
                  <div class="p-2 bg-danger/10 rounded-lg">
                    <p class="text-lg font-bold text-danger">{{ errorCount }}</p>
                    <p class="text-xs text-danger/80">Ошибки</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Завершено -->
            <template v-else-if="isCompleted">
              <div class="text-center py-4">
                <!-- Иконка успеха -->
                <div class="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Выдача завершена
                </h4>
                
                <p class="text-gray-500 dark:text-gray-400 mb-4">
                  Обработано {{ processedCount }} из {{ studentsCount }} слушателей
                </p>

                <!-- Итоговая статистика -->
                <div class="grid grid-cols-3 gap-3 text-center mb-4">
                  <div class="p-3 bg-success/10 rounded-lg">
                    <p class="text-2xl font-bold text-success">{{ successCount }}</p>
                    <p class="text-xs text-success/80">Выдано</p>
                  </div>
                  <div class="p-3 bg-warning/10 rounded-lg">
                    <p class="text-2xl font-bold text-warning">{{ warningCount }}</p>
                    <p class="text-xs text-warning/80">С замечаниями</p>
                  </div>
                  <div class="p-3 bg-danger/10 rounded-lg">
                    <p class="text-2xl font-bold text-danger">{{ errorCount }}</p>
                    <p class="text-xs text-danger/80">Ошибки</p>
                  </div>
                </div>

                <!-- Список ошибок -->
                <div v-if="errors.length > 0" class="text-left max-h-32 overflow-y-auto">
                  <p class="text-sm font-medium text-danger mb-2">Ошибки:</p>
                  <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li v-for="(err, idx) in errors" :key="idx" class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ err.studentName }}: {{ err.error }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <template v-if="!isProcessing && !isCompleted">
              <UiButton variant="outline" @click="handleClose">
                Отмена
              </UiButton>
              <UiButton variant="primary" @click="handleConfirm" :disabled="isConfirming">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Выдать сертификаты
              </UiButton>
            </template>
            
            <template v-else-if="isCompleted">
              <UiButton variant="primary" @click="handleClose">
                Закрыть
              </UiButton>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface BulkIssueResult {
  studentId: string;
  studentName: string;
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  warnings?: any[];
  error?: string;
}

interface Props {
  isOpen: boolean;
  studentsCount: number;
  templateName: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  confirm: [];
  progress: [{ processed: number; current: string }];
  complete: [results: BulkIssueResult[]];
}>();

// State
const isProcessing = ref(false);
const isCompleted = ref(false);
const isConfirming = ref(false); // Защита от двойного клика
const processedCount = ref(0);
const currentStudentName = ref('');
const successCount = ref(0);
const warningCount = ref(0);
const errorCount = ref(0);
const errors = ref<{ studentName: string; error: string }[]>([]);

// Progress
const progressPercent = computed(() => {
  if (props.studentsCount === 0) return 0;
  return Math.round((processedCount.value / props.studentsCount) * 100);
});

// Methods
const handleBackdropClick = () => {
  if (!isProcessing.value) {
    handleClose();
  }
};

const handleClose = () => {
  if (!isProcessing.value) {
    resetState();
    emit('close');
  }
};

const handleConfirm = () => {
  // Защита от двойного клика
  if (isConfirming.value) return;
  isConfirming.value = true;
  emit('confirm');
};

const resetState = () => {
  isProcessing.value = false;
  isCompleted.value = false;
  isConfirming.value = false;
  processedCount.value = 0;
  currentStudentName.value = '';
  successCount.value = 0;
  warningCount.value = 0;
  errorCount.value = 0;
  errors.value = [];
};

// Exposed methods for parent component
const startProcessing = () => {
  isProcessing.value = true;
  isCompleted.value = false;
  processedCount.value = 0;
  successCount.value = 0;
  warningCount.value = 0;
  errorCount.value = 0;
  errors.value = [];
};

const updateProgress = (studentName: string, processed: number) => {
  currentStudentName.value = studentName;
  processedCount.value = processed;
};

const addResult = (result: BulkIssueResult) => {
  // НЕ инкрементируем processedCount здесь - он уже обновляется в updateProgress
  
  if (result.success) {
    if (result.warnings && result.warnings.length > 0) {
      warningCount.value++;
    } else {
      successCount.value++;
    }
  } else {
    errorCount.value++;
    errors.value.push({
      studentName: result.studentName,
      error: result.error || 'Неизвестная ошибка',
    });
  }
};

const completeProcessing = (results: BulkIssueResult[]) => {
  isProcessing.value = false;
  isCompleted.value = true;
  currentStudentName.value = '';
  emit('complete', results);
};

// Watch for modal open/close
watch(() => props.isOpen, (open) => {
  if (!open) {
    resetState();
  }
});

// Expose methods
defineExpose({
  startProcessing,
  updateProgress,
  addResult,
  completeProcessing,
});
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
}
</style>
