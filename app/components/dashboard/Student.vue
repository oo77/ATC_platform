<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Добро пожаловать, {{ user?.name || 'Студент' }}!
        </h2>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {{ currentDate }}
          <span v-if="stats?.upcomingEvents?.length">
            • У вас запланировано {{ stats.upcomingEvents.length }} занятие(я)
          </span>
        </p>
      </div>
      <NuxtLink to="/schedule">
        <UiButton class="flex items-center gap-2">
          <IconsCalenderIcon class="w-5 h-5" />
          Посмотреть расписание
        </UiButton>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Ближайшие занятия -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden xl:col-span-2">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconsCalenderIcon class="w-5 h-5 text-primary" />
            </div>
            <h3 class="text-lg font-semibold text-black dark:text-white">Ближайшие занятия</h3>
          </div>
          <NuxtLink to="/schedule" class="text-sm text-primary hover:underline">Все</NuxtLink>
        </div>
        <div class="p-6">
          <div v-if="!stats?.upcomingEvents?.length" class="text-center text-gray-500 py-4">
            Нет предстоящих занятий на ближайшее время
          </div>
          <div v-else class="flex flex-col gap-5">
            <div 
              v-for="event in stats.upcomingEvents" 
              :key="event.id"
              class="flex flex-col gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-lg font-bold text-black dark:text-white">
                    {{ event.title }}
                  </h4>
                  <p class="text-sm font-medium text-gray-500">
                    {{ event.course_name }}
                    <span v-if="event.classroom_name" class="ml-1">• Ауд. {{ event.classroom_name }}</span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="block text-lg font-bold text-primary">{{ formatTime(event.start_time) }}</span>
                  <span class="block text-sm text-gray-500">{{ formatDate(event.start_time) }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <span 
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="getEventTypeClass(event.event_type)"
                >
                  {{ getEventTypeLabel(event.event_type) }}
                </span>
                <span v-if="event.instructor_name" class="text-sm text-gray-500">
                  Преподаватель: {{ event.instructor_name }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Горящие дедлайны -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <IconsWarningIcon class="w-5 h-5 text-warning" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Горящие дедлайны</h3>
        </div>
        <div class="p-6">
          <div v-if="!stats?.upcomingDeadlines?.length" class="flex flex-col items-center justify-center py-4 text-center">
            <div class="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <IconsCheckIcon class="h-6 w-6 text-success" />
            </div>
            <p class="text-sm text-gray-500">Нет активных дедлайнов</p>
          </div>
          <div v-else class="flex flex-col gap-4">
            <div 
              v-for="deadline in stats.upcomingDeadlines" 
              :key="deadline.id"
              class="flex items-center justify-between p-3 rounded-lg border border-warning/30 bg-warning/5"
            >
              <div>
                <h5 class="font-medium text-black dark:text-white">{{ deadline.test_name }}</h5>
                <p class="text-xs text-gray-500 mt-0.5">{{ deadline.course_name }}</p>
              </div>
              <div class="text-right">
                <span class="text-sm font-bold text-warning">
                  {{ formatDateTime(deadline.end_date) }}
                </span>
                <NuxtLink 
                  v-if="deadline.id"
                  :to="`/tests/take/${deadline.id}`"
                  class="block text-xs text-primary hover:underline mt-1"
                >
                  Пройти тест
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Мои курсы -->
    <div class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
            <IconsAcademicCapIcon class="w-5 h-5 text-success" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Мои курсы</h3>
        </div>
        <NuxtLink to="/my-courses" class="text-sm text-primary hover:underline">Все курсы</NuxtLink>
      </div>
      <div class="p-6">
        <div v-if="!stats?.activeCourses?.length" class="text-center text-gray-500 py-4">
          У вас пока нет активных курсов
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink 
            v-for="course in stats.activeCourses" 
            :key="course.id"
            :to="`/my-courses/${course.id}`"
            class="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-all hover:bg-gray-50 hover:border-primary dark:hover:bg-gray-800"
          >
            <h4 class="font-bold text-black dark:text-white mb-1">{{ course.course_name }}</h4>
            <p class="text-sm text-gray-500 mb-3">Группа: {{ course.group_code }}</p>
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-gray-600 dark:text-gray-400">Прогресс</span>
              <span class="font-medium text-primary">{{ course.progress }}%</span>
            </div>
            <div class="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div 
                class="absolute left-0 h-full rounded-full bg-primary transition-all"
                :style="{ width: `${course.progress}%` }"
              ></div>
            </div>
          </NuxtLink>
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
          <IconsClipboardCheckIcon v-if="action.icon === 'test'" class="w-4 h-4" />
          <IconsCalenderIcon v-else-if="action.icon === 'calendar'" class="w-4 h-4" />
          <IconsCertificateIcon v-else-if="action.icon === 'certificate'" class="w-4 h-4" />
          <IconsSupportIcon v-else-if="action.icon === 'support'" class="w-4 h-4" />
          {{ action.label }}
        </NuxtLink>
      </div>
    </div>

    <!-- Последние оценки -->
    <div 
      v-if="stats?.recentGrades?.length"
      class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"
    >
      <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex items-center gap-3">
        <div class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
          <IconsBarChartIcon class="w-5 h-5 text-info" />
        </div>
        <h3 class="text-lg font-semibold text-black dark:text-white">Мои последние оценки</h3>
      </div>
      <div class="p-6">
        <div class="flex flex-col gap-3">
          <div 
            v-for="grade in stats.recentGrades" 
            :key="grade.id"
            class="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex-1">
              <h5 class="font-medium text-black dark:text-white">{{ grade.event_title }}</h5>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ grade.course_name }} • {{ formatDate(grade.graded_at) }}
              </p>
            </div>
            <div class="text-right">
              <span 
                class="inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold"
                :class="getGradeClass(grade.grade)"
              >
                {{ grade.grade }}/{{ grade.max_grade || 100 }}
              </span>
              <p v-if="grade.comment" class="text-xs text-gray-500 mt-1">{{ grade.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомления -->
    <div 
      v-if="notifications?.length"
      class="mt-6 rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"
    >
      <div class="border-b border-gray-200 dark:border-gray-700 py-4 px-6 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconsBellIcon class="w-5 h-5 text-primary" />
          </div>
          <h3 class="text-lg font-semibold text-black dark:text-white">Уведомления</h3>
          <span 
            v-if="unreadCount > 0"
            class="bg-danger text-white text-xs px-2 py-0.5 rounded-full"
          >
            {{ unreadCount }}
          </span>
        </div>
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-sm text-primary hover:underline"
        >
          Отметить все как прочитанные
        </button>
      </div>
      <div class="p-6">
        <div class="flex flex-col gap-3">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="flex items-start gap-3 p-3 rounded-lg transition-colors"
            :class="notification.is_read ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-primary/5 border border-primary/20'"
          >
            <IconsClipboardCheckIcon v-if="notification.type === 'test_upcoming'" class="w-5 h-5 flex-shrink-0 text-primary" />
            <IconsWarningIcon v-else-if="notification.type === 'test_today' || notification.type === 'deadline_warning'" class="w-5 h-5 flex-shrink-0 text-warning" />
            <IconsErrorIcon v-else-if="notification.type === 'test_overdue' || notification.type === 'deadline_critical'" class="w-5 h-5 flex-shrink-0 text-danger" />
            <IconsCalenderIcon v-else-if="notification.type === 'schedule_change'" class="w-5 h-5 flex-shrink-0 text-info" />
            <IconsBarChartIcon v-else-if="notification.type === 'grade_posted'" class="w-5 h-5 flex-shrink-0 text-success" />
            <IconsCertificateIcon v-else-if="notification.type === 'certificate_issued'" class="w-5 h-5 flex-shrink-0 text-success" />
            <IconsInfoCircleIcon v-else-if="notification.type === 'info'" class="w-5 h-5 flex-shrink-0 text-info" />
            <IconsBellIcon v-else class="w-5 h-5 flex-shrink-0 text-primary" />
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <h5 class="font-medium text-black dark:text-white">{{ notification.title }}</h5>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ notification.message }}</p>
                  <p class="text-xs text-gray-500 mt-1">{{ formatRelativeTime(notification.created_at) }}</p>
                </div>
                <button 
                  v-if="!notification.is_read"
                  @click="markAsRead(notification.id)"
                  class="text-xs text-primary hover:underline flex-shrink-0"
                >
                  Прочитано
                </button>
              </div>
              <NuxtLink 
                v-if="notification.action_url"
                :to="notification.action_url"
                class="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                {{ notification.action_text || 'Перейти' }}
                <IconsChevronRightIcon class="w-3 h-3" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
