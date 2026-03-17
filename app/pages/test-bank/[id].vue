<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
      ></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="text-center py-12">
      <svg
        class="mx-auto h-12 w-12 text-danger"
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
      <p class="mt-4 text-lg font-medium text-danger">{{ error }}</p>
      <UiButton class="mt-4" @click="navigateTo('/test-bank')">
        Вернуться к списку
      </UiButton>
    </div>

    <template v-else-if="bank">
      <!-- Хлебные крошки и заголовок -->
      <div class="mb-6">
        <nav
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4"
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
          <span class="text-black dark:text-white">{{ bank.name }}</span>
        </nav>

        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"
            >
              <svg
                class="w-7 h-7 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-title-md2 font-bold text-black dark:text-white">
                  {{ bank.name }}
                </h2>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    bank.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                  ]"
                >
                  {{ bank.is_active ? "Активен" : "Неактивен" }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span
                  class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                >
                  {{ bank.code }}
                </span>
                <span
                  v-if="bank.category"
                  class="text-sm text-gray-600 dark:text-gray-400"
                >
                  {{ bank.category }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <UiButton
              v-if="canManageTestBanks"
              variant="outline"
              @click="showImportModal = true"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Импорт
            </UiButton>
            <UiButton
              v-if="canManageTestBanks"
              @click="openCreateQuestionModal"
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
              Добавить вопрос
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Статистика банка -->
      <!-- Статистика банка -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <!-- Всего вопросов -->
        <div
          class="md:col-span-2 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col items-center justify-center"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2"
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
            Всего вопросов
          </p>
          <p class="text-2xl font-bold text-black dark:text-white mt-1">
            {{ stats.total }}
          </p>
        </div>

        <!-- Карточка сложности -->
        <div
          class="md:col-span-5 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col justify-center"
        >
          <div class="flex items-center gap-2 mb-3 px-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10"
            >
              <svg
                class="w-4 h-4 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Сложность
            </p>
          </div>

          <div
            class="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-gray-700"
          >
            <!-- Easy -->
            <div class="flex flex-col items-center">
              <span class="text-xs text-gray-500 mb-1">Лёгкие</span>
              <span class="text-xl font-bold text-success leading-none">{{
                stats.difficulty.easy
              }}</span>
            </div>
            <!-- Medium -->
            <div class="flex flex-col items-center">
              <span class="text-xs text-gray-500 mb-1">Средние</span>
              <span class="text-xl font-bold text-warning leading-none">{{
                stats.difficulty.medium
              }}</span>
            </div>
            <!-- Hard -->
            <div class="flex flex-col items-center">
              <span class="text-xs text-gray-500 mb-1">Сложные</span>
              <span class="text-xl font-bold text-danger leading-none">{{
                stats.difficulty.hard
              }}</span>
            </div>
          </div>
        </div>

        <!-- Карточка языков -->
        <div
          class="md:col-span-5 rounded-lg bg-white dark:bg-boxdark p-4 shadow-md flex flex-col justify-center"
        >
          <div class="flex items-center gap-2 mb-3 px-2">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100/50 dark:bg-blue-900/30"
            >
              <svg
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
            </div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Языки
            </p>
          </div>

          <div
            class="grid grid-cols-3 gap-4 divide-x divide-gray-100 dark:divide-gray-700"
          >
            <!-- RU -->
            <div class="flex flex-col items-center">
              <span class="text-lg mb-1 leading-none">🇷🇺</span>
              <span
                class="text-xl font-bold text-black dark:text-white leading-none"
                >{{ stats.language.ru }}</span
              >
            </div>
            <!-- UZ -->
            <div class="flex flex-col items-center">
              <span class="text-lg mb-1 leading-none">🇺🇿</span>
              <span
                class="text-xl font-bold text-black dark:text-white leading-none"
                >{{ stats.language.uz }}</span
              >
            </div>
            <!-- EN -->
            <div class="flex flex-col items-center">
              <span class="text-lg mb-1 leading-none">🇬🇧</span>
              <span
                class="text-xl font-bold text-black dark:text-white leading-none"
                >{{ stats.language.en }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры вопросов -->
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
            Фильтры вопросов
          </h4>
          <button
            v-if="hasActiveQuestionFilters"
            @click="resetQuestionFilters"
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

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Поиск -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Поиск
            </label>
            <div class="relative">
              <input
                v-model="questionFilters.search"
                type="text"
                placeholder="Текст вопроса..."
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
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

          <!-- Тип вопроса -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Тип вопроса
            </label>
            <div class="relative">
              <select
                v-model="questionFilters.type"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="">Все типы</option>
                <option value="single">Один ответ</option>
                <option value="multiple">Несколько ответов</option>
                <option value="text">Текстовый</option>
                <option value="order">Порядок</option>
                <option value="match">Сопоставление</option>
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

          <!-- Сложность -->
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Сложность
            </label>
            <div class="relative">
              <select
                v-model="questionFilters.difficulty"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="">Любая</option>
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
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
                v-model="questionFilters.language"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="">Все языки</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbek</option>
                <option value="en">🇬🇧 English</option>
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
                v-model="questionFilters.isActive"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
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

      <!-- Список вопросов -->
      <div
        class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden"
      >
        <div v-if="questionsLoading" class="p-12 text-center">
          <div
            class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">
            Загрузка вопросов...
          </p>
        </div>

        <div
          v-else-if="filteredQuestions.length === 0"
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p class="mt-4 text-lg font-medium">
            {{
              questions.length === 0
                ? "Вопросы пока не добавлены"
                : "Нет вопросов по заданным фильтрам"
            }}
          </p>
          <p v-if="questions.length === 0" class="mt-2">
            Нажмите "Добавить вопрос" или "Импорт" для добавления вопросов
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12"
                >
                  #
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  Вопрос
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"
                >
                  Язык
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32"
                >
                  Сложность
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"
                >
                  Баллы
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24"
                >
                  Статус
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody
              class="bg-white dark:bg-boxdark divide-y divide-gray-200 dark:divide-gray-700"
            >
              <tr
                v-for="(question, index) in filteredQuestions"
                :key="question.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ (pagination.page - 1) * pagination.limit + index + 1 }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-1">
                    <div
                      class="text-sm text-gray-900 dark:text-white font-medium line-clamp-2"
                      :title="question.question_text"
                    >
                      {{ question.question_text }}
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {{ questionTypeLabels[question.question_type] }}
                      </span>
                    </div>
                  </div>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  <span
                    :class="languageBadgeClasses[question.language || 'ru']"
                  >
                    {{ languageFlags[question.language || "ru"] }}
                    {{ languageLabels[question.language || "ru"] }}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400"
                >
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      difficultyClasses[question.difficulty],
                    ]"
                  >
                    {{ difficultyLabels[question.difficulty] }}
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                >
                  {{ question.points }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    v-if="question.is_active"
                    class="inline-flex items-center rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success"
                  >
                    Активен
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500"
                  >
                    Неактивен
                  </span>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                >
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="canManageTestBanks"
                      @click="openEditQuestionModal(question)"
                      class="text-primary hover:text-primary/80 p-1"
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
                      v-if="canManageTestBanks"
                      @click="toggleQuestionActive(question)"
                      :class="
                        question.is_active
                          ? 'text-warning hover:text-warning/80'
                          : 'text-success hover:text-success/80'
                      "
                      class="p-1"
                      :title="
                        question.is_active ? 'Деактивировать' : 'Активировать'
                      "
                    >
                      <svg
                        v-if="question.is_active"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <svg
                        v-else
                        class="w-5 h-5"
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
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="confirmDeleteQuestion(question)"
                      class="text-danger hover:text-danger/80 p-1"
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
        <UiPagination
          v-if="pagination.totalPages > 1"
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          :loading="questionsLoading"
          @update:page="pagination.page = $event"
          @update:limit="pagination.limit = $event"
        />
      </div>
    </template>

    <!-- Модальное окно создания/редактирования вопроса -->
    <UiModal
      :is-open="questionModalOpen"
      :title="editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'"
      size="lg"
      @close="closeQuestionModal"
    >
      <form @submit.prevent class="space-y-4">
        <!-- Верхняя панель настроек -->
        <div class="grid grid-cols-12 gap-3">
          <!-- Тип вопроса -->
          <div class="col-span-12 md:col-span-3">
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Тип
            </label>
            <div class="relative">
              <select
                v-model="questionForm.question_type"
                class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="single">Один ответ</option>
                <option value="multiple">Несколько</option>
                <option value="text">Текст</option>
                <option value="order">Порядок</option>
                <option value="match">Пары</option>
              </select>
              <svg
                class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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
          <div class="col-span-6 md:col-span-3">
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Язык
            </label>
            <div class="relative">
              <select
                v-model="questionForm.language"
                class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbek</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <svg
                class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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

          <!-- Сложность -->
          <div class="col-span-6 md:col-span-3">
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Сложность
            </label>
            <div class="relative">
              <select
                v-model="questionForm.difficulty"
                class="w-full rounded-lg border border-stroke bg-transparent py-1.5 pl-3 pr-8 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
              <svg
                class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
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

          <!-- Баллы -->
          <div class="col-span-6 md:col-span-2">
            <label
              class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Баллы
            </label>
            <input
              v-model.number="questionForm.points"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-lg border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>

          <!-- Активность -->
          <div
            class="col-span-6 md:col-span-1 flex items-end pb-1.5 justify-center"
          >
            <label class="cursor-pointer flex items-center" title="Активность">
              <input
                v-model="questionForm.is_active"
                type="checkbox"
                class="sr-only peer"
              />
              <div
                class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary relative"
              ></div>
            </label>
          </div>
        </div>

        <!-- Текст вопроса -->
        <div>
          <label
            class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Текст вопроса <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="questionForm.question_text"
            rows="2"
            placeholder="Введите текст вопроса..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
            :class="{ 'border-danger': questionFormErrors.question_text }"
          ></textarea>
          <p
            v-if="questionFormErrors.question_text"
            class="mt-1 text-xs text-danger"
          >
            {{ questionFormErrors.question_text }}
          </p>
        </div>

        <!-- Варианты ответов (для single) -->
        <div v-if="questionForm.question_type === 'single'" class="space-y-2">
          <label
            class="block text-xs font-medium text-gray-700 dark:text-gray-300"
          >
            Варианты ответов <span class="text-danger">*</span>
          </label>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="(option, index) in questionForm.options"
              :key="option.id"
              class="flex items-center gap-2"
            >
              <!-- Радио-кнопка -->
              <label class="shrink-0 cursor-pointer">
                <input
                  type="radio"
                  :name="'correct-option-' + editingQuestion?.id"
                  :checked="option.correct"
                  @change="setCorrectOption(index)"
                  class="sr-only peer"
                />
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all peer-checked:border-success peer-checked:bg-success border-gray-300 dark:border-gray-600"
                >
                  <svg
                    class="w-3 h-3 text-white hidden peer-checked:block"
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
                </div>
              </label>

              <!-- Буква -->
              <span
                class="shrink-0 w-7 h-7 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400"
              >
                {{ String.fromCharCode(65 + index) }}
              </span>

              <!-- Текст -->
              <input
                v-model="option.text"
                type="text"
                :placeholder="`Вариант ${String.fromCharCode(65 + index)}`"
                class="grow rounded border border-stroke bg-transparent py-1.5 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                :class="{ 'border-success': option.correct }"
              />

              <!-- Удалить -->
              <button
                v-if="questionForm.options.length > 2"
                type="button"
                @click="removeOption(index)"
                class="shrink-0 text-gray-400 hover:text-danger p-1"
                title="Удалить вариант"
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
              </button>
            </div>
          </div>

          <button
            v-if="questionForm.options.length < 8"
            type="button"
            @click="addOption"
            class="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
          >
            <svg
              class="w-3 h-3"
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
            Добавить вариант
          </button>
          <p v-if="questionFormErrors.options" class="mt-1 text-xs text-danger">
            {{ questionFormErrors.options }}
          </p>
        </div>

        <!-- Объяснение -->
        <div>
          <label
            class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Объяснение
          </label>
          <textarea
            v-model="questionForm.explanation"
            rows="1"
            placeholder="Комментарий к ответу..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeQuestionModal">
            Отмена
          </UiButton>
          <UiButton :loading="savingQuestion" @click="saveQuestion">
            {{ editingQuestion ? "Сохранить" : "Добавить" }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Модальное окно импорта -->
    <TestBankImportQuestionsModal
      v-if="showImportModal"
      :bank-id="route.params.id"
      @close="showImportModal = false"
      @imported="onQuestionsImported"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="deleteQuestionModalOpen"
      title="Удалить вопрос?"
      message="Вы уверены, что хотите удалить этот вопрос? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deletingQuestion"
      @confirm="deleteQuestion"
      @cancel="deleteQuestionModalOpen = false"
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
import { ref, computed, onMounted, watch } from "vue";

const route = useRoute();

// Определяем мета-данные страницы
definePageMeta({
  layout: "default",
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

// Состояние
const loading = ref(true);
const questionsLoading = ref(false);
const savingQuestion = ref(false);
const deletingQuestion = ref(false);
const error = ref(null);

const bank = ref(null);
const questions = ref([]);
const stats = ref({
  total: 0,
  difficulty: { easy: 0, medium: 0, hard: 0 },
  language: { ru: 0, uz: 0, en: 0 },
});

// Фильтры вопросов
const questionFilters = ref({
  search: "",
  type: "",
  difficulty: "",
  language: "",
  isActive: undefined,
});

// Пагинация
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

const hasActiveQuestionFilters = computed(() => {
  return (
    questionFilters.value.search !== "" ||
    questionFilters.value.type !== "" ||
    questionFilters.value.difficulty !== "" ||
    questionFilters.value.language !== "" ||
    questionFilters.value.isActive !== undefined
  );
});

// Так как теперь фильтрация происходит на сервере, просто возвращаем вопросы
const filteredQuestions = computed(() => questions.value);

const resetQuestionFilters = () => {
  questionFilters.value = {
    search: "",
    type: "",
    difficulty: "",
    language: "",
    isActive: undefined,
  };
};

// Константы
const questionTypes = [
  { value: "single", label: "Один ответ" },
  { value: "multiple", label: "Несколько" },
  { value: "text", label: "Текст" },
  { value: "order", label: "Порядок" },
  { value: "match", label: "Пары" },
];

const questionTypeLabels = {
  single: "Один ответ",
  multiple: "Несколько ответов",
  text: "Текстовый",
  order: "Порядок",
  match: "Сопоставление",
};

const difficultyLabels = {
  easy: "Лёгкий",
  medium: "Средний",
  hard: "Сложный",
};

const difficultyClasses = {
  easy: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  hard: "bg-danger/10 text-danger",
};

// Языки
const languageLabels = {
  ru: "RU",
  uz: "UZ",
  en: "EN",
};

const languageFlags = {
  ru: "🇷🇺",
  uz: "🇺🇿",
  en: "🇬🇧",
};

const languageBadgeClasses = {
  ru: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  uz: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  en: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

// Модальные окна
const questionModalOpen = ref(false);
const deleteQuestionModalOpen = ref(false);
const showImportModal = ref(false);
const editingQuestion = ref(null);
const deletingQuestionData = ref(null);

// Форма вопроса
const questionForm = ref({
  question_type: "single",
  question_text: "",
  options: [
    { id: "a", text: "", correct: true },
    { id: "b", text: "", correct: false },
    { id: "c", text: "", correct: false },
    { id: "d", text: "", correct: false },
  ],
  language: "ru",
  points: 1,
  difficulty: "medium",
  explanation: "",
  is_active: true,
});

const questionFormErrors = ref({
  question_text: "",
  options: "",
});

// Уведомления
const notification = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// Утилиты
const pluralize = (count, one, few, many) => {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
};

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const getQuestionOptions = (question) => {
  if (!question.options) return [];
  const parsed =
    typeof question.options === "string"
      ? JSON.parse(question.options)
      : question.options;
  return parsed.options || [];
};

// Обновление статистики (без лоадера)
const updateStats = async () => {
  try {
    const response = await authFetch(`/api/test-bank/banks/${route.params.id}`);

    if (response.success && response.stats) {
      stats.value = response.stats;
    }
  } catch (err) {
    console.error("Ошибка обновления статистики:", err);
  }
};

// Загрузка банка
const loadBank = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch(`/api/test-bank/banks/${route.params.id}`);

    if (response.success) {
      bank.value = response.bank;
      if (response.stats) {
        stats.value = response.stats;
      }
      await loadQuestions();
    } else {
      error.value = response.message || "Банк не найден";
    }
  } catch (err) {
    console.error("Ошибка загрузки банка:", err);
    error.value = "Ошибка загрузки банка вопросов";
  } finally {
    loading.value = false;
  }
};

// Загрузка вопросов
const loadQuestions = async () => {
  questionsLoading.value = true;
  try {
    const query = {
      bank_id: route.params.id,
      page: pagination.value.page,
      limit: pagination.value.limit,
      search: questionFilters.value.search || undefined,
      question_type: questionFilters.value.type || undefined,
      difficulty: questionFilters.value.difficulty || undefined,
      language: questionFilters.value.language || undefined,
      is_active: questionFilters.value.isActive,
    };

    const response = await authFetch("/api/test-bank/questions", {
      params: query,
    });

    if (response.success) {
      questions.value = response.questions;
      pagination.value.total = response.total || 0;
      pagination.value.totalPages = response.totalPages || 0;
    }
  } catch (err) {
    console.error("Ошибка загрузки вопросов:", err);
  } finally {
    questionsLoading.value = false;
  }
};

// Следим за фильтрами
watch(
  () => questionFilters.value,
  () => {
    pagination.value.page = 1;
    loadQuestions();
  },
  { deep: true },
);

// Следим за страницей и лимитом
watch(
  () => [pagination.value.page, pagination.value.limit],
  () => {
    loadQuestions();
  },
);

// Модальные окна для вопросов
const openCreateQuestionModal = () => {
  editingQuestion.value = null;
  questionForm.value = {
    question_type: "single",
    question_text: "",
    options: [
      { id: "a", text: "", correct: true },
      { id: "b", text: "", correct: false },
      { id: "c", text: "", correct: false },
      { id: "d", text: "", correct: false },
    ],
    language: "ru",
    points: 1,
    difficulty: "medium",
    explanation: "",
    is_active: true,
  };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const openEditQuestionModal = (question) => {
  editingQuestion.value = question;
  const options = getQuestionOptions(question);

  questionForm.value = {
    question_type: question.question_type,
    question_text: question.question_text,
    options:
      options.length > 0
        ? options
        : [
            { id: "a", text: "", correct: true },
            { id: "b", text: "", correct: false },
          ],
    language: question.language || "ru",
    points: question.points,
    difficulty: question.difficulty,
    explanation: question.explanation || "",
    is_active: question.is_active,
  };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const closeQuestionModal = () => {
  questionModalOpen.value = false;
  editingQuestion.value = null;
};

// Работа с вариантами ответов
const setCorrectOption = (index) => {
  questionForm.value.options.forEach((opt, i) => {
    opt.correct = i === index;
  });
};

const addOption = () => {
  const letters = "abcdefgh";
  const nextId = letters[questionForm.value.options.length];
  questionForm.value.options.push({
    id: nextId,
    text: "",
    correct: false,
  });
};

const removeOption = (index) => {
  const wasCorrect = questionForm.value.options[index].correct;
  questionForm.value.options.splice(index, 1);

  if (wasCorrect && questionForm.value.options.length > 0) {
    questionForm.value.options[0].correct = true;
  }

  // Переназначаем id
  questionForm.value.options.forEach((opt, i) => {
    opt.id = "abcdefgh"[i];
  });
};

// Валидация формы вопроса
const validateQuestionForm = () => {
  questionFormErrors.value = { question_text: "", options: "" };
  let isValid = true;

  if (!questionForm.value.question_text.trim()) {
    questionFormErrors.value.question_text = "Текст вопроса обязателен";
    isValid = false;
  }

  if (questionForm.value.question_type === "single") {
    const filledOptions = questionForm.value.options.filter((o) =>
      o.text.trim(),
    );
    if (filledOptions.length < 2) {
      questionFormErrors.value.options = "Минимум 2 варианта ответа";
      isValid = false;
    }

    const hasCorrect = questionForm.value.options.some(
      (o) => o.correct && o.text.trim(),
    );
    if (!hasCorrect) {
      questionFormErrors.value.options = "Выберите правильный ответ";
      isValid = false;
    }
  }

  return isValid;
};

// Сохранение вопроса
const saveQuestion = async () => {
  // Защита от двойного клика
  if (savingQuestion.value) return;

  if (!validateQuestionForm()) return;

  savingQuestion.value = true;
  try {
    const filteredOptions = questionForm.value.options.filter((o) =>
      o.text.trim(),
    );

    const payload = {
      bank_id: route.params.id,
      question_type: questionForm.value.question_type,
      question_text: questionForm.value.question_text.trim(),
      options: { options: filteredOptions },
      language: questionForm.value.language,
      points: questionForm.value.points,
      difficulty: questionForm.value.difficulty,
      explanation: questionForm.value.explanation.trim() || undefined,
      is_active: questionForm.value.is_active,
    };

    let response;
    if (editingQuestion.value) {
      response = await authFetch(
        `/api/test-bank/questions/${editingQuestion.value.id}`,
        {
          method: "PUT",
          body: payload,
        },
      );
    } else {
      response = await authFetch("/api/test-bank/questions", {
        method: "POST",
        body: payload,
      });
    }

    if (response.success) {
      showNotification(
        "success",
        "Успешно",
        editingQuestion.value ? "Вопрос обновлён" : "Вопрос добавлен",
      );
      closeQuestionModal();
      loadQuestions();
      updateStats();
    } else {
      showNotification(
        "error",
        "Ошибка",
        response.message || "Не удалось сохранить вопрос",
      );
    }
  } catch (err) {
    console.error("Ошибка сохранения вопроса:", err);
    showNotification("error", "Ошибка", "Произошла ошибка при сохранении");
  } finally {
    savingQuestion.value = false;
  }
};

// Переключение активности вопроса
const toggleQuestionActive = async (question) => {
  try {
    const response = await authFetch(
      `/api/test-bank/questions/${question.id}`,
      {
        method: "PUT",
        body: { is_active: !question.is_active },
      },
    );

    if (response.success) {
      question.is_active = !question.is_active;
      showNotification(
        "success",
        "Успешно",
        question.is_active ? "Вопрос активирован" : "Вопрос деактивирован",
      );
    }
  } catch (err) {
    console.error("Ошибка изменения статуса:", err);
    showNotification("error", "Ошибка", "Не удалось изменить статус вопроса");
  }
};

// Удаление вопроса
const confirmDeleteQuestion = (question) => {
  deletingQuestionData.value = question;
  deleteQuestionModalOpen.value = true;
};

const deleteQuestion = async () => {
  if (!deletingQuestionData.value) return;

  deletingQuestion.value = true;
  try {
    const response = await authFetch(
      `/api/test-bank/questions/${deletingQuestionData.value.id}`,
      {
        method: "DELETE",
      },
    );

    if (response.success) {
      showNotification("success", "Успешно", "Вопрос удалён");
      deleteQuestionModalOpen.value = false;
      deletingQuestionData.value = null;
      loadQuestions();
      updateStats();
    } else {
      showNotification(
        "error",
        "Ошибка",
        response.message || "Не удалось удалить вопрос",
      );
    }
  } catch (err) {
    console.error("Ошибка удаления вопроса:", err);
    showNotification("error", "Ошибка", "Произошла ошибка при удалении");
  } finally {
    deletingQuestion.value = false;
  }
};

// Callback после импорта
const onQuestionsImported = () => {
  showImportModal.value = false;
  loadQuestions();
  updateStats();
  showNotification("success", "Успешно", "Вопросы импортированы");
};

// Уведомления
const showNotification = (type, title, message) => {
  notification.value = {
    show: true,
    type,
    title,
    message,
  };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Инициализация
onMounted(() => {
  loadBank();
});
</script>
