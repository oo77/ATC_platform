<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка шаблона теста...
        </p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error || !template"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center max-w-md">
        <div
          class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400"
        >
          <FileTextIcon class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
          {{ error || "Шаблон теста не найден" }}
        </h3>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/test-bank/templates')"
          >К списку шаблонов</UiButton
        >
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink
            to="/test-templates"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-4 h-4 transition-transform group-hover:-translate-x-1"
              />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Template Main Info -->
          <div class="flex items-center gap-4">
            <div class="shrink-0">
              <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <FileTextIcon class="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{{ template.name }}</h1>
                <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border" :class="template.is_active ? 'border-success/20 bg-success/5 text-success' : 'border-slate-300 bg-slate-100 text-slate-500'">
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <div class="flex items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">{{ template.code }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <FolderIcon class="w-3.5 h-3.5 text-slate-400" />
                  <NuxtLink :to="`/test-bank/${template.bank_id}`" class="hover:text-primary transition-colors">{{ template.bank_name }}</NuxtLink>
                </div>
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
                  <span v-else class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    🌐 Все
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex flex-wrap items-center justify-center lg:justify-end gap-2"
          >
            <UiButton variant="outline" size="sm" class="h-9 px-3 gap-1.5 font-bold" @click="previewTest">
              <EyeIcon class="w-3.5 h-3.5" /> Предпросмотр
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <!-- Questions Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Вопросов в банке</p>
              <h3 class="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{{ template.questions_total }}</h3>
            </div>
            <div class="rounded-lg bg-primary/10 p-2 text-primary ml-2 shrink-0">
              <HelpCircleIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Questions in Test Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Вопросов в тесте</p>
              <h3 class="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {{ template.questions_mode === 'all' ? template.questions_total : template.questions_count }}
              </h3>
            </div>
            <div class="rounded-lg bg-info/10 p-2 text-info ml-2 shrink-0">
              <ListIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Max Points Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Макс. баллов</p>
              <h3 class="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{{ totalPoints }}</h3>
            </div>
            <div class="rounded-lg bg-success/10 p-2 text-success ml-2 shrink-0">
              <AwardIcon class="w-4 h-4" />
            </div>
          </div>
        </div>

        <!-- Passing Score Card -->
        <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
          <div class="flex items-center justify-between">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Проходной балл</p>
              <h3 class="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{{ template.passing_score }}%</h3>
            </div>
            <div class="rounded-lg bg-warning/10 p-2 text-warning ml-2 shrink-0">
              <TargetIcon class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-5 overflow-x-auto custom-scrollbar pb-1">
        <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <nav class="flex gap-0.5">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-3.5 w-3.5" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Main Content Area (8 cols) -->
        <div class="lg:col-span-8 space-y-4">
          <!-- SETTINGS TAB -->
          <div
            v-show="activeTab === 'settings'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <!-- Main Settings -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <SettingsIcon class="w-4 h-4 text-primary" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Основные настройки</h3>
              </div>
              <div class="divide-y divide-slate-100 dark:divide-slate-800">
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Режим вопросов</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ questionsModeLabels[template.questions_mode] }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Лимит времени</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ template.time_limit_minutes ? `${template.time_limit_minutes} мин.` : 'Без лимита' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Максимум попыток</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ template.max_attempts }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Вопросов на странице</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ template.questions_per_page === 0 ? 'Все сразу' : template.questions_per_page }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Показ результатов</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ showResultsLabels[template.show_results] }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="text-xs font-semibold text-slate-400 w-40 shrink-0">Возврат к вопросам</span>
                  <span class="text-sm font-bold" :class="template.allow_back ? 'text-success' : 'text-danger'">{{ template.allow_back ? 'Разрешён' : 'Запрещён' }}</span>
                </div>
              </div>
            </div>

            <!-- Shuffle Settings -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <ShuffleIcon class="w-4 h-4 text-warning" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Перемешивание</h3>
              </div>
              <div class="p-4 flex flex-wrap gap-3">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg" :class="template.shuffle_questions ? 'bg-success/10' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="template.shuffle_questions ? CheckIcon : XIcon" class="w-4 h-4" :class="template.shuffle_questions ? 'text-success' : 'text-slate-400'" />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Перемешивать вопросы</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg" :class="template.shuffle_options ? 'bg-success/10' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="template.shuffle_options ? CheckIcon : XIcon" class="w-4 h-4" :class="template.shuffle_options ? 'text-success' : 'text-slate-400'" />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Перемешивать варианты</span>
                </div>
              </div>
            </div>

            <!-- Anti-Proctoring -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <ShieldIcon class="w-4 h-4 text-danger" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Антипрокторинг</h3>
                <span class="ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded" :class="template.proctoring_enabled ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'">
                  {{ template.proctoring_enabled ? 'Включён' : 'Отключён' }}
                </span>
              </div>
              <div v-if="template.proctoring_enabled && template.proctoring_settings" class="p-4 flex flex-wrap gap-3">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg" :class="template.proctoring_settings.blockTabSwitch ? 'bg-danger/10' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="template.proctoring_settings.blockTabSwitch ? CheckIcon : XIcon" class="w-4 h-4" :class="template.proctoring_settings.blockTabSwitch ? 'text-danger' : 'text-slate-400'" />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Блокировка вкладок</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg" :class="template.proctoring_settings.blockCopyPaste ? 'bg-danger/10' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="template.proctoring_settings.blockCopyPaste ? CheckIcon : XIcon" class="w-4 h-4" :class="template.proctoring_settings.blockCopyPaste ? 'text-danger' : 'text-slate-400'" />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Блокировка копирования</span>
                </div>
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg" :class="template.proctoring_settings.blockRightClick ? 'bg-danger/10' : 'bg-slate-100 dark:bg-slate-800'">
                  <component :is="template.proctoring_settings.blockRightClick ? CheckIcon : XIcon" class="w-4 h-4" :class="template.proctoring_settings.blockRightClick ? 'text-danger' : 'text-slate-400'" />
                  <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Блокировка правого клика</span>
                </div>
              </div>
              <div v-else class="px-4 py-6 text-center text-xs text-slate-400">
                Антипрокторинг отключён
              </div>
            </div>
          </div>

          <!-- QUESTIONS TAB -->
          <div
            v-show="activeTab === 'questions'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <!-- Questions Preview -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex items-center gap-2">
                  <HelpCircleIcon class="w-4 h-4 text-primary" />
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Вопросы для теста</h3>
                </div>
                <NuxtLink :to="`/test-bank/${template.bank_id}`" class="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                  Открыть банк
                  <ExternalLinkIcon class="w-3 h-3" />
                </NuxtLink>
              </div>

              <div v-if="questionsLoading" class="flex items-center justify-center py-12">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>

              <div v-else-if="questions.length === 0" class="px-4 py-12 text-center text-sm text-slate-400">
                Банк вопросов пуст
              </div>

              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                <div
                  v-for="(question, index) in questions.slice(0, 20)"
                  :key="question.id"
                  class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                    {{ index + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{{ question.question_text }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span
                        :class="['px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight', difficultyClasses[question.difficulty]]"
                      >
                        {{ difficultyLabels[question.difficulty] }}
                      </span>
                      <span class="text-[10px] text-slate-400">{{ question.points }} б.</span>
                    </div>
                  </div>
                </div>

                <div v-if="questions.length > 20" class="px-4 py-3 text-center">
                  <span class="text-xs text-slate-400">Показано 20 из {{ questions.length }} вопросов</span>
                </div>
              </div>
            </div>

            <!-- Language Stats -->
            <div v-if="languageStats.length > 0" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <GlobeIcon class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Языки тестирования</h3>
              </div>
              <div class="p-4 space-y-2">
                <div
                  v-for="stat in languageStats"
                  :key="stat.language"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ languageFlags[stat.language] }}</span>
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ languageLabels[stat.language] }}</span>
                  </div>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ stat.count }} вопросов</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ANALYTICS TAB -->
          <div
            v-show="activeTab === 'analytics'"
            class="space-y-4 animate-in fade-in duration-500"
          >
            <!-- Collapsible Analytics Header -->
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <button
                @click="analyticsExpanded = !analyticsExpanded"
                class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div class="flex items-center gap-2">
                  <BarChart3Icon class="w-4 h-4 text-primary" />
                  <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Аналитика прохождений</h3>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="!analytics && !analyticsLoading" class="text-[10px] font-semibold text-slate-400">Нажмите для загрузки</span>
                  <ChevronDownIcon class="w-4 h-4 text-slate-400 transition-transform duration-300" :class="{ 'rotate-180': analyticsExpanded }" />
                </div>
              </button>

              <!-- Collapsible Content -->
              <div v-show="analyticsExpanded" class="divide-y divide-slate-100 dark:divide-slate-800">
                <!-- Loading -->
                <div v-if="analyticsLoading" class="flex items-center justify-center py-12">
                  <div class="text-center">
                    <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
                    <p class="text-xs text-slate-500">Загрузка аналитики...</p>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else-if="!analytics" class="py-12 text-center">
                  <BarChart3Icon class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Нажмите для загрузки статистики прохождений</p>
                  <UiButton variant="outline" size="sm" @click="loadAnalytics">
                    Загрузить аналитику
                  </UiButton>
                </div>

                <!-- Analytics Content -->
                <template v-else>
                  <!-- Summary Stats -->
                  <div class="p-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div class="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p class="text-2xl font-black text-primary">{{ analytics.summary.totalSessions }}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Прохождений</p>
                      </div>
                      <div class="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p class="text-2xl font-black text-slate-900 dark:text-white">{{ analytics.summary.uniqueStudents }}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Студентов</p>
                      </div>
                      <div class="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p class="text-2xl font-black text-warning">{{ analytics.summary.averageScore }}%</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Средний балл</p>
                      </div>
                      <div class="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p class="text-2xl font-black text-success">{{ analytics.summary.passRate }}%</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Процент сдачи</p>
                      </div>
                      <div class="text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <p class="text-2xl font-black text-slate-600 dark:text-slate-300">{{ formatDuration(analytics.summary.averageTimeSeconds) }}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Среднее время</p>
                      </div>
                    </div>
                  </div>

                  <!-- No Data Message -->
                  <div v-if="analytics.summary.totalSessions === 0" class="py-8 text-center text-sm text-slate-500">
                    Пока нет данных о прохождениях этого теста
                  </div>

                  <!-- Sessions Table -->
                  <div v-else>
                    <!-- Search and Filter -->
                    <div class="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                      <div class="relative flex-1 min-w-[200px]">
                        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          v-model="analyticsSearch"
                          type="text"
                          placeholder="Поиск по студенту..."
                          class="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <select
                        v-model="analyticsFilter"
                        class="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-primary"
                      >
                        <option value="all">Все</option>
                        <option value="passed">Сдали</option>
                        <option value="failed">Не сдали</option>
                      </select>
                      <span class="text-xs text-slate-500">
                        {{ filteredSessions.length }} из {{ analytics.sessions.length }}
                      </span>
                    </div>

                    <!-- Sessions List -->
                    <div class="max-h-80 overflow-y-auto">
                      <table class="w-full text-sm">
                        <thead class="sticky top-0 bg-white dark:bg-slate-900">
                          <tr class="text-left border-b border-slate-100 dark:border-slate-800">
                            <th class="pb-3 px-4 font-medium text-slate-500 text-xs">Студент</th>
                            <th class="pb-3 font-medium text-slate-500 text-xs text-center">Балл</th>
                            <th class="pb-3 font-medium text-slate-500 text-xs text-center">Статус</th>
                            <th class="pb-3 font-medium text-slate-500 text-xs text-center">Время</th>
                            <th class="pb-3 font-medium text-slate-500 text-xs">Дата</th>
                            <th class="pb-3 pr-4 font-medium text-slate-500 text-xs text-right">Ответы</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                          <tr
                            v-for="session in paginatedSessions"
                            :key="session.sessionId"
                            class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td class="py-3 px-4">
                              <p class="font-medium text-slate-800 dark:text-slate-200">{{ session.studentName }}</p>
                              <p v-if="session.studentPinfl" class="text-[10px] text-slate-400">{{ session.studentPinfl }}</p>
                            </td>
                            <td class="py-3 text-center">
                              <span
                                class="px-2 py-0.5 rounded text-xs font-bold"
                                :class="session.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'"
                              >
                                {{ session.score }}%
                              </span>
                            </td>
                            <td class="py-3 text-center">
                              <component :is="session.passed ? CheckCircleIcon : XCircleIcon" class="w-5 h-5 mx-auto" :class="session.passed ? 'text-success' : 'text-danger'" />
                            </td>
                            <td class="py-3 text-center text-slate-500 text-xs">{{ formatDuration(session.timeSpentSeconds) }}</td>
                            <td class="py-3 px-4 text-slate-500 text-xs">{{ formatDate(session.completedAt) }}</td>
                            <td class="py-3 pr-4 text-right">
                              <button
                                @click="viewSessionDetails(session.sessionId)"
                                class="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 active:scale-95"
                              >
                                <ClipboardListIcon class="w-3 h-3 group-hover:rotate-6 transition-transform" />
                                Ответы
                              </button>
                            </td>
                          </tr>
                          <tr v-if="filteredSessions.length === 0">
                            <td colspan="6" class="py-8 text-center text-sm text-slate-400">Нет записей</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="analyticsTotalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                      <p class="text-xs text-slate-500">Страница {{ analyticsPage }} из {{ analyticsTotalPages }}</p>
                      <div class="flex gap-1">
                        <button
                          v-for="page in paginationRange"
                          :key="page"
                          @click="typeof page === 'number' && (analyticsPage = page)"
                          :class="['w-8 h-8 rounded-lg text-xs font-bold transition-colors', typeof page !== 'number' ? 'text-slate-400 cursor-default' : analyticsPage === page ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800']"
                        >{{ page }}</button>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          <!-- Test Bank Info -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <FolderIcon class="w-4 h-4 text-info" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Банк вопросов</h4>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Название</p>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{{ template.bank_name }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Код</p>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">{{ template.bank_code }}</p>
              </div>
              <NuxtLink :to="`/test-bank/${template.bank_id}`" class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 mt-2">
                Открыть банк
                <ExternalLinkIcon class="w-3 h-3" />
              </NuxtLink>
            </div>
          </div>

          <!-- Usage Stats -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <BarChart3Icon class="w-4 h-4 text-slate-500" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Использование</h4>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">Привязано к дисциплинам</span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ usage.disciplines }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">Назначено тестов</span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ usage.assignments }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-400">Пройдено сессий</span>
                <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ usage.sessions }}</span>
              </div>
            </div>
          </div>

          <!-- Meta Info -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <InfoIcon class="w-4 h-4 text-slate-500" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Информация</h4>
            </div>
            <div class="p-4 space-y-3">
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Создан</p>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{{ formatDate(template.created_at) }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Обновлён</p>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{{ formatDate(template.updated_at) }}</p>
              </div>
              <div v-if="template.created_by_name">
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Автор</p>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{{ template.created_by_name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Language Selection Modal for Preview -->
    <TestsLanguageSelectModal
      :is-open="showLanguageModal"
      :custom-languages="availableLanguagesForModal"
      @close="showLanguageModal = false"
      @confirm="handleLanguageConfirm"
    />

    <!-- Test Results Modal -->
    <AttendanceTestResultsModal
      :is-open="showSessionDetails"
      :session-id="selectedSessionId"
      @close="showSessionDetails = false"
    />

    <!-- Notifications -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  ArrowLeft,
  FileText as FileTextIcon,
  Eye as EyeIcon,
  ClipboardList as ClipboardListIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
  HelpCircle as HelpCircleIcon,
  List as ListIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  Check as CheckIcon,
  X as XIcon,
  Shield as ShieldIcon,
  Shuffle as ShuffleIcon,
  Globe as GlobeIcon,
  BarChart3 as BarChart3Icon,
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  ExternalLink as ExternalLinkIcon,
  Info as InfoIcon,
} from "lucide-vue-next";

const route = useRoute();
const { authFetch } = useAuthFetch();

definePageMeta({
  layout: "default",
});

// State
const loading = ref(true);
const questionsLoading = ref(false);
const error = ref<string | null>(null);
const template = ref<any>(null);
const questions = ref<any[]>([]);

// Tabs
const activeTab = ref("settings");
const availableTabs = [
  { id: "settings", label: "Настройки", icon: SettingsIcon },
  { id: "questions", label: "Вопросы", icon: HelpCircleIcon },
  { id: "analytics", label: "Аналитика", icon: BarChart3Icon },
];

// Analytics state
const analyticsLoading = ref(false);
const analytics = ref<any>(null);
const analyticsExpanded = ref(false);
const showSessionDetails = ref(false);
const selectedSessionId = ref<string | null>(null);

// Search/filter/pagination
const analyticsSearch = ref("");
const analyticsFilter = ref("all");
const analyticsPage = ref(1);
const analyticsPerPage = 10;

// Notification
const notification = ref<{
  show: boolean;
  type: "success" | "info" | "error" | "warning";
  title: string;
  message: string;
}>({
  show: false,
  type: "success",
  title: "",
  message: "",
});

// Language modal
const showLanguageModal = ref(false);
const availableLanguagesForModal = computed(() => {
  if (!template.value?.allowed_languages || template.value.allowed_languages.length === 0) {
    return [
      { value: "ru", label: "Русский", flag: "🇷🇺" },
      { value: "uz", label: "O'zbek", flag: "🇺🇿" },
      { value: "en", label: "English", flag: "🇬🇧" },
    ];
  }
  return template.value.allowed_languages.map((lang: string) => ({
    value: lang,
    label: languageLabels[lang] || lang,
    flag: languageFlags[lang] || "",
  }));
});

// Constants
const questionsModeLabels = {
  all: "Все вопросы",
  random: "Случайные",
  manual: "Вручную",
};

const showResultsLabels = {
  immediately: "Сразу",
  after_deadline: "После дедлайна",
  manual: "Вручную",
  never: "Никогда",
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

const languageLabels: Record<string, string> = {
  ru: "Русский",
  uz: "O'zbek",
  en: "English",
};

const languageFlags: Record<string, string> = {
  ru: "🇷🇺",
  uz: "🇺🇿",
  en: "🇬🇧",
};

const languageBadgeClasses: Record<string, string> = {
  ru: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30",
  uz: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-green-100 dark:bg-green-900/30",
  en: "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs bg-purple-100 dark:bg-purple-900/30",
};

// Usage (placeholder)
const usage = ref({
  disciplines: 0,
  assignments: 0,
  sessions: 0,
});

// Computed
const totalPoints = computed(() => {
  if (template.value?.questions_mode === "all") {
    return questions.value.reduce((sum, q) => sum + q.points, 0);
  }
  const avgPoints = questions.value.length > 0
    ? questions.value.reduce((sum, q) => sum + q.points, 0) / questions.value.length
    : 1;
  return Math.round(avgPoints * (template.value?.questions_count || 0));
});

const languageStats = computed(() => {
  if (!questions.value.length) return [];
  const stats: Record<string, number> = {};
  questions.value.forEach((q) => {
    const lang = q.language || "ru";
    stats[lang] = (stats[lang] || 0) + 1;
  });
  return Object.entries(stats)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
});

const filteredSessions = computed(() => {
  if (!analytics.value?.sessions) return [];
  return analytics.value.sessions.filter((s) => {
    const matchSearch = !analyticsSearch.value ||
      s.studentName.toLowerCase().includes(analyticsSearch.value.toLowerCase()) ||
      s.studentPinfl?.toLowerCase().includes(analyticsSearch.value.toLowerCase()) ||
      s.groupCode?.toLowerCase().includes(analyticsSearch.value.toLowerCase());
    const matchFilter = analyticsFilter.value === "all" ||
      (analyticsFilter.value === "passed" && s.passed) ||
      (analyticsFilter.value === "failed" && !s.passed);
    return matchSearch && matchFilter;
  });
});

const paginatedSessions = computed(() => {
  const start = (analyticsPage.value - 1) * analyticsPerPage;
  return filteredSessions.value.slice(start, start + analyticsPerPage);
});

const analyticsTotalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSessions.value.length / analyticsPerPage))
);

