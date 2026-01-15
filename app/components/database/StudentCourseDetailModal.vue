<template>
  <UiModal :is-open="isOpen" @close="$emit('close')" size="large">
    <template #header>
      <div class="flex items-center gap-3">
        <div
          class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"
        >
          <svg
            class="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <h2 class="text-xl font-bold text-black dark:text-white">
            {{ course.course_name }}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Группа: {{ course.group_name }}
          </p>
        </div>
      </div>
    </template>

    <div class="space-y-6">
      <!-- Статус и прогресс -->
      <div
        class="bg-linear-to-br from-primary/5 to-transparent rounded-xl p-6 border border-gray-200 dark:border-strokedark"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-black dark:text-white">
            Статус курса
          </h3>
          <span
            v-if="course.status === 'active'"
            class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-sm font-medium text-success"
          >
            <span class="h-2 w-2 rounded-full bg-success"></span>
            Активен
          </span>
          <span
            v-else
            class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Завершен
          </span>
        </div>

        <!-- Прогресс-бар -->
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Прогресс посещаемости</span
            >
            <span class="text-lg font-bold text-primary"
              >{{ course.progress }}%</span
            >
          </div>
          <div
            class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
          >
            <div
              class="h-3 rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500"
              :style="{ width: `${course.progress}%` }"
            ></div>
          </div>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-2 gap-4">
          <div
            class="bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Посещено занятий
            </p>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ course.attended_lessons }}
              <span class="text-sm text-gray-500 dark:text-gray-400"
                >/ {{ course.total_lessons }}</span
              >
            </p>
          </div>
          <div
            class="bg-white dark:bg-boxdark rounded-lg p-4 border border-gray-200 dark:border-strokedark"
          >
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Процент посещаемости
            </p>
            <p class="text-2xl font-bold text-primary">
              {{ course.progress }}%
            </p>
          </div>
        </div>
      </div>

      <!-- Информация о курсе -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          class="bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark"
        >
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
            Информация о курсе
          </h3>
          <div class="space-y-3">
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Название курса
              </label>
              <p class="text-base font-semibold text-black dark:text-white">
                {{ course.course_name }}
              </p>
            </div>
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Код группы
              </label>
              <p class="text-base font-mono text-black dark:text-white">
                {{ course.group_name }}
              </p>
            </div>
            <div v-if="course.teacher_name">
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Преподаватель
              </label>
              <p class="text-base text-black dark:text-white">
                {{ course.teacher_name }}
              </p>
            </div>
          </div>
        </div>

        <div
          class="bg-white dark:bg-boxdark rounded-xl p-6 border border-gray-200 dark:border-strokedark"
        >
          <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
            Период обучения
          </h3>
          <div class="space-y-3">
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Дата начала
              </label>
              <p class="text-base text-black dark:text-white">
                {{ formatDate(course.start_date) }}
              </p>
            </div>
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Дата окончания
              </label>
              <p class="text-base text-black dark:text-white">
                {{ formatDate(course.end_date) }}
              </p>
            </div>
            <div>
              <label
                class="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1"
              >
                Продолжительность
              </label>
              <p class="text-base text-black dark:text-white">
                {{ calculateDuration(course.start_date, course.end_date) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопка перехода к группе -->
      <div
        class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-strokedark"
      >
        <UiButton variant="secondary" @click="$emit('close')">
          Закрыть
        </UiButton>
        <NuxtLink :to="`/groups/${course.group_id}`">
          <UiButton variant="primary" class="flex items-center gap-2">
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Перейти к группе
          </UiButton>
        </NuxtLink>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
interface StudentCourse {
  group_id: string;
  course_id: string;
  course_name: string;
  group_name: string;
  status: "active" | "completed" | "dropped";
  start_date: Date | string;
  end_date: Date | string;
  teacher_name: string | null;
  progress: number;
  total_lessons: number;
  attended_lessons: number;
}

interface Props {
  isOpen: boolean;
  course: StudentCourse;
}

defineProps<Props>();
defineEmits<{
  close: [];
}>();

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const calculateDuration = (
  startDate: Date | string,
  endDate: Date | string
): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} дней`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${
      months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"
    }`;
  } else {
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"} ${
      months > 0 ? `${months} мес.` : ""
    }`;
  }
};
</script>
