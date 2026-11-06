<template>
  <UiModal
    :is-open="isOpen"
    title="Лист ознакомления — инструктаж"
    size="md"
    @close="$emit('close')"
  >
    <div class="space-y-5">
      <div class="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-slate-600 dark:text-slate-300">
        Группа, учебная программа и дата инструктажа (первый день обучения группы)
        подставляются автоматически. Таблица на 20 слушателей, строка «Ф.И.О., должность»
        и подпись остаются для заполнения от руки. Выберите, кто провёл инструктаж.
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

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <UiButton type="button" variant="outline" @click="$emit('close')">
          Отмена
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          :loading="loading"
          :disabled="loadingInstructors || loadFailed || loading"
          @click="$emit('submit', { instructorId: selectedId })"
        >
          <Download v-if="!loading" class="w-4 h-4" />
          Скачать Word
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Download } from "lucide-vue-next";

interface SheetInstructor {
  id: string;
  fullName: string;
}

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  /** Идёт формирование файла */
  loading?: boolean;
}>();

defineEmits<{
  close: [];
  submit: [options: { instructorId: string | null }];
}>();

const { authFetch } = useAuthFetch();

const instructors = ref<SheetInstructor[]>([]);
const loadingInstructors = ref(false);
const loadFailed = ref(false);
// Выбор сохраняется, пока открыта страница группы; null — линия остаётся пустой
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
    const response = await authFetch<{ success: boolean; instructors: SheetInstructor[] }>(
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
    console.error("Error loading acquaintance sheet instructors:", error);
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
</script>
