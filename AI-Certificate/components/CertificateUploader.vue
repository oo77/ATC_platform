<template>
  <div class="glass p-8 rounded-3xl">
    <h2 class="text-2xl font-bold mb-6 text-slate-800">Загрузить сертификат</h2>

    <!-- Upload Area -->
    <div v-if="!selectedFile && !processing" @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop" :class="[
        'border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer',
        isDragging
          ? 'border-primary-500 bg-primary-50 scale-105'
          : 'border-slate-300 hover:border-primary-400 hover:bg-slate-50'
      ]" @click="triggerFileInput">
      <div class="flex flex-col items-center">
        <div
          class="w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <h3 class="text-xl font-semibold text-slate-700 mb-2">
          Перетащите изображение или PDF сюда
        </h3>
        <p class="text-slate-500 mb-4">
          или нажмите для выбора
        </p>
        <p class="text-sm text-slate-400 mb-2">
          Поддерживаются: JPG, PNG, PDF (макс. 10 МБ)
        </p>
        <p class="text-xs text-green-600 bg-green-50 px-4 py-2 rounded-lg">
          ✅ PDF файлы автоматически конвертируются в изображение
        </p>
      </div>

      <input ref="fileInput" type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" @change="handleFileSelect"
        class="hidden" />
    </div>

    <!-- Processing State -->
    <div v-if="processing" class="text-center py-12">
      <div class="inline-block">
        <div class="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
      </div>
      <h3 class="text-xl font-semibold text-slate-700 mb-2">
        Обработка сертификата...
      </h3>
      <p class="text-slate-500">
        AI анализирует документ и извлекает данные
      </p>
      <div class="mt-6 max-w-md mx-auto">
        <div class="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>{{ processingStep }}</span>
          <span>{{ processingProgress }}%</span>
        </div>
        <div class="w-full bg-slate-200 rounded-full h-2">
          <div class="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-500"
            :style="{ width: processingProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- Extracted Data Preview -->
    <div v-if="extractedData && !processing" class="mt-8 animate-fade-in">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-800">Извлечённые данные</h3>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-slate-500">Уверенность AI:</span>
          <div class="flex items-center space-x-1">
            <div class="w-24 bg-slate-200 rounded-full h-2">
              <div class="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full"
                :style="{ width: (extractedData.confidence * 100) + '%' }"></div>
            </div>
            <span class="text-sm font-semibold text-green-600">
              {{ Math.round(extractedData.confidence * 100) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Suggested Employee -->
      <div v-if="suggestedEmployee" class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-green-700 font-medium">Найден сотрудник:</p>
            <p class="text-lg font-bold text-green-900">
              {{ suggestedEmployee.lastName }} {{ suggestedEmployee.firstName }} {{ suggestedEmployee.middleName }}
            </p>
            <p class="text-sm text-green-600">
              {{ suggestedEmployee.position }} • {{ suggestedEmployee.department }}
            </p>
          </div>
          <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd" />
          </svg>
        </div>
      </div>

      <!-- Form Fields -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Информационное сообщение -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-900">Проверьте распознанные данные</p>
              <p class="text-xs text-blue-700 mt-1">
                ✅ Поля с зеленой галочкой заполнены автоматически
                <br>
                ⚠️ Желтые поля требуют ручного ввода
              </p>
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- ФИО -->
          <div class="relative">
            <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>ФИО *</span>
              <span v-if="!formData.fullName" class="text-xs text-amber-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                Введите вручную
              </span>
              <span v-else class="text-xs text-green-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Распознано
              </span>
            </label>
            <input v-model="formData.fullName" type="text" required :class="[
              'w-full px-4 py-3 rounded-xl border transition-all',
              !formData.fullName
                ? 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                : 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
            ]" placeholder="Atabayev Ravshanbek" />
          </div>

          <!-- Номер сертификата -->
          <div class="relative">
            <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>Номер сертификата *</span>
              <span v-if="formData.certificateNumber" class="text-xs text-green-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Распознано
              </span>
            </label>
            <input v-model="formData.certificateNumber" type="text" required :class="[
              'w-full px-4 py-3 rounded-xl border transition-all',
              formData.certificateNumber
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            ]" placeholder="ATC25_APAP_176" />
          </div>

          <!-- Дата выдачи -->
          <div class="relative">
            <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>Дата выдачи *</span>
              <span v-if="formData.issueDate" class="text-xs text-green-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Распознано
              </span>
            </label>
            <input v-model="formData.issueDate" type="date" required :class="[
              'w-full px-4 py-3 rounded-xl border transition-all',
              formData.issueDate
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            ]" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Срок действия</label>
            <input v-model="formData.expiryDate" type="date"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" />
          </div>

          <!-- Организация -->
          <div class="md:col-span-2 relative">
            <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>Выдавшая организация *</span>
              <span v-if="!formData.organization" class="text-xs text-amber-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd" />
                </svg>
                Введите вручную
              </span>
              <span v-else class="text-xs text-green-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Распознано
              </span>
            </label>
            <input v-model="formData.organization" type="text" required :class="[
              'w-full px-4 py-3 rounded-xl border transition-all',
              !formData.organization
                ? 'border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                : 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
            ]" placeholder="UZBEKISTAN AIRPORTS TRAINING CENTER" />
          </div>

          <!-- Название курса -->
          <div class="md:col-span-2 relative">
            <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center justify-between">
              <span>Название курса *</span>
              <span v-if="formData.courseName" class="text-xs text-green-600 flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd" />
                </svg>
                Распознано
              </span>
            </label>
            <input v-model="formData.courseName" type="text" required :class="[
              'w-full px-4 py-3 rounded-xl border transition-all',
              formData.courseName
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                : 'border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200'
            ]" placeholder="PASSENGER HANDLING SERVICES SPECIALISTS" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Количество часов</label>
            <input v-model="formData.courseHours" type="number"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              placeholder="72" />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between pt-6 border-t border-slate-200">
          <button type="button" @click="reset"
            class="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors">
            Отменить
          </button>

          <button type="submit" :disabled="saving"
            class="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <span v-if="!saving">Сохранить сертификат</span>
            <span v-else>Сохранение...</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
      <div class="flex items-start space-x-3">
        <svg class="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clip-rule="evenodd" />
        </svg>
        <div>
          <p class="font-medium text-red-800">Ошибка</p>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExtractedCertificateData, Employee } from '~/types';

