<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Загрузка журнала...</p>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <svg class="mx-auto h-16 w-16 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ошибка загрузки</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">{{ error }}</p>
        <UiButton class="mt-6" @click="loadJournal">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-6">
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <NuxtLink to="/groups" class="hover:text-primary transition-colors">Учебные группы</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <NuxtLink :to="`/groups/${groupId}`" class="hover:text-primary transition-colors">{{ groupCode }}</NuxtLink>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
          <span class="text-gray-900 dark:text-white">Журнал</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-info/10 text-info">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-black dark:text-white">{{ disciplineName || 'Журнал' }}</h1>
              <p class="text-gray-500 dark:text-gray-400">
                <span v-if="instructorName">{{ instructorName }} • </span>
                Журнал посещаемости и оценок
              </p>
            </div>
          </div>
          
          <div class="flex items-center gap-3">
            <!-- Статистика -->
            <div class="hidden lg:flex items-center gap-4 bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ summary?.totalStudents || 0 }}</p>
              </div>
              <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Занятий</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ summary?.totalEvents || 0 }}</p>
              </div>
              <div class="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">Ср. посещ.</p>
                <p class="text-lg font-bold" :class="getAttendanceColor(summary?.averageAttendance || 0)">
                  {{ (summary?.averageAttendance || 0).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пустое состояние - нет занятий -->
      <div v-if="columns.length === 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Занятия не найдены</h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          Для этой дисциплины ещё нет запланированных занятий.<br>
          Добавьте занятия в расписание, чтобы вести журнал.
        </p>
        <NuxtLink 
          :to="`/schedule?groupId=${groupId}`"
          class="inline-block mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Перейти к расписанию
        </NuxtLink>
      </div>

      <!-- Панель массовых операций -->
      <div v-if="columns.length > 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md p-4 mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Массовые операции</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Выберите занятие для массовой отметки посещаемости или оценки
            </p>
          </div>
          
          <!-- Выбор занятия -->
          <select 
            v-model="selectedEventId"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">— Выберите занятие —</option>
            <option v-for="col in columns" :key="col.scheduleEvent.id" :value="col.scheduleEvent.id">
              {{ formatColumnDate(col.scheduleEvent.date) }} {{ formatTimeRange(col.scheduleEvent.startTime, col.scheduleEvent.endTime) }}
              {{ col.hasGrade ? '(с оценкой)' : '' }}
            </option>
          </select>
          
          <!-- Статус доступа -->
          <div v-if="selectedEventId && markingAccess" class="flex items-center gap-2">
            <span v-if="accessLoading" class="text-gray-400">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <span 
              v-else-if="markingAccess.status === 'allowed'"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Доступно
            </span>
            <span 
              v-else-if="markingAccess.status === 'late'"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Опоздание
            </span>
            <span 
              v-else-if="markingAccess.status === 'requires_approval'"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Требует одобрения
            </span>
            <span 
              v-else-if="markingAccess.status === 'denied'"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Недоступно
            </span>
          </div>
          
          <!-- Кнопки действий -->
          <div class="flex gap-2">
            <UiButton 
              variant="primary" 
              size="sm"
              :disabled="!selectedEventId || (markingAccess && markingAccess.status === 'denied')"
              @click="openBulkAttendanceModal"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Отметить всех
            </UiButton>
            
            <UiButton 
              v-if="selectedEvent?.hasGrade"
              variant="outline" 
              size="sm"
              :disabled="!selectedEventId"
              @click="openBulkGradeModal"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Оценка всем
            </UiButton>
          </div>
        </div>
        
        <!-- Предупреждение об опоздании -->
        <div 
          v-if="markingAccess && markingAccess.status === 'late'" 
          class="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
        >
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">
              Срок отметки для этого занятия истёк. Отметка будет сохранена с пометкой «Опоздание».
            </p>
          </div>
        </div>
        
        <!-- Блокировка при требовании одобрения -->
        <div 
          v-if="markingAccess && markingAccess.status === 'requires_approval'" 
          class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p class="text-sm font-medium text-red-700 dark:text-red-300">
                Требуется одобрение администратора
              </p>
              <p class="text-xs text-red-600 dark:text-red-400 mt-1">
                Срок отметки для этого занятия давно истёк. Нажмите «Отметить всех» чтобы отправить запрос на одобрение.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица журнала -->
      <div v-if="columns.length > 0" class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-max">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <!-- Заголовок студента -->
                <th class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                  Слушатель
                </th>
                <!-- Заголовки занятий -->
                <th 
                  v-for="column in columns" 
                  :key="column.scheduleEvent.id"
                  class="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]"
                >
                  <div class="flex flex-col items-center gap-1">
                    <span 
                      class="inline-block w-2 h-2 rounded-full"
                      :class="{
                        'bg-blue-500': column.scheduleEvent.eventType === 'theory',
                        'bg-green-500': column.scheduleEvent.eventType === 'practice',
                        'bg-orange-500': column.scheduleEvent.eventType === 'assessment',
                        'bg-gray-500': column.scheduleEvent.eventType === 'other',
                      }"
                    ></span>
                    <span class="text-xs">{{ formatColumnDate(column.scheduleEvent.date) }}</span>
                    <span class="text-[10px] text-gray-400">{{ formatTimeRange(column.scheduleEvent.startTime, column.scheduleEvent.endTime) }}</span>
                  </div>
                </th>
                <!-- Итоги -->
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700">
                  Посещ. %
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px] bg-gray-100 dark:bg-gray-700">
                  Ср. оценка
                </th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px] bg-gray-100 dark:bg-gray-700">
                  Итог
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr 
                v-for="row in rows" 
                :key="row.student.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <!-- Имя студента -->
                <td class="sticky left-0 z-10 bg-white dark:bg-boxdark px-4 py-3 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div class="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success text-sm font-semibold">
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[150px]" :title="row.student.fullName">
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
                    @update="handleCellUpdate"
                    @require-approval="handleRequireApproval"
                  />
                </td>
                <!-- Процент посещаемости -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <span 
                    class="inline-block px-2 py-1 rounded text-sm font-medium"
                    :class="getAttendanceColor(row.attendancePercent)"
                  >
                    {{ row.attendancePercent.toFixed(1) }}%
                  </span>
                </td>
                <!-- Средняя оценка -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <span v-if="row.averageGrade !== undefined" class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ row.averageGrade.toFixed(0) }}
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <!-- Итоговая оценка -->
                <td class="px-4 py-3 text-center bg-gray-50 dark:bg-gray-800/30">
                  <FinalGradeCell
                    :final-grade="row.finalGrade"
                    :student-id="row.student.id"
                    :group-id="groupId"
                    :discipline-id="disciplineId"
                    :attendance-percent="row.attendancePercent"
                    @update="handleFinalGradeUpdate"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Легенда -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="font-medium">Типы занятий:</span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-blue-500"></span>
            Теория
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-green-500"></span>
            Практика
          </span>
          <span class="flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-orange-500"></span>
            Проверка знаний (с оценкой)
          </span>
          
          <span class="mx-2 text-gray-300 dark:text-gray-600">|</span>
          
          <span class="font-medium">Оценки:</span>
          <span class="flex items-center gap-1" title="Автоматическая оценка из теста">
            <span class="relative w-5 h-5 rounded bg-success/20 flex items-center justify-center text-xs text-success">
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500"></span>
              85
            </span>
            Из теста
          </span>
          <span class="flex items-center gap-1" title="Изменённая оценка">
            <span class="relative w-5 h-5 rounded bg-purple-200 dark:bg-purple-900/40 flex items-center justify-center text-xs text-purple-700 dark:text-purple-300 ring-1 ring-purple-400">
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500"></span>
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
            {{ formatTimeRange(selectedEvent.scheduleEvent.startTime, selectedEvent.scheduleEvent.endTime) }}
            ({{ selectedEvent.scheduleEvent.academicHours }} а-ч)
          </p>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Часы посещения для всех (из {{ selectedEvent.scheduleEvent.academicHours }})
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="bulkAttendanceHours"
                type="number"
                step="0.5"
                min="0"
                :max="selectedEvent.scheduleEvent.academicHours"
                class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-boxdark px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span class="text-gray-500">а-ч</span>
            </div>
            
            <!-- Быстрые кнопки -->
            <div class="flex gap-2 mt-3">
              <button
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                :class="bulkAttendanceHours === 0 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
                @click="bulkAttendanceHours = 0"
              >
                Никто (0)
              </button>
              <button
                class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
                :class="bulkAttendanceHours === selectedEvent.scheduleEvent.academicHours 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
                @click="bulkAttendanceHours = selectedEvent.scheduleEvent.academicHours"
              >
                Все ({{ selectedEvent.scheduleEvent.academicHours }})
              </button>
            </div>
          </div>
          
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Будет отмечено {{ rows.length }} слушателей
            </p>
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
            {{ formatTimeRange(selectedEvent.scheduleEvent.startTime, selectedEvent.scheduleEvent.endTime) }}
          </p>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                :class="bulkGradeValue === grade 
                  ? 'bg-primary text-white border-primary' 
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
                @click="bulkGradeValue = grade"
              >
                {{ grade }}
              </button>
            </div>
          </div>
          
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Будет выставлено {{ rows.length }} оценок
            </p>
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

    <!-- Модальное окно предупреждения об опоздании -->
    <LateMarkingModal
      v-model="showLateMarkingModal"
      :event-title="selectedEvent?.scheduleEvent.title || ''"
      :event-date="selectedEvent?.scheduleEvent.startTime || ''"
      :deadline="markingAccess?.deadline || ''"
      :status="markingAccess?.status === 'requires_approval' ? 'requires_approval' : 'late'"
      @confirm="handleLateMarkingConfirm"
      @request-approval="handleRequestApproval"
      @cancel="showLateMarkingModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import AttendanceCell from '~/components/attendance/AttendanceCell.vue';
