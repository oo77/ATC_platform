<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Импорт сертификатов
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Массовый импорт сертификатов из Excel файла
        </p>
      </div>
      <NuxtLink
        to="/database"
        class="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад к базе данных
      </NuxtLink>
    </div>

    <!-- Шаги импорта -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div
          v-for="(step, index) in steps"
          :key="step.id"
          class="flex flex-1 items-center"
        >
          <div class="flex flex-col items-center flex-1">
            <div
              :class="[
                'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300',
                currentStep >= index + 1
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800',
              ]"
            >
              <svg v-if="currentStep > index + 1" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span v-else class="text-lg font-semibold">{{ index + 1 }}</span>
            </div>
            <p 
              class="mt-2 text-xs sm:text-sm font-medium text-center text-gray-700 dark:text-gray-300"
              :class="{ 'text-primary font-semibold': currentStep === index + 1 }"
            >
              {{ step.label }}
            </p>
          </div>
          <div
            v-if="index < steps.length - 1"
            :class="[
              'h-1 flex-1 transition-all duration-300',
              currentStep > index + 1 ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600',
            ]"
          />
        </div>
      </div>
    </div>

    <!-- Контент шагов -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <!-- Шаг 1: Выбор курса и срок действия -->
      <div v-show="currentStep === 1" class="p-6">
        <DatabaseCertificateImportCourseSelect
          :config="courseConfig"
          @update:config="handleCourseConfigUpdate"
          @next="handleCourseConfigComplete"
        />
      </div>

      <!-- Шаг 2: Загрузка файла -->
      <div v-show="currentStep === 2" class="p-6">
        <DatabaseCertificateImportUploader
          :loading="false"
          @back="handleGoBack"
          @file-selected="handleFileSelected"
          @next="handleFileComplete"
        />
      </div>

      <!-- Шаг 3: Настройки URL и опции -->
      <div v-show="currentStep === 3" class="p-6">
        <DatabaseCertificateImportSettings
          :loading="analyzing"
          :course-config="courseConfig"
          :course-info="courseInfo"
          :config="settingsConfig"
          @update:config="handleSettingsConfigUpdate"
          @back="handleGoBack"
          @analyze="handleAnalyze"
        />
      </div>

      <!-- Шаг 4: Анализ и предпросмотр -->
      <div v-show="currentStep === 4" class="p-6">
        <DatabaseCertificateImportAnalysis
          v-if="analysis"
          :analysis="analysis"
          :loading="importing"
          @back="handleGoBack"
          @confirm="handleConfirmImport"
        />
      </div>

      <!-- Шаг 5: Прогресс и результаты -->
      <div v-show="currentStep === 5" class="p-6">
        <DatabaseCertificateImportProgress
          v-if="importProgress && importProgress.status !== 'completed' && importProgress.status !== 'failed'"
          :progress="importProgress"
        />
        <DatabaseCertificateImportResults
          v-else-if="importResult"
          :result="importResult"
          @new-import="handleNewImport"
          @go-to-certificates="goToCertificates"
        />
      </div>
    </div>

    <!-- Уведомления -->
    <Teleport to="body">
      <div
        v-if="notification.show"
        class="fixed bottom-6 right-6 z-50 rounded-lg px-6 py-4 shadow-lg transition-all duration-300"
        :class="[
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
        ]"
      >
        <div class="flex items-center gap-3">
          <svg v-if="notification.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else-if="notification.type === 'error'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">{{ notification.message }}</span>
          <button @click="notification.show = false" class="ml-2 opacity-75 hover:opacity-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';

definePageMeta({
  layout: 'default',
});

// Шаги импорта (5 шагов)
const steps = [
  { id: 1, label: 'Курс' },
  { id: 2, label: 'Файл' },
  { id: 3, label: 'Настройки' },
  { id: 4, label: 'Анализ' },
  { id: 5, label: 'Импорт' },
];

const currentStep = ref(1);
const analyzing = ref(false);
const importing = ref(false);

// Конфигурация курса (шаг 1)
const courseConfig = reactive({
  courseSource: 'manual',
  courseId: '',
  courseName: '',
  courseCode: '',
  courseHours: null,
  validityType: 'unlimited',
  validityMonths: 12,
});

