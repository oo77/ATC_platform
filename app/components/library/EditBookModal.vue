<template>
  <UiModal
    :is-open="isOpen"
    title="Редактировать книгу"
    size="md"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Название -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Название книги <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
          :class="{ 'border-red-500': errors.title }"
        />
        <p v-if="errors.title" class="mt-1 text-sm text-red-500">
          {{ errors.title }}
        </p>
      </div>

      <!-- Автор -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Автор
        </label>
        <input
          v-model="form.author"
          type="text"
          class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
        />
      </div>

      <!-- Описание -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Описание
        </label>
        <textarea
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
        ></textarea>
      </div>

      <!-- Язык -->
      <div>
        <label
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Язык <span class="text-red-500">*</span>
        </label>
        <select
          v-model="form.language"
          class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
          :class="{ 'border-red-500': errors.language }"
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <option value="kk">Қазақша</option>
        </select>
        <p v-if="errors.language" class="mt-1 text-sm text-red-500">
          {{ errors.language }}
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton variant="secondary" :disabled="saving" @click="handleClose">
          Отмена
        </UiButton>
        <UiButton :disabled="saving" @click="handleSubmit">
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
});

const errors = ref({
  title: "",
  language: "",
});

const validate = () => {
  errors.value = {
    title: "",
    language: "",
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

  return isValid;
};

const handleSubmit = async () => {
  if (!validate() || !props.book) return;

  saving.value = true;

  try {
    await $fetch(`/api/library/admin/books/${props.book.id}`, {
      method: "PATCH",
      body: {
        title: form.value.title,
        author: form.value.author || null,
        description: form.value.description || null,
        language: form.value.language,
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
        language: book.language,
      };
    }
  },
  { immediate: true },
);
</script>
