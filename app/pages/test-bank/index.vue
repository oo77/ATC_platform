<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-title-md2 font-bold text-black dark:text-white">
          Банк тестов
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Управление банками вопросов и шаблонами тестов
        </p>
      </div>
      <div class="flex gap-3">
        <UiButton 
          v-if="canManageTestBanks"
          variant="outline"
          @click="navigateTo('/test-bank/templates')"
          class="flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Шаблоны тестов
        </UiButton>
        <UiButton 
          v-if="canManageTestBanks"
          @click="openCreateModal"
          class="flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Создать банк вопросов
        </UiButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего банков</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalBanks }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <svg class="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Активных банков</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.activeBanks }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <svg class="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Всего вопросов</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalQuestions }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
            <svg class="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Категорий</h3>
            <p class="text-2xl font-bold text-black dark:text-white">{{ stats.totalCategories }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6 mb-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="text-lg font-semibold text-black dark:text-white">Фильтры</h4>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="ml-auto text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Поиск -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Название, код банка..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
              @input="handleFilterChange"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Категория -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Категория
          </label>
          <div class="relative">
            <select
              v-model="filters.category"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
            >
              <option value="">Все категории</option>
              <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
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
              v-model="filters.isActive"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-4 pr-10 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary appearance-none"
              @change="handleFilterChange"
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

    <!-- Список банков -->
    <div class="rounded-lg bg-white dark:bg-boxdark shadow-md overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка банков вопросов...</p>
      </div>

      <div v-else-if="banks.length === 0" class="p-12 text-center text-gray-500 dark:text-gray-400">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p class="mt-4 text-lg font-medium">Банки вопросов не найдены</p>
        <template v-if="canManageTestBanks">
          <p class="mt-2">Создайте первый банк вопросов для хранения вопросов тестов</p>
          <UiButton 
            @click="openCreateModal"
            class="mt-4 inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Создать банк вопросов
          </UiButton>
        </template>
        <p v-else class="mt-2">Банки вопросов пока не созданы</p>
      </div>

      <div v-else>
        <!-- Табличное отображение на десктопе -->
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Банк вопросов
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Код
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Категория
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Вопросов
                </th>
                <th class="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Шаблонов
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Статус
                </th>
                <th class="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="bank in banks"
                :key="bank.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">{{ bank.name }}</div>
                      <div v-if="bank.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {{ bank.description }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                    {{ bank.code }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-white">
                  {{ bank.category || '—' }}
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {{ bank.questions_count || 0 }}
                  </span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
                    {{ bank.templates_count || 0 }}
                  </span>
                </td>
                <td class="px-6 py-4">
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
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="viewBank(bank)"
                      class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Просмотр вопросов"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="openEditModal(bank)"
                      class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      v-if="canManageTestBanks"
                      @click="confirmDelete(bank)"
                      class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
            v-for="bank in banks"
            :key="bank.id"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div class="font-medium text-gray-900 dark:text-white">{{ bank.name }}</div>
                  <span class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200">
                    {{ bank.code }}
                  </span>
                </div>
              </div>
              <span
                :class="[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  bank.is_active
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                ]"
              >
                {{ bank.is_active ? 'Активен' : 'Неактивен' }}
              </span>
            </div>

            <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ bank.questions_count || 0 }} вопросов
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ bank.templates_count || 0 }} шаблонов
              </span>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                @click="viewBank(bank)"
                class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                v-if="canManageTestBanks"
                @click="openEditModal(bank)"
                class="p-2 text-gray-500 hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                v-if="canManageTestBanks"
                @click="confirmDelete(bank)"
                class="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="pagination.totalPages > 1" class="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Показано <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
            -
            <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            из
            <span class="font-medium">{{ pagination.total }}</span>
            банков
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования банка -->
    <UiModal
      :is-open="modalOpen"
      :title="editingBank ? 'Редактировать банк вопросов' : 'Создать банк вопросов'"
      size="md"
      @close="closeModal"
    >
      <form @submit.prevent="saveBank" class="space-y-4">
        <!-- Название -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Название <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Например: Охрана труда - Базовый уровень"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            :class="{ 'border-danger': formErrors.name }"
          />
          <p v-if="formErrors.name" class="mt-1 text-sm text-danger">{{ formErrors.name }}</p>
        </div>

        <!-- Код -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Код <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.code"
            type="text"
            placeholder="Например: OT-BASE"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary uppercase"
            :class="{ 'border-danger': formErrors.code }"
          />
          <p v-if="formErrors.code" class="mt-1 text-sm text-danger">{{ formErrors.code }}</p>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Уникальный код для идентификации банка</p>
        </div>

        <!-- Категория -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Категория
          </label>
          <div class="relative">
            <input
              v-model="form.category"
              type="text"
              placeholder="Например: Охрана труда"
              list="categories-list"
              class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
            />
            <datalist id="categories-list">
              <option v-for="cat in categories" :key="cat" :value="cat" />
            </datalist>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Для группировки банков вопросов</p>
        </div>

        <!-- Описание -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Краткое описание банка вопросов..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary resize-none"
          ></textarea>
        </div>

        <!-- Активность -->
        <div class="flex items-center gap-3">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Банк активен
          </span>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveBank">
            {{ editingBank ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить банк вопросов?"
      :message="`Вы уверены, что хотите удалить банк '${deletingBank?.name}'? ${deletingBank?.questions_count ? `В банке ${deletingBank.questions_count} вопросов, которые также будут удалены.` : ''} Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deleting"
      @confirm="deleteBank"
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

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

// Состояние
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const banks = ref([]);
const categories = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  search: '',
  category: '',
  isActive: undefined,
});

