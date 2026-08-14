<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 space-y-6">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-3 text-slate-600 dark:text-slate-400 font-medium text-sm">
          Загрузка информации о группе...
        </p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div v-else-if="!group" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-slate-100 dark:bg-slate-800 p-5 rounded-full inline-block mb-4">
          <ShieldCheck class="w-10 h-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white">Группа не найдена</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-gray-400">
          Возможно, группа была удалена или вы используете неверную ссылку.
        </p>
        <UiButton class="mt-6 shadow-sm font-bold" @click="navigateTo('/attestation')">
          Вернуться к списку групп
        </UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Compact Header Section -->
      <div class="space-y-3 animate-in fade-in slide-in-from-top-3 duration-500">
        <!-- Breadcrumbs -->
        <NuxtLink
          to="/attestation"
          class="group inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
          >
            <ArrowLeft class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          </div>
          Назад к списку групп
        </NuxtLink>

        <!-- Title Row & Actions -->
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="space-y-1.5 min-w-0">
            <div class="flex flex-wrap items-center gap-2.5">
              <span class="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {{ group.code }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border"
                :class="statusClass"
              >
                {{ statusText }}
              </span>
            </div>

            <h1 class="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 truncate">
              {{ group.name }}
            </h1>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <div v-if="group.examStart" class="flex items-center gap-1.5 font-medium">
                <CalendarIcon class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ formatDateTime(group.examStart) }} — {{ formatDateTime(group.examEnd) }}</span>
              </div>
              <div v-if="group.location" class="flex items-center gap-1.5 font-medium">
                <MapPin class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{{ group.location }}</span>
              </div>
              <div v-if="group.templateName" class="flex items-center gap-1.5 font-medium">
                <FileCheck class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Тест: <b class="text-slate-700 dark:text-slate-300">{{ group.templateName }}</b> ({{ group.passingScore ?? "—" }}%)</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <UiButton
              variant="outline"
              size="sm"
              class="h-9 px-3.5 gap-1.5 text-xs font-bold"
              @click="activeTab = 'settings'"
            >
              <Settings class="w-3.5 h-3.5" />
              Параметры
            </UiButton>

            <UiButton
              variant="primary"
              size="sm"
              class="h-9 px-3.5 gap-1.5 text-xs font-bold shadow-xs"
              :loading="generatingProtocol"
              @click="generateProtocol"
            >
              <FileText class="w-3.5 h-3.5" />
              {{ group.protocolFileId ? "Обновить протокол" : "Сформировать протокол" }}
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Compact 4-Metric Strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Инструкторы -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div class="min-w-0">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Инструкторов</p>
            <div class="flex items-baseline gap-2 mt-0.5">
              <span class="text-xl font-black text-slate-900 dark:text-white">{{ instructors.length }}</span>
              <span class="text-[11px] text-slate-400 font-semibold truncate">в группе</span>
            </div>
          </div>
          <div class="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Users class="w-4 h-4" />
          </div>
        </div>

        <!-- Комиссия -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div class="min-w-0 flex-1 pr-2">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Комиссия ({{ commission.length }})</p>
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
              {{ chairman ? chairman.fullName : "Председатель не назначен" }}
            </p>
          </div>
          <div class="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Gavel class="w-4 h-4" />
          </div>
        </div>

        <!-- Сдали / Успеваемость -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
        >
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Сдали экзамен</p>
            <span class="text-xs font-black text-success">{{ passedCount }} / {{ results.length }}</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <div class="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                class="h-full rounded-full bg-success transition-all duration-500"
                :style="{ width: `${passedPercent}%` }"
              ></div>
            </div>
            <span class="text-[10px] font-bold text-slate-500">{{ passedPercent }}%</span>
          </div>
        </div>

        <!-- Шаблон сертификата -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-center justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
        >
          <div class="min-w-0 flex-1 pr-2">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400">Сертификаты</p>
            <p class="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
              {{ group.certTemplateName || "Не назначены" }}
            </p>
          </div>
          <div class="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award class="w-4 h-4" />
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-slate-200 dark:border-slate-800">
        <nav class="flex gap-2" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200',
              activeTab === tab.id
                ? 'border-primary text-primary dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ]"
          >
            <component :is="tab.icon" class="h-4 w-4" />
            {{ tab.label }}
            <span
              v-if="tab.badge !== undefined"
              class="px-1.5 py-0.2 rounded-full text-[10px] font-black"
              :class="activeTab === tab.id ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
            >
              {{ tab.badge }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab 1: PARTICIPANTS & RESULTS -->
      <div v-show="activeTab === 'participants'" class="space-y-4 animate-in fade-in duration-300">
        <!-- Toolbar: Filters + Search + Add Button -->
        <div class="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <!-- Search & Filter Badges -->
          <div class="flex flex-wrap items-center gap-2 flex-1">
            <div class="relative min-w-[220px] max-w-sm flex-1">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                v-model="searchInstructor"
                type="text"
                placeholder="Поиск по имени или специальности..."
                class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-7 text-xs outline-none focus:border-primary transition-all font-medium"
              />
              <button
                v-if="searchInstructor"
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                @click="searchInstructor = ''"
              >
                <X class="w-3 h-3" />
              </button>
            </div>

            <!-- Status filter pills -->
            <div class="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
              <button
                v-for="filter in statusFilters"
                :key="filter.id"
                class="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                :class="[
                  statusFilter === filter.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700',
                ]"
                @click="statusFilter = filter.id"
              >
                {{ filter.label }} ({{ filter.count }})
              </button>
            </div>
          </div>

          <!-- Add Instructors Action -->
          <UiButton
            variant="primary"
            size="sm"
            class="h-9 px-3.5 gap-1.5 text-xs font-bold shrink-0 shadow-xs"
            @click="showInstructorsModal = true"
          >
            <UserPlus class="w-3.5 h-3.5" />
            Добавить инструкторов
          </UiButton>
        </div>

        <!-- Instructors Table -->
        <div
          class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
        >
          <div v-if="instructors.length === 0" class="py-16 text-center px-4">
            <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-full inline-block mb-3">
              <Users class="w-8 h-8 text-slate-400" />
            </div>
            <h4 class="text-sm font-bold text-slate-900 dark:text-white">В группе пока нет инструкторов</h4>
            <p class="text-xs text-slate-500 mt-1">Добавьте инструкторов с помощью модального окна мультиселекта.</p>
            <UiButton size="sm" class="mt-4 gap-1.5 text-xs font-bold" @click="showInstructorsModal = true">
              <UserPlus class="w-3.5 h-3.5" /> Выбрать инструкторов
            </UiButton>
          </div>

          <div v-else-if="filteredResults.length === 0" class="py-12 text-center text-xs text-slate-500 font-medium">
            Нет участников, соответствующих критериям фильтра
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                  <th class="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Инструктор</th>
                  <th class="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-center">Балл теста</th>
                  <th class="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-center">Попыток</th>
                  <th class="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider">Решение комиссии</th>
                  <th class="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider text-right">Действия</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr
                  v-for="r in filteredResults"
                  :key="r.instructorId"
                  class="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <!-- Instructor Column -->
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] border border-primary/20"
                      >
                        {{ getInitials(r.fullName) }}
                      </div>
                      <div class="min-w-0">
                        <p class="font-bold text-slate-900 dark:text-white text-xs truncate">{{ r.fullName }}</p>
                        <p class="text-[10px] text-slate-500 truncate">{{ r.specialty || r.positionSnapshot || "Инструктор" }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Test Score Column -->
                  <td class="px-4 py-2.5 text-center">
                    <span
                      v-if="r.scorePercent !== null"
                      class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black"
                      :class="[
                        group.passingScore && r.scorePercent >= group.passingScore
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger',
                      ]"
                    >
                      {{ Math.round(r.scorePercent) }}%
                    </span>
                    <span v-else class="text-slate-300 dark:text-slate-600 font-semibold">—</span>
                  </td>

                  <!-- Attempts Column -->
                  <td class="px-4 py-2.5 text-center font-semibold text-slate-600 dark:text-slate-400">
                    <span v-if="r.attempts > 0">{{ r.attempts }}</span>
                    <span v-else class="text-slate-300 dark:text-slate-600">0</span>
                  </td>

                  <!-- Decision Badge Column -->
                  <td class="px-4 py-2.5">
                    <span
                      :class="[
                        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                        decisionBadgeClass(r),
                      ]"
                    >
                      {{ decisionLabel(r) }}
                    </span>
                  </td>

                  <!-- Actions Column -->
                  <td class="px-4 py-2.5">
                    <div class="flex items-center justify-end gap-1">
                      <!-- Decision Passed -->
                      <button
                        class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-[11px] font-bold text-success bg-success/10 hover:bg-success/20 transition-all"
                        title="Утвердить: Сдал"
                        @click="requestDecide(r, 'passed')"
                      >
                        <CheckCircle2 class="w-3.5 h-3.5" /> Сдал
                      </button>

                      <!-- Decision Failed -->
                      <button
                        class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-[11px] font-bold text-danger bg-danger/10 hover:bg-danger/20 transition-all"
                        title="Утвердить: Не сдал"
                        @click="requestDecide(r, 'failed')"
                      >
                        <XCircle class="w-3.5 h-3.5" /> Не сдал
                      </button>

                      <!-- Evaluation Sheet -->
                      <button
                        class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        title="Оценочный лист"
                        @click="openEvaluationSheet(r)"
                      >
                        <FileText class="w-3.5 h-3.5" /> Лист
                      </button>

                      <!-- Certificate Download -->
                      <a
                        v-if="r.certificateId"
                        :href="`/api/certificates/download/${r.certificateId}`"
                        target="_blank"
                        class="inline-flex h-7 items-center gap-1 px-2 rounded-md text-[11px] font-bold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                        title="Скачать сертификат"
                      >
                        <Award class="w-3.5 h-3.5" />
                      </a>

                      <!-- Remove from Group -->
                      <button
                        class="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-danger hover:bg-danger/10 transition-all opacity-40 group-hover:opacity-100"
                        title="Удалить из группы"
                        @click="requestRemoveInstructor(r)"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: COMMISSION -->
      <div v-show="activeTab === 'commission'" class="space-y-4 animate-in fade-in duration-300">
        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div class="space-y-0.5">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel class="w-4 h-4 text-amber-500" />
              Аттестационная комиссия группы
            </h3>
            <p class="text-xs text-slate-500">
              Комиссия принимает решения по результатам тестов и подписывает протокол аттестации.
            </p>
          </div>

          <UiButton
            variant="primary"
            size="sm"
            class="h-9 px-3.5 gap-1.5 text-xs font-bold shrink-0 shadow-xs"
            @click="showCommissionModal = true"
          >
            <Settings class="w-3.5 h-3.5" />
            {{ commission.length ? "Изменить состав комиссии" : "Сформировать комиссию" }}
          </UiButton>
        </div>

        <div v-if="commission.length === 0" class="py-16 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div class="bg-amber-500/10 p-4 rounded-full inline-block mb-3 text-amber-600">
            <Gavel class="w-8 h-8" />
          </div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white">Комиссия ещё не сформирована</h4>
          <p class="text-xs text-slate-500 mt-1">Выберите членов комиссии и назначьте председателя.</p>
          <UiButton size="sm" class="mt-4 gap-1.5 text-xs font-bold" @click="showCommissionModal = true">
            <Plus class="w-3.5 h-3.5" /> Сформировать комиссию
          </UiButton>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div
            v-for="c in sortedCommission"
            :key="c.id"
            class="rounded-xl border p-4 transition-all flex flex-col justify-between"
            :class="[
              c.role === 'chairman'
                ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 shadow-2xs'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs',
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-bold text-xs border"
                  :class="[
                    c.role === 'chairman'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-primary/10 text-primary border-primary/20',
                  ]"
                >
                  <Crown v-if="c.role === 'chairman'" class="w-4 h-4" />
                  <span v-else>{{ getInitials(c.fullName) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {{ c.fullName }}
                  </p>
                  <p class="text-[11px] text-slate-500 truncate mt-0.5">
                    {{ c.position || c.organization || "Член комиссии" }}
                  </p>
                </div>
              </div>

              <span
                class="shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border"
                :class="[
                  c.role === 'chairman'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : c.role === 'responsible'
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
                      : c.role === 'secretary'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                ]"
              >
                {{ roleLabel(c.role) }}
              </span>
            </div>

            <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span class="truncate">{{ c.organization || "Организация не указана" }}</span>
              <button
                class="text-slate-400 hover:text-danger p-1 transition-colors"
                title="Убрать из комиссии"
                @click="requestRemoveCommissionMember(c)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: SETTINGS & SCHEDULE -->
      <div v-show="activeTab === 'settings'" class="space-y-4 animate-in fade-in duration-300">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Card 1: Расписание и тест -->
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
          >
            <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <CalendarClock class="w-4 h-4 text-warning" />
                Расписание и шаблон теста
              </h3>
            </div>
            <div class="p-4 space-y-3.5">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Шаблон теста</label>
                <div class="relative">
                  <select
                    v-model="scheduleForm.testTemplateId"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 appearance-none font-medium transition-all"
                  >
                    <option value="">Не назначен</option>
                    <option v-for="t in testTemplates" :key="t.id" :value="t.id">{{ t.name }} (порог: {{ t.passingScore ?? 75 }}%)</option>
                  </select>
                  <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Начало экзамена</label>
                  <input
                    v-model="scheduleForm.examStart"
                    type="datetime-local"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Окончание экзамена</label>
                  <input
                    v-model="scheduleForm.examEnd"
                    type="datetime-local"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                  />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Место проведения</label>
                <input
                  v-model="scheduleForm.location"
                  type="text"
                  placeholder="Аудитория 17, Главный учебный корпус"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                />
              </div>

              <div class="flex justify-end pt-2">
                <UiButton size="sm" class="gap-1.5 text-xs font-bold" :loading="savingSchedule" @click="saveSchedule">
                  <Save class="w-3.5 h-3.5" /> Сохранить расписание
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Card 2: Шаблон сертификата -->
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
          >
            <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Award class="w-4 h-4 text-emerald-500" />
                Автовыдача сертификатов
              </h3>
            </div>
            <div class="p-4 space-y-3.5">
              <div class="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2.5 flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
                <Info class="w-4 h-4 shrink-0 mt-0.5" />
                <p class="leading-relaxed">
                  При включенном шаблоне сертификат генерируется автоматически сразу после того, как инструктор отмечается со статусом «Сдал».
                </p>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Шаблон сертификата</label>
                <div class="relative">
                  <select
                    v-model="certTemplateId"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 appearance-none font-medium transition-all"
                  >
                    <option value="">Не назначен (автовыдача отключена)</option>
                    <option v-for="t in certificateTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                  <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <UiButton size="sm" class="gap-1.5 text-xs font-bold" :loading="savingCertTemplate" @click="saveCertTemplate">
                  <Save class="w-3.5 h-3.5" /> Сохранить шаблон
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Card 3: Основная информация о группе -->
          <div
            class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden"
          >
            <div class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldCheck class="w-4 h-4 text-primary" />
                Основные данные группы
              </h3>
            </div>
            <div class="p-4 space-y-3.5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Код группы</label>
                  <input
                    :value="group.code"
                    type="text"
                    disabled
                    class="w-full rounded-lg border border-slate-200 bg-slate-100 py-2 px-3 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Статус</label>
                  <div class="relative">
                    <select
                      v-model="infoForm.status"
                      class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 appearance-none font-bold transition-all"
                    >
                      <option value="draft">Черновик</option>
                      <option value="scheduled">Запланирована</option>
                      <option value="in_progress">Идёт экзамен</option>
                      <option value="completed">Завершена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
                    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Название</label>
                <input
                  v-model="infoForm.name"
                  type="text"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium transition-all"
                />
              </div>

              <div class="space-y-1">
                <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Описание</label>
                <textarea
                  v-model="infoForm.description"
                  rows="2"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 px-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 font-medium resize-none transition-all"
                ></textarea>
              </div>

              <div class="flex justify-end pt-2">
                <UiButton size="sm" class="gap-1.5 text-xs font-bold" :loading="savingInfo" @click="saveGroupInfo">
                  <Save class="w-3.5 h-3.5" /> Сохранить данные
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Card 4: Опасная зона -->
          <div
            class="rounded-xl border border-danger/20 bg-danger/5 p-4 flex flex-col justify-between space-y-4"
          >
            <div>
              <h4 class="text-xs font-bold text-danger flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle class="w-4 h-4" />
                Опасная зона
              </h4>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Удаление группы приведет к безвозвратному удалению всех связанных результатов и связей с инструкторами.
              </p>
            </div>

            <div class="flex justify-end">
              <UiButton
                variant="outline"
                size="sm"
                class="gap-1.5 text-xs font-bold text-danger border-danger/30 hover:bg-danger/10"
                @click="showDeleteModal = true"
              >
                <Trash2 class="w-3.5 h-3.5" /> Удалить группу
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка выбора инструкторов (Мультиселект) -->
    <AttestationSelectInstructorsModal
      :is-open="showInstructorsModal"
      :group-id="groupId"
      :already-selected-ids="instructors.map((i) => i.instructorId)"
      @close="showInstructorsModal = false"
      @added="onInstructorsAdded"
    />

    <!-- Модалка выбора членов комиссии (Мультиселект) -->
    <AttestationSelectCommissionModal
      :is-open="showCommissionModal"
      :group-id="groupId"
      :current-members="commission.map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }))"
      @close="showCommissionModal = false"
      @saved="onCommissionSaved"
    />

    <!-- Модалка подтверждения решения комиссии (Сдал / Не сдал) -->
    <UiConfirmModal
      :is-open="!!decideTarget"
      :title="decideTarget?.decision === 'passed' ? 'Подтвердить сдачу экзамена' : 'Подтвердить несдачу экзамена'"
      :message="`Изменить решение комиссии по инструктору «${decideTarget?.result?.fullName}» на «${decideTarget?.decision === 'passed' ? 'Сдал' : 'Не сдал'}»?`"
      :warning="decideTarget?.result?.attempts === 0 ? 'Этот инструктор ещё не проходил тестирование — решение будет зафиксировано вручную.' : ''"
      confirm-text="Подтвердить"
      cancel-text="Отмена"
      :variant="decideTarget?.decision === 'passed' ? 'warning' : 'danger'"
      :loading="deciding"
      @confirm="confirmDecide"
      @cancel="decideTarget = null"
    />

    <!-- Модалка удаления инструктора из группы -->
    <UiConfirmModal
      :is-open="!!instructorToRemove"
      title="Удаление инструктора"
      :message="`Удалить инструктора «${instructorToRemove?.fullName}» из состава группы?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="removingInstructor"
      @confirm="confirmRemoveInstructor"
      @cancel="instructorToRemove = null"
    />

    <!-- Модалка удаления члена комиссии -->
    <UiConfirmModal
      :is-open="!!commissionMemberToRemove"
      title="Удаление члена комиссии"
      :message="`Удалить «${commissionMemberToRemove?.fullName}» из состава аттестационной комиссии?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="removingCommissionMember"
      @confirm="confirmRemoveCommissionMember"
      @cancel="commissionMemberToRemove = null"
    />

    <!-- Модалка удаления группы -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы аттестации"
      :message="`Вы уверены, что хотите удалить группу «${group?.name}»? Действие необратимо.`"
      confirm-text="Удалить навсегда"
      cancel-text="Отмена"
      variant="danger"
      :loading="deletingGroup"
      @confirm="confirmDeleteGroup"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Settings,
  FileText,
  Users,
  Gavel,
  CheckCircle2,
  XCircle,
  FileCheck,
  Award,
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  X,
  UserPlus,
  Crown,
  CalendarClock,
  Save,
  AlertTriangle,
  Info,
  ChevronDown,
} from "lucide-vue-next";
import AttestationSelectInstructorsModal from "~/components/attestation/SelectInstructorsModal.vue";
import AttestationSelectCommissionModal from "~/components/attestation/SelectCommissionModal.vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useToast();

