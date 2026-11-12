<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div
      class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <nav
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2"
        >
          <NuxtLink
            to="/test-bank"
            class="hover:text-primary transition-colors"
          >
            Банк тестов
          </NuxtLink>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span class="text-black dark:text-white">Шаблоны тестов</span>
        </nav>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Шаблоны тестов
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Готовые конфигурации тестов для использования в учебном процессе
        </p>
      </div>
      <UiButton
        v-if="canManageTemplates"
        @click="openCreateModal"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Создать шаблон
      </UiButton>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
              Всего шаблонов
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
              Активных
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ stats.active }}
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
              С лимитом времени
            </h3>
            <p class="text-2xl font-bold text-black dark:text-white">
              {{ stats.withTimeLimit }}
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
              placeholder="Название, код..."
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

        <!-- Банк вопросов -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Банк вопросов
          </label>
          <div class="relative">
            <select
              v-model="filters.bankId"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Все банки</option>
              <option v-for="bank in banks" :key="bank.id" :value="bank.id">
                {{ bank.name }}
              </option>
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

        <!-- Статус -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Статус
          </label>
          <div class="relative">
            <select
              v-model="filters.isActive"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option :value="undefined">Все</option>
              <option :value="true">Активные</option>
              <option :value="false">Неактивные</option>
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

    <!-- Список шаблонов -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">
          Загрузка шаблонов...
        </p>
      </div>

      <div
        v-else-if="templates.length === 0"
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="mt-4 text-lg font-medium">Шаблоны не найдены</p>
        <p class="mt-2">Создайте первый шаблон теста</p>
      </div>

      <div v-else>
        <!-- Табличное отображение на десктопе -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr
                class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Шаблон теста
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Банк вопросов
                </th>
                <th
                  class="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Параметры
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Языки
                </th>
                <th
                  class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Статус
                </th>
                <th
                  class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="template in templates"
                :key="template.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <!-- Шаблон теста -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0"
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ template.name }}
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span
                          class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                        >
                          {{ template.code }}
                        </span>
                        <span
                          v-if="template.description"
                          class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1"
                        >
                          {{ template.description }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Банк вопросов -->
                <td class="px-6 py-4">
                  <NuxtLink
                    :to="`/test-bank/${template.bank_id}`"
                    class="text-sm text-primary hover:underline"
                  >
                    {{ template.bank_name }}
                  </NuxtLink>
                </td>

                <!-- Параметры -->
                <td class="px-6 py-4">
                  <div
                    class="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <div class="flex items-center justify-center gap-1">
                      <svg
                        class="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{{ getQuestionsLabel(template) }}</span>
                    </div>
                    <div class="flex items-center justify-center gap-1">
                      <svg
                        class="w-3.5 h-3.5"
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
                      <span>{{
                        template.time_limit_minutes
                          ? `${template.time_limit_minutes} мин`
                          : "Без лимита"
                      }}</span>
                    </div>
                    <div class="flex items-center justify-center gap-1">
                      <svg
                        class="w-3.5 h-3.5"
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
                      <span>{{ template.passing_score }}%</span>
                    </div>
                    <div class="flex items-center justify-center gap-1">
                      <svg
                        class="w-3.5 h-3.5"
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
                      <span>{{
                        template.max_attempts === 1
                          ? "1 попытка"
                          : `${template.max_attempts} попыток`
                      }}</span>
                    </div>
                  </div>
                </td>

                <!-- Языки -->
                <td class="px-6 py-4">
                  <div
                    v-if="
                      template.allowed_languages &&
                      template.allowed_languages.length > 0
                    "
                    class="flex flex-wrap items-center gap-1"
                  >
                    <span
                      v-for="lang in template.allowed_languages"
                      :key="lang"
                      :class="languageBadgeClasses[lang]"
                      :title="languageLabels[lang]"
                    >
                      {{ languageFlags[lang] }}
                    </span>
                  </div>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    title="Все языки доступны"
                  >
                    🌐 Все
                  </span>
                </td>

                <!-- Статус -->
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      template.is_active
                        ? 'bg-success/10 text-success'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                    ]"
                  >
                    {{ template.is_active ? "Активен" : "Неактивен" }}
                  </span>
                </td>

                <!-- Действия -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="viewTemplate(template)"
                      class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Настроить"
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="canManageTemplates"
                      @click="openEditModal(template)"
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
                      v-if="canManageTemplates"
                      @click="confirmDelete(template)"
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

        <!-- Карточки на мобильных -->
        <div class="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="template in templates"
            :key="template.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ template.name }}
                  </div>
                  <span
                    class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                  >
                    {{ template.code }}
                  </span>
                </div>
              </div>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  template.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                ]"
              >
                {{ template.is_active ? "Активен" : "Неактивен" }}
              </span>
            </div>

            <div
              v-if="template.description"
              class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2"
            >
              {{ template.description }}
            </div>

            <div class="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Банк:
              <NuxtLink
                :to="`/test-bank/${template.bank_id}`"
                class="text-primary hover:underline"
                >{{ template.bank_name }}</NuxtLink
              >
            </div>

            <div
              class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3"
            >
              <span class="flex items-center gap-1">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ getQuestionsLabel(template) }}
              </span>
              <span class="flex items-center gap-1">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{
                  template.time_limit_minutes
                    ? `${template.time_limit_minutes} мин`
                    : "Без лимита"
                }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <div
                v-if="
                  template.allowed_languages &&
                  template.allowed_languages.length > 0
                "
                class="flex flex-wrap items-center gap-1"
              >
                <span
                  v-for="lang in template.allowed_languages"
                  :key="lang"
                  :class="languageBadgeClasses[lang]"
                  :title="languageLabels[lang]"
                >
                  {{ languageFlags[lang] }}
                </span>
              </div>
              <span
                v-else
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                title="Все языки доступны"
              >
                🌐 Все
              </span>

              <div class="flex items-center gap-2">
                <button
                  @click="viewTemplate(template)"
                  class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
                <button
                  v-if="canManageTemplates"
                  @click="openEditModal(template)"
                  class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
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
                  v-if="canManageTemplates"
                  @click="confirmDelete(template)"
                  class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
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
            </div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.totalPages > 1"
        class="border-t border-gray-200 dark:border-gray-700 px-6 py-4"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Показано
            <span class="font-medium">{{
              (pagination.page - 1) * pagination.limit + 1
            }}</span>
            -
            <span class="font-medium">{{
              Math.min(pagination.page * pagination.limit, pagination.total)
            }}</span>
            из
            <span class="font-medium">{{ pagination.total }}</span>
            шаблонов
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования шаблона -->
    <UiModal
      :is-open="modalOpen"
      :title="editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон теста'"
      size="lg"
      @close="closeModal"
    >
      <form @submit.prevent="saveTemplate" class="space-y-5">
        <!-- Основная информация -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Название -->
          <div class="md:col-span-2">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Название <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Например: Тест по охране труда (базовый)"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              :class="{ 'border-danger': formErrors.name }"
            />
            <p v-if="formErrors.name" class="mt-1 text-sm text-danger">
              {{ formErrors.name }}
            </p>
          </div>

          <!-- Код -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Код <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="OT-TEST-BASE"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary uppercase"
              :class="{ 'border-danger': formErrors.code }"
            />
            <p v-if="formErrors.code" class="mt-1 text-sm text-danger">
              {{ formErrors.code }}
            </p>
          </div>

          <!-- Банк вопросов -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Банк вопросов <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.bank_id"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                :class="{ 'border-danger': formErrors.bank_id }"
              >
                <option value="">Выберите банк</option>
                <option v-for="bank in banks" :key="bank.id" :value="bank.id">
                  {{ bank.name }} ({{ bank.questions_count }} вопросов)
                </option>
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
            <p v-if="formErrors.bank_id" class="mt-1 text-sm text-danger">
              {{ formErrors.bank_id }}
            </p>
          </div>
        </div>

        <!-- Описание -->
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Краткое описание теста..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- Настройки вопросов -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 class="font-medium text-gray-900 dark:text-white mb-4">
            Настройки вопросов
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Режим вопросов -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Режим выбора вопросов
              </label>
              <div class="relative">
                <select
                  v-model="form.questions_mode"
                  class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                >
                  <option value="all">Все вопросы из банка</option>
                  <option value="random">Случайные N вопросов</option>
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

            <!-- Количество вопросов -->
            <div v-if="form.questions_mode === 'random'">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Количество вопросов
              </label>
              <input
                v-model.number="form.questions_count"
                type="number"
                min="1"
                max="100"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4">
            <!-- Перемешивать вопросы -->
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.shuffle_questions"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Перемешивать вопросы</span
              >
            </label>

            <!-- Перемешивать варианты -->
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.shuffle_options"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Перемешивать варианты</span
              >
            </label>
          </div>
        </div>

        <!-- Языки тестирования -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 class="font-medium text-gray-900 dark:text-white mb-4">
            Языки тестирования
          </h4>

          <div class="mb-4">
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Доступные языки <span class="text-danger">*</span>
            </label>
            <div class="flex flex-wrap gap-3">
              <label
                v-for="lang in availableLanguages"
                :key="lang.value"
                class="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all"
                :class="[
                  form.allowed_languages.includes(lang.value)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50',
                ]"
              >
                <input
                  type="checkbox"
                  :value="lang.value"
                  v-model="form.allowed_languages"
                  class="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  @change="onLanguageChange"
                />
                <span class="text-[10px] font-semibold text-gray-500">{{ lang.flag }}</span>
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ lang.label }}</span
                >
              </label>
            </div>
            <p
              v-if="formErrors.allowed_languages"
              class="mt-1 text-sm text-danger"
            >
              {{ formErrors.allowed_languages }}
            </p>
          </div>

          <!-- Валидация количества вопросов по языкам -->
          <div
            v-if="
              form.bank_id &&
              form.allowed_languages.length > 0 &&
              form.questions_mode === 'random'
            "
            class="space-y-2"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Достаточность вопросов (минимум {{ form.questions_count }} на
              каждом языке):
            </p>
            <div
              v-if="languageValidationLoading"
              class="flex items-center gap-2 text-sm text-gray-500"
            >
              <div
                class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
              ></div>
              Проверка...
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="validation in languageValidation"
                :key="validation.language"
                class="flex items-center justify-between p-2 rounded-lg"
                :class="validation.isValid ? 'bg-success/10' : 'bg-danger/10'"
              >
                <div class="flex items-center gap-2">
                  <span>{{ validation.flag }}</span>
                  <span
                    class="text-sm font-medium"
                    :class="validation.isValid ? 'text-success' : 'text-danger'"
                  >
                    {{ validation.label }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm"
                    :class="validation.isValid ? 'text-success' : 'text-danger'"
                  >
                    {{ validation.available }} / {{ validation.required }}
                  </span>
                  <svg
                    v-if="validation.isValid"
                    class="w-5 h-5 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-5 h-5 text-danger"
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
                </div>
              </div>
            </div>
            <p v-if="hasInvalidLanguages" class="text-sm text-danger mt-2">
              ⚠️ Недостаточно вопросов на некоторых языках. Добавьте вопросы или
              уменьшите количество.
            </p>
          </div>
        </div>

        <!-- Настройки прохождения -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h4 class="font-medium text-gray-900 dark:text-white mb-4">
            Настройки прохождения
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Лимит времени -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Лимит времени (мин)
              </label>
              <input
                v-model.number="form.time_limit_minutes"
                type="number"
                min="0"
                max="300"
                placeholder="Без лимита"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              />
              <p class="mt-1 text-xs text-gray-500">0 = без лимита</p>
            </div>

            <!-- Проходной балл -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Проходной балл (%)
              </label>
              <input
                v-model.number="form.passing_score"
                type="number"
                min="1"
                max="100"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              />
            </div>

            <!-- Макс. попыток -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Макс. попыток
              </label>
              <input
                v-model.number="form.max_attempts"
                type="number"
                min="1"
                max="10"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <!-- Показ результатов -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Показ результатов
              </label>
              <div class="relative">
                <select
                  v-model="form.show_results"
                  class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                >
                  <option value="immediately">Сразу после завершения</option>
                  <option value="after_deadline">После дедлайна</option>
                  <option value="manual">Вручную преподавателем</option>
                  <option value="never">Не показывать</option>
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

            <!-- Вопросов на странице -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Вопросов на странице
              </label>
              <div class="relative">
                <select
                  v-model.number="form.questions_per_page"
                  class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
                >
                  <option :value="1">По одному</option>
                  <option :value="5">5 вопросов</option>
                  <option :value="10">10 вопросов</option>
                  <option :value="0">Все сразу</option>
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

          <!-- Возврат к вопросам -->
          <div class="mt-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.allow_back"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Разрешить возврат к предыдущим вопросам</span
              >
            </label>
          </div>
        </div>

        <!-- Антипрокторинг -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white">
              Антипрокторинг
            </h4>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="form.proctoring_enabled"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"
              ></div>
            </label>
          </div>

          <div v-if="form.proctoring_enabled" class="grid grid-cols-2 gap-4">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.proctoring_settings.blockTabSwitch"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Блокировать переключение вкладок</span
              >
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.proctoring_settings.blockCopyPaste"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Блокировать копирование</span
              >
            </label>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.proctoring_settings.blockRightClick"
                type="checkbox"
                class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300"
                >Блокировать правый клик</span
              >
            </label>
          </div>
        </div>

        <!-- Активность -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
              >Шаблон активен</span
            >
          </label>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal"> Отмена </UiButton>
          <UiButton :loading="saving" @click="saveTemplate">
            {{ editingTemplate ? "Сохранить" : "Создать" }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить шаблон теста?"
      :message="`Вы уверены, что хотите удалить шаблон '${deletingTemplate?.name}'? Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deleting"
      @confirm="deleteTemplate"
      @cancel="deleteModalOpen = false"
    />

    <!-- Уведомления -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  TEST_LANGUAGES,
  TEST_LANGUAGE_LABELS,
  TEST_LANGUAGE_FLAGS,
} from "../../../../shared/utils/testLanguages";
import { TEST_LANGUAGE_BADGE_CLASSES } from "../../../utils/testLanguageBadges";

definePageMeta({
  layout: "default",
});

const { authFetch } = useAuthFetch();
const { canManageTestTemplates } = usePermissions();

// Права доступа к управлению шаблонами
const canManageTemplates = canManageTestTemplates;

// Состояние
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const templates = ref([]);
const banks = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  search: "",
  bankId: "",
  isActive: undefined,
});

