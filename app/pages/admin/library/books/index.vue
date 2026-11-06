<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; главное действие — «Загрузить книгу», «Экспорт» вторичный -->
    <UiPageHeader title="Управление библиотекой" description="Управляйте файлами, данными и доступностью книг">
      <template #actions>
        <UiButton variant="outline" :start-icon="Download" @click="exportBooks">Экспорт</UiButton>
        <UiButton variant="primary" :start-icon="Upload" @click="openUploadModal">Загрузить книгу</UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики одной строкой; три статуса одновременно служат быстрым фильтром (клик = фильтр по статусу), поэтому отдельный выпадающий список статусов убран -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Всего книг" :value="pagination.total" :icon="BookOpen" tone="primary" clickable :active="filters.status === ''" @click="selectStatus('')" />
      <UiStat label="Готовы к чтению" :value="stats.ready" :icon="CheckCircle2" tone="success" clickable :active="filters.status === 'ready'" @click="selectStatus('ready')" />
      <UiStat label="В обработке" :value="stats.processing" :icon="Clock" tone="warning" clickable :active="filters.status === 'processing'" @click="selectStatus('processing')" />
      <UiStat label="С ошибками" :value="stats.failed" :icon="AlertCircle" tone="danger" clickable :active="filters.status === 'failed'" @click="selectStatus('failed')" />
    </div>

    <!-- Единый блок фильтров: поиск на виду, автор и язык — в панели; сброс — через чипы -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по названию…"
      :debounce="0"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="admin-library-books"
      @search="handleFilterChange"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #filters>
        <!-- Автор: поле с подсказками (логика blur/mousedown прежняя) -->
        <div class="relative">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Автор</span>
          <div class="relative">
            <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="authorQuery"
              type="text"
              placeholder="Автор…"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-9 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @focus="showAuthorDropdown = true"
              @blur="hideAuthorDropdown"
              @input="handleAuthorInput"
            />
            <ChevronDown
              class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform duration-200"
              :class="showAuthorDropdown ? 'rotate-180 text-primary' : ''"
            />
          </div>
          <div
            v-if="showAuthorDropdown && filteredAuthors.length"
            class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              v-for="author in filteredAuthors"
              :key="author"
              class="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              :class="filters.author === author ? 'bg-primary-50 text-primary dark:bg-primary-500/15' : ''"
              @mousedown.prevent="selectAuthor(author)"
            >
              {{ author }}
            </div>
          </div>
        </div>

        <!-- Язык: обычный select вместо самописного списка -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Язык</span>
          <select
            :value="filters.language"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="(e) => selectLanguage((e.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>
      </template>
    </UiFilterBar>

    <!-- Панель массовых действий: одна липкая строка «Выбрано N · действия · Снять» -->
    <transition name="slide-down">
      <div
        v-if="selectedBookIds.size > 0"
        class="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary-50 px-4 py-2.5 dark:bg-gray-900 dark:ring-1 dark:ring-primary/30"
      >
        <span class="text-sm font-medium text-primary dark:text-primary-300">Выбрано: {{ selectedBookIds.size }}</span>
        <div class="ml-auto flex flex-wrap items-center gap-2">
          <UiButton size="sm" variant="primary" @click="openBulkAccessModal">Выдать доступ</UiButton>
          <UiButton size="sm" variant="danger-ghost" @click="openBulkRevokeModal">Отозвать доступы</UiButton>
          <UiButton size="sm" variant="ghost" @click="clearSelection">Снять</UiButton>
        </div>
      </div>
    </transition>

    <!-- Карточка таблицы книг -->
    <div id="books-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-500">Загрузка книг...</p>
      </div>

      <!-- Пусто: следующий шаг — загрузить книгу или сбросить фильтры -->
      <UiEmptyState
        v-else-if="books.length === 0"
        :icon="BookOpen"
        title="Книги не найдены"
        :description="hasActiveFilters ? 'Измените условия поиска или сбросьте фильтры' : 'Загрузите первую книгу в библиотеку'"
      >
        <template #actions>
          <UiButton v-if="hasActiveFilters" variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
          <UiButton v-else variant="primary" size="sm" :start-icon="Upload" @click="openUploadModal">Загрузить книгу</UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица со sticky-шапкой -->
      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <!-- Чекбокс "Выбрать все" -->
              <th class="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected"
                  @change="toggleSelectAll"
                  aria-label="Выбрать все"
                  class="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Название / Автор</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Язык</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Страницы</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Читатели</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Загружена</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="book in books"
              :key="book.id"
              :class="[
                'transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]',
                selectedBookIds.has(book.id) ? 'bg-primary-50/60 dark:bg-primary-500/10' : '',
              ]"
            >
              <!-- Чекбокс -->
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="selectedBookIds.has(book.id)"
                  @change="toggleBookSelection(book.id)"
                  :aria-label="`Выбрать «${book.title}»`"
                  class="h-4 w-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                />
              </td>

              <!-- Название / автор · год (колонка «Год» объединена с автором — меньше столбцов) -->
              <td class="px-4 py-3">
                <div class="max-w-md">
                  <p class="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{{ book.title }}</p>
                  <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ book.author || "Автор не указан" }}
                    <template v-if="(book as any).published_year || (book as any).published_at"> · {{ (book as any).published_year || (book as any).published_at }}</template>
                  </p>
                  <p v-if="book.description" class="mt-0.5 line-clamp-1 text-xs text-gray-400">{{ book.description }}</p>
                </div>
              </td>

              <!-- Язык -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-200">
                  {{ getLanguageLabel(book.language) }}
                </span>
              </td>

              <!-- Страницы -->
              <td class="px-4 py-3 text-center">
                <span class="text-sm tabular-nums text-gray-900 dark:text-white">{{ book.total_pages || 0 }}</span>
              </td>

              <!-- Статус -->
              <td class="px-4 py-3">
                <UiBadge :color="book.status === 'ready' ? 'success' : book.status === 'processing' ? 'warning' : 'error'" size="sm">
                  {{ getStatusLabel(book.status) }}
                </UiBadge>
              </td>

              <!-- Читатели -->
              <td class="px-4 py-3 text-center">
                <span class="text-sm tabular-nums text-gray-900 dark:text-white">{{ book.readers_count || 0 }}</span>
              </td>

              <!-- Дата загрузки -->
              <td class="px-4 py-3">
                <span class="whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{{ formatDate(book.created_at) }}</span>
              </td>

              <!-- Действия: 1 иконка «Аналитика» + «⋯» (доступ, редактирование, переобработка, удаление последним) -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-1">
                  <UiButton variant="ghost" size="sm" icon title="Аналитика" aria-label="Аналитика" @click="viewAnalytics(book)">
                    <BarChart3 class="h-4 w-4" />
                  </UiButton>
                  <UiDropdown
                    icon-only
                    variant="ghost"
                    size="sm"
                    aria-label="Действия с книгой"
                    :groups="bookMenuGroups(book)"
                    @select="(key) => onBookAction(key, book)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Единая пагинация внутри карточки -->
      <UiPagination
        :current-page="pagination.page"
        :total-pages="Math.ceil(pagination.total / pagination.limit)"
        :total="pagination.total"
        :limit="pagination.limit"
        scroll-target="#books-table"
        @update:page="handlePageChange"
        @update:limit="
          (l: number) => {
            pagination.limit = l;
            fetchBooks();
          }
        "
      />
    </div>

    <!-- Модальные окна -->
    <LibraryUploadBookModal
      :is-open="isUploadModalOpen"
      @close="closeUploadModal"
      @uploaded="handleBookUploaded"
    />

    <LibraryEditBookModal
      :is-open="isEditModalOpen"
      :book="selectedBook"
      @close="closeEditModal"
      @updated="handleBookUpdated"
    />

    <LibraryAccessModal
      :is-open="isAccessModalOpen"
      :book="selectedBook"
      @close="closeAccessModal"
    />

    <LibraryAnalyticsModal
      :is-open="isAnalyticsModalOpen"
      :book="selectedBook"
      @close="closeAnalyticsModal"
    />

    <!-- Модал массовой выдачи доступа -->
    <UiModal
      :is-open="isBulkAccessModalOpen"
      title="Массовая выдача доступа"
      size="md"
      @close="closeBulkAccessModal"
    >
      <div class="space-y-5">
        <!-- Информация о выбранных книгах -->
        <div class="flex items-center gap-3 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
          <svg
            class="w-5 h-5 text-primary shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">
              Выбрано книг: {{ selectedBookIds.size }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Доступ будет выдан ко всем выбранным книгам
            </p>
          </div>
        </div>

        <!-- Тип доступа -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Тип доступа
          </label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="bulkAccessForm.type"
                type="radio"
                value="user"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Пользователь
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="bulkAccessForm.type"
                type="radio"
                value="group"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Группа
              </span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="bulkAccessForm.type"
                type="radio"
                value="role"
                class="text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                Роль
              </span>
            </label>
          </div>
        </div>

        <!-- Выбор значения -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{
              bulkAccessForm.type === "user"
                ? "Пользователь"
                : bulkAccessForm.type === "group"
                  ? "Группа"
                  : "Роль"
            }}
          </label>
          <select
            v-model="bulkAccessForm.targetId"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          >
            <option value="">
              {{
                bulkAccessForm.type === "user"
                  ? "Выберите пользователя"
                  : bulkAccessForm.type === "group"
                    ? "Выберите группу"
                    : "Выберите роль"
              }}
            </option>
            <template v-if="bulkAccessForm.type === 'user'">
              <option v-for="u in bulkUsers" :key="u.id" :value="u.id">
                {{ u.name }}
              </option>
            </template>
            <template v-else-if="bulkAccessForm.type === 'group'">
              <option v-for="g in bulkGroups" :key="g.id" :value="g.id">
                {{ g.name }}
              </option>
            </template>
            <template v-else-if="bulkAccessForm.type === 'role'">
              <option v-for="r in bulkRoles" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </template>
          </select>
          <p
            v-if="!bulkAccessForm.targetId && bulkSubmitAttempted"
            class="mt-1 text-xs text-danger"
          >
            Необходимо выбрать {{ bulkAccessForm.type === "user" ? "пользователя" : bulkAccessForm.type === "group" ? "группу" : "роль" }}
          </p>
        </div>

        <!-- Кнопки -->
        <div class="flex gap-3 pt-2">
          <UiButton
            @click="grantBulkAccess"
            :disabled="!bulkAccessForm.targetId || bulkGranting"
            class="flex-1 flex items-center justify-center gap-2"
          >
            <span v-if="bulkGranting" class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Назначение...
            </span>
            <span v-else>Выдать доступ</span>
          </UiButton>
          <UiButton
            variant="secondary"
            @click="closeBulkAccessModal"
            :disabled="bulkGranting"
          >
            Отмена
          </UiButton>
        </div>
      </div>
    </UiModal>

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Подтверждение удаления"
      message="Вы уверены, что хотите удалить эту книгу?"
      :item-name="selectedBook?.title"
      warning="Все файлы книги и история чтения будут безвозвратно удалены."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="closeDeleteModal"
    />

    <!-- Модал подтверждения массового отзыва доступов -->
    <UiModal
      :is-open="isBulkRevokeModalOpen"
      title="Отозвать все доступы"
      size="md"
      @close="closeBulkRevokeModal"
    >
      <div class="space-y-5">
        <!-- Предупреждение -->
        <div class="flex items-start gap-3 p-4 bg-danger/5 dark:bg-danger/10 rounded-lg border border-danger/20">
          <svg
            class="w-5 h-5 text-danger shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p class="font-medium text-danger">
              Внимание! Необратимое действие
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Будут удалены <strong>все записи доступа</strong> (пользователи, группы, роли) для
              <strong>{{ selectedBookIds.size }}</strong>
              {{ selectedBookIds.size === 1 ? 'выбранной книги' : 'выбранных книг' }}.
              Пользователи сразу потеряют доступ к этим книгам.
            </p>
          </div>
        </div>

        <!-- Опция force -->
        <label class="flex items-start gap-3 cursor-pointer group">
          <input
            v-model="bulkRevokeForce"
            type="checkbox"
            class="mt-0.5 rounded border-stroke text-danger focus:ring-danger"
          />
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white group-hover:text-danger transition-colors">
              Принудительно закрыть активные сессии чтения
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Если не отмечено — книги с активными читателями будут пропущены
            </p>
          </div>
        </label>

        <!-- Кнопки -->
        <div class="flex gap-3 pt-2">
          <UiButton
            @click="revokeBulkAccess"
            variant="danger"
            :disabled="bulkRevoking"
            class="flex-1 flex items-center justify-center gap-2"
          >
            <span v-if="bulkRevoking" class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Отзыв доступов...
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Отозвать все доступы
            </span>
          </UiButton>
          <UiButton
            variant="secondary"
            @click="closeBulkRevokeModal"
            :disabled="bulkRevoking"
          >
            Отмена
          </UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useToast } from "~/composables/useToast";
