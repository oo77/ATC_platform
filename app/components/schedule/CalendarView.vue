<template>
  <div class="calendar-wrapper">
    <!-- Верхняя панель управления -->
    <div
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
    >
      <div class="flex items-center gap-3">
        <!-- Навигация по датам -->
        <button
          @click="handlePrev"
          class="p-2 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition-colors"
          title="Назад"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
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
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <!-- Кнопка добавления события -->
        <UiButton
          v-if="canCreateSchedule"
          @click="openAddModal()"
          class="flex items-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Добавить занятие
        </UiButton>
      </div>

      <!-- Заголовок с текущей датой -->
      <h2
        class="text-xl font-semibold text-black dark:text-white order-first sm:order-0"
      >
        {{ currentTitle }}
      </h2>

      <!-- Переключатель видов -->
      <div
        class="flex rounded-lg border border-stroke dark:border-strokedark overflow-hidden"
      >
        <button
          v-for="view in viewOptions"
          :key="view.value"
          @click="handleViewChange(view.value)"
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="[
            currentView === view.value
              ? 'bg-primary text-white'
              : 'bg-white dark:bg-boxdark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4',
          ]"
        >
          {{ view.label }}
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div
      class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 mb-6"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Фильтр по группе -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
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
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Фильтр по инструктору -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Инструктор
          </label>
          <div class="relative">
            <select
              v-model="filters.instructorId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все инструкторы</option>
              <option
                v-for="instructor in instructors"
                :key="instructor.id"
                :value="instructor.id"
              >
                {{ instructor.fullName }}
              </option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Фильтр по аудитории -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Аудитория
          </label>
          <div class="relative">
            <select
              v-model="filters.classroomId"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все аудитории</option>
              <option
                v-for="classroom in classrooms"
                :key="classroom.id"
                :value="classroom.id"
              >
                {{ classroom.name }}
              </option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <!-- Фильтр по типу занятия -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Тип занятия
          </label>
          <div class="relative">
            <select
              v-model="filters.eventType"
              @change="handleFilterChange"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
            >
              <option value="">Все типы</option>
              <option value="theory">Теория</option>
              <option value="practice">Практика</option>
              <option value="assessment">Проверка знаний</option>
              <option value="other">Другое</option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
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
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <div
      class="bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark p-4 relative min-h-[500px]"
    >
      <!-- Overlay загрузки поверх календаря -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 z-10 flex items-center justify-center rounded-lg"
      >
        <div class="flex items-center gap-3">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
          <span class="text-gray-600 dark:text-gray-400"
            >Загрузка расписания...</span
          >
        </div>
      </div>

      <!-- Подсказка о горячих клавишах и кнопка массовых действий -->
      <div
        class="mb-2 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <span
            >💡
            <kbd
              class="px-1 py-0.5 bg-gray-100 dark:bg-meta-4 rounded text-[10px]"
              >CTRL</kbd
            >
            + перетаскивание = копирование занятия</span
          >
        </div>

        <!-- Кнопка массовых действий (только в списочном режиме) -->
        <div
          v-if="currentView === 'listWeek' && canEditSchedule"
          class="flex items-center gap-2"
        >
          <button
            v-if="!bulkSelectionMode"
            @click="enableBulkSelection"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Действия
          </button>
          <template v-else>
            <span class="text-gray-500">
              Выбрано:
              <strong class="text-primary">{{ selectedEventIds.size }}</strong>
            </span>
            <button
              v-if="filteredEvents.length > 0"
              @click="selectAllVisible"
              class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Выбрать все
            </button>
            <button
              @click="disableBulkSelection"
              class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-danger transition-colors"
            >
              Отмена
            </button>
          </template>

          <!-- Кнопка применения шаблона -->
          <button
            @click="showApplyTemplateModal = true"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-success bg-success/10 hover:bg-success/20 rounded-lg transition-colors"
            title="Применить сохранённый шаблон"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Шаблоны
          </button>
        </div>
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
          <svg
            class="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
            >Группы:</span
          >
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="group in usedGroupsWithColors"
            :key="group.id"
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
            :class="[
              filters.groupId === group.id
                ? 'ring-2 ring-offset-2 ring-primary dark:ring-offset-boxdark'
                : 'hover:bg-gray-100 dark:hover:bg-meta-4',
            ]"
            :style="{
              backgroundColor:
                filters.groupId === group.id
                  ? group.color + '20'
                  : 'transparent',
              color: filters.groupId === group.id ? group.color : undefined,
            }"
            @click="toggleGroupFilter(group.id)"
            :title="
              filters.groupId === group.id
                ? 'Нажмите, чтобы сбросить фильтр'
                : 'Нажмите, чтобы фильтровать по группе'
            "
          >
            <span
              class="w-3 h-3 rounded-full shrink-0 shadow-sm"
              :style="{ backgroundColor: group.color }"
            ></span>
            <span class="text-gray-700 dark:text-gray-300">{{
              group.code
            }}</span>
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
      @retake="handleRetakeFromDetail"
      @deleted="handleEventDeleted"
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

    <!-- Модальное окно создания/редактирования пересдачи -->
    <ScheduleRetakeModal
      :is-open="showRetakeModal"
      :original-event="retakeOriginalEvent"
      :retake-event="editingRetakeEvent"
      @close="closeRetakeModal"
      @created="handleRetakeCreated"
      @updated="handleRetakeUpdated"
    />

    <!-- Плавающая панель массовых действий -->
    <ScheduleBulkActionsPanel
      :selected-count="selectedEventIds.size"
      :can-create-template="canCreateTemplateFromSelection"
      @copy="showCopyEventsModal = true"
      @move="showMoveEventsModal = true"
      @create-template="showCreateTemplateModal = true"
      @delete="showBulkDeleteModal = true"
      @cancel="disableBulkSelection"
    />

    <!-- Модальное окно копирования занятий -->
    <ScheduleCopyEventsModal
      :is-open="showCopyEventsModal"
      :selected-events="selectedEventsArray"
      @close="showCopyEventsModal = false"
      @copied="handleBulkCopied"
    />

    <!-- Модальное окно перемещения занятий -->
    <ScheduleMoveEventsModal
      :is-open="showMoveEventsModal"
      :selected-events="selectedEventsArray"
      @close="showMoveEventsModal = false"
      @moved="handleBulkMoved"
    />

    <!-- Модальное окно создания шаблона -->
    <ScheduleCreateTemplateModal
      :is-open="showCreateTemplateModal"
      :selected-events="selectedEventsArray"
      :group-info="selectedEventsGroupInfo"
      @close="showCreateTemplateModal = false"
      @created="handleTemplateCreated"
    />

    <!-- Модальное окно применения шаблона -->
    <ScheduleApplyTemplateModal
      :is-open="showApplyTemplateModal"
      :groups="groups"
      :instructors="instructors"
      @close="showApplyTemplateModal = false"
      @applied="handleTemplateApplied"
    />

    <!-- Модальное окно массового удаления -->
    <ScheduleBulkDeleteModal
      :is-open="showBulkDeleteModal"
      :selected-events="selectedEventsArray"
      @close="showBulkDeleteModal = false"
      @deleted="handleBulkDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import ruLocale from "@fullcalendar/core/locales/ru";
