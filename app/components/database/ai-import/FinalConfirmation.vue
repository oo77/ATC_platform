<template>
  <div
    class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <div class="p-6.5 text-center">
      <div class="mb-6 flex justify-center">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <h3 class="mb-2 text-xl font-medium text-black dark:text-white">
        Все готово к импорту!
      </h3>
      <p class="mb-8 font-medium text-gray-500 dark:text-gray-400">
        Пожалуйста, проверьте итоговые данные перед сохранением
      </p>

      <!-- Итоговая карточка -->
      <div
        class="rounded-lg border border-stroke bg-gray-50 p-6 text-left dark:border-strokedark dark:bg-meta-4"
      >
        <div class="grid grid-cols-1 gap-y-4 gap-x-8 md:grid-cols-2">
          <div>
            <span
              class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Слушатель
            </span>
            <p class="font-medium text-black dark:text-white">
              {{ studentName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ studentPinfl }}
            </p>
          </div>

          <div>
            <span
              class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Курс
            </span>
            <p class="font-medium text-black dark:text-white">
              {{ courseName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ courseHours ? `${courseHours} ч.` : "" }}
            </p>
          </div>

          <div>
            <span
              class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Сертификат
            </span>
            <p class="font-medium text-black dark:text-white">
              № {{ certificateNumber }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Выдан: {{ formatDate(issueDate) }}
            </p>
          </div>

          <div>
            <span
              class="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              Организация
            </span>
            <p class="font-medium text-black dark:text-white">
              {{ organization }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ExtractedCertificateData } from "~/../server/types/aiCertificateImport";
import type { Student } from "~/../server/types/student";

const props = defineProps<{
  data: ExtractedCertificateData;
  student: Student;
}>();

const studentName = computed(() => props.student.fullName);
const studentPinfl = computed(() => props.student.pinfl || "—");
const courseName = computed(() => props.data.courseName);
const courseHours = computed(() => props.data.courseHours);
const certificateNumber = computed(() => props.data.certificateNumber);
const issueDate = computed(() => props.data.issueDate);
const organization = computed(() => props.data.organization);

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ru-RU");
};
</script>
