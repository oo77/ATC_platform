<template>
  <!--
    Отрисовка публичного дашборда. Используется и на публичной странице /d/<token>,
    и в живом предпросмотре редактора. Цвета — через собственные CSS-переменные
    (data-theme), чтобы тема дашборда не зависела от темы админки.
  -->
  <div
    class="pd-root"
    :class="{ 'pd-fill': fill }"
    :data-theme="dark ? 'dark' : 'light'"
    :style="{ '--pd-accent': settings.accentColor, '--pd-accent-soft': `${settings.accentColor}22` }"
  >
    <header v-if="settings.showHeader" class="pd-header">
      <div class="min-w-0">
        <h1 class="pd-title truncate font-semibold tracking-tight">{{ title || "Без названия" }}</h1>
        <p v-if="description" class="pd-muted mt-0.5 truncate text-sm">{{ description }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-4">
        <div v-if="settings.showLastUpdated && generatedAt" class="pd-muted hidden items-center gap-1.5 text-xs sm:flex">
          <span class="pd-live-dot" :class="{ 'pd-live-dot--busy': loading }" />
          Обновлено {{ updatedLabel }}
        </div>
        <div v-if="settings.showClock" class="text-right">
          <p class="pd-header-clock font-semibold tabular-nums leading-none">{{ clock }}</p>
          <p class="pd-muted mt-1 text-xs first-letter:uppercase">{{ dateLabel }}</p>
        </div>
        <slot name="actions" />
      </div>
    </header>
    <div v-else-if="$slots.actions" class="pd-floating-actions">
      <slot name="actions" />
    </div>

    <div v-if="!widgets.length" class="pd-muted flex flex-1 items-center justify-center p-10 text-sm">
      <slot name="empty">На дашборде пока нет виджетов</slot>
    </div>

    <div
      v-else
      class="pd-grid"
      :style="{
        gridTemplateColumns: `repeat(${settings.columns}, minmax(0, 1fr))`,
        gridAutoRows: fill ? 'minmax(0, 1fr)' : `${rowHeight}px`,
      }"
    >
      <section
        v-for="w in widgets"
        :key="w.id"
        class="pd-card"
        :class="{
          'pd-card--selectable': selectable,
          'pd-card--selected': selectable && selectedId === w.id,
          'pd-card--kpi': defOf(w)?.kind === 'kpi',
        }"
        :style="{ gridColumn: `span ${Math.min(w.w, settings.columns)}`, gridRow: `span ${w.h}` }"
        @click="selectable && emit('select', w.id)"
      >
        <!-- KPI: собственная раскладка -->
        <KpiWidget
          v-if="defOf(w)?.kind === 'kpi'"
          :title="titleOf(w)"
          :icon="widgetIcon(defOf(w)?.icon)"
          :data="dataOf(w)?.kind === 'kpi' ? (dataOf(w) as any) : null"
        />

        <ClockWidget v-else-if="w.type === 'clock'" :show-seconds="!!w.options.showSeconds" />

        <div
          v-else-if="w.type === 'text'"
          class="pd-text flex h-full items-center whitespace-pre-line"
          :class="[
            w.options.align === 'left' ? 'justify-start text-left' : 'justify-center text-center',
            `pd-text--${w.options.size || 'lg'}`,
          ]"
        >
          <div>
            <p v-if="w.title" class="pd-muted mb-1 text-sm font-medium">{{ w.title }}</p>
            {{ w.options.content }}
          </div>
        </div>

        <template v-else>
          <div class="mb-2 flex items-center gap-2">
            <component :is="widgetIcon(defOf(w)?.icon)" class="pd-accent-text h-4 w-4 shrink-0" />
            <h2 class="truncate text-sm font-semibold">{{ titleOf(w) }}</h2>
          </div>
          <div class="min-h-0 flex-1">
            <div v-if="!dataOf(w)" class="pd-skeleton h-full w-full rounded-lg" />
            <div v-else-if="dataOf(w)!.kind === 'error'" class="pd-muted flex h-full items-center justify-center text-sm">
              {{ (dataOf(w) as any).message }}
            </div>
            <ChartWidget
              v-else-if="dataOf(w)!.kind === 'chart'"
              :data="dataOf(w) as any"
              :style-hint="w.options.chartStyle"
              :dark="dark"
              :accent="settings.accentColor"
            />
            <ListWidget v-else-if="dataOf(w)!.kind === 'list'" :data="dataOf(w) as any" />
            <WeekWidget v-else-if="dataOf(w)!.kind === 'week'" :data="dataOf(w) as any" />
            <StatusWidget v-else-if="dataOf(w)!.kind === 'status'" :data="dataOf(w) as any" />
            <AlertsWidget v-else-if="dataOf(w)!.kind === 'alerts'" :data="dataOf(w) as any" />
            <BookingWidget v-else-if="dataOf(w)!.kind === 'booking'" :data="dataOf(w) as any" />
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  getWidgetDef,
  type DashboardSettings,
  type DashboardWidget,
  type WidgetData,
} from "../../../shared/utils/publicDashboard";
import { widgetIcon } from "./widgetIcons";
import KpiWidget from "./KpiWidget.vue";
import ChartWidget from "./ChartWidget.vue";
import ListWidget from "./ListWidget.vue";
import ClockWidget from "./ClockWidget.vue";
import WeekWidget from "./WeekWidget.vue";
import StatusWidget from "./StatusWidget.vue";
import AlertsWidget from "./AlertsWidget.vue";
import BookingWidget from "./BookingWidget.vue";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string | null;
    widgets: DashboardWidget[];
    settings: DashboardSettings;
    data: Record<string, WidgetData>;
    generatedAt?: string | null;
    loading?: boolean;
    /** Растянуть на высоту контейнера (fitToScreen) */
    fill?: boolean;
    /** Режим редактора: клик по виджету выбирает его */
    selectable?: boolean;
    selectedId?: string | null;
    rowHeight?: number;
  }>(),
  { rowHeight: 150 },
);

