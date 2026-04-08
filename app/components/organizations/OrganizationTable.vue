<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Организация</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Код</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Слушатели</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Контакты</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Статус</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Сертификаты</th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Действия</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <!-- Loading -->
        <tr v-if="loading">
          <td colspan="7" class="px-6 py-12 text-center">
            <div class="flex flex-col items-center gap-3">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p class="font-bold text-slate-500 dark:text-slate-400">Загрузка организаций...</p>
            </div>
          </td>
        </tr>

        <!-- Empty State -->
        <tr v-else-if="organizations.length === 0">
          <td colspan="7" class="px-6 py-16 text-center">
            <div class="flex flex-col items-center gap-3">
              <div class="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <Building2 class="w-8 h-8 text-slate-300" />
              </div>
              <p class="text-lg font-bold text-slate-900 dark:text-white">Организации не найдены</p>
              <p class="text-sm text-slate-500 font-medium">Создайте первую организацию или измените параметры фильтра</p>
            </div>
          </td>
        </tr>

        <!-- Data Rows -->
        <tr
          v-else
          v-for="org in organizations"
          :key="org.id"
          class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
          @click="emit('view', org)"
        >
          <!-- Название -->
          <td class="px-6 py-4">
            <div>
              <p class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                {{ org.name }}
              </p>
              <p v-if="org.shortName" class="text-xs font-medium text-slate-400 mt-0.5">
                {{ org.shortName }}
              </p>
            </div>
          </td>

          <!-- Код -->
          <td class="px-6 py-4">
            <span class="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
              {{ org.code }}
            </span>
          </td>

          <!-- Слушатели -->
          <td class="px-6 py-4 text-center">
            <span
              class="inline-flex items-center justify-center min-w-10 px-2.5 py-1 rounded-lg text-sm font-bold"
              :class="org.studentsCount > 0
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'"
            >
              {{ org.studentsCount }}
            </span>
          </td>

          <!-- Контакты -->
          <td class="px-6 py-4">
            <div class="flex flex-col gap-1 text-sm">
              <div v-if="org.contactPhone" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Phone class="w-3.5 h-3.5 shrink-0" />
                <span class="font-medium">{{ org.contactPhone }}</span>
              </div>
              <div v-if="org.contactEmail" class="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail class="w-3.5 h-3.5 shrink-0" />
                <span class="font-medium truncate max-w-[160px]">{{ org.contactEmail }}</span>
              </div>
              <span v-if="!org.contactPhone && !org.contactEmail" class="text-slate-300 dark:text-slate-600 text-xs italic">
                Не указаны
              </span>
            </div>
          </td>

          <!-- Статус -->
          <td class="px-6 py-4 text-center">
            <span
              class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border"
              :class="org.isActive
                ? 'bg-success/5 text-success border-success/20'
                : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="org.isActive ? 'bg-success' : 'bg-slate-400'"></span>
              {{ org.isActive ? 'Активна' : 'Неактивна' }}
            </span>
          </td>

          <!-- Сертификаты -->
          <td class="px-6 py-4">
            <div class="flex flex-col gap-2 min-w-[140px]">
              <div class="flex items-center justify-between text-xs font-bold">
                <span class="text-slate-400">Выдано</span>
                <span class="text-slate-900 dark:text-white">
                  {{ org.issuedCertificates || 0 }} / {{ org.totalCertificates || 0 }}
                </span>
              </div>
              <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-500 rounded-full"
                  :style="{ width: `${getPercent(org)}%` }"
                ></div>
              </div>
              <div v-if="org.latestCertificateDate" class="text-[10px] text-slate-400 text-right">
                {{ formatDate(org.latestCertificateDate) }}
              </div>
            </div>
          </td>

          <!-- Действия -->
          <td class="px-6 py-4" @click.stop>
            <div class="flex items-center justify-center gap-1">
              <button
                @click="emit('edit', org)"
                class="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                title="Редактировать"
              >
                <Pencil class="w-4 h-4" />
              </button>
              <button
                @click="emit('download', org)"
                class="p-2 rounded-lg text-slate-400 hover:text-success hover:bg-success/10 transition-colors"
                title="Скачать сертификаты (ZIP)"
              >
                <Download class="w-4 h-4" />
              </button>
              <button
                @click="emit('delete', org.id)"
                class="p-2 rounded-lg transition-colors"
                :class="org.studentsCount > 0
                  ? 'text-slate-200 dark:text-slate-700 cursor-not-allowed'
                  : 'text-slate-400 hover:text-danger hover:bg-danger/10'"
                :disabled="org.studentsCount > 0"
                :title="org.studentsCount > 0 ? 'Нельзя удалить: есть слушатели' : 'Удалить'"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Building2, Phone, Mail, Pencil, Download, Trash2 } from 'lucide-vue-next';

interface Organization {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  nameUz?: string | null;
  nameEn?: string | null;
  nameRu?: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  totalCertificates?: number;
  issuedCertificates?: number;
  revokedCertificates?: number;
  latestCertificateDate?: string | null;
}

defineProps<{
  organizations: Organization[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', organization: Organization): void;
  (e: 'delete', id: string): void;
  (e: 'view', organization: Organization): void;
  (e: 'download', organization: Organization): void;
}>();

const getPercent = (org: Organization) => {
  if (!org.totalCertificates || org.totalCertificates === 0) return 0;
  return Math.round(((org.issuedCertificates || 0) / org.totalCertificates) * 100);
};

const formatDate = (date: string | Date | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
</script>
