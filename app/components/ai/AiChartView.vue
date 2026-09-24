<template>
  <div class="space-y-3">
    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl">
        <button
          v-for="t in chartTypes"
          :key="t.id"
          class="p-1.5 rounded-lg transition-all"
          :class="chartType === t.id
            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
          :title="t.label"
          @click="chartType = t.id"
        >
          <component :is="t.icon" class="w-3.5 h-3.5" :class="t.id === 'hbar' ? 'rotate-90' : ''" />
        </button>
      </div>

      <label class="flex items-center gap-1.5 text-[11px] text-gray-500">
        <span>Ось X</span>
        <select
          v-model="xKey"
          class="text-[11px] py-1 pl-2 pr-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500"
        >
          <option v-for="c in labelColumns" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
      </label>

      <label class="flex items-center gap-1.5 text-[11px] text-gray-500">
        <span>Показать</span>
        <select
          v-model.number="topN"
          class="text-[11px] py-1 pl-2 pr-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-blue-500"
        >
          <option :value="10">Топ 10</option>
          <option :value="20">Топ 20</option>
          <option :value="50">Топ 50</option>
          <option :value="0">Все</option>
        </select>
      </label>

      <button
        v-if="!isTimeAxis"
        class="px-2 py-1 rounded-lg text-[11px] border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1"
        :title="sortDesc ? 'По убыванию' : 'Как в таблице'"
        @click="sortDesc = !sortDesc"
      >
        <ArrowDownWideNarrow v-if="sortDesc" class="w-3.5 h-3.5" />
        <List v-else class="w-3.5 h-3.5" />
        {{ sortDesc ? 'По убыванию' : 'Исходный порядок' }}
      </button>
    </div>

    <!-- Series (numeric columns) -->
    <div v-if="numericColumns.length > 1" class="flex flex-wrap gap-1.5">
      <button
        v-for="(c, idx) in numericColumns"
        :key="c.key"
        class="px-2 py-0.5 rounded-full text-[10.5px] font-medium border transition-colors flex items-center gap-1.5"
        :class="yKeys.includes(c.key)
          ? 'border-transparent text-white'
          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'"
        :style="yKeys.includes(c.key) ? { background: palette[idx % palette.length] } : {}"
        @click="toggleSeries(c.key)"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- Chart -->
    <div class="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-3">
      <h4 class="text-xs font-bold text-gray-900 dark:text-white mb-1">
        {{ artifact.chartSuggestion?.title || artifact.title }}
      </h4>
      <ClientOnly>
        <VueApexCharts
          v-if="series.length && categories.length"
          :key="chartKey"
          :type="apexType"
          :height="chartHeight"
          :options="options"
          :series="apexSeries"
        />
        <div v-else class="py-14 text-center text-xs text-gray-400">
          Недостаточно числовых данных для построения графика
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VueApexCharts from 'vue3-apexcharts';
import {
  BarChart3,
  LineChart,
  AreaChart,
  PieChart,
  CircleDot,
  ArrowDownWideNarrow,
  List,
} from 'lucide-vue-next';
import type { AiChartType, AiReportArtifact } from '~/types/aiChat';

const props = defineProps<{ artifact: AiReportArtifact; height?: number }>();

