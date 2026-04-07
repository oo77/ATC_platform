<template>
  <UiModal
    :is-open="isOpen"
    title="Редактировать книгу"
    size="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="p-1">
      <div class="space-y-6">
        <!-- Название -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Название книги <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.title"
            type="text"
            placeholder="Название"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all"
            :class="{ 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100': errors.title }"
          />
          <p v-if="errors.title" class="mt-1.5 text-xs font-bold text-red-500">
            {{ errors.title }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Автор -->
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Автор
            </label>
            <input
              v-model="form.author"
              type="text"
              placeholder="Имя автора"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all"
            />
          </div>

          <!-- Год -->
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Год издания
            </label>
            <input
              v-model="form.publishedYear"
              type="number"
              min="1800"
              max="2100"
              placeholder="Например: 2026"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Язык -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Язык <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.language"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 px-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all appearance-none cursor-pointer"
              :class="{ 'border-red-500 bg-red-50': errors.language }"
            >
              <option value="ru">Русский</option>
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="kk">Қазақша</option>
            </select>
            <p v-if="errors.language" class="mt-1.5 text-xs font-bold text-red-500">
              {{ errors.language }}
            </p>
          </div>
        </div>

        <!-- Описание -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Краткое описание"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm font-medium text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all resize-none"
          ></textarea>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3 mt-4">
        <UiButton variant="outline" :disabled="saving" @click="handleClose" class="rounded-xl border-slate-200">
          Отмена
        </UiButton>
        <UiButton variant="primary" :disabled="saving" @click="handleSubmit" class="rounded-xl">

          <span v-if="saving" class="flex items-center gap-2">
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
            Сохранение...
          </span>
          <span v-else>Сохранить</span>
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "~/composables/useToast";

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  language: string;
  published_year?: number | null;
}

interface Props {
  isOpen: boolean;
  book: Book | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const toast = useToast();

const saving = ref(false);
const form = ref({
  title: "",
  author: "",
  description: "",
  language: "ru",
  publishedYear: "" as number | string,
});

const errors = ref({
  title: "",
  language: "",
  publishedYear: "",
});

const validate = () => {
  errors.value = {
    title: "",
    language: "",
    publishedYear: "",
  };

  let isValid = true;

  if (!form.value.title.trim()) {
    errors.value.title = "Пожалуйста, введите название книги";
    isValid = false;
  }

  if (!form.value.language) {
    errors.value.language = "Пожалуйста, выберите язык";
    isValid = false;
  }

  if (form.value.publishedYear) {
    const year = parseInt(String(form.value.publishedYear));
    if (isNaN(year) || year < 1000 || year > new Date().getFullYear() + 1) {
      errors.value.publishedYear = "Некорректный год издания";
      isValid = false;
    }
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validate() || !props.book) return;

  saving.value = true;

  try {
    await $fetch(`/api/library/admin/books/${props.book.id}`, {
      method: "PATCH" as any,
      body: {
        title: form.value.title,
        author: form.value.author || null,
        description: form.value.description || null,
        language: form.value.language,
        publishedYear: form.value.publishedYear || null,
      },
    });

    toast.success("Книга успешно обновлена");
    emit("updated");
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка обновления книги");
  } finally {
    saving.value = false;
  }
};

const handleClose = () => {
  if (!saving.value) {
    emit("close");
  }
};

watch(
  () => props.book,
  (book) => {
    if (book) {
      form.value = {
        title: book.title,
        author: book.author || "",
        description: book.description || "",
        language: book.language || "ru",
        publishedYear: book.published_year || "",
      };
    }
  },
  { immediate: true }
);
</script>
