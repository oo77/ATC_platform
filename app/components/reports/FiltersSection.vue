<template>
  <div class="space-y-4">
    <!-- Период -->
    <section>
      <div class="mb-1 flex items-center justify-between">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Период</span>
        <button
          v-if="filters.date_from || filters.date_to"
          type="button"
          class="text-[11px] text-gray-400 hover:text-red-500"
          @click="patch({ date_from: undefined, date_to: undefined })"
        >
          Очистить
        </button>
      </div>
      <div class="mb-1.5 flex flex-wrap gap-1">
        <button
          v-for="p in DATE_PRESETS"
          :key="p.key"
          type="button"
          class="rounded-full border px-2 py-0.5 text-[11px] transition-colors"
          :class="activePreset === p.key
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary dark:border-gray-700'"
          @click="applyPreset(p.key)"
        >
          {{ p.label }}
        </button>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <label class="block">
          <span class="sr-only">С даты</span>
          <input
            type="date"
            :value="filters.date_from || ''"
            :max="filters.date_to || undefined"
            class="w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-primary dark:border-gray-700 dark:text-gray-200"
            @change="patch({ date_from: ($event.target as HTMLInputElement).value || undefined })"
          />
        </label>
        <label class="block">
          <span class="sr-only">По дату</span>
          <input
            type="date"
            :value="filters.date_to || ''"
            :min="filters.date_from || undefined"
            class="w-full rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none focus:border-primary dark:border-gray-700 dark:text-gray-200"
            @change="patch({ date_to: ($event.target as HTMLInputElement).value || undefined })"
          />
        </label>
      </div>
      <label class="mt-1.5 flex items-center gap-2 text-[11px] text-gray-500">
        <span class="shrink-0">Применить к</span>
        <select
          class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-1.5 py-1 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          @change="patch({ date_field: ($event.target as HTMLSelectElement).value })"
        >
          <option v-for="o in DATE_FIELD_OPTIONS" :key="o.key" :value="o.key" :selected="o.key === (filters.date_field || 'group.start_date')">{{ o.label }}</option>
        </select>
      </label>
    </section>

    <!-- Справочники -->
    <section class="space-y-2">
      <UiMultiSelect
        label="Курсы"
        :model-value="filters.course_ids"
        :options="courseOptions"
        placeholder="Все курсы"
        @update:model-value="(v: string[]) => patch({ course_ids: v.length ? v : undefined })"
      />
      <UiMultiSelect
        label="Учебные группы"
        :model-value="filters.group_ids"
        :options="groupOptions"
        placeholder="Все группы"
        @update:model-value="(v: string[]) => patch({ group_ids: v.length ? v : undefined })"
      />
      <UiMultiSelect
        label="Организации"
        :model-value="filters.org_ids"
        :options="orgOptions"
        placeholder="Все организации"
        @update:model-value="(v: string[]) => patch({ org_ids: v.length ? v : undefined })"
      />
      <UiMultiSelect
        label="Инструкторы (по дисциплинам курса)"
        :model-value="filters.instructor_ids"
        :options="instructorOptions"
        placeholder="Все инструкторы"
        @update:model-value="(v: string[]) => patch({ instructor_ids: v.length ? v : undefined })"
      />
    </section>

    <!-- Условия по значениям -->
    <section>
      <div class="mb-1 flex items-center justify-between">
        <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Условия
          <span v-if="conditions.length" class="ml-1 rounded-full bg-primary/10 px-1.5 text-primary">{{ conditions.length }}</span>
        </span>
        <span class="text-[11px] text-gray-400">все условия через «И»</span>
      </div>
      <ul class="space-y-1.5">
        <li
          v-for="(cond, idx) in conditions"
          :key="idx"
          class="rounded-lg border border-gray-200 p-1.5 dark:border-gray-700"
          :class="isIncomplete(cond) ? 'border-amber-300 dark:border-amber-700' : ''"
        >
          <div class="flex items-center gap-1">
            <select
              class="min-w-0 flex-1 rounded border border-gray-200 bg-transparent px-1 py-0.5 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Поле условия"
              @change="setCondField(idx, ($event.target as HTMLSelectElement).value)"
            >
              <optgroup v-for="g in conditionGroups" :key="g.key" :label="g.label">
                <option v-for="f in g.fields" :key="f.key" :value="f.key" :selected="f.key === cond.field_key">{{ f.label }}</option>
              </optgroup>
            </select>
            <button type="button" class="rounded p-0.5 text-gray-400 hover:text-red-500" aria-label="Удалить условие" @click="removeCond(idx)">
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
          <div class="mt-1 flex items-center gap-1">
            <select
              class="rounded border border-gray-200 bg-transparent px-1 py-0.5 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Оператор"
              @change="updateCond(idx, { op: ($event.target as HTMLSelectElement).value })"
            >
              <option v-for="op in opsFor(cond.field_key)" :key="op" :value="op" :selected="op === cond.op">{{ OP_LABELS[op] || op }}</option>
            </select>
            <template v-if="!VALUELESS_OPS.includes(cond.op)">
              <!-- Список значений для enum -->
              <select
                v-if="fieldMap.get(cond.field_key)?.enumValues?.length && (cond.op === 'eq' || cond.op === 'neq')"
                class="min-w-0 flex-1 rounded border border-gray-200 bg-transparent px-1 py-0.5 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                aria-label="Значение"
                @change="updateCond(idx, { value: ($event.target as HTMLSelectElement).value })"
              >
                <option value="" disabled :selected="!cond.value">значение…</option>
                <option v-for="v in fieldMap.get(cond.field_key)!.enumValues" :key="v" :value="v" :selected="v === cond.value">{{ ENUM_LABELS[v] || v }}</option>
              </select>
              <input
                v-else
                :type="inputType(cond.field_key)"
                :value="cond.value ?? ''"
                class="min-w-0 flex-1 rounded border border-gray-200 bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:text-gray-200"
                placeholder="значение"
                aria-label="Значение"
                @change="updateCond(idx, { value: ($event.target as HTMLInputElement).value })"
              />
              <template v-if="cond.op === 'between'">
                <span class="text-[11px] text-gray-400">и</span>
                <input
                  :type="inputType(cond.field_key)"
                  :value="cond.value2 ?? ''"
                  class="min-w-0 flex-1 rounded border border-gray-200 bg-transparent px-1.5 py-0.5 text-[11px] outline-none focus:border-primary dark:border-gray-700 dark:text-gray-200"
                  aria-label="Второе значение"
                  @change="updateCond(idx, { value2: ($event.target as HTMLInputElement).value })"
                />
              </template>
            </template>
          </div>
        </li>
      </ul>
      <button
        type="button"
        class="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-1.5 text-[11px] font-semibold text-gray-500 hover:border-primary hover:text-primary dark:border-gray-700"
        @click="addCond"
      >
        <Plus class="h-3.5 w-3.5" /> Добавить условие
      </button>
    </section>

    <!-- Сортировка и Топ-N -->
    <section>
      <span class="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Сортировка и ограничение</span>
      <div class="flex items-center gap-1.5">
        <select
          class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-transparent px-1.5 py-1 text-xs outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Сортировать по"
          @change="$emit('update:sort', ($event.target as HTMLSelectElement).value, sortDirection)"
        >
          <option value="" :selected="!sortField">По умолчанию</option>
          <option v-for="l in sortOptions" :key="l" :value="l" :selected="l === sortField">{{ l }}</option>
        </select>
        <button
          type="button"
          class="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-primary hover:text-primary disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
          :disabled="!sortField"
          :title="sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'"
          @click="$emit('update:sort', sortField, sortDirection === 'asc' ? 'desc' : 'asc')"
        >
          <ArrowUpNarrowWide v-if="sortDirection === 'asc'" class="h-3.5 w-3.5" />
          <ArrowDownWideNarrow v-else class="h-3.5 w-3.5" />
          {{ sortDirection === "asc" ? "А→Я" : "Я→А" }}
        </button>
      </div>
      <label class="mt-1.5 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
        <input
          type="checkbox"
          class="h-3.5 w-3.5 accent-primary"
          :checked="!!filters.row_limit"
          @change="patch({ row_limit: ($event.target as HTMLInputElement).checked ? 10 : undefined })"
        />
        Показать только первые
        <input
          type="number"
          min="1"
          max="100000"
          :disabled="!filters.row_limit"
          :value="filters.row_limit || 10"
          class="w-16 rounded border border-gray-200 bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-primary disabled:opacity-40 dark:border-gray-700"
          aria-label="Количество строк"
          @change="patch({ row_limit: Math.max(1, Number(($event.target as HTMLInputElement).value) || 10) })"
        />
        строк
      </label>
    </section>

    <button
      v-if="hasActiveFilters"
      type="button"
      class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2 text-[11px] font-semibold text-red-500 hover:bg-red-500 hover:text-white dark:border-red-900/40"
      @click="$emit('update', {})"
    >
      <FilterX class="h-3.5 w-3.5" /> Сбросить все фильтры
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { X, Plus, FilterX, ArrowUpNarrowWide, ArrowDownWideNarrow } from "lucide-vue-next";
import {
  DATE_PRESETS,
  DATE_FIELD_OPTIONS,
  OP_LABELS,
  VALUELESS_OPS,
  type EntityGroupMeta,
  type FieldMeta,
  type ReportCondition,
  type ReportFilters,
} from "~/utils/reportBuilder";

