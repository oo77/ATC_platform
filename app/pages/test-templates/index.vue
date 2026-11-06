<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы; главное действие «Создать шаблон» — одно, справа -->
    <UiPageHeader title="Шаблоны тестов" description="Управление шаблонами тестирования">
      <template #actions>
        <UiButton v-if="canManageTestTemplates" variant="primary" :start-icon="Plus" @click="openCreateModal">
          Создать шаблон
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики одной плоской строкой вместо крупных карточек с hover:rotate -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Всего шаблонов" :value="stats.totalTemplates" :icon="FileText" tone="primary" />
      <UiStat label="Активных (на странице)" :value="stats.activeTemplates" :icon="CheckCircle" tone="success" />
      <UiStat label="Банков" :value="stats.totalBanks" :icon="Library" tone="warning" />
      <UiStat label="Языков" :value="stats.totalLanguages" :icon="Globe" tone="info" />
    </div>

    <!-- Единый блок фильтров: поиск + быстрый статус на виду, банк и язык — в панели «Фильтры»; «Сбросить всё» доступно из чипов -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по названию, коду шаблона…"
      :segments="statusSegments"
      :segment="statusSegment"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="test-templates"
      @search="handleFilterChange"
      @update:segment="setStatusSegment"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #filters>
        <!-- Банк вопросов -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Банк вопросов</span>
          <select
            v-model="filters.bank_id"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option value="">Все банки</option>
            <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
          </select>
        </label>
        <!-- Язык -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Язык</span>
          <select
            v-model="filters.language"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option value="">Все языки</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="uz">🇺🇿 Узбекский</option>
            <option value="en">🇬🇧 Английский</option>
          </select>
        </label>
      </template>
    </UiFilterBar>

    <!-- Карточка таблицы: пагинация — футер внутри -->
    <div id="templates-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-sm text-gray-500">Загрузка шаблонов...</p>
      </div>

      <!-- Пусто: следующий шаг — создать шаблон или сбросить фильтры -->
      <UiEmptyState
        v-else-if="templates.length === 0"
        :icon="FileText"
        title="Шаблоны тестов не найдены"
        :description="hasActiveFilters ? 'Измените условия поиска или сбросьте фильтры' : 'Создайте первый шаблон теста'"
      >
        <template #actions>
          <UiButton v-if="hasActiveFilters" variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
          <UiButton v-else-if="canManageTestTemplates" variant="primary" size="sm" :start-icon="Plus" @click="openCreateModal">Создать шаблон</UiButton>
        </template>
      </UiEmptyState>

      <!-- Таблица: sticky-шапка, кликабельные строки -->
      <div v-else class="max-h-[70vh] overflow-auto">
        <table class="w-full border-collapse text-left">
          <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Шаблон</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Код</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Банк</th>
              <th class="whitespace-nowrap px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Проходной балл</th>
              <th class="whitespace-nowrap px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Языки</th>
              <th class="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Статус</th>
              <th class="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="template in templates"
              :key="template.id"
              class="group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              @click="viewTemplate(template)"
            >
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-500/15">
                    <FileText class="h-5 w-5" />
                  </div>
                  <div class="min-w-0">
                    <h5 class="text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                      {{ template.name }}
                    </h5>
                    <p v-if="template.description" class="line-clamp-1 max-w-xs text-xs text-gray-500">
                      {{ template.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 align-middle">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700 dark:bg-white/[0.06] dark:text-gray-300">
                  {{ template.code }}
                </span>
              </td>
              <td class="px-4 py-3 align-middle">
                <UiBadge v-if="template.bank_name" color="info" size="sm">{{ template.bank_name }}</UiBadge>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="px-4 py-3 text-center align-middle">
                <span class="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{{ template.passing_score }}%</span>
              </td>
              <td class="px-4 py-3 align-middle">
                <div class="flex items-center justify-center gap-1">
                  <span
                    v-for="lang in (template.allowed_languages || ['ru'])"
                    :key="lang"
                    class="inline-flex h-7 w-7 items-center justify-center rounded-full text-sm"
                    :class="languageBadgeClasses[lang]"
                    :title="languageLabels[lang]"
                  >
                    {{ languageFlags[lang] }}
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 align-middle">
                <UiBadge :color="template.is_active ? 'success' : 'light'" size="sm">{{ template.is_active ? 'Активен' : 'Неактивен' }}</UiBadge>
              </td>
              <!-- Действия: 1 иконка «Просмотр» + «⋯» (редактировать / удалить); видны всегда -->
              <td class="px-4 py-3 text-right align-middle" @click.stop>
                <div class="flex items-center justify-end gap-1">
                  <UiButton variant="ghost" size="sm" icon title="Просмотр" aria-label="Просмотр" @click="viewTemplate(template)">
                    <Eye class="h-4 w-4" />
                  </UiButton>
                  <UiDropdown
                    v-if="canManageTestTemplates"
                    icon-only
                    variant="ghost"
                    size="sm"
                    aria-label="Действия с шаблоном"
                    :groups="templateMenuGroups"
                    @select="(key) => onTemplateAction(key, template)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Единая пагинация; размер страницы у страницы фиксирован — выбор скрыт -->
      <UiPagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        hide-limit
        scroll-target="#templates-table"
        @update:page="changePage"
      />
    </div>

    <!-- Модалка создания/редактирования шаблона -->
    <UiModal
      :is-open="modalOpen"
      :title="editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'"
      size="2xl"
      @close="closeModal"
    >
      <form @submit.prevent="saveTemplate" class="space-y-6">
        <!-- Basic Info -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-white/[0.03] p-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <FileText class="w-4 h-4" />
            Основная информация
          </h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Название <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Например: Тест по охране труда"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                :class="{ 'border-danger ring-2 ring-danger/10': formErrors.name }"
              />
              <p v-if="formErrors.name" class="mt-1 text-xs text-danger font-medium">{{ formErrors.name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Код <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.code"
                type="text"
                placeholder="Например: OT-TEST-001"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm uppercase"
                :class="{ 'border-danger ring-2 ring-danger/10': formErrors.code }"
              />
              <p v-if="formErrors.code" class="mt-1 text-xs text-danger font-medium">{{ formErrors.code }}</p>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Банк вопросов <span class="text-danger">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="form.bank_id"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-gray-100 h-9 pl-3 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm appearance-none"
                  :class="{ 'border-danger ring-2 ring-danger/10': formErrors.bank_id }"
                >
                  <option value="">Выберите банк вопросов</option>
                  <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }} ({{ bank.code }})</option>
                </select>
                <Library class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <p v-if="formErrors.bank_id" class="mt-1 text-xs text-danger font-medium">{{ formErrors.bank_id }}</p>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Описание
              </label>
              <textarea
                v-model="form.description"
                rows="2"
                placeholder="Краткое описание шаблона теста..."
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 py-2 px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Test Settings -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-white/[0.03] p-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Settings class="w-4 h-4" />
            Настройки теста
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Режим вопросов
              </label>
              <div class="relative">
                <select
                  v-model="form.questions_mode"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-gray-100 h-9 pl-3 pr-10 outline-none focus:border-primary transition-all text-sm appearance-none"
                >
                  <option value="all">Все вопросы</option>
                  <option value="random">Случайные</option>
                  <option value="manual">Вручную</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div v-if="form.questions_mode !== 'all'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Количество
              </label>
              <input
                v-model.number="form.questions_count"
                type="number"
                min="1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary transition-all text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Время (мин)
              </label>
              <input
                v-model.number="form.time_limit_minutes"
                type="number"
                min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary transition-all text-sm"
              />
              <p class="mt-1 text-xs text-gray-400">0 = без лимита</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Проходной балл
              </label>
              <div class="relative">
                <input
                  v-model.number="form.passing_score"
                  type="number"
                  min="1"
                  max="100"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 pl-3 pr-8 outline-none focus:border-primary transition-all text-sm"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Макс попыток
              </label>
              <input
                v-model.number="form.max_attempts"
                type="number"
                min="1"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary transition-all text-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Вопросов на стр.
              </label>
              <input
                v-model.number="form.questions_per_page"
                type="number"
                min="0"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:text-gray-100 h-9 px-3 outline-none focus:border-primary transition-all text-sm"
              />
              <p class="mt-1 text-xs text-gray-400">0 = все сразу</p>
            </div>
          </div>
        </div>

        <!-- Display & Behavior Settings -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-white/[0.03] p-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Eye class="w-4 h-4" />
            Отображение и поведение
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Показ результатов
              </label>
              <div class="relative">
                <select
                  v-model="form.show_results"
                  class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-gray-100 h-9 pl-3 pr-10 outline-none focus:border-primary transition-all text-sm appearance-none"
                >
                  <option value="immediately">Сразу</option>
                  <option value="after_deadline">После дедлайна</option>
                  <option value="manual">Вручную</option>
                  <option value="never">Никогда</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Возврат к вопросам
              </label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.allow_back" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {{ form.allow_back ? 'Разрешён' : 'Запрещён' }}
                </span>
              </label>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Активен
              </label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {{ form.is_active ? 'Да' : 'Нет' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Shuffle Settings -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-white/[0.03] p-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Shuffle class="w-4 h-4" />
            Перемешивание
          </h4>
          <div class="flex flex-wrap gap-6">
            <div class="flex items-center gap-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.shuffle_questions" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Перемешивать вопросы</span>
            </div>
            <div class="flex items-center gap-3">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.shuffle_options" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Перемешивать варианты</span>
            </div>
          </div>
        </div>

        <!-- Languages -->
        <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-white/[0.03] p-4">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Globe class="w-4 h-4" />
            Языки тестирования
          </h4>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="lang in availableLanguages"
              :key="lang.value"
              type="button"
              @click="toggleLanguage(lang.value)"
              :class="[
                'flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-all border',
                form.allowed_languages?.includes(lang.value)
                  ? 'bg-primary/10 border-primary text-primary dark:bg-primary/20'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-500 hover:border-primary/50'
              ]"
            >
              <span class="text-lg">{{ lang.flag }}</span>
              {{ lang.label }}
            </button>
          </div>
          <p class="mt-2 text-xs text-gray-400">Выберите языки, доступные для прохождения теста. Если не выбрано - все языки.</p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveTemplate">
            {{ editingTemplate ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Подтверждение удаления (прежний обработчик deleteTemplate) -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить шаблон?"
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
import { Plus, FileText, Library, CheckCircle, Globe, Filter, RotateCcw, Search, ChevronDown, Activity, Eye, Pencil, Trash2, Settings, Shuffle } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();
const { canManageTestTemplates } = usePermissions();
const router = useRouter();

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
  bank_id: '',
  isActive: undefined,
  language: '',
});

const stats = computed(() => {
  const languages = new Set();
  templates.value.forEach(t => {
    (t.allowed_languages || ['ru']).forEach(l => languages.add(l));
  });
  return {
    totalTemplates: pagination.value.total,
    activeTemplates: templates.value.filter(t => t.is_active).length,
    totalBanks: banks.value.length,
    totalLanguages: languages.size,
  };
});

const hasActiveFilters = computed(() => {
  return filters.value.search !== '' ||
    filters.value.bank_id !== '' ||
    filters.value.isActive !== undefined ||
    filters.value.language !== '';
});

// Быстрый сегмент статуса для UiFilterBar поверх прежнего трёхпозиционного filters.isActive
const statusSegments = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'inactive', label: 'Неактивные' },
];
const statusSegment = computed(() => (filters.value.isActive === undefined ? 'all' : filters.value.isActive ? 'active' : 'inactive'));
const setStatusSegment = (v) => {
  filters.value.isActive = v === 'all' ? undefined : v === 'active';
  handleFilterChange();
};

// Чипы применённых фильтров: видно, что отфильтровано, и можно снять по одному
const filterChips = computed(() => {
  const chips = [];
  if (filters.value.bank_id) {
    const b = banks.value.find(x => x.id === filters.value.bank_id);
    chips.push({ key: 'bank', label: `Банк: ${b ? b.name : filters.value.bank_id}` });
  }
  if (filters.value.language) chips.push({ key: 'language', label: `Язык: ${languageLabels[filters.value.language] || filters.value.language}` });
  if (filters.value.isActive !== undefined) chips.push({ key: 'status', label: filters.value.isActive ? 'Только активные' : 'Только неактивные' });
  return chips;
});
const removeFilterChip = (key) => {
  if (key === 'bank') filters.value.bank_id = '';
  if (key === 'language') filters.value.language = '';
  if (key === 'status') filters.value.isActive = undefined;
  handleFilterChange();
};

// Меню «⋯» строки таблицы: удаление — последним и красным
const templateMenuGroups = [
  { items: [{ key: 'edit', label: 'Редактировать', icon: Pencil }] },
  { items: [{ key: 'delete', label: 'Удалить', icon: Trash2, danger: true }] },
];
// Диспетчер меню вызывает прежние обработчики openEditModal / confirmDelete
const onTemplateAction = (key, template) => {
  if (key === 'edit') openEditModal(template);
  else if (key === 'delete') confirmDelete(template);
};

const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingTemplate = ref(null);
const deletingTemplate = ref(null);

const availableLanguages = [
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

const form = ref({
  name: '',
  code: '',
  bank_id: '',
  description: '',
  time_limit_minutes: 0,
  passing_score: 70,
  max_attempts: 3,
  is_active: true,
  questions_mode: 'all',
  questions_count: 10,
  questions_per_page: 0,
  shuffle_questions: false,
  shuffle_options: false,
  show_results: 'immediately',
  allow_back: true,
  allowed_languages: [],
});

const formErrors = ref({
  name: '',
  code: '',
  bank_id: '',
});

const toggleLanguage = (lang) => {
  if (!form.value.allowed_languages) form.value.allowed_languages = [];
  const idx = form.value.allowed_languages.indexOf(lang);
  if (idx === -1) {
    form.value.allowed_languages.push(lang);
  } else {
    form.value.allowed_languages.splice(idx, 1);
  }
};

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

const languageLabels = { ru: 'Русский', uz: "O'zbek", en: 'English' };
const languageFlags = { ru: '🇷🇺', uz: '🇺🇿', en: '🇬🇧' };
const languageBadgeClasses = {
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  uz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  en: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const loadTemplates = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.bank_id) params.append('bank_id', filters.value.bank_id);
    if (filters.value.isActive !== undefined) params.append('is_active', filters.value.isActive.toString());
    if (filters.value.language) params.append('language', filters.value.language);

    const response = await authFetch(`/api/test-bank/templates?${params.toString()}`);

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
    const response = await authFetch('/api/test-bank/banks?limit=100');
    if (response.success) {
      banks.value = response.banks;
    }
  } catch (error) {
    console.error('Ошибка загрузки банков:', error);
  }
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  loadTemplates();
};