import FinalGradeCell from '~/components/attendance/FinalGradeCell.vue';
import LateMarkingModal from '~/components/attendance/LateMarkingModal.vue';
import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS,
  type MarkingAccessCheckResult,
} from '~/types/attendanceMarking';

definePageMeta({
  layout: 'default',
});

interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: 'theory' | 'practice' | 'assessment' | 'other';
    academicHours: number;
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
}

interface FinalGrade {
  id: string;
  finalGrade?: number;
  attendancePercent?: number;
  status: 'in_progress' | 'passed' | 'failed' | 'not_allowed';
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
const groupId = computed(() => slug.value?.split('_')[0] || '');
const disciplineId = computed(() => slug.value?.split('_')[1] || '');

// State
const loading = ref(true);
const error = ref<string | null>(null);
const columns = ref<JournalColumn[]>([]);
const rows = ref<JournalRow[]>([]);
const summary = ref<JournalSummary | null>(null);
const groupCode = ref('');
const disciplineName = ref('');
const instructorName = ref('');

// Bulk operations state
const selectedEventId = ref('');
const showBulkAttendanceModal = ref(false);
const showBulkGradeModal = ref(false);
const bulkSaving = ref(false);
const bulkAttendanceHours = ref(0);
const bulkGradeValue = ref(0);

// Marking access state
const markingAccess = ref<MarkingAccessCheckResult | null>(null);
const showLateMarkingModal = ref(false);
const lateMarkingReason = ref('');
const accessLoading = ref(false);

// Computed - выбранное занятие
const selectedEvent = computed(() => {
  return columns.value.find(col => col.scheduleEvent.id === selectedEventId.value);
});


// Load journal data
const loadJournal = async () => {
  loading.value = true;
  error.value = null;
  
  if (!groupId.value || !disciplineId.value) {
    error.value = 'Неверный URL журнала';
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
    }>(`/api/attendance/journal?groupId=${groupId.value}&disciplineId=${disciplineId.value}`);
    
    if (response.success) {
      columns.value = response.columns;
      rows.value = response.rows;
      summary.value = response.summary;
    } else {
      error.value = response.message || 'Ошибка загрузки журнала';
    }
  } catch (err: any) {
    console.error('Error loading journal:', err);
    error.value = err.message || 'Ошибка загрузки журнала';
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
      group?: { code: string };
    }>(`/api/groups/${groupId.value}`);
    