const groupId = route.params.id as string;

const loading = ref(true);
const group = ref<any>(null);
const instructors = ref<any[]>([]);
const commission = ref<any[]>([]);
const results = ref<any[]>([]);
const testTemplates = ref<any[]>([]);
const certificateTemplates = ref<any[]>([]);

type TabId = "participants" | "commission" | "settings";
type StatusFilterId = "all" | "passed" | "failed" | "pending" | "none";

const activeTab = ref<TabId>("participants");
const searchInstructor = ref("");
const statusFilter = ref<StatusFilterId>("all");

const showInstructorsModal = ref(false);
const showCommissionModal = ref(false);
const showDeleteModal = ref(false);

const decideTarget = ref<{ result: any; decision: "passed" | "failed" } | null>(null);
const deciding = ref(false);
const instructorToRemove = ref<any>(null);
const removingInstructor = ref(false);
const commissionMemberToRemove = ref<any>(null);
const removingCommissionMember = ref(false);

const savingSchedule = ref(false);
const savingCertTemplate = ref(false);
const savingInfo = ref(false);
const deletingGroup = ref(false);
const generatingProtocol = ref(false);

const scheduleForm = ref({ testTemplateId: "", examStart: "", examEnd: "", location: "" });
const certTemplateId = ref("");
const infoForm = ref({ name: "", status: "draft", description: "" });

