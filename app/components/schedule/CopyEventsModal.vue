<template>
  <UiModal
    :is-open="isOpen"
    title="Копировать занятия"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Информация о выбранных занятиях -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="shrink-0">
            <svg
              class="w-5 h-5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
              Выбрано {{ selectedEvents.length }} {{ eventsCountText }}
            </p>
            <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Занятия будут скопированы с сохранением порядка и интервалов
            </p>
          </div>
        </div>
      </div>

      <!-- Список занятий -->
      <div v-if="selectedEvents.length > 0" class="max-h-40 overflow-y-auto">
        <div class="space-y-1">
          <div
            v-for="event in selectedEvents.slice(0, 5)"
            :key="event.id"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <span class="w-2 h-2 rounded-full bg-primary"></span>
            <span class="truncate">{{ event.title }}</span>
            <span class="text-xs text-gray-400">{{
              formatEventTime(event)
            }}</span>
          </div>
          <div
            v-if="selectedEvents.length > 5"
            class="text-xs text-gray-500 pl-4"
          >
            ... и ещё {{ selectedEvents.length - 5 }}
          </div>
        </div>
      </div>

      <!-- Выбор даты -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Целевая дата
        </label>
        <input
          v-model="targetDate"
          type="date"
          :min="minDate"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
      </div>

      <!-- Опция сохранения последовательности -->
      <div class="flex items-center gap-3">
        <input
          id="preserveSequence"
          v-model="preserveSequence"
          type="checkbox"
          class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          for="preserveSequence"
          class="text-sm text-gray-700 dark:text-gray-300"
        >
          Сохранить интервалы между занятиями
        </label>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg transition-colors"
        >
          Отмена
        </button>
        <button
          @click="handleCopy"
          :disabled="!targetDate || copying"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg
            v-if="copying"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            ></path>
          </svg>
          {{ copying ? "Копирование..." : "Копировать" }}
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { ScheduleEvent } from "~/types/schedule";
import { formatTimeOnly } from "~/utils/dateTime";

interface Props {
  isOpen: boolean;
  selectedEvents: ScheduleEvent[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  copied: [result: { copiedCount: number; createdEventIds: string[] }];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const targetDate = ref("");
const preserveSequence = ref(true);
const copying = ref(false);

// Минимальная дата - сегодня
const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

const eventsCountText = computed(() => {
  const count = props.selectedEvents.length;
  if (count === 1) return "занятие";
  if (count >= 2 && count <= 4) return "занятия";
  return "занятий";
});

const formatEventTime = (event: ScheduleEvent) => {
  return formatTimeOnly(new Date(event.startTime));
};

const handleCopy = async () => {
  if (!targetDate.value) return;

  copying.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      copiedCount: number;
      createdEventIds: string[];
      errors: string[];
    }>("/api/schedule/bulk-copy", {
      method: "POST",
      body: {
        eventIds: props.selectedEvents.map((e) => e.id),
        targetDate: targetDate.value,
        preserveSequence: preserveSequence.value,
      },
    });

    if (response.success) {
      notification.show({
        type: "success",
        title: "Занятия скопированы",
        message: `Успешно скопировано ${response.copiedCount} занятий`,
      });

      emit("copied", {
        copiedCount: response.copiedCount,
        createdEventIds: response.createdEventIds,
      });
    }
  } catch (error: any) {
    console.error("Error copying events:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось скопировать занятия",
    });
  } finally {
    copying.value = false;
  }
};

// Сброс при закрытии
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      targetDate.value = "";
      preserveSequence.value = true;
    }
  },
);
</script>
