<template>
  <div class="mx-auto max-w-screen-2xl space-y-4 pb-8">
    <!-- HERO БАННЕР - компактный -->
    <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 px-5 py-4 text-white">
      <div class="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
      <div class="relative z-10 flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Обзор платформы</h1>
          <p class="text-sm text-indigo-100">{{ user?.name || "Администратор" }} • {{ shortDate }}</p>
        </div>
        <NuxtLink to="/settings" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
          <IconsSettingsIcon class="w-5 h-5" />
        </NuxtLink>
      </div>
    </div>

    <!-- МЕТРИКИ - компактные карточки в строку -->
    <div class="grid grid-cols-4 gap-3">
      <div class="rounded-xl bg-white border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/certificates')">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <IconsUserGroupIcon class="w-4 h-4 text-white" />
          </div>
          <span class="text-xs text-slate-500 font-medium">Обучено</span>
        </div>
        <p class="text-2xl font-bold text-slate-800">{{ stats?.totalTrained || 0 }}</p>
      </div>

      <div class="rounded-xl bg-white border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/users?tab=instructors')">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <IconsInstructorIcon class="w-4 h-4 text-white" />
          </div>
          <span class="text-xs text-slate-500 font-medium">Инструкторы</span>
        </div>
        <p class="text-2xl font-bold text-slate-800">{{ stats?.totalInstructors || 0 }}</p>
      </div>

      <div class="rounded-xl bg-white border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/groups')">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <IconsUserGroupIcon class="w-4 h-4 text-white" />
          </div>
          <span class="text-xs text-slate-500 font-medium">Группы</span>
        </div>
        <p class="text-2xl font-bold text-slate-800">{{ stats?.activeGroups || 0 }}</p>
      </div>

      <div class="rounded-xl bg-white border border-slate-200 p-3 cursor-pointer hover:shadow-md transition-shadow" @click="navigateTo('/certificates')">
        <div class="flex items-center gap-2 mb-2">
          <div class="h-8 w-8 rounded-lg bg-fuchsia-500 flex items-center justify-center">
            <IconsCertificateIcon class="w-4 h-4 text-white" />
          </div>
          <span class="text-xs text-slate-500 font-medium">Сертификаты</span>
        </div>
        <p class="text-2xl font-bold text-slate-800">{{ stats?.certificatesThisMonth || 0 }}</p>
      </div>
    </div>

    <!-- ЧАРТЫ - два в ряд -->
    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
          <div class="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <IconsPieChartIcon class="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <h3 class="text-sm font-semibold text-slate-800">Обученные по организациям</h3>
        </div>
        <div class="p-3" style="height: 200px;">
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
          </div>
          <div v-else-if="!trainedByOrganizationData.series.length" class="flex items-center justify-center h-full text-slate-400 text-sm">Нет данных</div>
          <ClientOnly v-else>
            <PolarArea :data="trainedChartJsData" :options="polarOptions" />
          </ClientOnly>
        </div>
      </div>

      <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <IconsBarChartIcon class="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <h3 class="text-sm font-semibold text-slate-800">Динамика сертификации</h3>
          </div>
          <div class="flex gap-1">
            <button v-for="period in certificatePeriods" :key="period.value" class="px-2 py-0.5 text-xs rounded transition-all" :class="certificatePeriod === period.value ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'" @click="changeCertificatePeriod(period.value)">{{ period.label }}</button>
          </div>
        </div>
        <div class="p-3" style="height: 200px;">
          <div v-if="loading" class="flex items-center justify-center h-full">
            <div class="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500"></div>
          </div>
          <div v-else-if="!currentCertificatesData.series[0]?.data?.length" class="flex items-center justify-center h-full text-slate-400 text-sm">Нет данных</div>
          <ClientOnly v-else>
            <LineChart :key="certificatePeriod" :data="certificatesChartJsData" :options="lineOptions" />
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- ТОПЫ - accordion блоки -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Топ Инструкторов -->
      <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <button class="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors" @click="instructorsExpanded = !instructorsExpanded">
          <div class="flex items-center gap-2">
            <div class="h-7 w-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <IconsInstructorIcon class="w-3.5 h-3.5 text-orange-500" />
            </div>
            <h3 class="text-sm font-semibold text-slate-800">Топ инструкторов</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-400">{{ stats?.topInstructors?.length || 0 }}</span>
            <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': instructorsExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div v-show="instructorsExpanded" class="border-t border-slate-100 max-h-[220px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-4">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500"></div>
          </div>
          <div v-else-if="!stats?.topInstructors?.length" class="py-4 text-center text-slate-400 text-sm">Нет данных</div>
          <div v-else class="p-2 space-y-1">
            <div v-for="(instructor, index) in stats.topInstructors" :key="instructor.id" class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div class="flex items-center gap-2">
                <div class="h-7 w-7 rounded-lg font-bold text-white text-xs flex items-center justify-center" :class="getRankBg(index)">{{ getInitials(instructor.name) }}</div>
                <span class="text-sm text-slate-700 truncate max-w-[120px]">{{ instructor.name }}</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{ instructor.hours }}ч</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Популярные курсы -->
      <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <button class="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors" @click="coursesExpanded = !coursesExpanded">
          <div class="flex items-center gap-2">
            <div class="h-7 w-7 rounded-lg bg-cyan-50 flex items-center justify-center">
              <IconsAcademicCapIcon class="w-3.5 h-3.5 text-cyan-500" />
            </div>
            <h3 class="text-sm font-semibold text-slate-800">Популярные курсы</h3>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex bg-slate-100 rounded p-0.5">
              <button class="px-1.5 py-0.5 text-[10px] rounded transition-all" :class="courseTab === 'groups' ? 'bg-cyan-500 text-white' : 'text-slate-500'" @click.stop="courseTab = 'groups'">Гр</button>
              <button class="px-1.5 py-0.5 text-[10px] rounded transition-all" :class="courseTab === 'students' ? 'bg-cyan-500 text-white' : 'text-slate-500'" @click.stop="courseTab = 'students'">Об</button>
            </div>
            <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': coursesExpanded }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        <div v-show="coursesExpanded" class="border-t border-slate-100 max-h-[220px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-4">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500"></div>
          </div>
          <div v-else-if="!currentTopCourses?.length" class="py-4 text-center text-slate-400 text-sm">Нет данных</div>
          <div v-else class="p-2 space-y-1">
            <div v-for="(course, index) in currentTopCourses" :key="course.id" class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors" @click="navigateTo(`/programs/${course.id}`)">
              <div class="flex items-center gap-2">
                <span class="h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center" :class="index < 3 ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-500'">#{{ index + 1 }}</span>
                <span class="text-sm text-slate-700 truncate max-w-[120px]">{{ course.name }}</span>
              </div>
              <span class="text-sm font-bold text-slate-800">{{ courseTab === "groups" ? course.groups_count : course.students_count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- СИСТЕМА И СОБЫТИЯ -->
    <div class="grid grid-cols-3 gap-4">
      <!-- Состояние системы - компактно в ряд -->
      <div class="col-span-2 rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
          <div class="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <IconsBarChartIcon class="w-3.5 h-3.5 text-white" />
          </div>
          <h3 class="text-sm font-semibold text-slate-800">Состояние системы</h3>
        </div>
        <div class="p-3">
          <div v-if="loading" class="flex justify-center py-3">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"></div>
          </div>
          <div v-else class="grid grid-cols-3 gap-3">
            <div class="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <div class="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                <IconsPlusIcon class="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p class="text-xl font-bold text-slate-800">{{ stats?.todayRegistrations || 0 }}</p>
                <p class="text-[10px] text-emerald-600">Новые</p>
              </div>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
              <div class="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                <IconsGridIcon class="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p class="text-xl font-bold text-slate-800">{{ stats?.activeSessions || 0 }}</p>
                <p class="text-[10px] text-amber-600">Онлайн</p>
              </div>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-lg bg-sky-50 border border-sky-100 cursor-pointer" @click="navigateTo('/activity-logs')">
              <div class="h-9 w-9 rounded-full bg-white flex items-center justify-center">
                <IconsListIcon class="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <p class="text-xl font-bold text-slate-800">{{ stats?.todayLogs || 0 }}</p>
                <p class="text-[10px] text-sky-600">События</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Последние события -->
      <div class="rounded-xl bg-white border border-slate-200 overflow-hidden">
        <div class="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div class="flex items-center gap-2">
            <div class="h-7 w-7 rounded-lg bg-pink-600 flex items-center justify-center">
              <IconsBellIcon class="w-3.5 h-3.5 text-white" />
            </div>
            <h3 class="text-sm font-semibold text-slate-800">События</h3>
          </div>
        </div>
        <div class="p-2 max-h-[150px] overflow-y-auto">
          <div v-if="loading" class="flex justify-center py-3">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-pink-600"></div>
          </div>
          <div v-else-if="!stats?.recentActivities?.length" class="py-4 text-center text-slate-400 text-xs">Нет событий</div>
          <div v-else class="space-y-1">
            <div v-for="activity in stats.recentActivities.slice(0, 5)" :key="activity.id" class="flex items-start gap-2 p-1.5 rounded hover:bg-slate-50">
              <div class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" :class="getActivityDotColor(activity.action)"></div>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium text-slate-700 truncate">{{ activity.user_name }}</p>
                <p class="text-[10px] text-slate-400 truncate">{{ activity.action }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 py-1.5 border-t border-slate-100 text-center">
          <NuxtLink to="/activity-logs" class="text-[10px] text-pink-600 hover:text-pink-700">Все →</NuxtLink>
        </div>
      </div>
    </div>

    <!-- БЫСТРЫЕ ДЕЙСТВИЯ - компактная линейка -->
    <div class="rounded-xl bg-white border border-slate-200 p-3">
      <div class="flex items-center gap-2 mb-2">
        <IconsPlugInIcon class="w-4 h-4 text-indigo-600" />
        <h3 class="text-sm font-semibold text-slate-800">Быстрые действия</h3>
      </div>
      <div class="grid grid-cols-4 gap-2">
        <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to" class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
          <div class="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <IconsUserGroupIcon v-if="action.icon === 'usergroup'" class="w-4 h-4" />
            <IconsAcademicCapIcon v-else-if="action.icon === 'academic'" class="w-4 h-4" />
            <IconsCertificateIcon v-else-if="action.icon === 'certificate'" class="w-4 h-4" />
            <IconsListIcon v-else-if="action.icon === 'list'" class="w-4 h-4" />
            <IconsSettingsIcon v-else class="w-4 h-4" />
          </div>
          <div>
            <span class="block text-xs font-semibold text-slate-700">{{ action.label }}</span>
            <span class="text-[10px] text-slate-400">{{ action.desc }}</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { PolarArea, Line as LineChart } from "vue-chartjs";
import { Chart as ChartJS, RadialLinearScale, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";

ChartJS.register(RadialLinearScale, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);
ChartJS.defaults.font.family = "'Montserrat', 'Roboto', 'Inter', system-ui, sans-serif";
ChartJS.defaults.color = "#64748b";

const { user } = useAuth();
const { authFetch } = useAuthFetch();
const router = useRouter();

const stats = ref(null);
const loading = ref(true);
const courseTab = ref("groups");
const instructorsExpanded = ref(true);
const coursesExpanded = ref(true);

const shortDate = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

const quickActions = [
  { to: "/users", label: "Пользователи", desc: "Управление", icon: "usergroup" },
  { to: "/programs/create", label: "Новый курс", desc: "Создание", icon: "academic" },
  { to: "/certificates", label: "Сертификаты", desc: "Документы", icon: "certificate" },
  { to: "/activity-logs", label: "Журнал", desc: "Аудит", icon: "list" },
];

const certificatePeriod = ref("months");
const certificateTransitioning = ref(false);
const certificatePeriods = [
  { value: "months", label: "Месяцы" },
  { value: "quarters", label: "Кварталы" },
  { value: "years", label: "Годы" },
];

const changeCertificatePeriod = (period) => {
  if (certificatePeriod.value === period) return;
  certificateTransitioning.value = true;
  setTimeout(() => {
    certificatePeriod.value = period;
    setTimeout(() => { certificateTransitioning.value = false; }, 100);
  }, 250);
};

const trainedByOrganizationData = computed(() => {
  const orgs = stats.value?.trainedByOrganization || [];
  return {
    series: orgs.map((o) => Number(o.count) || 0),
    labels: orgs.map((o) => o.name || "Не указано"),
  };
});

const trainedChartJsData = computed(() => ({
  labels: trainedByOrganizationData.value.labels,
  datasets: [{
    data: trainedByOrganizationData.value.series,
    backgroundColor: ["rgba(79, 70, 229, 0.7)", "rgba(6, 182, 212, 0.7)", "rgba(16, 185, 129, 0.7)", "rgba(245, 158, 11, 0.7)", "rgba(236, 72, 153, 0.7)", "rgba(139, 92, 246, 0.7)"],
    borderWidth: 2,
    borderColor: "#ffffff",
  }],
}));

const polarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right", labels: { usePointStyle: true, padding: 10, font: { size: 10 } } }, tooltip: { mode: "index", intersect: false } },
  scales: { r: { ticks: { display: false } } },
};

const certificatesChartData = computed(() => {
  const certs = stats.value?.certificatesByMonth || [];
  const monthNames = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  return {
    series: [{ name: "Сертификаты", data: certs.map((c) => Number(c.count) || 0) }],
    categories: certs.map((c) => { const [year, month] = c.month.split("-"); return monthNames[parseInt(month) - 1] + " " + year.slice(2); }),
    rawData: certs,
  };
});

const certificatesByQuarters = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const quarterMap = new Map();
  rawData.forEach((item) => {
    const [year, month] = item.month.split("-");
    const quarter = Math.ceil(parseInt(month) / 3);
    const key = `${year}-Q${quarter}`;
    if (!quarterMap.has(key)) quarterMap.set(key, { count: 0, year, quarter });
    quarterMap.get(key).count += Number(item.count) || 0;
  });
  const sorted = Array.from(quarterMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, data]) => ({ label: `Q${data.quarter}`, count: data.count }));
  return { series: [{ name: "Сертификаты", data: sorted.map((q) => q.count) }], categories: sorted.map((q) => q.label) };
});