const resetFilters = () => {
  filters.value = { search: '', bank_id: '', isActive: undefined, language: '' };
  pagination.value.page = 1;
  loadTemplates();
};

const changePage = (page) => {
  pagination.value.page = page;
  loadTemplates();
};

const viewTemplate = (template) => {
  navigateTo(`/test-templates/${template.id}`);
};

const openCreateModal = () => {
  editingTemplate.value = null;
  form.value = {
    name: '',
    code: '',
    bank_id: '',
    description: '',
    time_limit_minutes: 0,
    passing_score: 70,
    max_attempts: 3,
    is_active: true,
    questions_mode: 'all',
    questions_count: 10,
    questions_per_page: 0,
    shuffle_questions: false,
    shuffle_options: false,
    show_results: 'immediately',
    allow_back: true,
    allowed_languages: [],
  };
  formErrors.value = { name: '', code: '', bank_id: '' };
  modalOpen.value = true;
};

const openEditModal = (template) => {
  editingTemplate.value = template;
  form.value = {
    name: template.name,
    code: template.code,
    bank_id: template.bank_id || '',
    description: template.description || '',
    time_limit_minutes: template.time_limit_minutes || 0,
    passing_score: template.passing_score || 70,
    max_attempts: template.max_attempts || 3,
    is_active: template.is_active,
    questions_mode: template.questions_mode || 'all',
    questions_count: template.questions_count || 10,
    questions_per_page: template.questions_per_page || 0,
    shuffle_questions: template.shuffle_questions || false,
    shuffle_options: template.shuffle_options || false,
    show_results: template.show_results || 'immediately',
    allow_back: template.allow_back !== false,
    allowed_languages: template.allowed_languages || [],
  };
  formErrors.value = { name: '', code: '', bank_id: '' };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingTemplate.value = null;
};

