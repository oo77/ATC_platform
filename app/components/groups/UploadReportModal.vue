<template>
  <UiModal
    :is-open="isOpen"
    title="Загрузить документы"
    size="lg"
    @close="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Информация о группе -->
      <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold"
          >
            {{ groupCode.substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Группа</p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ groupCode }}
            </p>
          </div>
        </div>
      </div>

      <!-- Компонент загрузки -->
      <GroupsGroupReportUploader
        ref="uploaderRef"
        :loading="uploading"
        @files-selected="handleFilesSelected"
      />

      <!-- Ошибки -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
        <div class="flex items-start gap-3">
          <svg
            class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UiButton
          variant="outline"
          @click="$emit('close')"
          :disabled="uploading"
        >
          Отмена
        </UiButton>
        <UiButton
          :loading="uploading"
          :disabled="selectedFiles.length === 0"
          @click="handleUpload"
        >
          Загрузить
          {{ selectedFiles.length > 0 ? `(${selectedFiles.length})` : "" }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  isOpen: boolean;
  groupId: string;
  groupCode: string;
}>();

const emit = defineEmits<{
  close: [];
  uploaded: [];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

const uploaderRef = ref<any>(null);
const selectedFiles = ref<File[]>([]);
const uploading = ref(false);
const error = ref("");

const handleFilesSelected = (files: File[]) => {
  selectedFiles.value = files;
  error.value = "";
};

const handleUpload = async () => {
  if (selectedFiles.value.length === 0) {
    error.value = "Выберите хотя бы один файл";
    return;
  }

  uploading.value = true;
  error.value = "";

  try {
    const formData = new FormData();

    // Добавляем все файлы
    for (const file of selectedFiles.value) {
      formData.append("reportFiles", file);
    }

    const response = await authFetch<{
      success: boolean;
      message?: string;
      files?: any[];
    }>(`/api/groups/${props.groupId}/reports`, {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      toast.success(response.message || "Документы успешно загружены");
      emit("uploaded");
      emit("close");

      // Очистка формы
      selectedFiles.value = [];
      uploaderRef.value?.clearFiles();
    } else {
      error.value = response.message || "Ошибка при загрузке документов";
    }
  } catch (err: any) {
    console.error("Ошибка загрузки документов:", err);
    error.value =
      err.data?.message || "Произошла ошибка при загрузке документов";
  } finally {
    uploading.value = false;
  }
};

// Сброс состояния при закрытии модального окна
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      selectedFiles.value = [];
      error.value = "";
      uploaderRef.value?.clearFiles();
    }
  }
);
</script>
