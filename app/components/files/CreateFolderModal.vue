<template>
  <Modal
    :is-open="isOpen"
    title="Создать папку"
    size="md"
    @close="$emit('close')"
  >
    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label class="mb-2 block text-sm font-medium text-black dark:text-white">
          Название папки
        </label>
        <input
          v-model="folderName"
          type="text"
          placeholder="Введите название..."
          class="w-full rounded border border-stroke bg-transparent px-4 py-2.5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          :disabled="isLoading"
          required
        />
      </div>

      <div v-if="error" class="mb-4 rounded bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>

      <div class="flex justify-end gap-3">
        <button
          type="button"
          @click="$emit('close')"
          class="rounded border border-stroke px-4 py-2 text-black transition hover:bg-gray-50 dark:border-strokedark dark:text-white dark:hover:bg-gray-800"
          :disabled="isLoading"
        >
          Отмена
        </button>
        <button
          type="submit"
          class="rounded bg-primary px-4 py-2 text-white transition hover:bg-opacity-90 disabled:opacity-50"
          :disabled="isLoading || !folderName.trim()"
        >
          {{ isLoading ? 'Создание...' : 'Создать' }}
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from '~/components/ui/Modal.vue';

interface CreateFolderModalProps {
  isOpen: boolean;
  parentId?: number | null;
}

const props = defineProps<CreateFolderModalProps>();

const emit = defineEmits<{
  close: [];
  created: [folderId: number];
}>();

const { createFolder } = useFolderManager();

const folderName = ref('');
const isLoading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  // Защита от двойного вызова при быстром клике
  if (isLoading.value) return;
  
  if (!folderName.value.trim()) {
    error.value = 'Введите название папки';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const folder = await createFolder(folderName.value.trim(), props.parentId || null);
    folderName.value = '';
    emit('created', folder.id);
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Ошибка создания папки';
  } finally {
    isLoading.value = false;
  }
};

// Сброс при закрытии
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    folderName.value = '';
    error.value = '';
  }
});
</script>
