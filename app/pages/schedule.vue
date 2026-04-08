<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Расписание занятий
          </h1>
          <p class="text-slate-500 font-medium">
            Управление расписанием учебных групп
          </p>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Сегодня</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.today }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <Calendar class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">На этой неделе</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.thisWeek }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CalendarDays class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных групп</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.activeGroups }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Users class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Аудиторий</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.classrooms }}</h3>
          </div>
          <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
            <Building class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-6 md:p-8">
      <ScheduleCalendarView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calendar, CalendarDays, Users, Building } from 'lucide-vue-next';

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
