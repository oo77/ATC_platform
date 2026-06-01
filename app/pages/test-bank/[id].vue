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
      <div class="bg-danger/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle class="w-10 h-10 text-danger" />
      </div>
      <p class="mt-4 text-lg font-bold text-slate-900 dark:text-white">{{ error }}</p>
      <UiButton class="mt-4" @click="navigateTo('/test-bank')">
        Вернуться к списку
      </UiButton>
    </div>

    <template v-else-if="bank">
      <!-- Header Section -->
      <div class="mb-8">
        <nav class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
          <NuxtLink
            to="/test-bank"
            class="hover:text-primary transition-colors font-medium flex items-center gap-1"
          >
            <Library class="w-4 h-4" />
            Банк тестов
          </NuxtLink>
          <ChevronRight class="w-4 h-4" />
          <span class="text-slate-900 dark:text-white font-bold">{{ bank.name }}</span>
        </nav>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <Library class="w-7 h-7 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-title-md2 font-bold text-slate-900 dark:text-white">
                  {{ bank.name }}
                </h2>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide',
                    bank.is_active
                      ? 'bg-success/10 text-success border border-success/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
                  ]"
                >
                  {{ bank.is_active ? "Активен" : "Неактивен" }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ bank.code }}
                </span>
                <span v-if="bank.category" class="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Tags class="w-3.5 h-3.5" />
                  {{ bank.category }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <UiButton
              v-if="canManageTestBanks"
              variant="outline"
              size="sm"
              @click="showImportModal = true"
              class="flex items-center gap-2 h-10 px-4 font-bold shadow-sm border-slate-200 dark:border-slate-700"
            >
              <Upload class="w-4 h-4" />
              Импорт
            </UiButton>
            <UiButton
              v-if="canManageTestBanks"
              size="sm"
              @click="openCreateQuestionModal"
              class="flex items-center gap-2 h-10 px-4 font-bold shadow-sm"
            >
              <Plus class="w-4 h-4" />
              Добавить вопрос
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
        <div class="inline-flex rounded-2xl bg-slate-100 dark:bg-slate-800 p-1.5">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              @click="navigateTo('/test-bank')"
              :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', $route.path === '/test-bank' || $route.path.startsWith('/test-bank/') ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
            >
              <Library class="h-4 w-4" />
              Банки вопросов
            </button>
            <button
              @click="navigateTo('/test-templates')"
              :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', $route.path === '/test-templates' ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
            >
              <FileText class="h-4 w-4" />
              Шаблоны тестов
            </button>
          </nav>
        </div>
      </div>

      <!-- Bento Box Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего вопросов</p>
              <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.total }}</h3>
            </div>
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
              <HelpCircle class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Лёгкие</p>
              <h3 class="mt-1 text-2xl font-bold text-success">{{ stats.difficulty.easy }}</h3>
            </div>
            <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
              <Zap class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Средние</p>
              <h3 class="mt-1 text-2xl font-bold text-warning">{{ stats.difficulty.medium }}</h3>
            </div>
            <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
              <TrendingUp class="w-6 h-6" />
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Сложные</p>
              <h3 class="mt-1 text-2xl font-bold text-danger">{{ stats.difficulty.hard }}</h3>
            </div>
            <div class="rounded-xl bg-danger/10 p-3 text-danger transition-transform group-hover:rotate-12">
              <Flame class="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <!-- Language Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🇷🇺</span>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Русский</p>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ stats.language.ru }}</h3>
              </div>
            </div>
            <div class="rounded-xl bg-blue-100 dark:bg-blue-900/30 p-2">
              <span class="text-lg font-bold text-blue-600 dark:text-blue-400">RU</span>
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🇺🇿</span>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Узбекский</p>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ stats.language.uz }}</h3>
              </div>
            </div>
            <div class="rounded-xl bg-green-100 dark:bg-green-900/30 p-2">
              <span class="text-lg font-bold text-green-600 dark:text-green-400">UZ</span>
            </div>
          </div>
        </div>

        <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🇬🇧</span>
              <div>
                <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Английский</p>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ stats.language.en }}</h3>
              </div>
            </div>
            <div class="rounded-xl bg-purple-100 dark:bg-purple-900/30 p-2">
              <span class="text-lg font-bold text-purple-600 dark:text-purple-400">EN</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры вопросов -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Filter class="w-5 h-5" />
            </div>
            <h4 class="text-lg font-bold text-slate-900 dark:text-white">
              Фильтры вопросов
            </h4>
          </div>
          <button
            v-if="hasActiveQuestionFilters"
            @click="resetQuestionFilters"
            class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
          >
            <RotateCcw class="w-4 h-4" />
            Сбросить
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Поиск -->
          <div class="lg:col-span-2">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2 mb-2">
              <Search class="w-3.5 h-3.5" />
              Поиск
            </label>
            <div class="relative">
              <input
                v-model="questionFilters.search"
                type="text"
                placeholder="Текст вопроса..."
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
              />
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <!-- Тип вопроса -->
          <div>
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2 mb-2">
              <HelpCircle class="w-3.5 h-3.5" />
              Тип
            </label>
            <div class="relative">
              <select
                v-model="questionFilters.type"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option value="">Все типы</option>
                <option value="single">Один ответ</option>
                <option value="multiple">Несколько ответов</option>
                <option value="text">Текстовый</option>
                <option value="order">Порядок</option>
                <option value="match">Сопоставление</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Сложность -->
          <div>
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2 mb-2">
              <Zap class="w-3.5 h-3.5" />
              Сложность
            </label>
            <div class="relative">
              <select
                v-model="questionFilters.difficulty"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option value="">Любая</option>
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Статус -->
          <div>
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2 mb-2">
              <Activity class="w-3.5 h-3.5" />
              Статус
            </label>
            <div class="relative">
              <select
                v-model="questionFilters.isActive"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option :value="undefined">Все</option>
                <option :value="true">Активные</option>
                <option :value="false">Неактивные</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <!-- Список вопросов -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <!-- Загрузка -->
        <div v-if="questionsLoading" class="p-12 text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p class="mt-4 text-slate-500 font-medium tracking-wide">
            Загрузка вопросов...
          </p>
        </div>

        <!-- Пустой список -->
        <div
          v-else-if="filteredQuestions.length === 0"
          class="py-20 px-6 text-center"
        >
          <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle class="h-10 w-10 text-slate-400" />
          </div>
          <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {{
              questions.length === 0
                ? "Вопросы пока не добавлены"
                : "Нет вопросов по заданным фильтрам"
            }}
          </h3>
          <p v-if="questions.length === 0" class="max-w-md mx-auto text-slate-500">
            Нажмите "Добавить вопрос" или "Импорт" для добавления вопросов
          </p>
        </div>

        <!-- Таблица -->
        <div v-else class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-12">#</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Вопрос</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-24">Язык</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Сложность</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-20 text-center">Баллы</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-24 text-right">Статус</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest w-32 text-right">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="(question, index) in filteredQuestions"
                :key="question.id"
                class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-slate-400 font-medium">
                  {{ (pagination.page - 1) * pagination.limit + index + 1 }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-2">
                    <div class="text-sm font-medium text-slate-900 dark:text-white line-clamp-2" :title="question.question_text">
                      {{ question.question_text }}
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/10">
                        {{ questionTypeLabels[question.question_type] }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span :class="languageBadgeClasses[question.language || 'ru']" class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold">
                    {{ languageFlags[question.language || "ru"] }}
                    {{ languageLabels[question.language || "ru"] }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold',
                      difficultyClasses[question.difficulty],
                    ]"
                  >
                    {{ difficultyLabels[question.difficulty] }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center justify-center min-w-8 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                    {{ question.points }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <span
                    v-if="question.is_active"
                    class="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success border border-success/20"
                  >
                    Активен
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  >
                    Неактивен
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      v-if="canManageTestBanks"
                      @click="openEditQuestionModal(question)"
                      class="p-2 text-slate-500 hover:text-warning hover:bg-warning/10 rounded-xl transition-colors"
                      title="Редактировать"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="toggleQuestionActive(question)"
                      :class="question.is_active ? 'text-warning hover:text-warning/80 hover:bg-warning/10' : 'text-success hover:text-success/80 hover:bg-success/10'"
                      class="p-2 rounded-xl transition-colors"
                      :title="question.is_active ? 'Деактивировать' : 'Активировать'"
                    >
                      <XCircle v-if="question.is_active" class="w-4 h-4" />
                      <CheckCircle v-else class="w-4 h-4" />
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="confirmDeleteQuestion(question)"
                      class="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                      title="Удалить"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div v-if="pagination.totalPages > 1" class="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-slate-500">
              Показано
              <span class="font-bold text-slate-900 dark:text-white">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
              -
              <span class="font-bold text-slate-900 dark:text-white">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
              из
              <span class="font-bold text-slate-900 dark:text-white">{{ pagination.total }}</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="pagination.page--"
                :disabled="pagination.page === 1"
                class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
              >
                Назад
              </button>
              <button
                @click="pagination.page++"
                :disabled="pagination.page >= pagination.totalPages"
                class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
              >
                Вперёд
              </button>
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
      <form @submit.prevent class="space-y-4">
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-6 md:col-span-3">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Тип</label>
            <div class="relative">
              <select
                v-model="questionForm.question_type"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option value="single">Один ответ</option>
                <option value="multiple">Несколько</option>
                <option value="text">Текст</option>
                <option value="order">Порядок</option>
                <option value="match">Пары</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="col-span-6 md:col-span-3">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Язык</label>
            <div class="relative">
              <select
                v-model="questionForm.language"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbek</option>
                <option value="en">🇬🇧 English</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="col-span-6 md:col-span-3">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Сложность</label>
            <div class="relative">
              <select
                v-model="questionForm.difficulty"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary dark:border-slate-700 appearance-none font-medium text-sm"
              >
                <option value="easy">Лёгкий</option>
                <option value="medium">Средний</option>
                <option value="hard">Сложный</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div class="col-span-6 md:col-span-2">
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Баллы</label>
            <input
              v-model.number="questionForm.points"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium text-sm"
            />
          </div>

          <div class="col-span-12 md:col-span-1 flex items-end pb-0.5 justify-center">
            <label class="flex items-center gap-2 cursor-pointer">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Вкл</span>
              <input v-model="questionForm.is_active" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary relative"></div>
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Текст вопроса <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="questionForm.question_text"
            rows="2"
            placeholder="Введите текст вопроса..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 resize-none font-medium text-sm"
            :class="{ 'border-danger ring-2 ring-danger/10': questionFormErrors.question_text }"
          ></textarea>
          <p v-if="questionFormErrors.question_text" class="mt-1 text-xs text-danger font-medium">
            {{ questionFormErrors.question_text }}
          </p>
        </div>

        <div v-if="questionForm.question_type === 'single'" class="space-y-3">
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest">
            Варианты ответов <span class="text-danger">*</span>
          </label>
          <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div
              v-for="(option, index) in questionForm.options"
              :key="option.id"
              class="flex items-center gap-2"
            >
              <label class="shrink-0 cursor-pointer">
                <input
                  type="radio"
                  :name="'correct-option-' + editingQuestion?.id"
                  :checked="option.correct"
                  @change="setCorrectOption(index)"
                  class="sr-only peer"
                />
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all peer-checked:border-success peer-checked:bg-success border-slate-300 dark:border-slate-600">
                  <Check class="w-3 h-3 text-white hidden peer-checked:block" />
                </div>
              </label>

              <span class="shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                {{ String.fromCharCode(65 + index) }}
              </span>

              <input
                v-model="option.text"
                type="text"
                :placeholder="`Вариант ${String.fromCharCode(65 + index)}`"
                class="grow rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2 px-3 text-sm outline-none focus:border-primary dark:border-slate-700 font-medium"
                :class="{ 'border-success dark:border-success': option.correct }"
              />

              <button
                v-if="questionForm.options.length > 2"
                type="button"
                @click="removeOption(index)"
                class="shrink-0 text-slate-400 hover:text-danger p-1.5 rounded-lg hover:bg-danger/10 transition-colors"
                title="Удалить вариант"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            v-if="questionForm.options.length < 8"
            type="button"
            @click="addOption"
            class="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1.5"
          >
            <Plus class="w-3.5 h-3.5" />
            Добавить вариант
          </button>
          <p v-if="questionFormErrors.options" class="mt-1 text-xs text-danger font-medium">
            {{ questionFormErrors.options }}
          </p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            Объяснение
          </label>
          <textarea
            v-model="questionForm.explanation"
            rows="1"
            placeholder="Комментарий к ответу..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 resize-none font-medium text-sm"
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
import {
  Library, ChevronRight, Plus, Upload, FileText, HelpCircle, Zap, TrendingUp, Flame,
  Filter, RotateCcw, Search, ChevronDown, Activity, Tags, Pencil, CheckCircle, XCircle,
  Trash2, AlertTriangle, Check, X
} from "lucide-vue-next";

const route = useRoute();

definePageMeta({
  layout: "default",
});

const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

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

const questionFilters = ref({
  search: "",
  type: "",
  difficulty: "",
  language: "",
  isActive: undefined,
});

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
  easy: "bg-success/10 text-success border border-success/20",
  medium: "bg-warning/10 text-warning border border-warning/20",
  hard: "bg-danger/10 text-danger border border-danger/20",
};

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
  ru: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  uz: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  en: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const questionModalOpen = ref(false);
const deleteQuestionModalOpen = ref(false);
const showImportModal = ref(false);
const editingQuestion = ref(null);
const deletingQuestionData = ref(null);

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

const notification = ref({
  show: false,
  type: "success",
  title: "",
  message: "",
});

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

watch(
  () => questionFilters.value,
  () => {
    pagination.value.page = 1;
    loadQuestions();
  },
  { deep: true },
);

watch(
  () => [pagination.value.page, pagination.value.limit],
  () => {
    loadQuestions();
  },
);

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

const getQuestionOptions = (question) => {
  if (!question.options) return [];
  const parsed =
    typeof question.options === "string"
      ? JSON.parse(question.options)
      : question.options;
  return parsed.options || [];
};

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

  questionForm.value.options.forEach((opt, i) => {
    opt.id = "abcdefgh"[i];
  });
};

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

const saveQuestion = async () => {
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

const onQuestionsImported = () => {
  showImportModal.value = false;
  loadQuestions();
  updateStats();
  showNotification("success", "Успешно", "Вопросы импортированы");
};

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

onMounted(() => {
  loadBank();
});
</script>