import type {
  CalendarOptions,
  EventInput,
  EventClickArg,
  DateSelectArg,
  DatesSetArg,
  EventDropArg,
  EventMountArg,
} from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import type { ScheduleEvent } from "~/types/schedule";
import {
  dateToLocalIsoString,
  formatDateOnly,
  formatTimeOnly,
} from "~/utils/dateTime";

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
const { user } = useAuth();

// Проверка прав доступа
const {
  canCreateSchedule,
  canEditSchedule,
  canDeleteSchedule,
  isTeacher,
  isStudent,
  canViewAllGroups,
  canViewInstructors,
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
const currentView = ref("dayGridMonth");
const currentTitle = ref("");
const showEventModal = ref(false);
const showDetailModal = ref(false);
const showRetakeModal = ref(false);
const selectedEvent = ref<ScheduleEvent | null>(null);
const editingEvent = ref<ScheduleEvent | null>(null);
const retakeOriginalEvent = ref<any | null>(null);
const editingRetakeEvent = ref<any | null>(null); // Для редактирования пересдачи
const defaultEventStart = ref<Date | undefined>(undefined);
const defaultEventEnd = ref<Date | undefined>(undefined);

// Храним текущий диапазон дат
const currentDateRange = ref<{ start: Date; end: Date } | null>(null);

const filters = ref({
  groupId: "",
  instructorId: "",
  classroomId: "",
  eventType: "",
});

// ============ РЕЖИМ МАССОВОГО ВЫБОРА ============
const bulkSelectionMode = ref(false);
const selectedEventIds = ref<Set<string>>(new Set());
const showCopyEventsModal = ref(false);
const showMoveEventsModal = ref(false);
const showCreateTemplateModal = ref(false);
const showApplyTemplateModal = ref(false);
const showBulkDeleteModal = ref(false);

// Computed
const hasActiveFilters = computed(() => {
  return (
    filters.value.groupId ||
    filters.value.instructorId ||
    filters.value.classroomId ||
    filters.value.eventType
  );
});

const viewOptions = [
  { value: "dayGridMonth", label: "Месяц" },
  { value: "timeGridWeek", label: "Неделя" },
  { value: "timeGridDay", label: "День" },
  { value: "listWeek", label: "Список" },
];

// ============ COMPUTED ДЛЯ МАССОВЫХ ОПЕРАЦИЙ ============

// Отфильтрованные события (для выбора всех видимых)
const filteredEvents = computed(() => {
  return events.value.filter((event) => {
    if (filters.value.groupId && event.groupId !== filters.value.groupId) {
      return false;
    }
    if (
      filters.value.instructorId &&
      event.instructorId !== filters.value.instructorId
    ) {
      return false;
    }
    if (
      filters.value.classroomId &&
      event.classroomId !== filters.value.classroomId
    ) {
      return false;
    }
    if (
      filters.value.eventType &&
      event.eventType !== filters.value.eventType
    ) {
      return false;
    }
    return true;
  });
});

// Массив выбранных событий
const selectedEventsArray = computed(() => {
  return events.value.filter((e) => selectedEventIds.value.has(e.id));
});

// Можно ли создать шаблон (все выбранные занятия из одной группы)
const canCreateTemplateFromSelection = computed(() => {
  const selected = selectedEventsArray.value;
  if (selected.length === 0) return false;

  const groupIds = new Set(selected.map((e) => e.groupId).filter(Boolean));
  return groupIds.size === 1;
});

// Информация о группе выбранных занятий (для создания шаблона)
const selectedEventsGroupInfo = computed(() => {
  const selected = selectedEventsArray.value;
  if (selected.length === 0) return null;

  const firstWithGroup = selected.find((e) => e.groupId && e.group);
  if (!firstWithGroup || !firstWithGroup.groupId || !firstWithGroup.group)
    return null;

  return {
    id: firstWithGroup.groupId,
    code: firstWithGroup.group.code,
  };
});

// Цвета событий (по типу)
const eventColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  primary: { bg: "#3C50E0", border: "#3C50E0", text: "#ffffff" },
  success: { bg: "#10B981", border: "#10B981", text: "#ffffff" },
  warning: { bg: "#F59E0B", border: "#F59E0B", text: "#ffffff" },
  danger: { bg: "#EF4444", border: "#EF4444", text: "#ffffff" },
};

// Палитра цветов для групп (12 контрастных цветов)
const GROUP_COLOR_PALETTE = [
  "#E91E63", // Розовый
  "#9C27B0", // Фиолетовый
  "#673AB7", // Глубокий фиолетовый
  "#3F51B5", // Индиго
  "#2196F3", // Синий
  "#00BCD4", // Циан
  "#009688", // Бирюзовый
  "#4CAF50", // Зелёный
  "#8BC34A", // Лаймовый
  "#FF9800", // Оранжевый
  "#FF5722", // Глубокий оранжевый
  "#795548", // Коричневый
];

// Хеш-функция для генерации индекса цвета из groupId
const hashStringToIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % GROUP_COLOR_PALETTE.length;
};

// Получить цвет группы по её ID
const getGroupColor = (groupId: string | undefined): string => {
  if (!groupId) return "transparent";
  return GROUP_COLOR_PALETTE[hashStringToIndex(groupId)] || "#3C50E0";
};

