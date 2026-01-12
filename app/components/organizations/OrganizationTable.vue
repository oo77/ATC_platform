<template>
  <div class="overflow-x-auto">
    <!-- Таблица -->
    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-50 dark:bg-meta-4 text-left">
          <th class="py-4 px-4 font-medium text-black dark:text-white">
            Название
          </th>
          <th class="py-4 px-4 font-medium text-black dark:text-white">
            Код
          </th>
          <th class="py-4 px-4 font-medium text-black dark:text-white text-center">
            Слушатели
          </th>
          <th class="py-4 px-4 font-medium text-black dark:text-white">
            Контакты
          </th>
          <th class="py-4 px-4 font-medium text-black dark:text-white text-center">
            Статус
          </th>
          <th class="py-4 px-4 font-medium text-black dark:text-white text-center">
            Действия
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Загрузка -->
        <tr v-if="loading">
          <td colspan="6" class="py-10 text-center">
            <div class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span class="text-gray-500 dark:text-gray-400">Загрузка...</span>
            </div>
          </td>
        </tr>

        <!-- Пустой список -->
        <tr v-else-if="organizations.length === 0">
          <td colspan="6" class="py-10 text-center">
            <div class="flex flex-col items-center gap-3">
              <div class="h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400">Организации не найдены</p>
            </div>
          </td>
        </tr>

        <!-- Данные -->
        <tr
          v-else
          v-for="organization in organizations"
          :key="organization.id"
          class="border-b border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors cursor-pointer"
          @click="emit('view', organization)"
        >
          <!-- Название -->
          <td class="py-4 px-4">
            <div class="flex flex-col">
              <span class="font-medium text-black dark:text-white">
                {{ organization.name }}
              </span>
              <span v-if="organization.shortName" class="text-sm text-gray-500 dark:text-gray-400">
                {{ organization.shortName }}
              </span>
            </div>
          </td>

          <!-- Код -->
          <td class="py-4 px-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800 dark:bg-meta-4 dark:text-gray-300">
              {{ organization.code }}
            </span>
          </td>

          <!-- Количество слушателей -->
          <td class="py-4 px-4 text-center">
            <span 
              class="inline-flex items-center justify-center min-w-10 px-2 py-1 rounded-full text-sm font-semibold"
              :class="organization.studentsCount > 0 
                ? 'bg-primary/10 text-primary' 
                : 'bg-gray-100 text-gray-500 dark:bg-meta-4 dark:text-gray-400'"
            >
              {{ organization.studentsCount }}
            </span>
          </td>

          <!-- Контакты -->
          <td class="py-4 px-4">
            <div class="flex flex-col gap-1 text-sm">
              <div v-if="organization.contactPhone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ organization.contactPhone }}
              </div>
              <div v-if="organization.contactEmail" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ organization.contactEmail }}
              </div>
              <span v-if="!organization.contactPhone && !organization.contactEmail" class="text-gray-400 dark:text-gray-500">
                Не указаны
              </span>
            </div>
          </td>

          <!-- Статус -->
          <td class="py-4 px-4 text-center">
            <span
              class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
              :class="organization.isActive 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
            >
              {{ organization.isActive ? 'Активна' : 'Неактивна' }}
            </span>
          </td>

          <!-- Действия -->
          <td class="py-4 px-4" @click.stop>
            <div class="flex items-center justify-center gap-2">
              <!-- Редактировать -->
              <button
                @click="emit('edit', organization)"
                class="p-2 rounded-lg text-gray-500 hover:text-primary hover:bg-primary/10 transition-all"
                title="Редактировать"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <!-- Удалить -->
              <button
                @click="emit('delete', organization.id)"
                class="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                :class="{ 'opacity-50 cursor-not-allowed': organization.studentsCount > 0 }"
                :disabled="organization.studentsCount > 0"
                :title="organization.studentsCount > 0 ? 'Нельзя удалить: есть слушатели' : 'Удалить'"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Organization {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  description: string | null;
  isActive: boolean;
  studentsCount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

defineProps<{
  organizations: Organization[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', organization: Organization): void;
  (e: 'delete', id: string): void;
  (e: 'view', organization: Organization): void;
}>();
</script>
