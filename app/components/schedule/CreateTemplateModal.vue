<template>
  <UiModal
    :is-open="isOpen"
    title="Создать шаблон расписания"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Информация о выбранных занятиях -->
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <div class="shrink-0">
            <svg
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-green-800 dark:text-green-200">
              Создание шаблона из {{ selectedEvents.length }} занятий
            </p>
            <p class="text-xs text-green-600 dark:text-green-300 mt-1">
              Шаблон можно будет применять к другим группам
            </p>
          </div>
        </div>
      </div>

      <!-- Информация о группе -->
      <div
        v-if="groupInfo"
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span
          >Исходная группа: <strong>{{ groupInfo.code }}</strong></span
        >
      </div>

      <!-- Название шаблона -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Название шаблона <span class="text-danger">*</span>
        </label>
        <input
          v-model="templateName"
          type="text"
          placeholder="Например: Расписание первой недели"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          :class="{ 'border-danger': nameError }"
        />
        <p v-if="nameError" class="mt-1 text-xs text-danger">{{ nameError }}</p>
      </div>

      <!-- Описание -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Описание (необязательно)
        </label>
        <textarea
          v-model="templateDescription"
          rows="3"
          placeholder="Краткое описание содержимого шаблона..."
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
        ></textarea>
      </div>

      <!-- Список занятий в шаблоне -->
      <div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Занятия в шаблоне:
        </p>
        <div
          class="max-h-32 overflow-y-auto space-y-1 bg-gray-50 dark:bg-meta-4 rounded-lg p-3"
        >
          <div
            v-for="(event, index) in selectedEvents"
            :key="event.id"
            class="flex items-center gap-2 text-sm"
          >
            <span
              class="shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium"
            >
              {{ index + 1 }}
            </span>
            <span class="truncate text-gray-700 dark:text-gray-300">{{
              event.title
            }}</span>
            <span class="text-xs text-gray-400 ml-auto">{{
              formatEventTime(event)
            }}</span>
          </div>
        </div>
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
          @click="handleCreate"
          :disabled="!templateName.trim() || creating"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg
            v-if="creating"
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
          {{ creating ? "Создание..." : "Создать шаблон" }}
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
  groupInfo?: { id: string; code: string } | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: [template: { id: string; name: string }];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const templateName = ref("");
const templateDescription = ref("");
const creating = ref(false);
const nameError = ref("");

const formatEventTime = (event: ScheduleEvent) => {
  return formatTimeOnly(new Date(event.startTime));
};

const handleCreate = async () => {
  // Валидация
  if (!templateName.value.trim()) {
    nameError.value = "Название обязательно";
    return;
  }

  nameError.value = "";
  creating.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      template: { id: string; name: string };
    }>("/api/schedule/templates", {
      method: "POST",
      body: {
        name: templateName.value.trim(),
        description: templateDescription.value.trim() || null,
        eventIds: props.selectedEvents.map((e) => e.id),
        sourceGroupId: props.groupInfo?.id || null,
      },
    });

    if (response.success) {
      notification.show({
        type: "success",
        title: "Шаблон создан",
        message: `Шаблон "${response.template.name}" успешно создан`,
      });

      emit("created", response.template);
    }
  } catch (error: any) {
    console.error("Error creating template:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось создать шаблон",
    });
  } finally {
    creating.value = false;
  }
};

// Сброс при закрытии
watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      templateName.value = "";
      templateDescription.value = "";
      nameError.value = "";
    }
  },
);
</script>