    if (groupResponse.success && groupResponse.group) {
      groupCode.value = groupResponse.group.code;
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
        (d) => d.id === disciplineId.value
      );
      
      if (discipline) {
        disciplineName.value = discipline.name;
        
        // Формируем список инструкторов
        if (discipline.instructors && discipline.instructors.length > 0) {
          // Сначала основные, потом остальные
          const sorted = [...discipline.instructors].sort((a, b) => 
            (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0)
          );
          
          // Показываем имена (до 2-х инструкторов)
          const names = sorted.slice(0, 2).map(i => i.fullName);
          if (sorted.length > 2) {
            instructorName.value = `${names.join(', ')} и ещё ${sorted.length - 2}`;
          } else {
            instructorName.value = names.join(', ');
          }
        }
      } else {
        disciplineName.value = 'Дисциплина';
      }
    }
  } catch (err) {
    console.error('Error loading meta:', err);
    disciplineName.value = 'Дисциплина';
  }
};

// Helpers
const formatColumnDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

const formatTimeRange = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startStr = start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const endStr = end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${startStr}-${endStr}`;
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (first.length > 0 && second.length > 0) {
    return (first.charAt(0) + second.charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAttendanceColor = (percent: number) => {
  if (percent >= 75) return 'text-success bg-success/10';
  if (percent >= 50) return 'text-warning bg-warning/10';
  return 'text-danger bg-danger/10';
};

// Event handlers
const handleCellUpdate = async (_data: { studentId: string; scheduleEventId: string; type: 'attendance' | 'grade' }) => {
  await loadJournal();
};

// Обработка требования одобрения при одиночной отметке
const handleRequireApproval = (data: { scheduleEventId: string; message?: string }) => {
  // Устанавливаем выбранное занятие
  selectedEventId.value = data.scheduleEventId;
  // Обновляем статус доступа
  if (markingAccess.value) {
    markingAccess.value.status = 'requires_approval';
    markingAccess.value.requiresApproval = true;
  }
  // Открываем модальное окно для создания запроса
  showLateMarkingModal.value = true;
};

const handleFinalGradeUpdate = async () => {
  await loadJournal();
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
    console.error('Error checking access:', error);
    // Если ошибка - предполагаем что доступ есть (для обратной совместимости)
    markingAccess.value = { allowed: true, status: 'allowed', deadline: '', lateDeadline: '' };
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
      '/api/attendance/marking/requests',
      {
        method: 'POST',
        body: {
          scheduleEventId: selectedEventId.value,
          reason,
        },
      }
    );
    
    if (response.success) {
      toast.success(response.message);
      showLateMarkingModal.value = false;
    }
  } catch (error: any) {
    toast.error(error.data?.message || 'Ошибка отправки запроса');
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
    const attendances = rows.value.map(row => ({
      studentId: row.student.id,
      hoursAttended: bulkAttendanceHours.value,
    }));
    
    const response = await authFetch<{ success: boolean; message?: string; count?: number }>('/api/attendance', {
      method: 'POST',
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
      toast.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    // При ошибке 403 с требованием одобрения — предлагаем создать запрос
    if (error?.statusCode === 403 || error?.status === 403) {
      const message = error.data?.message || error.message || 'Доступ запрещён';
      if (message.includes('одобрение') || message.includes('Требуется одобрение')) {
        toast.warning(message);
        showBulkAttendanceModal.value = false;
        showLateMarkingModal.value = true;
        // Обновляем статус доступа
        if (markingAccess.value) {
          markingAccess.value.status = 'requires_approval';
          markingAccess.value.requiresApproval = true;
        }
        return;
      }
      toast.error(message);
    } else {
      toast.error(error.data?.message || error.message || 'Ошибка сохранения');
    }
  } finally {
    bulkSaving.value = false;
  }
};

const saveBulkAttendance = async () => {
  // Check access first
  if (markingAccess.value) {
    if (markingAccess.value.status === 'late') {
      // Show late marking modal
      showBulkAttendanceModal.value = false;
      showLateMarkingModal.value = true;
      return;
    }
    
    if (markingAccess.value.status === 'requires_approval') {
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
    toast.error('Оценка должна быть от 0 до 100');
    return;
  }
  
  bulkSaving.value = true;
  try {
    const grades = rows.value.map(row => ({
      studentId: row.student.id,
      grade: bulkGradeValue.value,
    }));
    
    const response = await authFetch<{ success: boolean; message?: string; count?: number }>('/api/grades', {
      method: 'POST',
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
      toast.error(response.message || 'Ошибка сохранения');
    }
  } catch (error: any) {
    toast.error(error.message || 'Ошибка сохранения');
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
