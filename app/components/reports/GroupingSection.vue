<template>
  <div>
    <!-- Уровни группировки -->
    <ol v-if="groupings.length > 0" class="mb-2 space-y-1.5">
      <li
        v-for="(grp, idx) in groupings"
        :key="`${grp.type}-${grp.field_key || grp.date_field_key}-${grp.time_scale || ''}`"
        class="group flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/60 px-2 py-1.5 dark:border-blue-900/40 dark:bg-blue-900/10"
      >
        <span class="w-4 shrink-0 text-center text-[11px] font-semibold tabular-nums text-blue-500">{{ idx + 1 }}</span>
        <div class="min-w-0 flex-1">
          <input
            :value="grp.label"
            maxlength="80"
            class="w-full rounded border border-transparent bg-transparent px-1 text-xs font-semibold text-blue-800 outline-none hover:border-blue-200 focus:border-primary focus:bg-white dark:text-blue-200 dark:focus:bg-gray-700"
            :aria-label="`Название уровня ${idx + 1}`"
            @change="rename(grp, ($event.target as HTMLInputElement).value)"
          />
          <p class="px-1 text-[10px] uppercase tracking-wider text-blue-500/80">
            {{ grp.type === "time_scale" ? `Шкала: ${TIME_SCALE_LABELS[grp.time_scale || ""] || grp.time_scale}` : "По значению поля" }}
          </p>
        </div>
        <select
          v-if="grp.type === 'time_scale'"
          class="rounded-md border border-blue-200 bg-white px-1 py-0.5 text-[11px] text-blue-700 outline-none dark:border-blue-800 dark:bg-gray-800 dark:text-blue-300"
          aria-label="Периодичность"
          @change="changeScale(grp, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="(lbl, k) in TIME_SCALE_LABELS" :key="k" :value="k" :selected="k === grp.time_scale">{{ lbl }}</option>
        </select>
        <button
          type="button"
          class="rounded p-0.5 text-blue-400 hover:text-primary disabled:opacity-30"
          :disabled="idx === 0"
          aria-label="Уровень выше"
          @click="$emit('reorder', idx, idx - 1)"
        >
          <ArrowUp class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-0.5 text-blue-400 hover:text-primary disabled:opacity-30"
          :disabled="idx === groupings.length - 1"
          aria-label="Уровень ниже"
          @click="$emit('reorder', idx, idx + 1)"
        >
          <ArrowDown class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="rounded p-0.5 text-blue-400 hover:text-red-500"
          aria-label="Удалить уровень"
          @click="$emit('remove', idx)"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </li>
    </ol>

    <!-- Добавление уровня -->
    <div ref="wrapperRef" class="relative">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 px-3 py-2 text-[11px] font-semibold text-gray-500 transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-400"
        :aria-expanded="showPicker"
        @click="openPicker"
      >
        <Plus class="h-3.5 w-3.5" />
        Добавить уровень группировки
      </button>

      <div
        v-if="showPicker"
        class="absolute left-0 top-full z-50 mt-2 w-full min-w-[300px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-boxdark"
        @keydown.escape.stop="showPicker = false"
      >
        <div class="flex gap-1 border-b border-gray-100 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/50" role="tablist">
          <button
            v-for="t in TABS"
            :key="t.key"
            type="button"
            role="tab"
            :aria-selected="pickerTab === t.key"
            class="flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-colors"
            :class="pickerTab === t.key ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-gray-500 hover:text-gray-700'"
            @click="pickerTab = t.key"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Поля -->
        <div v-if="pickerTab === 'field'">
          <div class="p-2">
            <input
              ref="pickerSearch"
              v-model="query"
              type="search"
              placeholder="Найти поле…"
              aria-label="Найти поле для группировки"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              @keydown.enter.prevent="addFirst"
            />
          </div>
          <div class="max-h-[300px] overflow-y-auto">
            <div v-for="group in pickerGroups" :key="group.key">
              <div class="bg-gray-50/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:bg-gray-800/30">
                {{ group.label }}
              </div>
              <button
                v-for="field in group.fields"
                :key="field.key"
                type="button"
                class="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300"
                :disabled="isUsed(field.key)"
                @click="addField(field)"
              >
                <span>{{ field.label }}</span>
                <Check v-if="isUsed(field.key)" class="h-3 w-3" />
              </button>
            </div>
            <p v-if="pickerGroups.length === 0" class="px-3 py-6 text-center text-xs text-gray-400">Ничего не найдено</p>
          </div>
        </div>

        <!-- Временная шкала -->
        <div v-else class="space-y-3 p-3">
          <label class="block">
            <span class="mb-1 block text-[11px] font-semibold text-gray-500">Поле-дата</span>
            <select
              v-model="timeScaleDateField"
              class="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="">Выберите дату…</option>
              <template v-for="group in entityGroups" :key="group.key">
                <optgroup v-if="group.fields.some((f) => f.isDateField)" :label="group.label">
                  <option v-for="field in group.fields.filter((f) => f.isDateField)" :key="field.key" :value="field.key">
                    {{ field.label }}
                  </option>
                </optgroup>
              </template>
            </select>
          </label>
          <div>
            <span class="mb-1 block text-[11px] font-semibold text-gray-500">Периодичность</span>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="(lbl, key) in TIME_SCALE_LABELS"
                :key="key"
                type="button"
                class="rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors"
                :class="timeScaleValue === key ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-500 hover:border-gray-400 dark:border-gray-700'"
                @click="timeScaleValue = String(key)"
              >
                {{ lbl }}
              </button>
            </div>
          </div>
          <button
            type="button"
            :disabled="!timeScaleDateField"
            class="w-full rounded-xl bg-primary py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
            @click="addTimeScale"
          >
            Добавить шкалу
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { ArrowUp, ArrowDown, X, Plus, Check } from "lucide-vue-next";
import {
  buildMatcher,
  TIME_SCALE_LABELS,
  type EntityGroupMeta,
  type FieldMeta,
  type GroupingItem,
} from "~/utils/reportBuilder";