const palette = ['#465FFF', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

const chartTypes: Array<{ id: AiChartType; label: string; icon: any }> = [
  { id: 'bar', label: 'Столбцы', icon: BarChart3 },
  { id: 'hbar', label: 'Горизонтальные столбцы', icon: BarChart3 },
  { id: 'line', label: 'Линия', icon: LineChart },
  { id: 'area', label: 'Область', icon: AreaChart },
  { id: 'doughnut', label: 'Кольцо', icon: CircleDot },
  { id: 'pie', label: 'Круговая', icon: PieChart },
];

const numericColumns = computed(() =>
  props.artifact.columns.filter((c) => c.type === 'number' || props.artifact.rows.every((r) => r[c.key] == null || typeof r[c.key] === 'number')),
);
const labelColumns = computed(() => {
  const nonNumeric = props.artifact.columns.filter((c) => !numericColumns.value.includes(c));
  return nonNumeric.length ? nonNumeric : props.artifact.columns;
});

const suggestion = props.artifact.chartSuggestion || {};
const chartType = ref<AiChartType>(suggestion.type || 'bar');
const xKey = ref<string>(suggestion.xKey || labelColumns.value[0]?.key || '');
const yKeys = ref<string[]>(
  (suggestion.yKeys?.length ? suggestion.yKeys : suggestion.yKey ? [suggestion.yKey] : numericColumns.value.slice(0, 1).map((c) => c.key))
    .filter((k) => numericColumns.value.some((c) => c.key === k)),
);
const topN = ref(props.artifact.rows.length > 20 ? 20 : 0);
const sortDesc = ref(false);

const isTimeAxis = computed(() => {
  const col = props.artifact.columns.find((c) => c.key === xKey.value);
  return col?.type === 'date' || /month|year|date|period|месяц|год/i.test(xKey.value);
});
const isRound = computed(() => chartType.value === 'doughnut' || chartType.value === 'pie');

function toggleSeries(key: string) {
  if (yKeys.value.includes(key)) {
    if (yKeys.value.length > 1) yKeys.value = yKeys.value.filter((k) => k !== key);
  } else {
    yKeys.value = [...yKeys.value, key];
  }
}

const preparedRows = computed(() => {
  let rows = [...props.artifact.rows];
  const first = yKeys.value[0];
  if ((sortDesc.value || isRound.value) && first && !isTimeAxis.value) {
    rows.sort((a, b) => (Number(b[first]) || 0) - (Number(a[first]) || 0));
  }
  const n = isRound.value ? Math.min(topN.value || 12, 12) : topN.value;
  if (n && rows.length > n) {
    if (isRound.value && first) {
      // Остальное сворачиваем в «Прочие», чтобы доли сходились
      const head = rows.slice(0, n - 1);
      const rest = rows.slice(n - 1).reduce((s, r) => s + (Number(r[first]) || 0), 0);
      rows = [...head, { [xKey.value]: 'Прочие', [first]: rest }];
    } else {
      rows = rows.slice(0, n);
    }
  }
  return rows;
});

const categories = computed(() => preparedRows.value.map((r) => String(r[xKey.value] ?? '—').trim()));
const series = computed(() =>
  yKeys.value.map((k) => ({
    name: props.artifact.columns.find((c) => c.key === k)?.label || k,
    data: preparedRows.value.map((r) => Number(r[k]) || 0),
  })),
);

const apexType = computed(() => {
  if (chartType.value === 'hbar') return 'bar';
  if (chartType.value === 'doughnut') return 'donut';
  return chartType.value;
});
const apexSeries = computed(() => (isRound.value ? series.value[0]?.data || [] : series.value));

const chartHeight = computed(() => {
  if (props.height) return props.height;
  if (chartType.value === 'hbar') return Math.max(260, Math.min(categories.value.length * 30 + 80, 900));
  return isRound.value ? 340 : 320;
});
const chartKey = computed(() => `${chartType.value}-${xKey.value}-${yKeys.value.join(',')}-${isDark.value}`);

// Тёмная тема: следим за классом .dark на <html>
const isDark = ref(false);
let observer: MutationObserver | null = null;
onMounted(() => {
  const root = document.documentElement;
  isDark.value = root.classList.contains('dark');
  observer = new MutationObserver(() => (isDark.value = root.classList.contains('dark')));
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => observer?.disconnect());

const fmtNum = (v: number) => (typeof v === 'number' ? v.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : v);
const shortLabel = (v: any) => {
  const s = String(v ?? '');
  return s.length > 28 ? s.slice(0, 26) + '…' : s;
};

const options = computed(() => {
  const textColor = isDark.value ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark.value ? '#1F2937' : '#F1F5F9';
  const base: any = {
    colors: palette,
    chart: {
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } },
      animations: { enabled: true, speed: 350 },
      background: 'transparent',
    },
    theme: { mode: isDark.value ? 'dark' : 'light' },
    legend: { show: series.value.length > 1 || isRound.value, position: 'bottom', fontSize: '11px', labels: { colors: textColor } },
    tooltip: { theme: isDark.value ? 'dark' : 'light', y: { formatter: fmtNum } },
    dataLabels: { enabled: false },
  };

  if (isRound.value) {
    return {
      ...base,
      labels: categories.value.map(shortLabel),
      stroke: { width: 2, colors: [isDark.value ? '#111827' : '#fff'] },
      dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%`, dropShadow: { enabled: false } },
      plotOptions: {
        pie: {
          donut: {
            size: '62%',
            labels: {
              show: chartType.value === 'doughnut',
              total: { show: true, label: 'Всего', color: textColor, formatter: (w: any) => fmtNum(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)) },
              value: { color: isDark.value ? '#fff' : '#111827', formatter: (v: string) => fmtNum(Number(v)) },
            },
          },
        },
      },
    };
  }

  const horizontal = chartType.value === 'hbar';
  return {
    ...base,
    xaxis: {
      categories: categories.value,
      labels: {
        style: { colors: textColor, fontSize: '10px' },
        formatter: horizontal ? fmtNum : shortLabel,
        rotate: -40,
        hideOverlappingLabels: true,
        trim: true,
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: textColor, fontSize: '10px' },
        formatter: horizontal ? shortLabel : fmtNum,
        maxWidth: horizontal ? 200 : 80,
      },
    },
    grid: { borderColor: gridColor, strokeDashArray: 4, padding: { right: horizontal ? 36 : 18 },xaxis: { lines: { show: horizontal } }, yaxis: { lines: { show: !horizontal } } },
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 4,
        borderRadiusApplication: 'end',
        columnWidth: series.value.length > 1 ? '65%' : '50%',
        barHeight: series.value.length > 1 ? '75%' : '60%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: categories.value.length <= 15 && series.value.length === 1,
      formatter: fmtNum,
      offsetX: horizontal ? 18 : 0,
      offsetY: horizontal ? 0 : -18,
      style: { fontSize: '10px', colors: [textColor] },
    },
    stroke: chartType.value === 'line' || chartType.value === 'area' ? { curve: 'smooth', width: 3 } : { show: false },
    markers: chartType.value === 'line' ? { size: 4, strokeWidth: 0 } : { size: 0 },
    fill: chartType.value === 'area' ? { type: 'gradient', gradient: { opacityFrom: 0.45, opacityTo: 0.05 } } : { opacity: 1 },
    tooltip: { ...base.tooltip, x: { formatter: (_: any, o: any) => categories.value[o?.dataPointIndex] ?? '' } },
  };
});

watch(
  () => props.artifact,
  () => {
    const s = props.artifact.chartSuggestion || {};
    chartType.value = s.type || 'bar';
    xKey.value = s.xKey || labelColumns.value[0]?.key || '';
    yKeys.value = (s.yKeys?.length ? s.yKeys : s.yKey ? [s.yKey] : numericColumns.value.slice(0, 1).map((c) => c.key)).filter((k) =>
      numericColumns.value.some((c) => c.key === k),
    );
    if (!yKeys.value.length && numericColumns.value[0]) yKeys.value = [numericColumns.value[0].key];
    topN.value = props.artifact.rows.length > 20 ? 20 : 0;
  },
);

if (!yKeys.value.length && numericColumns.value[0]) yKeys.value = [numericColumns.value[0].key];
</script>
