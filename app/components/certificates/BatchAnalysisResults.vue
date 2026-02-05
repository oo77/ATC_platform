<template>
  <div class="space-y-4">
    <!-- Header with Progress -->
    <div
      class="bg-gradient-to-r from-primary/10 to-success/10 dark:from-primary/20 dark:to-success/20 rounded-xl p-6 border border-primary/20 dark:border-primary/30"
    >
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-black dark:text-white">
            Результаты анализа
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {{ stats.analyzedFiles }} из {{ stats.totalFiles }} обработано
          </p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-primary">
            {{ Math.round((stats.analyzedFiles / stats.totalFiles) * 100) }}%
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            прогресс
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out"
          :style="{
            width: `${(stats.analyzedFiles / stats.totalFiles) * 100}%`,
          }"
        ></div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="text-center">
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Готово
          </div>
          <div class="text-xl font-bold text-success">
            {{ stats.readyFiles }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Ошибки
          </div>
          <div class="text-xl font-bold text-danger">
            {{ stats.errorFiles }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Стоимость
          </div>
          <div class="text-xl font-bold text-warning">
            ${{ stats.totalCost }}
          </div>
        </div>
      </div>
    </div>

    <!-- Items List -->
    <div class="space-y-3">
      <div
        v-for="item in items"
        :key="item.file.fileId"
        class="bg-white dark:bg-boxdark rounded-xl border border-stroke dark:border-strokedark overflow-hidden transition-all duration-300 hover:shadow-lg"
      >
        <!-- Accordion Header -->
        <button
          @click="toggleItem(item.file.fileId)"
          class="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <!-- Thumbnail -->
          <div
            class="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0"
          >
            <img
              v-if="item.file.previewUrl"
              :src="item.file.previewUrl"
              :alt="item.file.originalName"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400"
            >
              <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1 text-left min-w-0">
            <h4
              class="text-sm font-semibold text-black dark:text-white truncate"
            >
              {{ item.file.originalName }}
            </h4>
            <div class="flex items-center gap-2 mt-1">
              <!-- Status Badge -->
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  getStatusClasses(item.uiStatus),
                ]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="getStatusDotClasses(item.uiStatus)"></span>
                {{ getStatusText(item.uiStatus) }}
              </span>

              <!-- Student Name if ready -->
              <span
                v-if="item.selectedStudent"
                class="text-xs text-gray-600 dark:text-gray-400 truncate"
              >
                → {{ item.selectedStudent.fullName }}
              </span>
            </div>
          </div>

          <!-- Expand Icon -->
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': item.isExpanded }"
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
        </button>

        <!-- Accordion Content -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="max-h-0 opacity-0"
          enter-to-class="max-h-[2000px] opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="max-h-[2000px] opacity-100"
          leave-to-class="max-h-0 opacity-0"
        >
          <div
            v-if="item.isExpanded"
            class="border-t border-stroke dark:border-strokedark"
          >
            <div class="p-6 space-y-6">
              <!-- Error State -->
              <div
                v-if="item.uiStatus === 'error' && item.analysisResult?.error"
                class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
              >
                <div class="flex items-start gap-3">
                  <svg
                    class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <div class="flex-1">
                    <h5 class="text-sm font-semibold text-red-900 dark:text-red-200">
                      Ошибка обработки
                    </h5>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                      {{ item.analysisResult.error }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Extracted Data -->
              <div
                v-if="item.analysisResult?.extractedData"
                class="space-y-4"
              >
                <h5 class="text-sm font-semibold text-black dark:text-white">
                  Извлечённые данные
                </h5>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="field in getExtractedFields(item.analysisResult.extractedData)"
                    :key="field.key"
                    class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                  >
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {{ field.label }}
                    </div>
                    <div class="text-sm font-medium text-black dark:text-white">
                      {{ field.value || '—' }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Student Match Section -->
              <div v-if="item.analysisResult?.matchResult">
                <StudentMatchAccordion
                  :file-id="item.file.fileId"
                  :match-result="item.analysisResult.matchResult"
                  :selected-student="item.selectedStudent"
                  @select="(student) => $emit('select-student', item.file.fileId, student)"
                />
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StudentMatchAccordion from './StudentMatchAccordion.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  stats: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['toggle-item', 'select-student'])

// Methods
const toggleItem = (fileId) => {
  emit('toggle-item', fileId)
}

const getStatusClasses = (status) => {
  const classes = {
    uploaded: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    analyzing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    analyzed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    ready: 'bg-success/10 text-success dark:bg-success/20',
    error: 'bg-danger/10 text-danger dark:bg-danger/20',
    confirmed: 'bg-success/10 text-success dark:bg-success/20',
  }
  return classes[status] || classes.uploaded
}

const getStatusDotClasses = (status) => {
  const classes = {
    uploaded: 'bg-gray-500',
    analyzing: 'bg-blue-500 animate-pulse',
    analyzed: 'bg-purple-500',
    ready: 'bg-success',
    error: 'bg-danger',
    confirmed: 'bg-success',
  }
  return classes[status] || classes.uploaded
}

const getStatusText = (status) => {
  const texts = {
    uploaded: 'Загружен',
    analyzing: 'Анализ...',
    analyzed: 'Проанализирован',
    ready: 'Готов',
    error: 'Ошибка',
    confirmed: 'Подтверждён',
  }
  return texts[status] || 'Неизвестно'
}

const getExtractedFields = (data) => {
  return [
    { key: 'fullName', label: 'ФИО', value: data.fullName },
    { key: 'certificateNumber', label: 'Номер сертификата', value: data.certificateNumber },
    { key: 'issueDate', label: 'Дата выдачи', value: formatDate(data.issueDate) },
    { key: 'courseName', label: 'Название курса', value: data.courseName },
    { key: 'organization', label: 'Организация', value: data.organization },
    { key: 'duration', label: 'Длительность', value: data.duration },
  ]
}

const formatDate = (dateString) => {
  if (!dateString) return null
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
/* Плавная анимация для accordion */
.max-h-0 {
  max-height: 0;
  overflow: hidden;
}

.max-h-\[2000px\] {
  max-height: 2000px;
  overflow: hidden;
}
</style>
