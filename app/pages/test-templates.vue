<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Шаблоны тестов
          </h1>
          <p class="text-slate-500 font-medium">
            Готовые конфигурации тестов для использования в учебном процессе
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton
            v-if="canManageTemplates"
            variant="primary"
            size="sm"
            class="h-10 px-4 gap-2 font-bold shadow-sm"
            @click="openCreateModal"
          >
            <Plus class="w-4 h-4" />
            Создать шаблон
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего шаблонов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ pagination.total }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <FileText class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.active }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">С лимитом времени</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.withTimeLimit }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Clock class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs (связанные подразделы test-bank) -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            @click="navigateTo('/test-bank')"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', $route.path === '/test-bank' ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
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

    <!-- Фильтры и поиск -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">
            Фильтры
          </h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить фильтры
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Поиск -->
        <div class="relative max-w-xl">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Поиск по названию, коду шаблона..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Банк вопросов -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Library class="w-3.5 h-3.5" />
              Банк вопросов
            </label>
            <div class="relative">
              <select
                v-model="filters.bankId"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все банки</option>
                <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Статус -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Activity class="w-3.5 h-3.5" />
              Статус
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="filters.isActive = undefined; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.isActive === undefined ? 'bg-slate-800 text-white shadow-md dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                Все
              </button>
              <button
                @click="filters.isActive = true; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === true ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-success/5 text-success hover:bg-success/10 border border-success/20'"
              >
                <span v-if="filters.isActive === true" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                Активные
              </button>
              <button
                @click="filters.isActive = false; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === false ? 'bg-slate-500 text-white shadow-md dark:bg-slate-400 dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'"
              >
                Неактивные
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список шаблонов -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-medium tracking-wide">
          Загрузка шаблонов...
        </p>
      </div>

      <!-- Пустой список -->
      <div
        v-else-if="templates.length === 0"
        class="py-20 px-6 text-center text-slate-500 dark:text-slate-400"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText class="h-10 w-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Шаблоны не найдены</h3>
        <p class="max-w-md mx-auto text-slate-500">
          Создайте первый шаблон теста, нажав кнопку "Создать шаблон" в правом верхнем углу
        </p>
      </div>

      <!-- Таблица -->
      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Шаблон</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Банк</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Параметры</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Языки</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Статус</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="template in templates"
              :key="template.id"
              class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-inner border border-primary/10">
                    <FileText class="w-5 h-5" />
                  </div>
                  <div class="min-w-0">
                    <h5 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {{ template.name }}
                    </h5>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {{ template.code }}
                      </span>
                      <span v-if="template.description" class="text-sm text-slate-500 line-clamp-1 max-w-xs">
                        {{ template.description }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle">
                <NuxtLink
                  :to="`/test-bank/${template.bank_id}`"
                  class="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {{ template.bank_name }}
                </NuxtLink>
              </td>
              <td class="px-6 py-4 align-middle">
                <div class="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400 items-center">
                  <div class="flex items-center gap-1">
                    <HelpCircle class="w-3.5 h-3.5" />
                    <span class="font-bold">{{ getQuestionsLabel(template) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Clock class="w-3.5 h-3.5" />
                    <span>{{ template.time_limit_minutes ? `${template.time_limit_minutes} мин` : 'Без лимита' }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <CheckCircle class="w-3.5 h-3.5" />
                    <span>{{ template.passing_score }}%</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle text-center">
                <div v-if="template.allowed_languages && template.allowed_languages.length > 0" class="flex items-center justify-center gap-1">
                  <span
                    v-for="lang in template.allowed_languages"
                    :key="lang"
                    class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                    :class="languageBadgeClasses[lang]"
                    :title="languageLabels[lang]"
                  >
                    {{ languageFlags[lang] }}
                  </span>
                </div>
                <span
                  v-else
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  title="Все языки доступны"
                >
                  🌐 Все
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                    template.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  ]"
                >
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="viewTemplate(template)"
                    class="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Настроить"
                  >
                    <Settings class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTemplates"
                    @click="openEditModal(template)"
                    class="p-2 text-slate-500 hover:text-warning hover:bg-warning/10 rounded-xl transition-colors"
                    title="Редактировать"
                  >
                    <Pencil class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTemplates"
                    @click="confirmDelete(template)"
                    class="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                    title="Удалить"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.totalPages > 1"
        class="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30"
      >
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
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
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
      size="xl"
      @close="closeModal"
    >
      <form @submit.prevent="saveTemplate">
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <!-- Колонка 1: Основная информация -->
          <div class="space-y-4">
            <h4 class="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">
              Общая информация
            </h4>

            <!-- Название -->
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Название <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Например: Тест по охране труда"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
                :class="{ 'border-danger ring-2 ring-danger/10': formErrors.name }"
              />
              <p v-if="formErrors.name" class="mt-1 text-xs text-danger font-medium">{{ formErrors.name }}</p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <!-- Код -->
              <div>
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Код <span class="text-danger">*</span>
                </label>
                <input
                  v-model="form.code"
                  type="text"
                  placeholder="CODE-01"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium uppercase text-sm"
                  :class="{ 'border-danger ring-2 ring-danger/10': formErrors.code }"
                />
                <p v-if="formErrors.code" class="mt-1 text-xs text-danger font-medium">{{ formErrors.code }}</p>
              </div>

              <!-- Банк -->
              <div>
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Банк <span class="text-danger">*</span>
                </label>
                <div class="relative">
                  <select
                    v-model="form.bank_id"
                    class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-8 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm appearance-none"
                    :class="{ 'border-danger ring-2 ring-danger/10': formErrors.bank_id }"
                  >
                    <option value="">Выберите...</option>
                    <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
                  </select>
                  <ChevronDown class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p v-if="formErrors.bank_id" class="mt-1 text-xs text-danger font-medium">{{ formErrors.bank_id }}</p>
              </div>
            </div>

            <!-- Описание -->
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Описание
              </label>
              <textarea
                v-model="form.description"
                rows="3"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm resize-none"
              ></textarea>
            </div>

            <!-- Языки -->
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Языки <span class="text-danger">*</span>
              </label>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="lang in availableLanguages"
                  :key="lang.value"
                  class="flex items-center gap-2 cursor-pointer p-2 rounded-xl border transition-all"
                  :class="[
                    form.allowed_languages.includes(lang.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary/50'
                  ]"
                >
                  <input
                    type="checkbox"
                    :value="lang.value"
                    v-model="form.allowed_languages"
                    class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    @change="onLanguageChange"
                  />
                  <span class="text-sm font-bold">{{ lang.flag }}</span>
                </label>
              </div>
              <p v-if="formErrors.allowed_languages" class="mt-1 text-xs text-danger font-medium">{{ formErrors.allowed_languages }}</p>

              <!-- Валидация языков -->
              <div
                v-if="form.bank_id && form.allowed_languages.length > 0 && form.questions_mode === 'random'"
                class="mt-2 space-y-1"
              >
                <div v-if="languageValidationLoading" class="text-xs text-slate-500">Проверка...</div>
                <div v-else class="space-y-1">
                  <div
                    v-for="validation in languageValidation"
                    :key="validation.language"
                    class="flex items-center justify-between px-2 py-1 rounded-lg text-xs"
                    :class="validation.isValid ? 'bg-success/10' : 'bg-danger/10'"
                  >
                    <div class="flex items-center gap-1">
                      <span>{{ validation.flag }}</span>
                      <span :class="validation.isValid ? 'text-success font-bold' : 'text-danger font-bold'">{{ validation.available }} / {{ validation.required }}</span>
                    </div>
                  </div>
                  <p v-if="hasInvalidLanguages" class="text-xs text-danger font-medium">Недостаточно вопросов</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Колонка 2: Настройки теста -->
          <div class="space-y-4">
            <h4 class="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">
              Параметры теста
            </h4>

            <div class="grid grid-cols-2 gap-3">
              <!-- Режим вопросов -->
              <div class="col-span-2">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Режим выборки
                </label>
                <select
                  v-model="form.questions_mode"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-8 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm appearance-none"
                >
                  <option value="all">Все вопросы</option>
                  <option value="random">Случайная выборка</option>
                </select>
              </div>

              <!-- Количество (если random) -->
              <div v-if="form.questions_mode === 'random'">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Кол-во вопросов
                </label>
                <input
                  v-model.number="form.questions_count"
                  type="number"
                  min="1"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
                />
              </div>

              <!-- Вопросов на странице -->
              <div :class="{ 'col-span-2': form.questions_mode !== 'random' }">
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Пагинация
                </label>
                <select
                  v-model.number="form.questions_per_page"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-8 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm appearance-none"
                >
                  <option :value="1">По 1 вопросу</option>
                  <option :value="5">По 5 вопросов</option>
                  <option :value="10">По 10 вопросов</option>
                  <option :value="0">Все сразу</option>
                </select>
              </div>
            </div>

            <!-- Чекбоксы перемешивания -->
            <div class="space-y-3 pt-1">
              <label class="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  v-model="form.shuffle_questions"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span class="text-slate-700 dark:text-slate-300 font-medium">Перемешивать вопросы</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  v-model="form.shuffle_options"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span class="text-slate-700 dark:text-slate-300 font-medium">Перемешивать ответы</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer text-sm p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <input
                  v-model="form.allow_back"
                  type="checkbox"
                  class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span class="text-slate-700 dark:text-slate-300 font-medium">Разрешить возврат назад</span>
              </label>
            </div>
          </div>

          <!-- Колонка 3: Ограничения и Защита -->
          <div class="space-y-4">
            <h4 class="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2 text-sm uppercase tracking-wider">
              Ограничения и контроль
            </h4>

            <div class="grid grid-cols-2 gap-3">
              <!-- Таймер -->
              <div>
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Время (мин)
                </label>
                <input
                  v-model.number="form.time_limit_minutes"
                  type="number"
                  min="0"
                  placeholder="∞"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
                />
              </div>

              <!-- Попытки -->
              <div>
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Попытки
                </label>
                <input
                  v-model.number="form.max_attempts"
                  type="number"
                  min="1"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
                />
              </div>

              <!-- Проходной балл -->
              <div>
                <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Порог (%)
                </label>
                <input
                  v-model.number="form.passing_score"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <!-- Результаты -->
            <div>
              <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Результаты
              </label>
              <select
                v-model="form.show_results"
                class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-8 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium text-sm appearance-none"
              >
                <option value="immediately">Сразу</option>
                <option value="after_deadline">После дедлайна</option>
                <option value="manual">Вручную</option>
                <option value="never">Скрыть</option>
              </select>
            </div>

            <!-- Антипрокторинг -->
            <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Антипрокторинг</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="form.proctoring_enabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-danger"></div>
                </label>
              </div>

              <div v-if="form.proctoring_enabled" class="space-y-2 pl-1 border-l-2 border-danger/20">
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input v-model="form.proctoring_settings.blockTabSwitch" type="checkbox" class="w-3.5 h-3.5 rounded border-slate-300 text-danger focus:ring-danger" />
                  <span class="text-slate-700 dark:text-slate-300">Блок вкладок</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input v-model="form.proctoring_settings.blockCopyPaste" type="checkbox" class="w-3.5 h-3.5 rounded border-slate-300 text-danger focus:ring-danger" />
                  <span class="text-slate-700 dark:text-slate-300">Блок копирования</span>
                </label>
              </div>
            </div>

            <!-- Активность (внизу колонки) -->
            <div class="pt-2">
              <label class="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <div class="relative inline-flex items-center">
                  <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                </div>
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ form.is_active ? 'Шаблон активен' : 'Черновик' }}</span>
              </label>
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal"> Отмена </UiButton>
          <UiButton :loading="saving" @click="saveTemplate">
            {{ editingTemplate ? 'Сохранить' : 'Создать' }}
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
import { ref, computed, onMounted } from 'vue';
import { Plus, FileText, CheckCircle, Clock, Filter, RotateCcw, Search, ChevronDown, Activity, Library, HelpCircle, Settings, Pencil, Trash2 } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
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
  search: '',
  bankId: '',
  isActive: undefined,
});