// Статистика
const stats = computed(() => ({
  active: templates.value.filter((t) => t.is_active).length,
  withTimeLimit: templates.value.filter((t) => t.time_limit_minutes > 0).length,
}));

const hasActiveFilters = computed(() => {
  return (
    filters.value.search !== "" ||
    filters.value.bankId !== "" ||
    filters.value.isActive !== undefined
  );
});

// Модальные окна
const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingTemplate = ref(null);
const deletingTemplate = ref(null);

// Языки
const availableLanguages = TEST_LANGUAGES;

const languageLabels = TEST_LANGUAGE_LABELS;

const languageFlags = TEST_LANGUAGE_FLAGS;

const languageBadgeClasses = Object.fromEntries(
  Object.entries(TEST_LANGUAGE_BADGE_CLASSES).map(([code, colors]) => [
    code,
    `inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full text-[10px] font-semibold ${colors}`,
  ]),
);

// Валидация языков
const languageValidationLoading = ref(false);
const languageValidation = ref([]);

const hasInvalidLanguages = computed(() => {
  return languageValidation.value.some((v) => !v.isValid);
});

// Форма
const getDefaultForm = () => ({
  name: "",
  code: "",
  bank_id: "",
  description: "",
  questions_mode: "all",
  questions_count: 20,
  time_limit_minutes: 30,
  passing_score: 60,
  max_attempts: 1,
  shuffle_questions: true,
  shuffle_options: true,
  questions_per_page: 1,
  show_results: "immediately",
  allow_back: true,
  proctoring_enabled: false,
  proctoring_settings: {
    blockTabSwitch: true,
    blockCopyPaste: false,
    blockRightClick: false,
  },
  allowed_languages: ["ru"],
  is_active: true,
});

