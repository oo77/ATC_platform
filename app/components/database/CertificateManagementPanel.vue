<template>
  <div class="flex flex-col gap-6">
    <!-- Заголовок и статистика -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-xl font-semibold text-black dark:text-white">
          База сертификатов
        </h3>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Всего сертификатов: {{ stats.total }}
          <span v-if="hasActiveFilters" class="text-primary">
            (отфильтровано: {{ pagination.total }})
          </span>
        </p>
      </div>

      <!-- Кнопки действий -->
      <div class="flex flex-wrap items-center gap-3">
        <UiButton
          variant="primary"
          size="sm"
          @click="openManualFormModal"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Добавить вручную
        </UiButton>
        <NuxtLink
          to="/database/import-certificates"
          class="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Импорт из Excel
        </NuxtLink>
        <UiButton
          variant="secondary"
          size="sm"
          @click="exportToExcel"
          :disabled="loading || !data.length"
        >
          <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт
        </UiButton>
      </div>
    </div>

    <!-- Статистические карточки -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Выдано</p>
            <p class="text-2xl font-bold text-success">{{ stats.issued }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-danger/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Отозвано</p>
            <p class="text-2xl font-bold text-danger">{{ stats.revoked }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Организаций</p>
            <p class="text-2xl font-bold text-warning">{{ stats.organizations }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-boxdark rounded-lg p-4 shadow-sm border border-stroke dark:border-strokedark">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
            <svg class="h-5 w-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Групп</p>
            <p class="text-2xl font-bold text-info">{{ stats.groups }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Панель фильтрации -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <h4 class="font-semibold text-black dark:text-white">Фильтры</h4>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="ml-auto text-sm text-primary hover:underline flex items-center gap-1"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Сбросить фильтры
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Поиск -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Поиск
          </label>
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="ФИО, номер сертификата, ПИНФЛ..."
              class="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              @input="debouncedSearch"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Статус -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Статус
          </label>
          <select
            v-model="filters.status"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            @change="handleFilterChange"
          >
            <option value="all">Все статусы</option>
            <option value="issued">Выданные</option>
            <option value="revoked">Отозванные</option>
          </select>
        </div>

        <!-- Источник -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Источник
          </label>
          <select
            v-model="filters.sourceType"
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            @change="handleFilterChange"
          >
            <option value="all">Все источники</option>
            <option value="group_journal">📋 Журнал группы</option>
            <option value="import">📥 Импорт</option>
            <option value="manual">✍️ Ручной ввод</option>
          </select>
        </div>

        <!-- Организация -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Организация
          </label>
          <input
            v-model="filters.organizationName"
            type="text"
            placeholder="Название организации..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
            @input="debouncedSearch"
          />
        </div>

        <!-- Дата выдачи -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Период выдачи
          </label>
          <div class="flex gap-2">
            <input
              v-model="filters.dateFrom"
              type="date"
              class="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              @change="handleFilterChange"
            />
            <input
              v-model="filters.dateTo"
              type="date"
              class="flex-1 rounded-lg border border-stroke bg-transparent py-2 px-3 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица сертификатов -->
    <div class="bg-white dark:bg-boxdark rounded-xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-meta-4">
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors" @click="toggleSort('certificate_number')">
                <div class="flex items-center gap-1">
                  № Сертификата
                  <SortIcon :active="filters.sortBy === 'certificate_number'" :order="filters.sortOrder" />
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors" @click="toggleSort('student_name')">
                <div class="flex items-center gap-1">
                  Слушатель
                  <SortIcon :active="filters.sortBy === 'student_name'" :order="filters.sortOrder" />
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors" @click="toggleSort('course_name')">
                <div class="flex items-center gap-1">
                  Курс / Группа
                  <SortIcon :active="filters.sortBy === 'course_name'" :order="filters.sortOrder" />
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors" @click="toggleSort('issue_date')">
                <div class="flex items-center gap-1">
                  Дата выдачи
                  <SortIcon :active="filters.sortBy === 'issue_date'" :order="filters.sortOrder" />
                </div>
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Статус
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div class="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                  <p class="text-gray-500 dark:text-gray-400">Загрузка сертификатов...</p>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-else-if="!data.length">
              <td colspan="6" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-gray-500 dark:text-gray-400">
                    {{ hasActiveFilters ? 'По заданным фильтрам сертификаты не найдены' : 'Сертификаты пока не выданы' }}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Data -->
            <tr
              v-else
              v-for="cert in data"
              :key="cert.id"
              class="hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
            >
              <!-- Номер сертификата -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-semibold text-primary">
                    {{ cert.certificateNumber }}
                  </span>
                  <span
                    v-if="cert.hasWarnings"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning"
                    title="Выдан с предупреждениями"
                  >
                    ⚠️
                  </span>
                </div>
              </td>

              <!-- Слушатель -->
              <td class="px-4 py-4">
                <div>
                  <p class="font-medium text-black dark:text-white">{{ cert.student.fullName }}</p>
                  <p v-if="cert.student.organization" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ cert.student.organization }}
                  </p>
                  <p v-if="cert.student.pinfl" class="text-xs text-gray-400 font-mono">
                    ПИНФЛ: {{ cert.student.pinfl }}
                  </p>
                </div>
              </td>

              <!-- Курс / Группа -->
              <td class="px-4 py-4">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-medium text-black dark:text-white">{{ cert.course.name }}</p>
                    <!-- Бейдж источника -->
                    <span
                      v-if="cert.sourceType === 'import'"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-info/20 text-info"
                      title="Импортирован из Excel"
                    >
                      📥 Импорт
                    </span>
                    <span
                      v-else-if="cert.sourceType === 'manual'"
                      class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400"
                      title="Добавлен вручную"
                    >
                      ✍️ Ручной
                    </span>
                  </div>
                  <p v-if="cert.group.code" class="text-sm text-gray-500 dark:text-gray-400">
                    Группа: {{ cert.group.code }}
                  </p>
                  <p v-else-if="cert.sourceType !== 'group_journal'" class="text-xs text-gray-400 italic">
                    Без группы
                  </p>
                </div>
              </td>

              <!-- Дата выдачи -->
              <td class="px-4 py-4">
                <div class="text-sm">
                  <p class="text-black dark:text-white">{{ formatDate(cert.issueDate) }}</p>
                  <p v-if="cert.issuedBy" class="text-gray-500 dark:text-gray-400">
                    {{ cert.issuedBy.name }}
                  </p>
                </div>
              </td>

              <!-- Статус -->
              <td class="px-4 py-4 text-center">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    cert.status === 'issued'
                      ? 'bg-success/20 text-success'
                      : 'bg-danger/20 text-danger'
                  ]"
                >
                  <span class="mr-1">{{ cert.status === 'issued' ? '✓' : '✕' }}</span>
                  {{ cert.status === 'issued' ? 'Выдан' : 'Отозван' }}
                </span>
                <p
                  v-if="cert.status === 'revoked' && cert.revokeReason"
                  class="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-32 truncate"
                  :title="cert.revokeReason"
                >
                  {{ cert.revokeReason }}
                </p>
              </td>

              <!-- Действия -->
              <td class="px-4 py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                  <!-- Скачать PDF -->
                  <a
                    v-if="cert.pdfFileUrl"
                    :href="cert.pdfFileUrl"
                    target="_blank"
                    class="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    title="Скачать PDF"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>

                  <!-- Подробнее -->
                  <button
                    @click="openDetailModal(cert)"
                    class="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    title="Подробнее"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                  <!-- Отозвать (если выдан) -->
                  <button
                    v-if="cert.status === 'issued'"
                    @click="openRevokeModal(cert)"
                    class="p-2 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                    title="Отозвать сертификат"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-stroke dark:border-strokedark">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Показано {{ (pagination.page - 1) * pagination.limit + 1 }} - {{ Math.min(pagination.page * pagination.limit, pagination.total) }} из {{ pagination.total }}
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="pagination.page <= 1"
            @click="goToPage(pagination.page - 1)"
            class="px-3 py-1 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ←
          </button>
          <span class="px-3 py-1 text-sm">
            {{ pagination.page }} / {{ pagination.totalPages }}
          </span>
          <button
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
            class="px-3 py-1 rounded border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно деталей -->
    <DatabaseCertificateDetailModal
      v-if="selectedCertificate"
      :certificate="selectedCertificate"
      :is-open="isDetailModalOpen"
      @close="closeDetailModal"
    />

    <!-- Модальное окно отзыва -->
    <UiModal
      :is-open="isRevokeModalOpen"
      @close="closeRevokeModal"
      title="Отзыв сертификата"
      size="md"
    >
      <div class="space-y-4">
        <div class="p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <p class="text-danger font-medium">⚠️ Внимание!</p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Вы собираетесь отозвать сертификат <span class="font-mono font-semibold">{{ revokeTarget?.certificateNumber }}</span> слушателя <span class="font-semibold">{{ revokeTarget?.student.fullName }}</span>.
            Это действие будет записано в журнал.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Причина отзыва <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="revokeReason"
            rows="3"
            placeholder="Укажите причину отзыва сертификата..."
            class="w-full rounded-lg border border-stroke bg-transparent py-2 px-4 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white resize-none"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3">
          <UiButton variant="secondary" @click="closeRevokeModal">
            Отмена
          </UiButton>
          <UiButton
            variant="danger"
            @click="confirmRevoke"
            :disabled="!revokeReason.trim() || isRevoking"
            :loading="isRevoking"
          >
            Отозвать сертификат
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно ручного добавления сертификата -->
    <DatabaseCertificateManualFormModal
      :is-open="isManualFormModalOpen"
      @close="closeManualFormModal"
      @created="handleCertificateCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

const { authFetch } = useAuthFetch();
const notification = useNotification();

// Иконка сортировки
const SortIcon = defineComponent({
  props: {
    active: Boolean,
    order: String,
  },
  setup(props) {
    return () => h('svg', {
      class: ['h-4 w-4 transition-colors', props.active ? 'text-primary' : 'text-gray-400'],
      fill: 'none',
      stroke: 'currentColor',
      viewBox: '0 0 24 24',
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: props.active && props.order === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7',
      }),
    ]);
  },
});