const chairman = computed(() => commission.value.find((c) => c.role === "chairman") || null);
const sortedCommission = computed(() => {
  const list = [...commission.value];
  const roleWeight: Record<string, number> = { chairman: 1, responsible: 2, secretary: 3, member: 4 };
  return list.sort((a, b) => (roleWeight[a.role] || 9) - (roleWeight[b.role] || 9));
});

const passedCount = computed(() => results.value.filter((r) => r.decision === "passed").length);
const failedCount = computed(() => results.value.filter((r) => r.decision === "failed").length);
const pendingCount = computed(() => results.value.filter((r) => r.decision !== "passed" && r.decision !== "failed" && r.attempts > 0).length);
const noneCount = computed(() => results.value.filter((r) => r.attempts === 0 && r.decision !== "passed" && r.decision !== "failed").length);
const passedPercent = computed(() => (results.value.length ? Math.round((passedCount.value / results.value.length) * 100) : 0));

const statusFilters = computed<Array<{ id: StatusFilterId; label: string; count: number }>>(() => [
  { id: "all", label: "Все", count: results.value.length },
  { id: "passed", label: "Сдали", count: passedCount.value },
  { id: "failed", label: "Не сдали", count: failedCount.value },
  { id: "pending", label: "Ожидают", count: pendingCount.value },
  { id: "none", label: "Не сдавали", count: noneCount.value },
]);