const form = ref(getDefaultForm());

const formErrors = ref({
  name: "",
  code: "",
  bank_id: "",
  allowed_languages: "",
});

// Уведомления
const notification = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// Утилиты
const getQuestionsLabel = (template) => {
  if (template.questions_mode === "all") {
    return `Все (${template.questions_total || "?"})`;
  }
  return `${template.questions_count || "?"} случ.`;
};

// Загрузка данных
const loadTemplates = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) {
      params.append("search", filters.value.search);
    }

    if (filters.value.bankId) {
      params.append("bank_id", filters.value.bankId);
    }

    if (filters.value.isActive !== undefined) {
      params.append("is_active", filters.value.isActive.toString());
    }

    const response = await authFetch(
      `/api/test-bank/templates?${params.toString()}`
    );

    if (response.success) {
      templates.value = response.templates;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error("Ошибка загрузки шаблонов:", error);
    showNotification("error", "Ошибка", "Не удалось загрузить шаблоны");
  } finally {
    loading.value = false;
  }
};

const loadBanks = async () => {
  try {
    const response = await authFetch("/api/test-bank/banks/select");
    if (response.success) {
      banks.value = response.banks;
    }
  } catch (error) {
    console.error("Ошибка загрузки банков:", error);
  }
};

// Обработчики фильтров
const handleFilterChange = () => {
  pagination.value.page = 1;
  loadTemplates();
};

