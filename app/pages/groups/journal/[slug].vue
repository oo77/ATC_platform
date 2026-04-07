<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка журнала...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center">
        <svg
          class="mx-auto h-16 w-16 text-danger"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Ошибка загрузки
        </h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">{{ error }}</p>
        <UiButton class="mt-6" @click="loadJournal">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <div class="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <NuxtLink to="/groups" class="hover:text-primary transition-colors">Учебные группы</NuxtLink>
            <ChevronRight class="w-4 h-4 text-slate-300" />
            <NuxtLink :to="`/groups/${groupId}`" class="hover:text-primary transition-colors">{{ groupCode }}</NuxtLink>
            <ChevronRight class="w-4 h-4 text-slate-300" />
            <span class="text-slate-900 dark:text-white">Журнал</span>
          </div>
        </div>

        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-info/10 text-info shadow-inner border border-info/10">
              <BookOpen class="w-8 h-8" />
            </div>
            <div>
              <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {{ disciplineName || "Журнал" }}
              </h1>
              <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">
                <span v-if="instructorName" class="text-slate-700 dark:text-slate-300">{{ instructorName }} • </span>
                Журнал посещаемости и оценок
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-4">
            <!-- Статистика Bento -->
            <div class="hidden md:flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-2 gap-2">
              <div class="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Студентов</p>
                <p class="text-lg font-black text-slate-900 dark:text-white">{{ summary?.totalStudents || 0 }}</p>
              </div>
              <div class="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Занятий</p>
                <p class="text-lg font-black text-slate-900 dark:text-white">{{ summary?.totalEvents || 0 }}</p>
              </div>
              <div class="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ср. посещ.</p>
                <p class="text-lg font-black" :class="getAttendanceColor(summary?.averageAttendance || 0)">
                  {{ (summary?.averageAttendance || 0).toFixed(1) }}%
                </p>
              </div>
            </div>

            <!-- Download button -->
            <div v-if="columns.length > 0" class="relative">
              <UiButton
                @click="toggleReportDropdown"
                :disabled="generatingPdf"
                variant="primary"
                class="shadow-md shadow-primary/20 h-[60px] px-6 rounded-2xl text-base"
              >
                <Loader2 v-if="generatingPdf" class="w-5 h-5 mr-2 animate-spin" />
                <Download v-else class="w-5 h-5 mr-2" />
                <span class="hidden xl:inline">{{ generatingPdf ? "Генерация..." : "Ведомость" }}</span>
                <ChevronDown class="w-5 h-5 ml-2 opacity-70" />
              </UiButton>

              <div
                v-if="showReportDropdown"
                class="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden animate-in zoom-in-95 duration-200"
              >
                <button
                  @click="downloadReport('pdf')"
                  class="w-full px-4 py-3 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800"
                >
                  <FileText class="w-5 h-5 text-danger" />
                  <span>Скачать PDF</span>
                </button>
                <button
                  @click="downloadReport('docx')"
                  class="w-full px-4 py-3 text-left text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 text-slate-700 dark:text-slate-300"
                >
                  <FileText class="w-5 h-5 text-primary" />
                  <span>Скачать Word</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустое состояние - нет занятий -->
      <div
        v-if="columns.length === 0"
        class="rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-16 text-center animate-in fade-in zoom-in-95 duration-500"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar class="w-10 h-10 text-slate-400" />
        </div>
        <h3 class="text-2xl font-black text-slate-900 dark:text-white">
          Занятия не найдены
        </h3>
        <p class="mt-2 text-slate-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
          Для этой дисциплины ещё нет запланированных занятий. Добавьте занятия в расписание, чтобы вести журнал.
        </p>
        <NuxtLink
          :to="`/schedule?groupId=${groupId}`"
        >
          <UiButton variant="primary" class="mt-8 shadow-md rounded-xl h-[46px] px-6">
            <CalendarPlus class="w-5 h-5 mr-2" />
            Перейти к расписанию
          </UiButton>
        </NuxtLink>
      </div>

      <!-- Панель массовых операций (Bento Box) -->
      <div
        v-if="columns.length > 0 && !isArchived"
        class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div class="flex-1">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings2 class="w-4 h-4 text-slate-400" />
            Управление занятием
          </h3>
          <p class="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-1">
            Выберите занятие для массовой отметки посещаемости или оценки
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4">
          <!-- Выбор занятия -->
          <div class="relative w-full md:w-64 shrink-0">
            <select
              v-model="selectedEventId"
              class="w-full appearance-none rounded-xl border-1.5 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer truncate pr-10"
            >
              <option value="">— Выберите занятие —</option>
              <option v-for="col in columns" :key="col.scheduleEvent.id" :value="col.scheduleEvent.id">
                {{ formatColumnDate(col.scheduleEvent.date) }} {{ formatTimeRange(col.scheduleEvent.startTime, col.scheduleEvent.endTime) }} {{ col.hasGrade ? "(с оценкой)" : "" }}
              </option>
            </select>
            <ChevronDown class="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <!-- Значок статуса доступа -->
          <div v-if="selectedEventId && markingAccess" class="shrink-0 flex items-center justify-center">
            <Loader2 v-if="accessLoading" class="animate-spin h-5 w-5 text-slate-400" />
            <div
              v-else-if="markingAccess.status === 'allowed'"
              class="inline-flex items-center justify-center h-10 px-3 text-xs font-bold rounded-xl bg-success/10 text-success"
            >
              <CheckCircle2 class="w-4 h-4 mr-1.5" />
              Доступно
            </div>
            <div
              v-else-if="markingAccess.status === 'late'"
              class="inline-flex items-center justify-center h-10 px-3 text-xs font-bold rounded-xl bg-warning/10 text-warning"
            >
              <AlertTriangle class="w-4 h-4 mr-1.5" />
              Опоздание
            </div>
            <div
              v-else-if="markingAccess.status === 'requires_approval'"
              class="inline-flex items-center justify-center h-10 px-3 text-xs font-bold rounded-xl bg-danger/10 text-danger"
            >
              <HelpCircle class="w-4 h-4 mr-1.5" />
              Требует одобрения
            </div>
            <div
              v-else-if="markingAccess.status === 'denied'"
              class="inline-flex items-center justify-center h-10 px-3 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500"
            >
              <XCircle class="w-4 h-4 mr-1.5" />
              Недоступно
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="flex flex-wrap gap-2 shrink-0">
            <UiButton
              variant="secondary"
              class="h-[46px] rounded-xl px-4"
              :disabled="!selectedEventId || markingAccess?.status === 'denied'"
              @click="openBulkAttendanceModal"
            >
              <CheckSquare class="w-4 h-4 sm:mr-2" />
              <span class="hidden sm:inline">Отметить всех</span>
            </UiButton>

            <UiButton
              v-if="selectedEvent?.hasGrade"
              variant="outline"
              class="h-[46px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-4"
              :disabled="!selectedEventId"
              @click="openBulkGradeModal"
            >
              <Award class="w-4 h-4 text-warning sm:mr-2" />
              <span class="hidden sm:inline">Оценка всем</span>
            </UiButton>

            <!-- Кнопка массовых итоговых оценок -->
            <UiButton
              variant="outline"
              class="h-[46px] rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-4 ml-auto"
              :disabled="rows.length === 0"
              @click="openBulkFinalGradeModal"
            >
              <GraduationCap class="w-4 h-4 text-success sm:mr-2" />
              <span class="hidden sm:inline">Итог. оценки</span>
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Таблица журнала -->
      <div
        v-if="columns.length > 0"
        class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full min-w-max text-left border-collapse">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <!-- Заголовок студента -->
                <th class="sticky left-0 z-10 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-sm px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest min-w-[200px] border-r border-slate-200 dark:border-slate-800/50">
                  Слушатель
                </th>
                <!-- Заголовки занятий -->
                <th
                  v-for="column in columns"
                  :key="column.scheduleEvent.id"
                  class="px-2 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest min-w-[80px]"
                >
                  <div class="flex flex-col items-center gap-1.5">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                        :class="{
                          'bg-purple-500': column.scheduleEvent.isRetake,
                          'bg-blue-500':
                            !column.scheduleEvent.isRetake &&
                            column.scheduleEvent.eventType === 'theory',
                          'bg-green-500':
                            !column.scheduleEvent.isRetake &&
                            column.scheduleEvent.eventType === 'practice',
                          'bg-orange-500':
                            !column.scheduleEvent.isRetake &&
                            column.scheduleEvent.eventType === 'assessment',
                          'bg-slate-400':
                            !column.scheduleEvent.isRetake &&
                            column.scheduleEvent.eventType === 'other',
                        }"
                      ></span>
                      <span
                        v-if="column.scheduleEvent.isRetake"
                        class="inline-flex items-center justify-center w-4 h-4 text-[9px] font-black bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-sm"
                        title="Режим пересдачи"
                      >
                        П
                      </span>
                    </div>
                    <span class="text-slate-700 dark:text-slate-300">{{ formatColumnDate(column.scheduleEvent.date) }}</span>
                    <span class="text-[9px] text-slate-400/80">{{ formatTimeRange(column.scheduleEvent.startTime, column.scheduleEvent.endTime) }}</span>
                  </div>
                </th>
                <!-- Итоги -->
                <th class="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[80px] bg-slate-100/50 dark:bg-slate-800/80 border-l border-slate-200/60 dark:border-slate-800/60">
                  Посещ. %
                </th>
                <th class="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[80px] bg-slate-100/50 dark:bg-slate-800/80">
                  Ср. оценка
                </th>
                <th class="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest min-w-[100px] bg-slate-100/50 dark:bg-slate-800/80">
                  Итог
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr
                v-for="row in rows"
                :key="row.student.id"
                class="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <!-- Имя студента -->
                <td
                  class="sticky left-0 z-10 bg-white group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800/30 px-4 py-3 border-r border-slate-200 dark:border-slate-800/50 transition-colors"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10 text-sm font-bold shadow-inner"
                    >
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <span
                      class="font-bold text-slate-900 dark:text-white text-sm"
                      :title="row.student.fullName"
                    >
                      {{ row.student.fullName }}
                    </span>
                  </div>
                </td>
                <!-- Ячейки посещаемости/оценок -->
                <td
                  v-for="(cell, cellIndex) in row.cells"
                  :key="cell.scheduleEventId"
                  class="px-2 py-3 text-center"
                >
                  <AttendanceCell
                    v-if="columns[cellIndex]"
                    :cell="cell"
                    :column="columns[cellIndex]!"
                    :student-id="row.student.id"
                    :is-retake-target="
                      getRetakeInfo(
                        row.student.id,
                        columns[cellIndex]!.scheduleEvent.id,
                      ).isRetakeTarget
                    "
                    :replacement-grade="
                      getRetakeInfo(
                        row.student.id,
                        columns[cellIndex]!.scheduleEvent.id,
                      ).replacementGrade
                    "
                    :read-only="isArchived"
                    @update="handleCellUpdate"
                    @require-approval="handleRequireApproval"
                  />
                </td>
                <!-- Процент посещаемости -->
                <td
                  class="px-4 py-3 text-center bg-slate-50/50 dark:bg-slate-800/30 border-l border-slate-200/60 dark:border-slate-800/60"
                >
                  <span
                    class="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ring-1 ring-inset"
                    :class="[getAttendanceColor(row.attendancePercent).replace('text-', 'ring-').split(' ')[0], getAttendanceColor(row.attendancePercent)]"
                  >
                    {{ row.attendancePercent.toFixed(1) }}%
                  </span>
                </td>
                <!-- Средняя оценка -->
                <td
                  class="px-4 py-3 text-center bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <span
                    v-if="row.averageGrade !== undefined"
                    class="text-sm font-black text-slate-900 dark:text-white"
                  >
                    {{ row.averageGrade.toFixed(0) }}
                  </span>
                  <span v-else class="text-slate-400 font-bold">—</span>
                </td>
                <!-- Итоговая оценка -->
                <td
                  class="px-4 py-3 text-center bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <FinalGradeCell
                    :final-grade="row.finalGrade"
                    :student-id="row.student.id"
                    :group-id="groupId"
                    :discipline-id="disciplineId"
                    :attendance-percent="row.attendancePercent"
                    :read-only="isArchived"
                    @update="handleFinalGradeUpdate"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Легенда -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-800/30">
          <span class="font-bold uppercase tracking-wider text-[11px] text-slate-400">Типы занятий:</span>
          <span class="flex items-center gap-2 font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm"></span>
            Теория
          </span>
          <span class="flex items-center gap-2 font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"></span>
            Практика (с оценкой)
          </span>
          <span class="flex items-center gap-2 font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
            Проверка знаний (с оценкой)
          </span>
          <span class="flex items-center gap-2 font-medium">
            <span class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm"></span>
            Пересдача
          </span>

          <span class="mx-2 text-slate-300 dark:text-slate-700">|</span>

          <span class="font-bold uppercase tracking-wider text-[11px] text-slate-400">Оценки:</span>
          <span class="flex items-center gap-2 font-medium" title="Автоматическая оценка из теста">
            <span class="relative w-6 h-6 rounded-md bg-success/10 flex items-center justify-center text-xs font-bold text-success border border-success/20">
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"></span>
              85
            </span>
            Из теста
          </span>
          <span class="flex items-center gap-2 font-medium" title="Ручная оценка за практику">
            <span class="relative w-6 h-6 rounded-md bg-success/10 flex items-center justify-center text-xs font-bold text-success border border-success/20">
              90
            </span>
            Ручная
          </span>
          <span class="flex items-center gap-2 font-medium" title="Изменённая оценка">
            <span class="relative w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-xs font-bold text-purple-700 dark:text-purple-300 ring-2 ring-purple-400 ring-offset-1 dark:ring-offset-slate-900">
              <span class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900"></span>
              78
            </span>
            Изменена
          </span>
        </div>
      </div>
    </template>

    <!-- Модальное окно массовой отметки посещаемости -->
    <UiModal
      :is-open="showBulkAttendanceModal"
      title="Массовая отметка посещаемости"
      size="md"
      @close="showBulkAttendanceModal = false"
    >
      <div class="space-y-4">
        <div v-if="selectedEvent">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Занятие: {{ formatColumnDate(selectedEvent.scheduleEvent.date) }}
            {{
              formatTimeRange(
                selectedEvent.scheduleEvent.startTime,
                selectedEvent.scheduleEvent.endTime,
              )
            }}
            ({{ selectedEvent.scheduleEvent.academicHours }} а-ч)
          </p>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Часы посещения для всех (из {{ selectedEvent.scheduleEvent.academicHours }})
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="bulkAttendanceHours"
                type="number"
                step="0.5"
                min="0"
                :max="selectedEvent.scheduleEvent.academicHours"
                class="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <span class="text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">а-ч</span>
            </div>

            <!-- Быстрые кнопки -->
            <div class="flex gap-2 mt-4">
              <button
                class="px-4 py-2 rounded-xl border text-sm font-bold transition-colors shadow-sm"
                :class="
                  bulkAttendanceHours === 0
                    ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                "
                @click="bulkAttendanceHours = 0"
              >
                Никто (0)
              </button>
              <button
                class="px-4 py-2 rounded-xl border text-sm font-bold transition-colors shadow-sm"
                :class="
                  bulkAttendanceHours === selectedEvent.scheduleEvent.academicHours
                    ? 'bg-primary text-white border-primary ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                "
                @click="bulkAttendanceHours = selectedEvent.scheduleEvent.academicHours"
              >
                Все ({{ selectedEvent.scheduleEvent.academicHours }})
              </button>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Будет отмечено {{ getEligibleStudentsCount() }} слушателей
              <span
                v-if="selectedEvent.scheduleEvent.isRetake"
                class="text-purple-600 dark:text-purple-400 font-medium"
              >
                (только участники пересдачи)
              </span>
            </p>

            <!-- Список участников пересдачи -->
            <div
              v-if="
                selectedEvent.scheduleEvent.isRetake &&
                selectedEvent.scheduleEvent.allowedStudentIds
              "
              class="mt-3"
            >
              <p
                class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Участники пересдачи:
              </p>
              <div
                class="max-h-32 overflow-y-auto bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800"
              >
                <div class="space-y-1">
                  <div
                    v-for="student in getEligibleStudents()"
                    :key="student.id"
                    class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    {{ student.fullName }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showBulkAttendanceModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="bulkSaving" @click="saveBulkAttendance">
            Отметить всех
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно массового выставления оценок -->
    <UiModal
      :is-open="showBulkGradeModal"
      title="Массовое выставление оценок"
      size="md"
      @close="showBulkGradeModal = false"
    >
      <div class="space-y-4">
        <div v-if="selectedEvent">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Занятие: {{ formatColumnDate(selectedEvent.scheduleEvent.date) }}
            {{
              formatTimeRange(
                selectedEvent.scheduleEvent.startTime,
                selectedEvent.scheduleEvent.endTime,
              )
            }}
          </p>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Оценка для всех (0-100)
            </label>
            <input
              v-model.number="bulkGradeValue"
              type="number"
              min="0"
              max="100"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            <!-- Быстрые кнопки оценок -->
            <div class="flex flex-wrap gap-2 mt-3">
              <button
                v-for="grade in [100, 90, 80, 70, 60]"
                :key="grade"
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                :class="
                  bulkGradeValue === grade
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                "
                @click="bulkGradeValue = grade"
              >
                {{ grade }}
              </button>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Будет выставлено {{ getEligibleStudentsCount() }} оценок
              <span
                v-if="selectedEvent.scheduleEvent.isRetake"
                class="text-purple-600 dark:text-purple-400 font-medium"
              >
                (только участники пересдачи)
              </span>
            </p>

            <!-- Список участников пересдачи -->
            <div
              v-if="
                selectedEvent.scheduleEvent.isRetake &&
                selectedEvent.scheduleEvent.allowedStudentIds
              "
              class="mt-3"
            >
              <p
                class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Участники пересдачи:
              </p>
              <div
                class="max-h-32 overflow-y-auto bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800"
              >
                <div class="space-y-1">
                  <div
                    v-for="student in getEligibleStudents()"
                    :key="student.id"
                    class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    {{ student.fullName }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showBulkGradeModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="bulkSaving" @click="saveBulkGrade">
            Выставить оценки
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно массового выставления итоговых оценок -->
    <UiModal
      :is-open="showBulkFinalGradeModal"
      title="Массовое выставление итоговых оценок"
      size="lg"
      @close="showBulkFinalGradeModal = false"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Выставить итоговые оценки всем слушателям по дисциплине
          <span class="font-medium text-gray-900 dark:text-white">{{
            disciplineName
          }}</span>
        </p>

        <!-- Режим выставления -->
        <div class="space-y-3">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Режим выставления
          </label>

          <div class="space-y-2">
            <label
              class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="
                bulkFinalGradeMode === 'average'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              "
            >
              <input
                v-model="bulkFinalGradeMode"
                type="radio"
                value="average"
                class="mt-0.5"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  По средней оценке
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Итоговая оценка = средняя оценка за занятия. Статус
                  определяется автоматически.
                </p>
              </div>
            </label>

            <label
              class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
              :class="
                bulkFinalGradeMode === 'custom'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              "
            >
              <input
                v-model="bulkFinalGradeMode"
                type="radio"
                value="custom"
                class="mt-0.5"
              />
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  Единая оценка всем
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Выставить одинаковую оценку всем слушателям.
                </p>
              </div>
            </label>
          </div>
        </div>

        <!-- Единая оценка (если выбран режим custom) -->
        <div v-if="bulkFinalGradeMode === 'custom'" class="space-y-2">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Оценка для всех (0-100)
          </label>
          <input
            v-model.number="bulkFinalGradeValue"
            type="number"
            min="0"
            max="100"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div class="flex flex-wrap gap-2">
            <button
              v-for="grade in [100, 90, 80, 70, 60]"
              :key="grade"
              class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
              :class="
                bulkFinalGradeValue === grade
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              "
              @click="bulkFinalGradeValue = grade"
            >
              {{ grade }}
            </button>
          </div>
        </div>

        <!-- Порог прохождения -->
        <div class="space-y-2">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Порог для статуса "Сдано" (%)
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="bulkFinalGradeThreshold"
              type="number"
              min="0"
              max="100"
              class="w-24 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Оценка ≥ {{ bulkFinalGradeThreshold }} → "Сдано", иначе → "Не
              сдано"
            </span>
          </div>
        </div>

        <!-- Предпросмотр -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Предпросмотр ({{ rows.length }} слушателей)
          </h4>
          <div
            class="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
          >
            <div class="space-y-2">
              <div
                v-for="row in rows"
                :key="row.student.id"
                class="flex items-center justify-between text-sm"
              >
                <span class="text-gray-900 dark:text-white">{{
                  row.student.fullName
                }}</span>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="
                      getPreviewGrade(row) >= bulkFinalGradeThreshold
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    "
                  >
                    {{ getPreviewGrade(row) }}
                  </span>
                  <span
                    class="text-xs"
                    :class="
                      getPreviewGrade(row) >= bulkFinalGradeThreshold
                        ? 'text-success'
                        : 'text-danger'
                    "
                  >
                    {{
                      getPreviewGrade(row) >= bulkFinalGradeThreshold
                        ? "Сдано"
                        : "Не сдано"
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UiButton variant="outline" @click="showBulkFinalGradeModal = false">
            Отмена
          </UiButton>
          <UiButton :loading="bulkSaving" @click="saveBulkFinalGrade">
            Выставить итоговые оценки
          </UiButton>
        </div>
      </div>
    </UiModal>

    <!-- Модальное окно предупреждения об опоздании -->
    <LateMarkingModal
      v-model="showLateMarkingModal"
      :event-title="selectedEvent?.scheduleEvent.title || ''"
      :event-date="selectedEvent?.scheduleEvent.startTime || ''"
      :deadline="markingAccess?.deadline || ''"
      :status="
        markingAccess?.status === 'requires_approval'
          ? 'requires_approval'
          : 'late'
      "
      @confirm="handleLateMarkingConfirm"
      @request-approval="handleRequestApproval"
      @cancel="showLateMarkingModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ChevronRight, BookOpen, Download, ChevronDown, FileText, Settings2, CheckSquare, Award, GraduationCap, Calendar, CalendarPlus, Loader2, CheckCircle2, AlertTriangle, HelpCircle, XCircle } from "lucide-vue-next";
import AttendanceCell from "~/components/attendance/AttendanceCell.vue";
import FinalGradeCell from "~/components/attendance/FinalGradeCell.vue";
import LateMarkingModal from "~/components/attendance/LateMarkingModal.vue";
import {
  MARKING_STATUS_LABELS,
  MARKING_STATUS_COLORS,
  type MarkingAccessCheckResult,
} from "~/types/attendanceMarking";
import { generateGroupReport } from "~/utils/pdf/generateGroupReport";

definePageMeta({
  layout: "default",
});

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: "theory" | "practice" | "assessment" | "other";
    academicHours: number;
    isRetake?: boolean;
    allowedStudentIds?: string[] | null;
    originalEventId?: string | null;
  };
  hasGrade: boolean;
}

interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes: string | null;
  };
  grade?: {
    id: string;
    grade: number;
    notes: string | null;
    isFromTest?: boolean;
    isModified?: boolean;
    originalGrade?: number | null;
  };
  isHidden?: boolean;
}

