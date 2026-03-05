<template>
  <div class="px-4 py-1">
    <!-- Список выбранных группировок -->
    <div v-if="groupings.length > 0" class="space-y-1.5 mb-3">
      <div
        v-for="(grp, idx) in groupings"
        :key="idx"
        class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/40"
      >
        <span
          class="text-xs font-medium text-blue-700 dark:text-blue-300 flex-1 min-w-0 truncate"
        >
          {{ grp.label }}
        </span>
        <span
          class="text-[10px] text-blue-500/70 dark:text-blue-400/70 shrink-0"
        >
          {{
            grp.type === "time_scale"
              ? TIME_SCALE_LABELS[grp.time_scale as string]
              : "Поле"
          }}
        </span>
        <button
          class="shrink-0 text-blue-400 hover:text-red-500 transition-colors"
          @click="$emit('remove', idx)"
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Кнопка добавить + попап -->
    <div class="relative" ref="wrapperRef">
      <button
        class="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary hover:text-primary dark:hover:text-primary transition-all"
        @click="showPicker = !showPicker"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Добавить группировку
      </button>

      <!-- Picker -->
      <div
        v-if="showPicker"
        class="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-xl shadow-xl z-30 overflow-hidden"
      >
        <!-- Tabs: Поля / Временная шкала -->
        <div class="flex border-b border-stroke dark:border-strokedark">
          <button
            class="flex-1 py-2 text-xs font-medium transition-colors"
            :class="
              pickerTab === 'field'
                ? 'bg-primary/5 text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            "
            @click="pickerTab = 'field'"
          >
            Поле
          </button>
          <button
            class="flex-1 py-2 text-xs font-medium transition-colors"
            :class="
              pickerTab === 'time'
                ? 'bg-primary/5 text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            "
            @click="pickerTab = 'time'"
          >
            Временная шкала
          </button>
        </div>

        <!-- Поле -->
        <div v-if="pickerTab === 'field'" class="max-h-48 overflow-y-auto">
          <div
            v-for="group in entityGroups"
            :key="group.key"
            class="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0"
          >
            <div
              class="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 tracking-wider bg-gray-50 dark:bg-gray-700/50"
            >
              {{ group.label }}
            </div>
            <button
              v-for="field in group.fields"
              :key="field.key"
              class="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-colors"
              @click="addField(field)"
            >
              {{ field.label }}
            </button>
          </div>
        </div>

        <!-- Временная шкала -->
        <div v-else class="p-3 space-y-2">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block"
              >Поле-дата:</label
            >
            <select
              v-model="timeScaleDateField"
              class="w-full text-xs border border-stroke dark:border-strokedark rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1.5 outline-none focus:border-primary"
            >
              <option value="">Выберите поле</option>
              <template v-for="group in entityGroups" :key="group.key">
                <option
                  v-for="field in group.fields.filter(
                    (f: any) => f.isDateField,
                  )"
                  :key="field.key"
                  :value="field.key"
                >
                  {{ field.label }}
                </option>
              </template>
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1 block"
              >Шкала:</label
            >
            <select
              v-model="timeScaleValue"
              class="w-full text-xs border border-stroke dark:border-strokedark rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1.5 outline-none focus:border-primary"
            >
              <option
                v-for="(lbl, key) in TIME_SCALE_LABELS"
                :key="key"
                :value="key"
              >
                {{ lbl }}
              </option>
            </select>
          </div>
          <button
            :disabled="!timeScaleDateField"
            class="w-full py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all"
            @click="addTimeScale"
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface GroupingItem {
  type: "field" | "time_scale";
  field_key?: string;
  time_scale?: string;
  date_field_key?: string;
  label: string;
}

const TIME_SCALE_LABELS: Record<string, string> = {
  year: "По годам",
  quarter: "По кварталам",
  month: "По месяцам",
  week: "По неделям",
  day: "По дням",
};

const props = defineProps<{
  groupings: GroupingItem[];
  entityGroups: any[];
}>();

const emit = defineEmits<{
  (e: "add", item: GroupingItem): void;
  (e: "remove", idx: number): void;
}>();

const showPicker = ref(false);
const pickerTab = ref<"field" | "time">("field");
const timeScaleDateField = ref("");
const timeScaleValue = ref("month");
const wrapperRef = ref<HTMLElement | null>(null);

const addField = (field: { key: string; label: string }) => {
  emit("add", {
    type: "field",
    field_key: field.key,
    label: field.label,
  });
  showPicker.value = false;
};

const addTimeScale = () => {
  if (!timeScaleDateField.value) return;

  const dateField = props.entityGroups
    .flatMap((g) => g.fields)
    .find((f) => f.key === timeScaleDateField.value);

  const scaleLabel =
    TIME_SCALE_LABELS[timeScaleValue.value] || timeScaleValue.value;

  emit("add", {
    type: "time_scale",
    time_scale: timeScaleValue.value,
    date_field_key: timeScaleDateField.value,
    label: `${dateField?.label || "Дата"} (${scaleLabel})`,
  });
  showPicker.value = false;
  timeScaleDateField.value = "";
};

// Закрытие при клике вне
const handleOutsideClick = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    showPicker.value = false;
  }
};

onMounted(() => document.addEventListener("mousedown", handleOutsideClick));
onUnmounted(() =>
  document.removeEventListener("mousedown", handleOutsideClick),
);
</script>
