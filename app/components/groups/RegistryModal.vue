<template>
  <UiModal
    :is-open="isOpen"
    title="Реестр — регистрация слушателей"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Группа и список слушателей с должностями на узбекском подставляются автоматически,
        остальное — из этой формы, как введено.
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label :class="labelClass">Sana (дата) <span class="text-danger">*</span></label>
          <input v-model="form.date" type="date" :class="inputClasses('date')" />
          <p v-if="errors.date" class="mt-1 text-xs text-danger">{{ errors.date }}</p>
        </div>
        <div>
          <label :class="labelClass">Vaqti (время) <span class="text-danger">*</span></label>
          <input
            v-model="form.time"
            type="text"
            maxlength="100"
            placeholder="14:00 – 15:20"
            :class="inputClasses('time')"
          />
          <p v-if="errors.time" class="mt-1 text-xs text-danger">{{ errors.time }}</p>
        </div>
      </div>

      <div>
        <label :class="labelClass">Joy (место) <span class="text-danger">*</span></label>
        <input
          v-model="form.place"
          type="text"
          maxlength="200"
          placeholder="Navoiy AP"
          :class="inputClasses('place')"
        />
        <p v-if="errors.place" class="mt-1 text-xs text-danger">{{ errors.place }}</p>
      </div>

      <div>
        <label :class="labelClass">
          Председатель комиссии (Komissiya raisi) — ФИО <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.chairman"
          type="text"
          maxlength="100"
          placeholder="Kashayev Ruslan Damirovich"
          :class="inputClasses('chairman')"
        />
        <p v-if="errors.chairman" class="mt-1 text-xs text-danger">{{ errors.chairman }}</p>
      </div>

      <div>
        <label class="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            v-model="form.hasDeputy"
            type="checkbox"
            class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          Заместитель председателя (Komissiya rais o‘rinbosari)
        </label>
        <div v-if="form.hasDeputy" class="mt-2">
          <input
            v-model="form.deputy"
            type="text"
            maxlength="100"
            placeholder="Yunusov Xumoyun Mirzoxid o‘g‘li"
            :class="inputClasses('deputy')"
          />
          <p v-if="errors.deputy" class="mt-1 text-xs text-danger">{{ errors.deputy }}</p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton type="submit" variant="primary" :loading="loading">
          <Download v-if="!loading" class="w-4 h-4" />
          Скачать Word
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Download } from "lucide-vue-next";
import type { RegistryForm } from "../../../shared/utils/registry";

defineProps<{
  isOpen: boolean;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [form: RegistryForm];
}>();

const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
const inputClass =
  "w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800";

// Введённые данные сохраняются, пока открыта страница группы, — при повторном скачивании
// их не нужно набирать заново
const form = ref({
  date: "",
  time: "",
  place: "",
  chairman: "",
  hasDeputy: false,
  deputy: "",
});
const errors = ref<Record<string, string>>({});

const inputClasses = (field: string) => [
  inputClass,
  { "border-danger focus:border-danger focus:ring-danger": errors.value[field] },
];

const clean = (text: string) => text.replace(/\s+/g, " ").trim();

const handleSubmit = () => {
  const result: RegistryForm = {
    date: form.value.date,
    time: clean(form.value.time),
    place: clean(form.value.place),
    chairman: clean(form.value.chairman),
    deputy: form.value.hasDeputy ? clean(form.value.deputy) : null,
  };

  errors.value = {};
  if (!result.date) errors.value.date = "Укажите дату";
  if (!result.time) errors.value.time = "Укажите время";
  if (!result.place) errors.value.place = "Укажите место";
  if (!result.chairman) errors.value.chairman = "Укажите ФИО председателя комиссии";
  if (result.deputy === "") {
    errors.value.deputy = "Укажите ФИО заместителя или снимите галочку";
  }
  if (Object.keys(errors.value).length > 0) return;

  emit("submit", result);
};
</script>
