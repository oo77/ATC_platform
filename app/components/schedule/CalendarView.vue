<template>
  <div class="calendar-wrapper">
    <!-- Верхняя панель управления -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <!-- Навигация по датам -->
        <button
          @click="handlePrev"
          class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          title="Назад"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <!-- Кнопка "Сегодня" -->
        <button
          @click="handleToday"
          class="px-3 py-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors text-sm font-medium"
          title="Сегодня"
        >
          Сегодня
        </button>
        
        <button
          @click="handleNext"
          class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          title="Вперёд"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <!-- Кнопка добавления события -->
        <UiButton v-if="canCreateSchedule" @click="openAddModal()" class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Добавить занятие
        </UiButton>
      </div>

      <!-- Заголовок с текущей датой -->
      <h2 class="text-xl font-semibold text-black dark:text-white order-first sm:order-0">
        {{ currentTitle }}
      </h2>

      <!-- Переключатель видов -->
      <div class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden">
        <button
          v-for="view in viewOptions"
          :key="view.value"
          @click="handleViewChange(view.value)"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            currentView === view.value
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4'
          ]"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Фильтр по группе -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Группа
          </label>
          <div class="relative">
            <select
              v-model="filters.groupId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все группы</option>
              <option v-for="group in groups" :key="group.id" :value="group.id">
                {{ group.code }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по инструктору -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Инструктор
          </label>
          <div class="relative">
            <select
              v-model="filters.instructorId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все инструкторы</option>
              <option v-for="instructor in instructors" :key="instructor.id" :value="instructor.id">
                {{ instructor.fullName }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Фильтр по аудитории -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Аудитория
          </label>
          <div class="relative">
            <select
              v-model="filters.classroomId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все аудитории</option>
              <option v-for="classroom in classrooms" :key="classroom.id" :value="classroom.id">
                {{ classroom.name }}
              </option>
            </select>
            <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Сброс фильтров -->
        <div class="flex items-end">
          <button
            v-if="hasActiveFilters"
            @click="resetFilters"
            class="w-full px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <div class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 relative min-h-[500px]">
      <!-- Overlay загрузки поверх календаря -->
      <div v-if="loading" class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-10 flex items-center justify-center rounded-lg">
        <div class="flex items-center gap-3">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <span class="text-gray-600 dark:text-gray-400">Загрузка расписания...</span>
        </div>
      </div>
      
      <!-- Подсказка о горячих клавишах -->
      <div class="mb-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-4">
        <span>💡 <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[10px]">CTRL</kbd> + перетаскивание = копирование занятия</span>
      </div>
      
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
        class="schedule-calendar"
      />
      
      <!-- Легенда групп -->
      <div 
        v-if="usedGroupsWithColors.length > 0" 
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center gap-2 mb-2">
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Группы:</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="group in usedGroupsWithColors"
            :key="group.id"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
            :class="[
              filters.groupId === group.id 
                ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-boxdark' 
                : 'hover:bg-gray-100 dark:hover:bg-meta-4'
            ]"
            :style="{ 
              backgroundColor: filters.groupId === group.id ? group.color + '20' : 'transparent',
              color: filters.groupId === group.id ? group.color : undefined
            }"
            @click="toggleGroupFilter(group.id)"
            :title="filters.groupId === group.id ? 'Нажмите, чтобы сбросить фильтр' : 'Нажмите, чтобы фильтровать по группе'"
          >
            <span 
              class="w-3 h-3 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: group.color }"
            ></span>
            <span class="text-gray-700 dark:text-gray-300">{{ group.code }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра деталей события -->
    <ScheduleEventDetailModal
      :is-open="showDetailModal"
      :event="selectedEvent"
      @close="closeDetailModal"
      @edit="handleEditFromDetail"
    />

    <!-- Модальное окно создания/редактирования события -->
    <ScheduleEventModal
      :is-open="showEventModal"
      :event="editingEvent"
      :default-start="defaultEventStart"
      :default-end="defaultEventEnd"
      @close="closeEventModal"
      @saved="handleEventSaved"
      @deleted="handleEventDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { CalendarOptions, EventInput, EventClickArg, DateSelectArg, DatesSetArg, EventDropArg, EventMountArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import type { ScheduleEvent } from '~/types/schedule';
import { dateToLocalIsoString, formatDateOnly, formatTimeOnly } from '~/utils/dateTime';

interface Group {
  id: string;
  code: string;
}

interface Instructor {
  id: string;
  fullName: string;
}

interface Classroom {
  id: string;
  name: string;
}

const { authFetch } = useAuthFetch();
const notification = useNotification();

// Проверка прав доступа
const { 
  canCreateSchedule, 
  canEditSchedule, 
  canDeleteSchedule,
  isTeacher,
  isStudent,
  canViewAllGroups,
  canViewInstructors 
} = usePermissions();

// Настройки расписания (академические пары)
const {
  periods,
  settings: scheduleSettings,
  loadSettings: loadScheduleSettings,
  getFirstPeriodStart,
  getLastPeriodEnd,
  getNearestPeriod,
  getPeriodByTime,
} = useScheduleSettings();

// Refs
const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

// State
const loading = ref(true);
const isInitialized = ref(false);
const loadingAbortController = ref<AbortController | null>(null);
const events = ref<ScheduleEvent[]>([]);
const groups = ref<Group[]>([]);
const instructors = ref<Instructor[]>([]);
const classrooms = ref<Classroom[]>([]);
const currentView = ref('dayGridMonth');
const currentTitle = ref('');
const showEventModal = ref(false);
const showDetailModal = ref(false);
const selectedEvent = ref<ScheduleEvent | null>(null);
const editingEvent = ref<ScheduleEvent | null>(null);
const defaultEventStart = ref<Date | undefined>(undefined);
const defaultEventEnd = ref<Date | undefined>(undefined);

// Храним текущий диапазон дат
const currentDateRange = ref<{ start: Date; end: Date } | null>(null);

const filters = ref({
  groupId: '',
  instructorId: '',
  classroomId: '',
});

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.groupId || filters.value.instructorId || filters.value.classroomId;
});

