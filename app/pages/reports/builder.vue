<template>
  <div class="flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
    <!-- ── Хедер ─────────────────────────────────────────────────── -->
    <div
      class="flex items-center gap-3 px-5 py-3 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark shrink-0 z-20"
    >
      <NuxtLink
        to="/reports"
        class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-all"
        title="Назад к отчётам"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </NuxtLink>

      <!-- Название (inline-редактирование) -->
      <div class="flex-1 min-w-0">
        <input
          v-if="editingTitle"
          ref="titleInput"
          v-model="config.name"
          class="w-full max-w-sm text-base font-semibold bg-transparent border-b-2 border-primary text-gray-900 dark:text-white outline-none px-1"
          placeholder="Название отчёта"
          @blur="editingTitle = false"
          @keydown.enter="editingTitle = false"
          @keydown.escape="editingTitle = false"
        />
        <button
          v-else
          class="group flex items-center gap-2 font-semibold text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary transition-colors"
          @click="startEditTitle"
        >
          {{ config.name || "Новый отчёт" }}
          <svg
            class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </button>
      </div>

      <!-- Кол-во выбранных полей -->
      <div
        v-if="config.columns.length > 0"
        class="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
      >
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
        </svg>
        {{ config.columns.length }} {{ pluralFields(config.columns.length) }}
      </div>

      <!-- Активные фильтры-чипы (компактные) -->
      <div
        v-if="activeFilterChips.length > 0"
        class="hidden md:flex items-center gap-1.5 max-w-xs overflow-hidden"
      >
        <div
          v-for="chip in activeFilterChips.slice(0, 2)"
          :key="chip.key"
          class="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded-full border border-amber-200 dark:border-amber-700/40 shrink-0"
        >
          <span class="truncate max-w-[80px]">{{ chip.label }}</span>
          <button
            class="flex-shrink-0 hover:text-red-500 transition-colors"
            @click="removeFilterChip(chip.key)"
          >
            <svg
              class="w-2.5 h-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="3"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <span v-if="activeFilterChips.length > 2" class="text-xs text-gray-400"
          >+{{ activeFilterChips.length - 2 }}</span
        >
      </div>

      <!-- Кнопки -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Переключатель is_public -->
        <label
          class="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-lg border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          title="Публичный шаблон виден всем сотрудникам"
        >
          <div
            class="relative w-8 h-4 rounded-full transition-colors duration-200"
            :class="
              config.is_public ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            "
          >
            <div
              class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200"
              :class="config.is_public ? 'translate-x-4' : 'translate-x-0'"
            />
            <input type="checkbox" v-model="config.is_public" class="sr-only" />
          </div>
          <span
            class="text-xs text-gray-600 dark:text-gray-400 hidden sm:inline"
            >Публичный</span
          >
        </label>

        <!-- Excel -->
        <button
          v-if="result.rows.length > 0"
          :disabled="exporting"
          class="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-all shadow-sm"
          @click="exportExcel"
        >
          <svg
            v-if="!exporting"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span class="hidden sm:inline">Excel</span>
        </button>

        <!-- Сохранить -->
        <button
          :disabled="saving"
          class="flex items-center gap-1.5 px-3 py-2 border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60 transition-all"
          @click="saveTemplate"
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
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span class="hidden sm:inline">{{
            saving ? "Сохранение..." : "Сохранить"
          }}</span>
        </button>

        <!-- Кнопка открытия конструктора -->
        <button
          class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm relative"
          @click="drawerOpen = true"
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
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          Конструктор
          <!-- Бейдж если есть активные настройки -->
          <span
            v-if="config.columns.length > 0"
            class="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center bg-amber-400 text-white text-[10px] font-bold rounded-full leading-none"
            >{{ config.columns.length }}</span
          >
        </button>
      </div>
    </div>

    <!-- ── Предупреждения ──────────────────────────────────────────── -->
    <div
      v-if="validationWarning || compatibilityWarning || draftSavedHint"
      class="shrink-0 px-5 pt-3 space-y-2"
    >
      <div
        v-if="validationWarning"
        class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl flex items-start gap-3"
      >
        <svg
          class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"
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
        <p class="text-xs text-amber-700 dark:text-amber-300 flex-1">
          {{ validationWarning }}
        </p>
        <button
          class="text-amber-400 hover:text-amber-600 transition-colors"
          @click="validationWarning = ''"
        >
          <svg
            class="w-3.5 h-3.5"
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

      <div
        v-if="compatibilityWarning"
        class="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700/40 rounded-xl flex items-start gap-3"
      >
        <svg
          class="w-4 h-4 text-orange-500 shrink-0 mt-0.5"
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
        <p class="text-xs text-orange-600 dark:text-orange-400 flex-1">
          <strong class="text-orange-700 dark:text-orange-300"
            >Несовместимые источники:</strong
          >
          {{
            compatibilityWarning.branches
              .map((b: string) =>
                b === "students"
                  ? "Слушатели"
                  : b === "schedule"
                    ? "Расписание"
                    : "Тестирование",
              )
              .join(" + ")
          }}
          — возможны дублированные строки.
        </p>
      </div>

      <div
        v-if="draftSavedHint"
        class="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 rounded-lg flex items-center gap-2"
      >
        <svg
          class="w-3.5 h-3.5 text-green-500"
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
        <span class="text-xs text-green-700 dark:text-green-300"
          >Черновик автосохранён</span
        >
      </div>
    </div>

    <!-- ── Тело — полная ширина ──────────────────────────────────── -->
    <div class="flex-1 min-h-0 overflow-hidden relative flex flex-col">
      <!-- Пустое состояние (нет данных) -->
      <div
        v-if="!result.generated"
        class="h-full flex flex-col items-center justify-center text-center p-10"
      >
        <div
          class="w-20 h-20 rounded-2xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center mb-5 border border-primary/10"
        >
          <svg
            class="w-10 h-10 text-primary/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="text-gray-600 dark:text-gray-300 font-medium text-base mb-1">
          {{
            templateId
              ? "Отчёт готов к формированию"
              : "Таблица отчёта появится здесь"
          }}
        </p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-6">
          <template v-if="templateId">
            Нажмите кнопку ниже, чтобы получить актуальные данные по шаблону
          </template>
          <template v-else>
            Откройте
            <strong class="text-gray-500 dark:text-gray-400">Конструктор</strong
            >, выберите поля и нажмите «Сформировать»
          </template>
        </p>
        <button
          :disabled="generating"
          class="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-all shadow-md disabled:opacity-60"
          @click="templateId ? generate() : (drawerOpen = true)"
        >
          <svg
            v-if="!generating"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              v-if="templateId"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
            <path
              v-else
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {{
            templateId
              ? generating
                ? "Формирование..."
                : "Сформировать"
              : "Открыть конструктор"
          }}
        </button>
      </div>

      <!-- Таблица результата -->
      <ReportsPreviewTable
        v-else
        :rows="result.rows"
        :columns="result.column_labels"
        :total="result.total"
        :loading="generating"
        :page="pagination.page"
        :limit="pagination.limit"
        :total-row="result.total_row"
        @page-change="handlePageChange"
      />
    </div>

    <!-- ══ DRAWER — Конструктор (справа) ════════════════════════════ -->
    <!-- Затемнение фона -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="drawerOpen"
        class="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-[100000]"
        @click="drawerOpen = false"
      />
    </Transition>

    <!-- Сам drawer -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="drawerOpen"
        class="fixed top-0 right-0 h-full w-[85%] max-w-[1100px] z-[100001] flex flex-col bg-white dark:bg-boxdark border-l border-stroke dark:border-strokedark shadow-2xl"
      >
        <!-- Шапка drawer -->
        <div
          class="flex items-center justify-between px-5 py-3 border-b border-stroke dark:border-strokedark shrink-0 bg-gray-50/50 dark:bg-gray-800/20"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
            >
              <svg
                class="w-4.5 h-4.5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div>
              <h2
                class="text-sm font-bold text-gray-900 dark:text-white leading-none"
              >
                Настройка отчёта
              </h2>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] text-gray-400"
                  >Сконструируйте структуру и фильтры</span
                >
                <span
                  v-if="config.columns.length > 0"
                  class="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded-md uppercase leading-none"
                >
                  {{ config.columns.length }}
                  {{ pluralFields(config.columns.length) }}
                </span>
              </div>
            </div>
          </div>
          <button
            class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            @click="drawerOpen = false"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Скроллируемое тело конструктора (Горизонтальное) -->
        <div class="flex-1 overflow-y-auto w-full">
          <div class="p-4.5">
            <!-- 1. ВЫБОР БАЗОВОЙ СУЩНОСТИ (Компактный) -->
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                <span
                  class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500"
                  >1. Базовая сущность</span
                >
                <div class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="root in [
                    {
                      key: 'study_groups',
                      label: 'Группы',
                      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                    },
                    {
                      key: 'students',
                      label: 'Слушатели',
                      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197',
                    },
                    {
                      key: 'courses',
                      label: 'Курсы',
                      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
                    },
                    {
                      key: 'organizations',
                      label: 'Орг.',
                      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
                    },
                    {
                      key: 'issued_certificates',
                      label: 'Серт.',
                      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
                    },
                  ]"
                  :key="root.key"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-[11px] font-bold"
                  :class="
                    config.primary_entity === root.key
                      ? 'border-primary bg-primary text-white shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-700'
                  "
                  @click="config.primary_entity = root.key as any"
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
                      :d="root.icon"
                    />
                  </svg>
                  {{ root.label }}
                </button>
              </div>
            </div>

            <!-- ГРИД для остальных настроек -->
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              <!-- Левая колонка: Выбор полей (4/12) -->
              <div class="xl:col-span-4 space-y-4">
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500"
                      >2. Поля данных</span
                    >
                    <div class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <div
                    v-if="metaLoading"
                    class="flex justify-center py-10 bg-gray-50/50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700"
                  >
                    <div
                      class="h-7 w-7 animate-spin rounded-full border-3 border-primary border-r-transparent"
                    />
                  </div>
                  <div
                    v-else
                    class="bg-white dark:bg-boxdark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  >
                    <ReportsEntitySection
                      v-for="group in entityGroups"
                      :key="group.key"
                      :group="group"
                      :selected-columns="config.columns"
                      @toggle-field="toggleField"
                      @update-column="updateColumn"
                    />
                  </div>
                </div>
              </div>

              <!-- Центральная колонка: Столбцы и Группировка (4/12) -->
              <div class="xl:col-span-4 space-y-6">
                <!-- Порядок столбцов -->
                <div>
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500"
                      >3. Структура</span
                    >
                    <div class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <div
                    v-if="config.columns.length === 0"
                    class="py-10 text-center bg-gray-50/50 dark:bg-gray-800/10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700"
                  >
                    <p class="text-xs text-gray-400">
                      Выберите поля слева, чтобы настроить их порядок
                    </p>
                  </div>
                  <div v-else class="space-y-1.5 p-1">
                    <div
                      v-for="(col, idx) in config.columns"
                      :key="col.field_key"
                      draggable="true"
                      class="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                      :class="
                        dragOverIdx === idx
                          ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-boxdark'
                          : ''
                      "
                      @dragstart="onDragStart(idx, $event)"
                      @dragover.prevent="onDragOver(idx)"
                      @dragend="onDragEnd"
                      @drop.prevent="onDrop(idx)"
                    >
                      <svg
                        class="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M4 8h16M4 16h16"
                        />
                      </svg>

                      <div class="flex-1 min-w-0">
                        <p
                          class="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate"
                        >
                          {{ col.label }}
                        </p>
                        <p
                          class="text-[9px] text-gray-400 uppercase tracking-tighter"
                        >
                          {{ col.field_key }}
                        </p>
                      </div>

                      <div class="flex items-center gap-2">
                        <!-- Основная агрегация (группировка) -->
                        <div
                          class="relative group/agg flex items-center bg-gray-50 dark:bg-gray-800/80 rounded-lg p-0.5 border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all"
                        >
                          <div
                            class="flex items-center gap-1 px-1.5 py-0.5 text-[9px] text-primary/60 font-black uppercase tracking-tighter border-r border-gray-200 dark:border-gray-700 mr-1"
                          >
                            Σ
                          </div>
                          <select
                            v-model="col.aggregation"
                            class="text-[10px] font-bold text-primary bg-transparent border-none px-1 py-0.5 outline-none cursor-pointer appearance-none pr-4"
                          >
                            <option value="none">НЕТ</option>
                            <option value="count">COUNT</option>
                            <option value="count_distinct">DISTINCT</option>
                            <option value="sum">SUM</option>
                            <option value="avg">AVG</option>
                            <option value="min">MIN</option>
                            <option value="max">MAX</option>
                            <option value="list">LIST</option>
                          </select>
                          <svg
                            class="w-2.5 h-2.5 absolute right-1.5 pointer-events-none text-primary/40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="3"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>

                        <!-- Настройка ИТОГО -->
                        <div
                          class="flex items-center bg-orange-50/50 dark:bg-orange-950/20 rounded-lg p-0.5 border border-orange-100 dark:border-orange-900/40"
                        >
                          <button
                            class="px-1.5 py-0.5 rounded-md transition-all flex items-center gap-1 group/sigma"
                            :class="
                              col.show_in_total
                                ? 'text-orange-600 bg-orange-100 shadow-sm'
                                : 'text-gray-400 hover:text-orange-500'
                            "
                            @click="col.show_in_total = !col.show_in_total"
                            title="Показывать в строке ИТОГО (Σ)"
                          >
                            <span class="text-[9px] font-black uppercase"
                              >Σ</span
                            >
                          </button>
                          <div
                            v-if="col.show_in_total"
                            class="flex items-center ml-1 border-l border-orange-200/50 dark:border-orange-800/50 pl-1"
                          >
                            <select
                              v-model="col.total_aggregation"
                              class="text-[10px] font-bold text-orange-600 bg-transparent border-none px-1 py-0.5 outline-none cursor-pointer appearance-none pr-3"
                            >
                              <option value="sum">SUM</option>
                              <option value="avg">AVG</option>
                              <option value="count">COUNT</option>
                              <option value="min">MIN</option>
                              <option value="max">MAX</option>
                            </select>
                            <svg
                              class="w-2 h-2 pointer-events-none text-orange-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="3"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>

                        <button
                          class="p-1 text-gray-300 hover:text-red-500 transition-colors"
                          @click="
                            toggleField(
                              col.field_key,
                              col.label,
                              col.aggregation,
                            )
                          "
                        >
                          <svg
                            class="w-3.5 h-3.5"
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
                  </div>
                </div>

                <!-- Группировка -->
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span
                      class="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                      >4. Группировка строк</span
                    >
                    <div class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div
                    class="bg-white dark:bg-boxdark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4"
                  >
                    <ReportsGroupingSection
                      :groupings="config.groupings"
                      :entity-groups="entityGroups"
                      @add="addGrouping"
                      @remove="removeGrouping"
                    />
                  </div>
                </div>
              </div>

              <!-- Правая колонка: Фильтры (4/12) -->
              <div class="xl:col-span-4">
                <div class="flex items-center gap-2 mb-3">
                  <span
                    class="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                    >5. Фильтрация данных</span
                  >
                  <div class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                </div>
                <div
                  class="bg-white dark:bg-boxdark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 h-full min-h-[400px]"
                >
                  <ReportsFiltersSection
                    :filters="config.filters"
                    :lookup="lookup"
                    @update="(f) => (config.filters = f)"
                  />

                  <div
                    class="mt-8 pt-6 border-t border-gray-50 dark:border-gray-800"
                  >
                    <button
                      class="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:text-white border border-red-200 dark:border-red-900/40 rounded-xl hover:bg-red-500 dark:hover:bg-red-600 transition-all"
                      @click="resetAll"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Полный сброс
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Нижняя панель: Сформировать ───────────── -->
        <div
          class="shrink-0 border-t border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800/50 px-4 py-4"
        >
          <button
            :disabled="generating"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all shadow-md text-sm"
            @click="generateAndClose"
          >
            <svg
              v-if="!generating"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <svg
              v-else
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {{ generating ? "Формирование..." : "Сформировать отчёт" }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useToast } from "~/composables/useToast";
import { checkColumnsCompatibility } from "~/composables/useCompatibilityCheck";

