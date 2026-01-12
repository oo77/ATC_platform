<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" title="Установить пароль на папку">
    <form @submit.prevent="handleSubmit" class="space-y-4">
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
          minlength="6"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': error }"
          placeholder="Минимум 6 символов"
        />
      </div>

      <div>
        <label for="confirmPassword" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Подтвердите пароль <span class="text-danger">*</span>
        </label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          minlength="6"
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': error }"
          placeholder="Повторите пароль"
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
          <span v-if="!isSubmitting">Установить пароль</span>
          <span v-else class="flex items-center gap-2">
            <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
            Сохранение...
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
}>();

const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const isSubmitting = ref(false);

// Сброс формы при открытии
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    password.value = '';
    confirmPassword.value = '';
    error.value = '';
    isSubmitting.value = false;
  }
});

const handleSubmit = () => {
  error.value = '';

  if (password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Пароли не совпадают';
    return;
  }

  isSubmitting.value = true;
  emit('submit', password.value);
};
</script>
