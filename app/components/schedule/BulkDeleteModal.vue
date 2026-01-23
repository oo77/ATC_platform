<template>
  <UiModal
    :is-open="isOpen"
    title="Удаление занятий"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Предупреждение -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="shrink-0">
            <svg
              class="w-6 h-6 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Внимание! Это действие необратимо
            </h3>
            <p class="text-sm text-red-600 dark:text-red-300 mt-1">
              Вы собираетесь удалить
              <strong>{{ selectedEvents.length }}</strong>
              {{ eventsCountText }}. Данные о посещаемости для этих занятий
              также будут удалены.
            </p>
          </div>
        </div>
      </div>

      <!-- Список занятий для удаления -->
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Следующие занятия будут удалены:
        </p>
        <div
          class="max-h-48 overflow-y-auto space-y-2 bg-gray-50 dark:bg-meta-4 rounded-lg p-3"
        >
          <div
            v-for="event in selectedEvents"
            :key="event.id"
            class="flex items-center gap-3 text-sm p-2 bg-white dark:bg-boxdark rounded border border-stroke dark:border-strokedark"
          >
            <div
              class="shrink-0 w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-danger"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ event.title }}
              </p>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>{{ formatEventDate(event) }}</span>
                <span>•</span>
                <span>{{ formatEventTime(event) }}</span>
                <span v-if="event.group?.code">• {{ event.group.code }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Подтверждение -->
      <div class="flex items-center gap-3">
        <input
          id="confirmDelete"
          v-model="confirmed"
          type="checkbox"
          class="w-4 h-4 text-danger bg-gray-100 border-gray-300 rounded focus:ring-danger dark:bg-gray-700 dark:border-gray-600"
        />
        <label
          for="confirmDelete"
          class="text-sm text-gray-700 dark:text-gray-300"
        >
          Я понимаю, что это действие необратимо
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
          @click="handleDelete"
          :disabled="!confirmed || deleting"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg
            v-if="deleting"
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
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          {{ deleting ? "Удаление..." : "Удалить занятия" }}
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { ScheduleEvent } from "~/types/schedule";
import { formatDateOnly, formatTimeOnly } from "~/utils/dateTime";

interface Props {
  isOpen: boolean;
  selectedEvents: ScheduleEvent[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  deleted: [result: { deletedCount: number }];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const confirmed = ref(false);
const deleting = ref(false);

const eventsCountText = computed(() => {
  const count = props.selectedEvents.length;
  if (count === 1) return "занятие";
  if (count >= 2 && count <= 4) return "занятия";
  return "занятий";
});

const formatEventDate = (event: ScheduleEvent) => {
  return formatDateOnly(new Date(event.startTime));
};

const formatEventTime = (event: ScheduleEvent) => {
  const start = formatTimeOnly(new Date(event.startTime));
  const end = formatTimeOnly(new Date(event.endTime));
  return `${start} - ${end}`;
};

const handleDelete = async () => {
  if (!confirmed.value) return;

  deleting.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      deletedCount: number;
      errors: string[];
    }>("/api/schedule/bulk-delete", {
      method: "POST",
      body: {
        eventIds: props.selectedEvents.map((e) => e.id),
      },
    });

    if (response.success) {
      notification.show({
        type: "success",
        title: "Занятия удалены",
        message: `Успешно удалено ${response.deletedCount} занятий`,
      });

      emit("deleted", { deletedCount: response.deletedCount });
    }
  } catch (error: any) {
    console.error("Error deleting events:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось удалить занятия",
    });
  } finally {
    deleting.value = false;
  }
};

// Сброс при закрытии
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      confirmed.value = false;
    }
  },
);
</script>