const props = defineProps<{
  groupings: GroupingItem[];
  entityGroups: EntityGroupMeta[];
}>();

const emit = defineEmits<{
  (e: "add", item: GroupingItem): void;
  (e: "remove", idx: number): void;
  (e: "reorder", from: number, to: number): void;
}>();

const TABS = [
  { key: "field" as const, label: "По полю" },
  { key: "time" as const, label: "По периоду" },
];

const showPicker = ref(false);
const pickerTab = ref<"field" | "time">("field");
const query = ref("");
const timeScaleDateField = ref("");
const timeScaleValue = ref("month");
const wrapperRef = ref<HTMLElement | null>(null);
const pickerSearch = ref<HTMLInputElement | null>(null);

// Группировать по счётчикам и числовым мерам бессмысленно — показываем только «измерения»
const isDimension = (f: FieldMeta) => f.allowedAggregations.includes("none") && f.type !== "number";

const pickerGroups = computed(() => {
  const match = buildMatcher(query.value);
  return props.entityGroups
    .map((g) => ({
      key: g.key,
      label: g.label,
      fields: g.fields.filter((f) => isDimension(f) && (!match || match(`${f.label} ${g.label}`))),
    }))
    .filter((g) => g.fields.length > 0);
});

const isUsed = (key: string) => props.groupings.some((g) => g.type === "field" && g.field_key === key);

const openPicker = async () => {
  showPicker.value = !showPicker.value;
  if (showPicker.value) {
    query.value = "";
    await nextTick();
    pickerSearch.value?.focus();
  }
};

const addField = (field: FieldMeta) => {
  if (isUsed(field.key)) return;
  emit("add", { type: "field", field_key: field.key, label: field.label });
  showPicker.value = false;
};

const addFirst = () => {
  const f = pickerGroups.value.flatMap((g) => g.fields).find((x) => !isUsed(x.key));
  if (f) addField(f);
};

const scaleLabel = (dateKey: string, scale: string) => {
  const dateField = props.entityGroups.flatMap((g) => g.fields).find((f) => f.key === dateKey);
  return `${dateField?.label || "Дата"} (${(TIME_SCALE_LABELS[scale] || scale).toLowerCase()})`;
};

const addTimeScale = () => {
  if (!timeScaleDateField.value) return;
  const exists = props.groupings.some(
    (g) => g.type === "time_scale" && g.date_field_key === timeScaleDateField.value && g.time_scale === timeScaleValue.value,
  );
  if (!exists) {
    emit("add", {
      type: "time_scale",
      time_scale: timeScaleValue.value,
      date_field_key: timeScaleDateField.value,
      label: scaleLabel(timeScaleDateField.value, timeScaleValue.value),
    });
  }
  showPicker.value = false;
  timeScaleDateField.value = "";
};

const rename = (grp: GroupingItem, value: string) => {
  grp.label = value.trim() || grp.label;
};

const changeScale = (grp: GroupingItem, scale: string) => {
  // Автоназвание обновляем, только если пользователь его не менял
  const auto = grp.date_field_key && grp.label === scaleLabel(grp.date_field_key, grp.time_scale || "");
  grp.time_scale = scale;
  if (auto && grp.date_field_key) grp.label = scaleLabel(grp.date_field_key, scale);
};

const handleOutsideClick = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) showPicker.value = false;
};
onMounted(() => document.addEventListener("mousedown", handleOutsideClick));
onUnmounted(() => document.removeEventListener("mousedown", handleOutsideClick));
</script>
