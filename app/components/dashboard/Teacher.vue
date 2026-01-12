<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добрый день, {{ user?.name || 'Преподаватель' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
          <span v-if="stats?.todayLessons > 0">
            • У вас запланировано {{ stats.todayLessons }} занятие(й)
          </span>
          <span v-else class="text-success">
            • Сегодня нет запланированных занятий
          </span>
        </p>
      </div>
      <NuxtLink to="/schedule">
        <UiButton class="flex items-center gap-2">
          <IconsCalenderIcon class="w-5 h-5" />
          Моё расписание
        </UiButton>
      </NuxtLink>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <IconsUserGroupIcon class="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Мои группы</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.myGroups || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <IconsUserCircleIcon class="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Мои студенты</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.myStudents || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <IconsCalenderIcon class="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Занятий сегодня</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.todayLessons || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Часов за месяц</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats?.monthlyHours || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Мои занятия сегодня -->
      <div class="xl:col-span-2 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsCalenderIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Мои занятия сегодня</h3>
          </div>
          <NuxtLink to="/schedule" class="text-sm text-primary hover:underline">
            Полное расписание
          </NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="loading" class="flex justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          </div>
          <div v-else-if="!stats?.todaySchedule?.length" class="flex flex-col items-center justify-center py-8 text-center">
            <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <IconsCheckIcon class="h-6 w-6 text-success" />
            </div>
            <p class="text-sm text-gray-500">Сегодня нет запланированных занятий</p>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div 
              v-for="lesson in stats.todaySchedule" 
              :key="lesson.id"
              class="rounded-lg border p-4 transition-all"
              :class="getLessonStatusClass(lesson)"
            >
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span 
                      class="inline-flex h-2.5 w-2.5 rounded-full"
                      :class="getLessonDotClass(lesson)"
                    ></span>
                    <span class="text-lg font-bold text-primary">
                      {{ formatTime(lesson.start_time) }} - {{ formatTime(lesson.end_time) }}
                    </span>
                  </div>
                  <h4 class="font-semibold text-black dark:text-white">
                    {{ getEventTypeLabel(lesson.event_type) }}: {{ lesson.title }}
                  </h4>
                  <p class="text-sm text-gray-500 mt-1">
                    Группа: {{ lesson.group_code }}
                    <span v-if="lesson.classroom_name"> • Ауд. {{ lesson.classroom_name }}</span>
                    <span v-if="lesson.student_count"> • {{ lesson.student_count }} студентов</span>
                  </p>
                </div>
                <NuxtLink :to="`/groups/journal/${lesson.group_id}_${lesson.discipline_id}`">
                  <UiButton size="sm" variant="outline" class="flex items-center gap-1">
                    <IconsCheckIcon class="w-4 h-4" />
                    Посещаемость
                  </UiButton>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Мои группы -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <IconsUserGroupIcon class="w-5 h-5 text-success" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Мои группы</h3>
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
            Нет назначенных групп
          </div>
          <div v-else class="flex flex-col gap-4">
            <NuxtLink 
              v-for="group in stats.groups" 
              :key="group.id"
              :to="`/groups/${group.id}`"
              class="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800"
            >
              <h4 class="font-bold text-black dark:text-white mb-1">{{ group.code }}</h4>
              <p class="text-sm text-gray-500 mb-2">{{ group.course_name }}</p>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">{{ group.student_count }} студентов</span>
                <span 
                  class="font-medium"
                  :class="group.attendance_rate >= 80 ? 'text-success' : group.attendance_rate >= 60 ? 'text-warning' : 'text-danger'"
                >
                  Посещаемость: {{ group.attendance_rate }}%
                </span>
              </div>
              <div class="mt-2 relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div 
                  class="absolute left-0 h-full rounded-full transition-all"
                  :class="group.attendance_rate >= 80 ? 'bg-success' : group.attendance_rate >= 60 ? 'bg-warning' : 'bg-danger'"
                  :style="{ width: `${group.attendance_rate}%` }"
                ></div>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Незаполненная посещаемость -->
    <div 
      v-if="stats?.pendingAttendance?.length"
      class="mt-6 rounded-lg bg-warning/5 border border-warning/30 shadow-md overflow-hidden"
    >
      <div class="border-b border-warning/30 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <IconsWarningIcon class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-lg font-semibold text-warning">
            Требуется заполнить посещаемость
          </h3>
          <span class="bg-warning text-white text-xs px-2 py-0.5 rounded-full">
            {{ stats.pendingAttendance.length }}
          </span>
        </div>
      </div>
      <div class="p-6">
        <div class="flex flex-col gap-3">
          <div 
            v-for="item in stats.pendingAttendance" 
            :key="item.id"
            class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700"
          >
            <div>
              <span class="text-sm font-medium text-black dark:text-white">
                {{ formatDate(item.date) }}
              </span>
              <span class="text-gray-500 mx-2">•</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ item.title }}</span>
              <span class="text-gray-500 mx-2">•</span>
              <span class="text-sm text-gray-500">{{ item.group_code }}</span>
            </div>
            <NuxtLink :to="`/groups/journal/${item.group_id}_${item.discipline_id}`">
              <UiButton size="sm" variant="warning">Заполнить</UiButton>
            </NuxtLink>
          </div>
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
          class="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-primary hover:text-white hover:border-primary"
        >
          <IconsCalenderIcon v-if="action.icon === 'calendar'" class="w-4 h-4" />
          <IconsUserGroupIcon v-else-if="action.icon === 'group'" class="w-4 h-4" />
          <IconsUserCircleIcon v-else-if="action.icon === 'user'" class="w-4 h-4" />
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const { user } = useAuth();
const { authFetch } = useAuthFetch();

const stats = ref(null);
const loading = ref(true);

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const quickActions = [
  { to: '/schedule', label: 'Моё расписание', icon: 'calendar' },
  { to: '/groups', label: 'Мои группы', icon: 'group' },
  { to: '/students', label: 'Студенты', icon: 'user' },
  { to: '/profile', label: 'Мой профиль', icon: 'user' },
];

const fetchDashboardStats = async () => {
  loading.value = true;
  try {
    const data = await authFetch('/api/teacher/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch teacher dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
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

const getLessonStatusClass = (lesson) => {
  const now = new Date();
  const start = new Date(lesson.start_time);
  const end = new Date(lesson.end_time);
  
  if (now >= start && now <= end) {
    return 'border-success bg-success/5';
  } else if (now > end) {
    return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50';
  }
  return 'border-gray-200 dark:border-gray-700';
};

const getLessonDotClass = (lesson) => {
  const now = new Date();
  const start = new Date(lesson.start_time);
  const end = new Date(lesson.end_time);
  
  if (now >= start && now <= end) {
    return 'bg-success animate-pulse';
  } else if (now > end) {
    return 'bg-gray-400';
  }
  return 'bg-primary';
};

onMounted(() => {
  fetchDashboardStats();
});
</script>
