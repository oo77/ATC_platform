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
      <UiButton class="mt-4" @click="navigateTo('/test-bank/templates')">
        Вернуться к списку
      </UiButton>
    </div>

    <template v-else-if="template">
      <!-- Хлебные крошки и заголовок -->
      <div class="mb-6">
        <nav class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <NuxtLink to="/test-bank" class="hover:text-primary transition-colors">
            Банк тестов
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <NuxtLink to="/test-bank/templates" class="hover:text-primary transition-colors">
            Шаблоны тестов
          </NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-black dark:text-white">{{ template.name }}</span>
        </nav>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-title-md2 font-bold text-black dark:text-white">
                  {{ template.name }}
                </h2>
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    template.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  ]"
                >
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
              <div class="flex items-center gap-3 mt-1">
                <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                  {{ template.code }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Банк: <NuxtLink :to="`/test-bank/${template.bank_id}`" class="text-primary hover:underline">{{ template.bank_name }}</NuxtLink>
                </span>
                <!-- Бейджи языков -->
                <div class="flex items-center gap-1 ml-2">
                  <template v-if="template.allowed_languages && template.allowed_languages.length > 0">
                    <span
                      v-for="lang in template.allowed_languages"
                      :key="lang"
                      :class="languageBadgeClasses[lang]"
                      :title="languageLabels[lang]"
                    >
                      {{ languageFlags[lang] }}
                    </span>
                  </template>
                  <span v-else class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                    🌐 Все языки
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-3">
            <UiButton 
              variant="outline"
              @click="previewTest"
              class="flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Предпросмотр
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Основной контент в виде карточек -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая колонка - настройки -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Основные настройки -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Основные настройки
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Режим вопросов</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ questionsModeLabels[template.questions_mode] }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Количество вопросов</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ template.questions_mode === 'all' ? template.questions_total : template.questions_count }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Лимит времени</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ template.time_limit_minutes ? `${template.time_limit_minutes} минут` : 'Без лимита' }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Проходной балл</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ template.passing_score }}%</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Максимум попыток</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ template.max_attempts }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Вопросов на странице</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ template.questions_per_page === 0 ? 'Все сразу' : template.questions_per_page }}
                </span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Показ результатов</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ showResultsLabels[template.show_results] }}</span>
              </div>

              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-gray-600 dark:text-gray-400">Возврат к вопросам</span>
                <span :class="['font-medium', template.allow_back ? 'text-success' : 'text-danger']">
                  {{ template.allow_back ? 'Разрешён' : 'Запрещён' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Перемешивание -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Перемешивание
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center gap-3 p-3 rounded-lg" :class="template.shuffle_questions ? 'bg-success/10' : 'bg-gray-100 dark:bg-gray-800'">
                <svg :class="['w-5 h-5', template.shuffle_questions ? 'text-success' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="template.shuffle_questions" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span class="text-gray-900 dark:text-white">Перемешивать вопросы</span>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-lg" :class="template.shuffle_options ? 'bg-success/10' : 'bg-gray-100 dark:bg-gray-800'">
                <svg :class="['w-5 h-5', template.shuffle_options ? 'text-success' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="template.shuffle_options" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span class="text-gray-900 dark:text-white">Перемешивать варианты ответов</span>
              </div>
            </div>
          </div>

          <!-- Антипрокторинг -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Антипрокторинг
              </h3>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  template.proctoring_enabled
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ template.proctoring_enabled ? 'Включён' : 'Отключён' }}
              </span>
            </div>

            <div v-if="template.proctoring_enabled && template.proctoring_settings" class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="flex items-center gap-3 p-3 rounded-lg" :class="template.proctoring_settings.blockTabSwitch ? 'bg-danger/10' : 'bg-gray-100 dark:bg-gray-800'">
                <svg :class="['w-5 h-5', template.proctoring_settings.blockTabSwitch ? 'text-danger' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span class="text-sm text-gray-900 dark:text-white">Блокировка вкладок</span>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-lg" :class="template.proctoring_settings.blockCopyPaste ? 'bg-danger/10' : 'bg-gray-100 dark:bg-gray-800'">
                <svg :class="['w-5 h-5', template.proctoring_settings.blockCopyPaste ? 'text-danger' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span class="text-sm text-gray-900 dark:text-white">Блокировка копирования</span>
              </div>

              <div class="flex items-center gap-3 p-3 rounded-lg" :class="template.proctoring_settings.blockRightClick ? 'bg-danger/10' : 'bg-gray-100 dark:bg-gray-800'">
                <svg :class="['w-5 h-5', template.proctoring_settings.blockRightClick ? 'text-danger' : 'text-gray-400']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <span class="text-sm text-gray-900 dark:text-white">Блокировка правого клика</span>
              </div>
            </div>

            <p v-else class="text-gray-500 dark:text-gray-400 text-sm">
              Антипрокторинг отключён. Студенты смогут свободно переключаться между вкладками во время теста.
            </p>
          </div>

          <!-- Языки тестирования -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Языки тестирования
            </h3>

            <div v-if="template.allowed_languages && template.allowed_languages.length > 0">
              <div class="flex flex-wrap gap-3 mb-4">
                <div
                  v-for="lang in template.allowed_languages"
                  :key="lang"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg"
                  :class="languageCardClasses[lang]"
                >
                  <span class="text-xl">{{ languageFlags[lang] }}</span>
                  <span class="font-medium">{{ languageLabels[lang] }}</span>
                </div>
              </div>

              <!-- Статистика вопросов по языкам -->
              <div v-if="languageStats.length > 0" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Вопросов в банке по языкам:</p>
                <div class="space-y-2">
                  <div
                    v-for="stat in languageStats"
                    :key="stat.language"
                    class="flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2">
                      <span>{{ languageFlags[stat.language] }}</span>
                      <span class="text-sm text-gray-700 dark:text-gray-300">{{ languageLabels[stat.language] }}</span>
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white">{{ stat.count }}</span>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="text-gray-500 dark:text-gray-400">
              Доступны все языки (ограничения не установлены)
            </p>
          </div>

          <!-- Предпросмотр вопросов -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Вопросы для теста
              </h3>
              <NuxtLink
                :to="`/test-bank/${template.bank_id}`"
                class="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                Перейти к банку
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>

            <div v-if="questionsLoading" class="flex items-center justify-center py-8">
              <div class="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"></div>
            </div>

            <div v-else-if="questions.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Банк вопросов пуст</p>
            </div>

            <div v-else class="space-y-3 max-h-96 overflow-y-auto">
              <div
                v-for="(question, index) in questions.slice(0, 10)"
                :key="question.id"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                  {{ index + 1 }}
                </span>
                <div class="flex-grow min-w-0">
                  <p class="text-sm text-gray-900 dark:text-white line-clamp-2">{{ question.question_text }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span :class="['inline-flex items-center rounded-full px-1.5 py-0.5 text-xs', difficultyClasses[question.difficulty]]">
                      {{ difficultyLabels[question.difficulty] }}
                    </span>
                    <span class="text-xs text-gray-500">{{ question.points }} б.</span>
                  </div>
                </div>
              </div>

              <div v-if="questions.length > 10" class="text-center py-2">
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  И ещё {{ questions.length - 10 }} вопросов...
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Правая колонка - статистика и быстрые действия -->
        <div class="space-y-6">
          <!-- Статистика теста -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Статистика</h3>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Всего вопросов в банке</span>
                <span class="text-xl font-bold text-primary">{{ template.questions_total }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Вопросов в тесте</span>
                <span class="text-xl font-bold text-black dark:text-white">
                  {{ template.questions_mode === 'all' ? template.questions_total : template.questions_count }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Максимум баллов</span>
                <span class="text-xl font-bold text-black dark:text-white">{{ totalPoints }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Для сдачи нужно</span>
                <span class="text-xl font-bold text-success">{{ Math.ceil(totalPoints * template.passing_score / 100) }}</span>
              </div>
            </div>
          </div>

          <!-- Информация о банке -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Банк вопросов</h3>

            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Название</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ template.bank_name }}</p>
              </div>

              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Код</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ template.bank_code }}</p>
              </div>

              <NuxtLink
                :to="`/test-bank/${template.bank_id}`"
                class="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm mt-2"
              >
                Открыть банк
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <!-- Использование шаблона -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Использование</h3>

            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Привязано к дисциплинам</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ usage.disciplines }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Назначено тестов</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ usage.assignments }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Пройдено сессий</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ usage.sessions }}</span>
              </div>
            </div>
          </div>

          <!-- Мета-информация -->
          <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">Информация</h3>

            <div class="space-y-3 text-sm">
              <div>
                <p class="text-gray-600 dark:text-gray-400">Создан</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(template.created_at) }}</p>
              </div>

              <div>
                <p class="text-gray-600 dark:text-gray-400">Обновлён</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(template.updated_at) }}</p>
              </div>

              <div v-if="template.created_by_name">
                <p class="text-gray-600 dark:text-gray-400">Автор</p>
                <p class="font-medium text-gray-900 dark:text-white">{{ template.created_by_name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Секция аналитики прохождений -->
      <div class="mt-8 bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Аналитика прохождений
          </h3>
          <button 
            v-if="!analyticsLoading && !analytics"
            @click="loadAnalytics"
            class="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Загрузить аналитику
          </button>
        </div>

        <!-- Loading -->
        <div v-if="analyticsLoading" class="flex items-center justify-center py-8">
          <div class="text-center">
            <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
            <p class="text-sm text-gray-500">Загрузка аналитики...</p>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else-if="!analytics" class="text-center py-8">
          <svg class="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p class="text-gray-500 dark:text-gray-400 mb-4">Нажмите для загрузки статистики прохождений</p>
          <UiButton variant="outline" size="sm" @click="loadAnalytics">
            Загрузить аналитику
          </UiButton>
        </div>

        <!-- Analytics content -->
        <div v-else-if="analytics.summary">
          <!-- Summary stats -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
              <p class="text-2xl font-bold text-primary">{{ analytics.summary.totalSessions }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Прохождений</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
              <p class="text-2xl font-bold text-black dark:text-white">{{ analytics.summary.uniqueStudents }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
              <p class="text-2xl font-bold text-warning">{{ analytics.summary.averageScore }}%</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Средний балл</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
              <p class="text-2xl font-bold text-success">{{ analytics.summary.passRate }}%</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">% сдачи</p>
            </div>
            <div class="text-center p-4 bg-gray-50 dark:bg-meta-4 rounded-lg">
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-300">{{ formatDuration(analytics.summary.averageTimeSeconds) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Среднее время</p>
            </div>
          </div>

          <!-- No data message -->
          <div v-if="analytics.summary.totalSessions === 0" class="text-center py-8 text-gray-500">
            <p>Пока нет данных о прохождениях этого теста</p>
          </div>

          <!-- Sessions table -->
          <div v-else>
            <h4 class="text-md font-medium text-black dark:text-white mb-4">Последние прохождения</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left border-b border-stroke dark:border-strokedark">
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Студент</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Группа</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Балл</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Статус</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400 text-center">Время</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400">Дата</th>
                    <th class="pb-3 font-medium text-gray-600 dark:text-gray-400"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="session in analytics.sessions.slice(0, 20)" 
                    :key="session.sessionId"
                    class="border-b border-stroke/50 dark:border-strokedark/50 hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
                  >
                    <td class="py-3">
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">{{ session.studentName }}</p>
                        <p v-if="session.studentPinfl" class="text-xs text-gray-400">{{ session.studentPinfl }}</p>
                      </div>
                    </td>
                    <td class="py-3 text-gray-600 dark:text-gray-400">{{ session.groupCode || '—' }}</td>
                    <td class="py-3 text-center">
                      <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="session.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
                      >
                        {{ session.score }}%
                      </span>
                    </td>
                    <td class="py-3 text-center">
                      <svg v-if="session.passed" class="w-5 h-5 text-success mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <svg v-else class="w-5 h-5 text-danger mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </td>
                    <td class="py-3 text-center text-gray-600 dark:text-gray-400">
                      {{ formatDuration(session.timeSpentSeconds) }}
                    </td>
                    <td class="py-3 text-gray-600 dark:text-gray-400">
                      {{ formatDate(session.completedAt) }}
                    </td>
                    <td class="py-3">
                      <button 
                        @click="viewSessionDetails(session.sessionId)"
                        class="text-primary hover:text-primary/80 text-xs"
                      >
                        Подробнее
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Question stats -->
            <div v-if="analytics.questionStats && analytics.questionStats.length > 0" class="mt-8">
              <h4 class="text-md font-medium text-black dark:text-white mb-4">
                Статистика по вопросам
                <span class="text-xs font-normal text-gray-500 ml-2">(отсортировано по сложности)</span>
              </h4>
              <div class="space-y-2">
                <div 
                  v-for="(q, idx) in analytics.questionStats.slice(0, 10)" 
                  :key="q.questionId"
                  class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-meta-4 rounded-lg"
                >
                  <span class="w-6 h-6 rounded-full bg-gray-200 dark:bg-strokedark flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                    {{ idx + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900 dark:text-white truncate">{{ q.questionText }}</p>
                  </div>
                  <div class="flex items-center gap-4 text-xs">
                    <span 
                      class="px-2 py-1 rounded"
                      :class="q.correctRate >= 70 ? 'bg-success/10 text-success' : q.correctRate >= 40 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'"
                    >
                      {{ q.correctRate }}% правильно
                    </span>
                    <span class="text-gray-500">
                      {{ q.totalAnswers }} ответов
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TestResultsModal для просмотра деталей сессии -->
      <AttendanceTestResultsModal
        :is-open="showSessionDetails"
        :session-id="selectedSessionId"
        @close="showSessionDetails = false"
      />
    </template>

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
import { ref, computed, onMounted } from 'vue';

const route = useRoute();

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();

// Состояние
const loading = ref(true);
const questionsLoading = ref(false);
const error = ref(null);
const template = ref(null);
const questions = ref([]);

// Константы
const questionsModeLabels = {
  all: 'Все вопросы',
  random: 'Случайные',
  manual: 'Вручную',
};

const showResultsLabels = {
  immediately: 'Сразу',
  after_deadline: 'После дедлайна',
  manual: 'Вручную',
  never: 'Никогда',
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
  ru: 'Русский',
  uz: "O'zbek",
  en: 'English',
};

const languageFlags = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  en: '🇬🇧',
};

const languageBadgeClasses = {
  ru: 'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30',
  uz: 'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-green-100 dark:bg-green-900/30',
  en: 'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30',
};

const languageCardClasses = {
  ru: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  uz: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  en: 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
};

// Статистика по языкам
const languageStats = computed(() => {
  if (!questions.value.length) return [];
  
  const stats = {};
  questions.value.forEach(q => {
    const lang = q.language || 'ru';
    stats[lang] = (stats[lang] || 0) + 1;
  });
  
  return Object.entries(stats).map(([language, count]) => ({
    language,
    count,
  })).sort((a, b) => b.count - a.count);
});

// Статистика использования (заглушка)
const usage = ref({
  disciplines: 0,
  assignments: 0,
  sessions: 0,
});

// Вычисляемые свойства
const totalPoints = computed(() => {
  if (template.value?.questions_mode === 'all') {
    return questions.value.reduce((sum, q) => sum + q.points, 0);
  }
  // Для random режима - примерное значение
  const avgPoints = questions.value.length > 0
    ? questions.value.reduce((sum, q) => sum + q.points, 0) / questions.value.length
    : 1;
  return Math.round(avgPoints * (template.value?.questions_count || 0));
});

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Утилиты
const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Загрузка данных
const loadTemplate = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}`);
    
    if (response.success) {
      template.value = response.template;
      await loadQuestions();
    } else {
      error.value = response.message || 'Шаблон не найден';
    }
  } catch (err) {
    console.error('Ошибка загрузки шаблона:', err);
    error.value = 'Ошибка загрузки шаблона';
  } finally {
    loading.value = false;
  }
};

const loadQuestions = async () => {
  if (!template.value?.bank_id) return;

  questionsLoading.value = true;
  try {
    const response = await authFetch(`/api/test-bank/questions?bank_id=${template.value.bank_id}`);
    if (response.success) {
      questions.value = response.questions;
    }
  } catch (err) {
    console.error('Ошибка загрузки вопросов:', err);
  } finally {
    questionsLoading.value = false;
  }
};

// Предпросмотр теста
const previewTest = async () => {
  try {
    // Создаём preview-сессию
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}/preview`, {
      method: 'POST',
    });

    if (response.success && response.session_id) {
      // Сохраняем информацию о шаблоне в localStorage для использования на странице теста
      if (response.template) {
        localStorage.setItem(`preview_template_${response.session_id}`, JSON.stringify(response.template));
      }
      // Переходим на страницу прохождения теста с флагом preview
      navigateTo(`/tests/take/${response.session_id}?preview=true`);
    } else {
      notification.value = {
        show: true,
        type: 'error',
        title: 'Ошибка',
        message: response.message || 'Не удалось создать preview-сессию',
      };
      setTimeout(() => {
        notification.value.show = false;
      }, 3000);
    }
  } catch (error) {
    console.error('Ошибка создания preview-сессии:', error);
    notification.value = {
      show: true,
      type: 'error',
      title: 'Ошибка',
      message: 'Произошла ошибка при создании preview-сессии',
    };
    setTimeout(() => {
      notification.value.show = false;
    }, 3000);
  }
};

// ==================
// АНАЛИТИКА
// ==================

const analyticsLoading = ref(false);
const analytics = ref(null);
const showSessionDetails = ref(false);
const selectedSessionId = ref(null);

// Загрузка аналитики
const loadAnalytics = async () => {
  analyticsLoading.value = true;
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}/analytics`);
    if (response.success) {
      analytics.value = response;
    } else {
      console.error('Ошибка загрузки аналитики:', response.message);
    }
  } catch (err) {
    console.error('Ошибка загрузки аналитики:', err);
  } finally {
    analyticsLoading.value = false;
  }
};

// Форматирование длительности
const formatDuration = (seconds) => {
  if (!seconds) return '0с';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins === 0) return `${secs}с`;
  if (secs === 0) return `${mins}м`;
  return `${mins}м ${secs}с`;
};

// Просмотр деталей сессии
const viewSessionDetails = (sessionId) => {
  selectedSessionId.value = sessionId;
  showSessionDetails.value = true;
};

// Инициализация
onMounted(() => {
  loadTemplate();
});
</script>
