<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="show"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 pointer-events-none"
      >
        <div
          class="pointer-events-auto relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all transform"
        >
          <!-- Top Gradient Glow Line -->
          <div class="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 flex-shrink-0"></div>

          <!-- Header -->
          <div class="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div class="flex items-center space-x-2.5">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <svg class="w-5 h-5 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  Синхронизация слушателей
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">
                  Course Planner ➔ ИНН, службы, должности и фотографии
                </p>
              </div>
            </div>
            <button
              v-if="!isSyncing"
              @click="closeModal"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body Content (Scrollable) -->
          <div class="p-5 space-y-4 overflow-y-auto max-h-[calc(92vh-125px)] custom-scrollbar">
            <!-- Initial State (Before Start) -->
            <div v-if="!isSyncing && !result" class="text-center py-4 space-y-4">
              <div class="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-base font-bold text-slate-800 dark:text-slate-200">
                  Запустить обновление слушателей из API?
                </h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
                  Будет выполнен запрос к API Course Planner 2 для загрузки всех слушателей, сопоставления предприятий по ИНН, сохранения служб и должностей на трех языках (UZ/RU/EN) и прикрепления фото.
                </p>
              </div>

              <!-- Preview of What Stage 3 does -->
              <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-2 max-w-md mx-auto">
                <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Ключевые элементы 3-го этапа:
                </div>
                <div class="grid grid-cols-3 gap-2 text-[11px]">
                  <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                    <span class="font-bold text-emerald-600 dark:text-emerald-400 block">UZ / RU / EN</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Службы и должности</span>
                  </div>
                  <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                    <span class="font-bold text-blue-600 dark:text-blue-400 block">Base64</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Фотографии</span>
                  </div>
                  <div class="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/40 text-center">
                    <span class="font-bold text-purple-600 dark:text-purple-400 block">По ИНН</span>
                    <span class="text-[10px] text-slate-500 dark:text-slate-400">Организации</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Syncing Progress State -->
            <div v-if="isSyncing" class="space-y-4">
              <!-- 10x Live Pipeline Progress Bar Card -->
              <div class="bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3">
                <!-- Top row: Status & Speed -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-2 truncate pr-2">
                    <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span class="truncate font-semibold text-slate-800 dark:text-slate-200">{{ currentStatusText }}</span>
                  </div>
                  <div class="flex items-center space-x-2 flex-shrink-0">
                    <span v-if="liveStats.speed > 0" class="inline-flex items-center text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
                      ⚡ {{ liveStats.speed }} слуш/сек
                    </span>
                    <span class="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                      {{ progressPercentage }}%
                    </span>
                  </div>
                </div>

                <!-- Primary Progress Bar with Gradient Glow -->
                <div class="relative w-full h-3 bg-slate-200/90 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    class="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-300 ease-out relative"
                    :style="{ width: `${progressPercentage}%` }"
                  >
                    <div class="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  </div>
                </div>

                <!-- Exact Numbers / Count Bar -->
                <div class="flex items-center justify-between text-xs font-medium pt-0.5">
                  <div class="flex items-baseline space-x-1.5">
                    <span class="text-slate-500 dark:text-slate-400 text-[11px]">Обновлено слушателей:</span>
                    <span class="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {{ liveStats.processed.toLocaleString() }}
                    </span>
                    <span class="text-slate-400 text-[11px]">из</span>
                    <span class="font-mono font-bold text-slate-600 dark:text-slate-300 text-xs">
                      {{ (liveStats.total || 8568).toLocaleString() }}
                    </span>
                  </div>
                  <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Осталось: {{ Math.max(0, (liveStats.total || 8568) - liveStats.processed).toLocaleString() }}
                  </div>
                </div>

                <!-- 4 Live Counter Chips -->
                <div class="grid grid-cols-4 gap-2 pt-1">
                  <div class="px-2 py-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-center">
                    <span class="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Обновлено</span>
                    <span class="font-mono font-bold text-xs text-blue-800 dark:text-blue-200">
                      {{ liveStats.updated.toLocaleString() }}
                    </span>
                  </div>
                  <div class="px-2 py-1.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 text-center">
                    <span class="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Создано</span>
                    <span class="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-200">
                      +{{ liveStats.created.toLocaleString() }}
                    </span>
                  </div>
                  <div class="px-2 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-center">
                    <span class="text-[9px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">С Фото</span>
                    <span class="font-mono font-bold text-xs text-indigo-800 dark:text-indigo-200">
                      {{ liveStats.photosCount.toLocaleString() }}
                    </span>
                  </div>
                  <div class="px-2 py-1.5 rounded-lg bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/40 text-center">
                    <span class="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-400 block">Орг по ИНН</span>
                    <span class="font-mono font-bold text-xs text-purple-800 dark:text-purple-200">
                      {{ liveStats.matchedOrgs.toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Main Steps List -->
              <div class="space-y-2.5">
                <div
                  v-for="(step, idx) in steps"
                  :key="idx"
                  class="rounded-xl border text-xs font-medium transition-all overflow-hidden"
                  :class="[
                    step.status === 'completed'
                      ? 'bg-emerald-50/60 border-emerald-200/80 dark:bg-emerald-950/20 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                      : step.status === 'active'
                      ? 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50 text-blue-900 dark:text-blue-200 shadow-sm'
                      : 'bg-slate-50/50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  ]"
                >
                  <!-- Step Row -->
                  <div class="flex items-center justify-between px-3.5 py-2.5">
                    <div class="flex items-center space-x-2.5 truncate">
                      <span v-if="step.status === 'completed'" class="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 text-sm">✓</span>
                      <span v-else-if="step.status === 'active'" class="inline-block w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
                      <span v-else class="text-slate-400 flex-shrink-0 text-xs">○</span>
                      <span class="truncate font-semibold">{{ step.title }}</span>
                    </div>
                    <span v-if="step.status === 'completed'" class="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">Готово</span>
                    <span v-else-if="step.status === 'active'" class="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold animate-pulse flex-shrink-0 bg-blue-100/60 dark:bg-blue-900/40 px-2 py-0.5 rounded-md">В процессе</span>
                  </div>

                  <!-- DETAILED SUB-STEPS FOR STAGE 3 -->
                  <div
                    v-if="step.id === 3 && (step.status === 'active' || step.status === 'completed')"
                    class="border-t border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/60 px-3.5 py-3 space-y-2"
                  >
                    <div class="flex items-center justify-between pb-1">
                      <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                        Детализация 3 этапа:
                      </span>
                      <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {{ subStepsCompletedCount }}/{{ stage3SubSteps.length }} под-этапов
                      </span>
                    </div>

                    <!-- Sub-steps Grid / Cards -->
                    <div class="space-y-1.5">
                      <div
                        v-for="sub in stage3SubSteps"
                        :key="sub.id"
                        class="flex items-center justify-between p-2 rounded-lg text-xs transition-all border"
                        :class="[
                          sub.status === 'completed'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30 text-slate-800 dark:text-slate-200'
                            : sub.status === 'active'
                            ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700/50 text-slate-900 dark:text-white shadow-xs'
                            : 'bg-slate-50/40 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                        ]"
                      >
                        <div class="flex items-center space-x-2.5 truncate">
                          <!-- Status icon -->
                          <div class="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                            <span v-if="sub.status === 'completed'" class="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>
                            <span v-else-if="sub.status === 'active'" class="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                            <span v-else class="text-slate-300 dark:text-slate-600 text-[10px]">○</span>
                          </div>

                          <div class="truncate">
                            <div class="font-medium truncate text-[11px] leading-tight flex items-center gap-1.5">
                              <span>{{ sub.title }}</span>
                            </div>
                            <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {{ sub.desc }}
                            </div>
                          </div>
                        </div>

                        <!-- Language / Feature Pills -->
                        <div class="flex items-center gap-1 flex-shrink-0 pl-2">
                          <template v-if="sub.type === 'lang'">
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">UZ</span>
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">RU</span>
                            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">EN</span>
                          </template>
                          <template v-else-if="sub.type === 'photo'">
                            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">Base64</span>
                          </template>
                          <template v-else-if="sub.type === 'db'">
                            <span class="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">Bulk 200</span>
                          </template>
                          <template v-else>
                            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">ИНН</span>
                          </template>

                          <!-- Status text pill -->
                          <span
                            class="text-[9px] font-bold uppercase ml-1 px-1.5 py-0.5 rounded"
                            :class="[
                              sub.status === 'completed'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : sub.status === 'active'
                                ? 'text-blue-600 dark:text-blue-400 animate-pulse'
                                : 'text-slate-400'
                            ]"
                          >
                            {{ sub.status === 'completed' ? 'OK' : sub.status === 'active' ? 'Идет...' : 'Ожид.' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Result State -->
            <div v-if="result" class="space-y-4">
              <div
                class="p-3.5 rounded-xl border flex items-center space-x-3 text-xs"
                :class="result.success ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-rose-50 border-rose-200 text-rose-900'"
              >
                <div class="text-2xl flex-shrink-0">
                  {{ result.success ? '🎉' : '⚠️' }}
                </div>
                <div class="flex-1">
                  <h4 class="font-bold text-xs">
                    {{ result.success ? 'Синхронизация через API успешно завершена!' : 'Ошибка синхронизации' }}
                  </h4>
                  <p class="text-[11px] opacity-90 mt-0.5">
                    {{ result.message || result.error }}
                  </p>
                </div>
              </div>

              <!-- Main Stats Grid -->
              <div v-if="result.success" class="grid grid-cols-4 gap-2">
                <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Всего в API</span>
                  <span class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">{{ result.total }}</span>
                </div>
                <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 text-center">
                  <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">Создано</span>
                  <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">+{{ result.created }}</span>
                </div>
                <div class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 text-center">
                  <span class="text-[10px] text-blue-600 dark:text-blue-400 block font-medium">Обновлено</span>
                  <span class="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">{{ result.updated }}</span>
                </div>
                <div class="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-800/40 text-center">
                  <span class="text-[10px] text-purple-600 dark:text-purple-400 block font-medium">Орг по ИНН</span>
                  <span class="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">{{ result.matchedOrgs }}</span>
                </div>
              </div>

              <!-- DETAILED BREAKDOWN OF STAGE 3 IN RESULTS -->
              <div v-if="result.success" class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-1.5">
                    <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                      Детализация 3 этапа: Языки и Фото
                    </h5>
                  </div>
                  <span class="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100/50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    Этап выполнен
                  </span>
                </div>

                <!-- 4 Metrics for Stage 3 -->
                <div class="grid grid-cols-3 gap-2">
                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>Службы UZ/RU/EN</span>
                      <span class="text-xs">🌐</span>
                    </div>
                    <div class="mt-1 flex items-baseline justify-between">
                      <span class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {{ result.multilingualDeptCount || result.total }}
                      </span>
                      <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">3 языка</span>
                    </div>
                  </div>

                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>Должности UZ/RU/EN</span>
                      <span class="text-xs">💼</span>
                    </div>
                    <div class="mt-1 flex items-baseline justify-between">
                      <span class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {{ result.multilingualPosCount || result.total }}
                      </span>
                      <span class="text-[9px] text-blue-600 dark:text-blue-400 font-bold">3 языка</span>
                    </div>
                  </div>

                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/50 flex flex-col justify-between">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>Фотографий Base64</span>
                      <span class="text-xs">📸</span>
                    </div>
                    <div class="mt-1 flex items-baseline justify-between">
                      <span class="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                        {{ result.photosCount || 0 }}
                      </span>
                      <span class="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">Сохранено</span>
                    </div>
                  </div>
                </div>

                <!-- Samples Preview Carousel/List -->
                <div v-if="result.samples && result.samples.length > 0" class="space-y-2 pt-1">
                  <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span>Примеры сохраненных слушателей (детализация переводов):</span>
                    <span class="text-[10px] text-slate-400 font-normal">Сэмплы из API</span>
                  </div>

                  <div class="space-y-2">
                    <div
                      v-for="(sample, sIdx) in result.samples"
                      :key="sIdx"
                      class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 text-[11px] space-y-1.5"
                    >
                      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <div class="flex items-center space-x-2">
                          <span class="font-bold text-slate-900 dark:text-white">{{ sample.name }}</span>
                          <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400">ПИНФЛ: {{ sample.pinfl }}</span>
                        </div>
                        <div class="flex items-center space-x-1.5">
                          <span
                            v-if="sample.hasPhoto"
                            class="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                          >
                            📸 Фото есть
                          </span>
                          <span
                            v-else
                            class="inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500"
                          >
                            Без фото
                          </span>
                          <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 truncate max-w-[120px]">
                            {{ sample.organization || 'Организация' }}
                          </span>
                        </div>
                      </div>

                      <!-- Multilingual Department & Position Details -->
                      <div class="grid grid-cols-2 gap-2 text-[10px]">
                        <!-- Department -->
                        <div class="space-y-0.5">
                          <span class="font-bold text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide">
                            Служба / Отдел:
                          </span>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">UZ:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.department?.uz || '—' }}</span>
                          </div>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">RU:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.department?.ru || '—' }}</span>
                          </div>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">EN:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.department?.en || '—' }}</span>
                          </div>
                        </div>

                        <!-- Position -->
                        <div class="space-y-0.5">
                          <span class="font-bold text-slate-500 dark:text-slate-400 block text-[9px] uppercase tracking-wide">
                            Должность:
                          </span>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">UZ:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.position?.uz || '—' }}</span>
                          </div>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-blue-600 dark:text-blue-400 flex-shrink-0">RU:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.position?.ru || '—' }}</span>
                          </div>
                          <div class="flex items-start gap-1">
                            <span class="font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">EN:</span>
                            <span class="text-slate-700 dark:text-slate-300 truncate">{{ sample.position?.en || '—' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Errors List if any -->
              <div v-if="result.errors && result.errors.length > 0" class="max-h-24 overflow-y-auto p-2 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1 text-[11px]">
                <h5 class="font-bold text-rose-800 dark:text-rose-300 text-[10px] uppercase">
                  Предупреждения ({{ result.errors.length }}):
                </h5>
                <div v-for="(err, i) in result.errors" :key="i" class="text-rose-700 dark:text-rose-400 flex justify-between">
                  <span class="truncate pr-2">• {{ err.name }}</span>
                  <span class="font-mono text-[10px] text-rose-500 flex-shrink-0">{{ err.error }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2.5 flex-shrink-0">
            <button
              v-if="!isSyncing && !result"
              @click="closeModal"
              class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              v-if="!isSyncing && !result"
              @click="startSync"
              class="px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg shadow hover:shadow-md transition-all flex items-center space-x-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Запустить обновление</span>
            </button>

            <button
              v-if="result"
              @click="finishSync"
              class="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 rounded-lg shadow transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { useAuthFetch } from "~/composables/useAuthFetch";

interface SyncStep {
  id: number;
  title: string;
  status: "pending" | "active" | "completed";
}

interface SubStep {
  id: string;
  title: string;
  desc: string;
  type: "lang" | "photo" | "org" | "db";
  status: "pending" | "active" | "completed";
}

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "synced"): void;
}>();

const { authFetch } = useAuthFetch();

const isSyncing = ref(false);
const progressPercentage = ref(0);
const currentStatusText = ref("Инициализация соединения...");
const result = ref<any>(null);

const steps = reactive<SyncStep[]>([
  { id: 1, title: "1. Получение данных из API Course Planner 2", status: "pending" },
  { id: 2, title: "2. Сопоставление организаций по ИНН", status: "pending" },
  { id: 3, title: "3. Обновление слушателей, фото и языков (UZ/EN/RU)", status: "pending" },
]);

const stage3SubSteps = reactive<SubStep[]>([
  {
    id: "3.1",
    title: "3.1 Мультиязычные службы (отделы)",
    desc: "Парсинг и сохранение отделов на узбекском, русском и английском",
    type: "lang",
    status: "pending",
  },
  {
    id: "3.2",
    title: "3.2 Мультиязычные должности",
    desc: "Сопоставление наименований должностей на 3 языках",
    type: "lang",
    status: "pending",
  },
  {
    id: "3.3",
    title: "3.3 Фотографии слушателей (Base64)",
    desc: "Валидация форматов фото и прикрепление к профилям",
    type: "photo",
    status: "pending",
  },
  {
    id: "3.4",
    title: "3.4 Привязка к организациям по ИНН",
    desc: "Связывание с локальным справочником предприятий",
    type: "org",
    status: "pending",
  },
  {
    id: "3.5",
    title: "3.5 Пакетная запись в БД (MySQL)",
    desc: "Пакеты Bulk INSERT и параллельные UPDATE (по 200 записей)",
    type: "db",
    status: "pending",
  },
]);

const liveStats = reactive({
  processed: 0,
  total: 8568,
  created: 0,
  updated: 0,
  photosCount: 0,
  matchedOrgs: 0,
  speed: 0,
});

const subStepsCompletedCount = computed(() => {
  return stage3SubSteps.filter((s) => s.status === "completed").length;
});

function closeModal() {
  if (isSyncing.value) return;
  resetState();
  emit("close");
}

function finishSync() {
  const hasChanges = result.value?.success;
  resetState();
  emit("close");
  if (hasChanges) {
    emit("synced");
  }
}

function resetState() {
  isSyncing.value = false;
  progressPercentage.value = 0;
  result.value = null;
  liveStats.processed = 0;
  liveStats.total = 8568;
  liveStats.created = 0;
  liveStats.updated = 0;
  liveStats.photosCount = 0;
  liveStats.matchedOrgs = 0;
  liveStats.speed = 0;
  steps.forEach((s) => (s.status = "pending"));
  stage3SubSteps.forEach((s) => (s.status = "pending"));
}

async function startSync() {
  isSyncing.value = true;
  result.value = null;
  progressPercentage.value = 0;
  liveStats.processed = 0;
  liveStats.total = 8568;
  liveStats.created = 0;
  liveStats.updated = 0;
  liveStats.photosCount = 0;
  liveStats.matchedOrgs = 0;
  liveStats.speed = 0;

  // Step 1: Initializing
  if (steps[0]) steps[0].status = "active";
  currentStatusText.value = "Инициализация 10x Pipeline и подключение к API...";

  try {
    const authToken = useCookie("auth_token").value;
    const response = await fetch("/api/students/sync-planner", {
      method: "POST",
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Ошибка сервера (${response.status})`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Потоковое чтение недоступно в браузере");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() || "";

      for (const block of blocks) {
        if (!block.trim()) continue;
        const lines = block.split("\n");
        let eventName = "message";
        let eventDataRaw = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventName = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            eventDataRaw = line.replace("data: ", "").trim();
          }
        }

        if (!eventDataRaw) continue;

        try {
          const data = JSON.parse(eventDataRaw);

          if (eventName === "status") {
            currentStatusText.value = data.message;
            if (data.message.includes("ИНН")) {
              if (steps[0]) steps[0].status = "completed";
              if (steps[1]) steps[1].status = "active";
            }
          } else if (eventName === "init") {
            if (steps[0]) steps[0].status = "completed";
            if (steps[1]) steps[1].status = "completed";
            if (steps[2]) steps[2].status = "active";
            liveStats.total = data.total || 8568;
            currentStatusText.value = `Синхронизация через 10x Pipeline (${liveStats.total.toLocaleString()} слушателей)...`;
            stage3SubSteps.forEach((s) => (s.status = "active"));
          } else if (eventName === "progress") {
            if (steps[0]) steps[0].status = "completed";
            if (steps[1]) steps[1].status = "completed";
            if (steps[2]) steps[2].status = "active";

            liveStats.processed = data.processed;
            liveStats.total = data.total || liveStats.total;
            liveStats.created = data.created;
            liveStats.updated = data.updated;
            liveStats.photosCount = data.photosCount;
            liveStats.matchedOrgs = data.matchedOrgs;
            liveStats.speed = data.speed;
            progressPercentage.value = Math.max(1, Math.min(99, data.percentage));

            currentStatusText.value = `Пакетная запись: ${data.processed.toLocaleString()} из ${liveStats.total.toLocaleString()} (Стр. ${data.page}/${data.totalPages})...`;

            // Update sub-steps
            if (data.photosCount > 0 && stage3SubSteps[2]) stage3SubSteps[2].status = "completed";
            if (data.matchedOrgs > 0 && stage3SubSteps[3]) stage3SubSteps[3].status = "completed";
            if (stage3SubSteps[0]) stage3SubSteps[0].status = "completed";
            if (stage3SubSteps[1]) stage3SubSteps[1].status = "completed";
            if (stage3SubSteps[4]) stage3SubSteps[4].status = "active";
          } else if (eventName === "complete") {
            progressPercentage.value = 100;
            if (steps[2]) steps[2].status = "completed";
            stage3SubSteps.forEach((s) => (s.status = "completed"));
            currentStatusText.value = "10x синхронизация успешно завершена!";
            result.value = data;
          } else if (eventName === "error") {
            result.value = {
              success: false,
              error: data.error || "Ошибка синхронизации",
            };
          }
        } catch (parseErr) {
          console.error("Failed to parse SSE line:", parseErr);
        }
      }
    }
  } catch (err: any) {
    result.value = {
      success: false,
      error: err.message || "Не удалось выполнить синхронизацию",
    };
  } finally {
    isSyncing.value = false;
  }
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
@keyframes spinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin-slow {
  animation: spinSlow 8s linear infinite;
}

/* Custom Scrollbar for smooth reading */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.4);
  border-radius: 9999px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(71, 85, 105, 0.5);
}
</style>