const certificatesByYears = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const yearMap = new Map();
  rawData.forEach((item) => {
    const [year] = item.month.split("-");
    if (!yearMap.has(year)) yearMap.set(year, 0);
    yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
  });
  const sorted = Array.from(yearMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count }));
  return { series: [{ name: "Сертификаты", data: sorted.map((y) => y.count) }], categories: sorted.map((y) => y.year) };
});

const currentCertificatesData = computed(() => {
  switch (certificatePeriod.value) {
    case "quarters": return certificatesByQuarters.value;
    case "years": return certificatesByYears.value;
    default: return certificatesChartData.value;
  }
});

const certificatesChartJsData = computed(() => {
  const dataRef = currentCertificatesData.value;
  return {
    labels: dataRef.categories,
    datasets: [{
      data: dataRef.series[0].data,
      borderColor: "rgba(16, 185, 129, 1)",
      backgroundColor: "rgba(16, 185, 129, 0.1)",
      borderWidth: 2,
      pointBackgroundColor: "rgba(16, 185, 129, 1)",
      fill: true,
      tension: 0.4,
    }],
  };
});

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, backgroundColor: "rgba(15, 23, 42, 0.9)", padding: 8, callbacks: { label: (context) => `${context.parsed.y} шт.` } } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: "rgba(200, 200, 200, 0.2)" }, beginAtZero: true } },
};

const currentTopCourses = computed(() => {
  if (courseTab.value === "groups") return stats.value?.topCoursesByGroups || [];
  return stats.value?.topCoursesByStudents || [];
});

const navigateTo = (path) => router.push(path);

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch("/api/admin/dashboard");
    if (data) stats.value = data;
  } catch (error) {
    console.error("Failed to fetch admin dashboard stats:", error);
  } finally {
    loading.value = false;
  }
};

const getActivityDotColor = (action) => {
  const lower = action.toLowerCase();
  if (lower.includes("создал") || lower.includes("добавил")) return "bg-emerald-500";
  if (lower.includes("удалил")) return "bg-red-500";
  if (lower.includes("изменил") || lower.includes("обновил")) return "bg-amber-500";
  return "bg-indigo-500";
};

const getRankBg = (index) => {
  if (index === 0) return "bg-gradient-to-br from-amber-400 to-orange-500";
  if (index === 1) return "bg-slate-300";
  if (index === 2) return "bg-orange-300";
  return "bg-slate-200";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

onMounted(() => fetchDashboardStats());
</script>

<style scoped>
.max-h-\[150px\] { max-height: 150px; }
.max-h-\[220px\] { max-height: 220px; }
</style>