const filteredResults = computed(() => {
  let list = results.value;
  if (statusFilter.value === "passed") {
    list = list.filter((r) => r.decision === "passed");
  } else if (statusFilter.value === "failed") {
    list = list.filter((r) => r.decision === "failed");
  } else if (statusFilter.value === "pending") {
    list = list.filter((r) => r.decision !== "passed" && r.decision !== "failed" && r.attempts > 0);
  } else if (statusFilter.value === "none") {
    list = list.filter((r) => r.attempts === 0 && r.decision !== "passed" && r.decision !== "failed");
  }

  if (searchInstructor.value.trim()) {
    const q = searchInstructor.value.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.specialty && r.specialty.toLowerCase().includes(q)) ||
        (r.positionSnapshot && r.positionSnapshot.toLowerCase().includes(q)),
    );
  }
  return list;
});

const tabs = computed<Array<{ id: TabId; label: string; icon: any; badge?: number }>>(() => [
  { id: "participants", label: "Инструкторы и результаты", icon: Users, badge: instructors.value.length },
  { id: "commission", label: "Комиссия", icon: Gavel, badge: commission.value.length },
  { id: "settings", label: "Параметры и расписание", icon: Settings },
]);

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
};

const formatDateTime = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const statusClass = computed(() => {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    scheduled: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    cancelled: "bg-danger/10 text-danger border-danger/20",
  };
  return group.value ? map[group.value.status] || map.draft : "";
});

