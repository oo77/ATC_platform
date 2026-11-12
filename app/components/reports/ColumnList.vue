<template>
  <div>
    <div
      v-if="columns.length === 0"
      class="rounded-xl border border-dashed border-gray-200 py-8 text-center text-xs text-gray-400 dark:border-gray-700"
    >
      Отметьте поля слева — они появятся здесь как столбцы
    </div>

    <ul v-else class="space-y-1.5" aria-label="Столбцы отчёта">
      <li
        v-for="(col, idx) in columns"
        :key="col.field_key"
        draggable="true"
        class="group rounded-xl border bg-white px-2.5 py-2 shadow-sm transition-all dark:bg-gray-800"
        :class="[
          dragOverIdx === idx && dragIdx !== idx
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-gray-200 dark:border-gray-700',
          dragIdx === idx ? 'opacity-50' : '',
        ]"
        @dragstart="onDragStart(idx, $event)"
        @dragover.prevent="dragOverIdx = idx"
        @dragleave="dragOverIdx === idx && (dragOverIdx = null)"
        @dragend="resetDrag"
        @drop.prevent="onDrop(idx)"
      >
        <div class="flex items-center gap-1.5">
          <GripVertical class="h-4 w-4 shrink-0 cursor-grab text-gray-300 group-hover:text-primary" />
          <span class="w-4 shrink-0 text-center text-[11px] tabular-nums text-gray-400">{{ idx + 1 }}</span>
          <input
            :value="col.label"
            class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-semibold text-gray-800 outline-none hover:border-gray-200 focus:border-primary focus:bg-white dark:text-gray-100 dark:focus:bg-gray-700"
            :class="duplicateLabels.has(col.label.trim().toLowerCase()) ? '!border-amber-400' : ''"
            :aria-label="`Заголовок столбца ${idx + 1}`"
            maxlength="80"
            @change="rename(col, ($event.target as HTMLInputElement).value)"
          />
          <div class="flex shrink-0 items-center opacity-60 group-hover:opacity-100">
            <button
              type="button"
              class="rounded p-0.5 text-gray-400 hover:text-primary disabled:opacity-30"
              :disabled="idx === 0"
              aria-label="Переместить выше"
              @click="move(idx, -1)"
            >
              <ArrowUp class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              class="rounded p-0.5 text-gray-400 hover:text-primary disabled:opacity-30"
              :disabled="idx === columns.length - 1"
              aria-label="Переместить ниже"
              @click="move(idx, 1)"
            >
              <ArrowDown class="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              class="rounded p-0.5 text-gray-400 hover:text-red-500"
              aria-label="Удалить столбец"
              @click="$emit('remove', col.field_key)"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div class="mt-1.5 flex flex-wrap items-center gap-1.5 pl-[42px]">
          <span class="truncate text-[11px] text-gray-400" :title="col.field_key">
            {{ fieldMap.get(col.field_key)?.label || col.field_key }}
          </span>
          <span class="flex-1" />
          <!-- Агрегация: только допустимые для поля -->
          <select
            v-model="col.aggregation"
            class="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-primary outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-700"
            aria-label="Агрегация"
          >
            <option v-for="a in allowedAggs(col)" :key="a" :value="a">{{ AGG_LABELS[a] || a }}</option>
          </select>
          <!-- ИТОГО -->
          <button
            type="button"
            class="rounded-md border px-1.5 py-0.5 text-[11px] font-semibold transition-colors"
            :class="col.show_in_total
              ? 'border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/30'
              : 'border-gray-200 text-gray-400 hover:text-orange-500 dark:border-gray-700'"
            :aria-pressed="!!col.show_in_total"
            title="Показывать в строке ИТОГО"
            @click="col.show_in_total = !col.show_in_total"
          >
            Σ Итог
          </button>
          <select
            v-if="col.show_in_total"
            v-model="col.total_aggregation"
            class="rounded-md border border-orange-200 bg-orange-50 px-1 py-0.5 text-[11px] font-semibold text-orange-600 outline-none dark:border-orange-800 dark:bg-orange-950/30"
            aria-label="Как считать итог"
          >
            <option v-for="(lbl, k) in TOTAL_AGG_LABELS" :key="k" :value="k">{{ lbl }}</option>
          </select>
        </div>
      </li>
    </ul>

    <p v-if="duplicateLabels.size" class="mt-2 text-[11px] text-amber-600">
      Одинаковые заголовки будут пронумерованы автоматически — лучше переименуйте.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { GripVertical, ArrowUp, ArrowDown, X } from "lucide-vue-next";
import {
  AGG_LABELS,
  TOTAL_AGG_LABELS,
  type ColumnConfig,
  type FieldMeta,
} from "~/utils/reportBuilder";

const props = defineProps<{
  columns: ColumnConfig[];
  fieldMap: Map<string, FieldMeta>;
  /** Заголовки группировок — для проверки дублей */
  groupingLabels: string[];
}>();

const emit = defineEmits<{
  (e: "remove", fieldKey: string): void;
  (e: "reorder", from: number, to: number): void;
}>();

const allowedAggs = (col: ColumnConfig) => {
  const list = props.fieldMap.get(col.field_key)?.allowedAggregations ?? [col.aggregation];
  return list.includes(col.aggregation) ? list : [col.aggregation, ...list];
};

const rename = (col: ColumnConfig, value: string) => {
  const v = value.trim();
  col.label = v || props.fieldMap.get(col.field_key)?.label || col.field_key;
};

const duplicateLabels = computed(() => {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const l of [...props.groupingLabels, ...props.columns.map((c) => c.label)]) {
    const k = l.trim().toLowerCase();
    if (seen.has(k)) dup.add(k);
    seen.add(k);
  }
  return dup;
});

const move = (idx: number, delta: number) => emit("reorder", idx, idx + delta);

// ── Drag & drop ───────────────────────────────────────────────────────
const dragIdx = ref<number | null>(null);
const dragOverIdx = ref<number | null>(null);

const onDragStart = (idx: number, e: DragEvent) => {
  dragIdx.value = idx;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  }
};
const resetDrag = () => {
  dragIdx.value = null;
  dragOverIdx.value = null;
};
const onDrop = (to: number) => {
  if (dragIdx.value !== null && dragIdx.value !== to) emit("reorder", dragIdx.value, to);
  resetDrag();
};
</script>
