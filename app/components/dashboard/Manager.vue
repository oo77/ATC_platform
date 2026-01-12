<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добрый день, {{ user?.name || 'Менеджер' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
          <span v-if="stats?.activeGroups > 0">
            • В работе {{ stats.activeGroups }} групп(ы)
          </span>
        </p>
      </div>
      <NuxtLink to="/groups">
        <UiButton class="flex items-center gap-2">
          <IconsUserGroupIcon class="w-5 h-5" />
          Все группы
        </UiButton>
      </NuxtLink>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/groups')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconsUserGroupIcon class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активные группы</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.activeGroups || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/groups')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <IconsUserCircleIcon class="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Студенты на курсах</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.studentsOnCourses || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/schedule')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <IconsClipboardCheckIcon class="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Тесты сегодня</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.testsToday || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/certificates')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <IconsCertificateIcon class="w-6 h-6 text-info" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">К выдаче сертификатов</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.certificatesPending || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Чарты: Студенты по курсам и Сертификаты -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
      <!-- Распределение студентов по курсам (Круговая диаграмма) -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsPieChartIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Студенты по курсам</h3>
          </div>
          <NuxtLink to="/groups" class="text-sm text-primary hover:underline">
            Все курсы
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!coursesChartData.series.length" class="flex flex-col items-center justify-center py-16 text-center">
            <IconsUserGroupIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных о студентах</p>
          </div>
          <ChartsDonutChart 
            v-else
            chart-id="students-by-course"
            :series="coursesChartData.series"
            :labels="coursesChartData.labels"
            :height="350"
            legend-position="bottom"
            @click="handleCourseChartClick"
          />
        </div>
      </div>

      <!-- Сертификаты по месяцам (Bar Chart) -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <IconsBarChartIcon class="w-5 h-5 text-success" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Сертификаты</h3>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button 
                v-for="period in certificatePeriods"
                :key="period.value"
                class="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300"
                :class="certificatePeriod === period.value 
                  ? 'bg-success text-white shadow-md transform scale-105' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                @click="changeCertificatePeriod(period.value)"
              >
                {{ period.label }}
              </button>
            </div>
            <NuxtLink to="/certificates" class="text-sm text-primary hover:underline whitespace-nowrap">
              Все сертификаты
            </NuxtLink>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!currentCertificatesData.series[0]?.data?.length" class="flex flex-col items-center justify-center py-16 text-center">
            <IconsCertificateIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных о сертификатах</p>
          </div>
          <div v-else class="transition-opacity duration-500" :class="certificateTransitioning ? 'opacity-50' : 'opacity-100'">
            <ChartsDynamicBarChart 
              :key="certificatePeriod"
              chart-id="certificates-chart-manager"
              :series="currentCertificatesData.series"
              :categories="currentCertificatesData.categories"
              :colors="['#10B981']"
              :height="320"
              y-axis-title="Количество"
              :animation-speed="800"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Топ курсов и Группы в работе -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
      
      <!-- Популярные курсы -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <IconsAcademicCapIcon class="w-5 h-5 text-info" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Популярные курсы</h3>
          </div>
          <NuxtLink to="/groups" class="text-sm text-primary hover:underline">
            Все курсы
          </NuxtLink>
        </div>
        <div class="p-6">
           <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.topCourses?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <IconsAcademicCapIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных о курсах</p>
          </div>
          <div v-else class="space-y-4">
             <div 
              v-for="(course, index) in stats.topCourses" 
              :key="course.id"
              class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              @click="navigateTo(`/groups?course=${course.id}`)"
            >
              <span 
                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                :class="getRankClass(index)"
              >
                {{ index + 1 }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-black dark:text-white truncate">{{ course.name }}</p>
                <p class="text-xs text-gray-500">{{ course.code }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-lg font-bold text-info">
                  {{ course.students_count }}
                </p>
                <p class="text-xs text-gray-500">
                  студентов
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Группы в работе -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsUserGroupIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Группы в работе</h3>
          </div>
          <NuxtLink to="/groups" class="text-sm text-primary hover:underline">
            Все группы
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.groups?.length" class="text-center text-gray-500 py-4">
            Нет активных групп
          </div>
          <div v-else class="flex flex-col gap-3">
            <NuxtLink 
              v-for="group in stats.groups" 
              :key="group.id"
              :to="`/groups/${group.id}`"
              class="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800 hover:scale-[1.01]"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <h4 class="font-bold text-black dark:text-white">{{ group.code }}</h4>
                  <p class="text-xs text-gray-500">{{ group.course_name }}</p>
                </div>
                <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {{ group.student_count }} студ.
                </span>
              </div>
             
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600 dark:text-gray-400">Прогресс группы</span>
                <span class="font-medium text-primary">{{ group.progress }}%</span>
              </div>
              <div class="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  class="absolute left-0 h-full rounded-full bg-primary transition-all duration-1000"
                  :style="{ width: `${group.progress}%` }"
                ></div>
              </div>
              <div class="mt-2 text-right">
                <span class="text-xs text-gray-400">До {{ formatShortDate(group.end_date) }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Расписание и алерты -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6">
      <!-- Расписание на сегодня -->
      <div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <IconsCalenderIcon class="w-5 h-5 text-success" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Сегодня</h3>
          </div>
          <NuxtLink to="/schedule" class="text-sm text-primary hover:underline">
            Календарь
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.todaySchedule?.length" class="text-center text-gray-500 py-4">
            Нет занятий на сегодня
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              v-for="event in stats.todaySchedule" 
              :key="event.id"
              class="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {{ formatTime(event.start_time) }}
                </span>
                <span 
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="getEventTypeClass(event.event_type)"
                >
                  {{ getEventTypeLabel(event.event_type) }}
                </span>
              </div>
              <h5 class="text-sm font-medium text-black dark:text-white truncate">
                {{ event.title }}
              </h5>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <IconsUserGroupIcon class="w-3 h-3" />
                <span>{{ event.group_code }}</span>
                <span v-if="event.instructor_name" class="flex items-center gap-1 border-l border-gray-300 pl-2 ml-1">
                   • {{ event.instructor_name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

       <!-- Завершаются в ближайшие 7 дней -->
      <div 
        v-if="stats?.groupsEndingSoon?.length"
        class="rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden"
      >
        <div class="border-b border-warning/30 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <IconsWarningIcon class="w-5 h-5 text-warning" />
            </div>
            <h3 class="text-lg font-semibold text-warning">
              Завершаются скоро
            </h3>
            <span class="bg-warning text-white text-xs px-2 py-0.5 rounded-full">
              {{ stats.groupsEndingSoon.length }}
            </span>
          </div>
        </div>
        <div class="p-6">
          <div class="flex flex-col gap-3">
            <div 
              v-for="group in stats.groupsEndingSoon" 
              :key="group.id"
              class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700"
            >
              <div class="flex items-center gap-3">
                <span 
                  class="flex h-2.5 w-2.5 rounded-full"
                  :class="getDaysUntilEndClass(group.end_date)"
                ></span>
                <div>
                  <h5 class="font-medium text-black dark:text-white text-sm">{{ group.code }}</h5>
                  <p class="text-xs text-gray-500">
                    {{ formatDate(group.end_date) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <NuxtLink 
                  :to="`/groups/${group.id}/certificates`"
                  class="block text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-md transition-colors"
                >
                  Сертификаты
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Если нет завершающихся групп, показываем Требуют внимания на всю высоту -->
      <div 
        v-else-if="stats?.alerts?.length"
        class="rounded-lg bg-danger/5 border border-danger/30 shadow-md overflow-hidden"
      >
        <div class="border-b border-danger/30 py-4 px-6">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <IconsErrorIcon class="w-5 h-5 text-danger" />
            </div>
            <h3 class="text-lg font-semibold text-danger">
              Требуют внимания
            </h3>
          </div>
        </div>
        <div class="p-6">
          <ul class="space-y-3">
            <li v-for="(alert, index) in stats.alerts" :key="index" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
               <span class="mt-1 h-1.5 w-1.5 rounded-full bg-danger flex-shrink-0"></span>
              {{ alert }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="mt-6 rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-black dark:text-white">Быстрые действия</h3>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary hover:scale-105 hover:shadow-md"
        >
          <IconsPlusIcon v-if="action.icon === 'plus'" class="w-4 h-4" />
          <IconsArchiveIcon v-else-if="action.icon === 'archive'" class="w-4 h-4" />
          <IconsCertificateIcon v-else-if="action.icon === 'certificate'" class="w-4 h-4" />
          <IconsCalenderIcon v-else-if="action.icon === 'calendar'" class="w-4 h-4" />
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
const router = useRouter();

const { user } = useAuth();
const { authFetch } = useAuthFetch();

const stats = ref(null);
const loading = ref(true);

// Периоды для фильтрации сертификатов
const certificatePeriod = ref('months');
const certificateTransitioning = ref(false);
const certificatePeriods = [
  { value: 'months', label: 'Месяцы' },
  { value: 'quarters', label: 'Кварталы' },
  { value: 'years', label: 'Годы' }
];

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const quickActions = [
  { to: '/groups/create', label: 'Создать группу', icon: 'plus' },
  { to: '/database/import', label: 'Импорт студентов', icon: 'archive' },
  { to: '/certificates', label: 'Сертификаты', icon: 'certificate' },
  { to: '/schedule', label: 'Расписание', icon: 'calendar' },
];

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/manager/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch manager dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const navigateTo = (path) => {
  router.push(path);
};

// Функция смены периода с анимацией
const changeCertificatePeriod = (period) => {
  if (certificatePeriod.value === period) return;
  
  certificateTransitioning.value = true;
  setTimeout(() => {
    certificatePeriod.value = period;
    setTimeout(() => {
      certificateTransitioning.value = false;
    }, 100);
  }, 250);
};

// Данные для диаграммы студентов по курсам
const coursesChartData = computed(() => {
  const courses = stats.value?.studentsByCourse || [];
  return {
    series: courses.map(c => Number(c.count) || 0),
    labels: courses.map(c => c.name || 'Не указано')
  };
});

// Базовые данные сертификатов по месяцам
const certificatesChartData = computed(() => {
  const certs = stats.value?.certificatesByMonth || [];
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  
  return {
    series: [{
      name: 'Сертификаты',
      data: certs.map(c => Number(c.count) || 0)
    }],
    categories: certs.map(c => {
      const [year, month] = c.month.split('-');
      return monthNames[parseInt(month) - 1] + ' ' + year.slice(2);
    }),
    rawData: certs
  };
});

// Агрегация по кварталам
const certificatesByQuarters = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const quarterMap = new Map();
  
  rawData.forEach(item => {
    const [year, month] = item.month.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    const key = `${year}-Q${quarter}`;
    
    if (!quarterMap.has(key)) {
      quarterMap.set(key, { count: 0, year, quarter });
    }
    quarterMap.get(key).count += Number(item.count) || 0;
  });
  
  const sorted = Array.from(quarterMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, data]) => ({
      label: `Q${data.quarter} ${data.year.slice(2)}`,
      count: data.count
    }));
  
  return {
    series: [{
      name: 'Сертификаты',
      data: sorted.map(q => q.count)
    }],
    categories: sorted.map(q => q.label)
  };
});

// Агрегация по годам
const certificatesByYears = computed(() => {
  const rawData = certificatesChartData.value.rawData || [];
  const yearMap = new Map();
  
  rawData.forEach(item => {
    const [year] = item.month.split('-');
    
    if (!yearMap.has(year)) {
      yearMap.set(year, 0);
    }
    yearMap.set(year, yearMap.get(year) + (Number(item.count) || 0));
  });
  
  const sorted = Array.from(yearMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));
  
  return {
    series: [{
      name: 'Сертификаты',
      data: sorted.map(y => y.count)
    }],
    categories: sorted.map(y => y.year)
  };
});

// Текущие данные сертификатов
const currentCertificatesData = computed(() => {
  switch (certificatePeriod.value) {
    case 'quarters':
      return certificatesByQuarters.value;
    case 'years':
      return certificatesByYears.value;
    default:
      return certificatesChartData.value;
  }
});

const handleCourseChartClick = (data) => {
  console.log('Clicked on course:', data.label);
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatShortDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: 'Лекция',
    practice: 'Практика',
    assessment: 'Тест',
    other: 'Другое'
  };
  return map[type] || type;
};

const getEventTypeClass = (type) => {
  const map = {
    theory: 'bg-primary/10 text-primary',
    practice: 'bg-success/10 text-success',
    assessment: 'bg-warning/10 text-warning',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  };
  return map[type] || map.other;
};

const getDaysUntilEnd = (endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  return `${days} дней`;
};

const getDaysUntilEndClass = (endDate) => {
  const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 1) return 'bg-danger animate-pulse';
  if (days <= 3) return 'bg-warning';
  return 'bg-success';
};

const getRankClass = (index) => {
  if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
  if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
  if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

onMounted(() => {
  fetchDashboardStats();
});
</script>

<style scoped>
/* Плавная анимация появления карточек */
.rounded-lg {
  animation: fadeInUp 0.5s ease-out backwards;
}

.rounded-lg:nth-child(1) { animation-delay: 0.05s; }
.rounded-lg:nth-child(2) { animation-delay: 0.1s; }
.rounded-lg:nth-child(3) { animation-delay: 0.15s; }
.rounded-lg:nth-child(4) { animation-delay: 0.2s; }

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

/* Плавные переходы для hover-эффектов */
.hover\:shadow-lg,
.hover\:bg-gray-100,
.hover\:bg-gray-50,
.hover\:scale-105 {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Анимация для кнопок переключения периодов */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:active {
  transform: scale(0.95);
}

/* Плавное появление чартов */
:deep(.apexcharts-canvas) {
  animation: chartFadeIn 0.8s ease-out;
}

@keyframes chartFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Индикаторы загрузки */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
