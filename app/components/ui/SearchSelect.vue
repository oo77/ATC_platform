<template>
  <div class="relative" ref="containerRef">
    <!-- Поле выбора -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggleDropdown"
      class="relative w-full text-left outline-none transition-colors"
      :class="[
        buttonClass,
        {
          'border-primary': isOpen,
          'border-danger': invalid,
          'opacity-60 cursor-not-allowed': disabled,
        },
      ]"
    >
      <span v-if="selectedOption" class="block">
        <span
          v-if="selectedOption.description"
          class="block text-xs text-gray-500 dark:text-gray-400"
        >
          {{ selectedOption.description }}
        </span>
        <span class="block break-words text-gray-900 dark:text-white">
          {{ selectedOption.label }}
        </span>
      </span>
      <span v-else class="block truncate text-gray-400">
        {{ placeholder }}
      </span>
      <svg
        class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

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
        class="absolute z-50 mt-1 w-full rounded-lg border border-stroke bg-white dark:bg-boxdark dark:border-strokedark shadow-lg"
      >
        <!-- Поиск -->
        <div class="p-2 border-b border-stroke dark:border-strokedark">
          <div class="relative">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              autocomplete="off"
              :placeholder="searchPlaceholder"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @keydown.down.prevent="moveHighlight(1)"
              @keydown.up.prevent="moveHighlight(-1)"
              @keydown.enter.prevent="selectHighlighted"
              @keydown.esc.prevent.stop="close"
              @keydown.tab="close"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <!-- Список опций -->
        <ul ref="listRef" class="max-h-60 overflow-y-auto py-1">
          <li
            v-if="filteredOptions.length === 0"
            class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
          >
            Ничего не найдено
          </li>
          <li
            v-for="(option, index) in filteredOptions"
            :key="option.id"
            :data-index="index"
            class="px-3 py-2 text-sm cursor-pointer break-words transition-colors"
            :class="[
              index === highlightedIndex
                ? 'bg-gray-100 dark:bg-meta-4'
                : '',
              option.id === modelValue
                ? 'font-medium text-primary'
                : 'text-gray-900 dark:text-white',
            ]"
            @mouseenter="highlightedIndex = index"
            @click="selectOption(option)"
          >
            <span
              v-if="option.description"
              class="block text-xs font-normal text-gray-500 dark:text-gray-400"
            >
              {{ option.description }}
            </span>
            {{ option.label }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue";

export interface SearchSelectOption {
  id: string;
  label: string;
  // Вторая строка мелким шрифтом, тоже участвует в поиске
  description?: string;
}

interface Props {
  modelValue: string | undefined;
  options: SearchSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  buttonClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Выберите...",
  searchPlaceholder: "Поиск...",
  invalid: false,
  disabled: false,
  buttonClass:
    "rounded-lg border border-stroke bg-transparent py-2.5 pl-3 pr-10 text-sm focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [value: string];
}>();

const containerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);
const searchQuery = ref("");
const highlightedIndex = ref(0);

const selectedOption = computed(() =>
  props.options.find((option) => option.id === props.modelValue),
);

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return props.options;
  }
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(query) ||
      option.description?.toLowerCase().includes(query),
  );
});

watch(searchQuery, () => {
  highlightedIndex.value = 0;
  scrollToHighlighted();
});

const scrollToHighlighted = () => {
  nextTick(() => {
    listRef.value
      ?.querySelector(`[data-index="${highlightedIndex.value}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });
};

const open = () => {
  searchQuery.value = "";
  isOpen.value = true;
  const selectedIndex = props.options.findIndex(
    (option) => option.id === props.modelValue,
  );
  // watch(searchQuery) сбрасывает индекс, поэтому выставляем после него
  nextTick(() => {
    highlightedIndex.value = Math.max(selectedIndex, 0);
    searchInputRef.value?.focus();
    scrollToHighlighted();
  });
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = "";
};

const toggleDropdown = () => {
  if (isOpen.value) {
    close();
  } else {
    open();
  }
};

const moveHighlight = (step: number) => {
  const count = filteredOptions.value.length;
  if (count === 0) return;
  highlightedIndex.value = (highlightedIndex.value + step + count) % count;
  scrollToHighlighted();
};

const selectOption = (option: SearchSelectOption) => {
  close();
  if (option.id === props.modelValue) return;
  emit("update:modelValue", option.id);
  emit("change", option.id);
};

const selectHighlighted = () => {
  const option = filteredOptions.value[highlightedIndex.value];
  if (option) {
    selectOption(option);
  }
};

// Закрытие при клике вне компонента
const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    close();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