// Информация о курсе (для отображения)
const courseInfo = computed(() => {
  return {
    name: courseConfig.courseName,
    code: courseConfig.courseCode,
    hours: courseConfig.courseHours,
  };
});

// Выбранный файл (шаг 2)
const selectedFile = ref(null);

// Конфигурация настроек (шаг 3)
const settingsConfig = reactive({
  urlTemplate: '',
  createStudents: true,
  updateExisting: false,
  skipErrors: true,
});

// Результаты анализа (шаг 4)
const analysis = ref(null);

// Прогресс импорта (шаг 5)
const importProgress = ref(null);
const importResult = ref(null);
const jobId = ref(null);

// Уведомления
const notification = reactive({
  show: false,
  type: 'info',
  message: '',
});

const { authFetch } = useAuthFetch();

// Показать уведомление
const showNotification = (type, message) => {
  notification.type = type;
  notification.message = message;
  notification.show = true;
  
  setTimeout(() => {
    notification.show = false;
  }, 5000);
};

// Обновление конфигурации курса
const handleCourseConfigUpdate = (config) => {
  Object.assign(courseConfig, config);
};

// Завершение шага 1 (курс выбран)
const handleCourseConfigComplete = (config) => {
  Object.assign(courseConfig, config);
  currentStep.value = 2;
};

// Файл выбран
const handleFileSelected = (file) => {
  selectedFile.value = file;
};

// Завершение шага 2 (файл загружен)
const handleFileComplete = (file) => {
  selectedFile.value = file;
  currentStep.value = 3;
};

// Обновление настроек
const handleSettingsConfigUpdate = (config) => {
  Object.assign(settingsConfig, config);
};

// Анализ файла (шаг 3 -> 4)
const handleAnalyze = async (config) => {
  Object.assign(settingsConfig, config);
  
  if (!selectedFile.value) {
    showNotification('error', 'Файл не выбран');
    return;
  }

  analyzing.value = true;

  try {
    // Создаём FormData
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    
    // Формируем конфигурацию для API
    const importConfig = {
      courseSource: courseConfig.courseSource,
      courseId: courseConfig.courseId,
      courseName: courseConfig.courseName,
      courseCode: courseConfig.courseCode,
      courseHours: courseConfig.courseHours,
      validityType: courseConfig.validityType,
      validityMonths: courseConfig.validityMonths,
      urlTemplate: settingsConfig.urlTemplate,
      createStudents: settingsConfig.createStudents,
      updateExisting: settingsConfig.updateExisting,
      skipErrors: settingsConfig.skipErrors,
    };
    
    formData.append('config', JSON.stringify(importConfig));

    // Отправляем на анализ
    const response = await authFetch('/api/certificates/import/analyze', {
      method: 'POST',
      body: formData,
    });

    if (response.success && response.analysis) {
      // Добавляем courseInfo и config в analysis для отображения
      analysis.value = {
        ...response.analysis,
        courseInfo: courseInfo.value,
        config: courseConfig,
      };
      currentStep.value = 4;
      showNotification('success', 'Анализ файла завершён');
    } else {
      showNotification('error', response.error || 'Ошибка анализа файла');
    }
  } catch (error) {
    console.error('Ошибка анализа файла:', error);
    showNotification('error', 'Ошибка анализа файла: ' + (error.message || 'Неизвестная ошибка'));
  } finally {
    analyzing.value = false;
  }
};

