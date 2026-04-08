<template>
  <div class="space-y-6 h-full flex flex-col items-center justify-center">
    <!-- Drag & Drop Zone -->
    <div
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'w-full max-w-2xl relative border-2 border-dashed rounded-3xl transition-all duration-300 bg-slate-50/50 dark:bg-slate-900/50',
        isDragging
          ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 scale-[1.02] shadow-xl shadow-blue-500/10'
          : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/80',
        loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="triggerFileInput"
    >
      <div class="p-10 lg:p-16 text-center">
        <!-- Upload Icon -->
        <div class="flex justify-center mb-6">
          <div
            :class="[
              'h-20 w-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm',
              isDragging
                ? 'bg-blue-600 text-white scale-110 shadow-blue-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 group-hover:scale-105',
            ]"
          >
            <UploadCloud v-if="!isDragging" class="h-10 w-10 text-blue-500" />
            <DownloadCloud v-else class="h-10 w-10 text-white" />
          </div>
        </div>

        <!-- Text -->
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {{ isDragging ? 'Отпустите файлы здесь' : 'Загрузите сертификаты' }}
        </h3>
        <p class="text-base text-slate-500 dark:text-slate-400 mb-6">
          Перетащите файлы с устройства или нажмите для выбора
        </p>

        <!-- Info Badges -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-blue-700 dark:text-blue-400">
            <Files class="w-4 h-4" />
            До 20 файлов
          </span>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 text-purple-700 dark:text-purple-400">
            <Image class="w-4 h-4" />
            JPG, PNG, PDF
          </span>
          <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400">
            <HardDrive class="w-4 h-4" />
            До 10 МБ/файл
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
        class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
      >
        <div class="text-center">
          <div class="h-12 w-12 mx-auto mb-3 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-300">Загрузка файлов...</p>
        </div>
      </div>
    </div>

    <!-- Files Preview Grid -->
    <div v-if="selectedFiles.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-bold text-slate-800 dark:text-white">
          Выбрано файлов: <span class="text-blue-600 dark:text-blue-400">{{ selectedFiles.length }}</span>
        </h4>
        <button
          @click="clearAll"
          :disabled="loading"
          class="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Очистить всё
        </button>
      </div>

      <!-- Grid Layout -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300"
        >
          <!-- Preview Image -->
          <div class="aspect-square bg-slate-100 dark:bg-slate-700 relative">
            <img
              v-if="file.preview"
              :src="file.preview"
              :alt="file.file.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
              <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
              </svg>
            </div>

            <!-- Remove Button -->
            <button
              @click="removeFile(index)"
              :disabled="loading"
              class="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- File Size Badge -->
            <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm">
              <span class="text-xs font-medium text-white">{{ formatFileSize(file.file.size) }}</span>
            </div>

            <!-- Validation Error -->
            <div
              v-if="file.error"
              class="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center p-2"
            >
              <p class="text-xs text-white text-center font-semibold">{{ file.error }}</p>
            </div>
          </div>

          <!-- File Name -->
          <div class="p-2">
            <p class="text-xs font-medium text-slate-600 dark:text-slate-300 truncate" :title="file.file.name">
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
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-blue-500/20 hover:shadow-md"
        >
          <svg v-if="!loading" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <div v-else class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {{ loading ? 'Загрузка...' : `Загрузить (${validFilesCount})` }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UploadCloud, DownloadCloud, Files, Image, HardDrive } from 'lucide-vue-next'

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

// Загрузка pdfjs
const loadPdfJs = async () => {
  if (window.pdfjsLib) return window.pdfjsLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const generatePdfPreview = async (file) => {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    
    // Ограничиваем масштаб для приемлемого размера картинки
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.85); // Качество 85%
  } catch (error) {
    console.error("Ошибка при генерации превью PDF:", error);
    throw error;
  }
};

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
        fileData.base64Data = e.target.result // Сохраняем для отправки
      }
      reader.readAsDataURL(file)
    }
    // Создание превью для PDF
    else if (file.type === 'application/pdf') {
      fileData.preview = null // Покажем спиннер вместо превью (пока генерируется)
      generatePdfPreview(file).then(dataUrl => {
         fileData.preview = dataUrl
         fileData.base64Data = dataUrl // Важно! Сохраняем картинку для отправки на бэк
      }).catch(e => {
         console.warn("Не удалось сгенерировать превью PDF", e)
         // Оставляем без превью, но файл загрузится
      })
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
    // Отправляем объект целиком, чтобы в useAICertificateImport 
    // получить доступ к сгенерированному base64Data превью

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
