<template>
  <UiModal
    :is-open="isOpen"
    title="Создание шаблона сертификата"
    size="sm"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Название -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Название шаблона *
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Например: Стандартный сертификат"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          :class="{ 'border-danger': errors.name }"
          required
        />
        <p v-if="errors.name" class="mt-1 text-sm text-danger">{{ errors.name }}</p>
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          placeholder="Краткое описание шаблона..."
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        ></textarea>
      </div>

      <!-- Формат номера -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Формат номера сертификата
        </label>
        <input
          v-model="form.numberFormat"
          type="text"
          placeholder="ATC{YY}_{CODE}_{NUM}"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Переменные: <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{YY}</code> — год, 
          <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{CODE}</code> — код курса, 
          <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{NUM}</code> — порядковый номер
        </p>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-3 pt-4">
        <UiButton type="button" variant="outline" @click="handleClose" :disabled="isSubmitting">
          Отмена
        </UiButton>
        <UiButton type="submit" :loading="isSubmitting">
          Создать
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from '~/types/certificate';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'created', template: CertificateTemplate): void;
}>();

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Form state
const form = reactive({
  name: '',
  description: '',
  numberFormat: 'ATC{YY}_{CODE}_{NUM}',
});

const errors = reactive({
  name: '',
});

const isSubmitting = ref(false);

// Reset form
const resetForm = () => {
  form.name = '';
  form.description = '';
  form.numberFormat = 'ATC{YY}_{CODE}_{NUM}';
  errors.name = '';
};

// Close handler
const handleClose = () => {
  if (!isSubmitting.value) {
    resetForm();
    emit('close');
  }
};

// Submit handler
const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  // Validate
  errors.name = '';
  if (!form.name.trim()) {
    errors.name = 'Название обязательно';
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate; message?: string }>(
      '/api/certificates/templates',
      {
        method: 'POST',
        body: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          numberFormat: form.numberFormat.trim() || undefined,
        },
      }
    );

    if (response.success) {
      showSuccess('Шаблон успешно создан');
      resetForm();
      emit('created', response.template);
    } else {
      showError(response.message || 'Ошибка создания шаблона');
    }
  } catch (error: any) {
    console.error('Error creating template:', error);
    showError(error.data?.message || error.message || 'Ошибка создания шаблона');
  } finally {
    isSubmitting.value = false;
  }
};

// Watch for modal open to reset form
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    resetForm();
  }
});
</script>