const props = defineProps<{
  filters: ReportFilters;
  lookup: { courses: any[]; organizations: any[]; instructors: any[]; groups: any[] };
  entityGroups: EntityGroupMeta[];
  fieldMap: Map<string, FieldMeta>;
  sortOptions: string[];
  sortField: string;
  sortDirection: "asc" | "desc";
}>();

const emit = defineEmits<{
  (e: "update", filters: ReportFilters): void;
  (e: "update:sort", field: string, direction: "asc" | "desc"): void;
}>();

const ENUM_LABELS: Record<string, string> = {
  pending: "Ожидает",
  in_progress: "В процессе",
  on_time: "Вовремя",
  late: "С опозданием",
  overdue: "Просрочено",
  approved: "Одобрено",
  manual: "Вручную",
  ai_scan: "AI-скан",
  excel: "Excel",
  group_journal: "Журнал группы",
};

const archived = (x: any) => (x.is_active === 0 || x.is_active === false ? " (архив)" : "");

const courseOptions = computed(() =>
  props.lookup.courses.map((c) => ({
    id: String(c.id),
    label: `${c.short_name || c.name}${archived(c)}`,
    description: c.short_name ? c.name : c.code,
  })),
);
const orgOptions = computed(() =>
  props.lookup.organizations.map((o) => ({
    id: String(o.id),
    label: `${o.short_name || o.name}${archived(o)}`,
    description: o.code,
  })),
);
const groupOptions = computed(() =>
  props.lookup.groups.map((g) => ({
    id: String(g.id),
    label: g.code,
    description: [g.course_short_name, g.start_date ? new Date(g.start_date).toLocaleDateString("ru-RU") : ""]
      .filter(Boolean)
      .join(" · "),
  })),
);
const instructorOptions = computed(() =>
  props.lookup.instructors.map((i) => ({
    id: String(i.id),
    label: `${i.full_name}${archived(i)}`,
    description: i.email,
  })),
);