// Иконки для нового интерфейса: кнопки шапки, метрики, поле автора и пункты меню «⋯»
import {
  Download, Upload, BookOpen, CheckCircle2, Clock, AlertCircle, User, ChevronDown,
  BarChart3, Users, Pencil, RefreshCw, Trash2,
} from "lucide-vue-next";

const exportBooks = () => {
  const params = new URLSearchParams({
    ...(filters.value.search && { search: filters.value.search }),
    ...(filters.value.status && { status: filters.value.status }),
    ...(filters.value.language && { language: filters.value.language }),
  });
  window.open(`/api/library/admin/books/export?${params}`, "_blank");
};

definePageMeta({
  layout: "default",
});

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  language: string;
  cover_url: string | null;
  total_pages: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
  published_at: string | null;
  published_year: number | null;
  readers_count?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const toast = useToast();

// Состояние
const loading = ref(false);
const books = ref<Book[]>([]);
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
});

const stats = ref({
  ready: 0,
  processing: 0,
  failed: 0,
});

// Фильтры
const filters = ref({
  search: "",
  status: "",
  language: "",
  author: "",
});

const authors = ref<string[]>([]);
const authorQuery = ref("");
const showAuthorDropdown = ref(false);
const showStatusDropdown = ref(false);
const showLanguageDropdown = ref(false);

