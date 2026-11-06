<template>
  <UiModal
    :is-open="isOpen"
    title="Оценочные листы — состав комиссии"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Состав комиссии будет подставлен в оценочные листы всех слушателей группы.
      </div>

      <!-- Председатель -->
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Председатель комиссии (Komissiya raisi) — ФИО полностью <span class="text-danger">*</span>
        </label>
        <input
          v-model="form.chairman"
          type="text"
          maxlength="100"
          placeholder="Ismailov Sardor Ulugbekovich"
          class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
          :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.chairman }"
        />
        <p v-if="errors.chairman" class="mt-1 text-xs text-danger">{{ errors.chairman }}</p>
        <p v-else-if="chairmanShort" class="mt-1 text-xs text-slate-500">
          В таблице оценок — полностью, в подписях — сокращённо:
          <span class="font-bold text-slate-700 dark:text-slate-200">{{ chairmanShort }}</span>
        </p>
      </div>

      <!-- Заместитель председателя -->
      <div>
        <label class="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            v-model="form.hasDeputy"
            type="checkbox"
            class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
          />
          Заместитель председателя (Komissiya raisi o‘rinbosari)
        </label>
        <div v-if="form.hasDeputy" class="mt-2">
          <input
            v-model="form.deputy"
            type="text"
            maxlength="100"
            placeholder="X.M. Yunusov"
            class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
            :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.deputy }"
          />
          <p v-if="errors.deputy" class="mt-1 text-xs text-danger">{{ errors.deputy }}</p>
          <p v-else class="mt-1 text-xs text-slate-500">
            Ставится в документ как введено — без сокращения.
          </p>
        </div>
      </div>

      <!-- Члены комиссии -->
      <div>
        <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Члены комиссии (Komissiya a’zolari) <span class="text-danger">*</span>
        </label>
        <div class="space-y-2">
          <div
            v-for="(_, index) in form.members"
            :key="index"
            class="flex items-center gap-2"
          >
            <span class="w-5 shrink-0 text-sm font-medium text-slate-400">{{ index + 1 }}.</span>
            <input
              v-model="form.members[index]"
              type="text"
              maxlength="100"
              placeholder="I.I. Ivanov"
              class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 px-3.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800"
              :class="{ 'border-danger focus:border-danger focus:ring-danger': errors.members }"
            />
            <button
              v-if="form.members.length > 1"
              type="button"
              class="p-2 text-slate-400 hover:text-danger transition-colors"
              title="Убрать"
              @click="form.members.splice(index, 1)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        <p v-if="errors.members" class="mt-1 text-xs text-danger">{{ errors.members }}</p>
        <div class="mt-2 flex items-center justify-between gap-3">
          <p class="text-xs text-slate-500">
            До {{ MAX_COMMISSION_MEMBERS }} человек. Ставятся в документ как введено.
          </p>
          <UiButton
            v-if="form.members.length < MAX_COMMISSION_MEMBERS"
            type="button"
            variant="outline"
            size="sm"
            class="gap-2 font-bold shrink-0"
            @click="form.members.push('')"
          >
            <Plus class="w-4 h-4" />
            Добавить
          </UiButton>
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
import { computed, ref } from "vue";
import { Download, Plus, Trash2 } from "lucide-vue-next";
import {
  abbreviateFullName,
  MAX_COMMISSION_MEMBERS,
  type EvaluationSheetsCommission,
} from "../../../shared/utils/evaluationSheets";

defineProps<{
  isOpen: boolean;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [commission: EvaluationSheetsCommission];
}>();

// Введённый состав сохраняется, пока открыта страница группы, — при повторном скачивании
// его не нужно набирать заново
const form = ref({
  chairman: "",
  hasDeputy: false,
  deputy: "",
  members: [""],
});
const errors = ref<Record<string, string>>({});

const clean = (name: string) => name.replace(/\s+/g, " ").trim();

const chairmanShort = computed(() => abbreviateFullName(form.value.chairman));

const handleSubmit = () => {
  const chairman = clean(form.value.chairman);
  const deputy = form.value.hasDeputy ? clean(form.value.deputy) : null;
  // Пустые строки членов комиссии пропускаются
  const members = form.value.members.map(clean).filter(Boolean);

  errors.value = {};
  if (!chairman) errors.value.chairman = "Укажите ФИО председателя комиссии";
  if (deputy === "") {
    errors.value.deputy = "Укажите ФИО заместителя или снимите галочку";
  }
  if (members.length === 0) errors.value.members = "Укажите хотя бы одного члена комиссии";
  if (Object.keys(errors.value).length > 0) return;

  emit("submit", { chairman, deputy, members });
};
</script>
