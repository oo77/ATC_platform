<template>
  <div class="relative" ref="containerRef">
    <label v-if="label" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {{ label }}
      <span v-if="required" class="text-danger">*</span>
    </label>
    
    <!-- Поле выбора -->
    <div
      @click="toggleDropdown"
      class="w-full rounded-lg border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary cursor-pointer transition-colors"
      :class="{ 'border-primary': isOpen }"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div v-if="selectedItems.length === 0" class="text-gray-400">
            {{ placeholder }}
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <span
              v-for="item in selectedItems"
              :key="item.id"
              class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {{ item.label }}
              <button
                @click.stop="removeItem(item.id)"
                class="hover:text-primary/80 transition-colors"
                type="button"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
        </div>
        <svg
          class="w-5 h-5 text-gray-400 transition-transform ml-2 shrink-0"
          :class="{ 'rotate-180': isOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Выпадающий список -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 w-full rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-lg max-h-60 overflow-auto"
      >
        <!-- Поиск -->
        <div v-if="searchable" class="p-3 border-b border-stroke dark:border-strokedark sticky top-0 bg-white dark:bg-boxdark">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @click.stop
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Список опций -->
        <div class="py-2">
          <div
            v-if="filteredOptions.length === 0"
            class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
          >
            Ничего не найдено
          </div>
          <label
            v-for="option in filteredOptions"
            :key="option.id"
            class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-meta-4 cursor-pointer transition-colors"
            @click.stop
          >
            <input
              type="checkbox"
              :checked="isSelected(option.id)"
              @change="toggleItem(option)"
              class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span class="text-sm text-gray-900 dark:text-white flex-1">
              {{ option.label }}
            </span>
            <span v-if="option.description" class="text-xs text-gray-500 dark:text-gray-400">
              {{ option.description }}
            </span>
          </label>
        </div>

        <!-- Действия -->
        <div v-if="selectedItems.length > 0" class="border-t border-stroke dark:border-strokedark p-3 bg-gray-50 dark:bg-meta-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              Выбрано: {{ selectedItems.length }}
            </span>
            <button
              @click.stop="clearAll"
              type="button"
              class="text-danger hover:text-danger/80 transition-colors font-medium"
            >
              Очистить все
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface MultiSelectOption {
  id: string;
  label: string;
  description?: string;
}

interface Props {
  modelValue: string[] | undefined;
  options: MultiSelectOption[];
  label?: string;
  placeholder?: string;
  hint?: string;
  searchable?: boolean;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Выберите элементы...',
  searchable: true,
  required: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const containerRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const searchQuery = ref('');

const selectedItems = computed(() => {
  const value = props.modelValue || [];
  return props.options.filter(option => value.includes(option.id));
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) {
    return props.options;
  }
  const query = searchQuery.value.toLowerCase();
  return props.options.filter(option =>
    option.label.toLowerCase().includes(query) ||
    option.description?.toLowerCase().includes(query)
  );
});

const isSelected = (id: string) => {
  return (props.modelValue || []).includes(id);
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (!isOpen.value) {
    searchQuery.value = '';
  }
};

const toggleItem = (option: MultiSelectOption) => {
  const currentValue = props.modelValue || [];
  const newValue = [...currentValue];
  const index = newValue.indexOf(option.id);
  
  if (index > -1) {
    newValue.splice(index, 1);
  } else {
    newValue.push(option.id);
  }
  
  emit('update:modelValue', newValue);
};

const removeItem = (id: string) => {
  const currentValue = props.modelValue || [];
  const newValue = currentValue.filter(itemId => itemId !== id);
  emit('update:modelValue', newValue);
};

const clearAll = () => {
  emit('update:modelValue', []);
};

// Закрытие при клике вне компонента
const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
    searchQuery.value = '';
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
