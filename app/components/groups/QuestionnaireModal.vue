<template>
  <UiModal
    :is-open="isOpen"
    title="Обезличенный вопросник"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Название программы, номер группы, число слушателей, период обучения и дисциплина
        («Aviatsiya xavfsizligi / Авиационная безопасность») подставляются автоматически.
        Место проведения и дату заполнения укажите ниже.
      </div>

      <div>
        <label :class="labelClass">
          O‘qitish joyi (место проведения, узбекский) <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.placeUz"
          type="text"
          maxlength="200"
          placeholder="Navoiy xalqaro aeroporti"
          :class="inputClasses('placeUz')"
        />
        <p v-if="errors.placeUz" class="mt-1 text-xs text-danger">{{ errors.placeUz }}</p>
      </div>

      <div>
        <label :class="labelClass">
          Место проведения (русский) <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.placeRu"
          type="text"
          maxlength="200"
          placeholder="Международный аэропорт Навои"
          :class="inputClasses('placeRu')"
        />
        <p v-if="errors.placeRu" class="mt-1 text-xs text-danger">{{ errors.placeRu }}</p>
      </div>

      <div>
        <label :class="labelClass">
          To‘ldirilgan sana (дата заполнения) <span class="text-danger">*</span>
        </label>
        <input v-model="form.filledDate" type="date" :class="inputClasses('filledDate')" />
        <p v-if="errors.filledDate" class="mt-1 text-xs text-danger">{{ errors.filledDate }}</p>
      </div>

      <div>
        <label :class="labelClass">O‘qituvchi-instruktorning F.I.Sh.</label>
        <div v-if="loadingInstructors" class="flex items-center justify-center py-4">
          <div
            class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
        </div>

        <div v-else-if="loadFailed" class="py-2 space-y-2">
          <p class="text-sm text-danger">Не удалось загрузить инструкторов группы</p>
          <UiButton type="button" variant="outline" size="sm" @click="loadInstructors">
            Повторить
          </UiButton>
        </div>

        <div v-else class="space-y-2">
          <label
            v-for="option in options"
            :key="option.id ?? 'none'"
            class="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
          >
            <input
              v-model="selectedId"
              type="radio"
              :value="option.id"
              @change="chosen = true"
              class="w-5 h-5 shrink-0 border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
            />
            <span
              class="flex-1 text-sm font-medium"
              :class="option.id ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500'"
            >
              {{ option.label }}
            </span>
          </label>
          <p v-if="instructors.length === 0" class="text-xs text-slate-500">
            В расписании группы нет занятий с инструкторами.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton
          type="submit"
          variant="primary"
          :loading="loading"
          :disabled="loadingInstructors || loading"
        >
          <Download v-if="!loading" class="w-4 h-4" />
          Скачать Word
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Download } from "lucide-vue-next";

interface QuestionnaireInstructor {
  id: string;
  fullName: string;
}

interface QuestionnaireForm {
  placeUz: string;
  placeRu: string;
  /** ГГГГ-ММ-ДД */
  filledDate: string;
  instructorId: string | null;
}

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [form: QuestionnaireForm];
}>();

const { authFetch } = useAuthFetch();

const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800";

// Введённые данные сохраняются, пока открыта страница группы, — при повторном скачивании
// их не нужно набирать заново
const form = ref({ placeUz: "", placeRu: "", filledDate: "" });
const errors = ref<Record<string, string>>({});

const inputClasses = (field: string) => [
  inputClass,
  { "border-danger focus:border-danger focus:ring-danger": errors.value[field] },
];

const instructors = ref<QuestionnaireInstructor[]>([]);
const loadingInstructors = ref(false);
const loadFailed = ref(false);
// null — строка с ФИО инструктора остаётся пустой
const selectedId = ref<string | null>(null);
// Пользователь сам выбрал вариант — при повторном открытии он не сбрасывается
const chosen = ref(false);

const options = computed(() => [
  ...instructors.value.map((instructor) => ({ id: instructor.id, label: instructor.fullName })),
  { id: null, label: "Не указывать — вписать от руки" },
]);

// Инструкторы — те же, что для «Пустого журнала»: ведущие занятия группы по расписанию
const loadInstructors = async () => {
  loadingInstructors.value = true;
  loadFailed.value = false;
  try {
    const response = await authFetch<{ success: boolean; instructors: QuestionnaireInstructor[] }>(
      `/api/groups/${props.groupId}/empty-journal-instructors`,
    );
    instructors.value = response.instructors;
    const ids = response.instructors.map((instructor) => instructor.id);
    // По умолчанию — инструктор первого занятия; прежний выбор пользователя сохраняется,
    // если этот инструктор всё ещё ведёт занятия группы
    if (!chosen.value || (selectedId.value && !ids.includes(selectedId.value))) {
      selectedId.value = ids[0] ?? null;
    }
  } catch (error) {
    console.error("Error loading questionnaire instructors:", error);
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

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const handleSubmit = () => {
  const result: QuestionnaireForm = {
    placeUz: clean(form.value.placeUz),
    placeRu: clean(form.value.placeRu),
    filledDate: form.value.filledDate,
    instructorId: selectedId.value,
  };

  errors.value = {};
  if (!result.placeUz) errors.value.placeUz = "Укажите место проведения на узбекском";
  if (!result.placeRu) errors.value.placeRu = "Укажите место проведения на русском";
  if (!result.filledDate) errors.value.filledDate = "Укажите дату заполнения";
  if (Object.keys(errors.value).length > 0) return;

  emit("submit", result);
};
</script>