const viewOptions = [
  { value: 'dayGridMonth', label: 'Месяц' },
  { value: 'timeGridWeek', label: 'Неделя' },
  { value: 'timeGridDay', label: 'День' },
  { value: 'listWeek', label: 'Список' },
];

// Цвета событий (по типу)
const eventColors: Record<string, { bg: string; border: string; text: string }> = {
  primary: { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' },
  success: { bg: '#10B981', border: '#10B981', text: '#ffffff' },
  warning: { bg: '#F59E0B', border: '#F59E0B', text: '#ffffff' },
  danger: { bg: '#EF4444', border: '#EF4444', text: '#ffffff' },
};

// Палитра цветов для групп (12 контрастных цветов)
const GROUP_COLOR_PALETTE = [
  '#E91E63', // Розовый
  '#9C27B0', // Фиолетовый
  '#673AB7', // Глубокий фиолетовый
  '#3F51B5', // Индиго
  '#2196F3', // Синий
  '#00BCD4', // Циан
  '#009688', // Бирюзовый
  '#4CAF50', // Зелёный
  '#8BC34A', // Лаймовый
  '#FF9800', // Оранжевый
  '#FF5722', // Глубокий оранжевый
  '#795548', // Коричневый
];

// Хеш-функция для генерации индекса цвета из groupId
const hashStringToIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % GROUP_COLOR_PALETTE.length;
};

// Получить цвет группы по её ID
const getGroupColor = (groupId: string | undefined): string => {
  if (!groupId) return 'transparent';
  return GROUP_COLOR_PALETTE[hashStringToIndex(groupId)] || '#3C50E0';
};

// Вычисляемое свойство: группы, используемые в текущих событиях, с их цветами
const usedGroupsWithColors = computed(() => {
  const groupMap = new Map<string, { id: string; code: string; color: string }>();
  
  for (const event of events.value) {
    if (event.groupId && event.group?.code && !groupMap.has(event.groupId)) {
      groupMap.set(event.groupId, {
        id: event.groupId,
        code: event.group.code,
        color: getGroupColor(event.groupId),
      });
    }
  }
  
  // Сортируем по коду группы
  return Array.from(groupMap.values()).sort((a, b) => a.code.localeCompare(b.code));
});

// Преобразование события для FullCalendar
const transformEventForCalendar = (event: ScheduleEvent): EventInput => {
  const defaultColors = { bg: '#3C50E0', border: '#3C50E0', text: '#ffffff' };
  const colors = eventColors[event.color] ?? defaultColors;
  
  // Формируем заголовок с аудиторией если она указана
  const titleWithClassroom = event.classroom?.name 
    ? `${event.title} (${event.classroom.name})`
    : event.title;
  
  // Получаем цвет группы для полосы слева
  const groupColor = getGroupColor(event.groupId || undefined);
  
  return {
    id: event.id,
    title: titleWithClassroom,
    start: event.startTime,
    end: event.endTime,
    allDay: false,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    // Добавляем класс с data-атрибутом для CSS-стилизации полосы группы
    classNames: event.groupId ? [`group-stripe-${hashStringToIndex(event.groupId)}`] : [],
    extendedProps: {
      description: event.description || undefined,
      groupId: event.groupId || undefined,
      groupCode: event.group?.code,
      groupColor: groupColor,
      instructorId: event.instructorId || undefined,
      instructorName: event.instructor?.fullName,
      classroomId: event.classroomId || undefined,
      classroomName: event.classroom?.name,
      eventType: event.eventType,
      color: event.color,
    },
  };
};

// Обработчики событий календаря
const onEventClick = (arg: EventClickArg) => {
  const event = events.value.find(e => e.id === arg.event.id);
  if (event) {
    selectedEvent.value = event;
    showDetailModal.value = true;
  }
};

const onDateSelect = (arg: DateSelectArg) => {
  editingEvent.value = null;
  
  // Привязка к академическим парам при выборе времени
  const shouldSnap = scheduleSettings.value.snap_to_periods === 'true';
  
  if (shouldSnap && (currentView.value === 'timeGridWeek' || currentView.value === 'timeGridDay')) {
    const startTimeStr = `${String(arg.start.getHours()).padStart(2, '0')}:${String(arg.start.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(arg.end.getHours()).padStart(2, '0')}:${String(arg.end.getMinutes()).padStart(2, '0')}`;
    
    const nearestStartPeriod = getNearestPeriod(startTimeStr);
    const nearestEndPeriod = getPeriodByTime(endTimeStr) || getNearestPeriod(endTimeStr);
    
    if (nearestStartPeriod) {
      const parts = nearestStartPeriod.startTime.split(':').map(Number);
      const startH = parts[0] ?? 0;
      const startM = parts[1] ?? 0;
      arg.start.setHours(startH, startM, 0, 0);
    }
    
    if (nearestEndPeriod) {
      const endParts = nearestEndPeriod.endTime.split(':').map(Number);
      const endH = endParts[0] ?? 0;
      const endM = endParts[1] ?? 0;
      arg.end.setHours(endH, endM, 0, 0);
    }
  }
  
  defaultEventStart.value = arg.start;
  defaultEventEnd.value = arg.end;
  showEventModal.value = true;
};

