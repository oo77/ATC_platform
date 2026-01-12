<template>
  <div :class="['inline-flex items-center justify-center', sizeClass]">
    <!-- Image -->
    <svg v-if="isImage" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
    </svg>

    <!-- PDF -->
    <svg v-else-if="isPdf" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
    </svg>

    <!-- Video -->
    <svg v-else-if="isVideo" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
    </svg>

    <!-- Archive (ZIP, RAR) -->
    <svg v-else-if="isArchive" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
      <path fill-rule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clip-rule="evenodd" />
    </svg>

    <!-- Excel -->
    <svg v-else-if="isExcel" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd" />
    </svg>

    <!-- Word -->
    <svg v-else-if="isWord" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
    </svg>

    <!-- Audio -->
    <svg v-else-if="isAudio" class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
    </svg>

    <!-- Default File -->
    <svg v-else class="w-full h-full" :class="colorClass" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface FileTypeIconProps {
  mimeType: string;
  extension?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const props = withDefaults(defineProps<FileTypeIconProps>(), {
  size: 'md',
});

// Определение типа файла по MIME type или расширению
const isImage = computed(() => props.mimeType.startsWith('image/'));
const isPdf = computed(() => props.mimeType === 'application/pdf' || props.extension === 'pdf');
const isVideo = computed(() => props.mimeType.startsWith('video/'));
const isAudio = computed(() => props.mimeType.startsWith('audio/'));

const isArchive = computed(() => {
  const archiveTypes = ['application/zip', 'application/x-rar', 'application/x-7z-compressed', 'application/x-tar'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  return archiveTypes.includes(props.mimeType) || (props.extension && archiveExts.includes(props.extension.toLowerCase()));
});

const isExcel = computed(() => {
  const excelTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  const excelExts = ['xls', 'xlsx', 'csv'];
  return excelTypes.includes(props.mimeType) || (props.extension && excelExts.includes(props.extension.toLowerCase()));
});

const isWord = computed(() => {
  const wordTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const wordExts = ['doc', 'docx'];
  return wordTypes.includes(props.mimeType) || (props.extension && wordExts.includes(props.extension.toLowerCase()));
});

// Размеры иконок
const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-4 w-4';
    case 'md': return 'h-6 w-6';
    case 'lg': return 'h-8 w-8';
    case 'xl': return 'h-12 w-12';
    default: return 'h-6 w-6';
  }
});

// Цвета по типам файлов
const colorClass = computed(() => {
  if (isImage.value) return 'text-purple-500';
  if (isPdf.value) return 'text-red-500';
  if (isVideo.value) return 'text-pink-500';
  if (isAudio.value) return 'text-green-500';
  if (isArchive.value) return 'text-yellow-500';
  if (isExcel.value) return 'text-emerald-600';
  if (isWord.value) return 'text-blue-600';
  return 'text-gray-400';
});
</script>
