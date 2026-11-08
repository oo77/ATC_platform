<template>
  <!-- Контейнер с ограничением высоты: шапка таблицы остаётся на виду при прокрутке -->
  <div class="max-h-[70vh] overflow-auto">
    <table class="w-full border-collapse text-left">
      <!-- Sticky-шапка: непрозрачный фон, обычный регистр, 12px вместо мелких CAPS -->
      <thead>
        <tr class="border-b border-gray-200 dark:border-gray-800">
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Организация</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">ИНН</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Код</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-center text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Слушатели</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Контакты</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Статус</th>
          <th class="sticky top-0 z-10 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">Сертификаты</th>
          <th class="sticky top-0 z-10 w-24 bg-white px-4 py-3 text-right text-xs font-medium text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <span class="sr-only">Действия</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <!-- Загрузка: компактный спиннер -->
        <tr v-if="loading">
          <td colspan="8" class="py-12 text-center">
            <div class="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <div class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
              <span class="ml-3">Загрузка организаций...</span>
            </div>
          </td>
        </tr>

        <!-- Пусто: единый UiEmptyState -->
        <tr v-else-if="organizations.length === 0">
          <td colspan="8">
            <UiEmptyState
              title="Организации не найдены"
              description="Создайте первую организацию или измените параметры поиска"
              :icon="Building2"
            />
          </td>
        </tr>

        <!-- Строки данных: кликабельны (открывают карточку организации), как и раньше -->
        <tr
          v-else
          v-for="org in organizations"
          :key="org.id"
          class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
          @click="emit('view', org)"
        >
          <!-- Название + контактное лицо -->
          <td class="px-4 py-3">
            <p class="text-sm font-medium text-gray-900 transition-colors group-hover:text-primary dark:text-white">
              {{ org.name }}
            </p>
            <p v-if="org.contactPerson" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ org.contactPerson }}
            </p>
          </td>

          <!-- ИНН: моноширинный текст без цветной плашки (один акцентный цвет на строку — у названия) -->
          <td class="px-4 py-3">
            <span v-if="org.inn" class="font-mono text-sm tabular-nums text-gray-700 dark:text-gray-300">{{ org.inn }}</span>
            <span v-else class="text-xs text-gray-400">не указан</span>
          </td>

          <!-- Код: нейтральная плашка -->
          <td class="px-4 py-3">
            <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
              {{ org.code }}
            </span>
          </td>

          <!-- Слушатели: число, нулевое значение приглушено -->
          <td class="px-4 py-3 text-center">
            <span
              class="text-sm font-medium tabular-nums"
              :class="org.studentsCount > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'"
            >
              {{ org.studentsCount }}
            </span>
          </td>

          <!-- Контакты (иконки уменьшены, текст не мельче 12px) -->
          <td class="px-4 py-3">
            <div class="flex flex-col gap-1">
              <div v-if="org.contactPhone" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Phone class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span class="text-xs">{{ org.contactPhone }}</span>
              </div>
              <div v-if="org.contactEmail" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span class="max-w-[150px] truncate text-xs">{{ org.contactEmail }}</span>
              </div>
              <span v-if="!org.contactPhone && !org.contactEmail" class="text-xs text-gray-400">Не указаны</span>
            </div>
          </td>

          <!-- Статус: UiBadge вместо самописной CAPS-плашки -->
          <td class="px-4 py-3">
            <UiBadge :color="org.isActive ? 'success' : 'light'" size="md">
              {{ org.isActive ? 'Активна' : 'Неактивна' }}
            </UiBadge>
          </td>

          <!-- Сертификаты: «выдано / всего» + тонкий прогресс -->
          <td class="px-4 py-3">
            <div class="flex min-w-[130px] flex-col gap-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">Выдано</span>
                <span class="font-medium tabular-nums text-gray-900 dark:text-white">
                  {{ org.issuedCertificates || 0 }} / {{ org.totalCertificates || 0 }}
                </span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div
                  class="h-full rounded-full bg-primary transition-all duration-500"
                  :style="{ width: `${getPercent(org)}%` }"
                ></div>
              </div>
              <div v-if="org.latestCertificateDate" class="text-right text-[11px] text-gray-400">
                {{ formatDate(org.latestCertificateDate) }}
              </div>
            </div>
          </td>

          <!-- Действия: 1 видимая иконка (редактирование) + «⋯»; удаление — последним пунктом, красным. Видно всегда, в т.ч. на touch -->
          <td class="px-4 py-3" @click.stop>
            <div class="flex items-center justify-end gap-1">
              <UiButton
                variant="ghost"
                size="sm"
                icon
                title="Редактировать"
                aria-label="Редактировать организацию"
                @click="emit('edit', org)"
              >
                <Pencil class="h-4 w-4" />
              </UiButton>
              <UiDropdown
                icon-only
                variant="ghost"
                size="sm"
                aria-label="Другие действия"
                :groups="rowMenu(org)"
                @select="(key: string) => onRowAction(key, org)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { Building2, Phone, Mail, Pencil, Download, Trash2 } from 'lucide-vue-next';
import type { Organization } from '~/types/organization';

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

// Меню строки «⋯»: скачивание ZIP, затем отдельной группой — удаление (опасное, последним).
const { canDeleteOrganizations } = usePermissions();

// Удаление по-прежнему недоступно, пока у организации есть слушатели (то же условие, что было у кнопки)
const rowMenu = (org: Organization) => [
  { items: [{ key: 'download', label: 'Скачать сертификаты (ZIP)', icon: Download }] },
  {
    items: [
      {
        key: 'delete',
        label: 'Удалить',
        description: org.studentsCount > 0 ? 'Нельзя удалить: есть слушатели' : undefined,
        icon: Trash2,
        danger: true,
        disabled: org.studentsCount > 0,
        // Удаление — только с правом organizations:delete (иначе сервер ответит 403)
        hidden: !canDeleteOrganizations.value,
      },
    ],
  },
];

// Выбор пункта меню → существующие эмиты (контракт компонента не менялся)
const onRowAction = (key: string, org: Organization) => {
  if (key === 'download') emit('download', org);
  else if (key === 'delete') emit('delete', org.id);
};

const getPercent = (org: Organization) => {
  if (!org.totalCertificates || org.totalCertificates === 0) return 0;
  return Math.round(((org.issuedCertificates || 0) / org.totalCertificates) * 100);
};

const formatDate = (date: string | Date | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
</script>