definePageMeta({ layout: "report-builder" as any });

const route = useRoute();
const toast = useToast();

const apiFetch = (url: string, opts?: Record<string, any>): Promise<any> =>
  ($fetch as any)(url, opts);

// ── Типы ──────────────────────────────────────────────────────────────
interface ColumnConfig {
  field_key: string;
  label: string;
  aggregation: string;
  show_in_total: boolean;
  total_aggregation: string;
  width: number;
  align: string;
}

interface GroupingItem {
  type: "field" | "time_scale";
  field_key?: string;
  time_scale?: string;
  date_field_key?: string;
  label: string;
}

const DRAFT_KEY = "report_builder_draft";

const defaultConfig = () => ({
  name: "Новый отчёт",
  description: "",
  is_public: false,
  primary_entity: "study_groups" as any,
  columns: [] as ColumnConfig[],
  groupings: [] as GroupingItem[],
  filters: {} as Record<string, any>,
  sort_field: "",
  sort_direction: "asc",
});

const config = reactive(defaultConfig());

const result = reactive({
  generated: false,
  rows: [] as any[],
  column_labels: [] as string[],
  total: 0,
  total_row: null as Record<string, any> | null,
});

const pagination = reactive({ page: 1, limit: 50 });

// ── Метаданные ─────────────────────────────────────────────────────────
const metaLoading = ref(false);
const entityGroups = ref<any[]>([]);
const lookup = ref<any>({
  courses: [],
  organizations: [],
  instructors: [],
  groups: [],
});
const templateId = ref<string | null>(null);

