<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
      @click="close"
    ></div>

    <!-- Modal Panel -->
    <div
      class="relative w-full max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-boxdark p-6 text-left shadow-xl transition-all sm:my-8"
    >
      <!-- Header -->
      <div class="mb-5 flex items-center justify-between">
        <h3 class="text-xl font-bold text-black dark:text-white">
          Перемещение занятий
        </h3>
        <button
          @click="close"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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

      <!-- Content -->
      <div class="space-y-4">
        <!-- Информация о выбранных занятиях -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center gap-3">
            <div class="shrink-0">
              <svg
                class="w-5 h-5 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                Выбрано занятий: {{ selectedEvents.length }}
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Выберите новую дату, на которую нужно перенести эти занятия.
              </p>
            </div>
          </div>
        </div>

        <!-- Выбор даты -->
        <div>
          <label class="mb-2.5 block font-medium text-black dark:text-white">
            Целевая дата
          </label>
          <div class="relative">
            <input
              type="date"
              v-model="targetDate"
              :min="minDate"
              class="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 font-medium outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
          </div>
        </div>

        <!-- Настройки перемещения -->
        <div
          class="flex items-start gap-3 p-4 border border-stroke dark:border-strokedark rounded-lg bg-gray-50 dark:bg-meta-4/30"
        >
          <input
            type="checkbox"
            id="preserveSequenceMove"
            v-model="preserveSequence"
            class="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          <label for="preserveSequenceMove" class="text-sm cursor-pointer">
            <span class="block font-medium text-black dark:text-white">
              Сохранить последовательность
            </span>
            <span class="block text-gray-500 dark:text-gray-400 mt-1">
              Временные интервалы между занятиями будут сохранены относительно
              времени первого занятия.
            </span>
          </label>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="rounded-lg bg-danger/10 p-4 text-sm text-danger"
        >
          {{ error }}
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-6 flex justify-end gap-3">
        <button
          @click="close"
          class="rounded-lg border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          :disabled="loading"
        >
          Отмена
        </button>
        <button
          @click="moveEvents"
          class="flex items-center gap-2 rounded-lg bg-primary py-2 px-6 font-medium text-white hover:bg-opacity-90"
          :disabled="loading || !targetDate"
        >
          <span
            v-if="loading"
            class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></span>
          <span>Переместить</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean;
  selectedEvents: any[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "moved", result: { movedCount: number }): void;
}>();

const { authFetch } = useAuthFetch();
const { success: showSuccess } = useNotification();

const loading = ref(false);
const error = ref<string | null>(null);
const targetDate = ref(new Date().toISOString().split("T")[0]);
const preserveSequence = ref(true);

const minDate = new Date().toISOString().split("T")[0];

const close = () => {
  error.value = null;
  targetDate.value = new Date().toISOString().split("T")[0];
  emit("close");
};

const moveEvents = async () => {
  if (!targetDate.value) {
    error.value = "Выберите дату перемещения";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{
      success: boolean;
      movedCount: number;
      errors: string[];
    }>("/api/schedule/bulk-move", {
      method: "POST",
      body: {
        eventIds: props.selectedEvents.map((e) => e.id),
        targetDate: targetDate.value,
        preserveSequence: preserveSequence.value,
      },
    });

    if (response.success) {
      showSuccess(`Перемещено занятий: ${response.movedCount}`);
      if (response.errors && response.errors.length > 0) {
        // Если были некритичные ошибки
        console.warn("Ошибки при перемещении:", response.errors);
      }
      emit("moved", { movedCount: response.movedCount });
    }
  } catch (e: any) {
    console.error("Move error:", e);
    error.value = e.data?.message || e.message || "Ошибка перемещения";
  } finally {
    loading.value = false;
  }
};
</script>
