<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добро пожаловать, {{ user?.name || 'Администратор' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
        </p>
      </div>
      <NuxtLink to="/settings">
        <UiButton variant="outline" class="flex items-center gap-2">
          <IconsSettingsIcon class="w-5 h-5" />
          Настройки системы
        </UiButton>
      </NuxtLink>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/database')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconsUserGroupIcon class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего студентов</h3>
            <div class="flex items-center gap-2">
              <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.totalStudents || 0 }}</p>
              <span v-if="stats?.studentsTrend" class="text-xs font-medium text-success">
                +{{ stats.studentsTrend }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/programs')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <IconsInstructorIcon class="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Преподаватели</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.totalInstructors || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/groups')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <IconsUserGroupIcon class="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активные группы</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.activeGroups || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer" @click="navigateTo('/certificates')">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <IconsCertificateIcon class="w-6 h-6 text-info" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Сертификаты за месяц</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.certificatesThisMonth || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Чарты: Круговая диаграмма и Сертификаты по месяцам -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
      <!-- Распределение студентов по организациям (Круговая диаграмма) -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsPieChartIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Студенты по организациям</h3>
          </div>
          <NuxtLink to="/database?tab=organizations" class="text-sm text-primary hover:underline">
            Все организации
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!organizationChartData.series.length" class="flex flex-col items-center justify-center py-16 text-center">
            <IconsUserGroupIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных об организациях</p>
          </div>
          <ChartsDonutChart 
            v-else
            chart-id="students-by-org"
            :series="organizationChartData.series"
            :labels="organizationChartData.labels"
            :height="350"
            legend-position="bottom"
            @click="handleOrgChartClick"
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
              chart-id="certificates-chart"
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

    <!-- Топ инструкторов и Топ курсов -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2 mb-6">
      <!-- Топ инструкторов по проведённым часам -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <IconsInstructorIcon class="w-5 h-5 text-warning" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Топ инструкторов по часам</h3>
          </div>
          <NuxtLink to="/programs" class="text-sm text-primary hover:underline">
            Все инструкторы
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.topInstructors?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <IconsInstructorIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных об инструкторах</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th class="pb-3 font-medium">#</th>
                  <th class="pb-3 font-medium">Инструктор</th>
                  <th class="pb-3 font-medium text-right">Часы</th>
                  <th class="pb-3 font-medium text-right">Занятий</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(instructor, index) in stats.topInstructors" 
                  :key="instructor.id"
                  class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td class="py-3">
                    <span 
                      class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                      :class="getRankClass(index)"
                    >
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="py-3">
                    <div class="flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xs font-bold">
                        {{ getInitials(instructor.name) }}
                      </div>
                      <span class="font-medium text-black dark:text-white truncate max-w-[150px]">{{ instructor.name }}</span>
                    </div>
                  </td>
                  <td class="py-3 text-right">
                    <span class="font-bold text-warning">{{ instructor.hours }} ч</span>
                  </td>
                  <td class="py-3 text-right text-gray-600 dark:text-gray-400">
                    {{ instructor.lessonsCount }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Топ курсов -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
              <IconsAcademicCapIcon class="w-5 h-5 text-info" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Топ курсов</h3>
          </div>
          <div class="flex gap-2">
            <button 
              class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              :class="courseTab === 'groups' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
              @click="courseTab = 'groups'"
            >
              По группам
            </button>
            <button 
              class="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              :class="courseTab === 'students' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
              @click="courseTab = 'students'"
            >
              По слушателям
            </button>
          </div>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!currentTopCourses?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <IconsAcademicCapIcon class="h-12 w-12 text-gray-300 mb-3" />
            <p class="text-sm text-gray-500">Нет данных о курсах</p>
          </div>
          <div v-else class="space-y-4">
            <div 
              v-for="(course, index) in currentTopCourses" 
              :key="course.id"
              class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              @click="navigateTo(`/programs/${course.id}`)"
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
                  {{ courseTab === 'groups' ? course.groups_count : course.students_count }}
                </p>
                <p class="text-xs text-gray-500">
                  {{ courseTab === 'groups' ? 'групп' : 'слушателей' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6">
      <!-- Системная статистика -->
      <div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconsBarChartIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Статистика системы</h3>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" @click="navigateTo('/users')">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Всего пользователей</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.totalUsers || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <IconsUserCircleIcon class="w-6 h-6 text-primary" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Зарегистрировано сегодня</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.todayRegistrations || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <IconsPlusIcon class="w-6 h-6 text-success" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Активных сессий</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.activeSessions || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <IconsGridIcon class="w-6 h-6 text-warning" />
              </div>
            </div>

            <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer" @click="navigateTo('/activity-logs')">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Логов сегодня</p>
                <p class="text-2xl font-bold text-black dark:text-white mt-1">{{ stats?.todayLogs || 0 }}</p>
              </div>
              <div class="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                <IconsListIcon class="w-6 h-6 text-info" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Системные уведомления -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <IconsBellIcon class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Системные уведомления</h3>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.systemAlerts?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <IconsCheckIcon class="h-6 w-6 text-success" />
            </div>
            <p class="text-sm text-gray-500">Нет системных уведомлений</p>
          </div>
          <div v-else class="flex flex-col gap-3">
            <div 
              v-for="(alert, index) in stats.systemAlerts" 
              :key="index"
              class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-transform hover:scale-[1.02]"
              :class="getAlertClass(alert.type)"
            >
              <IconsWarningIcon v-if="alert.type === 'warning'" class="w-5 h-5 text-warning flex-shrink-0" />
              <IconsInfoCircleIcon v-else-if="alert.type === 'info'" class="w-5 h-5 text-info flex-shrink-0" />
              <IconsErrorIcon v-else-if="alert.type === 'error'" class="w-5 h-5 text-danger flex-shrink-0" />
              <IconsSuccessIcon v-else class="w-5 h-5 text-success flex-shrink-0" />
              <div class="flex-1">
                <p class="text-sm font-medium text-black dark:text-white">{{ alert.message }}</p>
                <p v-if="alert.action" class="text-xs text-primary hover:underline cursor-pointer mt-1">
                  {{ alert.action }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Последние действия -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden mb-6">
      <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconsListIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Последние действия</h3>
        </div>
        <NuxtLink to="/activity-logs" class="text-sm text-primary hover:underline">
          Все логи
        </NuxtLink>
      </div>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
        <div v-else-if="!stats?.recentActivities?.length" class="text-center text-gray-500 py-4">
          Нет недавних действий
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div 
            v-for="activity in stats.recentActivities" 
            :key="activity.id"
            class="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span 
              class="flex h-2 w-2 rounded-full flex-shrink-0"
              :class="getActivityDotClass(activity.action)"
            ></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-black dark:text-white truncate">
                <span class="font-medium">{{ activity.user_name }}</span>
                <span class="text-gray-500 mx-1">•</span>
                <span class="text-gray-600 dark:text-gray-400">{{ activity.action }}</span>
              </p>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatRelativeTime(activity.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
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
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary hover:shadow-md hover:scale-105"
        >
          <IconsPlusIcon v-if="action.icon === 'plus'" class="w-4 h-4" />
          <IconsAcademicCapIcon v-else-if="action.icon === 'academic'" class="w-4 h-4" />
          <IconsSettingsIcon v-else-if="action.icon === 'settings'" class="w-4 h-4" />
          <IconsListIcon v-else-if="action.icon === 'list'" class="w-4 h-4" />
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const { user } = useAuth();
const { authFetch } = useAuthFetch();
const router = useRouter();

const stats = ref(null);
const loading = ref(true);
const courseTab = ref('groups');

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const quickActions = [
  { to: '/users/create', label: 'Создать пользователя', icon: 'plus' },
  { to: '/programs/create', label: 'Создать курс', icon: 'academic' },
  { to: '/settings', label: 'Настройки', icon: 'settings' },
  { to: '/activity-logs', label: 'Логи', icon: 'list' },
];

// Периоды для фильтрации сертификатов
const certificatePeriod = ref('months');
const certificateTransitioning = ref(false);
const certificatePeriods = [
  { value: 'months', label: 'Месяцы' },
  { value: 'quarters', label: 'Кварталы' },
  { value: 'years', label: 'Годы' }
];

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

// Подготовка данных для круговой диаграммы организаций
const organizationChartData = computed(() => {
  const orgs = stats.value?.studentsByOrganization || [];
  return {
    series: orgs.map(o => Number(o.count) || 0),
    labels: orgs.map(o => o.name || 'Не указано')
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

// Агрегация данных по кварталам
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

// Агрегация данных по годам
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

// Текущие данные сертификатов в зависимости от выбранного периода
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

// Текущий топ курсов в зависимости от выбранной вкладки
const currentTopCourses = computed(() => {
  if (courseTab.value === 'groups') {
    return stats.value?.topCoursesByGroups || [];
  }
  return stats.value?.topCoursesByStudents || [];
});

const navigateTo = (path) => {
  router.push(path);
};

const handleOrgChartClick = (data) => {
  // При клике на сегмент диаграммы можно перейти к фильтрации по организации
  console.log('Clicked on organization:', data.label);
};

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/admin/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch admin dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatRelativeTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн назад`;
  
  return date.toLocaleDateString('ru-RU');
};

const getAlertClass = (type) => {
  const classes = {
    warning: 'bg-warning/10 border border-warning/30',
    info: 'bg-info/10 border border-info/30',
    error: 'bg-danger/10 border border-danger/30',
    success: 'bg-success/10 border border-success/30'
  };
  return classes[type] || classes.info;
};

const getActivityDotClass = (action) => {
  if (action.includes('создал') || action.includes('добавил')) return 'bg-success';
  if (action.includes('удалил')) return 'bg-danger';
  if (action.includes('изменил') || action.includes('обновил')) return 'bg-warning';
  if (action.includes('вход')) return 'bg-primary';
  return 'bg-gray-400';
};

const getRankClass = (index) => {
  if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
  if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
  if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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

/* Анимация для таблицы инструкторов */
tbody tr {
  animation: slideInLeft 0.4s ease-out backwards;
}

tbody tr:nth-child(1) { animation-delay: 0.05s; }
tbody tr:nth-child(2) { animation-delay: 0.1s; }
tbody tr:nth-child(3) { animation-delay: 0.15s; }
tbody tr:nth-child(4) { animation-delay: 0.2s; }
tbody tr:nth-child(5) { animation-delay: 0.25s; }

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Пульсация для индикаторов загрузки */
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