// ── UI-состояние ───────────────────────────────────────────────────────
const generating = ref(false);
const exporting = ref(false);
const saving = ref(false);
const editingTitle = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);
const validationWarning = ref("");
const draftSavedHint = ref(false);
const isMounted = ref(false);
const drawerOpen = ref(false);

// ── Drag & Drop ────────────────────────────────────────────────────────
const dragIdx = ref<number | null>(null);
const dragOverIdx = ref<number | null>(null);

const onDragStart = (idx: number, event: DragEvent) => {
  dragIdx.value = idx;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(idx));
  }
};

const onDragOver = (idx: number) => {
  dragOverIdx.value = idx;
};

const onDragEnd = () => {
  dragIdx.value = null;
  dragOverIdx.value = null;
};

const onDrop = (targetIdx: number) => {
  if (dragIdx.value === null || dragIdx.value === targetIdx) {
    dragOverIdx.value = null;
    return;
  }
  const cols = [...config.columns];
  const [moved] = cols.splice(dragIdx.value, 1) as [ColumnConfig];
  cols.splice(targetIdx, 0, moved);
  config.columns = cols;
  dragIdx.value = null;
  dragOverIdx.value = null;
};

// ── Плюрализация ───────────────────────────────────────────────────────
const pluralFields = (n: number): string => {
  if (n % 10 === 1 && n % 100 !== 11) return "поле";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100))
    return "поля";
  return "полей";
};