// Статистика
const stats = computed(() => ({
  active: templates.value.filter((t) => t.is_active).length,
  withTimeLimit: templates.value.filter((t) => t.time_limit_minutes > 0).length,
}));

const hasActiveFilters = computed(() => {
  return (
    filters.value.search !== '' ||
    filters.value.bankId !== '' ||
    filters.value.isActive !== undefined
  );
});

// Модальные окна
const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingTemplate = ref(null);
const deletingTemplate = ref(null);

// Языки
const availableLanguages = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

const languageLabels = {
  ru: 'Русский',
  uz: 'O\'zbek',
  en: 'English',
};

const languageFlags = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  en: '🇬🇧',
};

const languageBadgeClasses = {
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  uz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  en: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

// Валидация языков
const languageValidationLoading = ref(false);
const languageValidation = ref([]);

const hasInvalidLanguages = computed(() => {
  return languageValidation.value.some((v) => !v.isValid);
});

// Форма
const getDefaultForm = () => ({
  name: '',
  code: '',
  bank_id: '',
  description: '',
  questions_mode: 'all',
  questions_count: 20,
  time_limit_minutes: 30,
  passing_score: 60,
  max_attempts: 1,
  shuffle_questions: true,
  shuffle_options: true,
  questions_per_page: 1,
  show_results: 'immediately',
  allow_back: true,
  proctoring_enabled: false,
  proctoring_settings: {
    blockTabSwitch: true,
    blockCopyPaste: false,
    blockRightClick: false,
  },
  allowed_languages: ['ru'],
  is_active: true,
});

const form = ref(getDefaultForm());

const formErrors = ref({
  name: '',
  code: '',
  bank_id: '',
  allowed_languages: '',
});

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Утилиты
const getQuestionsLabel = (template) => {
  if (template.questions_mode === 'all') {
    return `Все (${template.questions_total || '?'})`;
  }
  return `${template.questions_count || '?'} случ.`;
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
      params.append('search', filters.value.search);
    }

    if (filters.value.bankId) {
      params.append('bank_id', filters.value.bankId);
    }

    if (filters.value.isActive !== undefined) {
      params.append('is_active', filters.value.isActive.toString());
    }

    const response = await authFetch(
      `/api/test-bank/templates?${params.toString()}`,
    );

    if (response.success) {
      templates.value = response.templates;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
    showNotification('error', 'Ошибка', 'Не удалось загрузить шаблоны');
  } finally {
    loading.value = false;
  }
};

