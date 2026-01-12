<template>
  <nav class="flex items-center gap-2 text-sm mb-4">
    <button
      @click="navigateTo(null)"
      class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
      title="Корневая папка"
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <span class="font-medium">storage</span>
    </button>

    <template v-for="(segment, index) in pathSegments" :key="index">
      <svg class="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>

      <button
        v-if="index < pathSegments.length - 1"
        @click="navigateTo(segment.id)"
        class="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors font-medium truncate max-w-48"
        :title="segment.name"
      >
        {{ segment.name }}
      </button>
      <span
        v-else
        class="text-black dark:text-white font-semibold truncate max-w-48"
        :title="segment.name"
      >
        {{ segment.name }}
      </span>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

interface BreadcrumbSegment {
  id: number | null;
  name: string;
}

interface BreadcrumbsProps {
  path: string;
  currentFolderId: number | null;
}

const props = defineProps<BreadcrumbsProps>();

const emit = defineEmits<{
  navigate: [folderId: number | null];
}>();

const { authFetch } = useAuthFetch();

// Кэш ID папок по путям
const pathIdCache = ref<Map<string, number>>(new Map());

// Загрузка структуры папок для навигации
async function loadFolderPath(folderId: number | null) {
  if (folderId === null) return;
  
  try {
    // Загружаем информацию о папке и её предках
    const response = await authFetch<{ success: boolean; path: Array<{ id: number; name: string }> }>(
      `/api/folders/${folderId}/path`
    );
    
    if (response.success && response.path) {
      // Обновляем кэш
      let currentPath = '';
      for (const folder of response.path) {
        currentPath += '/' + folder.name;
        pathIdCache.value.set(currentPath, folder.id);
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки пути папки:', error);
  }
}

// Разбор пути на сегменты
const pathSegments = computed(() => {
  if (!props.path || props.path === '/') {
    return [];
  }

  const parts = props.path.split('/').filter(Boolean);
  const segments: BreadcrumbSegment[] = [];

  let currentPath = '';
  parts.forEach((name, index) => {
    currentPath += '/' + name;
    const id = pathIdCache.value.get(currentPath) || null;
    
    segments.push({
      id,
      name,
    });
  });

  return segments;
});

const navigateTo = (folderId: number | null) => {
  emit('navigate', folderId);
};

// Загружаем путь при изменении текущей папки
watch(() => props.currentFolderId, (newId) => {
  loadFolderPath(newId);
}, { immediate: true });

onMounted(() => {
  loadFolderPath(props.currentFolderId);
});
</script>