// ── Chips активных фильтров ────────────────────────────────────────────
const activeFilterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  const f = config.filters;
  if (f.date_from)
    chips.push({ key: "date_from", label: `От: ${f.date_from}` });
  if (f.date_to) chips.push({ key: "date_to", label: `До: ${f.date_to}` });
  if (f.course_ids?.length > 0) {
    const names = f.course_ids
      .map(
        (id: string) =>
          lookup.value.courses.find((c: any) => c.id === id)?.short_name || id,
      )
      .join(", ");
    chips.push({ key: "course_ids", label: `Курсы: ${names}` });
  }
  if (f.org_ids?.length > 0) {
    const names = f.org_ids
      .map(
        (id: string) =>
          lookup.value.organizations.find((o: any) => o.id === id)
            ?.short_name || id,
      )
      .join(", ");
    chips.push({ key: "org_ids", label: `Орг.: ${names}` });
  }
  return chips;
});

const removeFilterChip = (key: string) => {
  const f = { ...config.filters };
  delete f[key];
  config.filters = f;
};

// ── localStorage: автосохранение черновика ─────────────────────────────
let draftTimer: ReturnType<typeof setTimeout> | null = null;
let draftHintTimer: ReturnType<typeof setTimeout> | null = null;

const saveDraft = () => {
  if (!isMounted.value || templateId.value) return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        name: config.name,
        description: config.description,
        is_public: config.is_public,
        primary_entity: config.primary_entity,
        columns: config.columns,
        groupings: config.groupings,
        filters: config.filters,
        sort_field: config.sort_field,
        sort_direction: config.sort_direction,
      }),
    );
    if (!isMounted.value) return;
    draftSavedHint.value = true;
    if (draftHintTimer) clearTimeout(draftHintTimer);
    draftHintTimer = setTimeout(() => {
      if (!isMounted.value) return;
      draftSavedHint.value = false;
    }, 2500);
  } catch {
    /* localStorage недоступен */
  }
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    Object.assign(config, draft);
  } catch {
    /* повреждённый черновик — игнорируем */
  }
};

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
};