const statusText = computed(() => {
  const map: Record<string, string> = {
    draft: "Черновик",
    scheduled: "Запланирована",
    in_progress: "Идёт экзамен",
    completed: "Завершена",
    cancelled: "Отменена",
  };
  return group.value ? map[group.value.status] || group.value.status : "";
});

const roleLabel = (role: string) =>
  ({ chairman: "Председатель", responsible: "Ответственный", secretary: "Секретарь", member: "Член комиссии" }[role] || "Член комиссии");

const decisionLabel = (r: any) => {
  if (r?.decision === "passed") return "Сдан";
  if (r?.decision === "failed") return "Не сдан";
  if (!r || r.attempts === 0) return "Не проходил";
  return "Ожидает решения";
};

const decisionBadgeClass = (r: any) => {
  if (r?.decision === "passed") return "bg-success/10 text-success border-success/20";
  if (r?.decision === "failed") return "bg-danger/10 text-danger border-danger/20";
  if (r?.attempts > 0) return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  return "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
};

const load = async () => {
  loading.value = true;
  try {
    const [groupRes, resultsRes, templatesRes, certTemplatesRes] = await Promise.all([
      authFetch(`/api/attestation/groups/${groupId}`),
      authFetch(`/api/attestation/groups/${groupId}/results`),
      authFetch("/api/test-bank/templates?limit=100"),
      authFetch("/api/certificates/templates?isActive=true"),
    ]);

    if (groupRes.success) {
      group.value = groupRes.group;
      instructors.value = groupRes.instructors || [];
      commission.value = groupRes.commission || [];

      scheduleForm.value = {
        testTemplateId: group.value.testTemplateId || "",
        examStart: toLocalInput(group.value.examStart),
        examEnd: toLocalInput(group.value.examEnd),
        location: group.value.location || "",
      };
      certTemplateId.value = group.value.certificateTemplateId || "";
      infoForm.value = {
        name: group.value.name || "",
        status: group.value.status || "draft",
        description: group.value.description || "",
      };
    } else {
      toast.error(groupRes.message || "Группа не найдена");
    }

    if (resultsRes.success) results.value = resultsRes.results || [];
    if (templatesRes.success) testTemplates.value = templatesRes.templates || [];
    if (certTemplatesRes.success) certificateTemplates.value = certTemplatesRes.templates || [];
  } finally {
    loading.value = false;
  }
};

