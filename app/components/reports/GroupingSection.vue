<template>
  <div class="px-4 py-1">
    <!-- Список выбранных группировок -->
    <div v-if="groupings.length > 0" class="space-y-1 mb-2">
      <div
        v-for="(grp, idx) in groupings"
        :key="idx"
        class="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 group/item transition-all hover:border-blue-300 dark:hover:border-blue-700"
      >
        <div class="flex-1 min-w-0">
          <p
            class="text-[11px] font-bold text-blue-700 dark:text-blue-300 truncate"
          >
            {{ grp.label }}
          </p>
          <p
            class="text-[8px] text-blue-500/70 dark:text-blue-400/60 uppercase tracking-widest leading-none"
          >
            {{
              grp.type === "time_scale"
                ? `ШКАЛА: ${TIME_SCALE_LABELS[grp.time_scale as string]}`
                : "ГРУППИРОВКА ПО ПОЛЮ"
            }}
          </p>
        </div>
        <button
          class="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-blue-400 hover:text-white hover:bg-red-500 transition-all opacity-0 group-hover/item:opacity-100"
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
        class="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary hover:text-primary dark:hover:text-primary transition-all bg-gray-50/30 dark:bg-gray-800/20"
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
            stroke-width="2.5"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Добавить уровень
      </button>

      <!-- Picker -->
      <div
        v-if="showPicker"
        class="absolute left-0 bottom-full mb-2 w-full min-w-[300px] bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-2xl shadow-2xl z-100 overflow-hidden"
      >
        <!-- Tabs -->
        <div
          class="flex p-1 bg-gray-50 dark:bg-gray-800/50 border-b border-stroke dark:border-strokedark"
        >
          <button
            class="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            :class="
              pickerTab === 'field'
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            "
            @click="pickerTab = 'field'"
          >
            Поля
          </button>
          <button
            class="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            :class="
              pickerTab === 'time'
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            "
            @click="pickerTab = 'time'"
          >
            Временная шкала
          </button>
        </div>

        <!-- Контент: Поля -->
        <div v-if="pickerTab === 'field'" class="max-h-[350px] overflow-y-auto">
          <div
            v-for="group in entityGroups"
            :key="group.key"
            class="border-b border-gray-50 dark:border-gray-800 last:border-b-0"
          >
            <div
              class="px-4 py-2 text-[9px] font-black uppercase text-gray-400 tracking-[0.15em] bg-gray-50/50 dark:bg-gray-800/30"
            >
              {{ group.label }}
            </div>
            <button
              v-for="field in group.fields"
              :key="field.key"
              class="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-primary/5 hover:text-primary transition-all border-l-4 border-transparent hover:border-primary flex items-center justify-between group/field"
              @click="addField(field)"
            >
              <span>{{ field.label }}</span>
              <svg
                class="w-3 h-3 opacity-0 group-hover/field:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Контент: Временная шкала -->
        <div v-else class="p-4 space-y-4">
          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
              >Поле-дата</label
            >
            <select
              v-model="timeScaleDateField"
              class="w-full text-xs font-medium border border-stroke dark:border-strokedark rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
            >
              <option value="">Выберите поле для анализа...</option>
              <template v-for="group in entityGroups" :key="group.key">
                <optgroup :label="group.label.toUpperCase()">
                  <option
                    v-for="field in group.fields.filter(
                      (f: any) => f.isDateField,
                    )"
                    :key="field.key"
                    :value="field.key"
                  >
                    {{ field.label }}
                  </option>
                </optgroup>
              </template>
            </select>
          </div>

          <div class="space-y-1.5">
            <label
              class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
              >Периодичность</label
            >
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="(lbl, key) in TIME_SCALE_LABELS"
                :key="key"
                class="px-2 py-2 text-[10px] font-bold rounded-lg border transition-all"
                :class="
                  timeScaleValue === key
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-stroke dark:border-strokedark text-gray-500 hover:border-gray-400 dark:hover:border-gray-500'
                "
                @click="timeScaleValue = key as string"
              >
                {{ lbl }}
              </button>
            </div>
          </div>

          <button
            :disabled="!timeScaleDateField"
            class="w-full py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all shadow-lg shadow-primary/20"
            @click="addTimeScale"
          >
            Применить
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
  day: "Дни",
  week: "Недели",
  month: "Месяцы",
  quarter: "Кварталы",
  year: "Годы",
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
  if (
    props.groupings.some((g) => g.type === "field" && g.field_key === field.key)
  ) {
    showPicker.value = false;
    return;
  }

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

  if (
    props.groupings.some(
      (g) =>
        g.type === "time_scale" &&
        g.date_field_key === timeScaleDateField.value &&
        g.time_scale === timeScaleValue.value,
    )
  ) {
    showPicker.value = false;
    return;
  }

  emit("add", {
    type: "time_scale",
    time_scale: timeScaleValue.value,
    date_field_key: timeScaleDateField.value,
    label: `${dateField?.label || "Дата"} (${scaleLabel})`,
  });
  showPicker.value = false;
  timeScaleDateField.value = "";
};

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
