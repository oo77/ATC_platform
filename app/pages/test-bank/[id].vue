<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">Загрузка банка вопросов...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error || !bank" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6 text-slate-400">
          <Library class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">{{ error || "Банк не найден" }}</h3>
        <UiButton class="mt-8 shadow-lg" @click="navigateTo('/test-bank')">К списку банков</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div class="mb-6">
          <NuxtLink to="/test-bank" class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
              <ArrowLeft class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            </div>
            Назад к списку
          </NuxtLink>
        </div>

        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <Library class="w-10 h-10 text-primary" />
            </div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{{ bank.name }}</h1>
                <div class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border" :class="bank.is_active ? 'border-success/20 bg-success/5 text-success' : 'border-slate-300 bg-slate-100 text-slate-500'">
                  {{ bank.is_active ? 'Активен' : 'Неактивен' }}
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">{{ bank.code }}</span>
                <span v-if="bank.category" class="flex items-center gap-1">
                  <Tags class="w-3.5 h-3.5" /> {{ bank.category }}
                </span>
                <span>{{ bank.questions_count || 0 }} вопросов</span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center lg:justify-end gap-2">
            <UiButton v-if="canManageTestBanks" variant="outline" size="sm" class="h-9 px-3 gap-1.5 font-bold" @click="showImportModal = true">
              <Upload class="w-3.5 h-3.5" /> Импорт
            </UiButton>
            <UiButton v-if="canManageTestBanks" size="sm" class="h-9 px-3 gap-1.5 font-bold" @click="openCreateQuestionModal">
              <Plus class="w-3.5 h-3.5" /> Добавить вопрос
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Всего</p>
              <h3 class="mt-0.5 text-lg font-bold text-primary">{{ stats.total }}</h3>
            </div>
            <div class="rounded-lg bg-primary/10 p-2 text-primary">
              <HelpCircle class="w-4 h-4" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Лёгкие</p>
              <h3 class="mt-0.5 text-lg font-bold text-success">{{ stats.difficulty.easy }}</h3>
            </div>
            <div class="rounded-lg bg-success/10 p-2 text-success">
              <Zap class="w-4 h-4" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Средние</p>
              <h3 class="mt-0.5 text-lg font-bold text-warning">{{ stats.difficulty.medium }}</h3>
            </div>
            <div class="rounded-lg bg-warning/10 p-2 text-warning">
              <TrendingUp class="w-4 h-4" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Сложные</p>
              <h3 class="mt-0.5 text-lg font-bold text-danger">{{ stats.difficulty.hard }}</h3>
            </div>
            <div class="rounded-lg bg-danger/10 p-2 text-danger">
              <Flame class="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- Language Stats -->
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div v-for="lang in languageStats" :key="lang.code" class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ lang.flag }}</span>
            <div>
              <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{{ lang.label }}</p>
              <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ lang.count }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-5 overflow-x-auto custom-scrollbar pb-1">
        <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <nav class="flex gap-0.5">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="['flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all whitespace-nowrap', activeTab === tab.id ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700']"
            >
              <component :is="tab.icon" class="h-3.5 w-3.5" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 space-y-4">
          <!-- QUESTIONS TAB -->
          <div v-show="activeTab === 'questions'" class="space-y-4 animate-in fade-in duration-500">
            <!-- Filters -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <Filter class="w-4 h-4 text-info" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-500">Фильтры</h3>
                <button v-if="hasActiveQuestionFilters" @click="resetQuestionFilters" class="ml-auto text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1">
                  <RotateCcw class="w-3 h-3" /> Сбросить
                </button>
              </div>
              <div class="p-4">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div class="col-span-2">
                    <div class="relative">
                      <input v-model="questionFilters.search" type="text" placeholder="Поиск..." class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary" />
                      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                  <div>
                    <select v-model="questionFilters.type" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 py-2 pl-3 pr-8 text-sm outline-none focus:border-primary appearance-none">
                      <option value="">Тип</option>
                      <option value="single">Один</option>
                      <option value="multiple">Несколько</option>
                      <option value="text">Текст</option>
                    </select>
                  </div>
                  <div>
                    <select v-model="questionFilters.difficulty" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 py-2 pl-3 pr-8 text-sm outline-none focus:border-primary appearance-none">
                      <option value="">Сложность</option>
                      <option value="easy">Лёгкий</option>
                      <option value="medium">Средний</option>
                      <option value="hard">Сложный</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Questions List -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div v-if="questionsLoading" class="p-12 text-center">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
              <div v-else-if="questions.length === 0" class="py-16 text-center">
                <HelpCircle class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <p class="text-slate-500">Нет вопросов</p>
              </div>
              <div v-else class="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                <div v-for="(q, idx) in questions" :key="q.id" class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <span class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                    {{ (pagination.page - 1) * pagination.limit + idx + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">{{ q.question_text }}</p>
                    <div class="flex items-center gap-2 mt-1">
                      <span :class="['px-1.5 py-0.5 rounded text-[9px] font-bold uppercase', difficultyClasses[q.difficulty]]">
                        {{ difficultyLabels[q.difficulty] }}
                      </span>
                      <span class="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold">
                        {{ questionTypeLabels[q.question_type] }}
                      </span>
                      <span class="text-[10px] text-slate-400">{{ languageFlags[q.language] }} {{ q.points }}б</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button @click="openEditQuestionModal(q)" class="p-1.5 text-slate-400 hover:text-warning hover:bg-warning/10 rounded-lg transition-all" title="Редактировать">
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button @click="toggleQuestionActive(q)" :class="['p-1.5 rounded-lg transition-all', q.is_active ? 'text-success hover:bg-success/10' : 'text-slate-400 hover:text-warning hover:bg-warning/10']" :title="q.is_active ? 'Деактивировать' : 'Активировать'">
                      <component :is="q.is_active ? CheckCircle : XCircle" class="w-3.5 h-3.5" />
                    </button>
                    <button @click="confirmDeleteQuestion(q)" class="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all" title="Удалить">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
                <p class="text-xs text-slate-500">Страница {{ pagination.page }} из {{ pagination.totalPages }}</p>
                <div class="flex gap-1">
                  <button @click="pagination.page--; loadQuestions()" :disabled="pagination.page === 1" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-50">←</button>
                  <button v-for="p in paginationRange" :key="p" @click="typeof p === 'number' && (pagination.page = p) && loadQuestions()" :class="['w-8 h-8 rounded-lg text-xs font-bold transition-all', typeof p !== 'number' ? 'text-slate-400' : pagination.page === p ? 'bg-primary text-white' : 'border border-slate-200 dark:border-slate-700']">{{ p }}</button>
                  <button @click="pagination.page++; loadQuestions()" :disabled="pagination.page >= pagination.totalPages" class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-50">→</button>
                </div>
              </div>
            </div>
          </div>

          <!-- SETTINGS TAB -->
          <div v-show="activeTab === 'settings'" class="animate-in fade-in duration-500">
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <Settings class="w-4 h-4 text-primary" />
                <h3 class="text-xs font-black uppercase tracking-widest text-slate-500">Настройки банка</h3>
              </div>
              <div class="p-4 space-y-4">
                <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-400">Название</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ bank.name }}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-400">Код</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{{ bank.code }}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-400">Категория</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ bank.category || '—' }}</span>
                </div>
                <div class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                  <span class="text-xs font-semibold text-slate-400">Вопросов</span>
                  <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ bank.questions_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-4 space-y-4">
          <!-- Quick Actions -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <Zap class="w-4 h-4 text-warning" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Действия</h4>
            </div>
            <div class="p-4 space-y-2">
              <UiButton v-if="canManageTestBanks" class="w-full h-10 gap-2 font-bold" @click="openCreateQuestionModal">
                <Plus class="w-4 h-4" /> Добавить вопрос
              </UiButton>
              <UiButton v-if="canManageTestBanks" variant="outline" class="w-full h-10 gap-2 font-bold" @click="showImportModal = true">
                <Upload class="w-4 h-4" /> Импорт вопросов
              </UiButton>
              <UiButton v-if="canManageTestBanks" variant="outline" class="w-full h-10 gap-2 font-bold" @click="openEditBankModal">
                <Pencil class="w-4 h-4" /> Редактировать банк
              </UiButton>
            </div>
          </div>

          <!-- Difficulty Distribution -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <BarChart3 class="w-4 h-4 text-info" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Распределение</h4>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Лёгкие</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-success rounded-full" :style="{ width: `${stats.total ? (stats.difficulty.easy / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="text-xs font-bold text-slate-600 dark:text-slate-400 w-8">{{ stats.difficulty.easy }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Средние</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-warning rounded-full" :style="{ width: `${stats.total ? (stats.difficulty.medium / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="text-xs font-bold text-slate-600 dark:text-slate-400 w-8">{{ stats.difficulty.medium }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500">Сложные</span>
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-danger rounded-full" :style="{ width: `${stats.total ? (stats.difficulty.hard / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="text-xs font-bold text-slate-600 dark:text-slate-400 w-8">{{ stats.difficulty.hard }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Templates -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <FileText class="w-4 h-4 text-primary" />
              <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Шаблоны</h4>
            </div>
            <div class="p-4 text-center">
              <p class="text-2xl font-bold text-primary">{{ bank.templates_count || 0 }}</p>
              <p class="text-xs text-slate-400">шаблонов используют этот банк</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Question Modal -->
    <UiModal :is-open="questionModalOpen" :title="editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'" size="lg" @close="closeQuestionModal">
      <form @submit.prevent class="space-y-4">
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Тип</label>
            <select v-model="questionForm.question_type" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option value="single">Один ответ</option>
              <option value="multiple">Несколько</option>
              <option value="text">Текст</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Язык</label>
            <select v-model="questionForm.language" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option value="ru">🇷🇺 Русский</option>
              <option value="uz">🇺🇿 Узбекский</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Сложность</label>
            <select v-model="questionForm.difficulty" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option value="easy">Лёгкий</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Баллы</label>
            <input v-model.number="questionForm.points" type="number" min="1" class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Текст <span class="text-danger">*</span></label>
          <textarea v-model="questionForm.question_text" rows="2" placeholder="Введите вопрос..." class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-sm outline-none focus:border-primary resize-none" :class="{ 'border-danger': questionFormErrors.question_text }"></textarea>
          <p v-if="questionFormErrors.question_text" class="mt-1 text-xs text-danger">{{ questionFormErrors.question_text }}</p>
        </div>

        <div v-if="questionForm.question_type === 'single'" class="space-y-2">
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">Варианты <span class="text-danger">*</span></label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="(opt, idx) in questionForm.options" :key="opt.id" class="flex items-center gap-2">
              <button type="button" @click="setCorrectOption(idx)" :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0', opt.correct ? 'border-success bg-success' : 'border-slate-300']">
                <Check v-if="opt.correct" class="w-3 h-3 text-white" />
              </button>
              <span class="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{{ String.fromCharCode(65 + idx) }}</span>
              <input v-model="opt.text" type="text" :placeholder="`Вариант ${String.fromCharCode(65 + idx)}`" class="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 px-3 text-sm outline-none focus:border-primary" :class="{ 'border-success': opt.correct }" />
              <button v-if="questionForm.options.length > 2" type="button" @click="removeOption(idx)" class="p-1 text-slate-400 hover:text-danger">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button v-if="questionForm.options.length < 8" type="button" @click="addOption" class="text-xs font-bold text-primary flex items-center gap-1">
            <Plus class="w-3 h-3" /> Добавить вариант
          </button>
          <p v-if="questionFormErrors.options" class="mt-1 text-xs text-danger">{{ questionFormErrors.options }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Объяснение</label>
          <textarea v-model="questionForm.explanation" rows="1" placeholder="Комментарий к ответу..." class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-sm outline-none focus:border-primary resize-none"></textarea>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="questionForm.is_active" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Активен</span>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeQuestionModal">Отмена</UiButton>
          <UiButton :loading="savingQuestion" @click="saveQuestion">{{ editingQuestion ? "Сохранить" : "Добавить" }}</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Import Modal -->
    <TestBankImportQuestionsModal v-if="showImportModal" :bank-id="route.params.id" @close="showImportModal = false" @imported="onQuestionsImported" />

    <!-- Delete Confirmation -->
    <UiConfirmModal :is-open="deleteQuestionModalOpen" title="Удалить вопрос?" message="Это действие нельзя отменить." variant="danger" :loading="deletingQuestion" @confirm="deleteQuestion" @cancel="deleteQuestionModalOpen = false" />

    <!-- Notifications -->
    <UiNotification v-if="notification.show" :type="notification.type" :title="notification.title" :message="notification.message" @close="notification.show = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  ArrowLeft, Library, Plus, Upload, HelpCircle, Zap, TrendingUp, Flame, Tags, Search,
  ChevronDown, Filter, RotateCcw, Pencil, CheckCircle, XCircle, Trash2, Check, X,
  ExternalLink, Settings, BarChart3, FileText, Grid, Info
} from "lucide-vue-next";

const route = useRoute();
definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

const loading = ref(true);
const questionsLoading = ref(false);
const savingQuestion = ref(false);
const deletingQuestion = ref(false);
const error = ref(null);

const bank = ref<any>(null);
const questions = ref<any[]>([]);
const stats = ref({ total: 0, difficulty: { easy: 0, medium: 0, hard: 0 }, language: { ru: 0, uz: 0, en: 0 } });

const activeTab = ref("questions");
const availableTabs = [
  { id: "questions", label: "Вопросы", icon: HelpCircle },
  { id: "settings", label: "Настройки", icon: Settings },
];

const questionFilters = ref({ search: "", type: "", difficulty: "" });
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const hasActiveQuestionFilters = computed(() => questionFilters.value.search || questionFilters.value.type || questionFilters.value.difficulty);

const languageStats = computed(() => [
  { code: "ru", flag: "🇷🇺", label: "Русский", count: stats.value.language.ru || 0 },
  { code: "uz", flag: "🇺🇿", label: "Узбекский", count: stats.value.language.uz || 0 },
  { code: "en", flag: "🇬🇧", label: "English", count: stats.value.language.en || 0 },
]);

const paginationRange = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | string)[] = [1];
  if (current > 3) range.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
  if (current < total - 2) range.push("...");
  range.push(total);
  return range;
});

const difficultyLabels = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
const difficultyClasses = { easy: "bg-success/10 text-success", medium: "bg-warning/10 text-warning", hard: "bg-danger/10 text-danger" };
const questionTypeLabels = { single: "Один", multiple: "Несколько", text: "Текст" };
const languageFlags = { ru: "🇷🇺", uz: "🇺🇿", en: "🇬🇧" };

const questionModalOpen = ref(false);
const deleteQuestionModalOpen = ref(false);
const showImportModal = ref(false);
const editingQuestion = ref(null);
const deletingQuestionData = ref(null);

const questionForm = ref({ question_type: "single", question_text: "", options: [{ id: "a", text: "", correct: true }, { id: "b", text: "", correct: false }], language: "ru", points: 1, difficulty: "medium", explanation: "", is_active: true });
const questionFormErrors = ref({ question_text: "", options: "" });

const notification = ref({ show: false, type: "success", title: "", message: "" });

const loadBank = async () => {
  loading.value = true;
  try {
    const r = await authFetch(`/api/test-bank/banks/${route.params.id}`);
    if (r.success) {
      bank.value = r.bank;
      if (r.stats) stats.value = r.stats;
      await loadQuestions();
    } else error.value = r.message;
  } catch (e) { error.value = "Ошибка загрузки"; }
  finally { loading.value = false; }
};

const loadQuestions = async () => {
  questionsLoading.value = true;
  try {
    const params: any = { bank_id: route.params.id, page: pagination.value.page, limit: pagination.value.limit };
    if (questionFilters.value.search) params.search = questionFilters.value.search;
    if (questionFilters.value.type) params.question_type = questionFilters.value.type;
    if (questionFilters.value.difficulty) params.difficulty = questionFilters.value.difficulty;

    const r = await authFetch("/api/test-bank/questions", { params });
    if (r.success) { questions.value = r.questions; pagination.value.total = r.total; pagination.value.totalPages = r.totalPages; }
  } catch (e) { console.error(e); }
  finally { questionsLoading.value = false; }
};

watch(questionFilters, () => { pagination.value.page = 1; loadQuestions(); }, { deep: true });

const resetQuestionFilters = () => { questionFilters.value = { search: "", type: "", difficulty: "" }; };

const openCreateQuestionModal = () => {
  editingQuestion.value = null;
  questionForm.value = { question_type: "single", question_text: "", options: [{ id: "a", text: "", correct: true }, { id: "b", text: "", correct: false }], language: "ru", points: 1, difficulty: "medium", explanation: "", is_active: true };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const openEditQuestionModal = (q: any) => {
  editingQuestion.value = q;
  const opts = q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options).options || [] : [];
  questionForm.value = { question_type: q.question_type, question_text: q.question_text, options: opts.length ? opts : [{ id: "a", text: "", correct: true }], language: q.language || "ru", points: q.points, difficulty: q.difficulty, explanation: q.explanation || "", is_active: q.is_active };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const closeQuestionModal = () => { questionModalOpen.value = false; editingQuestion.value = null; };

const setCorrectOption = (idx: number) => { questionForm.value.options.forEach((o: any, i: number) => { o.correct = i === idx; }); };

const addOption = () => {
  const letters = "abcdefgh";
  questionForm.value.options.push({ id: letters[questionForm.value.options.length], text: "", correct: false });
};

const removeOption = (idx: number) => {
  const wasCorrect = questionForm.value.options[idx].correct;
  questionForm.value.options.splice(idx, 1);
  if (wasCorrect && questionForm.value.options.length > 0) questionForm.value.options[0].correct = true;
  questionForm.value.options.forEach((o: any, i: number) => { o.id = "abcdefgh"[i]; });
};

const validateQuestionForm = () => {
  questionFormErrors.value = { question_text: "", options: "" };
  let valid = true;
  if (!questionForm.value.question_text.trim()) { questionFormErrors.value.question_text = "Текст вопроса обязателен"; valid = false; }
  if (questionForm.value.question_type === "single") {
    const filled = questionForm.value.options.filter((o: any) => o.text.trim());
    if (filled.length < 2) { questionFormErrors.value.options = "Минимум 2 варианта"; valid = false; }
    if (!questionForm.value.options.some((o: any) => o.correct && o.text.trim())) { questionFormErrors.value.options = "Выберите правильный ответ"; valid = false; }
  }
  return valid;
};

const saveQuestion = async () => {
  if (!validateQuestionForm()) return;
  savingQuestion.value = true;
  try {
    const filteredOptions = questionForm.value.options.filter((o: any) => o.text.trim());
    const payload = { bank_id: route.params.id, question_type: questionForm.value.question_type, question_text: questionForm.value.question_text.trim(), options: { options: filteredOptions }, language: questionForm.value.language, points: questionForm.value.points, difficulty: questionForm.value.difficulty, explanation: questionForm.value.explanation.trim() || undefined, is_active: questionForm.value.is_active };
    const r = editingQuestion.value ? await authFetch(`/api/test-bank/questions/${editingQuestion.value.id}`, { method: "PUT", body: payload }) : await authFetch("/api/test-bank/questions", { method: "POST", body: payload });
    if (r.success) { showNotification("success", "Успешно", editingQuestion.value ? "Вопрос обновлён" : "Вопрос добавлен"); closeQuestionModal(); loadQuestions(); loadBank(); }
    else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка сохранения"); }
  finally { savingQuestion.value = false; }
};

const toggleQuestionActive = async (q: any) => {
  const r = await authFetch(`/api/test-bank/questions/${q.id}`, { method: "PUT", body: { is_active: !q.is_active } });
  if (r.success) { q.is_active = !q.is_active; showNotification("success", "Успешно", q.is_active ? "Активирован" : "Деактивирован"); }
  else showNotification("error", "Ошибка", r.message);
};

const confirmDeleteQuestion = (q: any) => { deletingQuestionData.value = q; deleteQuestionModalOpen.value = true; };

const deleteQuestion = async () => {
  if (!deletingQuestionData.value) return;
  deletingQuestion.value = true;
  try {
    const r = await authFetch(`/api/test-bank/questions/${deletingQuestionData.value.id}`, { method: "DELETE" });
    if (r.success) { showNotification("success", "Успешно", "Вопрос удалён"); deleteQuestionModalOpen.value = false; loadQuestions(); loadBank(); }
    else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка удаления"); }
  finally { deletingQuestion.value = false; }
};

const onQuestionsImported = () => { showImportModal.value = false; loadQuestions(); loadBank(); showNotification("success", "Успешно", "Импорт завершён"); };

const openEditBankModal = () => { /* TODO: implement bank edit */ };

const showNotification = (type: string, title: string, message: string) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => { loadBank(); });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>