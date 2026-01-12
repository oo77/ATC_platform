<template>
  <div class="max-w-full overflow-x-auto custom-scrollbar">
    <div :id="chartId" class="-ml-5 min-w-[500px] xl:min-w-full pl-2">
      <ClientOnly>
        <VueApexCharts
          v-if="mounted"
          type="bar"
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
    default: "dynamic-bar-chart",
  },
  title: {
    type: String,
    default: "",
  },
  series: {
    type: Array,
    default: () => [{ name: "Data", data: [] }],
  },
  categories: {
    type: Array,
    default: () => [],
  },
  colors: {
    type: Array,
    default: () => ["#465FFF", "#10B981", "#F59E0B"],
  },
  height: {
    type: [Number, String],
    default: 280,
  },
  horizontal: {
    type: Boolean,
    default: false,
  },
  showLegend: {
    type: Boolean,
    default: false,
  },
  showDataLabels: {
    type: Boolean,
    default: false,
  },
  yAxisTitle: {
    type: String,
    default: "",
  },
  columnWidth: {
    type: String,
    default: "50%",
  },
  borderRadius: {
    type: Number,
    default: 5,
  },
  formatTooltip: {
    type: Function,
    default: null,
  },
  animationSpeed: {
    type: Number,
    default: 1000,
  },
});

const emit = defineEmits(["click"]);

const mounted = ref(false);

const chartSeries = computed(() => {
  return props.series.map((s) => ({
    name: s.name || "Данные",
    data: (s.data || []).map((d) => Number(d) || 0),
  }));
});

const chartOptions = computed(() => ({
  colors: props.colors,
  chart: {
    fontFamily: "Inter, system-ui, sans-serif",
    type: "bar",
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: props.animationSpeed,
      animateGradually: {
        enabled: true,
        delay: 100,
      },
      dynamicAnimation: {
        enabled: true,
        speed: 400,
      },
    },
    events: {
      dataPointSelection: (event, chartContext, config) => {
        emit("click", {
          seriesIndex: config.seriesIndex,
          dataPointIndex: config.dataPointIndex,
          category: props.categories[config.dataPointIndex],
          value:
            config.w.globals.series[config.seriesIndex][config.dataPointIndex],
        });
      },
      dataPointMouseEnter: function (event) {
        if (event && event.target) {
          event.target.style.cursor = "pointer";
        }
      },
    },
  },
  plotOptions: {
    bar: {
      horizontal: props.horizontal,
      columnWidth: props.columnWidth,
      borderRadius: props.borderRadius,
      borderRadiusApplication: "end",
      distributed: props.series.length === 1 && props.colors.length > 1,
      dataLabels: {
        position: "top",
      },
    },
  },
  dataLabels: {
    enabled: props.showDataLabels,
    offsetY: -20,
    style: {
      fontSize: "12px",
      fontWeight: 600,
      colors: ["#6B7280"],
    },
  },
  stroke: {
    show: true,
    width: 4,
    colors: ["transparent"],
  },
  xaxis: {
    categories: props.categories,
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      style: {
        fontSize: "13px",
        fontWeight: 500,
        colors: "#6B7280",
        fontFamily: "Inter, system-ui, sans-serif",
      },
      rotate: props.horizontal ? 0 : -45,
      rotateAlways: false,
      trim: false,
    },
  },
  legend: {
    show: props.showLegend,
    position: "top",
    horizontalAlign: "left",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    markers: {
      radius: 12,
    },
  },
  yaxis: {
    title: {
      text: props.yAxisTitle,
      style: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#6B7280",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    labels: {
      formatter: function (val) {
        return Math.round(val);
      },
      style: {
        fontSize: "13px",
        fontWeight: 500,
        colors: "#6B7280",
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
  },
  grid: {
    yaxis: {
      lines: {
        show: true,
      },
    },
    xaxis: {
      lines: {
        show: false,
      },
    },
    borderColor: "#E5E7EB",
    strokeDashArray: 4,
  },
  fill: {
    opacity: 1,
    type: "gradient",
    gradient: {
      shade: "light",
      type: "vertical",
      shadeIntensity: 0.25,
      gradientToColors: undefined,
      inverseColors: false,
      opacityFrom: 0.95,
      opacityTo: 0.75,
      stops: [0, 100],
    },
  },
  tooltip: {
    enabled: true,
    shared: true,
    intersect: false,
    theme: "light",
    style: {
      fontSize: "13px",
      fontFamily: "Inter, system-ui, sans-serif",
    },
    x: {
      show: true,
      formatter: function (val) {
        return val;
      },
    },
    y: {
      formatter:
        props.formatTooltip ||
        function (val) {
          return val.toString();
        },
    },
    marker: {
      show: true,
    },
  },
  states: {
    hover: {
      filter: {
        type: "lighten",
        value: 0.1,
      },
    },
    active: {
      allowMultipleDataPointsSelection: false,
      filter: {
        type: "darken",
        value: 0.1,
      },
    },
  },
  responsive: [
    {
      breakpoint: 640,
      options: {
        chart: {
          height: 250,
        },
        xaxis: {
          labels: {
            rotate: -90,
            style: {
              fontSize: "11px",
            },
          },
        },
      },
    },
  ],
}));

// Следим за изменениями данных для плавной анимации
watch(
  () => props.series,
  (newVal, oldVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      // Данные изменились, ApexCharts автоматически анимирует переход
    }
  },
  { deep: true }
);

onMounted(() => {
  mounted.value = true;
});
</script>

<style scoped>
/* Плавная анимация появления */
.apexcharts-canvas {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
