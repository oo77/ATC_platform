<template>
  <!-- Активность по дням: столбцы — выбранная метрика, подсказка — все показатели дня -->
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Показатель">
        <button
          v-for="m in metrics"
          :key="m.id"
          type="button"
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          :class="metric === m.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
          @click="metric = m.id"
        >
          {{ m.label }}
        </button>
      </div>
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ metric === 'readers' ? 'Максимум за день' : 'Всего' }}: <span class="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{{ formatValue(totalValue) }}</span>
      </span>
    </div>

    <div class="relative">
      <!-- Сетка -->
      <div class="pointer-events-none absolute inset-x-0 top-0 flex h-40 flex-col justify-between" aria-hidden="true">
        <div v-for="i in 3" :key="i" class="border-t border-dashed border-gray-100 dark:border-gray-800" />
        <div class="border-t border-gray-200 dark:border-gray-700" />
      </div>
      <span class="absolute -top-2 right-0 bg-white pl-1 text-[10px] tabular-nums text-gray-400 dark:bg-gray-900">{{ formatValue(maxValue) }}</span>

      <div class="relative flex h-40 items-end" :class="points.length > 60 ? 'gap-px' : 'gap-[3px]'">
        <div
          v-for="(p, i) in points"
          :key="p.date"
          class="group relative flex h-full flex-1 items-end"
          @mouseenter="hover = i"
          @mouseleave="hover = null"
        >
          <div
            class="w-full rounded-t-[3px] transition-colors"
            :class="hover === i ? 'bg-brand-600' : value(p) ? 'bg-brand-500/80 dark:bg-brand-400/80' : 'bg-gray-100 dark:bg-white/[0.04]'"
            :style="{ height: value(p) ? `${Math.max((value(p) / maxValue) * 100, 3)}%` : '2px' }"
          />
        </div>
      </div>

      <!-- Подсказка -->
      <div
        v-if="hovered"
        class="pointer-events-none absolute -top-2 z-10 w-40 -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
        :style="{ left: `${Math.min(Math.max((((hover ?? 0) + 0.5) / points.length) * 100, 12), 88)}%` }"
      >
        <p class="font-semibold text-gray-900 dark:text-white">{{ formatDay(hovered.date) }}</p>
        <p class="mt-1 flex justify-between text-gray-500"><span>Время</span><span class="tabular-nums text-gray-800 dark:text-gray-200">{{ formatMinutes(hovered.seconds) }}</span></p>
        <p class="flex justify-between text-gray-500"><span>Читатели</span><span class="tabular-nums text-gray-800 dark:text-gray-200">{{ hovered.readers }}</span></p>
        <p class="flex justify-between text-gray-500"><span>Сессии</span><span class="tabular-nums text-gray-800 dark:text-gray-200">{{ hovered.sessions }}</span></p>
      </div>
    </div>

    <div class="mt-2 flex justify-between text-[10px] tabular-nums text-gray-400">
      <span>{{ firstDay }}</span>
      <span v-if="midDay">{{ midDay }}</span>
      <span>{{ lastDay }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

interface Point { date: string; sessions: number; readers: number; seconds: number }
const props = defineProps<{ points: Point[] }>();

const metrics = [
  { id: "seconds" as const, label: "Время" },
  { id: "readers" as const, label: "Читатели" },
  { id: "sessions" as const, label: "Сессии" },
];
const metric = ref<"seconds" | "readers" | "sessions">("seconds");
const hover = ref<number | null>(null);

const hovered = computed(() => (hover.value === null ? null : props.points[hover.value] || null));
const firstDay = computed(() => (props.points[0] ? formatDay(props.points[0].date) : ""));
const midDay = computed(() => {
  const p = props.points.length > 2 ? props.points[Math.floor(props.points.length / 2)] : undefined;
  return p ? formatDay(p.date) : "";
});
const lastDay = computed(() => {
  const p = props.points[props.points.length - 1];
  return p ? formatDay(p.date) : "";
});

const value = (p: Point) => (metric.value === "seconds" ? p.seconds / 60 : p[metric.value]);
const maxValue = computed(() => Math.max(1, ...props.points.map(value)));
const totalValue = computed(() =>
  metric.value === "readers" ? Math.max(0, ...props.points.map((p) => p.readers)) : props.points.reduce((s, p) => s + value(p), 0),
);

const formatMinutes = (sec: number) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} ч ${m % 60} мин` : `${m} мин`;
};
const formatValue = (v: number) => (metric.value === "seconds" ? formatMinutes(v * 60) : String(Math.round(v)));
const formatDay = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
</script>