const resetFilters = () => {
  filters.value = {
    search: "",
    bankId: "",
    isActive: undefined,
  };
  handleFilterChange();
};

const changePage = (page) => {
  pagination.value.page = page;
  loadTemplates();
};

// Модальные окна
const openCreateModal = () => {
  editingTemplate.value = null;
  form.value = getDefaultForm();
  formErrors.value = { name: "", code: "", bank_id: "", allowed_languages: "" };
  languageValidation.value = [];
  modalOpen.value = true;
};

const openEditModal = (template) => {
  editingTemplate.value = template;
  form.value = {
    name: template.name,
    code: template.code,
    bank_id: template.bank_id,
    description: template.description || "",
    questions_mode: template.questions_mode,
    questions_count: template.questions_count || 20,
    time_limit_minutes: template.time_limit_minutes || 0,
    passing_score: template.passing_score,
    max_attempts: template.max_attempts,
    shuffle_questions: template.shuffle_questions,
    shuffle_options: template.shuffle_options,
    questions_per_page: template.questions_per_page,
    show_results: template.show_results,
    allow_back: template.allow_back,
    proctoring_enabled: template.proctoring_enabled,
    proctoring_settings: template.proctoring_settings || {
      blockTabSwitch: true,
      blockCopyPaste: false,
      blockRightClick: false,
    },
    allowed_languages: template.allowed_languages || ["ru", "uz", "en"],
    is_active: template.is_active,
  };
  formErrors.value = { name: "", code: "", bank_id: "", allowed_languages: "" };
  languageValidation.value = [];
  modalOpen.value = true;
  // Загружаем валидацию при редактировании
  if (form.value.bank_id && form.value.questions_mode === "random") {
    validateLanguages();
  }
};

