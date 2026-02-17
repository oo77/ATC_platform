import { _ as __nuxt_component_0 } from './server.mjs';
import { _ as __nuxt_component_1 } from './Button-D9CRGwzT.mjs';
import { defineComponent, ref, computed, mergeProps, withCtx, createBlock, createTextVNode, openBlock, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useAuthFetch } from './useAuthFetch-DSbqu-Nq.mjs';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "HoursStats",
  __ssrInlineRender: true,
  props: {
    instructorId: {},
    initialLoad: { type: Boolean }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const { authFetch } = useAuthFetch();
    const hoursStats = ref(null);
    const loading = ref(false);
    const error = ref(null);
    const selectedPeriod = ref("all");
    const loadHoursStats = async () => {
      if (!props.instructorId) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(
          `/api/instructors/${props.instructorId}/hours`
        );
        if (response.success) {
          hoursStats.value = response.stats;
        }
      } catch (err) {
        console.error("Error loading hours stats:", err);
        error.value = "Не удалось загрузить статистику часов";
      } finally {
        loading.value = false;
      }
    };
    const filteredMonths = computed(() => {
      if (!hoursStats.value) return [];
      const sorted = [...hoursStats.value.byMonth].reverse();
      if (selectedPeriod.value === "all") return sorted;
      const now = /* @__PURE__ */ new Date();
      const currentYear = now.getFullYear();
      if (selectedPeriod.value === "current_year") {
        return sorted.filter((m) => m.year === currentYear);
      }
      if (selectedPeriod.value === "last_12_months") {
        const oneYearAgo = /* @__PURE__ */ new Date();
        oneYearAgo.setMonth(now.getMonth() - 12);
        const minYM = oneYearAgo.toISOString().slice(0, 7);
        return sorted.filter((m) => m.yearMonth >= minYM);
      }
      return sorted;
    });
    const filteredSummary = computed(() => {
      const months = filteredMonths.value;
      const usedHours = months.reduce((acc, curr) => acc + curr.usedHours, 0);
      const scheduledHours = months.reduce(
        (acc, curr) => acc + curr.scheduledHours,
        0
      );
      return {
        usedHours: Number(usedHours.toFixed(1)),
        scheduledHours: Number(scheduledHours.toFixed(1))
      };
    });
    computed(() => {
      return {
        chart: {
          type: "bar",
          toolbar: { show: false },
          fontFamily: "Inter, sans-serif"
        },
        colors: ["#10B981", "#3C50E0"],
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: "55%",
            borderRadius: 4
          }
        },
        dataLabels: { enabled: false },
        stroke: { show: true, width: 2, colors: ["transparent"] },
        xaxis: {
          categories: filteredMonths.value.map((m) => `${m.monthName} ${m.year}`),
          axisBorder: { show: false },
          axisTicks: { show: false }
        },
        yaxis: { title: { text: "Часы" } },
        fill: { opacity: 1 },
        tooltip: {
          y: {
            formatter: (val) => val + " ч."
          }
        },
        legend: { position: "top", horizontalAlign: "left" },
        grid: { borderColor: "#e2e8f0", strokeDashArray: 4 }
      };
    });
    computed(() => {
      return [
        {
          name: "Отработано",
          data: filteredMonths.value.map((m) => m.usedHours)
        },
        {
          name: "Запланировано",
          data: filteredMonths.value.map((m) => m.scheduledHours)
        }
      ];
    });
    computed(() => {
      const stats = hoursStats.value;
      if (!stats) return {};
      return {
        chart: { type: "donut" },
        labels: ["Отработано", "Запланировано", "Осталось"],
        colors: ["#10B981", "#3C50E0", "#FBBF24"],
        legend: { position: "bottom" },
        plotOptions: {
          pie: {
            donut: {
              size: "70%",
              labels: {
                show: true,
                total: {
                  show: true,
                  label: "Лимит",
                  formatter: () => stats.maxHours + " ч."
                }
              }
            }
          }
        },
        dataLabels: { enabled: false }
      };
    });
    computed(() => {
      const stats = hoursStats.value;
      if (!stats) return [];
      const remaining = Math.max(0, stats.remainingHours);
      return [stats.totalUsedHours, stats.totalScheduledHours, remaining];
    });
    __expose({
      load: loadHoursStats,
      hasData: computed(() => !!hoursStats.value)
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_ClientOnly = __nuxt_component_0;
      const _component_UiButton = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6" }, _attrs))}><div class="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> Отчётность по часам </h3><div class="flex items-center gap-3 w-full sm:w-auto">`);
      if (hoursStats.value) {
        _push(`<select class="rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 w-full sm:w-auto"><option value="all"${ssrIncludeBooleanAttr(Array.isArray(selectedPeriod.value) ? ssrLooseContain(selectedPeriod.value, "all") : ssrLooseEqual(selectedPeriod.value, "all")) ? " selected" : ""}>За все время</option><option value="current_year"${ssrIncludeBooleanAttr(Array.isArray(selectedPeriod.value) ? ssrLooseContain(selectedPeriod.value, "current_year") : ssrLooseEqual(selectedPeriod.value, "current_year")) ? " selected" : ""}>Текущий год</option><option value="last_12_months"${ssrIncludeBooleanAttr(Array.isArray(selectedPeriod.value) ? ssrLooseContain(selectedPeriod.value, "last_12_months") : ssrLooseEqual(selectedPeriod.value, "last_12_months")) ? " selected" : ""}>Последние 12 мес.</option></select>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Обновить данные"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button></div></div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-20"><div class="flex flex-col items-center gap-3"><div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div><p class="text-sm text-gray-500">Загрузка статистики...</p></div></div>`);
      } else if (error.value) {
        _push(`<div class="text-center py-10"><div class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center"><svg class="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle><path d="M12 8v4m0 4h.01" stroke-width="2" stroke-linecap="round"></path></svg></div><p class="text-danger mb-3">${ssrInterpolate(error.value)}</p><button class="text-sm text-primary hover:underline hover:text-primary-dark"> Попробовать снова </button></div>`);
      } else if (hoursStats.value) {
        _push(`<div class="space-y-8"><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3 mb-2"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><svg class="h-5 w-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><span class="text-sm font-medium text-gray-500 dark:text-gray-400">Отработано</span></div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(filteredSummary.value.usedHours)} <span class="text-sm font-normal text-gray-500">ч.</span></p></div><div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3 mb-2"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><span class="text-sm font-medium text-gray-500 dark:text-gray-400">Запланировано</span></div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(filteredSummary.value.scheduledHours)} <span class="text-sm font-normal text-gray-500">ч.</span></p></div><div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3 mb-2"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><span class="text-sm font-medium text-gray-500 dark:text-gray-400">Осталось</span></div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(hoursStats.value.remainingHours)} <span class="text-sm font-normal text-gray-500">ч.</span></p><p class="text-xs text-gray-500 mt-1">от общего лимита</p></div><div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"><div class="flex items-center gap-3 mb-2"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700"><svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><span class="text-sm font-medium text-gray-500 dark:text-gray-400">Лимит</span></div><p class="text-2xl font-bold text-gray-900 dark:text-white">${ssrInterpolate(hoursStats.value.maxHours)} <span class="text-sm font-normal text-gray-500">ч.</span></p></div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> Динамика часов по месяцам </h4><div class="h-[300px]">`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</div></div><div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><h4 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white"> Использование лимита </h4><div class="h-[300px] flex items-center justify-center">`);
        _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
        _push(`</div></div></div><div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden"><div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h4 class="font-semibold text-gray-900 dark:text-white"> Детальная разбивка </h4></div>`);
        if (filteredMonths.value.length > 0) {
          _push(`<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="bg-gray-50 dark:bg-gray-700/50"><th class="py-3 px-6 text-left font-medium text-gray-600 dark:text-gray-400"> Месяц </th><th class="py-3 px-6 text-right font-medium text-gray-600 dark:text-gray-400"> Отработано </th><th class="py-3 px-6 text-right font-medium text-gray-600 dark:text-gray-400"> Запланировано </th><th class="py-3 px-6 text-right font-medium text-gray-600 dark:text-gray-400"> Всего занятий </th><th class="py-3 px-6 text-right font-medium text-gray-600 dark:text-gray-400"> Академ. часы </th></tr></thead><tbody class="divide-y divide-gray-200 dark:divide-gray-700"><!--[-->`);
          ssrRenderList(filteredMonths.value, (month) => {
            _push(`<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"><td class="py-4 px-6 font-medium text-gray-900 dark:text-white">${ssrInterpolate(month.monthName)} ${ssrInterpolate(month.year)}</td><td class="py-4 px-6 text-right"><span class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-success/10 text-success">${ssrInterpolate(month.usedHours)} ч. </span></td><td class="py-4 px-6 text-right"><span class="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">${ssrInterpolate(month.scheduledHours)} ч. </span></td><td class="py-4 px-6 text-right text-gray-600 dark:text-gray-400">${ssrInterpolate(month.eventCount)}</td><td class="py-4 px-6 text-right font-medium text-gray-900 dark:text-white">${ssrInterpolate((month.usedHours + month.scheduledHours).toFixed(1))}</td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        } else {
          _push(`<div class="p-8 text-center bg-gray-50 dark:bg-gray-800/50"><div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 mb-3"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div><p class="text-sm text-gray-500 dark:text-gray-400"> Нет данных за выбранный период </p></div>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<div class="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"><div class="h-16 w-16 rounded-full bg-primary/5 dark:bg-primary/20 flex items-center justify-center mb-4"><svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2"> Статистика часов не загружена </h4><p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm text-center"> Нажмите кнопку ниже, чтобы загрузить подробный отчет о часах, включая графики и разбивку по месяцам. </p>`);
        _push(ssrRenderComponent(_component_UiButton, {
          variant: "primary",
          onClick: loadHoursStats
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"${_scopeId}><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"${_scopeId}></path></svg> Загрузить статистику `);
            } else {
              return [
                (openBlock(), createBlock("svg", {
                  class: "w-4 h-4 mr-2",
                  fill: "none",
                  stroke: "currentColor",
                  viewBox: "0 0 24 24"
                }, [
                  createVNode("path", {
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    "stroke-width": "2",
                    d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  })
                ])),
                createTextVNode(" Загрузить статистику ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/instructors/HoursStats.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const InstructorsHoursStats = Object.assign(_sfc_main$1, { __name: "InstructorsHoursStats" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "CourseHistory",
  __ssrInlineRender: true,
  props: {
    instructorId: {},
    initialLoad: { type: Boolean }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const { authFetch } = useAuthFetch();
    const courseHistory = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const loadCourseHistory = async () => {
      if (!props.instructorId) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await authFetch(`/api/instructors/${props.instructorId}/course-history`);
        if (response.success) {
          courseHistory.value = response.history;
        }
      } catch (err) {
        console.error("Error loading course history:", err);
        error.value = "Не удалось загрузить историю курсов";
      } finally {
        loading.value = false;
      }
    };
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      return new Date(dateStr).toLocaleDateString("ru-RU");
    };
    const formatStatus = (status) => {
      const map = {
        active: "Активен",
        completed: "Завершен",
        upcoming: "Скоро",
        archived: "В архиве"
      };
      return map[status] || status;
    };
    __expose({
      load: loadCourseHistory,
      hasData: computed(() => courseHistory.value.length > 0)
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6" }, _attrs))}><div class="flex items-center justify-between mb-4"><h3 class="text-xl font-semibold text-gray-900 dark:text-white"> История курсов </h3>`);
      if (courseHistory.value.length === 0 && !loading.value && !error.value) {
        _push(`<button class="text-sm text-primary hover:underline"> Загрузить историю </button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="flex justify-center items-center py-8"><div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>`);
      } else if (error.value) {
        _push(`<div class="text-center py-6"><p class="text-danger mb-3">${ssrInterpolate(error.value)}</p><button class="text-sm text-primary hover:underline"> Попробовать снова </button></div>`);
      } else if (courseHistory.value && courseHistory.value.length > 0) {
        _push(`<div><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 dark:border-gray-700"><th class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"> Курс </th><th class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"> Группа </th><th class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"> Период </th><th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400"> Отработано </th><th class="py-2 px-3 text-center font-medium text-gray-600 dark:text-gray-400"> Статус </th></tr></thead><tbody><!--[-->`);
        ssrRenderList(courseHistory.value, (course) => {
          _push(`<tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"><td class="py-2 px-3 font-medium text-gray-900 dark:text-white">${ssrInterpolate(course.name)}</td><td class="py-2 px-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(course.groupName)}</td><td class="py-2 px-3 text-gray-600 dark:text-gray-400">${ssrInterpolate(formatDate(course.startDate))} - ${ssrInterpolate(formatDate(course.endDate))}</td><td class="py-2 px-3 text-right"><span class="font-medium">${ssrInterpolate(course.hoursWorked)} ч.</span></td><td class="py-2 px-3 text-center"><span class="${ssrRenderClass([{
            "bg-success/10 text-success": course.status === "completed",
            "bg-primary/10 text-primary": course.status === "active",
            "bg-warning/10 text-warning": course.status === "upcoming"
          }, "inline-flex rounded-full px-2 py-1 text-xs font-semibold"])}">${ssrInterpolate(formatStatus(course.status))}</span></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div></div>`);
      } else {
        _push(`<div class="text-center py-8"><div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><p class="text-gray-600 dark:text-gray-400 mb-3"> История курсов пуста или не загружена </p><button class="inline-flex items-center justify-center rounded bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"> Загрузить историю </button></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/instructors/CourseHistory.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const InstructorsCourseHistory = Object.assign(_sfc_main, { __name: "InstructorsCourseHistory" });

export { InstructorsHoursStats as I, InstructorsCourseHistory as a };
//# sourceMappingURL=CourseHistory-C2KH9Ed5.mjs.map
