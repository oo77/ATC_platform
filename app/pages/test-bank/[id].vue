<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p class="mt-4 text-lg font-medium text-danger">{{ error }}</p>
      <UiButton class="mt-4" @click="navigateTo('/test-bank')">
        Вернуться к списку
      </UiButton>
    </div>

    <template v-else-if="bank">
      <!-- Хлебные крошки и заголовок -->
      <div class="mb-6">
        <nav class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <NuxtLink to="/test-bank" class="hover:text-primary transition-colors">
            Банк тестов
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-black dark:text-white">{{ bank.name }}</span>
        </nav>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ bank.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                  {{ bank.code }}
                </span>
                <span v-if="bank.category" class="text-sm text-gray-600 dark:text-gray-400">
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Импорт
            </UiButton>
            <UiButton 
              v-if="canManageTestBanks"
              @click="openCreateQuestionModal"
              class="flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Добавить вопрос
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Статистика банка -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7 mb-6">
        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Всего вопросов</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ questions.length }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Лёгких (Easy)</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ difficultyStats.easy }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
              <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Средних (Medium)</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ difficultyStats.medium }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
              <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Сложных (Hard)</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ difficultyStats.hard }}</p>
            </div>
          </div>
        </div>

        <!-- Статистика по языкам -->
        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-lg">
              🇷🇺
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Русский</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ languageStats.ru }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100/50 dark:bg-green-900/30 text-lg">
              🇺🇿
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">O'zbek</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ languageStats.uz }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-boxdark p-5 shadow-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100/50 dark:bg-purple-900/30 text-lg">
              🇬🇧
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">English</p>
              <p class="text-xl font-bold text-black dark:text-white">{{ languageStats.en }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры вопросов -->
      <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <h4 class="text-lg font-semibold text-black dark:text-white">Фильтры вопросов</h4>
          <button
            v-if="hasActiveQuestionFilters"
            @click="resetQuestionFilters"
            class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Поиск -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Поиск
            </label>
            <div class="relative">
              <input
                v-model="questionFilters.search"
                type="text"
                placeholder="Текст вопроса..."
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Тип вопроса -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Сложность -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Язык -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Статус -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Список вопросов -->
      <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div v-if="questionsLoading" class="p-12 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка вопросов...</p>
        </div>

        <div v-else-if="filteredQuestions.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="mt-4 text-lg font-medium">
            {{ questions.length === 0 ? 'Вопросы пока не добавлены' : 'Нет вопросов по заданным фильтрам' }}
          </p>
          <p v-if="questions.length === 0" class="mt-2">
            Нажмите "Добавить вопрос" или "Импорт" для добавления вопросов
          </p>
        </div>

        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="(question, index) in filteredQuestions"
            :key="question.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-start gap-4">
              <!-- Порядковый номер -->
              <div class="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ index + 1 }}
              </div>

              <!-- Контент вопроса -->
              <div class="flex-grow min-w-0">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-grow">
                    <!-- Текст вопроса -->
                    <p class="text-gray-900 dark:text-white font-medium line-clamp-2">
                      {{ question.question_text }}
                    </p>

                    <!-- Мета-информация -->
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                      <!-- Язык -->
                      <span :class="languageBadgeClasses[question.language || 'ru']">
                        {{ languageFlags[question.language || 'ru'] }} {{ languageLabels[question.language || 'ru'] }}
                      </span>

                      <!-- Тип вопроса -->
                      <span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {{ questionTypeLabels[question.question_type] }}
                      </span>

                      <!-- Сложность -->
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          difficultyClasses[question.difficulty]
                        ]"
                      >
                        {{ difficultyLabels[question.difficulty] }}
                      </span>

                      <!-- Баллы -->
                      <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {{ question.points }} {{ pluralize(question.points, 'балл', 'балла', 'баллов') }}
                      </span>

                      <!-- Статус -->
                      <span
                        v-if="!question.is_active"
                        class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-500"
                      >
                        Неактивен
                      </span>
                    </div>

                    <!-- Варианты ответов (для single/multiple) -->
                    <div v-if="question.question_type === 'single' || question.question_type === 'multiple'" class="mt-3">
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="option in getQuestionOptions(question)"
                          :key="option.id"
                          :class="[
                            'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs',
                            option.correct
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          ]"
                        >
                          <svg v-if="option.correct" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {{ truncateText(option.text, 30) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Действия -->
                  <div class="flex-shrink-0 flex items-center gap-1">
                    <button
                      @click="openEditQuestionModal(question)"
                      class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="toggleQuestionActive(question)"
                      class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                      :title="question.is_active ? 'Деактивировать' : 'Активировать'"
                    >
                      <svg v-if="question.is_active" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="confirmDeleteQuestion(question)"
                      class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальное окно создания/редактирования вопроса -->
    <UiModal
      :is-open="questionModalOpen"
      :title="editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'"
      size="lg"
      @close="closeQuestionModal"
    >
      <form @submit.prevent class="space-y-5">
        <!-- Тип вопроса -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Тип вопроса <span class="text-danger">*</span>
          </label>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-2">
            <button
              v-for="type in questionTypes"
              :key="type.value"
              type="button"
              @click="questionForm.question_type = type.value"
              :class="[
                'p-3 rounded-lg border-2 text-center transition-all',
                questionForm.question_type === type.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              ]"
              :disabled="type.value !== 'single'"
              :title="type.value !== 'single' ? 'Скоро будет доступно' : ''"
            >
              <div class="text-xs font-medium" :class="{ 'opacity-50': type.value !== 'single' }">
                {{ type.label }}
              </div>
            </button>
          </div>
        </div>

        <!-- Текст вопроса -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Текст вопроса <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="questionForm.question_text"
            rows="3"
            placeholder="Введите текст вопроса..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
            :class="{ 'border-danger': questionFormErrors.question_text }"
          ></textarea>
          <p v-if="questionFormErrors.question_text" class="mt-1 text-sm text-danger">{{ questionFormErrors.question_text }}</p>
        </div>

        <!-- Варианты ответов (для single) -->
        <div v-if="questionForm.question_type === 'single'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Варианты ответов <span class="text-danger">*</span>
          </label>
          <div class="space-y-3">
            <div
              v-for="(option, index) in questionForm.options"
              :key="option.id"
              class="flex items-center gap-3"
            >
              <!-- Радио-кнопка для выбора правильного ответа -->
              <label class="flex-shrink-0 cursor-pointer">
                <input
                  type="radio"
                  :name="'correct-option-' + editingQuestion?.id"
                  :checked="option.correct"
                  @change="setCorrectOption(index)"
                  class="sr-only peer"
                />
                <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all peer-checked:border-success peer-checked:bg-success border-gray-300 dark:border-gray-600">
                  <svg class="w-4 h-4 text-white hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </label>

              <!-- Буква варианта -->
              <span class="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {{ String.fromCharCode(65 + index) }}
              </span>

              <!-- Текст варианта -->
              <input
                v-model="option.text"
                type="text"
                :placeholder="`Вариант ${String.fromCharCode(65 + index)}`"
                class="flex-grow rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
                :class="{ 'border-success': option.correct }"
              />

              <!-- Кнопка удаления -->
              <button
                v-if="questionForm.options.length > 2"
                type="button"
                @click="removeOption(index)"
                class="flex-shrink-0 p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <button
            v-if="questionForm.options.length < 8"
            type="button"
            @click="addOption"
            class="mt-3 text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Добавить вариант
          </button>

          <p v-if="questionFormErrors.options" class="mt-2 text-sm text-danger">{{ questionFormErrors.options }}</p>
        </div>

        <!-- Дополнительные настройки -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Язык -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Язык <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <select
                v-model="questionForm.language"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbek</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Сложность -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Сложность
            </label>
            <div class="relative">
              <select
                v-model="questionForm.difficulty"
                class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              >
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
              <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <!-- Баллы -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Баллы
            </label>
            <input
              v-model.number="questionForm.points"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
          </div>

          <!-- Активность -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Статус
            </label>
            <label class="relative inline-flex items-center cursor-pointer mt-1">
              <input
                v-model="questionForm.is_active"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              <span class="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Активен
              </span>
            </label>
          </div>
        </div>

        <!-- Объяснение -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Объяснение (показывается после ответа)
          </label>
          <textarea
            v-model="questionForm.explanation"
            rows="2"
            placeholder="Почему этот ответ правильный..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeQuestionModal">
            Отмена
          </UiButton>
          <UiButton :loading="savingQuestion" @click="saveQuestion">
            {{ editingQuestion ? 'Сохранить' : 'Добавить' }}
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
import { ref, computed, onMounted, watch } from 'vue';

const route = useRoute();

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
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

// Фильтры вопросов
const questionFilters = ref({
  search: '',
  type: '',
  difficulty: '',
  language: '',
  isActive: undefined,
});

const hasActiveQuestionFilters = computed(() => {
  return questionFilters.value.search !== '' || 
         questionFilters.value.type !== '' || 
         questionFilters.value.difficulty !== '' ||
         questionFilters.value.language !== '' ||
         questionFilters.value.isActive !== undefined;
});

const filteredQuestions = computed(() => {
  let result = questions.value;

  if (questionFilters.value.search) {
    const search = questionFilters.value.search.toLowerCase();
    result = result.filter(q => q.question_text.toLowerCase().includes(search));
  }

  if (questionFilters.value.type) {
    result = result.filter(q => q.question_type === questionFilters.value.type);
  }

  if (questionFilters.value.difficulty) {
    result = result.filter(q => q.difficulty === questionFilters.value.difficulty);
  }

  if (questionFilters.value.language) {
    result = result.filter(q => (q.language || 'ru') === questionFilters.value.language);
  }

  if (questionFilters.value.isActive !== undefined) {
    result = result.filter(q => q.is_active === questionFilters.value.isActive);
  }

  return result;
});

const resetQuestionFilters = () => {
  questionFilters.value = {
    search: '',
    type: '',
    difficulty: '',
    language: '',
    isActive: undefined,
  };
};

// Статистика по сложности
const difficultyStats = computed(() => {
  return {
    easy: questions.value.filter(q => q.difficulty === 'easy').length,
    medium: questions.value.filter(q => q.difficulty === 'medium').length,
    hard: questions.value.filter(q => q.difficulty === 'hard').length,
  };
});

// Статистика по языкам
const languageStats = computed(() => {
  return {
    ru: questions.value.filter(q => (q.language || 'ru') === 'ru').length,
    uz: questions.value.filter(q => q.language === 'uz').length,
    en: questions.value.filter(q => q.language === 'en').length,
  };
});

// Константы
const questionTypes = [
  { value: 'single', label: 'Один ответ' },
  { value: 'multiple', label: 'Несколько' },
  { value: 'text', label: 'Текст' },
  { value: 'order', label: 'Порядок' },
  { value: 'match', label: 'Пары' },
];

const questionTypeLabels = {
  single: 'Один ответ',
  multiple: 'Несколько ответов',
  text: 'Текстовый',
  order: 'Порядок',
  match: 'Сопоставление',
};

const difficultyLabels = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const difficultyClasses = {
  easy: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  hard: 'bg-danger/10 text-danger',
};

// Языки
const languageLabels = {
  ru: 'RU',
  uz: 'UZ',
  en: 'EN',
};

const languageFlags = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  en: '🇬🇧',
};