const scheduleDraftSave = () => {
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 1500);
};

watch(
  () => ({
    name: config.name,
    primary_entity: config.primary_entity,
    columns: [...config.columns],
    groupings: [...config.groupings],
    filters: { ...config.filters },
    is_public: config.is_public,
    sort_field: config.sort_field,
    sort_direction: config.sort_direction,
  }),
  scheduleDraftSave,
  { deep: true },
);

// ── Сброс всех настроек ────────────────────────────────────────────────
const resetAll = () => {
  const defaults = defaultConfig();
  Object.assign(config, defaults);
  result.generated = false;
  result.rows = [];
  result.column_labels = [];
  result.total = 0;
  result.total_row = null;
  validationWarning.value = "";
  clearDraft();
  toast.success("Настройки сброшены");
};

// ── Инициализация ──────────────────────────────────────────────────────
const startEditTitle = async () => {
  editingTitle.value = true;
  await nextTick();
  titleInput.value?.focus();
  titleInput.value?.select();
};

const fetchMeta = async () => {
  metaLoading.value = true;
  try {
    const [fields, lookupData] = await Promise.all([
      apiFetch("/api/reports/builder/meta/fields"),
      apiFetch("/api/reports/builder/meta/lookup"),
    ]);
    entityGroups.value = fields.data;
    lookup.value = lookupData.data;
  } catch (e: any) {
    toast.error("Ошибка загрузки полей");
  } finally {
    metaLoading.value = false;
  }
};