const loadBanks = async () => {
  try {
    const response = await authFetch('/api/test-bank/banks/select');
    if (response.success) {
      banks.value = response.banks;
    }
  } catch (error) {
    console.error('Ошибка загрузки банков:', error);
  }
};

// Обработчики фильтров
const handleFilterChange = () => {
  pagination.value.page = 1;
  loadTemplates();
};

const resetFilters = () => {
  filters.value = {
    search: '',
    bankId: '',
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
  formErrors.value = { name: '', code: '', bank_id: '', allowed_languages: '' };
  languageValidation.value = [];
  modalOpen.value = true;
};

const openEditModal = (template) => {
  editingTemplate.value = template;
  form.value = {
    name: template.name,
    code: template.code,
    bank_id: template.bank_id,
    description: template.description || '',
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
    allowed_languages: template.allowed_languages || ['ru', 'uz', 'en'],
    is_active: template.is_active,
  };
  formErrors.value = { name: '', code: '', bank_id: '', allowed_languages: '' };
  languageValidation.value = [];
  modalOpen.value = true;
  // Загружаем валидацию при редактировании
  if (form.value.bank_id && form.value.questions_mode === 'random') {
    validateLanguages();
  }
};

const closeModal = () => {
  modalOpen.value = false;
  editingTemplate.value = null;
};

const router = useRouter();

const viewTemplate = (template) => {
  router.push(`/test-templates/${template.id}`);
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
    const minCount =
      form.value.questions_mode === 'random' ? form.value.questions_count : 1;
    const languages = form.value.allowed_languages.join(',');

    const response = await authFetch(
      `/api/test-bank/banks/${form.value.bank_id}/validate-languages?min_count=${minCount}&languages=${languages}`,
    );

    if (response.success) {
      languageValidation.value = response.validation;
    }
  } catch (error) {
    console.error('Ошибка валидации языков:', error);
  } finally {
    languageValidationLoading.value = false;
  }
};

