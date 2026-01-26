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
            <div
              class="border-b border-stroke px-6 py-4 dark:border-strokedark flex items-center justify-between"
            >
              <h3 class="text-xl font-semibold text-black dark:text-white">
                Разблокировка представителя
              </h3>
              <button
                @click="handleClose"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Контент -->
            <div class="p-6">
              <!-- Информация о представителе -->
              <div class="mb-6 rounded-lg bg-gray-50 dark:bg-meta-4 p-4">
                <div class="text-sm">
                  <span class="text-gray-600 dark:text-gray-400"
                    >Представитель:</span
                  >
                  <span class="ml-2 font-medium text-black dark:text-white">{{
                    representative.fullName
                  }}</span>
                </div>
                <div class="text-sm mt-2">
                  <span class="text-gray-600 dark:text-gray-400"
                    >Организация:</span
                  >
                  <span class="ml-2 font-medium text-black dark:text-white">{{
                    representative.organizationName
                  }}</span>
                </div>
              </div>

              <!-- Причина прошлой блокировки -->
              <div v-if="representative.blockedReason" class="mb-6">
                <p class="text-sm font-medium text-danger mb-1">
                  Причина блокировки:
                </p>
                <p
                  class="text-sm text-gray-700 dark:text-gray-300 bg-danger/5 p-3 rounded-md border border-danger/20"
                >
                  {{ representative.blockedReason }}
                </p>
              </div>

              <!-- Предупреждение -->
              <div
                class="mb-6 rounded-lg bg-success/10 border border-success/20 p-4"
              >
                <div class="flex gap-3">
                  <svg
                    class="w-5 h-5 text-success shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div class="text-sm text-gray-700 dark:text-gray-300">
                    <p class="font-medium mb-1">Подтверждение</p>
                    <p>
                      После разблокировки представитель снова получит доступ к
                      информации через Telegram-бота. Статус будет изменён на
                      "Одобрен".
                    </p>
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
                  variant="success"
                  @click="handleSubmit"
                  :loading="isSubmitting"
                >
                  Разблокировать
                </UiButton>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

interface Representative {
  id: string;
  organizationName?: string;
  fullName: string;
  blockedReason?: string | null;
}

interface Props {
  representative: Representative;
  isOpen: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

// Состояние
const isSubmitting = ref(false);
const isVisible = ref(false);

// Методы
const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit("close");
  }, 300);
};

const handleSubmit = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    emit("submit");
  } finally {
    // Мы не сбрасываем isSubmitting здесь сразу, так как ждем завершения родительской операции,
    // но так как это событие emit, родитель сам управляет состоянием загрузки или закрытием.
    // В данном случае лучше оставить false, если родитель быстро закроет окно.
    // Но для UI UX лучше оставить true, пока окно не закроется родителем при успехе.
    // Однако, здесь мы просто эмитим событие.
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
