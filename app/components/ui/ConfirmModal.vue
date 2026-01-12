<template>
  <UiModal
    :is-open="isOpen"
    :title="title"
    size="sm"

    @close="handleCancel"
  >
    <!-- Иконка и сообщение -->
    <div class="flex flex-col items-center text-center">
      <!-- Иконка предупреждения с анимацией -->
      <div class="relative mb-4">
        <div
          class="h-16 w-16 rounded-full flex items-center justify-center"
          :class="[
            variant === 'danger'
              ? 'bg-red-100 dark:bg-red-900/30'
              : 'bg-yellow-100 dark:bg-yellow-900/30',
          ]"
        >
          <svg
            class="w-8 h-8 animate-pulse"
            :class="[
              variant === 'danger'
                ? 'text-red-600 dark:text-red-400'
                : 'text-yellow-600 dark:text-yellow-400',
            ]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="variant === 'danger'"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <!-- Анимированное кольцо -->
        <div
          class="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
          :class="[
            variant === 'danger' ? 'border-red-500' : 'border-yellow-500',
          ]"
        ></div>
      </div>

      <!-- Сообщение -->
      <p class="text-gray-600 dark:text-gray-400 text-base mb-2">
        {{ message }}
      </p>

      <!-- Дополнительная информация -->
      <p v-if="itemName" class="font-medium text-black dark:text-white text-lg mb-4">
        {{ itemName }}
      </p>

      <!-- Предупреждение -->
      <p
        v-if="warning"
        class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg"
      >
        {{ warning }}
      </p>
    </div>

    <!-- Кнопки -->
    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton
          variant="secondary"
          :disabled="loading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </UiButton>
        <UiButton
          :variant="variant === 'danger' ? 'danger' : 'warning'"
          :disabled="loading"
          @click="handleConfirm"
        >
          <span v-if="loading" class="flex items-center gap-2">
            <svg
              class="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Удаление...
          </span>
          <span v-else>{{ confirmText }}</span>
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: 'Подтверждение удаления',
  message: 'Вы уверены, что хотите удалить этот элемент?',
  confirmText: 'Удалить',
  cancelText: 'Отмена',
  variant: 'danger',
  loading: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>