const refreshResults = async () => {
  const resultsRes = await authFetch(`/api/attestation/groups/${groupId}/results`);
  if (resultsRes.success) results.value = resultsRes.results || [];
};

const refreshGroup = async () => {
  const groupRes = await authFetch(`/api/attestation/groups/${groupId}`);
  if (groupRes.success) {
    group.value = groupRes.group;
    instructors.value = groupRes.instructors || [];
    commission.value = groupRes.commission || [];
  }
};

const onInstructorsAdded = async () => {
  await Promise.all([refreshGroup(), refreshResults()]);
};

const onCommissionSaved = (updatedCommission: any[]) => {
  commission.value = updatedCommission;
};

const requestRemoveInstructor = (instructor: any) => {
  instructorToRemove.value = instructor;
};

const confirmRemoveInstructor = async () => {
  if (!instructorToRemove.value) return;
  removingInstructor.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/instructors/${instructorToRemove.value.instructorId}`, {
      method: "DELETE",
    });
    if (res.success) {
      toast.success("Инструктор удалён из группы");
      instructorToRemove.value = null;
      await Promise.all([refreshGroup(), refreshResults()]);
    } else {
      toast.error(res.message || "Не удалось удалить инструктора");
    }
  } finally {
    removingInstructor.value = false;
  }
};

const requestRemoveCommissionMember = (member: any) => {
  commissionMemberToRemove.value = member;
};

const confirmRemoveCommissionMember = async () => {
  if (!commissionMemberToRemove.value) return;
  const remaining = commission.value
    .filter((c) => c.commissionMemberId !== commissionMemberToRemove.value.commissionMemberId)
    .map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }));

  if (remaining.length === 0) {
    toast.error("В комиссии должен остаться хотя бы один член");
    commissionMemberToRemove.value = null;
    return;
  }
  if (!remaining.some((c) => c.role === "chairman")) {
    toast.error("Нельзя удалить единственного председателя. Сначала назначьте другого председателя.");
    commissionMemberToRemove.value = null;
    return;
  }

  removingCommissionMember.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/commission`, {
      method: "PUT",
      body: { members: remaining },
    });
    if (res.success) {
      commission.value = res.commission;
      toast.success("Член комиссии удалён");
      commissionMemberToRemove.value = null;
    } else {
      toast.error(res.message || "Не удалось сохранить изменения");
    }
  } finally {
    removingCommissionMember.value = false;
  }
};

