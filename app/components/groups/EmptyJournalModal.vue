<template>
  <UiModal
    :is-open="isOpen"
    title="Пустой журнал — инструкторы"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Отметьте инструкторов, которых нужно указать в журнале: у каждого будет своя строка
        «Instruktor F.I.Sh» с местом для подписи. Если не отметить никого, останется одна
        строка с пустой линией для заполнения от руки.
      </div>

      <div v-if="loadingInstructors" class="flex items-center justify-center py-8">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
      </div>

      <div v-else-if="loadFailed" class="py-4 text-center space-y-3">
        <p class="text-sm text-danger">Не удалось загрузить инструкторов группы</p>
        <UiButton type="button" variant="outline" size="sm" @click="loadInstructors">
          Повторить
        </UiButton>
      </div>

      <p v-else-if="instructors.length === 0" class="text-sm text-slate-500">
        В расписании группы нет занятий с инструкторами — в журнале останется пустая линия
        для заполнения от руки.
      </p>

      <div v-else class="space-y-2">
        <label
          v-for="instructor in instructors"
          :key="instructor.id"
          class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
        >
          <input
            v-model="selectedIds"
            type="checkbox"
            :value="instructor.id"
            class="w-5 h-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          <span class="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {{ instructor.fullName }}
          </span>
          <span class="shrink-0 text-xs text-slate-500">
            в журнале:
            <span class="font-bold text-slate-700 dark:text-slate-200">{{ instructor.shortName }}</span>
          </span>
        </label>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton
          v-for="format in FORMATS"
          :key="format.value"
          type="button"
          variant="primary"
          :loading="loading && pendingFormat === format.value"
          :disabled="!canDownload || loading"
          @click="download(format.value)"
        >
          <Download v-if="!(loading && pendingFormat === format.value)" class="w-4 h-4" />
          {{ format.label }}
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Download } from "lucide-vue-next";

type JournalFormat = "pdf" | "docx";

interface JournalInstructor {
  id: string;
  fullName: string;
  /** Как инструктор будет записан в журнале: «Rasulov K.» */
  shortName: string;
}

const FORMATS: { value: JournalFormat; label: string }[] = [
  { value: "pdf", label: "Скачать PDF" },
  { value: "docx", label: "Скачать Word" },
];

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [options: { format: JournalFormat; instructorIds: string[] }];
}>();

const { authFetch } = useAuthFetch();

const instructors = ref<JournalInstructor[]>([]);
const loadingInstructors = ref(false);
const loadFailed = ref(false);
// Отмеченные инструкторы. Выбор сохраняется, пока открыта страница группы:
// при повторном скачивании (например, в другом формате) галочки остаются как были
const selectedIds = ref<string[]>([]);
const knownIds = ref<string[]>([]);
const pendingFormat = ref<JournalFormat | null>(null);

const canDownload = computed(() => !loadingInstructors.value && !loadFailed.value);

const loadInstructors = async () => {
  loadingInstructors.value = true;
  loadFailed.value = false;
  try {
    const response = await authFetch<{ success: boolean; instructors: JournalInstructor[] }>(
      `/api/groups/${props.groupId}/empty-journal-instructors`,
    );
    instructors.value = response.instructors;
    // Новые для формы инструкторы отмечены, у остальных — прежний выбор пользователя
    selectedIds.value = response.instructors
      .map((instructor) => instructor.id)
      .filter((id) => !knownIds.value.includes(id) || selectedIds.value.includes(id));
    knownIds.value = response.instructors.map((instructor) => instructor.id);
  } catch (error) {
    console.error("Error loading journal instructors:", error);
    loadFailed.value = true;
  } finally {
    loadingInstructors.value = false;
  }
};

// Расписание группы может измениться — список запрашивается при каждом открытии
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) loadInstructors();
  },
);

const download = (format: JournalFormat) => {
  pendingFormat.value = format;
  emit("submit", { format, instructorIds: selectedIds.value });
};
</script>