const paginationRange = computed(() => {
  const total = analyticsTotalPages.value;
  const current = analyticsPage.value;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | string)[] = [1];
  if (current > 3) range.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    range.push(i);
  }
  if (current < total - 2) range.push("...");
  range.push(total);
  return range;
});

// Methods
const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDuration = (seconds: number) => {
  if (!seconds) return "0с";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}с`;
  if (secs === 0) return `${mins}м`;
  return `${mins}м ${secs}с`;
};

const loadTemplate = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}`);
    if (response.success) {
      template.value = response.template;
      await loadQuestions();
    } else {
      error.value = response.message || "Шаблон не найден";
    }
  } catch (err) {
    console.error("Ошибка загрузки шаблона:", err);
    error.value = "Ошибка загрузки шаблона";
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
    console.error("Ошибка загрузки вопросов:", err);
  } finally {
    questionsLoading.value = false;
  }
};

const loadAnalytics = async () => {
  if (!analyticsExpanded.value) {
    analyticsExpanded.value = true;
  }
  analyticsLoading.value = true;
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}/analytics`);
    if (response.success) {
      analytics.value = response;
      analyticsPage.value = 1;
    }
  } catch (err) {
    console.error("Ошибка загрузки аналитики:", err);
  } finally {
    analyticsLoading.value = false;
  }
};

const previewTest = async () => {
  if (!template.value) return;
  const allowed = template.value.allowed_languages;
  const isSingleLanguage = allowed && allowed.length === 1;
  if (!isSingleLanguage) {
    showLanguageModal.value = true;
  } else {
    await startPreview(allowed[0]);
  }
};

const handleLanguageConfirm = async (language: string) => {
  showLanguageModal.value = false;
  await startPreview(language);
};

const startPreview = async (language: string | null = null) => {
  try {
    const response = await authFetch(`/api/test-bank/templates/${route.params.id}/preview`, {
      method: "POST",
      body: { language },
    });
    if (response.success && response.session_id) {
      if (response.template) {
        localStorage.setItem(`preview_template_${response.session_id}`, JSON.stringify(response.template));
      }
      navigateTo(`/tests/take/${response.session_id}?preview=true`);
    } else {
      notification.value = {
        show: true,
        type: "error",
        title: "Ошибка",
        message: response.message || "Не удалось создать preview-сессию",
      };
      setTimeout(() => { notification.value.show = false; }, 3000);
    }
  } catch (error) {
    console.error("Ошибка создания preview-сессии:", error);
    notification.value = {
      show: true,
      type: "error",
      title: "Ошибка",
      message: "Произошла ошибка при создании preview-сессии",
    };
    setTimeout(() => { notification.value.show = false; }, 5000);
  }
};

const viewSessionDetails = (sessionId: string) => {
  selectedSessionId.value = sessionId;
  showSessionDetails.value = true;
};

// Watchers
watch([analyticsSearch, analyticsFilter], () => {
  analyticsPage.value = 1;
});

// Lifecycle
onMounted(() => {
  loadTemplate();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>