const filteredAuthors = computed(() => {
  if (!authorQuery.value) return authors.value;
  return authors.value.filter((a) =>
    a.toLowerCase().includes(authorQuery.value.toLowerCase()),
  );
});

const statusOptions = [
  { label: "Все статусы", value: "" },
  { label: "Готовы к чтению", value: "ready" },
  { label: "В обработке", value: "processing" },
  { label: "С ошибками", value: "failed" },
];

const languageOptions = [
  { label: "Все языки", value: "" },
  { label: "🇷🇺 Русский", value: "ru" },
  { label: "🇺🇿 O'zbekcha", value: "uz" },
  { label: "🇬🇧 English", value: "en" },
  { label: "🇰🇿 Қазақша", value: "kk" },
];

const currentStatusLabel = computed(() => {
  return (
    statusOptions.find((o) => o.value === filters.value.status)?.label ||
    "Все статусы"
  );
});

const currentLanguageLabel = computed(() => {
  return (
    languageOptions.find((o) => o.value === filters.value.language)?.label ||
    "Все языки"
  );
});

// Модальные окна
const isUploadModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isAccessModalOpen = ref(false);
const isAnalyticsModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);
const selectedBook = ref<Book | null>(null);

// --- Массовое выделение ---
const selectedBookIds = ref<Set<string>>(new Set());