// Вычисляемое свойство: группы, используемые в текущих событиях, с их цветами
const usedGroupsWithColors = computed(() => {
  const groupMap = new Map<
    string,
    { id: string; code: string; color: string }
  >();

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
  return Array.from(groupMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
});

// Преобразование события для FullCalendar
const transformEventForCalendar = (event: ScheduleEvent): EventInput => {
  const defaultColors = { bg: "#3C50E0", border: "#3C50E0", text: "#ffffff" };
  const colors = eventColors[event.color] ?? defaultColors;

  // Проверяем, является ли это перездачей
  const isRetake =
    (event.allowedStudentIds && event.allowedStudentIds.length > 0) ||
    event.originalEventId;

  // Формируем заголовок с аудиторией если она указана
  let titleWithClassroom = event.classroom?.name
    ? `${event.title} (${event.classroom.name})`
    : event.title;

  // Добавляем иконку перездачи к заголовку
  if (isRetake) {
    titleWithClassroom = `🔄 ${titleWithClassroom}`;
  }

  // Получаем цвет группы для полосы слева
  const groupColor = getGroupColor(event.groupId || undefined);

  // Определяем CSS-классы
  const classNames = [];
  if (event.groupId) {
    classNames.push(`group-stripe-${hashStringToIndex(event.groupId)}`);
  }
  if (isRetake) {
    classNames.push("event-retake");
  }

  const isArchivedGroup = event.group?.isArchived;

  if (isArchivedGroup) {
    titleWithClassroom = `🔒 ${titleWithClassroom}`;
    classNames.push("opacity-75", "cursor-not-allowed");
  }

  return {
    id: event.id,
    title: titleWithClassroom,
    start: event.startTime,
    end: event.endTime,
    allDay: false,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    textColor: colors.text,
    editable: !isArchivedGroup,
    startEditable: !isArchivedGroup,
    durationEditable: !isArchivedGroup,
    // Добавляем класс с data-атрибутом для CSS-стилизации полосы группы
    classNames: classNames,
    extendedProps: {
      description: event.description || undefined,
      groupId: event.groupId || undefined,
      groupCode: event.group?.code,
      groupColor: groupColor,
      isGroupArchived: isArchivedGroup,
      instructorId: event.instructorId || undefined,
      instructorName: event.instructor?.fullName,
      classroomId: event.classroomId || undefined,
      classroomName: event.classroom?.name,
      eventType: event.eventType,
      color: event.color,
      isRetake: isRetake,
      allowedStudentIds: event.allowedStudentIds,
      originalEventId: event.originalEventId,
      academicHours: event.academicHours,
      durationMinutes: event.durationMinutes,
    },
  };
};

// Обработчики событий календаря
const onEventClick = (arg: EventClickArg) => {
  const event = events.value.find((e) => e.id === arg.event.id);
  if (event) {
    selectedEvent.value = event;
    showDetailModal.value = true;
  }
};

const onDateSelect = (arg: DateSelectArg) => {
  editingEvent.value = null;

  // Привязка к академическим парам при выборе времени
  const shouldSnap = scheduleSettings.value.snap_to_periods === "true";

  if (
    shouldSnap &&
    (currentView.value === "timeGridWeek" ||
      currentView.value === "timeGridDay")
  ) {
    const startTimeStr = `${String(arg.start.getHours()).padStart(
      2,
      "0",
    )}:${String(arg.start.getMinutes()).padStart(2, "0")}`;
    const endTimeStr = `${String(arg.end.getHours()).padStart(2, "0")}:${String(
      arg.end.getMinutes(),
    ).padStart(2, "0")}`;

    const nearestStartPeriod = getNearestPeriod(startTimeStr);
    const nearestEndPeriod =
      getPeriodByTime(endTimeStr) || getNearestPeriod(endTimeStr);

    if (nearestStartPeriod) {
      const parts = nearestStartPeriod.startTime.split(":").map(Number);
      const startH = parts[0] ?? 0;
      const startM = parts[1] ?? 0;
      arg.start.setHours(startH, startM, 0, 0);
    }

    if (nearestEndPeriod) {
      const endParts = nearestEndPeriod.endTime.split(":").map(Number);
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
  const rangeChanged =
    !prevRange ||
    formatDateOnly(arg.start) !== formatDateOnly(prevRange.start) ||
    formatDateOnly(arg.end) !== formatDateOnly(prevRange.end);

  if (rangeChanged) {
    loadEvents(arg.start, arg.end);
  }
};

const onEventDrop = async (info: EventDropArg) => {
  const event = events.value.find((e) => e.id === info.event.id);
  if (!event) return;

  if (event.group?.isArchived) {
    info.revert();
    notification.show({
      type: "error",
      title: "Ошибка",
      message: "Нельзя изменять события архивной группы",
    });
    return;
  }

  // Проверяем, был ли зажат CTRL - тогда дублируем вместо перемещения
  const isCopyMode = info.jsEvent.ctrlKey || info.jsEvent.metaKey;

  try {
    if (isCopyMode) {
      // Режим копирования - создаём новое событие
      info.revert(); // Возвращаем оригинал на место

      const newStartTime = info.event.start
        ? dateToLocalIsoString(info.event.start)
        : undefined;
      const newEndTime = info.event.end
        ? dateToLocalIsoString(info.event.end)
        : dateToLocalIsoString(
            new Date(info.event.start!.getTime() + 60 * 60 * 1000),
          );

      // Используем сохраненное значение durationMinutes из события, если оно есть
      // Иначе вычисляем на основе общего времени (для обратной совместимости)
      let durationMinutes: number;

      if (event.durationMinutes && event.durationMinutes > 0) {
        // Используем сохраненное чистое время без перерывов
        durationMinutes = event.durationMinutes;
      } else {
        // Fallback: вычисляем на основе общего времени
        const originalStartTime = new Date(event.startTime);
        const originalEndTime = new Date(event.endTime);
        const originalDurationMs =
          originalEndTime.getTime() - originalStartTime.getTime();
        const originalDurationMinutes = originalDurationMs / (1000 * 60);

        const periodDurationMinutes = parseInt(
          scheduleSettings.value.period_duration_minutes || "40",
          10,
        );

        const numberOfPairs = Math.ceil(
          originalDurationMinutes / periodDurationMinutes,
        );
        durationMinutes = numberOfPairs * periodDurationMinutes;
      }

      await authFetch("/api/schedule", {
        method: "POST",
        body: {
          title: event.title,
          description: event.description,
          groupId: event.groupId,
          disciplineId: event.disciplineId,
          instructorId: event.instructorId,
          classroomId: event.classroomId,
          startTime: newStartTime,
          endTime: newEndTime,
          durationMinutes, // Передаем чистую длительность без перерывов (fallback)
          academicHours: event.academicHours, // Передаем количество а-ч напрямую
          isAllDay: event.isAllDay,
          color: event.color,
          eventType: event.eventType,
        },
      });

      notification.show({
        type: "success",
        title: "Занятие скопировано",
        message: "Создана копия занятия на новую дату/время",
      });
    } else {
      // Режим перемещения - обновляем существующее событие

      // Используем сохраненное значение durationMinutes из события, если оно есть
      // Иначе вычисляем на основе общего времени (для обратной совместимости)
      let durationMinutes: number;

      if (event.durationMinutes && event.durationMinutes > 0) {
        // Используем сохраненное чистое время без перерывов
        durationMinutes = event.durationMinutes;
      } else {
        // Fallback: вычисляем на основе общего времени
        const originalStartTime = new Date(event.startTime);
        const originalEndTime = new Date(event.endTime);
        const originalDurationMs =
          originalEndTime.getTime() - originalStartTime.getTime();
        const originalDurationMinutes = originalDurationMs / (1000 * 60);

        const periodDurationMinutes = parseInt(
          scheduleSettings.value.period_duration_minutes || "40",
          10,
        );

        const numberOfPairs = Math.ceil(
          originalDurationMinutes / periodDurationMinutes,
        );
        durationMinutes = numberOfPairs * periodDurationMinutes;
      }

      await authFetch(`/api/schedule/${event.id}`, {
        method: "PUT",
        body: {
          startTime: info.event.start
            ? dateToLocalIsoString(info.event.start)
            : undefined,
          endTime: info.event.end
            ? dateToLocalIsoString(info.event.end)
            : dateToLocalIsoString(
                new Date(info.event.start!.getTime() + 60 * 60 * 1000),
              ),
          durationMinutes, // Передаем чистую длительность без перерывов (fallback)
          academicHours: event.academicHours, // Передаем количество а-ч напрямую
        },
      });

      notification.show({
        type: "success",
        title: "Занятие перемещено",
        message: "Время занятия успешно обновлено",
      });
    }

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error("Error updating event:", error);
    info.revert();
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось выполнить операцию",
    });
  }
};

const onEventResize = async (info: EventResizeDoneArg) => {
  const event = events.value.find((e) => e.id === info.event.id);
  if (!event) return;

  if (event.group?.isArchived) {
    info.revert();
    notification.show({
      type: "error",
      title: "Ошибка",
      message: "Нельзя изменять события архивной группы",
    });
    return;
  }

  try {
    // Вычисляем новую длительность в минутах
    const newStartTime = info.event.start || new Date(event.startTime);
    const newEndTime = info.event.end || new Date(event.endTime);
    const newDurationMs = newEndTime.getTime() - newStartTime.getTime();
    const newDurationMinutes = newDurationMs / (1000 * 60);

    // Вычисляем количество пар
    const periodDurationMinutes = parseInt(
      scheduleSettings.value.period_duration_minutes || "40",
      10,
    );

    const numberOfPairs = Math.ceil(newDurationMinutes / periodDurationMinutes);
    const durationMinutes = numberOfPairs * periodDurationMinutes;

    await authFetch(`/api/schedule/${event.id}`, {
      method: "PUT",
      body: {
        endTime: info.event.end
          ? dateToLocalIsoString(info.event.end)
          : undefined,
        durationMinutes, // Передаем чистую длительность без перерывов (fallback)
        academicHours: numberOfPairs, // Передаем рассчитанное количество а-ч
      },
    });

    notification.show({
      type: "success",
      title: "Занятие обновлено",
      message: "Длительность занятия успешно изменена",
    });

    if (currentDateRange.value) {
      loadEvents(currentDateRange.value.start, currentDateRange.value.end);
    }
  } catch (error: any) {
    console.error("Error updating event:", error);
    info.revert();
    notification.show({
      type: "error",
      title: "Ошибка",
      message: error.data?.statusMessage || "Не удалось изменить занятие",
    });
  }
};

// Форматирование типа события для tooltip
const getEventTypeLabel = (eventType: string | undefined): string => {
  const types: Record<string, string> = {
    theory: "Теория",
    practice: "Практика",
    assessment: "Аттестация",
    lecture: "Лекция",
    seminar: "Семинар",
    exam: "Экзамен",
    consultation: "Консультация",
    other: "Другое",
  };
  return types[eventType || ""] || eventType || "Занятие";
};

// Вспомогательная функция для очистки всех висящих подсказок в DOM
const cleanupAllTooltips = () => {
  if (typeof document === "undefined") return;
  const tooltips = document.querySelectorAll(".event-tooltip");
  tooltips.forEach((t) => t.remove());
};

// Создание tooltip при монтировании события
const onEventDidMount = (arg: EventMountArg) => {
  const { event, el } = arg;
  const extendedProps = event.extendedProps;

  // ============ ЧЕКБОКСЫ В РЕЖИМЕ МАССОВОГО ВЫБОРА ============
  // Добавляем чекбокс только в режиме списка и при включенном режиме выбора
  if (bulkSelectionMode.value && currentView.value === "listWeek") {
    const eventId = event.id;
    const isSelected = selectedEventIds.value.has(eventId);

    // Создаём контейнер для чекбокса
    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "bulk-select-checkbox";
    checkboxContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      margin-right: 8px;
      cursor: pointer;
      flex-shrink: 0;
    `;

    // Создаём чекбокс
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = isSelected;
    checkbox.className = "bulk-event-checkbox";
    checkbox.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: #3C50E0;
      cursor: pointer;
    `;

    // Обработчик клика на чекбокс
    checkbox.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleEventSelection(eventId);
      checkbox.checked = selectedEventIds.value.has(eventId);
    });

    checkboxContainer.appendChild(checkbox);

    // Вставляем чекбокс в начало события
    // В режиме списка структура: fc-list-event > td.fc-list-event-time, td.fc-list-event-graphic, td.fc-list-event-title
    const titleCell = el.querySelector(".fc-list-event-title");
    if (titleCell) {
      titleCell.insertBefore(checkboxContainer, titleCell.firstChild);

      // Добавляем стиль выделения
      if (isSelected) {
        el.classList.add("bulk-selected");
        (el as HTMLElement).style.backgroundColor = "rgba(60, 80, 224, 0.1)";
      }
    }

    // Сохраняем ссылку на чекбокс для обновления
    (el as any)._bulkCheckbox = checkbox;
  }

  // Формируем содержимое tooltip
  const parts: string[] = [];

  // Название (заголовок)
  parts.push(`<div class="event-tooltip-title">${event.title}</div>`);

  // Время
  if (event.start) {
    const startTime = formatTimeOnly(event.start);
    const endTime = event.end ? formatTimeOnly(event.end) : "";
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🕐</span>
      <span class="event-tooltip-text">${startTime}${
        endTime ? " – " + endTime : ""
      }</span>
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
      <span class="event-tooltip-text">${getEventTypeLabel(
        extendedProps.eventType,
      )}</span>
    </div>`);
  }

  // Индикатор перездачи
  if (extendedProps.isRetake) {
    parts.push(`<div class="event-tooltip-row">
      <span class="event-tooltip-icon">🔄</span>
      <span class="event-tooltip-text" style="color: #9333ea; font-weight: 600;">Перездача</span>
    </div>`);
  }

  // Описание (если есть, показываем первые 100 символов)
  if (extendedProps.description) {
    const desc =
      extendedProps.description.length > 100
        ? extendedProps.description.substring(0, 100) + "..."
        : extendedProps.description;
    parts.push(`<div class="event-tooltip-row event-tooltip-description">
      <span class="event-tooltip-text">${desc}</span>
    </div>`);
  }

  // Создаём tooltip элемент
  const tooltip = document.createElement("div");
  tooltip.className = "event-tooltip";
  tooltip.innerHTML = parts.join("");

  // Добавляем обработчики
  const showTooltip = (e: MouseEvent) => {
    // Сначала гарантированно очищаем любые предыдущие тултипы
    cleanupAllTooltips();
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
      tooltip.classList.add("event-tooltip-visible");
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

    left = Math.max(10, left);
    top = Math.max(10, top);

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hideTooltip = () => {
    tooltip.classList.remove("event-tooltip-visible");
    if (tooltip.parentNode) {
      tooltip.parentNode.removeChild(tooltip);
    }
  };

  el.addEventListener("mouseenter", showTooltip);
  el.addEventListener("mousemove", moveTooltip);
  el.addEventListener("mouseleave", hideTooltip);
  el.addEventListener("mousedown", hideTooltip);
  el.addEventListener("click", hideTooltip);

  // Сохраняем ссылку для очистки
  (el as any)._tooltipCleanup = () => {
    el.removeEventListener("mouseenter", showTooltip);
    el.removeEventListener("mousemove", moveTooltip);
    el.removeEventListener("mouseleave", hideTooltip);
    el.removeEventListener("mousedown", hideTooltip);
    el.removeEventListener("click", hideTooltip);
    hideTooltip();
  };
};

// Вычисляемые настройки календаря на основе академических пар
const slotMinTime = computed(() => {
  const firstStart = getFirstPeriodStart.value;
  // Добавляем буфер в 30 минут до первой пары
  const parts = firstStart.split(":").map(Number);
  const h = parts[0] ?? 9;
  const m = parts[1] ?? 0;
  const bufferMinutes = h * 60 + m - 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.max(0, hours)).padStart(2, "0")}:${String(
    mins,
  ).padStart(2, "0")}:00`;
});

