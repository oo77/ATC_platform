<template>
  <div class="mx-auto max-w-7xl">
    <!-- Заголовок -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Импорт студентов
      </h2>
    </div>

    <!-- Stepper (Индикатор шагов) -->
    <div class="mb-8 rounded-lg border border-stroke bg-white px-8 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div class="flex items-center justify-between">
        <div 
          v-for="step in steps" 
          :key="step.id"
          class="relative flex flex-col items-center flex-1"
        >
          <div 
            class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-300"
            :class="getStepClasses(step.id)"
          >
            <span v-if="step.id < store.currentStep" class="text-xl">✓</span>
            <span v-else class="text-sm font-bold">{{ step.id }}</span>
          </div>
          <span 
            class="mt-2 text-xs font-medium text-center"
            :class="step.id <= store.currentStep ? 'text-primary' : 'text-gray-500 dark:text-gray-400'"
          >
            {{ step.label }}
          </span>
          
          <!-- Линия прогресса -->
          <div 
            v-if="step.id !== steps.length"
            class="absolute top-5 left-[50%] w-full h-[2px] -z-10"
          >
             <div 
               class="h-full transition-all duration-300"
               :class="step.id < store.currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
             ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение об ошибке -->
    <div 
      v-if="store.error" 
      class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-red-900 dark:text-red-100">Ошибка</h4>
          <p class="text-sm text-red-700 dark:text-red-300">{{ store.error }}</p>
        </div>
        <button 
          @click="dismissError"
          class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Контент шагов -->
    <div class="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <!-- Шаг 1: Загрузка файла -->
      <div v-show="store.currentStep === 1" class="p-6">
        <DatabaseImportUploader
          :loading="store.isAnalyzing"
          @file-selected="handleFileSelected"
        />
      </div>

      <!-- Шаг 2: Анализ и предпросмотр -->
      <div v-show="store.currentStep === 2" class="p-6">
        <DatabaseImportAnalysis
          v-if="store.analysis"
          :analysis="store.analysis"
          :loading="store.isImporting"
          @confirm="handleConfirmImport"
          @cancel="handleCancelImport"
        />
         <div v-else-if="!selectedFile && !store.analysis" class="text-center py-10">
            <p class="text-gray-500">Файл не выбран или данные анализа потеряны. Пожалуйста, начните заново.</p>
             <button
              @click="handleCancelImport"
              class="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Вернуться к загрузке
            </button>
         </div>
      </div>

       <!-- Шаг 3: Прогресс импорта -->
      <div v-show="store.currentStep === 3" class="p-6">
        <DatabaseImportProgress
          v-if="store.progress"
          :progress="store.progress"
        />
        <div v-else class="flex flex-col items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p class="text-gray-500">Инициализация импорта...</p>
        </div>
      </div>

      <!-- Шаг 4: Результаты -->
      <div v-show="store.currentStep === 4" class="p-6">
        <DatabaseImportResults
          v-if="store.progress"
          :result="store.progress"
          @new-import="handleNewImport"
          @go-to-database="goToDatabase"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

// Шаги импорта - статичные данные
const steps = [
  { id: 1, label: 'Загрузка файла' },
  { id: 2, label: 'Предпросмотр' },
  { id: 3, label: 'Импорт' },
  { id: 4, label: 'Результаты' },
] as const;

const store = reactive(useImportStore());
const selectedFile = ref<File | null>(null);
const { error: showError } = useNotification();

// Классы для шагов stepper
const getStepClasses = (stepId: number): string[] => {
  if (stepId < store.currentStep) {
    return ['border-primary', 'bg-primary', 'text-white'];
  }
  if (stepId === store.currentStep) {
    return ['border-primary', 'text-primary'];
  }
  return ['border-gray-300', 'text-gray-400', 'dark:border-gray-600'];
};

// Восстановление polling при перезагрузке страницы
onMounted(() => {
  if (store.jobId && store.isImporting) {
    store.startPolling();
  }
});

// Очистка при размонтировании
onUnmounted(() => {
  // Не останавливаем polling полностью - он должен продолжить работу в фоне
  // Это обеспечивается module-level интервалом в store
});

// Обработка выбора файла
const handleFileSelected = (file: File) => {
  selectedFile.value = file;
  store.analyzeStudentImport(file);
};

// Подтверждение импорта
const handleConfirmImport = async () => {
  if (selectedFile.value) {
    store.executeStudentImport(selectedFile.value);
  } else if (store.analysis) {
    // Если файл потерян при refresh, но analysis есть
    showError('Файл был потерян при обновлении страницы. Пожалуйста, выберите файл заново.');
    store.currentStep = 1;
  }
};

// Отмена импорта
const handleCancelImport = () => {
  store.cancelImport();
  selectedFile.value = null;
};

// Новый импорт
const handleNewImport = () => {
  handleCancelImport();
};

// Переход к базе данных
const goToDatabase = () => {
  store.reset();
  navigateTo('/database');
};

// Скрытие ошибки
const dismissError = () => {
  // Создаём локальную копию для UI, но не меняем readonly error в store
  // error будет автоматически сброшен при следующем действии
  store.currentStep = store.currentStep; // Trigger reactivity without actual change
};
</script>