const isAllSelected = computed(
  () => books.value.length > 0 && selectedBookIds.value.size === books.value.length,
);

const isSomeSelected = computed(
  () => selectedBookIds.value.size > 0 && selectedBookIds.value.size < books.value.length,
);

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedBookIds.value = new Set();
  } else {
    selectedBookIds.value = new Set(books.value.map((b) => b.id));
  }
};

const toggleBookSelection = (bookId: string) => {
  const newSet = new Set(selectedBookIds.value);
  if (newSet.has(bookId)) {
    newSet.delete(bookId);
  } else {
    newSet.add(bookId);
  }
  selectedBookIds.value = newSet;
};

const clearSelection = () => {
  selectedBookIds.value = new Set();
};

// --- Массовая выдача доступа ---
const isBulkAccessModalOpen = ref(false);
const bulkGranting = ref(false);
const bulkSubmitAttempted = ref(false);
const bulkUsers = ref<{ id: string; name: string }[]>([]);
const bulkGroups = ref<{ id: number; name: string }[]>([]);
const bulkRoles = [
  { id: "STUDENT", name: "Слушатель" },
  { id: "TEACHER", name: "Преподаватель" },
  { id: "MANAGER", name: "Менеджер" },
  { id: "ADMIN", name: "Администратор" },
];

// --- Массовый отзыв доступов ---
const isBulkRevokeModalOpen = ref(false);
const bulkRevoking = ref(false);
const bulkRevokeForce = ref(false);

const openBulkRevokeModal = () => {
  isBulkRevokeModalOpen.value = true;
  bulkRevokeForce.value = false;
};

const closeBulkRevokeModal = () => {
  isBulkRevokeModalOpen.value = false;
};

