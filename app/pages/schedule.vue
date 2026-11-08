<template>
  <div class="mx-auto max-w-screen-2xl space-y-3">
    <!-- Компактная шапка: заголовок + кнопка показа метрик -->
    <div class="flex items-center justify-between gap-3">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Расписание занятий</h1>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="showStats ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5'"
        @click="toggleStats"
      >
        Показатели
        <span class="text-xs text-gray-500">{{ stats.today }} сегодня · {{ stats.thisWeek }} на неделе</span>
      </button>
    </div>

    <!-- Метрики раскрываются по кнопке -->
    <div v-if="showStats" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Сегодня" :value="stats.today" :icon="Calendar" tone="primary" />
      <UiStat label="На этой неделе" :value="stats.thisWeek" :icon="CalendarDays" tone="success" />
      <UiStat label="Активных групп" :value="stats.activeGroups" :icon="Users" tone="warning" />
      <UiStat label="Аудиторий" :value="stats.classrooms" :icon="Building" tone="info" />
    </div>

    <ScheduleCalendarView />
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

// Показ метрик (запоминаем выбор)
const showStats = ref(false);
const toggleStats = () => {
  showStats.value = !showStats.value;
  try { localStorage.setItem('schedule:showStats', showStats.value ? '1' : '0'); } catch {}
};

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
  try { showStats.value = localStorage.getItem('schedule:showStats') === '1'; } catch {}
  loadStats();
});
</script>
