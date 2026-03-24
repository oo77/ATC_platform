<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Управление библиотекой
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Загрузка, редактирование и управление доступом к книгам
        </p>
      </div>
      <div class="flex gap-2">
        <UiButton
          @click="exportBooks"
          variant="secondary"
          class="flex items-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Экспорт
        </UiButton>
        <UiButton @click="openUploadModal" class="flex items-center gap-2">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          Загрузить книгу
        </UiButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <svg
              class="w-6 h-6 text-primary"
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
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Всего книг
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ pagination.total }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"
          >
            <svg
              class="w-6 h-6 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Готовы к чтению
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ stats.ready }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"
          >
            <svg
              class="w-6 h-6 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
              В обработке
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ stats.processing }}
            </p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10"
          >
            <svg
              class="w-6 h-6 text-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
              С ошибками
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ stats.failed }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div
          class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"
        >
          <svg
            class="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-black dark:text-white">
          Фильтры
        </h4>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
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
          Сбросить
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Поиск -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Название, автор..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="handleFilterChange"
            />
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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

        <!-- Статус -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Статус
          </label>
          <div class="relative">
            <select
              v-model="filters.status"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Все статусы</option>
              <option value="ready">Готовы к чтению</option>
              <option value="processing">В обработке</option>
              <option value="failed">С ошибками</option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
          </div>
        </div>

        <!-- Язык -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Язык
          </label>
          <div class="relative">
            <select
              v-model="filters.language"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Все языки</option>
              <option value="ru">Русский</option>
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="kk">Қазақша</option>
            </select>
            <svg
              class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
          </div>
        </div>
      </div>
    </div>

    <!-- Панель массовых действий -->
    <Transition name="slide-down">
      <div
        v-if="selectedBookIds.size > 0"
        class="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xl px-6 py-4 mb-4 flex items-center gap-4 flex-wrap"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="font-medium text-primary">
            Выбрано книг: {{ selectedBookIds.size }}
          </span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <UiButton
            @click="openBulkAccessModal"
            class="flex items-center gap-2"
            size="sm"
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            Выдать доступ
          </UiButton>
          <UiButton
            @click="openBulkRevokeModal"
            variant="danger"
            class="flex items-center gap-2"
            size="sm"
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            Отозвать доступы
          </UiButton>
          <button
            @click="clearSelection"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Отменить выбор
          </button>
        </div>
      </div>
    </Transition>

    <!-- Список книг -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка книг...</p>
      </div>

      <div
        v-else-if="books.length === 0"
        class="p-12 text-center text-gray-500 dark:text-gray-400"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400"
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
        <p class="mt-4 text-lg font-medium">Книги не найдены</p>
        <p class="mt-2">Загрузите первую книгу в библиотеку</p>
      </div>

      <!-- Таблица книг -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-meta-4">
            <tr class="border-b border-stroke dark:border-strokedark">
              <!-- Чекбокс "Выбрать все" -->
              <th class="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  :indeterminate="isSomeSelected"
                  @change="toggleSelectAll"
                  class="rounded border-stroke text-primary focus:ring-primary cursor-pointer"
                />
              </th>
              <th
                class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Обложка
              </th>
              <th
                class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Название / Автор
              </th>
              <th
                class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Язык
              </th>
              <th
                class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Страницы
              </th>
              <th
                class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Статус
              </th>
              <th
                class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Читатели
              </th>
              <th
                class="px-4 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Дата загрузки
              </th>
              <th
                class="px-4 py-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stroke dark:divide-strokedark">
            <tr
              v-for="book in books"
              :key="book.id"
              :class="[
                'hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors',
                selectedBookIds.has(book.id) ? 'bg-primary/5 dark:bg-primary/10' : '',
              ]"
            >
              <!-- Чекбокс -->
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  :checked="selectedBookIds.has(book.id)"
                  @change="toggleBookSelection(book.id)"
                  class="rounded border-stroke text-primary focus:ring-primary cursor-pointer"
                />
              </td>

              <!-- Обложка -->
              <td class="px-4 py-3">
                <div
                  class="h-16 w-12 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0"
                >
                  <img
                    v-if="book.cover_url"
                    :src="book.cover_url"
                    :alt="book.title"
                    class="h-full w-full object-cover"
                  />
                  <div
                    v-else
                    class="h-full w-full flex items-center justify-center bg-primary/10"
                  >
                    <svg
                      class="w-6 h-6 text-primary/40"
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
                  </div>
                </div>
              </td>

              <!-- Название / Автор -->
              <td class="px-4 py-3">
                <div class="max-w-md">
                  <p
                    class="font-semibold text-gray-900 dark:text-white line-clamp-2"
                  >
                    {{ book.title }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ book.author || "Автор не указан" }}
                  </p>
                  <p
                    v-if="book.description"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1"
                  >
                    {{ book.description }}
                  </p>
                </div>
              </td>

              <!-- Язык -->
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {{ getLanguageLabel(book.language) }}
                </span>
              </td>

              <!-- Страницы -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ book.total_pages || 0 }}
                  </span>
                </div>
              </td>

              <!-- Статус -->
              <td class="px-4 py-3 text-center">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                    book.status === 'ready'
                      ? 'bg-success/10 text-success'
                      : book.status === 'processing'
                        ? 'bg-warning/10 text-warning'
                        : 'bg-danger/10 text-danger',
                  ]"
                >
                  {{ getStatusLabel(book.status) }}
                </span>
              </td>

              <!-- Читатели -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ book.readers_count || 0 }}
                  </span>
                </div>
              </td>

              <!-- Дата загрузки -->
              <td class="px-4 py-3">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(book.created_at) }}
                </span>
              </td>

              <!-- Действия -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="viewAnalytics(book)"
                    class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Аналитика"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                  <button
                    @click="manageAccess(book)"
                    class="p-2 text-gray-500 hover:text-success hover:bg-success/10 rounded-lg transition-colors"
                    title="Управление доступом"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </button>
                  <button
                    @click="editBook(book)"
                    class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                    title="Редактировать"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    v-if="book.status !== 'processing'"
                    @click="reprocessBook(book)"
                    class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Переобработать"
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(book)"
                    class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Удалить"
                  >
                    <svg
                      class="w-5 h-5"
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
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.total > pagination.limit"
        class="border-t border-gray-200 dark:border-gray-700 px-6 py-4"
      >
        <UiPagination
          :current-page="pagination.page"
          :total-pages="Math.ceil(pagination.total / pagination.limit)"
          :total="pagination.total"
          :limit="pagination.limit"
          @update:page="handlePageChange"
          @update:limit="
            (l: number) => {
              pagination.limit = l;
              fetchBooks();
            }
          "
        />
      </div>
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
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
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
    const response = await $fetch("/api/library/admin/books/bulk-revoke", {
      method: "DELETE",
      body: {
        bookIds: Array.from(selectedBookIds.value),
        force: bulkRevokeForce.value,
      },
    }) as any;

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

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status || filters.value.language;
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

const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchBooks();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    status: "",
    language: "",
  };
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