const requestDecide = (result: any, decision: "passed" | "failed") => {
  decideTarget.value = { result, decision };
};

const confirmDecide = async () => {
  if (!decideTarget.value) return;
  const { result, decision } = decideTarget.value;
  deciding.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/instructors/${result.instructorId}/decide`, {
      method: "POST",
      body: { decision },
    });
    if (res.success) {
      decideTarget.value = null;
      if (res.certificateIssued) {
        toast.success("Решение зафиксировано, сертификат автоматически выдан");
        await refreshResults();
      } else {
        const idx = results.value.findIndex((r) => r.instructorId === result.instructorId);
        if (idx >= 0) results.value[idx] = { ...results.value[idx], id: res.result.id, decision };
        toast.success("Решение сохранено");
      }
    } else {
      toast.error(res.message || "Не удалось сохранить решение");
    }
  } finally {
    deciding.value = false;
  }
};

const openEvaluationSheet = (result: any) => {
  if (result.evaluationSheetUrl) {
    window.open(result.evaluationSheetUrl, "_blank");
  } else {
    generateEvaluationSheet(result);
  }
};

const generateEvaluationSheet = async (result: any) => {
  const res = await authFetch(
    `/api/attestation/groups/${groupId}/instructors/${result.instructorId}/documents/evaluation-sheet`,
    { method: "POST" },
  );
  if (res.success) {
    const idx = results.value.findIndex((r) => r.instructorId === result.instructorId);
    if (idx >= 0) results.value[idx] = { ...results.value[idx], evaluationSheetFileId: res.file.id, evaluationSheetUrl: res.file.url };
    window.open(res.file.url, "_blank");
  } else {
    toast.error(res.message || "Не удалось сформировать оценочный лист");
  }
};

const generateProtocol = async () => {
  generatingProtocol.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/documents/protocol`, { method: "POST" });
    if (res.success) {
      group.value.protocolFileId = res.file.id;
      window.open(res.file.url, "_blank");
      toast.success("Протокол сформирован");
    } else {
      toast.error(res.message || "Не удалось сформировать протокол");
    }
  } finally {
    generatingProtocol.value = false;
  }
};