interface FinalGrade {
  id: string;
  finalGrade?: number;
  attendancePercent?: number;
  status: "in_progress" | "passed" | "failed" | "not_allowed";
  notes?: string;
}

interface JournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string | null;
  };
  cells: JournalCell[];
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  averageGrade?: number;
  assessmentCount: number;
  finalGrade?: FinalGrade;
}

interface JournalSummary {
  totalStudents: number;
  totalEvents: number;
  averageAttendance: number;
  passedCount: number;
  failedCount: number;
  inProgressCount: number;
}

const route = useRoute();
const { authFetch } = useAuthFetch();
const toast = useNotification();

// Route params - используем slug с разделителем _
const slug = computed(() => route.params.slug as string);
const groupId = computed(() => slug.value?.split("_")[0] || "");
const disciplineId = computed(() => slug.value?.split("_")[1] || "");

// State
const loading = ref(true);
const error = ref<string | null>(null);
const columns = ref<JournalColumn[]>([]);
const rows = ref<JournalRow[]>([]);
const summary = ref<JournalSummary | null>(null);
const groupCode = ref("");
const disciplineName = ref("");
const courseName = ref("");
const instructorName = ref("");
const isArchived = ref(false);

// Bulk operations state
const selectedEventId = ref("");
const showBulkAttendanceModal = ref(false);
const showBulkGradeModal = ref(false);
const showBulkFinalGradeModal = ref(false);
const bulkSaving = ref(false);
const bulkAttendanceHours = ref(0);
const bulkGradeValue = ref(0);
const bulkFinalGradeMode = ref<"average" | "custom">("average");
const bulkFinalGradeValue = ref(100);
const bulkFinalGradeThreshold = ref(60);