const confirmDelete = (template) => {
  deletingTemplate.value = template;
  deleteModalOpen.value = true;
};

const validateForm = () => {
  formErrors.value = { name: '', code: '', bank_id: '' };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Название обязательно';
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = 'Код обязателен';
    isValid = false;
  } else if (!/^[A-Z0-9-]+$/i.test(form.value.code)) {
    formErrors.value.code = 'Только латинские буквы, цифры и дефис';
    isValid = false;
  }

  if (!form.value.bank_id) {
    formErrors.value.bank_id = 'Выберите банк вопросов';
    isValid = false;
  }

  return isValid;
};

const saveTemplate = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim().toUpperCase(),
      bank_id: form.value.bank_id,
      description: form.value.description.trim() || undefined,
      time_limit_minutes: form.value.time_limit_minutes || 0,
      passing_score: form.value.passing_score || 70,
      max_attempts: form.value.max_attempts || 3,
      is_active: form.value.is_active,
      questions_mode: form.value.questions_mode || 'all',
      questions_count: form.value.questions_count || 10,
      questions_per_page: form.value.questions_per_page || 0,
      shuffle_questions: form.value.shuffle_questions || false,
      shuffle_options: form.value.shuffle_options || false,
      show_results: form.value.show_results || 'immediately',
      allow_back: form.value.allow_back !== false,
      allowed_languages: form.value.allowed_languages?.length > 0 ? form.value.allowed_languages : undefined,
    };

    let response;
    if (editingTemplate.value) {
      response = await authFetch(`/api/test-bank/templates/${editingTemplate.value.id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await authFetch('/api/test-bank/templates', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification('success', 'Успешно', editingTemplate.value ? 'Шаблон обновлён' : 'Шаблон создан');
      closeModal();
      loadTemplates();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить шаблон');
    }
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

const deleteTemplate = async () => {
  if (!deletingTemplate.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(`/api/test-bank/templates/${deletingTemplate.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('success', 'Успешно', 'Шаблон удалён');
      deleteModalOpen.value = false;
      deletingTemplate.value = null;
      loadTemplates();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось удалить шаблон');
    }
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => {
  loadTemplates();
  loadBanks();
});
</script>