const saveSchedule = async () => {
  if (!scheduleForm.value.testTemplateId || !scheduleForm.value.examStart || !scheduleForm.value.examEnd) {
    toast.error("Укажите тест, дату начала и дату окончания экзамена");
    return;
  }
  savingSchedule.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/schedule`, {
      method: "PUT",
      body: {
        testTemplateId: scheduleForm.value.testTemplateId,
        examStart: new Date(scheduleForm.value.examStart).toISOString(),
        examEnd: new Date(scheduleForm.value.examEnd).toISOString(),
        location: scheduleForm.value.location,
      },
    });
    if (res.success) {
      group.value = res.group;
      toast.success("Расписание успешно обновлено");
    } else {
      toast.error(res.message || "Не удалось сохранить расписание");
    }
  } finally {
    savingSchedule.value = false;
  }
};

const saveCertTemplate = async () => {
  savingCertTemplate.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}/certificate-template`, {
      method: "PUT",
      body: { certificateTemplateId: certTemplateId.value || null },
    });
    if (res.success) {
      group.value = res.group;
      toast.success(certTemplateId.value ? "Шаблон сертификата сохранён" : "Автовыдача сертификатов отключена");
    } else {
      toast.error(res.message || "Не удалось сохранить шаблон сертификата");
    }
  } finally {
    savingCertTemplate.value = false;
  }
};

const saveGroupInfo = async () => {
  if (!infoForm.value.name.trim()) {
    toast.error("Укажите название группы");
    return;
  }
  savingInfo.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}`, {
      method: "PUT",
      body: {
        name: infoForm.value.name,
        status: infoForm.value.status,
        description: infoForm.value.description,
      },
    });
    if (res.success) {
      group.value = { ...group.value, ...res.group };
      toast.success("Данные группы успешно обновлены");
    } else {
      toast.error(res.message || "Не удалось обновить данные группы");
    }
  } finally {
    savingInfo.value = false;
  }
};

const confirmDeleteGroup = async () => {
  deletingGroup.value = true;
  try {
    const res = await authFetch(`/api/attestation/groups/${groupId}`, { method: "DELETE" });
    if (res.success) {
      toast.success("Группа аттестации удалена");
      await navigateTo("/attestation");
    } else {
      toast.error(res.message || "Не удалось удалить группу");
    }
  } finally {
    deletingGroup.value = false;
  }
};

onMounted(load);
</script>