const slotMaxTime = computed(() => {
  const lastEnd = getLastPeriodEnd.value;
  // Добавляем буфер в 30 минут после последней пары
  const parts = lastEnd.split(":").map(Number);
  const h = parts[0] ?? 18;
  const m = parts[1] ?? 20;
  const bufferMinutes = h * 60 + m + 30;
  const hours = Math.floor(bufferMinutes / 60);
  const mins = bufferMinutes % 60;
  return `${String(Math.min(24, hours)).padStart(2, "0")}:${String(
    mins,
  ).padStart(2, "0")}:00`;
});

// Длительность слота - 10 минут для точной сетки
const slotDuration = computed(() => {
  return "00:10:00";
});

// Интервал меток - каждые 10 минут, но скрываем ненужные через slotLabelContent
const slotLabelInterval = computed(() => {
  return "00:10:00";
});

// Набор времён начала пар для быстрого поиска
const periodStartTimes = computed(() => {
  return new Set(periods.value.map((p) => p.startTime));
});

// Набор времён окончания пар (для визуальной границы)
const periodEndTimes = computed(() => {
  return new Set(periods.value.map((p) => p.endTime));
});

// Генерация кастомных меток для слотов - показываем ТОЛЬКО для начала пар
const slotLabelContent = (arg: { date: Date; text: string }) => {
  const showNumbers = scheduleSettings.value.show_period_numbers === "true";

  const timeStr = `${String(arg.date.getHours()).padStart(2, "0")}:${String(
    arg.date.getMinutes(),
  ).padStart(2, "0")}`;
  const period = periods.value.find((p) => p.startTime === timeStr);

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
        </div>`,
      };
    }
    // Просто время начала пары
    return {
      html: `<span class="period-time-start">${arg.text}</span>`,
    };
  }

  // Для всех остальных слотов - скрываем текст, но оставляем пустой контейнер для структуры
  // Возвращаем пустую строку, чтобы скрыть ненужные метки
  return "";
};

// Привязка событий к академическим парам при перетаскивании
const snapToGrid = (date: Date): Date => {
  const shouldSnap = scheduleSettings.value.snap_to_periods === "true";
  if (!shouldSnap) return date;

  const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
  const nearestPeriod = getNearestPeriod(timeStr);

  if (nearestPeriod) {
    const parts = nearestPeriod.startTime.split(":").map(Number);
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
  const periodDuration = parseInt(
    scheduleSettings.value.period_duration_minutes || "40",
    10,
  );
  const snapDurationValue = `00:${String(periodDuration).padStart(2, "0")}:00`;

  // Определяем возможность редактирования на основе прав доступа
  const isEditable = canEditSchedule.value || canCreateSchedule.value;

  return {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: "dayGridMonth",
    locale: ruLocale,
    headerToolbar: false,
    height: "auto",
    timeZone: "local", // Используем локальное время для избежания сдвига дат

    // События будут управляться через API календаря
    events: [],

    // Блокируем редактирование для пользователей без прав
    editable: isEditable,
    selectable: isEditable,
    selectMirror: isEditable,
    eventStartEditable: isEditable,
    eventDurationEditable: isEditable,

    dayMaxEvents: 3,
    moreLinkClick: "popover",
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
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
    eventTimeFormat: {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },

    // Кастомные метки слотов с номерами пар
    slotLabelContent,

    eventClick: (arg: EventClickArg) => {
      cleanupAllTooltips();
      onEventClick(arg);
    },
    select: (arg: DateSelectArg) => {
      cleanupAllTooltips();
      onDateSelect(arg);
    },
    datesSet: (arg: DatesSetArg) => {
      cleanupAllTooltips();
      onDatesSet(arg);
    },
    eventDrop: (info: EventDropArg) => {
      cleanupAllTooltips();
      onEventDrop(info);
    },
    eventResize: (info: EventResizeDoneArg) => {
      cleanupAllTooltips();
      onEventResize(info);
    },
    eventDidMount: onEventDidMount,
    eventWillUnmount: (arg: EventMountArg) => {
      if ((arg.el as any)?._tooltipCleanup) {
        (arg.el as any)._tooltipCleanup();
      }
      cleanupAllTooltips();
    },
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
  cleanupAllTooltips();
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
    params.append("startDate", formatDateOnly(viewStart || defaultStart));
    params.append("endDate", formatDateOnly(viewEnd || defaultEnd));
    if (filters.value.groupId) params.append("groupId", filters.value.groupId);
    if (filters.value.instructorId)
      params.append("instructorId", filters.value.instructorId);
    if (filters.value.classroomId)
      params.append("classroomId", filters.value.classroomId);
    if (filters.value.eventType)
      params.append("eventType", filters.value.eventType);

    const response = await authFetch<{
      success: boolean;
      events: ScheduleEvent[];
    }>(`/api/schedule?${params.toString()}`, { signal: controller.signal });

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
    if (error.name === "AbortError" || controller.signal.aborted) {
      return;
    }

    // Игнорируем ошибки если контроллер уже заменён (был новый запрос)
    if (loadingAbortController.value !== controller) {
      return;
    }

    console.error("Error loading events:", error);
    notification.show({
      type: "error",
      title: "Ошибка",
      message: "Не удалось загрузить расписание",
    });
  } finally {
    if (loadingAbortController.value === controller) {
      loading.value = false;
    }
  }
};

// Обновление событий в календаре через API (без дубликатов)
const updateCalendarEvents = () => {
  cleanupAllTooltips();
  const api = calendarRef.value?.getApi();
  if (!api) return;

  // Сначала удаляем все существующие события
  api.removeAllEvents();

  // Фильтруем события для студентов
  let filteredEvents = events.value;

  if (isStudent.value) {
    const currentStudentId = user.value?.studentId;

    console.log("[CalendarView] Фильтрация для студента:", {
      userId: user.value?.id,
      studentId: currentStudentId,
      totalEvents: events.value.length,
      isStudent: isStudent.value,
    });

    if (!currentStudentId) {
      console.warn("[CalendarView] У студента нет связанного studentId");
      // Если нет studentId, показываем только обычные занятия (не перездачи)
      filteredEvents = events.value.filter((event) => {
        const isRetake =
          (event.allowedStudentIds && event.allowedStudentIds.length > 0) ||
          event.originalEventId;
        return !isRetake;
      });
    } else {
      filteredEvents = events.value.filter((event) => {
        // Проверяем, является ли это перездачей
        const isRetake =
          (event.allowedStudentIds && event.allowedStudentIds.length > 0) ||
          event.originalEventId;

        console.log("[CalendarView] Проверка события:", {
          title: event.title,
          isRetake,
          allowedStudentIds: event.allowedStudentIds,
          originalEventId: event.originalEventId,
          currentStudentId,
        });

        // Если это не перездача, показываем всем
        if (!isRetake) {
          console.log("[CalendarView] → Показываем (не перездача)");
          return true;
        }

        // Если это перездача, показываем только если студент в списке allowedStudentIds
        if (event.allowedStudentIds && event.allowedStudentIds.length > 0) {
          const isAllowed = event.allowedStudentIds.includes(currentStudentId);
          console.log(
            "[CalendarView] → Перездача, студент в списке:",
            isAllowed,
          );
          return isAllowed;
        }

        // Если allowedStudentIds пустой или не определен, не показываем
        console.log(
          "[CalendarView] → Скрываем (перездача без списка студентов)",
        );
        return false;
      });
    }

    console.log("[CalendarView] После фильтрации:", {
      filteredCount: filteredEvents.length,
      hiddenCount: events.value.length - filteredEvents.length,
    });
  }

  // Затем добавляем новые (отфильтрованные) события
  const transformedEvents = filteredEvents.map(transformEventForCalendar);
  transformedEvents.forEach((event) => {
    api.addEvent(event);
  });
};

const openAddModal = (start?: Date) => {
  cleanupAllTooltips();
  editingEvent.value = null;
  defaultEventStart.value = start || new Date();
  defaultEventEnd.value = new Date(
    (start || new Date()).getTime() + 90 * 60 * 1000,
  );
  showEventModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedEvent.value = null;
};

const handleEditFromDetail = (event: ScheduleEvent) => {
  // Проверяем, является ли это пересдачей
  const isRetake =
    (event.allowedStudentIds && event.allowedStudentIds.length > 0) ||
    event.originalEventId;

  showDetailModal.value = false;

  if (isRetake) {
    // Открываем форму редактирования пересдачи
    editingRetakeEvent.value = event;
    // Загружаем оригинальное событие, если есть originalEventId
    if (event.originalEventId) {
      const originalEvent = events.value.find(
        (e) => e.id === event.originalEventId,
      );
      if (originalEvent) {
        retakeOriginalEvent.value = {
          id: originalEvent.id,
          title: originalEvent.title,
          startTime: originalEvent.startTime,
          endTime: originalEvent.endTime,
          eventType: originalEvent.eventType,
          groupId: originalEvent.groupId,
          disciplineId: originalEvent.disciplineId,
          instructorId: originalEvent.instructorId,
          classroomId: originalEvent.classroomId,
        };
      } else {
        // Если оригинал не найден, используем само событие как оригинал
        retakeOriginalEvent.value = {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          eventType: event.eventType,
          groupId: event.groupId,
          disciplineId: event.disciplineId,
          instructorId: event.instructorId,
          classroomId: event.classroomId,
        };
      }
    } else {
      // Если нет originalEventId, используем само событие
      retakeOriginalEvent.value = {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        eventType: event.eventType,
        groupId: event.groupId,
        disciplineId: event.disciplineId,
        instructorId: event.instructorId,
        classroomId: event.classroomId,
      };
    }
    showRetakeModal.value = true;
  } else {
    // Открываем обычную форму редактирования
    editingEvent.value = event;
    showEventModal.value = true;
  }
};

// Обработчик создания пересдачи из модального окна деталей
const handleRetakeFromDetail = (event: ScheduleEvent) => {
  showDetailModal.value = false;
  // Формируем объект для модального окна пересдачи
  retakeOriginalEvent.value = {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    eventType: event.eventType,
    groupId: event.groupId,
    disciplineId: event.disciplineId,
    instructorId: event.instructorId,
    classroomId: event.classroomId,
  };
  showRetakeModal.value = true;
};

const closeRetakeModal = () => {
  showRetakeModal.value = false;
  retakeOriginalEvent.value = null;
  editingRetakeEvent.value = null;
};

const handleRetakeCreated = (retakeEventId: string) => {
  closeRetakeModal();
  notification.show({
    type: "success",
    title: "Пересдача создана",
    message: "События пересдачи добавлено в расписание",
  });
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const handleRetakeUpdated = () => {
  closeRetakeModal();
  notification.show({
    type: "success",
    title: "Пересдача обновлена",
    message: "Изменения успешно сохранены",
  });
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
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
  closeDetailModal();
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
    groupId: "",
    instructorId: "",
    classroomId: "",
    eventType: "",
  };
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

// Быстрый фильтр по группе из легенды
const toggleGroupFilter = (groupId: string) => {
  if (filters.value.groupId === groupId) {
    // Сбрасываем фильтр при повторном клике
    filters.value.groupId = "";
  } else {
    filters.value.groupId = groupId;
  }
  handleFilterChange();
};

// ============ ФУНКЦИИ МАССОВЫХ ОПЕРАЦИЙ ============

// Включить режим массового выбора
const enableBulkSelection = () => {
  bulkSelectionMode.value = true;
  selectedEventIds.value = new Set();
};

// Выключить режим массового выбора
const disableBulkSelection = () => {
  bulkSelectionMode.value = false;
  selectedEventIds.value = new Set();
};

// Выбрать все видимые события
const selectAllVisible = () => {
  const newSet = new Set(selectedEventIds.value);
  for (const event of filteredEvents.value) {
    newSet.add(event.id);
  }
  selectedEventIds.value = newSet;
};

// Переключить выбор события
const toggleEventSelection = (eventId: string) => {
  const newSet = new Set(selectedEventIds.value);
  if (newSet.has(eventId)) {
    newSet.delete(eventId);
  } else {
    newSet.add(eventId);
  }
  selectedEventIds.value = newSet;
};

// Обработчик успешного копирования
const handleBulkCopied = (result: {
  copiedCount: number;
  createdEventIds: string[];
}) => {
  showCopyEventsModal.value = false;
  disableBulkSelection();
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

// Обработчик успешного перемещения
const handleBulkMoved = (result: { movedCount: number }) => {
  showMoveEventsModal.value = false;
  disableBulkSelection();
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

// Обработчик создания шаблона
const handleTemplateCreated = (template: { id: string; name: string }) => {
  showCreateTemplateModal.value = false;
  disableBulkSelection();
};

// Обработчик применения шаблона
const handleTemplateApplied = (result: { createdCount: number }) => {
  showApplyTemplateModal.value = false;
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

// Обработчик массового удаления
const handleBulkDeleted = (result: { deletedCount: number }) => {
  showBulkDeleteModal.value = false;
  disableBulkSelection();
  // Перезагружаем события
  if (currentDateRange.value) {
    loadEvents(currentDateRange.value.start, currentDateRange.value.end);
  }
};

const loadSelectData = async () => {
  try {
    const shouldFetchGroups = canViewAllGroups.value || isTeacher.value;
    const shouldFetchInstructors = canViewInstructors.value || isStudent.value; // Students usually need to see instructors

    const [groupsResponse, instructorsResponse, classroomsResponse] =
      await Promise.all([
        shouldFetchGroups
          ? authFetch<{ success: boolean; groups: any[] }>(
              "/api/groups?limit=1000&isActive=true",
            )
          : Promise.resolve({ success: true, groups: [] }),
        shouldFetchInstructors
          ? authFetch<{ success: boolean; instructors: Instructor[] }>(
              "/api/instructors?limit=1000&isActive=true",
            )
          : Promise.resolve({ success: true, instructors: [] }),
        authFetch<{ success: boolean; classrooms: Classroom[] }>(
          "/api/classrooms",
        ),
      ]);

    if (groupsResponse.success && groupsResponse.groups) {
      groups.value = groupsResponse.groups.map((g) => ({
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
    console.error("Error loading select data:", error);
  }
};

// ============ WATCHERS ============

// Обновляем календарь при изменении режима массового выбора
watch(bulkSelectionMode, () => {
  // Перерисовываем события для добавления/удаления чекбоксов
  nextTick(() => {
    updateCalendarEvents();
  });
});

// Обновляем чекбоксы при изменении выбранных событий
watch(
  selectedEventIds,
  () => {
    if (bulkSelectionMode.value && currentView.value === "listWeek") {
      // Обновляем стили выбранных событий
      const api = calendarRef.value?.getApi();
      if (api) {
        api.getEvents().forEach((fcEvent) => {
          const el = document.querySelector(
            `[data-event-id="${fcEvent.id}"]`,
          ) as HTMLElement;
          if (el) {
            const isSelected = selectedEventIds.value.has(fcEvent.id);
            if (isSelected) {
              el.style.backgroundColor = "rgba(60, 80, 224, 0.1)";
            } else {
              el.style.backgroundColor = "";
            }
          }
        });
      }
    }
  },
  { deep: true },
);

// Глобальный обработчик кликов для очистки висящих подсказок
const handleGlobalPointerDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target?.closest?.(".event-tooltip")) {
    cleanupAllTooltips();
  }
};

// Lifecycle
onMounted(async () => {
  window.addEventListener("scroll", cleanupAllTooltips, true);
  window.addEventListener("mousedown", handleGlobalPointerDown);

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
  window.removeEventListener("scroll", cleanupAllTooltips, true);
  window.removeEventListener("mousedown", handleGlobalPointerDown);
  cleanupAllTooltips();

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
  background-color: #3c50e0 !important;
  color: white !important;
  border-color: #3c50e0 !important;
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
  border-color: #ef4444;
  border-width: 2px;
}

.schedule-calendar .fc-timegrid-now-indicator-arrow {
  border-color: #ef4444;
  border-top-color: transparent;
  border-bottom-color: transparent;
}

.schedule-calendar .fc-popover {
  position: absolute !important;
  z-index: 1000 !important;
  max-width: 320px;
  min-width: 220px;
  background: white;
  border-radius: 10px !important;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.15),
    0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e2e8f0;
  overflow: hidden !important;
}

.dark .schedule-calendar .fc-popover {
  background: #1c2434;
  border-color: #3d4d5f;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.5),
    0 8px 10px -6px rgba(0, 0, 0, 0.3) !important;
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

.schedule-calendar .fc-popover-body {
  max-height: 280px !important;
  overflow-y: auto !important;
  padding: 6px !important;
}

/* Ограничение скролла календаря при открытии поповера в месячном виде */
.schedule-calendar .fc-daygrid .fc-scroller {
  overflow: visible !important;
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
  background: linear-gradient(135deg, #3c50e0 0%, #5b6ef0 100%);
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
  color: #3c50e0;
}

.dark .schedule-calendar .period-time-start {
  color: #5b6ef0;
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

.schedule-calendar
  .fc-timegrid-slot-label:has(.slot-label-period)
  + td.fc-timegrid-slot-lane,
.schedule-calendar
  .fc-timegrid-slot:has(.slot-label-period)
  ~ .fc-timegrid-slot-lane {
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
  content: "🍽️ Обед";
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
  background: linear-gradient(135deg, #3c50e0 0%, #5b6ef0 100%);
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
.schedule-calendar .fc-event.group-stripe-0 {
  border-left-color: #e91e63 !important;
} /* Розовый */
.schedule-calendar .fc-event.group-stripe-1 {
  border-left-color: #9c27b0 !important;
} /* Фиолетовый */
.schedule-calendar .fc-event.group-stripe-2 {
  border-left-color: #673ab7 !important;
} /* Глубокий фиолетовый */
.schedule-calendar .fc-event.group-stripe-3 {
  border-left-color: #3f51b5 !important;
} /* Индиго */
.schedule-calendar .fc-event.group-stripe-4 {
  border-left-color: #2196f3 !important;
} /* Синий */
.schedule-calendar .fc-event.group-stripe-5 {
  border-left-color: #00bcd4 !important;
} /* Циан */
.schedule-calendar .fc-event.group-stripe-6 {
  border-left-color: #009688 !important;
} /* Бирюзовый */
.schedule-calendar .fc-event.group-stripe-7 {
  border-left-color: #4caf50 !important;
} /* Зелёный */
.schedule-calendar .fc-event.group-stripe-8 {
  border-left-color: #8bc34a !important;
} /* Лаймовый */
.schedule-calendar .fc-event.group-stripe-9 {
  border-left-color: #ff9800 !important;
} /* Оранжевый */
.schedule-calendar .fc-event.group-stripe-10 {
  border-left-color: #ff5722 !important;
} /* Глубокий оранжевый */
.schedule-calendar .fc-event.group-stripe-11 {
  border-left-color: #795548 !important;
} /* Коричневый */

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

.schedule-calendar
  .fc-list-event[class*="group-stripe-"]
  td:first-child::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.schedule-calendar .fc-list-event.group-stripe-0 td:first-child::before {
  background-color: #e91e63;
}
.schedule-calendar .fc-list-event.group-stripe-1 td:first-child::before {
  background-color: #9c27b0;
}
.schedule-calendar .fc-list-event.group-stripe-2 td:first-child::before {
  background-color: #673ab7;
}
.schedule-calendar .fc-list-event.group-stripe-3 td:first-child::before {
  background-color: #3f51b5;
}
.schedule-calendar .fc-list-event.group-stripe-4 td:first-child::before {
  background-color: #2196f3;
}
.schedule-calendar .fc-list-event.group-stripe-5 td:first-child::before {
  background-color: #00bcd4;
}
.schedule-calendar .fc-list-event.group-stripe-6 td:first-child::before {
  background-color: #009688;
}
.schedule-calendar .fc-list-event.group-stripe-7 td:first-child::before {
  background-color: #4caf50;
}
.schedule-calendar .fc-list-event.group-stripe-8 td:first-child::before {
  background-color: #8bc34a;
}
.schedule-calendar .fc-list-event.group-stripe-9 td:first-child::before {
  background-color: #ff9800;
}
.schedule-calendar .fc-list-event.group-stripe-10 td:first-child::before {
  background-color: #ff5722;
}
.schedule-calendar .fc-list-event.group-stripe-11 td:first-child::before {
  background-color: #795548;
}

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
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
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
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.dark .event-tooltip {
  background: linear-gradient(
    135deg,
    rgba(36, 48, 63, 0.95) 0%,
    rgba(28, 36, 52, 0.98) 100%
  );
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

/* ============================================
   СТИЛИ ДЛЯ ПЕРЕЗДАЧ
   ============================================ */

/* Основной стиль для перездач */
.schedule-calendar .fc-event.event-retake {
  border: 2px solid #9333ea !important;
  box-shadow:
    0 0 0 1px rgba(147, 51, 234, 0.2),
    0 2px 8px rgba(147, 51, 234, 0.15) !important;
  position: relative;
}

/* Пульсирующая анимация для перездач */
.schedule-calendar .fc-event.event-retake::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #9333ea;
  border-radius: 4px;
  opacity: 0;
  animation: retake-pulse 2s ease-in-out infinite;
  pointer-events: none;
}

@keyframes retake-pulse {
  0%,
  100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.05);
  }
}

/* Hover эффект для перездач */
.schedule-calendar .fc-event.event-retake:hover {
  box-shadow:
    0 0 0 2px rgba(147, 51, 234, 0.3),
    0 4px 12px rgba(147, 51, 234, 0.25) !important;
}

/* Дополнительный фон для перездач в темной теме */
.dark .schedule-calendar .fc-event.event-retake {
  background: linear-gradient(
    135deg,
    rgba(147, 51, 234, 0.15) 0%,
    rgba(147, 51, 234, 0.05) 100%
  ) !important;
}

/* ============================================
   РЕЖИМ МАССОВОГО ВЫБОРА
   ============================================ */

/* Стили для выбранных событий в списке */
.schedule-calendar .fc-list-event.bulk-selected {
  background-color: rgba(60, 80, 224, 0.1) !important;
}

.schedule-calendar .fc-list-event.bulk-selected:hover {
  background-color: rgba(60, 80, 224, 0.15) !important;
}

/* Стили чекбокса */
.bulk-select-checkbox {
  transition: transform 0.15s ease;
}

.bulk-select-checkbox:hover {
  transform: scale(1.1);
}

.bulk-event-checkbox {
  transition: all 0.15s ease;
}

.bulk-event-checkbox:checked {
  transform: scale(1.05);
}

/* Анимация появления чекбоксов */
@keyframes checkboxAppear {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.bulk-select-checkbox {
  animation: checkboxAppear 0.2s ease;
}

/* Улучшенные стили для списка в режиме выбора */
.schedule-calendar .fc-list-event-title {
  display: flex;
  align-items: center;
}
</style>
