<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="selectedCount > 0"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
    >
      <div
        class="flex items-center gap-4 px-6 py-4 bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-stroke dark:border-strokedark"
      >
        <!-- Счетчик выбранных -->
        <div class="flex items-center gap-2">
          <div
            class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm"
          >
            {{ selectedCount }}
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ selectedCountText }}
          </span>
        </div>

        <div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

        <!-- Кнопки действий -->
        <div class="flex items-center gap-2">
          <!-- Копировать на дату -->
          <button
            @click="$emit('copy')"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            title="Копировать выбранные занятия на другую дату"
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
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            Копировать
          </button>

          <!-- Создать шаблон (только если одна группа) -->
          <button
            v-if="canCreateTemplate"
            @click="$emit('createTemplate')"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-success hover:bg-success/90 rounded-lg transition-colors"
            title="Создать шаблон из выбранных занятий"
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Создать шаблон
          </button>

          <!-- Удалить -->
          <button
            @click="$emit('delete')"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger/90 rounded-lg transition-colors"
            title="Удалить выбранные занятия"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Удалить
          </button>
        </div>

        <div class="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

        <!-- Отмена выбора -->
        <button
          @click="$emit('cancel')"
          class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Отменить выбор"
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
          Отмена
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  selectedCount: number;
  canCreateTemplate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canCreateTemplate: false,
});

defineEmits<{
  copy: [];
  createTemplate: [];
  delete: [];
  cancel: [];
}>();

const selectedCountText = computed(() => {
  const count = props.selectedCount;
  if (count === 1) return "занятие выбрано";
  if (count >= 2 && count <= 4) return "занятия выбрано";
  return "занятий выбрано";
});
</script>
