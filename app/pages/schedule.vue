<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Расписание занятий
        </h2>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Управление расписанием учебных групп
        </p>
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Сегодня</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.today }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">На этой неделе</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.thisWeek }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных групп</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.activeGroups }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Аудиторий</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.classrooms }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <ScheduleCalendarView />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Расписание | TailAdmin - Nuxt Tailwind CSS Dashboard',
});

import { usePermissions } from '~/composables/usePermissions';

// ...

const { canViewAllGroups, isTeacher } = usePermissions();
const { authFetch } = useAuthFetch();

// Статистика
const stats = ref({
  today: 0,
  thisWeek: 0,
  activeGroups: 0,
  classrooms: 0,
  showGroups: false // Flag to control UI visibility if needed, or just rely on 0
});

// Загрузка статистики
const loadStats = async () => {
  try {
    // Получаем текущую дату
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    // Начало и конец недели
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const shouldFetchGroups = canViewAllGroups.value || isTeacher.value;
    stats.value.showGroups = shouldFetchGroups;

    // Запускаем все запросы параллельно
    const [todayResponse, weekResponse, groupsResponse, classroomsResponse] = await Promise.all([
      authFetch<{ success: boolean; events: any[] }>(
        `/api/schedule?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`
      ),
      authFetch<{ success: boolean; events: any[] }>(
        `/api/schedule?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`
      ),
      shouldFetchGroups 
        ? authFetch<{ success: boolean; stats: { active: number } }>('/api/groups?limit=1')
        : Promise.resolve({ success: true, stats: { active: 0 } }),
      authFetch<{ success: boolean; classrooms: any[] }>(
        '/api/classrooms'
      ),
    ]);

    // Обновляем статистику
    if (todayResponse.success) {
      stats.value.today = todayResponse.events.length;
    }
    if (weekResponse.success) {
      stats.value.thisWeek = weekResponse.events.length;
    }
    if (groupsResponse.success && groupsResponse.stats) {
      stats.value.activeGroups = groupsResponse.stats.active;
    }
    if (classroomsResponse.success) {
      stats.value.classrooms = classroomsResponse.classrooms.length;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
};

onMounted(() => {
  loadStats();
});
</script>