const onDatesSet = (arg: DatesSetArg) => {
  currentTitle.value = arg.view.title;
  currentView.value = arg.view.type;
  
  const prevRange = currentDateRange.value;
  currentDateRange.value = { start: arg.start, end: arg.end };
  
  // Первая инициализация
  if (!isInitialized.value) {
    isInitialized.value = true;
    // События уже могут быть загружены в onMounted — просто обновляем календарь
    if (events.value.length > 0) {
      updateCalendarEvents();
      return;
    }
  }
  
  // Загружаем только если диапазон изменился
  const rangeChanged = !prevRange || 
    formatDateOnly(arg.start) !== formatDateOnly(prevRange.start) || 
    formatDateOnly(arg.end) !== formatDateOnly(prevRange.end);
  
  if (rangeChanged) {
    loadEvents(arg.start, arg.end);
  }
};

const onEventDrop = async (info: EventDropArg) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  // Проверяем, был ли зажат CTRL - тогда дублируем вместо перемещения
  const isCopyMode = info.jsEvent.ctrlKey || info.jsEvent.metaKey;

  try {
    if (isCopyMode) {
      // Режим копирования - создаём новое событие
      info.revert(); // Возвращаем оригинал на место
      
      const newStartTime = info.event.start ? dateToLocalIsoString(info.event.start) : undefined;
      const newEndTime = info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start!.getTime() + 60 * 60 * 1000));
      
      await authFetch('/api/schedule', {
        method: 'POST',
        body: {
          title: event.title,
          description: event.description,
          groupId: event.groupId,
          disciplineId: event.disciplineId,
          instructorId: event.instructorId,
          classroomId: event.classroomId,
          startTime: newStartTime,
          endTime: newEndTime,
          isAllDay: event.isAllDay,
          color: event.color,
          eventType: event.eventType,
        },
      });

      notification.show({
        type: 'success',
        title: 'Занятие скопировано',
        message: 'Создана копия занятия на новую дату/время',
      });
    } else {
      // Режим перемещения - обновляем существующее событие
      await authFetch(`/api/schedule/${event.id}`, {
        method: 'PUT',
        body: {
          startTime: info.event.start ? dateToLocalIsoString(info.event.start) : undefined,
          endTime: info.event.end ? dateToLocalIsoString(info.event.end) : dateToLocalIsoString(new Date(info.event.start!.getTime() + 60 * 60 * 1000)),
        },
      });

      notification.show({
        type: 'success',
        title: 'Занятие перемещено',
        message: 'Время занятия успешно обновлено',
      });
    }

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось выполнить операцию',
    });
  }
};

const onEventResize = async (info: EventResizeDoneArg) => {
  const event = events.value.find(e => e.id === info.event.id);
  if (!event) return;

  try {
    await authFetch(`/api/schedule/${event.id}`, {
      method: 'PUT',
      body: {
        endTime: info.event.end ? dateToLocalIsoString(info.event.end) : undefined,
      },
    });

    notification.show({
      type: 'success',
      title: 'Занятие обновлено',
      message: 'Длительность занятия успешно изменена',
    });

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error('Error updating event:', error);
    info.revert();
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.data?.statusMessage || 'Не удалось изменить занятие',
    });
  }
};

// Форматирование типа события для tooltip
const getEventTypeLabel = (eventType: string | undefined): string => {
  const types: Record<string, string> = {
    theory: 'Теория',
    practice: 'Практика',
    assessment: 'Аттестация',
    lecture: 'Лекция',
    seminar: 'Семинар',
    exam: 'Экзамен',
    consultation: 'Консультация',
    other: 'Другое',
  };
  return types[eventType || ''] || eventType || 'Занятие';
};

