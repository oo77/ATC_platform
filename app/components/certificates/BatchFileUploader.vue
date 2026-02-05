<template>
  <div class="space-y-6">
    <!-- Drag & Drop Zone -->
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'relative border-2 border-dashed rounded-xl transition-all duration-300',
        isDragging
          ? 'border-primary bg-primary/5 dark:bg-primary/10 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50',
        loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="triggerFileInput"
    >
      <div class="p-8 lg:p-12 text-center">
        <!-- Upload Icon -->
        <div class="flex justify-center mb-4">
          <div
            :class="[
              'h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300',
              isDragging
                ? 'bg-primary text-white scale-110'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400',
            ]"
          >
            <svg
              class="h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
        </div>

        <!-- Text -->
        <h3 class="text-lg font-semibold text-black dark:text-white mb-2">
          {{ isDragging ? 'Отпустите файлы здесь' : 'Загрузите сертификаты' }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Перетащите файлы или нажмите для выбора
        </p>

        <!-- Info Badges -->
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            Максимум 20 файлов
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          >
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clip-rule="evenodd"
              />
            </svg>
            JPG, PNG, PDF
          </span>
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            <svg class="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
            До 10 МБ каждый
          </span>
        </div>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          @change="handleFileSelect"
          class="hidden"
        />
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-white/80 dark:bg-boxdark/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
      >
        <div class="text-center">
          <div
            class="h-12 w-12 mx-auto mb-3 animate-spin rounded-full border-4 border-primary border-t-transparent"
          ></div>
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Загрузка файлов...
          </p>
        </div>
      </div>
    </div>

    <!-- Files Preview Grid -->
    <div v-if="selectedFiles.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-black dark:text-white">
          Выбрано файлов: {{ selectedFiles.length }}
        </h4>
        <button
          @click="clearAll"
          :disabled="loading"
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Очистить всё
        </button>
      </div>

      <!-- Grid Layout -->
      <div
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="group relative bg-white dark:bg-boxdark rounded-lg border border-stroke dark:border-strokedark overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <!-- Preview Image -->
          <div class="aspect-square bg-gray-100 dark:bg-gray-800 relative">
            <img
              v-if="file.preview"
              :src="file.preview"
              :alt="file.file.name"
              class="w-full h-full object-cover"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-gray-400"
            >
              <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>

            <!-- Remove Button -->
            <button
              @click="removeFile(index)"
              :disabled="loading"
              class="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- File Size Badge -->
            <div
              class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm"
            >
              <span class="text-xs font-medium text-white">
                {{ formatFileSize(file.file.size) }}
              </span>
            </div>

            <!-- Validation Error -->
            <div
              v-if="file.error"
              class="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center p-2"
            >
              <p class="text-xs text-white text-center font-medium">
                {{ file.error }}
              </p>
            </div>
          </div>

          <!-- File Name -->
          <div class="p-2">
            <p
              class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"
              :title="file.file.name"
            >
              {{ file.file.name }}
            </p>
          </div>
        </div>
      </div>

      <!-- Upload Button -->
      <div class="flex justify-end">
        <button
          @click="uploadFiles"
          :disabled="loading || !hasValidFiles"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <svg
            v-if="!loading"
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div
            v-else
            class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></div>
          {{ loading ? 'Загрузка...' : `Загрузить (${validFilesCount})` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  maxFiles: {
    type: Number,
    default: 20,
  },
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024, // 10 MB
  },
})

const emit = defineEmits(['upload'])

const fileInput = ref(null)
const isDragging = ref(false)
const selectedFiles = ref([])

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

// Computed
const validFilesCount = computed(() => {
  return selectedFiles.value.filter((f) => !f.error).length
})

const hasValidFiles = computed(() => {
  return validFilesCount.value > 0
})

// Methods
const triggerFileInput = () => {
  if (!props.loading) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  processFiles(files)
  // Reset input
  event.target.value = ''
}

const handleDrop = (event) => {
  isDragging.value = false
  if (props.loading) return

  const files = Array.from(event.dataTransfer.files || [])
  processFiles(files)
}

const processFiles = (files) => {
  // Проверка общего количества
  const totalFiles = selectedFiles.value.length + files.length
  if (totalFiles > props.maxFiles) {
    useToast().error(`Максимум ${props.maxFiles} файлов за раз`)
    return
  }

  files.forEach((file) => {
    const fileData = {
      file,
      preview: null,
      error: null,
    }

    // Валидация типа
    if (!ALLOWED_TYPES.includes(file.type)) {
      fileData.error = 'Неподдерживаемый формат'
    }
    // Валидация размера
    else if (file.size > props.maxFileSize) {
      fileData.error = `Файл больше ${formatFileSize(props.maxFileSize)}`
    }
    // Создание превью для изображений
    else if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileData.preview = e.target.result
      }
      reader.readAsDataURL(file)
    }

    selectedFiles.value.push(fileData)
  })
}

const removeFile = (index) => {
  if (!props.loading) {
    selectedFiles.value.splice(index, 1)
  }
}

const clearAll = () => {
  if (!props.loading) {
    selectedFiles.value = []
  }
}

const uploadFiles = () => {
  const validFiles = selectedFiles.value
    .filter((f) => !f.error)
    .map((f) => f.file)

  if (validFiles.length > 0) {
    emit('upload', validFiles)
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
/* Анимация появления карточек */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.group {
  animation: fadeInUp 0.3s ease-out;
}
</style>
