<template>
  <Modal
    :is-open="isOpen"
    title="Создать папку"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Название папки
        </label>
        <input
          v-model="folderName"
          type="text"
          placeholder="Введите название папки"
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
        />
      </div>
      <div class="flex justify-end">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Отмена
        </button>
        <button
          @click="createFolder"
          :disabled="!folderName.trim()"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
        >
          {{ isLoading ? 'Создание...' : 'Создать' }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from '~/components/ui/Modal.vue';
import { createFolder } from '~/repositories/folderRepository';

interface Props {
  isOpen: boolean;
  parentId: number | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  created: (folderId: number) => void;
}>();

const folderName = ref('');
const isLoading = ref(false);

const createFolder = async () => {
  if (!folderName.value.trim()) return;

  isLoading.value = true;
  try {
    const folder = await createFolder({
      name: folderName.value.trim(),
      parentId: props.parentId,
    });

    emit('created', folder.id);
    folderName.value = '';
  } catch (error) {
    console.error('Error creating folder:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
</style>