const { user } = useAuth();
const stats = ref(null);
const notifications = ref([]);

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const { authFetch } = useAuthFetch();
const { showNotification } = useNotification();

const quickActions = [
  { to: '/tests/my', label: 'Пройти тест', icon: 'test' },
  { to: '/schedule', label: 'Расписание', icon: 'calendar' },
  { to: '/my-certificates', label: 'Сертификаты', icon: 'certificate' },
  { to: '/support', label: 'Помощь', icon: 'support' },
];

const unreadCount = computed(() => {
  return notifications.value?.filter(n => !n.is_read).length || 0;
});

const fetchDashboardStats = async () => {
  try {
    const data = await authFetch('/api/students/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
  }
};

const fetchNotifications = async () => {
  try {
    const data = await authFetch('/api/students/notifications?limit=5');
    if (data) {
      notifications.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

const markAsRead = async (notificationId) => {
  try {
    await authFetch(`/api/students/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.is_read = true;
    }
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

const markAllAsRead = async () => {
  try {
    await authFetch('/api/students/notifications/read-all', {
      method: 'PUT'
    });
    notifications.value.forEach(n => n.is_read = true);
    showNotification({
      type: 'success',
      message: 'Все уведомления отмечены как прочитанные'
    });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
  }
};

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatDateTime = (dateStr) => {
  return new Date(dateStr).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
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
  
  return formatDate(dateStr);
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

const getGradeClass = (grade) => {
  const percentage = grade;
  if (percentage >= 85) return 'bg-success/10 text-success';
  if (percentage >= 70) return 'bg-primary/10 text-primary';
  if (percentage >= 60) return 'bg-warning/10 text-warning';
  return 'bg-danger/10 text-danger';
};



onMounted(() => {
  fetchDashboardStats();
  fetchNotifications();
});
</script>
