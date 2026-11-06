<template>
  <!-- Обёртка без двойного отступа (отступы задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы вместо самописного h1 (text-4xl/uppercase) -->
    <UiPageHeader title="Расписание занятий" description="Управление расписанием учебных групп" />

    <!-- Метрики одной плоской строкой: 4 крупные карточки заменены UiStat, чтобы календарь был выше сгиба -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Сегодня" :value="stats.today" :icon="Calendar" tone="primary" />
      <UiStat label="На этой неделе" :value="stats.thisWeek" :icon="CalendarDays" tone="success" />
      <UiStat label="Активных групп" :value="stats.activeGroups" :icon="Users" tone="warning" />
      <UiStat label="Аудиторий" :value="stats.classrooms" :icon="Building" tone="info" />
    </div>

    <!-- Календарь в стандартной карточке: без теней и большого padding -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
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