// Данные
const data = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});
const stats = ref({
  total: 0,
  issued: 0,
  revoked: 0,
  organizations: 0,
  groups: 0,
});

// Фильтры
const filters = ref({
  search: '',
  status: 'all',
  sourceType: 'all',
  organizationName: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'issue_date',
  sortOrder: 'desc' as 'asc' | 'desc',
});

// Модальные окна
const selectedCertificate = ref<any>(null);
const isDetailModalOpen = ref(false);
const isRevokeModalOpen = ref(false);
const revokeTarget = ref<any>(null);
const revokeReason = ref('');
const isManualFormModalOpen = ref(false);
const isRevoking = ref(false);

// Computed
const hasActiveFilters = computed(() => {
  return !!(
    filters.value.search ||
    filters.value.status !== 'all' ||
    filters.value.sourceType !== 'all' ||
    filters.value.organizationName ||
    filters.value.dateFrom ||
    filters.value.dateTo
  );
});

// Методы
async function loadData() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      sortBy: filters.value.sortBy,
      sortOrder: filters.value.sortOrder,
    });

    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.status !== 'all') params.append('status', filters.value.status);
    if (filters.value.sourceType !== 'all') params.append('sourceType', filters.value.sourceType);
    if (filters.value.organizationName) params.append('organizationName', filters.value.organizationName);
    if (filters.value.dateFrom) params.append('dateFrom', filters.value.dateFrom);
    if (filters.value.dateTo) params.append('dateTo', filters.value.dateTo);

    const response = await authFetch(`/api/certificates?${params.toString()}`);
    
    if (response.success) {
      data.value = response.data.items;
      pagination.value = response.data.pagination;
      stats.value = response.data.stats;
    }
  } catch (error: any) {
    console.error('Error loading certificates:', error);
    notification.error('Ошибка загрузки', error.message || 'Не удалось загрузить сертификаты');
  } finally {
    loading.value = false;
  }
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedSearch() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    loadData();
  }, 350);
}