const emit = defineEmits(['certificate-processed']);

const { uploadCertificate, saveCertificate } = useCertificates();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const processing = ref(false);
const processingStep = ref('');
const processingProgress = ref(0);
const extractedData = ref<ExtractedCertificateData | null>(null);
const suggestedEmployee = ref<Employee | null>(null);
const error = ref<string | null>(null);
const saving = ref(false);

const formData = ref({
  fullName: '',
  certificateNumber: '',
  issueDate: '',
  expiryDate: '',
  organization: '',
  courseName: '',
  courseHours: '',
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = async (file: File) => {
  // Валидация файла
  const maxSize = 10 * 1024 * 1024; // 10 МБ
  if (file.size > maxSize) {
    error.value = 'Размер файла не должен превышать 10 МБ';
    return;
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Поддерживаются только JPG, PNG и PDF файлы.';
    return;
  }

  selectedFile.value = file;
  error.value = null;
  processing.value = true;

  try {
    // Симуляция этапов обработки
    processingStep.value = 'Загрузка файла...';
    processingProgress.value = 20;
    await new Promise(resolve => setTimeout(resolve, 500));

    processingStep.value = 'Распознавание текста (OCR)...';
    processingProgress.value = 50;
    await new Promise(resolve => setTimeout(resolve, 1000));

    processingStep.value = 'AI анализ данных...';
    processingProgress.value = 80;

    // Загрузить и обработать сертификат
    const response = await uploadCertificate(file);

    processingProgress.value = 100;
    await new Promise(resolve => setTimeout(resolve, 300));

    // Сохранить результаты
    extractedData.value = response.extractedData;
    suggestedEmployee.value = response.suggestedEmployee || null;

    // Заполнить форму извлечёнными данными
    formData.value = {
      fullName: response.extractedData.fullName || '',
      certificateNumber: response.extractedData.certificateNumber || '',
      issueDate: response.extractedData.issueDate || '',
      expiryDate: response.extractedData.expiryDate || '',
      organization: response.extractedData.organization || '',
      courseName: response.extractedData.courseName || '',
      courseHours: response.extractedData.courseHours || '',
    };

  } catch (e: any) {
    error.value = e.message || 'Ошибка при обработке файла';
  } finally {
    processing.value = false;
    processingStep.value = '';
    processingProgress.value = 0;
  }
};

const handleSubmit = async () => {
  saving.value = true;
  error.value = null;

  try {
    const certificateData = {
      employeeId: suggestedEmployee.value?.id || 0,
      certificateNumber: formData.value.certificateNumber,
      certificateType: 'Обучение', // Можно добавить выбор типа
      issuingOrganization: formData.value.organization,
      issueDate: formData.value.issueDate,
      expiryDate: formData.value.expiryDate || undefined,
      courseName: formData.value.courseName,
      courseHours: formData.value.courseHours ? Number(formData.value.courseHours) : undefined,
      status: 'active' as const,
      fileUrl: `/uploads/${selectedFile.value?.name}`,
      fileName: selectedFile.value?.name || '',
      fileType: selectedFile.value?.type || '',
      extractedData: extractedData.value,
      verificationStatus: 'verified' as const,
    };

    await saveCertificate(certificateData);

    emit('certificate-processed', certificateData);

    // Показать успешное сообщение и сбросить форму
    alert('Сертификат успешно сохранён!');
    reset();

  } catch (e: any) {
    error.value = e.message || 'Ошибка при сохранении сертификата';
  } finally {
    saving.value = false;
  }
};

const reset = () => {
  selectedFile.value = null;
  extractedData.value = null;
  suggestedEmployee.value = null;
  error.value = null;
  formData.value = {
    fullName: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    organization: '',
    courseName: '',
    courseHours: '',
  };
};
</script>