// Подтверждение импорта (шаг 4 -> 5)
const handleConfirmImport = async () => {
  if (!analysis.value || analysis.value.validRows === 0) {
    showNotification('error', 'Нет данных для импорта');
    return;
  }

  importing.value = true;
  currentStep.value = 5;
  
  // Инициализируем прогресс
  importProgress.value = {
    status: 'processing',
    totalRecords: analysis.value.validRows,
    processedRecords: 0,
    createdStudents: 0,
    createdCertificates: 0,
    errors: [],
    startedAt: new Date(),
  };

  try {
    // Формируем данные для импорта
    const importData = {
      rows: analysis.value.preview.filter(row => row.status !== 'error'),
      config: {
        courseSource: courseConfig.courseSource,
        courseId: courseConfig.courseId,
        courseName: courseConfig.courseName,
        courseCode: courseConfig.courseCode,
        courseHours: courseConfig.courseHours,
        validityType: courseConfig.validityType,
        validityMonths: courseConfig.validityMonths,
        urlTemplate: settingsConfig.urlTemplate,
        createStudents: settingsConfig.createStudents,
        updateExisting: settingsConfig.updateExisting,
        skipErrors: settingsConfig.skipErrors,
      },
      courseInfo: courseInfo.value,
    };

    // Запускаем импорт
    const response = await authFetch('/api/certificates/import/execute', {
      method: 'POST',
      body: importData,
    });

    if (response.success && response.jobId) {
      jobId.value = response.jobId;
      startProgressPolling();
    } else {
      importProgress.value.status = 'failed';
      importResult.value = {
        totalProcessed: 0,
        createdStudents: 0,
        createdCertificates: 0,
        failed: analysis.value.validRows,
        skippedDuplicates: 0,
        errors: [{ rowNumber: 0, error: response.error || 'Ошибка запуска импорта' }],
        duration: 0,
      };
      showNotification('error', response.error || 'Ошибка запуска импорта');
    }
  } catch (error) {
    console.error('Ошибка запуска импорта:', error);
    importProgress.value.status = 'failed';
    importResult.value = {
      totalProcessed: 0,
      createdStudents: 0,
      createdCertificates: 0,
      failed: analysis.value?.validRows || 0,
      skippedDuplicates: 0,
      errors: [{ rowNumber: 0, error: error.message || 'Ошибка запуска импорта' }],
      duration: 0,
    };
    showNotification('error', 'Ошибка запуска импорта');
  } finally {
    importing.value = false;
  }
};

// Опрос статуса импорта
const startProgressPolling = () => {
  const pollInterval = setInterval(async () => {
    if (!jobId.value) {
      clearInterval(pollInterval);
      return;
    }

    try {
      const response = await authFetch(`/api/certificates/import/status/${jobId.value}`, {
        method: 'GET',
      });

      if (response.success && response.status) {
        importProgress.value = response.status;

        // Если импорт завершён
        if (response.status.status === 'completed' || response.status.status === 'failed') {
          clearInterval(pollInterval);
          
          // Формируем результат
          importResult.value = {
            totalProcessed: response.status.totalRecords || 0,
            createdStudents: response.status.createdStudents || 0,
            createdCertificates: response.status.createdCertificates || 0,
            failed: response.status.errors?.length || 0,
            skippedDuplicates: response.status.skippedDuplicates || 0,
            errors: response.status.errors || [],
            duration: response.status.completedAt 
              ? new Date(response.status.completedAt).getTime() - new Date(response.status.startedAt).getTime()
              : 0,
          };

          if (response.status.status === 'completed') {
            showNotification('success', `Импорт завершён! Создано ${response.status.createdCertificates} сертификатов.`);
          } else {
            showNotification('error', 'Импорт завершён с ошибками');
          }
        }
      }
    } catch (error) {
      console.error('Ошибка получения статуса импорта:', error);
      clearInterval(pollInterval);
    }
  }, 500); // Опрос каждые 500ms
};

// Навигация назад
const handleGoBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

// Новый импорт
const handleNewImport = () => {
  currentStep.value = 1;
  selectedFile.value = null;
  analysis.value = null;
  importProgress.value = null;
  importResult.value = null;
  jobId.value = null;
  
  // Сбрасываем конфигурации
  Object.assign(courseConfig, {
    courseSource: 'manual',
    courseId: '',
    courseName: '',
    courseCode: '',
    courseHours: null,
    validityType: 'unlimited',
    validityMonths: 12,
  });
  
  Object.assign(settingsConfig, {
    urlTemplate: '',
    createStudents: true,
    updateExisting: false,
    skipErrors: true,
  });
};

// Переход к сертификатам
const goToCertificates = () => {
  navigateTo('/database');
};
</script>