const loadTemplate = async (id: string) => {
  try {
    const res = await apiFetch(`/api/reports/builder/templates/${id}`);
    const tpl = res.data;
    templateId.value = id;
    config.name = tpl.name;
    config.description = tpl.description || "";
    config.is_public = tpl.is_public;
    config.primary_entity = tpl.primary_entity || "study_groups";
    config.columns = tpl.columns || [];
    config.groupings = tpl.row_grouping || [];
    config.filters = tpl.filters || {};
    config.sort_field = tpl.sort_field || "";
    config.sort_direction = tpl.sort_direction || "asc";
  } catch {
    toast.error("Ошибка загрузки шаблона");
  }
};

onMounted(async () => {
  isMounted.value = true;
  await fetchMeta();
  if (route.query.template) {
    await loadTemplate(route.query.template as string);
  } else {
    loadDraft();
  }
});

onUnmounted(() => {
  isMounted.value = false;
  if (draftTimer) clearTimeout(draftTimer);
  if (draftHintTimer) clearTimeout(draftHintTimer);
});

// ── Работа с полями ────────────────────────────────────────────────────
const toggleField = (
  fieldKey: string,
  label: string,
  defaultAggregation: string,
) => {
  const idx = config.columns.findIndex((c) => c.field_key === fieldKey);
  if (idx !== -1) {
    config.columns.splice(idx, 1);
  } else {
    config.columns.push({
      field_key: fieldKey,
      label,
      aggregation: defaultAggregation,
      show_in_total: false,
      total_aggregation: "sum",
      width: 150,
      align: "left",
    });
  }
};

