<template>
  <UiModal
    :is-open="isOpen"
    title="Ведомость контроля знаний"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Выберите блок подписей внизу бланка: оставить шаблон как есть или указать экзаменатора —
        инструктора группы. В этом случае будет «Экзаменатор : Инструктор» и его короткое ФИО на русском.
      </div>

      <div class="space-y-2">
        <label
          class="flex items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
        >
          <input
            v-model="examinerMode"
            type="radio"
            value="template"
            class="mt-1 w-5 h-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          <span class="flex-1 text-sm">
            <span class="block font-medium text-slate-700 dark:text-slate-200">Оставить как в шаблоне</span>
            <span class="block text-xs text-slate-500">Ответственный специалист (оператор): Специалист отдела ИКТ</span>
          </span>
        </label>

        <label
          class="flex items-start gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 transition-colors dark:border-slate-700"
          :class="
            instructors.length > 0
              ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
              : 'opacity-50 cursor-not-allowed'
          "
        >
          <input
            v-model="examinerMode"
            type="radio"
            value="instructor"
            :disabled="instructors.length === 0"
            class="mt-1 w-5 h-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          <span class="flex-1 text-sm">
            <span class="block font-medium text-slate-700 dark:text-slate-200">Экзаменатор — Инструктор</span>
            <span class="block text-xs text-slate-500">Указать инструктора группы в блоке подписей</span>
          </span>
        </label>
      </div>

      <div v-if="examinerMode === 'instructor'" class="space-y-2 pl-1">
        <div v-if="loadingInstructors" class="flex items-center justify-center py-6">
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

        <div v-else class="space-y-2">
          <label
            v-for="instructor in instructors"
            :key="instructor.id"
            class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
          >
            <input
              v-model="examinerId"
              type="radio"
              :value="instructor.id"
              class="w-5 h-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
            />
            <span class="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              {{ instructor.fullName }}
            </span>
          </label>
        </div>
      </div>

      <p v-if="!loadingInstructors && instructors.length === 0 && !loadFailed" class="text-xs text-slate-500">
        В расписании группы нет инструкторов — экзаменатора выбрать нельзя, останется шаблон.
      </p>

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

type SheetFormat = "pdf" | "docx";
type ExaminerMode = "template" | "instructor";

interface SheetInstructor {
  id: string;
  fullName: string;
}

const FORMATS: { value: SheetFormat; label: string }[] = [
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
  submit: [options: { format: SheetFormat; examinerInstructorId: string | null }];
}>();

const { authFetch } = useAuthFetch();

const instructors = ref<SheetInstructor[]>([]);
const loadingInstructors = ref(false);
const loadFailed = ref(false);
const examinerMode = ref<ExaminerMode>("template");
const examinerId = ref<string | null>(null);
const pendingFormat = ref<SheetFormat | null>(null);

const canDownload = computed(
  () =>
    !loadingInstructors.value &&
    !loadFailed.value &&
    (examinerMode.value === "template" || examinerId.value !== null),
);

// Список инструкторов — тот же, что и в «Пустом журнале» (инструкторы, ведущие занятия группы)
const loadInstructors = async () => {
  loadingInstructors.value = true;
  loadFailed.value = false;
  try {
    const response = await authFetch<{ success: boolean; instructors: SheetInstructor[] }>(
      `/api/groups/${props.groupId}/empty-journal-instructors`,
    );
    instructors.value = response.instructors;
    if (!response.instructors.some((instructor) => instructor.id === examinerId.value)) {
      examinerId.value = null;
    }
  } catch (error) {
    console.error("Error loading assessment sheet instructors:", error);
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

const download = (format: SheetFormat) => {
  pendingFormat.value = format;
  emit("submit", {
    format,
    examinerInstructorId: examinerMode.value === "instructor" ? examinerId.value : null,
  });
};
</script>