const closeModal = () => {
  modalOpen.value = false;
  editingTemplate.value = null;
};

const viewTemplate = (template) => {
  navigateTo(`/test-bank/templates/${template.id}`);
};

const confirmDelete = (template) => {
  deletingTemplate.value = template;
  deleteModalOpen.value = true;
};

// Загрузка валидации языков
const validateLanguages = async () => {
  if (!form.value.bank_id || form.value.allowed_languages.length === 0) {
    languageValidation.value = [];
    return;
  }

  languageValidationLoading.value = true;
  try {
    // Используем банк, количество вопросов и выбранные языки
    const minCount =
      form.value.questions_mode === "random" ? form.value.questions_count : 1;
    const languages = form.value.allowed_languages.join(",");

    const response = await authFetch(
      `/api/test-bank/banks/${form.value.bank_id}/validate-languages?min_count=${minCount}&languages=${languages}`
    );

    if (response.success) {
      languageValidation.value = response.validation;
    }
  } catch (error) {
    console.error("Ошибка валидации языков:", error);
  } finally {
    languageValidationLoading.value = false;
  }
};

const onLanguageChange = () => {
  if (form.value.bank_id && form.value.questions_mode === "random") {
    validateLanguages();
  }
};

// Валидация
const validateForm = () => {
  formErrors.value = { name: "", code: "", bank_id: "", allowed_languages: "" };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = "Название обязательно";
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = "Код обязателен";
    isValid = false;
  }

  if (!form.value.bank_id) {
    formErrors.value.bank_id = "Выберите банк вопросов";
    isValid = false;
  }

  if (form.value.allowed_languages.length === 0) {
    formErrors.value.allowed_languages = "Выберите хотя бы один язык";
    isValid = false;
  }

  // Проверяем достаточность вопросов для random режима
  if (form.value.questions_mode === "random" && hasInvalidLanguages.value) {
    formErrors.value.allowed_languages =
      "Недостаточно вопросов на выбранных языках";
    isValid = false;
  }

  return isValid;
};