// Создание tooltip при монтировании события
const onEventDidMount = (arg: EventMountArg) => {
  const { event, el } = arg;
  const extendedProps = event.extendedProps;
  
  // Формируем содержимое tooltip
  const parts: string[] = [];
  
  // Название (заголовок)
  parts.push(`<div class="event-tooltip-title">${event.title}</div>`);
  
  // Время
  if (event.start) {
    const startTime = formatTimeOnly(event.start);
    const endTime = event.end ? formatTimeOnly(event.end) : '';
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🕐</span>
      <span class="event-tooltip-text">${startTime}${endTime ? ' – ' + endTime : ''}</span>
    </div>`);
  }
  
  // Группа
  if (extendedProps.groupCode) {
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">👥</span>
      <span class="event-tooltip-text">${extendedProps.groupCode}</span>
    </div>`);
  }
  
  // Инструктор
  if (extendedProps.instructorName) {
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">👨‍🏫</span>
      <span class="event-tooltip-text">${extendedProps.instructorName}</span>
    </div>`);
  }
  
  // Аудитория
  if (extendedProps.classroomName) {
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🚪</span>
      <span class="event-tooltip-text">${extendedProps.classroomName}</span>
    </div>`);
  }
  
  // Тип события
  if (extendedProps.eventType) {
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">📋</span>
      <span class="event-tooltip-text">${getEventTypeLabel(extendedProps.eventType)}</span>
    </div>`);
  }
  
  // Описание (если есть, показываем первые 100 символов)
  if (extendedProps.description) {
    const desc = extendedProps.description.length > 100 
      ? extendedProps.description.substring(0, 100) + '...' 
      : extendedProps.description;
    parts.push(`<div class="event-tooltip-row event-tooltip-description">
      <span class="event-tooltip-text">${desc}</span>
    </div>`);
  }
  
  // Создаём tooltip элемент
  const tooltip = document.createElement('div');
  tooltip.className = 'event-tooltip';
  tooltip.innerHTML = parts.join('');
  
  // Добавляем обработчики
  const showTooltip = (e: MouseEvent) => {
    document.body.appendChild(tooltip);
    
    // Позиционируем tooltip с задержкой для корректного расчёта размеров
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left = e.clientX + 15;
      let top = e.clientY + 15;
      
      // Корректируем если выходит за границы экрана
      if (left + tooltipRect.width > window.innerWidth - 10) {
        left = e.clientX - tooltipRect.width - 15;
      }
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = e.clientY - tooltipRect.height - 15;
      }
      
      // Убеждаемся что tooltip не выходит за левый/верхний край
      left = Math.max(10, left);
      top = Math.max(10, top);
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.classList.add('event-tooltip-visible');
    });
  };
  
  const moveTooltip = (e: MouseEvent) => {
    if (!tooltip.parentNode) return;
    
    const tooltipRect = tooltip.getBoundingClientRect();
    let left = e.clientX + 10;
    let top = e.clientY + 10;
    
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = e.clientX - tooltipRect.width - 10;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = e.clientY - tooltipRect.height - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };
  
  const hideTooltip = () => {
    tooltip.classList.remove('event-tooltip-visible');
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  };
  
  el.addEventListener('mouseenter', showTooltip);
  el.addEventListener('mousemove', moveTooltip);
  el.addEventListener('mouseleave', hideTooltip);
  
  // Сохраняем ссылку для очистки
  (el as any)._tooltipCleanup = () => {
    el.removeEventListener('mouseenter', showTooltip);
    el.removeEventListener('mousemove', moveTooltip);
    el.removeEventListener('mouseleave', hideTooltip);
    hideTooltip();
  };
};

// Вычисляемые настройки календаря на основе академических пар
const slotMinTime = computed(() => {
  const firstStart = getFirstPeriodStart.value;
  // Добавляем буфер в 30 минут до первой пары
  const parts = firstStart.split(':').map(Number);
  const h = parts[0] ?? 9;
  const m = parts[1] ?? 0;
  const bufferMinutes = h * 60 + m - 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.max(0, hours)).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
});

const slotMaxTime = computed(() => {
  const lastEnd = getLastPeriodEnd.value;
  // Добавляем буфер в 30 минут после последней пары
  const parts = lastEnd.split(':').map(Number);
  const h = parts[0] ?? 18;
  const m = parts[1] ?? 20;
  const bufferMinutes = h * 60 + m + 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.min(24, hours)).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
});

// Длительность слота - 10 минут для точной сетки
const slotDuration = computed(() => {
  return '00:10:00';
});

// Интервал меток - каждые 10 минут, но скрываем ненужные через slotLabelContent
const slotLabelInterval = computed(() => {
  return '00:10:00';
});

// Набор времён начала пар для быстрого поиска
const periodStartTimes = computed(() => {
  return new Set(periods.value.map(p => p.startTime));
});

// Набор времён окончания пар (для визуальной границы)
const periodEndTimes = computed(() => {
  return new Set(periods.value.map(p => p.endTime));
});

// Генерация кастомных меток для слотов - показываем ТОЛЬКО для начала пар
const slotLabelContent = (arg: { date: Date; text: string }) => {
  const showNumbers = scheduleSettings.value.show_period_numbers === 'true';
  
  const timeStr = `${String(arg.date.getHours()).padStart(2, '0')}:${String(arg.date.getMinutes()).padStart(2, '0')}`;
  const period = periods.value.find(p => p.startTime === timeStr);
  
  // Если это начало пары - показываем метку
  if (period) {
    if (showNumbers) {
      // Показываем номер пары и время с диапазоном
      return {
        html: `<div class="slot-label-period">
          <span class="period-badge">${period.periodNumber}</span>
          <div class="period-info">
            <span class="period-time-main">${period.startTime}</span>
            <span class="period-time-end">–${period.endTime}</span>
          </div>
        </div>`
      };
    }
    // Просто время начала пары
    return {
      html: `<span class="period-time-start">${arg.text}</span>`
    };
  }
  
  // Для всех остальных слотов - скрываем текст, но оставляем пустой контейнер для структуры
  // Возвращаем пустую строку, чтобы скрыть ненужные метки
  return '';
};

// Привязка событий к академическим парам при перетаскивании
const snapToGrid = (date: Date): Date => {
  const shouldSnap = scheduleSettings.value.snap_to_periods === 'true';
  if (!shouldSnap) return date;
  
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const nearestPeriod = getNearestPeriod(timeStr);
  
  if (nearestPeriod) {
    const parts = nearestPeriod.startTime.split(':').map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    const newDate = new Date(date);
    newDate.setHours(h, m, 0, 0);
    return newDate;
  }
  
  return date;
};

// ДИНАМИЧЕСКИЕ опции календаря - используем computed
const calendarOptions = computed<CalendarOptions>(() => {
  // Длительность пары для привязки при перетаскивании
  const periodDuration = parseInt(scheduleSettings.value.period_duration_minutes || '40', 10);
  const snapDurationValue = `00:${String(periodDuration).padStart(2, '0')}:00`;
  
  // Определяем возможность редактирования на основе прав доступа
  const isEditable = canEditSchedule.value || canCreateSchedule.value;
  
  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: 'dayGridMonth',
    locale: ruLocale,
    headerToolbar: false,
    height: 'auto',
    timeZone: 'local', // Используем локальное время для избежания сдвига дат
    
    // События будут управляться через API календаря
    events: [],
    
    // Блокируем редактирование для пользователей без прав
    editable: isEditable,
    selectable: isEditable,
    selectMirror: isEditable,
    eventStartEditable: isEditable,
    eventDurationEditable: isEditable,
    
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    weekends: true,
    nowIndicator: true,
    slotMinTime: slotMinTime.value,
    slotMaxTime: slotMaxTime.value,
    slotDuration: slotDuration.value,
    slotLabelInterval: slotLabelInterval.value,
    allDaySlot: false,
    
    // Привязка к сетке при перетаскивании - привязываем к длительности пары
    snapDuration: snapDurationValue,
    
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    
    // Кастомные метки слотов с номерами пар
    slotLabelContent,
    
    eventClick: onEventClick,
    select: onDateSelect,
    datesSet: onDatesSet,
    eventDrop: onEventDrop,
    eventResize: onEventResize,
    eventDidMount: onEventDidMount,
  };
});

// Навигация
const handlePrev = () => {
  const api = calendarRef.value?.getApi();
  api?.prev();
};

const handleNext = () => {
  const api = calendarRef.value?.getApi();
  api?.next();
};

const handleToday = () => {
  const api = calendarRef.value?.getApi();
  api?.today();
};

const handleViewChange = (view: string) => {
  currentView.value = view;
  const api = calendarRef.value?.getApi();
  api?.changeView(view);
};

// Загрузка событий
const loadEvents = async (start?: Date, end?: Date) => {
  if (loadingAbortController.value) {
    loadingAbortController.value.abort();
  }
  
  const controller = new AbortController();
  loadingAbortController.value = controller;
  
  loading.value = true;
  
  try {
    const api = calendarRef.value?.getApi();
    const viewStart = start || api?.view.activeStart;
    const viewEnd = end || api?.view.activeEnd;

    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const params = new URLSearchParams();
    params.append('startDate', formatDateOnly(viewStart || defaultStart));
    params.append('endDate', formatDateOnly(viewEnd || defaultEnd));
    if (filters.value.groupId) params.append('groupId', filters.value.groupId);
    if (filters.value.instructorId) params.append('instructorId', filters.value.instructorId);
    if (filters.value.classroomId) params.append('classroomId', filters.value.classroomId);

    const response = await authFetch<{ success: boolean; events: ScheduleEvent[] }>(
      `/api/schedule?${params.toString()}`,
      { signal: controller.signal }
    );

    if (controller.signal.aborted) {
      return;
    }

    if (response.success) {
      events.value = response.events;
      
      // Обновляем события в календаре через API
      updateCalendarEvents();
    }
  } catch (error: any) {
    // Игнорируем ошибки отмены запроса (AbortError или сигнал уже отменён)
    if (error.name === 'AbortError' || controller.signal.aborted) {
      return;
    }
    
    // Игнорируем ошибки если контроллер уже заменён (был новый запрос)
    if (loadingAbortController.value !== controller) {
      return;
    }
    
    console.error('Error loading events:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: 'Не удалось загрузить расписание',
    });
  } finally {
    if (loadingAbortController.value === controller) {
      loading.value = false;
    }
  }
};

// Обновление событий в календаре через API (без дубликатов)
const updateCalendarEvents = () => {
  const api = calendarRef.value?.getApi();
  if (!api) return;
  
  // Сначала удаляем все существующие события
  api.removeAllEvents();
  
  // Затем добавляем новые
  const transformedEvents = events.value.map(transformEventForCalendar);
  transformedEvents.forEach(event => {
    api.addEvent(event);
  });
};

const openAddModal = (start?: Date) => {
  editingEvent.value = null;
  defaultEventStart.value = start || new Date();
  defaultEventEnd.value = new Date((start || new Date()).getTime() + 90 * 60 * 1000);
  showEventModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedEvent.value = null;
};

const handleEditFromDetail = (event: ScheduleEvent) => {
  // Закрываем модальное окно деталей и открываем окно редактирования
  showDetailModal.value = false;
  editingEvent.value = event;
  showEventModal.value = true;
};

const closeEventModal = () => {
  showEventModal.value = false;
  editingEvent.value = null;
  defaultEventStart.value = undefined;
  defaultEventEnd.value = undefined;
};

const handleEventSaved = () => {
  closeEventModal();
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const handleEventDeleted = () => {
  closeEventModal();
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const handleFilterChange = () => {
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const resetFilters = () => {
  filters.value = {
    groupId: '',
    instructorId: '',
    classroomId: '',
  };
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

// Быстрый фильтр по группе из легенды
const toggleGroupFilter = (groupId: string) => {
  if (filters.value.groupId === groupId) {
    // Сбрасываем фильтр при повторном клике
    filters.value.groupId = '';
  } else {
    filters.value.groupId = groupId;
  }
  handleFilterChange();
};

const loadSelectData = async () => {
  try {
    const shouldFetchGroups = canViewAllGroups.value || isTeacher.value;
    const shouldFetchInstructors = canViewInstructors.value || isStudent.value; // Students usually need to see instructors

    const [groupsResponse, instructorsResponse, classroomsResponse] = await Promise.all([
      shouldFetchGroups 
        ? authFetch<{ success: boolean; groups: any[] }>('/api/groups?limit=1000&isActive=true')
        : Promise.resolve({ success: true, groups: [] }),
      shouldFetchInstructors
        ? authFetch<{ success: boolean; instructors: Instructor[] }>('/api/instructors?limit=1000&isActive=true')
        : Promise.resolve({ success: true, instructors: [] }),
      authFetch<{ success: boolean; classrooms: Classroom[] }>('/api/classrooms'),
    ]);

    if (groupsResponse.success && groupsResponse.groups) {
      groups.value = groupsResponse.groups.map(g => ({
        id: g.id,
        code: g.code,
      }));
    }

    if (instructorsResponse.success && instructorsResponse.instructors) {
      instructors.value = instructorsResponse.instructors;
    }

    if (classroomsResponse.success) {
      classrooms.value = classroomsResponse.classrooms;
    }
  } catch (error) {
    console.error('Error loading select data:', error);
  }
};

// Lifecycle
onMounted(async () => {
  // Вычисляем диапазон дат для текущего месяца заранее
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Загружаем ВСЁ параллельно для мгновенной загрузки
  await Promise.all([
    loadScheduleSettings(),
    loadSelectData(),
    // Предзагружаем события для текущего месяца
    loadEvents(monthStart, monthEnd),
  ]);
  
  // Устанавливаем флаг инициализации если FullCalendar ещё не сделал это
  if (!isInitialized.value) {
    isInitialized.value = true;
  }
  
  // Если события загрузились раньше календаря — обновляем когда календарь готов
  nextTick(() => {
    updateCalendarEvents();
  });
});

onUnmounted(() => {
  if (loadingAbortController.value) {
    loadingAbortController.value.abort();
  }
});
</script>

<style>
/* Кастомизация FullCalendar */
.schedule-calendar {
  --fc-border-color: #e2e8f0;
  --fc-today-bg-color: rgba(60, 80, 224, 0.05);
  --fc-neutral-bg-color: transparent;
  --fc-page-bg-color: transparent;
  --fc-event-border-color: transparent;
}

.dark .schedule-calendar {
  --fc-border-color: #3d4d5f;
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: transparent;
  color: #aeb7c0;
}

.schedule-calendar .fc-toolbar-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.schedule-calendar .fc-button {
  background-color: transparent;
  border: 1px solid #e2e8f0;
  color: #374151;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.dark .schedule-calendar .fc-button {
  border-color: #3d4d5f;
  color: #aeb7c0;
}

.schedule-calendar .fc-button:hover {
  background-color: #f3f4f6;
}

.dark .schedule-calendar .fc-button:hover {
  background-color: #313d4a;
}

.schedule-calendar .fc-button-active {
  background-color: #3C50E0 !important;
  color: white !important;
  border-color: #3C50E0 !important;
}

.schedule-calendar .fc-daygrid-day-number,
.schedule-calendar .fc-col-header-cell-cushion {
  color: #374151;
  text-decoration: none;
}

.dark .schedule-calendar .fc-daygrid-day-number,
.dark .schedule-calendar .fc-col-header-cell-cushion {
  color: #aeb7c0;
}

.schedule-calendar .fc-event {
  cursor: pointer;
  border-radius: 4px;
  font-size: 0.8125rem;
  overflow: hidden;
  border: none !important;
  padding: 2px 4px;
}

.schedule-calendar .fc-event:hover {
  opacity: 0.9;
}

.schedule-calendar .fc-timegrid-event {
  border-radius: 4px !important;
  min-height: 20px;
}

.schedule-calendar .fc-timegrid-event .fc-event-main {
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.schedule-calendar .fc-timegrid-event .fc-event-time {
  font-size: 0.75rem;
  font-weight: 600;
}

.schedule-calendar .fc-timegrid-event .fc-event-title {
  font-size: 0.8125rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedule-calendar .fc-timegrid-slot {
  height: 2.5rem;
}

.schedule-calendar .fc-timegrid-slot-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .schedule-calendar .fc-timegrid-slot-label {
  color: #9ca3af;
}

.schedule-calendar .fc-daygrid-day.fc-day-today {
  background-color: rgba(60, 80, 224, 0.05);
}

.schedule-calendar .fc-timegrid-col.fc-day-today {
  background-color: rgba(60, 80, 224, 0.03);
}

.schedule-calendar .fc-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dark .schedule-calendar .fc-list {
  border-color: #3d4d5f;
}

.schedule-calendar .fc-list-day-cushion {
  background-color: #f9fafb;
  padding: 8px 12px;
}

.dark .schedule-calendar .fc-list-day-cushion {
  background-color: #24303f;
}

.schedule-calendar .fc-list-event:hover td {
  background-color: #f3f4f6;
}

.dark .schedule-calendar .fc-list-event:hover td {
  background-color: #313d4a;
}

.schedule-calendar .fc-list-event-title {
  font-weight: 500;
}

.schedule-calendar .fc-list-event-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .schedule-calendar .fc-list-event-time {
  color: #9ca3af;
}

.schedule-calendar .fc-list-event-dot {
  border-radius: 50%;
}

.schedule-calendar .fc-col-header-cell {
  padding: 8px 0;
  font-weight: 600;
}

.schedule-calendar .fc-timegrid-now-indicator-line {
  border-color: #EF4444;
  border-width: 2px;
}

.schedule-calendar .fc-timegrid-now-indicator-arrow {
  border-color: #EF4444;
  border-top-color: transparent;
  border-bottom-color: transparent;
}

.schedule-calendar .fc-popover {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
}

.dark .schedule-calendar .fc-popover {
  background: #1c2434;
  border-color: #3d4d5f;
}

.schedule-calendar .fc-popover-header {
  background: #f9fafb;
  padding: 8px 12px;
  font-weight: 600;
  border-bottom: 1px solid #e2e8f0;
}

.dark .schedule-calendar .fc-popover-header {
  background: #24303f;
  border-color: #3d4d5f;
}

.schedule-calendar .fc-list-empty {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
}

.dark .schedule-calendar .fc-list-empty {
  color: #9ca3af;
}

.schedule-calendar .fc-daygrid-event {
  margin-top: 1px;
  margin-bottom: 1px;
}

.schedule-calendar .fc-daygrid-event .fc-event-main {
  padding: 1px 4px;
}

.schedule-calendar .fc-daygrid-event .fc-event-time {
  font-size: 0.7rem;
  margin-right: 4px;
}

.schedule-calendar .fc-daygrid-event .fc-event-title {
  font-size: 0.75rem;
  font-weight: 500;
}

/* ============================================
   СТИЛИ ДЛЯ АКАДЕМИЧЕСКИХ ПАР В КАЛЕНДАРЕ
   ============================================ */

/* Метки слотов (время начала пар) */
.schedule-calendar .slot-label-period {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  background: rgba(60, 80, 224, 0.08);
  border-radius: 6px;
  margin: 1px 0;
}

.dark .schedule-calendar .slot-label-period {
  background: rgba(60, 80, 224, 0.15);
}

/* Бейдж с номером пары */
.schedule-calendar .period-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #3C50E0 0%, #5B6EF0 100%);
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 2px 4px rgba(60, 80, 224, 0.3);
}

/* Информация о времени пары */
.schedule-calendar .period-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.schedule-calendar .period-time-main {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
}

.dark .schedule-calendar .period-time-main {
  color: #e5e7eb;
}

.schedule-calendar .period-time-end {
  font-size: 0.65rem;
  color: #6b7280;
}

.dark .schedule-calendar .period-time-end {
  color: #9ca3af;
}

/* Время начала пары (без номера) */
.schedule-calendar .period-time-start {
  font-weight: 600;
  color: #3C50E0;
}

.dark .schedule-calendar .period-time-start {
  color: #5B6EF0;
}

/* Расширяем слоты с метками для лучшего отображения */
.schedule-calendar .fc-timegrid-slot-label-frame {
  min-width: 75px;
}

/* Скрываем пустые метки (промежуточные слоты) */
.schedule-calendar .fc-timegrid-slot-label-cushion:empty {
  display: none;
}

/* Улучшенная граница между периодами */
.schedule-calendar .fc-timegrid-slot {
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.dark .schedule-calendar .fc-timegrid-slot {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

/* Выделяем строки с номерами пар */
.schedule-calendar .fc-timegrid-slot-label:has(.slot-label-period) {
  background: transparent !important;
}

.schedule-calendar .fc-timegrid-slot-label:has(.slot-label-period) + td.fc-timegrid-slot-lane,
.schedule-calendar .fc-timegrid-slot:has(.slot-label-period) ~ .fc-timegrid-slot-lane {
  border-top: 1px solid rgba(60, 80, 224, 0.2) !important;
}

/* ============================================
   РАЗДЕЛИТЕЛЬ БОЛЬШОГО ПЕРЕРЫВА (ОБЕД)
   ============================================ */

/* Визуальное разделение после большого перерыва - 7 пара в 14:00 */
.schedule-calendar .fc-timegrid-slot[data-time="14:00:00"],
.schedule-calendar .fc-timegrid-slot-lane[data-time="14:00:00"] {
  border-top: 3px solid #f59e0b !important;
  position: relative;
}

/* Метка перерыва после 6й пары */
.schedule-calendar .fc-timegrid-slot-label[data-time="13:20:00"]::after {
  content: '🍽️ Обед';
  display: block;
  font-size: 0.6rem;
  color: #f59e0b;
  font-weight: 600;
  margin-top: 4px;
  padding: 2px 4px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 4px;
}

/* ============================================
   УСТАРЕВШИЕ СТИЛИ (для обратной совместимости)
   ============================================ */

/* Старые кастомные метки */
.schedule-calendar .slot-label-custom {
  display: flex;
  align-items: center;
  gap: 6px;
}

.schedule-calendar .slot-label-custom .period-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3C50E0 0%, #5B6EF0 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.schedule-calendar .slot-label-custom .period-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.dark .schedule-calendar .slot-label-custom .period-time {
  color: #9ca3af;
}

/* ============================================
   ЦВЕТОВАЯ ПОЛОСА ГРУППЫ НА СОБЫТИЯХ
   ============================================ */

/* Базовый стиль для событий с полосой группы */
.schedule-calendar .fc-event[class*="group-stripe-"] {
  position: relative;
  overflow: visible;
  border-left: 4px solid transparent !important;
  margin-left: 0 !important;
}

/* Цвета полос для каждой группы (соответствуют GROUP_COLOR_PALETTE) */
.schedule-calendar .fc-event.group-stripe-0 { border-left-color: #E91E63 !important; } /* Розовый */
.schedule-calendar .fc-event.group-stripe-1 { border-left-color: #9C27B0 !important; } /* Фиолетовый */
.schedule-calendar .fc-event.group-stripe-2 { border-left-color: #673AB7 !important; } /* Глубокий фиолетовый */
.schedule-calendar .fc-event.group-stripe-3 { border-left-color: #3F51B5 !important; } /* Индиго */
.schedule-calendar .fc-event.group-stripe-4 { border-left-color: #2196F3 !important; } /* Синий */
.schedule-calendar .fc-event.group-stripe-5 { border-left-color: #00BCD4 !important; } /* Циан */
.schedule-calendar .fc-event.group-stripe-6 { border-left-color: #009688 !important; } /* Бирюзовый */
.schedule-calendar .fc-event.group-stripe-7 { border-left-color: #4CAF50 !important; } /* Зелёный */
.schedule-calendar .fc-event.group-stripe-8 { border-left-color: #8BC34A !important; } /* Лаймовый */
.schedule-calendar .fc-event.group-stripe-9 { border-left-color: #FF9800 !important; } /* Оранжевый */
.schedule-calendar .fc-event.group-stripe-10 { border-left-color: #FF5722 !important; } /* Глубокий оранжевый */
.schedule-calendar .fc-event.group-stripe-11 { border-left-color: #795548 !important; } /* Коричневый */

/* Стили для дневного/недельного вида - более заметная полоса */
.schedule-calendar .fc-timegrid-event[class*="group-stripe-"] {
  border-left-width: 5px !important;
  border-radius: 0 4px 4px 0 !important;
}

/* Стили для месячного вида */
.schedule-calendar .fc-daygrid-event[class*="group-stripe-"] {
  border-left-width: 4px !important;
  border-radius: 0 4px 4px 0 !important;
}

/* Стили для списка */
.schedule-calendar .fc-list-event[class*="group-stripe-"] td:first-child {
  position: relative;
}

.schedule-calendar .fc-list-event[class*="group-stripe-"] td:first-child::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.schedule-calendar .fc-list-event.group-stripe-0 td:first-child::before { background-color: #E91E63; }
.schedule-calendar .fc-list-event.group-stripe-1 td:first-child::before { background-color: #9C27B0; }
.schedule-calendar .fc-list-event.group-stripe-2 td:first-child::before { background-color: #673AB7; }
.schedule-calendar .fc-list-event.group-stripe-3 td:first-child::before { background-color: #3F51B5; }
.schedule-calendar .fc-list-event.group-stripe-4 td:first-child::before { background-color: #2196F3; }
.schedule-calendar .fc-list-event.group-stripe-5 td:first-child::before { background-color: #00BCD4; }
.schedule-calendar .fc-list-event.group-stripe-6 td:first-child::before { background-color: #009688; }
.schedule-calendar .fc-list-event.group-stripe-7 td:first-child::before { background-color: #4CAF50; }
.schedule-calendar .fc-list-event.group-stripe-8 td:first-child::before { background-color: #8BC34A; }
.schedule-calendar .fc-list-event.group-stripe-9 td:first-child::before { background-color: #FF9800; }
.schedule-calendar .fc-list-event.group-stripe-10 td:first-child::before { background-color: #FF5722; }
.schedule-calendar .fc-list-event.group-stripe-11 td:first-child::before { background-color: #795548; }

/* Hover эффект - подсветка полосы */
.schedule-calendar .fc-event[class*="group-stripe-"]:hover {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.2);
}

/* ============================================
   TOOLTIP ДЛЯ СОБЫТИЙ КАЛЕНДАРЯ
   ============================================ */

.event-tooltip {
  position: fixed;
  z-index: 99999;
  min-width: 220px;
  max-width: 320px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.12),
    0 8px 32px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dark .event-tooltip {
  background: linear-gradient(135deg, rgba(36, 48, 63, 0.95) 0%, rgba(28, 36, 52, 0.98) 100%);
  border-color: rgba(61, 77, 95, 0.8);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.event-tooltip-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Заголовок tooltip */
.event-tooltip-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  line-height: 1.4;
}

.dark .event-tooltip-title {
  color: #f1f5f9;
  border-bottom-color: rgba(61, 77, 95, 0.6);
}

/* Строка информации */
.event-tooltip-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 5px 0;
}

.event-tooltip-row:last-child {
  padding-bottom: 0;
}

/* Иконка */
.event-tooltip-icon {
  flex-shrink: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  width: 20px;
  text-align: center;
}

/* Текст */
.event-tooltip-text {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.5;
  word-break: break-word;
}

.dark .event-tooltip-text {
  color: #cbd5e1;
}

/* Описание */
.event-tooltip-description {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(148, 163, 184, 0.3);
}

.event-tooltip-description .event-tooltip-text {
  font-size: 0.75rem;
  color: #64748b;
  font-style: italic;
}

.dark .event-tooltip-description .event-tooltip-text {
  color: #94a3b8;
}
</style>