// Marking access state
const markingAccess = ref<MarkingAccessCheckResult | null>(null);
const showLateMarkingModal = ref(false);
const lateMarkingReason = ref("");
const accessLoading = ref(false);

// PDF generation state
const generatingPdf = ref(false);
const showReportDropdown = ref(false); // Состояние выпадающего меню формата

// Computed - выбранное занятие
const selectedEvent = computed(() => {
  return columns.value.find(
    (col) => col.scheduleEvent.id === selectedEventId.value,
  );
});

// Load journal data
const loadJournal = async () => {
  loading.value = true;
  error.value = null;

  if (!groupId.value || !disciplineId.value) {
    error.value = "Неверный URL журнала";
    loading.value = false;
    return;
  }

  try {
    const response = await authFetch<{
      success: boolean;
      columns: JournalColumn[];
      rows: JournalRow[];
      summary: JournalSummary;
      message?: string;
    }>(
      `/api/attendance/journal?groupId=${groupId.value}&disciplineId=${disciplineId.value}`,
    );

    if (response.success) {
      columns.value = response.columns;
      rows.value = response.rows;
      summary.value = response.summary;
    } else {
      error.value = response.message || "Ошибка загрузки журнала";
    }
  } catch (err: any) {
    console.error("Error loading journal:", err);
    error.value = err.message || "Ошибка загрузки журнала";
  } finally {
    loading.value = false;
  }
};