const languageBadgeClasses = {
  ru: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  uz: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  en: 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

// Модальные окна
const questionModalOpen = ref(false);
const deleteQuestionModalOpen = ref(false);
const showImportModal = ref(false);
const editingQuestion = ref(null);
const deletingQuestionData = ref(null);

// Форма вопроса
const questionForm = ref({
  question_type: 'single',
  question_text: '',
  options: [
    { id: 'a', text: '', correct: true },
    { id: 'b', text: '', correct: false },
    { id: 'c', text: '', correct: false },
    { id: 'd', text: '', correct: false },
  ],
  language: 'ru',
  points: 1,
  difficulty: 'medium',
  explanation: '',
  is_active: true,
});

const questionFormErrors = ref({
  question_text: '',
  options: '',
});

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
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
  return text.substring(0, maxLength) + '...';
};

const getQuestionOptions = (question) => {
  if (!question.options) return [];
  const parsed = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
  return parsed.options || [];
};

// Загрузка банка
const loadBank = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch(`/api/test-bank/banks/${route.params.id}`);
    
    if (response.success) {
      bank.value = response.bank;
      await loadQuestions();
    } else {
      error.value = response.message || 'Банк не найден';
    }
  } catch (err) {
    console.error('Ошибка загрузки банка:', err);
    error.value = 'Ошибка загрузки банка вопросов';
  } finally {
    loading.value = false;
  }
};