const revokeBulkAccess = async () => {
  bulkRevoking.value = true;
  try {
    const response = await ($fetch as any)("/api/library/admin/books/bulk-revoke", {
      method: "DELETE",
      body: {
        bookIds: Array.from(selectedBookIds.value),
        force: bulkRevokeForce.value,
      },
    });

    toast.success(response.message || "Доступы успешно отозваны");

    // Предупреждаем о пропущенных книгах (активные сессии без force)
    const skipped = response.results?.filter((r: any) => !r.success) ?? [];
    if (skipped.length > 0) {
      skipped.forEach((r: any) => toast.error(`«${r.bookTitle}»: ${r.message}`));
    }

    closeBulkRevokeModal();
    clearSelection();
    fetchBooks();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка при отзыве доступов");
  } finally {
    bulkRevoking.value = false;
  }
};

const bulkAccessForm = ref({
  type: "role" as "user" | "group" | "role",
  targetId: "",
});

const openBulkAccessModal = async () => {
  isBulkAccessModalOpen.value = true;
  bulkSubmitAttempted.value = false;
  bulkAccessForm.value = { type: "role", targetId: "" };
  await fetchBulkUsersAndGroups();
};

const closeBulkAccessModal = () => {
  isBulkAccessModalOpen.value = false;
  bulkSubmitAttempted.value = false;
};

const fetchBulkUsersAndGroups = async () => {
  try {
    const [usersRes, groupsRes] = await Promise.all([
      $fetch("/api/users"),
      $fetch("/api/groups"),
    ]);
    bulkUsers.value = (usersRes as any).users.map((u: any) => ({
      id: u.id,
      name: `${u.name} (${u.email})`,
    }));
    bulkGroups.value = (groupsRes as any).groups.map((g: any) => ({
      id: g.id,
      name: g.name,
    }));
  } catch (error) {
    console.error("Ошибка загрузки пользователей/групп:", error);
  }
};

const grantBulkAccess = async () => {
  bulkSubmitAttempted.value = true;

  if (!bulkAccessForm.value.targetId) {
    toast.error("Необходимо выбрать получателя доступа");
    return;
  }

  bulkGranting.value = true;
  try {
    const body: Record<string, any> = {
      bookIds: Array.from(selectedBookIds.value),
      type: bulkAccessForm.value.type,
    };

    if (bulkAccessForm.value.type === "user") {
      body.userId = bulkAccessForm.value.targetId;
    } else if (bulkAccessForm.value.type === "group") {
      body.groupId = Number(bulkAccessForm.value.targetId);
    } else if (bulkAccessForm.value.type === "role") {
      body.roleName = bulkAccessForm.value.targetId;
    }

    const response = await $fetch("/api/library/admin/books/bulk-access", {
      method: "POST",
      body,
    }) as any;

    toast.success(response.message || "Доступ успешно назначен");
    closeBulkAccessModal();
    clearSelection();
    fetchBooks();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка при массовом назначении доступа");
  } finally {
    bulkGranting.value = false;
  }
};

// Чипы применённых фильтров (статус, язык, автор, поиск) — состояние видно и снимается по одному
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (filters.value.search) chips.push({ key: "search", label: `Поиск: ${filters.value.search}` });
  if (filters.value.status) chips.push({ key: "status", label: `Статус: ${currentStatusLabel.value}` });
  if (filters.value.language) chips.push({ key: "language", label: `Язык: ${currentLanguageLabel.value}` });
  if (filters.value.author) chips.push({ key: "author", label: `Автор: ${filters.value.author}` });
  return chips;
});
const removeFilterChip = (key: string) => {
  if (key === "author") authorQuery.value = "";
  (filters.value as Record<string, string>)[key] = "";
  handleFilterChange();
};

// Меню «⋯» строки: доступ, редактирование, переобработка (кроме книг в обработке), затем удаление красным и отдельной группой
const bookMenuGroups = (book: Book) => [
  {
    items: [
      { key: "access", label: "Управление доступом", icon: Users },
      { key: "edit", label: "Редактировать", icon: Pencil },
      { key: "reprocess", label: "Переобработать", icon: RefreshCw, hidden: book.status === "processing" },
    ],
  },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];
// Диспетчер меню вызывает прежние обработчики manageAccess / editBook / reprocessBook / confirmDelete
const onBookAction = (key: string, book: Book) => {
  if (key === "access") manageAccess(book);
  else if (key === "edit") editBook(book);
  else if (key === "reprocess") reprocessBook(book);
  else if (key === "delete") confirmDelete(book);
};

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.language || filters.value.author;
});