const onLanguageChange = () => {
  if (form.value.bank_id && form.value.questions_mode === 'random') {
    validateLanguages();
  }
};

// Валидация
const validateForm = () => {
  formErrors.value = { name: '', code: '', bank_id: '', allowed_languages: '' };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Название обязательно';
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = 'Код обязателен';
    isValid = false;
  }

  if (!form.value.bank_id) {
    formErrors.value.bank_id = 'Выберите банк вопросов';
    isValid = false;
  }

  if (form.value.allowed_languages.length === 0) {
    formErrors.value.allowed_languages = 'Выберите хотя бы один язык';
    isValid = false;
  }

  if (form.value.questions_mode === 'random' && hasInvalidLanguages.value) {
    formErrors.value.allowed_languages = 'Недостаточно вопросов на выбранных языках';
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
          method: 'PUT',
          body: payload,
        },
      );
    } else {
      response = await authFetch('/api/test-bank/templates', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification(
        'success',
        'Успешно',
        editingTemplate.value ? 'Шаблон обновлён' : 'Шаблон создан',
      );
      closeModal();
      loadTemplates();
    } else {
      showNotification(
        'error',
        'Ошибка',
        response.message || 'Не удалось сохранить',
      );
    }
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
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
        method: 'DELETE',
      },
    );

    if (response.success) {
      showNotification('success', 'Успешно', 'Шаблон удалён');
      deleteModalOpen.value = false;
      deletingTemplate.value = null;
      loadTemplates();
    } else {
      showNotification(
        'error',
        'Ошибка',
        response.message || 'Не удалось удалить',
      );
    }
  } catch (error) {
    console.error('Ошибка удаления:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
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