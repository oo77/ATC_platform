<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" title="Введите пароль">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="flex items-center gap-3 mb-4">
        <svg class="h-12 w-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p class="text-sm font-medium text-black dark:text-white">
            Папка защищена паролем
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Введите пароль для доступа к содержимому
          </p>
        </div>
      </div>

      <div>
        <label for="password" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Пароль <span class="text-danger">*</span>
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autofocus
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': error }"
          placeholder="Введите пароль"
          @input="error = ''"
        />
        <p v-if="error" class="mt-1 text-sm text-danger">
          {{ error }}
        </p>
      </div>

      <div class="flex justify-end gap-4">
        <UiButton
          type="button"
          variant="secondary"
          @click="$emit('close')"
          :disabled="isSubmitting"
        >
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
        >
          <span v-if="!isSubmitting">Разблокировать</span>
          <span v-else class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            Проверка...
          </span>
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  isOpen: boolean;
  folderId: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [password: string];
  error: [message: string];
}>();

const password = ref('');
const error = ref('');
const isSubmitting = ref(false);

// Сброс формы при открытии
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    password.value = '';
    error.value = '';
    isSubmitting.value = false;
  }
});

const handleSubmit = () => {
  error.value = '';

  if (!password.value) {
    error.value = 'Введите пароль';
    return;
  }

  isSubmitting.value = true;
  emit('submit', password.value);
};

// Метод для установки ошибки извне
const setError = (message: string) => {
  error.value = message;
  isSubmitting.value = false;
};

// Экспортируем метод для родительского компонента
defineExpose({
  setError,
});
</script>
