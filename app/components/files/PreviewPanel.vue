<template>
  <aside v-if="file" class="flex w-80 shrink-0 flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-full max-lg:max-w-sm max-lg:shadow-theme-lg" aria-label="Предпросмотр файла">
    <div class="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
      <h3 class="truncate text-sm font-semibold text-gray-900 dark:text-white" :title="file.filename">{{ file.filename }}</h3>
      <UiButton variant="ghost" size="sm" icon aria-label="Закрыть предпросмотр" title="Закрыть (Esc)" @click="emit('close')"><X class="h-4 w-4" /></UiButton>
    </div>

    <div class="flex-1 space-y-4 overflow-y-auto p-4">
      <div class="overflow-hidden rounded-xl bg-gray-50 dark:bg-white/[0.04]">
        <img v-if="kind === 'image'" :src="file.url" :alt="file.filename" class="max-h-72 w-full object-contain" />
        <video v-else-if="kind === 'video'" :src="file.url" controls class="max-h-72 w-full" />
        <div v-else-if="kind === 'audio'" class="p-4"><audio :src="file.url" controls class="w-full" /></div>
        <iframe v-else-if="kind === 'pdf'" :src="file.url" title="PDF" class="h-80 w-full" />
        <div v-else class="flex h-40 items-center justify-center"><FileTypeIcon :mime-type="file.mimeType" :extension="file.extension" size="2xl" /></div>
      </div>

      <dl class="space-y-2 text-sm">
        <div class="flex justify-between gap-4"><dt class="text-gray-500">Размер</dt><dd class="text-gray-900 dark:text-white">{{ formatFileSize(file.sizeBytes) }}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-gray-500">Тип</dt><dd class="truncate text-gray-900 dark:text-white" :title="file.mimeType">{{ file.mimeType || '—' }}</dd></div>
        <div class="flex justify-between gap-4"><dt class="text-gray-500">Загружен</dt><dd class="text-gray-900 dark:text-white">{{ formatDate(file.createdAt) }}</dd></div>
      </dl>
    </div>

    <div class="grid grid-cols-2 gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
      <UiButton block :start-icon="Download" @click="emit('download')">Скачать</UiButton>
      <UiButton block variant="outline" :start-icon="ExternalLink" @click="openNew">Открыть</UiButton>
      <UiButton block variant="outline" :start-icon="Link2" @click="emit('copyLink')">Ссылка</UiButton>
      <UiButton block variant="outline" :start-icon="Pencil" @click="emit('rename')">Имя</UiButton>
      <UiButton block class="col-span-2" variant="danger-ghost" :start-icon="Trash2" @click="emit('delete')">Удалить</UiButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { X, Download, ExternalLink, Link2, Pencil, Trash2 } from 'lucide-vue-next';
import FileTypeIcon from '~/components/common/FileTypeIcon.vue';
import type { FileRecord } from '~/types/file';

const props = defineProps<{ file: FileRecord | null; formatFileSize: (b: number) => string }>();
const emit = defineEmits<{ close: []; download: []; delete: []; rename: []; copyLink: [] }>();

const kind = computed(() => {
  const m = props.file?.mimeType || '';
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'application/pdf') return 'pdf';
  return 'other';
});

const openNew = () => props.file && window.open(props.file.url, '_blank', 'noopener');
const formatDate = (d?: string | Date) =>
  d ? new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
</script>
