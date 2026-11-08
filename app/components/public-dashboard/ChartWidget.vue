<template>
  <div ref="box" class="relative h-full min-h-0 w-full">
    <div v-if="isEmpty" class="pd-muted flex h-full items-center justify-center text-sm">Нет данных за период</div>
    <ClientOnly v-else>
      <VueApexCharts
        v-if="height > 40"
        :key="chartKey"
        :type="apexType"
        :height="height"
        width="100%"
        :options="options"
        :series="apexSeries"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import VueApexCharts from "vue3-apexcharts";

const props = defineProps<{
  data: {
    chart: "series" | "pie" | "hbar";
    labels: string[];
    series: { name: string; data: number[] }[];
    suffix?: string;
  };
  /** bar | line | area | donut | pie */
  styleHint?: string;
  dark: boolean;
  accent: string;
}>();

const box = ref<HTMLElement | null>(null);
const height = ref(0);
const width = ref(0);
let ro: ResizeObserver | null = null;

onMounted(() => {
  if (!box.value) return;
  height.value = box.value.clientHeight;
  width.value = box.value.clientWidth;
  ro = new ResizeObserver((entries) => {
    const r = entries[0]?.contentRect;
    const h = Math.floor(r?.height ?? 0);
    if (Math.abs(h - height.value) > 2) height.value = h;
    width.value = Math.floor(r?.width ?? 0);
  });
  ro.observe(box.value);
});
onBeforeUnmount(() => ro?.disconnect());

const PALETTE_TAIL = ["#10B981", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899", "#84CC16", "#F97316", "#64748B", "#EF4444"];
const palette = computed(() => [props.accent, ...PALETTE_TAIL.filter((c) => c.toLowerCase() !== props.accent.toLowerCase())]);

const apexType = computed(() => {
  if (props.data.chart === "pie") return props.styleHint === "pie" ? "pie" : "donut";
  if (props.data.chart === "hbar") return "bar";
  const s = props.styleHint;
  return s === "line" ? "line" : s === "area" ? "area" : "bar";
});

const isEmpty = computed(() => {
  const all = props.data.series.flatMap((s) => s.data);
  return !all.length || all.every((v) => !v);
});

const apexSeries = computed(() =>
  props.data.chart === "pie" ? props.data.series[0]?.data ?? [] : props.data.series,
);

// Перерисовка при смене типа/темы (Apex не всегда корректно меняет тип на лету)
// Узкий виджет: легенда под диаграммой, а не справа
const legendBottom = computed(() => width.value > 0 && width.value < 460);
const chartKey = computed(() => `${apexType.value}-${props.dark}-${props.accent}-${legendBottom.value}`);

const fmt = (v: number | null) => v == null ? "—" : `${Number(v).toLocaleString("ru-RU")}${props.data.suffix ?? ""}`;

const options = computed(() => {
  const fore = props.dark ? "#94A3B8" : "#64748B";
  const grid = props.dark ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.15)";
  const base: any = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      background: "transparent",
      foreColor: fore,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 500 },
      parentHeightOffset: 0,
    },
    theme: { mode: props.dark ? "dark" : "light" },
    colors: palette.value,
    dataLabels: { enabled: false },
    tooltip: { theme: props.dark ? "dark" : "light", y: { formatter: fmt } },
    grid: { borderColor: grid, strokeDashArray: 4, padding: { left: 4, right: 8, top: -10, bottom: 0 } },
    legend: { show: false },
    labels: props.data.labels,
  };

  if (props.data.chart === "pie") {
    return {
      ...base,
      stroke: { width: props.dark ? 0 : 2, colors: [props.dark ? "#0f172a" : "#fff"] },
      legend: {
        show: true,
        position: legendBottom.value ? "bottom" : "right",
        fontSize: "12px",
        labels: { colors: props.dark ? "#CBD5E1" : "#334155" },
        markers: { size: 6 },
        formatter: (name: string, o: any) => {
          const short = name.length > 28 ? `${name.slice(0, 27)}…` : name;
          return `${short}  <b>${fmt(o.w.globals.series[o.seriesIndex])}</b>`;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              value: { color: props.dark ? "#F8FAFC" : "#0F172A", fontSize: "22px", fontWeight: 600, formatter: (v: any) => fmt(Number(v)) },
              total: {
                show: true,
                label: "Всего",
                color: fore,
                formatter: (w: any) => fmt(w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)),
              },
            },
          },
        },
      },
    };
  }

  if (props.data.chart === "hbar") {
    return {
      ...base,
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "62%", distributed: true } },
      dataLabels: {
        enabled: true,
        formatter: fmt,
        style: { fontSize: "11px", fontWeight: 600, colors: ["#fff"] },
      },
      xaxis: { categories: props.data.labels, labels: { formatter: (v: any) => Number(v).toLocaleString("ru-RU") } },
      yaxis: {
        labels: {
          maxWidth: 180,
          style: { fontSize: "12px" },
          formatter: (v: any) => (typeof v === "string" && v.length > 30 ? `${v.slice(0, 29)}…` : v),
        },
      },
      grid: { ...base.grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
    };
  }

  const isBar = apexType.value === "bar";
  return {
    ...base,
    stroke: { curve: "smooth", width: isBar ? 0 : 3 },
    fill:
      apexType.value === "area"
        ? { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.02, stops: [0, 95] } }
        : { opacity: 1 },
    markers: { size: apexType.value === "line" ? 4 : 0, strokeWidth: 0, hover: { size: 6 } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    xaxis: {
      categories: props.data.labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true, style: { fontSize: "11px" } },
    },
    yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v: number) => `${Math.round(v).toLocaleString("ru-RU")}${props.data.suffix ?? ""}` } },
  };
});
</script>