// Load group and discipline info
const loadMeta = async () => {
  if (!groupId.value || !disciplineId.value) return;

  try {
    // Загружаем информацию о группе
    const groupResponse = await authFetch<{
      success: boolean;
      group?: {
        code: string;
        isArchived?: boolean;
        course?: { name: string };
      };
    }>(`/api/groups/${groupId.value}`);

    if (groupResponse.success && groupResponse.group) {
      groupCode.value = groupResponse.group.code;
      isArchived.value = !!groupResponse.group.isArchived;
      if (groupResponse.group.course?.name) {
        courseName.value = groupResponse.group.course.name;
      }
    }

    // Загружаем дисциплины группы (имеют инструкторов)
    const disciplinesResponse = await authFetch<{
      success: boolean;
      disciplines?: Array<{
        id: string;
        name: string;
        instructors?: Array<{
          id: string;
          fullName: string;
          isPrimary: boolean;
        }>;
      }>;
    }>(`/api/groups/${groupId.value}/disciplines`);

    if (disciplinesResponse.success && disciplinesResponse.disciplines) {
      // Ищем нужную дисциплину
      const discipline = disciplinesResponse.disciplines.find(
        (d) => d.id === disciplineId.value,
      );

      if (discipline) {
        disciplineName.value = discipline.name;

        // Формируем список инструкторов
        if (discipline.instructors && discipline.instructors.length > 0) {
          // Сначала основные, потом остальные
          const sorted = [...discipline.instructors].sort(
            (a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0),
          );

          // Показываем имена (до 2-х инструкторов)
          const names = sorted.slice(0, 2).map((i) => i.fullName);
          if (sorted.length > 2) {
            instructorName.value = `${names.join(", ")} и ещё ${
              sorted.length - 2
            }`;
          } else {
            instructorName.value = names.join(", ");
          }
        }
      } else {
        disciplineName.value = "Дисциплина";
      }
    }
  } catch (err) {
    console.error("Error loading meta:", err);
    disciplineName.value = "Дисциплина";
  }
};

