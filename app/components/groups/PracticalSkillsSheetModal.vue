<template>
  <UiModal
    :is-open="isOpen"
    title="Ведомость практических работ"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <p>
          Для каждого слушателя группы формируется отдельная страница. Должность
          (на узбекском) и ФИО слушателя подставляются автоматически, остальное — из этой формы.
        </p>
        <p>Введённые значения (кроме даты) запоминаются в этом браузере.</p>
      </div>

      <div>
        <label :class="labelClass">
          Aviatsiya xavfsizligi xizmati <span class="text-danger">*</span>
        </label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="service in PRACTICAL_SKILLS_SERVICES"
            :key="service"
            class="flex items-center gap-2 cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-all"
            :class="
              form.service === service
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-slate-200 dark:border-slate-700'
            "
          >
            <input v-model="form.service" type="radio" :value="service" class="sr-only" />
            {{ service }}
          </label>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label :class="labelClass">Oʻtkazilgan sana <span class="text-danger">*</span></label>
          <input v-model="form.date" type="date" :class="inputClasses('date')" />
        </div>
        <div>
          <label :class="labelClass">Boshlanishi <span class="text-danger">*</span></label>
          <input v-model="form.timeStart" type="time" :class="inputClasses('timeStart')" />
        </div>
        <div>
          <label :class="labelClass">Tugashi <span class="text-danger">*</span></label>
          <input v-model="form.timeEnd" type="time" :class="inputClasses('timeEnd')" />
        </div>
      </div>

      <div>
        <label :class="labelClass">
          Komissiya aʼzolari <span class="text-danger">*</span>
        </label>
        <div class="space-y-2">
          <div v-for="(_, index) in form.commission" :key="index" class="flex items-center gap-2">
            <span class="w-5 text-sm font-bold text-slate-500">{{ index + 1 }}.</span>
            <input
              v-model="form.commission[index]"
              type="text"
              maxlength="100"
              placeholder="R.D. Kashayev"
              :class="inputClasses(`member${index}`)"
            />
            <button
              v-if="form.commission.length > 1"
              type="button"
              class="p-2 text-slate-400 hover:text-danger"
              title="Удалить"
              @click="form.commission.splice(index, 1)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <button
          v-if="form.commission.length < MAX_PRACTICAL_COMMISSION_MEMBERS"
          type="button"
          class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          @click="form.commission.push('')"
        >
          <Plus class="w-4 h-4" />
          Добавить члена комиссии
        </button>
      </div>

      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
        <p v-if="errorMessage" class="mr-auto text-xs text-danger">{{ errorMessage }}</p>
        <UiButton type="button" variant="outline" @click="$emit('close')">Отмена</UiButton>
        <UiButton type="submit" variant="primary" :loading="loading">
          <Download v-if="!loading" class="w-4 h-4" />
          Скачать Word
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { Download, Plus, Trash2 } from "lucide-vue-next";
import {
  MAX_PRACTICAL_COMMISSION_MEMBERS,
  PRACTICAL_SKILLS_SERVICES,
  type PracticalSkillsService,
  type PracticalSkillsSheetForm,
} from "../../../shared/utils/practicalSkillsSheet";

defineProps<{
  isOpen: boolean;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [form: PracticalSkillsSheetForm];
}>();

const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800";

const form = ref({
  service: "AXX" as PracticalSkillsService,
  date: "",
  timeStart: "",
  timeEnd: "",
  commission: [""] as string[],
});
const invalid = ref<string[]>([]);
const errorMessage = ref("");

// Служба, время и комиссия запоминаются в браузере; дата у каждой ведомости своя
const STORAGE_KEY = "atc_practical_skills_sheet_form";

const restoreForm = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return;
    if (PRACTICAL_SKILLS_SERVICES.includes(saved.service)) form.value.service = saved.service;
    if (typeof saved.timeStart === "string") form.value.timeStart = saved.timeStart;
    if (typeof saved.timeEnd === "string") form.value.timeEnd = saved.timeEnd;
    if (Array.isArray(saved.commission) && saved.commission.length > 0) {
      form.value.commission = saved.commission
        .filter((m: unknown) => typeof m === "string")
        .slice(0, MAX_PRACTICAL_COMMISSION_MEMBERS);
      if (form.value.commission.length === 0) form.value.commission = [""];
    }
  } catch (error) {
    console.error("Failed to restore practical skills sheet form:", error);
  }
};

onMounted(() => {
  restoreForm();
  watch(
    form,
    () => {
      const { date: _date, ...remembered } = form.value;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remembered));
      } catch (error) {
        console.error("Failed to save practical skills sheet form:", error);
      }
    },
    { deep: true },
  );
});

const inputClasses = (field: string) => [
  inputClass,
  { "border-danger focus:border-danger focus:ring-danger": invalid.value.includes(field) },
];

const handleSubmit = () => {
  const value = form.value;
  const commission = value.commission
    .map((name) => name.replace(/\s+/g, " ").trim());
  const missing: string[] = [];
  if (!value.date) missing.push("date");
  if (!value.timeStart) missing.push("timeStart");
  if (!value.timeEnd) missing.push("timeEnd");
  commission.forEach((name, i) => {
    if (!name) missing.push(`member${i}`);
  });

  invalid.value = missing;
  if (missing.length > 0) {
    errorMessage.value = "Заполните выделенные поля";
    return;
  }
  errorMessage.value = "";

  emit("submit", {
    service: value.service,
    date: value.date,
    timeStart: value.timeStart,
    timeEnd: value.timeEnd,
    commission,
  });
};
</script>
