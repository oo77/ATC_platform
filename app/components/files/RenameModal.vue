<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" :title="title">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="newName" class="mb-2.5 block text-sm font-medium text-black dark:text-white">
          Новое имя <span class="text-danger">*</span>
        </label>
        <input
          id="newName"
          v-model="newName"
          type="text"
          required
          autofocus
          class="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          :class="{ 'border-danger': error }"
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
          <span v-if="!isSubmitting">Переименовать</span>
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
  currentName: string;
  title: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [newName: string];
}>();

const newName = ref('');
const error = ref('');
const isSubmitting = ref(false);

// Сброс формы при открытии
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    newName.value = props.currentName;
    error.value = '';
    isSubmitting.value = false;
  }
});

const handleSubmit = () => {
  error.value = '';

  if (!newName.value.trim()) {
    error.value = 'Имя не может быть пустым';
    return;
  }

  if (newName.value.trim() === props.currentName) {
    error.value = 'Новое имя совпадает с текущим';
    return;
  }

  isSubmitting.value = true;
  emit('submit', newName.value.trim());
};
</script>