// Загрузка вопросов
const loadQuestions = async () => {
  questionsLoading.value = true;
  try {
    const response = await authFetch(`/api/test-bank/questions?bank_id=${route.params.id}`);
    
    if (response.success) {
      questions.value = response.questions;
    }
  } catch (err) {
    console.error('Ошибка загрузки вопросов:', err);
  } finally {
    questionsLoading.value = false;
  }
};

// Модальные окна для вопросов
const openCreateQuestionModal = () => {
  editingQuestion.value = null;
  questionForm.value = {
    question_type: 'single',
    question_text: '',
    options: [
      { id: 'a', text: '', correct: true },
      { id: 'b', text: '', correct: false },
      { id: 'c', text: '', correct: false },
      { id: 'd', text: '', correct: false },
    ],
    language: 'ru',
    points: 1,
    difficulty: 'medium',
    explanation: '',
    is_active: true,
  };
  questionFormErrors.value = { question_text: '', options: '' };
  questionModalOpen.value = true;
};

const openEditQuestionModal = (question) => {
  editingQuestion.value = question;
  const options = getQuestionOptions(question);
  
  questionForm.value = {
    question_type: question.question_type,
    question_text: question.question_text,
    options: options.length > 0 ? options : [
      { id: 'a', text: '', correct: true },
      { id: 'b', text: '', correct: false },
    ],
    language: question.language || 'ru',
    points: question.points,
    difficulty: question.difficulty,
    explanation: question.explanation || '',
    is_active: question.is_active,
  };
  questionFormErrors.value = { question_text: '', options: '' };
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
  const letters = 'abcdefgh';
  const nextId = letters[questionForm.value.options.length];
  questionForm.value.options.push({
    id: nextId,
    text: '',
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
    opt.id = 'abcdefgh'[i];
  });
};