const emit = defineEmits<{ select: [id: string] }>();

const defOf = (w: DashboardWidget) => getWidgetDef(w.type);
const titleOf = (w: DashboardWidget) => w.title || defOf(w)?.title || w.type;
const dataOf = (w: DashboardWidget): WidgetData | undefined => props.data[w.id];

// ── Тема: auto → системная ──
const systemDark = ref(true);
let mq: MediaQueryList | null = null;
const onMq = (e: MediaQueryListEvent) => (systemDark.value = e.matches);

// ── Часы в шапке ──
const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  mq = window.matchMedia("(prefers-color-scheme: dark)");
  systemDark.value = mq.matches;
  mq.addEventListener("change", onMq);
  timer = setInterval(() => (now.value = new Date()), 1000);
});
onBeforeUnmount(() => {
  mq?.removeEventListener("change", onMq);
  clearInterval(timer);
});

const dark = computed(() =>
  props.settings.theme === "auto" ? systemDark.value : props.settings.theme === "dark",
);

const clock = computed(() => now.value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
const dateLabel = computed(() =>
  now.value.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }),
);
const updatedLabel = computed(() => {
  if (!props.generatedAt) return "";
  return new Date(props.generatedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
});
</script>

<style>
.pd-root {
  --pd-bg: #f1f5f9;
  --pd-card: #ffffff;
  --pd-border: #e2e8f0;
  --pd-text: #0f172a;
  --pd-muted: #64748b;
  --pd-track: #e2e8f0;
  --pd-skeleton: #e2e8f0;
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  padding: 20px;
  background: var(--pd-bg);
  color: var(--pd-text);
  font-family: Outfit, ui-sans-serif, system-ui, sans-serif;
}
.pd-root[data-theme="dark"] {
  --pd-bg: #0b1120;
  --pd-card: #111827;
  --pd-border: #1f2937;
  --pd-text: #f1f5f9;
  --pd-muted: #94a3b8;
  --pd-track: #1f2937;
  --pd-skeleton: #1f2937;
}
.pd-root.pd-fill {
  height: 100%;
}
.pd-fill .pd-grid {
  flex: 1;
  min-height: 0;
}
.pd-muted {
  color: var(--pd-muted);
}
.pd-accent-text {
  color: var(--pd-accent);
}
.pd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.pd-title {
  font-size: clamp(1.25rem, 2.2cqi, 2.25rem);
}
.pd-header-clock {
  font-size: clamp(1.25rem, 2cqi, 2rem);
}
.pd-floating-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
}
.pd-grid {
  display: grid;
  gap: 16px;
  grid-auto-flow: row dense;
}
.pd-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  border: 1px solid var(--pd-border);
  border-radius: 16px;
  background: var(--pd-card);
}
.pd-card--kpi {
  padding: 18px 20px;
}
.pd-card--selectable {
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pd-card--selectable:hover {
  border-color: var(--pd-accent);
}
.pd-card--selected {
  border-color: var(--pd-accent);
  box-shadow: 0 0 0 2px var(--pd-accent);
}
.pd-icon-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--pd-accent-soft);
  color: var(--pd-accent);
}
.pd-kpi-value {
  font-size: clamp(1.75rem, 3.4cqi, 3.5rem);
}
.pd-kpi-suffix {
  margin-left: 2px;
  font-size: 0.55em;
  color: var(--pd-muted);
}
.pd-clock {
  font-size: clamp(2rem, 5cqi, 5rem);
}
.pd-clock-sec {
  font-size: 0.45em;
}
.pd-text {
  font-weight: 500;
  line-height: 1.35;
}
.pd-text--md {
  font-size: 1rem;
}
.pd-text--lg {
  font-size: clamp(1.1rem, 2cqi, 1.75rem);
}
.pd-text--xl {
  font-size: clamp(1.4rem, 3.2cqi, 3rem);
}
.pd-th {
  background: var(--pd-card);
  border-bottom: 1px solid var(--pd-border);
}
.pd-td {
  border-bottom: 1px solid var(--pd-border);
}
tr:last-child > .pd-td {
  border-bottom: none;
}
.pd-row-now > .pd-td {
  background: var(--pd-accent-soft);
}
.pd-row-done > .pd-td {
  opacity: 0.5;
}
.pd-track {
  background: var(--pd-track);
}
.pd-bar {
  background: var(--pd-accent);
}
.pd-place-top {
  background: var(--pd-accent-soft);
  color: var(--pd-accent);
}
.pd-live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 6px;
  border-radius: 9999px;
  background: #10b981;
  vertical-align: middle;
}
.pd-live-dot--busy {
  animation: pd-pulse 1s ease-in-out infinite;
}
.pd-skeleton {
  background: var(--pd-skeleton);
  animation: pd-pulse 1.4s ease-in-out infinite;
}
/* Глобальные стили apexcharts в main.css задают цвет легенды через !important — переопределяем под тему дашборда */
.pd-root .apexcharts-legend-text {
  color: var(--pd-text) !important;
  opacity: 0.85;
}
.pd-root .apexcharts-text {
  fill: var(--pd-muted) !important;
}
.pd-root .apexcharts-datalabel-value {
  fill: var(--pd-text) !important;
}
.pd-root .apexcharts-bar-area + .apexcharts-text,
.pd-root .apexcharts-datalabels .apexcharts-text {
  fill: #fff !important;
}
.pd-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--pd-border) transparent;
}
@keyframes pd-pulse {
  50% {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pd-live-dot--busy,
  .pd-skeleton {
    animation: none;
  }
}
/* Узкий экран (телефон или узкая панель предпросмотра): одна-две колонки */
@container (max-width: 720px) {
  .pd-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    grid-auto-rows: 150px !important;
  }
  .pd-card {
    grid-column: span 2 !important;
  }
  .pd-card--kpi {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
  }
  .pd-header {
    flex-wrap: wrap;
  }
}
@container (max-width: 420px) {
  .pd-card--kpi {
    grid-column: span 2 !important;
  }
}
</style>
