<template>
  <UiModal
    :is-open="isOpen"
    title="Загрузить книгу"
    size="xl"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit">
      <div class="space-y-4">
        <!-- Drag & Drop зона для PDF -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            PDF файл книги <span class="text-red-500">*</span>
          </label>
          <div
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            :class="[
              'border-2 border-dashed rounded-lg px-6 py-4 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary',
              errors.pdfFile ? 'border-red-500' : '',
            ]"
            @click="triggerPdfInput"
          >
            <input
              ref="pdfInput"
              type="file"
              accept=".pdf"
              class="hidden"
              @change="handleFileSelect"
            />

            <div
              v-if="!form.pdfFile"
              class="flex items-center justify-center gap-3"
            >
              <svg
                class="h-8 w-8 text-gray-400 shrink-0"
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
              <div class="text-left">
                <p class="text-gray-600 dark:text-gray-400 font-medium">
                  Перетащите PDF файл или
                  <span class="text-primary">выберите</span>
                </p>
                <p class="text-xs text-gray-500">Максимальный размер: 100 МБ</p>
              </div>
            </div>

            <div v-else class="flex items-center justify-center gap-3">
              <svg
                class="w-8 h-8 text-red-500 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="text-left flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">
                  {{ form.pdfFile.name }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatFileSize(form.pdfFile.size) }}
                </p>
              </div>
              <button
                type="button"
                @click.stop="removeFile"
                class="ml-auto p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
              </button>
            </div>
          </div>
          <p v-if="errors.pdfFile" class="mt-1 text-sm text-red-500">
            {{ errors.pdfFile }}
          </p>
        </div>

        <!-- Горизонтальные поля формы -->
        <div class="grid grid-cols-2 gap-4">
          <!-- Название -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Название книги <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              placeholder="Введите название книги"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"
              :class="{ 'border-red-500': errors.title }"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-500">
              {{ errors.title }}
            </p>
          </div>

          <!-- Автор -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Автор
            </label>
            <input
              v-model="form.author"
              type="text"
              placeholder="Введите имя автора"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"
            />
          </div>

          <!-- Язык -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Язык <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.language"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none text-sm"
              :class="{ 'border-red-500': errors.language }"
            >
              <option value="">Выберите язык</option>
              <option value="ru">Русский</option>
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="kk">Қазақша</option>
            </select>
            <p v-if="errors.language" class="mt-1 text-sm text-red-500">
              {{ errors.language }}
            </p>
          </div>

          <!-- Дата выпуска -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Дата выпуска
            </label>
            <input
              v-model="form.publishedAt"
              type="date"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary text-sm"
            />
          </div>
        </div>

        <!-- Описание (полная ширина) -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Краткое описание книги"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none text-sm"
          ></textarea>
        </div>

        <!-- Обложка (горизонтальная) -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Обложка (опционально)
          </label>
          <div class="flex items-center gap-4">
            <div
              v-if="coverPreview"
              class="relative w-16 h-22 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0"
              style="height: 88px"
            >
              <img
                :src="coverPreview"
                alt="Обложка"
                class="w-full h-full object-cover"
              />
              <button
                type="button"
                @click="removeCover"
                class="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg
                  class="w-3 h-3"
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
              </button>
            </div>
            <div class="flex-1">
              <input
                ref="coverInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleCoverSelect"
              />
              <button
                type="button"
                @click="triggerCoverInput"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {{ coverPreview ? "Изменить обложку" : "Выбрать обложку" }}
              </button>
              <p class="mt-1 text-xs text-gray-500">
                Если не указана, будет использована первая страница PDF
              </p>
            </div>
          </div>
        </div>

        <!-- Прогресс загрузки -->
        <div
          v-if="uploadProgress > 0 && uploadProgress < 100"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">Загрузка...</span>
            <span class="font-medium text-primary">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-primary rounded-full h-2 transition-all duration-300"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton
          variant="secondary"
          :disabled="uploading"
          @click="handleClose"
        >
          Отмена
        </UiButton>
        <UiButton :disabled="uploading" @click="handleSubmit">
          <span v-if="uploading" class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Загрузка...
          </span>
          <span v-else>Загрузить книгу</span>
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "~/composables/useToast";

interface Props {
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  uploaded: [];
}>();

const toast = useToast();

// Refs
const pdfInput = ref<HTMLInputElement>();
const coverInput = ref<HTMLInputElement>();

const triggerPdfInput = () => {
  pdfInput.value?.click();
};

const triggerCoverInput = () => {
  coverInput.value?.click();
};

// Состояние
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const coverPreview = ref("");

const form = ref({
  pdfFile: null as File | null,
  coverFile: null as File | null,
  title: "",
  author: "",
  description: "",
  language: "",
  publishedAt: "",
});

const errors = ref({
  pdfFile: "",
  title: "",
  language: "",
});

// Методы
const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files[0]) {
    validateAndSetPdfFile(files[0]);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    validateAndSetPdfFile(target.files[0]);
  }
};

const validateAndSetPdfFile = (file: File) => {
  errors.value.pdfFile = "";

  if (file.type !== "application/pdf") {
    errors.value.pdfFile = "Пожалуйста, выберите PDF файл";
    return;
  }

  if (file.size > 100 * 1024 * 1024) {
    errors.value.pdfFile = "Размер файла не должен превышать 100 МБ";
    return;
  }

  form.value.pdfFile = file;
};

const removeFile = () => {
  form.value.pdfFile = null;
  if (pdfInput.value) {
    pdfInput.value.value = "";
  }
};

const handleCoverSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Пожалуйста, выберите изображение");
      return;
    }

    form.value.coverFile = file;

    // Создаем превью
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const removeCover = () => {
  form.value.coverFile = null;
  coverPreview.value = "";
  if (coverInput.value) {
    coverInput.value.value = "";
  }
};

const validate = () => {
  errors.value = {
    pdfFile: "",
    title: "",
    language: "",
  };

  let isValid = true;

  if (!form.value.pdfFile) {
    errors.value.pdfFile = "Пожалуйста, выберите PDF файл";
    isValid = false;
  }

  if (!form.value.title.trim()) {
    errors.value.title = "Пожалуйста, введите название книги";
    isValid = false;
  }

  if (!form.value.language) {
    errors.value.language = "Пожалуйста, выберите язык";
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validate()) return;

  uploading.value = true;
  uploadProgress.value = 0;

  try {
    const formData = new FormData();
    formData.append("file", form.value.pdfFile!);
    if (form.value.coverFile) {
      formData.append("cover", form.value.coverFile);
    }
    formData.append("title", form.value.title);
    formData.append("author", form.value.author || "");
    formData.append("description", form.value.description || "");
    formData.append("language", form.value.language);
    if (form.value.publishedAt) {
      formData.append("publishedAt", form.value.publishedAt);
    }

    // Симуляция прогресса
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 200);

    await $fetch("/api/library/admin/books", {
      method: "POST",
      body: formData,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    toast.success("Книга успешно загружена");
    emit("uploaded");
    resetForm();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка загрузки книги");
  } finally {
    uploading.value = false;
    uploadProgress.value = 0;
  }
};

const handleClose = () => {
  if (!uploading.value) {
    emit("close");
  }
};

const resetForm = () => {
  form.value = {
    pdfFile: null,
    coverFile: null,
    title: "",
    author: "",
    description: "",
    language: "",
    publishedAt: "",
  };
  errors.value = {
    pdfFile: "",
    title: "",
    language: "",
  };
  coverPreview.value = "";
  if (pdfInput.value) pdfInput.value.value = "";
  if (coverInput.value) coverInput.value.value = "";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Watchers
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  },
);
</script>