// Валидация формы вопроса
const validateQuestionForm = () => {
  questionFormErrors.value = { question_text: '', options: '' };
  let isValid = true;

  if (!questionForm.value.question_text.trim()) {
    questionFormErrors.value.question_text = 'Текст вопроса обязателен';
    isValid = false;
  }

  if (questionForm.value.question_type === 'single') {
    const filledOptions = questionForm.value.options.filter(o => o.text.trim());
    if (filledOptions.length < 2) {
      questionFormErrors.value.options = 'Минимум 2 варианта ответа';
      isValid = false;
    }
    
    const hasCorrect = questionForm.value.options.some(o => o.correct && o.text.trim());
    if (!hasCorrect) {
      questionFormErrors.value.options = 'Выберите правильный ответ';
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
    const filteredOptions = questionForm.value.options.filter(o => o.text.trim());
    
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
      response = await authFetch(`/api/test-bank/questions/${editingQuestion.value.id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await authFetch('/api/test-bank/questions', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification('success', 'Успешно', editingQuestion.value ? 'Вопрос обновлён' : 'Вопрос добавлен');
      closeQuestionModal();
      loadQuestions();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить вопрос');
    }
  } catch (err) {
    console.error('Ошибка сохранения вопроса:', err);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
  } finally {
    savingQuestion.value = false;
  }
};

// Переключение активности вопроса
const toggleQuestionActive = async (question) => {
  try {
    const response = await authFetch(`/api/test-bank/questions/${question.id}`, {
      method: 'PUT',
      body: { is_active: !question.is_active },
    });

    if (response.success) {
      question.is_active = !question.is_active;
      showNotification('success', 'Успешно', question.is_active ? 'Вопрос активирован' : 'Вопрос деактивирован');
    }
  } catch (err) {
    console.error('Ошибка изменения статуса:', err);
    showNotification('error', 'Ошибка', 'Не удалось изменить статус вопроса');
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
    const response = await authFetch(`/api/test-bank/questions/${deletingQuestionData.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('success', 'Успешно', 'Вопрос удалён');
      deleteQuestionModalOpen.value = false;
      deletingQuestionData.value = null;
      loadQuestions();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось удалить вопрос');
    }
  } catch (err) {
    console.error('Ошибка удаления вопроса:', err);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
  } finally {
    deletingQuestion.value = false;
  }
};

// Callback после импорта
const onQuestionsImported = () => {
  showImportModal.value = false;
  loadQuestions();
  showNotification('success', 'Успешно', 'Вопросы импортированы');
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
