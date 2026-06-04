<template>
  <Modal
    :is-open="isOpen"
    :title="title"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Новое название
        </label>
        <input
          v-model="newName"
          type="text"
          :placeholder="`Введите новое название для ${currentName}`"
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
          @click="rename"
          :disabled="!newName.trim() || isLoading"
          class="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
        >
          {{ isLoading ? 'Переименовывание...' : 'Переименовать' }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Modal from '~/components/ui/Modal.vue';

interface Props {
  isOpen: boolean;
  currentName: string;
  title: string;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  submit: (newName: string) => void;
}>();

const newName = ref('');
const isLoading = ref(false);

const rename = async () => {
  if (!newName.trim()) return;

  isLoading.value = true;
  try {
    emit('submit', newName.trim());
    newName.value = '';
  } catch (error) {
    console.error('Error renaming:', error);
    // TODO: Show error message
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
</style>