// Сохранение
const saveTemplate = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      code: form.value.code.trim().toUpperCase(),
      time_limit_minutes: form.value.time_limit_minutes || null,
      proctoring_settings: form.value.proctoring_enabled
        ? form.value.proctoring_settings
        : null,
      allowed_languages: form.value.allowed_languages,
    };

    let response;
    if (editingTemplate.value) {
      response = await authFetch(
        `/api/test-bank/templates/${editingTemplate.value.id}`,
        {
          method: "PUT",
          body: payload,
        }
      );
    } else {
      response = await authFetch("/api/test-bank/templates", {
        method: "POST",
        body: payload,
      });
    }

    if (response.success) {
      showNotification(
        "success",
        "Успешно",
        editingTemplate.value ? "Шаблон обновлён" : "Шаблон создан"
      );
      closeModal();
      loadTemplates();
    } else {
      showNotification(
        "error",
        "Ошибка",
        response.message || "Не удалось сохранить"
      );
    }
  } catch (error) {
    console.error("Ошибка сохранения:", error);
    showNotification("error", "Ошибка", "Произошла ошибка при сохранении");
  } finally {
    saving.value = false;
  }
};

// Удаление
const deleteTemplate = async () => {
  if (!deletingTemplate.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(
      `/api/test-bank/templates/${deletingTemplate.value.id}`,
      {
        method: "DELETE",
      }
    );

    if (response.success) {
      showNotification("success", "Успешно", "Шаблон удалён");
      deleteModalOpen.value = false;
      deletingTemplate.value = null;
      loadTemplates();
    } else {
      showNotification(
        "error",
        "Ошибка",
        response.message || "Не удалось удалить"
      );
    }
  } catch (error) {
    console.error("Ошибка удаления:", error);
    showNotification("error", "Ошибка", "Произошла ошибка при удалении");
  } finally {
    deleting.value = false;
  }
};

// Уведомления
const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Инициализация
onMounted(() => {
  loadTemplates();
  loadBanks();
});
</script>