// Методы
const fetchBooks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      ...(filters.value.search && { search: filters.value.search }),
      ...(filters.value.status && { status: filters.value.status }),
      ...(filters.value.language && { language: filters.value.language }),
      ...(filters.value.author && { author: filters.value.author }),
    });

    const response = (await $fetch(`/api/library/admin/books?${params}`)) as {
      books: Book[];
      total: number;
      stats: { ready: number; processing: number; failed: number };
    };
    books.value = response.books;
    pagination.value.total = response.total;
    stats.value = response.stats;

    // Снимаем выделение с книг, которые больше не в списке
    const currentIds = new Set(response.books.map((b) => b.id));
    const newSelected = new Set(
      Array.from(selectedBookIds.value).filter((id) => currentIds.has(id)),
    );
    selectedBookIds.value = newSelected;
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка загрузки книг");
  } finally {
    loading.value = false;
  }
};

const fetchAuthors = async () => {
  try {
    const res = await $fetch<{ authors: string[] }>(
      "/api/library/catalog/authors",
    );
    authors.value = res.authors;
  } catch (error) {
    console.warn("Failed to fetch authors", error);
  }
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchBooks();
};

const handleAuthorInput = () => {
  filters.value.author = authorQuery.value;
  handleFilterChange();
};

const selectAuthor = (author: string) => {
  authorQuery.value = author;
  filters.value.author = author;
  showAuthorDropdown.value = false;
  handleFilterChange();
};

const selectStatus = (val: string) => {
  filters.value.status = val;
  showStatusDropdown.value = false;
  handleFilterChange();
};

const selectLanguage = (val: string) => {
  filters.value.language = val;
  showLanguageDropdown.value = false;
  handleFilterChange();
};

const hideAuthorDropdown = () => {
  setTimeout(() => {
    showAuthorDropdown.value = false;
  }, 200);
};

const hideStatusDropdown = () => {
  setTimeout(() => {
    showStatusDropdown.value = false;
  }, 200);
};

const hideLanguageDropdown = () => {
  setTimeout(() => {
    showLanguageDropdown.value = false;
  }, 200);
};

const resetFilters = () => {
  filters.value = {
    search: "",
    status: "",
    language: "",
    author: "",
  };
  authorQuery.value = "";
  handleFilterChange();
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchBooks();
};

const openUploadModal = () => {
  isUploadModalOpen.value = true;
};

const closeUploadModal = () => {
  isUploadModalOpen.value = false;
};

const handleBookUploaded = () => {
  closeUploadModal();
  fetchBooks();
  toast.success("Книга успешно загружена и отправлена на обработку");
};

const editBook = (book: Book) => {
  selectedBook.value = book;
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  selectedBook.value = null;
};

const handleBookUpdated = () => {
  closeEditModal();
  fetchBooks();
  toast.success("Книга успешно обновлена");
};

const manageAccess = (book: Book) => {
  selectedBook.value = book;
  isAccessModalOpen.value = true;
};

const closeAccessModal = () => {
  isAccessModalOpen.value = false;
  selectedBook.value = null;
};

const viewAnalytics = (book: Book) => {
  selectedBook.value = book;
  isAnalyticsModalOpen.value = true;
};

const closeAnalyticsModal = () => {
  isAnalyticsModalOpen.value = false;
  selectedBook.value = null;
};

const reprocessBook = async (book: Book) => {
  try {
    await $fetch(`/api/library/admin/books/${book.id}/reprocess`, {
      method: "POST",
    });
    toast.success("Книга отправлена на повторную обработку");
    fetchBooks();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка переобработки книги");
  }
};

const confirmDelete = (book: Book) => {
  selectedBook.value = book;
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
  selectedBook.value = null;
};

const handleDelete = async () => {
  if (!selectedBook.value) return;

  isDeleting.value = true;
  try {
    await $fetch(`/api/library/admin/books/${selectedBook.value.id}`, {
      method: "DELETE" as any,
    });
    toast.success("Книга успешно удалена");
    closeDeleteModal();
    fetchBooks();
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка удаления книги");
  } finally {
    isDeleting.value = false;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ready: "Готова",
    processing: "Обработка",
    failed: "Ошибка",
  };
  return labels[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getLanguageLabel = (lang: string | null) => {
  if (!lang) return "—";

  const labels: Record<string, string> = {
    ru: "🇷🇺 Русский",
    uz: "🇺🇿 O'zbekcha",
    en: "🇬🇧 English",
    kk: "🇰🇿 Қазақша",
  };
  return labels[lang] || lang.toUpperCase();
};

// Lifecycle
onMounted(() => {
  fetchBooks();
  fetchAuthors();
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 100px;
}
</style>
