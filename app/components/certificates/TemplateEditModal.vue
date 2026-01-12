<template>
  <UiModal
    :is-open="isOpen"
    title="Редактирование шаблона"
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
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        />
      </div>

      <!-- Описание -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        ></textarea>
      </div>

      <!-- Статус -->
      <div class="flex items-center gap-3">
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            v-model="form.isActive"
            type="checkbox"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {{ form.isActive ? 'Активен' : 'Неактивен' }}
        </span>
      </div>

      <!-- Кнопки -->
      <div class="flex justify-end gap-3 pt-4">
        <UiButton type="button" variant="outline" @click="handleClose" :disabled="isSubmitting">
          Отмена
        </UiButton>
        <UiButton type="submit" :loading="isSubmitting">
          Сохранить
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import type { CertificateTemplate } from '~/types/certificate';

const props = defineProps<{
  isOpen: boolean;
  template: CertificateTemplate | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'updated', template: CertificateTemplate): void;
}>();

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

// Form state
const form = reactive({
  name: '',
  description: '',
  isActive: true,
});

const isSubmitting = ref(false);

// Watch for template changes
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    form.name = newTemplate.name;
    form.description = newTemplate.description || '';
    form.isActive = newTemplate.isActive;
  }
}, { immediate: true });

// Close handler
const handleClose = () => {
  if (!isSubmitting.value) {
    emit('close');
  }
};

// Submit handler
const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  if (!props.template) return;

  isSubmitting.value = true;
  try {
    const response = await authFetch<{ success: boolean; template: CertificateTemplate }>(
      `/api/certificates/templates/${props.template.id}`,
      {
        method: 'PUT',
        body: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        },
      }
    );

    if (response.success) {
      showSuccess('Шаблон обновлён');
      emit('updated', response.template);
    }
  } catch (error: any) {
    console.error('Error updating template:', error);
    showError(error.data?.message || error.message || 'Ошибка обновления');
  } finally {
    isSubmitting.value = false;
  }
};
</script>