const patch = (changes: Partial<ReportFilters>) => {
  const next: ReportFilters = { ...props.filters, ...changes };
  for (const k of Object.keys(next) as (keyof ReportFilters)[]) {
    const v = next[k];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) delete next[k];
  }
  emit("update", next);
};

// ── Пресеты дат ───────────────────────────────────────────────────────
const activePreset = computed(() => {
  if (!props.filters.date_from || !props.filters.date_to) return null;
  return (
    DATE_PRESETS.find((p) => {
      const [a, b] = p.range();
      return a === props.filters.date_from && b === props.filters.date_to;
    })?.key ?? null
  );
});

const applyPreset = (key: string) => {
  if (activePreset.value === key) {
    patch({ date_from: undefined, date_to: undefined });
    return;
  }
  const p = DATE_PRESETS.find((x) => x.key === key);
  if (!p) return;
  const [from, to] = p.range();
  patch({ date_from: from, date_to: to });
};

// ── Условия ───────────────────────────────────────────────────────────
const conditions = computed<ReportCondition[]>(() => props.filters.conditions ?? []);

const conditionGroups = computed(() =>
  props.entityGroups
    .map((g) => ({ key: g.key, label: g.label, fields: g.fields.filter((f) => (f.conditionOps ?? []).length > 0) }))
    .filter((g) => g.fields.length > 0),
);

const opsFor = (key: string) => props.fieldMap.get(key)?.conditionOps ?? [];

const inputType = (key: string) => {
  const t = props.fieldMap.get(key)?.type;
  if (t === "date" || t === "datetime") return "date";
  if (t === "number" || t === "computed") return "number";
  return "text";
};

const isIncomplete = (c: ReportCondition) =>
  !VALUELESS_OPS.includes(c.op) &&
  (c.value === undefined || c.value === null || c.value === "" || (c.op === "between" && (c.value2 === undefined || c.value2 === "")));

const setConditions = (list: ReportCondition[]) => patch({ conditions: list.length ? list : undefined });

const addCond = () => {
  const first = conditionGroups.value[0]?.fields[0];
  if (!first) return;
  setConditions([...conditions.value, { field_key: first.key, op: first.conditionOps![0]!, value: "" }]);
};

const removeCond = (idx: number) => setConditions(conditions.value.filter((_, i) => i !== idx));

const updateCond = (idx: number, changes: Partial<ReportCondition>) =>
  setConditions(conditions.value.map((c, i) => (i === idx ? { ...c, ...changes } : c)));

const setCondField = (idx: number, key: string) => {
  const ops = opsFor(key);
  const cur = conditions.value[idx];
  const op = cur && ops.includes(cur.op) && inputType(key) === inputType(cur.field_key) ? cur.op : ops[0]!;
  const keepValue = cur && inputType(key) === inputType(cur.field_key);
  updateCond(idx, { field_key: key, op, value: keepValue ? cur!.value : "", value2: keepValue ? cur!.value2 : "" });
};

const hasActiveFilters = computed(() => Object.keys(props.filters).some((k) => k !== "date_field"));
</script>
