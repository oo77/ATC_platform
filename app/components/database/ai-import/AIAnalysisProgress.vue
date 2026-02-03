<template>
  <div
    class="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-100 text-center"
  >
    <!-- Icon Animation -->
    <div class="relative w-24 h-24 mx-auto mb-6">
      <div
        class="absolute inset-0 bg-primary/10 rounded-full animate-pulse"
      ></div>
      <div
        class="absolute inset-2 bg-primary/5 rounded-full flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 text-primary animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
          />
        </svg>
      </div>
    </div>

    <h3 class="text-lg font-medium text-gray-900 mb-2">
      AI Анализирует сертификат
    </h3>

    <!-- Status Message -->
    <p class="text-sm text-gray-500 mb-6 h-5 transition-all duration-300">
      {{ currentStatusMessage }}
    </p>

    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
      <div
        class="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <!-- Timer -->
    <div class="text-xs text-gray-400 font-mono">
      Время обработки: {{ formattedTime }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";

const props = defineProps<{
  loading: boolean;
}>();

const progress = ref(0);
const elapsedTime = ref(0);
const intervalId = ref<any>(null);
const statusIndex = ref(0);

const statusMessages = [
  "Загрузка файла...",
  "Подготовка изображения...",
  "Отправка в OpenAI...",
  "Распознавание текста...",
  "Анализ структуры данных...",
  "Поиск студента в базе...",
  "Финализация результатов...",
];

const currentStatusMessage = computed(() => {
  if (!props.loading && progress.value === 100) return "Анализ завершен";
  return statusMessages[statusIndex.value];
});

const formattedTime = computed(() => {
  return (elapsedTime.value / 1000).toFixed(1) + "s";
});

const startAnimation = () => {
  stopAnimation();
  progress.value = 0;
  elapsedTime.value = 0;
  statusIndex.value = 0;
  const startTime = Date.now();

  intervalId.value = setInterval(() => {
    elapsedTime.value = Date.now() - startTime;

    // Simulate progress
    if (progress.value < 90) {
      // Slower progress as it gets higher
      const increment = Math.max(0.5, (90 - progress.value) / 50);
      progress.value += increment;
    }

    // Cycle messages based on time (approximated)
    const seconds = elapsedTime.value / 1000;
    if (seconds < 1) statusIndex.value = 0;
    else if (seconds < 2) statusIndex.value = 1;
    else if (seconds < 5) statusIndex.value = 2;
    else if (seconds < 6) statusIndex.value = 3;
    else if (seconds < 7) statusIndex.value = 4;
    else if (seconds < 8) statusIndex.value = 5;
    else statusIndex.value = 6;
  }, 100);
};

const stopAnimation = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

const completeAnimation = () => {
  stopAnimation();
  progress.value = 100;
  statusIndex.value = 6;
};

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      startAnimation();
    } else {
      completeAnimation();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  stopAnimation();
});
</script>
