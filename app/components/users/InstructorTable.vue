<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider xl:pl-11">
            ФИО
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Email
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Телефон
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Прием на работу
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Часы (Отраб./Макс.)
          </th>
          <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            Действия
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="6" class="text-center py-12">
            <div class="flex justify-center items-center">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3 text-gray-600 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Нет данных -->
        <tr v-else-if="instructors.length === 0">
          <td colspan="6" class="text-center py-16">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-4 dark:bg-slate-800/50">
              <Users class="w-8 h-8" />
            </div>
            <p class="text-slate-500 dark:text-slate-400 font-medium">
              Инструкторы не найдены
            </p>
          </td>
        </tr>

        <!-- Список инструкторов -->
        <tr
          v-for="instructor in instructors"
          :key="instructor.id"
          class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
        >
          <td class="px-6 py-4 xl:pl-11">
            <NuxtLink 
              :to="`/instructors/${instructor.id}`"
              class="flex items-center gap-3 group"
            >
              <div class="shrink-0">
                <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <span class="text-primary font-bold text-sm">
                    {{ getInitials(instructor.fullName) }}
                  </span>
                </div>
              </div>
              <div>
                <h5 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {{ instructor.fullName }}
                </h5>
                <p class="text-xs font-bold text-slate-500 mt-0.5">
                  ID: {{ instructor.id.substring(0, 8) }}...
                </p>
              </div>
            </NuxtLink>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">{{ instructor.email || '—' }}</p>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300 font-mono">
              {{ instructor.phone || '—' }}
            </p>
          </td>
          <td class="px-6 py-4">
            <p class="font-medium text-slate-700 dark:text-slate-300">
              {{ instructor.hireDate ? formatDate(instructor.hireDate) : '—' }}
            </p>
          </td>
          <td class="px-6 py-4">
            <p class="font-bold text-slate-700 dark:text-slate-300">
              {{ instructor.usedHours !== undefined ? Math.round(instructor.usedHours) : 0 }} / {{ instructor.maxHours }}
            </p>
          </td>
          <td class="px-6 py-4">
            <span
              :class="[
                'inline-flex items-center rounded-lg px-3 py-1 text-xs font-black uppercase tracking-widest border',
                instructor.isActive
                  ? 'bg-success/5 text-success border-success/20'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              ]"
            >
              {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
            </span>
          </td>
          <td class="px-6 py-4">
            <div class="flex items-center justify-center gap-2">
              <NuxtLink :to="`/instructors/${instructor.id}`">
                <UiButton variant="outline" size="sm" title="Просмотр профиля" class="h-8 w-8 p-0! flex items-center justify-center rounded-lg">
                  <Eye class="w-4 h-4 text-slate-500" />
                </UiButton>
              </NuxtLink>
              <UiButton 
                variant="outline" 
                size="sm" 
                @click="$emit('edit', instructor)" 
                title="Редактировать" 
                class="h-8 w-8 p-0! flex items-center justify-center rounded-lg"
              >
                <Edit2 class="w-4 h-4 text-slate-500" />
              </UiButton>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from '~/types/instructor';
import { Eye, Edit2, Users } from 'lucide-vue-next';

interface Props {
  instructors?: Instructor[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  instructors: () => [],
  loading: false,
});

// Утилиты
const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>
