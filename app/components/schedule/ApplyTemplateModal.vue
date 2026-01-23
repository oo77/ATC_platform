<template>
  <UiModal
    :is-open="isOpen"
    title="Применить шаблон"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Выбор шаблона -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Выберите шаблон
        </label>
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div
            class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"
          ></div>
          <span class="ml-2 text-sm text-gray-500">Загрузка шаблонов...</span>
        </div>
        <div
          v-else-if="templates.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <svg
            class="w-12 h-12 mx-auto mb-3 text-gray-300"
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
          <p>Шаблоны не найдены</p>
          <p class="text-xs mt-1">Создайте шаблон из выбранных занятий</p>
        </div>
        <div v-else class="space-y-2 max-h-48 overflow-y-auto">
          <label
            v-for="template in templates"
            :key="template.id"
            class="flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors"
            :class="[
              selectedTemplateId === template.id
                ? 'border-primary bg-primary/5'
                : 'border-stroke dark:border-strokedark hover:border-primary/50',
            ]"
          >
            <input
              type="radio"
              :value="template.id"
              v-model="selectedTemplateId"
              class="mt-1"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ template.name }}
              </p>
              <p
                v-if="template.description"
                class="text-xs text-gray-500 mt-0.5 truncate"
              >
                {{ template.description }}
              </p>
              <div class="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{{ template.eventsData?.length || 0 }} занятий</span>
                <span v-if="template.sourceGroupCode"
                  >из группы {{ template.sourceGroupCode }}</span
                >
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Целевая группа -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Группа <span class="text-danger">*</span>
        </label>
        <div class="relative">
          <select
            v-model="targetGroupId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">Выберите группу</option>
            <option v-for="group in groups" :key="group.id" :value="group.id">
              {{ group.code }}
            </option>
          </select>
          <svg
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      <!-- Целевая дата -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Дата <span class="text-danger">*</span>
        </label>
        <input
          v-model="targetDate"
          type="date"
          :min="minDate"
          class="w-full rounded-lg border border-stroke bg-transparent py-3 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
      </div>

      <!-- Переопределение инструктора -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Инструктор (необязательно)
        </label>
        <div class="relative">
          <select
            v-model="overrideInstructorId"
            class="w-full rounded-lg border border-stroke bg-transparent py-3 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          >
            <option value="">Использовать из шаблона</option>
            <option
              v-for="instructor in instructors"
              :key="instructor.id"
              :value="instructor.id"
            >
              {{ instructor.fullName }}
            </option>
          </select>
          <svg
            class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          Если выбрать инструктора, он будет назначен на все занятия
        </p>
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
          @click="handleApply"
          :disabled="!canApply || applying"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <svg
            v-if="applying"
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
          {{ applying ? "Применение..." : "Применить шаблон" }}
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { ScheduleTemplate } from "~/types/scheduleTemplate";

interface Group {
  id: string;
  code: string;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface Props {
  isOpen: boolean;
  groups: Group[];
  instructors: Instructor[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  applied: [result: { createdCount: number }];
}>();

const { authFetch } = useAuthFetch();
const notification = useNotification();

const loading = ref(false);
const applying = ref(false);
const templates = ref<ScheduleTemplate[]>([]);
const selectedTemplateId = ref("");
const targetGroupId = ref("");
const targetDate = ref("");
const overrideInstructorId = ref("");

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

const canApply = computed(() => {
  return selectedTemplateId.value && targetGroupId.value && targetDate.value;
});

const loadTemplates = async () => {
  loading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      templates: ScheduleTemplate[];
    }>("/api/schedule/templates");

    if (response.success) {
      templates.value = response.templates;
    }
  } catch (error) {
    console.error("Error loading templates:", error);
  } finally {
    loading.value = false;
  }
};

const handleApply = async () => {
  if (!canApply.value) return;

  applying.value = true;

  try {
    const response = await authFetch<{
      success: boolean;
      createdCount: number;
      errors: string[];
    }>(`/api/schedule/templates/${selectedTemplateId.value}/apply`, {
      method: "POST",
      body: {
        targetGroupId: targetGroupId.value,
        targetDate: targetDate.value,
        overrideInstructorId: overrideInstructorId.value || null,
      },
    });

    if (response.success) {
      notification.show({
        type: "success",
        title: "Шаблон применён",
        message: `Создано ${response.createdCount} занятий`,
      });

      emit("applied", { createdCount: response.createdCount });
    }
  } catch (error: any) {
    console.error("Error applying template:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось применить шаблон",
    });
  } finally {
    applying.value = false;
  }
};

// Загрузка шаблонов при открытии
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadTemplates();
    } else {
      selectedTemplateId.value = "";
      targetGroupId.value = "";
      targetDate.value = "";
      overrideInstructorId.value = "";
    }
  },
);
</script>