const updateColumn = (fieldKey: string, updates: Partial<ColumnConfig>) => {
  const col = config.columns.find((c) => c.field_key === fieldKey);
  if (col) Object.assign(col, updates);
};

// ── Группировка ────────────────────────────────────────────────────────
const addGrouping = (item: GroupingItem) => {
  config.groupings.push(item);
};

const removeGrouping = (index: number) => {
  config.groupings.splice(index, 1);
};

// ── Проверка совместимости ──────────────────────────────────────────────
const compatibilityWarning = computed(() => {
  if (config.columns.length < 2) return null;
  return checkColumnsCompatibility(config.columns, entityGroups.value);
});

// ── Валидация ──────────────────────────────────────────────────────────
const validateBeforeGenerate = (): boolean => {
  if (config.columns.length === 0 && config.groupings.length === 0) {
    validationWarning.value =
      "Выберите хотя бы одно поле данных или добавьте группировку строк.";
    return false;
  }
  validationWarning.value = "";
  return true;
};

// ── Формирование отчёта ────────────────────────────────────────────────
const generate = async () => {
  if (!validateBeforeGenerate()) return;
  generating.value = true;
  try {
    const res = await apiFetch("/api/reports/builder/preview", {
      method: "POST",
      body: {
        columns: config.columns,
        groupings: config.groupings,
        filters: config.filters,
        primary_entity: config.primary_entity,
        sort_field: config.sort_field || undefined,
        sort_direction: config.sort_direction,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      },
    });
    result.rows = res.data.rows;
    result.column_labels = res.data.column_labels;
    result.total = res.data.total;
    result.total_row = res.data.total_row || null;
    result.generated = true;
  } catch (e: any) {
    toast.error(e.data?.statusMessage || "Ошибка формирования отчёта");
  } finally {
    generating.value = false;
  }
};

// Сформировать + закрыть drawer
const generateAndClose = async () => {
  await generate();
  if (result.generated) {
    drawerOpen.value = false;
  }
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  generate();
};

// ── Экспорт Excel ──────────────────────────────────────────────────────
const exportExcel = async () => {
  exporting.value = true;
  try {
    const blob = (await apiFetch("/api/reports/builder/export/excel", {
      method: "POST",
      body: {
        columns: config.columns,
        groupings: config.groupings,
        filters: config.filters,
        primary_entity: config.primary_entity,
        sort_field: config.sort_field || undefined,
        sort_direction: config.sort_direction,
      },
      responseType: "blob",
    })) as Blob;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Excel-файл скачан");
  } catch {
    toast.error("Ошибка экспорта Excel");
  } finally {
    exporting.value = false;
  }
};

// ── Сохранение шаблона ─────────────────────────────────────────────────
const saveTemplate = async () => {
  if (!config.name.trim()) {
    toast.error("Введите название отчёта");
    startEditTitle();
    return;
  }
  if (config.columns.length === 0) {
    validationWarning.value =
      "Необходимо выбрать хотя бы один столбец перед сохранением шаблона.";
    toast.error("Выберите хотя бы один столбец");
    return;
  }
  saving.value = true;
  try {
    const body = {
      name: config.name.trim(),
      description: config.description,
      primary_entity: config.primary_entity,
      data_sources: [
        ...new Set(
          [
            config.primary_entity,
            ...config.columns.flatMap((c) =>
              c.field_key.split(".").slice(0, 1),
            ),
          ].filter(Boolean),
        ),
      ],
      row_grouping: config.groupings,
      filters: config.filters,
      sort_field: config.sort_field || null,
      sort_direction: config.sort_direction,
      is_public: config.is_public,
      columns: config.columns,
    };
    if (templateId.value) {
      await apiFetch(`/api/reports/builder/templates/${templateId.value}`, {
        method: "PUT",
        body,
      });
      toast.success("Шаблон обновлён");
    } else {
      const res = await apiFetch("/api/reports/builder/templates", {
        method: "POST",
        body,
      });
      templateId.value = res.data.id;
      clearDraft();
      toast.success("Шаблон сохранён");
    }
  } catch (e: any) {
    toast.error(e.data?.statusMessage || "Ошибка сохранения");
  } finally {
    saving.value = false;
  }
};
</script>