// Статистика
const stats = computed(() => {
  return {
    totalBanks: pagination.value.total,
    activeBanks: banks.value.filter(b => b.is_active).length,
    totalQuestions: banks.value.reduce((sum, b) => sum + (b.questions_count || 0), 0),
    totalCategories: categories.value.length,
  };
});

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' || filters.value.category !== '' || filters.value.isActive !== undefined;
});

// Модальные окна
const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingBank = ref(null);
const deletingBank = ref(null);

// Форма
const form = ref({
  name: '',
  code: '',
  category: '',
  description: '',
  is_active: true,
});

const formErrors = ref({
  name: '',
  code: '',
});

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Загрузка банков
const loadBanks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) {
      params.append('search', filters.value.search);
    }

    if (filters.value.category) {
      params.append('category', filters.value.category);
    }

    if (filters.value.isActive !== undefined) {
      params.append('is_active', filters.value.isActive.toString());
    }

    const response = await authFetch(`/api/test-bank/banks?${params.toString()}`);
    
    if (response.success) {
      banks.value = response.banks;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error('Ошибка загрузки банков:', error);
    showNotification('error', 'Ошибка', 'Не удалось загрузить банки вопросов');
  } finally {
    loading.value = false;
  }
};

// Загрузка категорий
const loadCategories = async () => {
  try {
    const response = await authFetch('/api/test-bank/banks/categories');
    if (response.success) {
      categories.value = response.categories;
    }
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
  }
};

// Обработчики
const handleFilterChange = () => {
  pagination.value.page = 1;
  loadBanks();
};

const resetFilters = () => {
  filters.value.search = '';
  filters.value.category = '';
  filters.value.isActive = undefined;
  pagination.value.page = 1;
  loadBanks();
};

const changePage = (page) => {
  pagination.value.page = page;
  loadBanks();
};

const viewBank = (bank) => {
  navigateTo(`/test-bank/${bank.id}`);
};

// Модальные окна
const openCreateModal = () => {
  editingBank.value = null;
  form.value = {
    name: '',
    code: '',
    category: '',
    description: '',
    is_active: true,
  };
  formErrors.value = { name: '', code: '' };
  modalOpen.value = true;
};

const openEditModal = (bank) => {
  editingBank.value = bank;
  form.value = {
    name: bank.name,
    code: bank.code,
    category: bank.category || '',
    description: bank.description || '',
    is_active: bank.is_active,
  };
  formErrors.value = { name: '', code: '' };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingBank.value = null;
};

const confirmDelete = (bank) => {
  deletingBank.value = bank;
  deleteModalOpen.value = true;
};

// Валидация формы
const validateForm = () => {
  formErrors.value = { name: '', code: '' };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Название обязательно';
    isValid = false;
  } else if (form.value.name.length < 3) {
    formErrors.value.name = 'Минимум 3 символа';
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = 'Код обязателен';
    isValid = false;
  } else if (!/^[A-Z0-9-]+$/i.test(form.value.code)) {
    formErrors.value.code = 'Только латинские буквы, цифры и дефис';
    isValid = false;
  }

  return isValid;
};

// Сохранение банка
const saveBank = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim().toUpperCase(),
      category: form.value.category.trim() || undefined,
      description: form.value.description.trim() || undefined,
      is_active: form.value.is_active,
    };

    let response;
    if (editingBank.value) {
      response = await authFetch(`/api/test-bank/banks/${editingBank.value.id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await authFetch('/api/test-bank/banks', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification('success', 'Успешно', editingBank.value ? 'Банк вопросов обновлён' : 'Банк вопросов создан');
      closeModal();
      loadBanks();
      loadCategories();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить банк');
    }
  } catch (error) {
    console.error('Ошибка сохранения банка:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

// Удаление банка
const deleteBank = async () => {
  if (!deletingBank.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(`/api/test-bank/banks/${deletingBank.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('success', 'Успешно', 'Банк вопросов удалён');
      deleteModalOpen.value = false;
      deletingBank.value = null;
      loadBanks();
      loadCategories();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось удалить банк');
    }
  } catch (error) {
    console.error('Ошибка удаления банка:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
  } finally {
    deleting.value = false;
  }
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
  loadBanks();
  loadCategories();
});
</script>