function handleFilterChange() {
  pagination.value.page = 1;
  loadData();
}

function resetFilters() {
  filters.value = {
    search: '',
    status: 'all',
    sourceType: 'all',
    organizationName: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'issue_date',
    sortOrder: 'desc',
  };
  pagination.value.page = 1;
  loadData();
}

function toggleSort(field: string) {
  if (filters.value.sortBy === field) {
    filters.value.sortOrder = filters.value.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    filters.value.sortBy = field;
    filters.value.sortOrder = 'desc';
  }
  loadData();
}

function goToPage(page: number) {
  pagination.value.page = page;
  loadData();
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function openDetailModal(cert: any) {
  selectedCertificate.value = cert;
  isDetailModalOpen.value = true;
}

function closeDetailModal() {
  isDetailModalOpen.value = false;
  selectedCertificate.value = null;
}

function openRevokeModal(cert: any) {
  revokeTarget.value = cert;
  revokeReason.value = '';
  isRevokeModalOpen.value = true;
}

function closeRevokeModal() {
  isRevokeModalOpen.value = false;
  revokeTarget.value = null;
  revokeReason.value = '';
}

async function confirmRevoke() {
  if (!revokeTarget.value || !revokeReason.value.trim()) return;

  isRevoking.value = true;
  try {
    const response = await authFetch(`/api/certificates/${revokeTarget.value.id}/revoke`, {
      method: 'PATCH',
      body: { reason: revokeReason.value.trim() },
    });

    if (response.success) {
      notification.success('Сертификат отозван', `Сертификат ${revokeTarget.value.certificateNumber} успешно отозван`);
      closeRevokeModal();
      loadData();
    } else {
      notification.error('Ошибка', response.message || 'Не удалось отозвать сертификат');
    }
  } catch (error: any) {
    console.error('Error revoking certificate:', error);
    notification.error('Ошибка', error.message || 'Не удалось отозвать сертификат');
  } finally {
    isRevoking.value = false;
  }
}

async function exportToExcel() {
  // TODO: Реализовать экспорт в Excel
  notification.info('В разработке', 'Функция экспорта будет доступна в следующей версии');
}

// Методы для модального окна ручного добавления
function openManualFormModal() {
  isManualFormModalOpen.value = true;
}

function closeManualFormModal() {
  isManualFormModalOpen.value = false;
}

function handleCertificateCreated(certificate: any) {
  notification.success('Сертификат создан', `Сертификат ${certificate.certificateNumber} успешно добавлен`);
  loadData(); // Перезагрузить данные
}

// Lifecycle
onMounted(() => {
  loadData();
});
</script>
