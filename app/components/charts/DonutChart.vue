<template>
  <div class="max-w-full overflow-x-auto custom-scrollbar">
    <div :id="chartId" class="min-w-[300px]">
      <ClientOnly>
        <VueApexCharts
          v-if="mounted"
          type="donut"
          :height="height"
          :options="chartOptions"
          :series="chartSeries"
        />
        <template #fallback>
          <div
            class="flex justify-center items-center"
            :style="{ height: height + 'px' }"
          >
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
            ></div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import VueApexCharts from "vue3-apexcharts";

const props = defineProps({
  chartId: {
    type: String,
    default: "donut-chart",
  },
  title: {
    type: String,
    default: "",
  },
  series: {
    type: Array,
    default: () => [],
  },
  labels: {
    type: Array,
    default: () => [],
  },
  colors: {
    type: Array,
    default: () => [
      "#465FFF",
      "#9CB9FF",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
    ],
  },
  height: {
    type: [Number, String],
    default: 350,
  },
  showLegend: {
    type: Boolean,
    default: true,
  },
  legendPosition: {
    type: String,
    default: "bottom",
  },
});

const emit = defineEmits(["click"]);

const mounted = ref(false);

const chartSeries = computed(() => {
  return props.series.map((s) => Number(s) || 0);
});

const chartOptions = computed(() => ({
  chart: {
    fontFamily: "Inter, system-ui, sans-serif",
    type: "donut",
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 1200,
      animateGradually: {
        enabled: true,
        delay: 150,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 450,
      },
    },
    events: {
      dataPointSelection: (event, chartContext, config) => {
        emit("click", {
          seriesIndex: config.seriesIndex,
          dataPointIndex: config.dataPointIndex,
          label: props.labels[config.dataPointIndex],
          value: props.series[config.dataPointIndex],
        });
      },
      dataPointMouseEnter: function (event) {
        if (event && event.target) {
          event.target.style.cursor = "pointer";
        }
      },
    },
  },
  colors: props.colors.slice(0, props.series.length),
  labels: props.labels,
  legend: {
    show: props.showLegend,
    position: props.legendPosition,
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    labels: {
      colors: "#6B7280",
      useSeriesColors: false,
    },
    markers: {
      width: 12,
      height: 12,
      radius: 12,
      offsetX: -2,
    },
    itemMargin: {
      horizontal: 12,
      vertical: 6,
    },
    onItemClick: {
      toggleDataSeries: true,
    },
    onItemHover: {
      highlightDataSeries: true,
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: "65%",
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: "14px",
            fontWeight: 600,
            offsetY: -5,
          },
          value: {
            show: true,
            fontSize: "20px",
            fontWeight: 700,
            formatter: function (val) {
              return val;
            },
          },
          total: {
            show: true,
            showAlways: true,
            label: "Всего",
            fontSize: "14px",
            fontWeight: 600,
            color: "#6b7280",
            formatter: function (w) {
              if (w && w.globals && w.globals.seriesTotals) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              }
              return 0;
            },
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ["transparent"],
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (val, opts) {
        const w = opts ? opts.w : undefined;
        if (w && w.globals && w.globals.seriesTotals) {
          const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
          const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
          return `${val} (${percent}%)`;
        }
        return val;
      },
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        chart: {
          height: 280,
        },
        legend: {
          position: "bottom",
        },
      },
    },
  ],
}));

onMounted(() => {
  mounted.value = true;
});
</script>
