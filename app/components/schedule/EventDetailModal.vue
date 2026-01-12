<template>
  <UiModal
    :is-open="isOpen"
    :title="'Информация о занятии'"
    size="xl"
    @close="handleClose"
  >
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <span class="text-gray-600 dark:text-gray-400">Загрузка информации...</span>
      </div>
    </div>

    <!-- Содержимое -->
    <div v-else-if="event" class="space-y-6">
      <!-- Заголовок события с цветовым индикатором -->
      <div class="flex items-start gap-4">
        <div 
          class="w-3 h-3 rounded-full mt-2 shrink-0"
          :class="getColorClass(event.color)"
        ></div>
        <div class="flex-1">
          <h3 class="text-xl font-semibold text-black dark:text-white">
            {{ event.title }}
          </h3>
          <p v-if="event.description" class="mt-1 text-gray-600 dark:text-gray-400">
            {{ event.description }}
          </p>
        </div>
        <span 
          v-if="event.eventType"
          class="px-3 py-1 rounded-full text-xs font-medium"
          :class="getEventTypeBadgeClass(event.eventType)"
        >
          {{ getEventTypeLabel(event.eventType) }}
        </span>
      </div>

      <!-- Детали занятия -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
        <!-- Дата и время -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Дата и время</p>
            <p class="font-medium text-black dark:text-white">
              {{ formatEventDate(event.startTime) }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{ formatEventTime(event.startTime) }} — {{ formatEventTime(event.endTime) }}
            </p>
          </div>
        </div>

        <!-- Группа -->
        <div v-if="event.group" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-success/10 dark:bg-success/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Группа</p>
            <p class="font-medium text-black dark:text-white">
              {{ event.group.code }}
            </p>
          </div>
        </div>

        <!-- Инструктор -->
        <div v-if="event.instructor" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-warning/10 dark:bg-warning/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Инструктор</p>
            <p class="font-medium text-black dark:text-white">
              {{ event.instructor.fullName }}
            </p>
          </div>
        </div>

        <!-- Аудитория -->
        <div v-if="event.classroom" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-danger/10 dark:bg-danger/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Аудитория</p>
            <p class="font-medium text-black dark:text-white">
              {{ event.classroom.name }}
            </p>
          </div>
        </div>

      </div>

      <!-- Список слушателей -->
      <div v-if="event.group" class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Слушатели
          </h4>
          <span class="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-sm font-medium">
            {{ students.length }} {{ getStudentWord(students.length) }}
          </span>
        </div>

        <!-- Загрузка студентов -->
        <div v-if="loadingStudents" class="flex items-center justify-center py-8">
          <div class="flex items-center gap-2 text-gray-500">
            <div class="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
            Загрузка списка слушателей...
          </div>
        </div>

        <!-- Список студентов -->
        <div v-else-if="students.length > 0" class="border border-stroke dark:border-strokedark rounded-lg overflow-hidden">
          <div class="max-h-64 overflow-y-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-meta-4 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    №
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ФИО
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Организация
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Должность
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-boxdark divide-y divide-stroke dark:divide-strokedark">
                <tr 
                  v-for="(student, index) in students" 
                  :key="student.id"
                  class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                >
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ index + 1 }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                        {{ getInitials(student.fullName) }}
                      </div>
                      <span class="text-sm font-medium text-black dark:text-white">
                        {{ student.fullName }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {{ student.organization || '—' }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {{ student.position || '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Нет студентов -->
        <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>В группе пока нет слушателей</p>
        </div>
      </div>

      <!-- Нет группы -->
      <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-meta-4 rounded-lg">
        <p>Занятие не привязано к учебной группе</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between items-center">
        <div></div>
        <div class="flex gap-3">
          <UiButton variant="outline" @click="handleClose">
            Закрыть
          </UiButton>
          <UiButton v-if="canEditSchedule" @click="handleEdit">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Редактировать
          </UiButton>
        </div>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import type { ScheduleEvent, ScheduleEventColor, ScheduleEventType } from '~/types/schedule';
import { formatEventDate, formatEventTime } from '~/utils/dateTime';

interface Student {
  id: string;
  fullName: string;
  organization?: string;
  position?: string;
}

interface Props {
  isOpen: boolean;
  event: ScheduleEvent | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  edit: [event: ScheduleEvent];
}>();

const { authFetch } = useAuthFetch();

// Проверка прав доступа
const { canEditSchedule } = usePermissions();

// State
const loading = ref(false);
const loadingStudents = ref(false);
const students = ref<Student[]>([]);

// Загрузка списка студентов группы
const loadStudents = async (groupId: string) => {
  loadingStudents.value = true;
  try {
    const response = await authFetch<{ 
      success: boolean; 
      group: { 
        students?: Array<{ 
          student?: {
            id: string;
            fullName: string;
            organization?: string;
            position?: string;
          }
        }> 
      } 
    }>(`/api/groups/${groupId}`);
    
    if (response.success && response.group?.students) {
      students.value = response.group.students
        .filter(s => s.student)
        .map(s => ({
          id: s.student!.id,
          fullName: s.student!.fullName,
          organization: s.student!.organization,
          position: s.student!.position,
        }));
    }
  } catch (error) {
    console.error('Error loading students:', error);
  } finally {
    loadingStudents.value = false;
  }
};


// Получение инициалов
const getInitials = (fullName: string): string => {
  if (!fullName) return '??';
  const parts = fullName.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
};

// Склонение слова "слушатель"
const getStudentWord = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod100 >= 11 && mod100 <= 19) return 'слушателей';
  if (mod10 === 1) return 'слушатель';
  if (mod10 >= 2 && mod10 <= 4) return 'слушателя';
  return 'слушателей';
};

// Цвет индикатора события
const getColorClass = (color: ScheduleEventColor): string => {
  const colorClasses: Record<ScheduleEventColor, string> = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  return colorClasses[color] || 'bg-primary';
};

// Метка типа события
const getEventTypeLabel = (type: ScheduleEventType): string => {
  const labels: Record<ScheduleEventType, string> = {
    theory: 'Теория',
    practice: 'Практика',
    assessment: 'Проверка знаний',
    other: 'Другое',
  };
  return labels[type] || 'Занятие';
};

// Класс бейджа типа события
const getEventTypeBadgeClass = (type: ScheduleEventType): string => {
  const classes: Record<ScheduleEventType, string> = {
    theory: 'bg-primary/10 text-primary dark:bg-primary/20',
    practice: 'bg-success/10 text-success dark:bg-success/20',
    assessment: 'bg-warning/10 text-warning dark:bg-warning/20',
    other: 'bg-gray-100 text-gray-600 dark:bg-meta-4 dark:text-gray-300',
  };
  return classes[type] || classes.other;
};

// Обработчики
const handleClose = () => {
  emit('close');
};

const handleEdit = () => {
  if (props.event) {
    emit('edit', props.event);
  }
};

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.event?.groupId) {
      loadStudents(props.event.groupId);
    } else {
      students.value = [];
    }
  }
);

watch(
  () => props.event,
  (event) => {
    if (props.isOpen && event?.groupId) {
      loadStudents(event.groupId);
    } else {
      students.value = [];
    }
  }
);
</script>