// Helpers
const formatColumnDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
};

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startStr = start.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = end.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startStr}-${endStr}`;
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAttendanceColor = (percent: number) => {
  if (percent >= 75) return "text-success bg-success/10";
  if (percent >= 50) return "text-warning bg-warning/10";
  return "text-danger bg-danger/10";
};

// Получение информации о пересдаче для конкретной ячейки
const getRetakeInfo = (studentId: string, currentEventId: string) => {
  // Находим все колонки, которые являются пересдачами для текущего события
  const retakeColumns = columns.value.filter(
    (col) => col.scheduleEvent.originalEventId === currentEventId,
  );

  if (retakeColumns.length === 0)
    return { isRetakeTarget: false, replacementGrade: null };

  // Если есть пересдачи, ищем оценку студента за самую позднюю пересдачу
  const studentRow = rows.value.find((r) => r.student.id === studentId);
  if (!studentRow) return { isRetakeTarget: false, replacementGrade: null };

  let latestGrade: number | null = null;
  let latestDate: string | null = null;

  retakeColumns.forEach((retakeCol) => {
    const retakeColIndex = columns.value.findIndex(
      (c) => c.scheduleEvent.id === retakeCol.scheduleEvent.id,
    );
    if (retakeColIndex === -1) return;

    const cell = studentRow.cells[retakeColIndex];
    // Учитываем только видимые ячейки с оценками
    if (cell && cell.grade && !cell.isHidden) {
      if (!latestDate || retakeCol.scheduleEvent.date >= latestDate) {
        latestGrade = cell.grade.grade;
        latestDate = retakeCol.scheduleEvent.date;
      }
    }
  });

  if (latestGrade !== null) {
    return { isRetakeTarget: true, replacementGrade: latestGrade };
  }

  return { isRetakeTarget: true, replacementGrade: null };
};

// Event handlers
const handleCellUpdate = async (_data: {
  studentId: string;
  scheduleEventId: string;
  type: "attendance" | "grade";
}) => {
  await loadJournal();
};

// Обработка требования одобрения при одиночной отметке
const handleRequireApproval = (data: {
  scheduleEventId: string;
  message?: string;
}) => {
  // Устанавливаем выбранное занятие
  selectedEventId.value = data.scheduleEventId;
  // Обновляем статус доступа
  if (markingAccess.value) {
    markingAccess.value.status = "requires_approval";
    markingAccess.value.requiresApproval = true;
  }
  // Открываем модальное окно для создания запроса
  showLateMarkingModal.value = true;
};

const handleFinalGradeUpdate = async () => {
  await loadJournal();
};

// Функция переключения выпадающего меню формата ведомости
const toggleReportDropdown = () => {
  showReportDropdown.value = !showReportDropdown.value;
};

// PDF/DOCX Report Generation
const downloadReport = async (format: "pdf" | "docx" = "pdf") => {
  if (generatingPdf.value) return;

  // Закрываем выпадающее меню
  showReportDropdown.value = false;

  try {
    generatingPdf.value = true;

    // Определяем даты начала и окончания
    const dates = columns.value.map((col) => col.scheduleEvent.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    // Подготавливаем данные для отчёта
    const reportData = {
      groupCode: groupCode.value,
      disciplineName: disciplineName.value,
      courseName: courseName.value,
      instructorName: instructorName.value,
      columns: columns.value,
      rows: rows.value,
      startDate,
      endDate,
    };

    // Генерируем документ в выбранном формате
    if (format === "pdf") {
      await generateGroupReport(reportData);
    } else {
      const { generateGroupReportDocx } =
        await import("~/utils/docx/generateGroupReport");
      await generateGroupReportDocx(reportData);
    }

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "group_report",
          format,
          groupCode: groupCode.value,
          groupId: groupId.value,
          disciplineName: disciplineName.value,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    toast.success(`Ведомость успешно сформирована (${format.toUpperCase()})`);
  } catch (error: any) {
    console.error("Error generating report:", error);
    toast.error(error.message || "Ошибка при формировании ведомости");
  } finally {
    generatingPdf.value = false;
  }
};

// Bulk operations
const openBulkAttendanceModal = () => {
  if (!selectedEvent.value) return;
  bulkAttendanceHours.value = selectedEvent.value.scheduleEvent.academicHours;
  showBulkAttendanceModal.value = true;
};

const openBulkGradeModal = () => {
  if (!selectedEvent.value) return;
  bulkGradeValue.value = 100;
  showBulkGradeModal.value = true;
};

// Check marking access for selected event
const checkMarkingAccess = async () => {
  if (!selectedEventId.value) {
    markingAccess.value = null;
    return;
  }

  accessLoading.value = true;
  try {
    const response = await authFetch<{
      success: boolean;
      access: MarkingAccessCheckResult;
    }>(`/api/attendance/marking/check/${selectedEventId.value}`);

    if (response.success) {
      markingAccess.value = response.access;
    }
  } catch (error) {
    console.error("Error checking access:", error);
    // Если ошибка - предполагаем что доступ есть (для обратной совместимости)
    markingAccess.value = {
      allowed: true,
      status: "allowed",
      deadline: "",
      lateDeadline: "",
    };
  } finally {
    accessLoading.value = false;
  }
};

// Watch selected event changes
watch(selectedEventId, () => {
  checkMarkingAccess();
});

// Handle late marking confirmation
const handleLateMarkingConfirm = async (reason: string) => {
  lateMarkingReason.value = reason;
  showLateMarkingModal.value = false;
  await saveBulkAttendanceWithReason(reason);
};

// Handle request approval
const handleRequestApproval = async (reason: string) => {
  try {
    const response = await authFetch<{ success: boolean; message: string }>(
      "/api/attendance/marking/requests",
      {
        method: "POST",
        body: {
          scheduleEventId: selectedEventId.value,
          reason,
        },
      },
    );

    if (response.success) {
      toast.success(response.message);
      showLateMarkingModal.value = false;
    }
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка отправки запроса");
  }
};

// Save bulk attendance with late reason
const saveBulkAttendanceWithReason = async (lateReason?: string) => {
  if (!selectedEvent.value || bulkSaving.value) return;

  const maxHours = selectedEvent.value.scheduleEvent.academicHours;
  if (bulkAttendanceHours.value < 0 || bulkAttendanceHours.value > maxHours) {
    toast.error(`Часы должны быть от 0 до ${maxHours}`);
    return;
  }

  bulkSaving.value = true;
  try {
    // Фильтруем студентов для пересдачи
    const eligibleRows =
      selectedEvent.value.scheduleEvent.isRetake &&
      selectedEvent.value.scheduleEvent.allowedStudentIds
        ? rows.value.filter((row) =>
            selectedEvent.value!.scheduleEvent.allowedStudentIds!.includes(
              row.student.id,
            ),
          )
        : rows.value;

    const attendances = eligibleRows.map((row) => ({
      studentId: row.student.id,
      hoursAttended: bulkAttendanceHours.value,
    }));

    const response = await authFetch<{
      success: boolean;
      message?: string;
      count?: number;
    }>("/api/attendance", {
      method: "POST",
      body: {
        bulk: true,
        scheduleEventId: selectedEventId.value,
        maxHours: maxHours,
        attendances,
        lateReason,
      },
    });

    if (response.success) {
      toast.success(`Отмечено ${response.count || attendances.length} записей`);
      showBulkAttendanceModal.value = false;
      await loadJournal();
      await checkMarkingAccess();
    } else {
      toast.error(response.message || "Ошибка сохранения");
    }
  } catch (error: any) {
    // При ошибке 403 с требованием одобрения — предлагаем создать запрос
    if (error?.statusCode === 403 || error?.status === 403) {
      const message = error.data?.message || error.message || "Доступ запрещён";
      if (
        message.includes("одобрение") ||
        message.includes("Требуется одобрение")
      ) {
        toast.warning(message);
        showBulkAttendanceModal.value = false;
        showLateMarkingModal.value = true;
        // Обновляем статус доступа
        if (markingAccess.value) {
          markingAccess.value.status = "requires_approval";
          markingAccess.value.requiresApproval = true;
        }
        return;
      }
      toast.error(message);
    } else {
      toast.error(error.data?.message || error.message || "Ошибка сохранения");
    }
  } finally {
    bulkSaving.value = false;
  }
};

const saveBulkAttendance = async () => {
  // Check access first
  if (markingAccess.value) {
    // Для админов/модераторов не требуется подтверждение, даже если срок истёк
    if (markingAccess.value.bypassApprovalRequired) {
      await saveBulkAttendanceWithReason();
      return;
    }

    if (markingAccess.value.status === "late") {
      // Show late marking modal
      showBulkAttendanceModal.value = false;
      showLateMarkingModal.value = true;
      return;
    }

    if (markingAccess.value.status === "requires_approval") {
      // Show request approval modal
      showBulkAttendanceModal.value = false;
      showLateMarkingModal.value = true;
      return;
    }
  }

  await saveBulkAttendanceWithReason();
};

const saveBulkGrade = async () => {
  if (!selectedEvent.value || bulkSaving.value) return;

  if (bulkGradeValue.value < 0 || bulkGradeValue.value > 100) {
    toast.error("Оценка должна быть от 0 до 100");
    return;
  }

  bulkSaving.value = true;
  try {
    // Фильтруем студентов для пересдачи
    const eligibleRows =
      selectedEvent.value.scheduleEvent.isRetake &&
      selectedEvent.value.scheduleEvent.allowedStudentIds
        ? rows.value.filter((row) =>
            selectedEvent.value!.scheduleEvent.allowedStudentIds!.includes(
              row.student.id,
            ),
          )
        : rows.value;

    const grades = eligibleRows.map((row) => ({
      studentId: row.student.id,
      grade: bulkGradeValue.value,
    }));

    const response = await authFetch<{
      success: boolean;
      message?: string;
      count?: number;
    }>("/api/grades", {
      method: "POST",
      body: {
        bulk: true,
        scheduleEventId: selectedEventId.value,
        grades,
      },
    });

    if (response.success) {
      toast.success(`Выставлено ${response.count || grades.length} оценок`);
      showBulkGradeModal.value = false;
      await loadJournal();
    } else {
      toast.error(response.message || "Ошибка сохранения");
    }
  } catch (error: any) {
    toast.error(error.message || "Ошибка сохранения");
  } finally {
    bulkSaving.value = false;
  }
};

// Получить количество студентов для массовой операции (с учетом пересдачи)
const getEligibleStudentsCount = () => {
  if (!selectedEvent.value) return 0;

  if (
    selectedEvent.value.scheduleEvent.isRetake &&
    selectedEvent.value.scheduleEvent.allowedStudentIds
  ) {
    return rows.value.filter((row) =>
      selectedEvent.value!.scheduleEvent.allowedStudentIds!.includes(
        row.student.id,
      ),
    ).length;
  }

  return rows.value.length;
};

// Получить список студентов для массовой операции (с учетом пересдачи)
const getEligibleStudents = () => {
  if (!selectedEvent.value) return [];

  if (
    selectedEvent.value.scheduleEvent.isRetake &&
    selectedEvent.value.scheduleEvent.allowedStudentIds
  ) {
    return rows.value
      .filter((row) =>
        selectedEvent.value!.scheduleEvent.allowedStudentIds!.includes(
          row.student.id,
        ),
      )
      .map((row) => row.student);
  }

  return rows.value.map((row) => row.student);
};

const openBulkFinalGradeModal = () => {
  bulkFinalGradeMode.value = "average";
  bulkFinalGradeValue.value = 100;
  bulkFinalGradeThreshold.value = 60;
  showBulkFinalGradeModal.value = true;
};

// Получить предварительную оценку для студента
const getPreviewGrade = (row: JournalRow) => {
  if (bulkFinalGradeMode.value === "custom") {
    return bulkFinalGradeValue.value;
  }
  return row.averageGrade || 0;
};

const saveBulkFinalGrade = async () => {
  if (bulkSaving.value) return;

  if (
    bulkFinalGradeMode.value === "custom" &&
    (bulkFinalGradeValue.value < 0 || bulkFinalGradeValue.value > 100)
  ) {
    toast.error("Оценка должна быть от 0 до 100");
    return;
  }

  bulkSaving.value = true;
  try {
    const grades = rows.value.map((row) => ({
      studentId: row.student.id,
      finalGrade: getPreviewGrade(row),
    }));

    const response = await authFetch<{
      success: boolean;
      message?: string;
      results?: any[];
    }>("/api/final-grades/bulk", {
      method: "POST",
      body: {
        groupId: groupId.value,
        disciplineId: disciplineId.value,
        grades,
        mode: bulkFinalGradeMode.value,
        passThreshold: bulkFinalGradeThreshold.value,
      },
    });

    if (response.success) {
      toast.success(response.message || "Итоговые оценки выставлены");
      showBulkFinalGradeModal.value = false;
      await loadJournal();
    } else {
      toast.error(response.message || "Ошибка сохранения");
    }
  } catch (error: any) {
    toast.error(error.message || "Ошибка сохранения");
  } finally {
    bulkSaving.value = false;
  }
};

// Initialize
onMounted(async () => {
  await Promise.all([loadJournal(), loadMeta()]);
});

// Watch for route changes
watch(slug, async () => {
  await Promise.all([loadJournal(), loadMeta()]);
});
</script>
