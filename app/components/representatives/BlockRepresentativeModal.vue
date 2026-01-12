<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-999999 flex items-center justify-center bg-black/80 px-4 py-5"
      >
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isVisible"
            class="w-full max-w-lg rounded-lg bg-white dark:bg-boxdark shadow-xl"
            @click.stop
          >
            <!-- Заголовок -->
            <div class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between">
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Блокировка представителя
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Контент -->
            <form @submit.prevent="handleSubmit" class="p-6">
              <!-- Информация о представителе -->
              <div class="mb-6 rounded-lg bg-gray-50 dark:bg-meta-4 p-4">
                <div class="text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Представитель:</span>
                  <span class="ml-2 font-medium text-black dark:text-white">{{ representative.fullName }}</span>
                </div>
                <div class="text-sm mt-2">
                  <span class="text-gray-600 dark:text-gray-400">Организация:</span>
                  <span class="ml-2 font-medium text-black dark:text-white">{{ representative.organizationName }}</span>
                </div>
              </div>

              <!-- Причина блокировки -->
              <div class="mb-6">
                <label class="mb-3 block text-sm font-medium text-black dark:text-white">
                  Причина блокировки <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="reason"
                  rows="4"
                  placeholder="Укажите причину блокировки..."
                  class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary resize-none"
                  :class="{ 'border-danger': error }"
                  required
                ></textarea>
                <p v-if="error" class="mt-1 text-sm text-danger">{{ error }}</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Причина будет отправлена представителю в Telegram
                </p>
              </div>

              <!-- Предупреждение -->
              <div class="mb-6 rounded-lg bg-warning/10 border border-warning/20 p-4">
                <div class="flex gap-3">
                  <svg class="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    <p class="font-medium mb-1">Внимание!</p>
                    <p>После блокировки представитель потеряет доступ к информации через Telegram-бота.</p>
                  </div>
                </div>
              </div>

              <!-- Кнопки -->
              <div class="flex justify-end gap-4">
                <UiButton
                  variant="secondary"
                  @click="handleClose"
                  :disabled="isSubmitting"
                >
                  Отмена
                </UiButton>
                <UiButton
                  variant="danger"
                  type="submit"
                  :loading="isSubmitting"
                >
                  Заблокировать
                </UiButton>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Representative {
  id: string;
  organizationName?: string;
  fullName: string;
}

interface Props {
  representative: Representative;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [data: { reason: string }];
}>();

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);
const reason = ref('');
const error = ref('');

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 300);
};

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isSubmitting.value) return;
  
  error.value = '';

  if (!reason.value.trim()) {
    error.value = 'Укажите причину блокировки';
    return;
  }

  if (reason.value.trim().length < 10) {
    error.value = 'Причина должна содержать минимум 10 символов';
    return;
  }

  isSubmitting.value = true;

  try {
    emit('submit', { reason: reason.value.trim() });
  } finally {
    isSubmitting.value = false;
  }
};

// Инициализация
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 10);
});
</script>
