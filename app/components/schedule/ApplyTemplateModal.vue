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
          class="flex flex-col items-center justify-center py-10 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl"
        >
          <svg
            class="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600"
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
          <p class="font-medium">Шаблоны не найдены</p>
          <p class="text-xs mt-1 text-gray-400">
            Создайте шаблон из выбранных занятий в календаре
          </p>
        </div>
        <div v-else class="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          <div
            v-for="template in templates"
            :key="template.id"
            class="relative group"
          >
            <label
              class="relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
              :class="[
                selectedTemplateId === template.id
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-stroke dark:border-strokedark hover:border-primary/30 hover:bg-gray-50 dark:hover:bg-meta-4',
              ]"
            >
              <div class="pt-1">
                <input
                  type="radio"
                  :value="template.id"
                  v-model="selectedTemplateId"
                  class="w-5 h-5 text-primary border-gray-300 focus:ring-primary dark:border-gray-600"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span
                    class="font-semibold text-base"
                    :class="
                      selectedTemplateId === template.id
                        ? 'text-primary'
                        : 'text-black dark:text-white'
                    "
                  >
                    {{ template.name }}
                  </span>
                </div>

                <p
                  v-if="template.description"
                  class="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2"
                >
                  {{ template.description }}
                </p>

                <div
                  class="flex flex-wrap items-center gap-3 text-xs text-gray-400"
                >
                  <div
                    class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    <span>{{ template.eventsData?.length || 0 }} занятий</span>
                  </div>

                  <div
                    v-if="template.sourceGroupCode"
                    class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
                  >
                    <svg
                      class="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>Группа: {{ template.sourceGroupCode }}</span>
                  </div>
                </div>
              </div>
            </label>

            <!-- Delete button -->
            <button
              @click.stop="handleDeleteTemplate(template)"
              class="absolute right-2 top-2 p-2 text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
              title="Удалить шаблон"
            >
              <svg
                class="w-5 h-5"
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
            </button>
          </div>
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

const handleDeleteTemplate = async (template: ScheduleTemplate) => {
  if (!confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
    return;
  }

  try {
    await authFetch(`/api/schedule/templates/${template.id}`, {
      method: "DELETE",
    });

    notification.show({
      type: "success",
      title: "Шаблон удалён",
      message: "Шаблон успешно удалён",
    });

    await loadTemplates();

    if (selectedTemplateId.value === template.id) {
      selectedTemplateId.value = "";
    }
  } catch (e: any) {
    console.error("Error deleting template:", e);
    notification.show({
      type: "error",
      title: "Ошибка удаления",
      message: e.data?.statusMessage || "Не удалось удалить шаблон",
    });
  }
};
</script>
