<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Профиль инструктора
      </h2>
      <nav>
        <ol class="flex items-center gap-2">
          <li>
            <NuxtLink to="/users" class="hover:text-primary">Управление пользователями</NuxtLink>
          </li>
          <li class="text-primary">/</li>
          <li class="text-primary">Профиль инструктора</li>
        </ol>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-8">
      <div class="text-center">
        <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center">
          <AlertCircle class="w-8 h-8 text-danger" />
        </div>
        <h3 class="mb-2 text-xl font-semibold text-black dark:text-white">Ошибка загрузки</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
        <UiButton variant="primary" @click="loadInstructor">
          Попробовать снова
        </UiButton>
      </div>
    </div>

    <!-- Instructor Profile -->
    <div v-else-if="instructor">
      <!-- Profile Header -->
      <div class="mb-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <!-- Cover Image -->
        <div class="relative h-48 overflow-hidden rounded-t-sm bg-linear-to-r from-primary to-primary-600">
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Profile Info -->
        <div class="px-6 pb-6">
          <div class="relative -mt-16 mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
            <!-- Avatar -->
            <div class="relative">
              <div class="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg dark:border-gray-900">
                <div class="h-full w-full flex items-center justify-center bg-primary/10">
                  <span class="text-primary font-bold text-4xl">
                    {{ getInitials(instructor.fullName) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- User Info -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ instructor.fullName }}
              </h3>
              <p class="mb-2 text-gray-600 dark:text-gray-400">
                {{ instructor.email || 'Email не указан' }}
              </p>
              <div class="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                    instructor.isActive
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  ]"
                >
                  <span :class="['h-2 w-2 rounded-full', instructor.isActive ? 'bg-success' : 'bg-danger']"></span>
                  {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
                </span>
                <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <GraduationCap class="h-4 w-4" />
                  Инструктор
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <UiButton variant="outline" size="md" @click="editInstructor">
                <Edit class="h-4 w-4" />
                Редактировать
              </UiButton>
              <UiButton variant="danger" size="md" @click="handleDelete">
                <Trash2 class="h-4 w-4" />
                Удалить
              </UiButton>
            </div>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Активных курсов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-success/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <Users class="h-6 w-6 text-success" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Всего студентов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-warning/50 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Clock class="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Макс. часов</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ instructor.maxHours }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Личная информация -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Личная информация
          </h3>
          <div class="space-y-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Полное имя</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ instructor.fullName }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ instructor.email || '—' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Телефон</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ instructor.phone || '—' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">ID</p>
              <p class="font-medium text-gray-900 dark:text-white font-mono text-sm">{{ instructor.id }}</p>
            </div>
          </div>
        </div>

        <!-- Рабочая информация -->
        <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Рабочая информация
          </h3>
          <div class="space-y-3">
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Дата приема на работу</p>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ instructor.hireDate ? formatDate(instructor.hireDate) : '—' }}
              </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Максимальное количество часов</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ instructor.maxHours }} часов</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Информация о контракте</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ instructor.contractInfo || '—' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">Статус</p>
              <span
                :class="[
                  'inline-flex rounded-full px-3 py-1 text-sm font-medium',
                  instructor.isActive
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                ]"
              >
                {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Отчётность по часам -->
      <div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Отчётность по часам
          </h3>
          <button
            v-if="!hoursStats && !hoursLoading"
            @click="loadHoursStats"
            class="text-sm text-primary hover:underline"
          >
            Загрузить статистику
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="hoursLoading" class="flex justify-center items-center py-8">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="hoursError" class="text-center py-6">
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-danger" />
          </div>
          <p class="text-danger mb-3">{{ hoursError }}</p>
          <button @click="loadHoursStats" class="text-sm text-primary hover:underline">
            Попробовать снова
          </button>
        </div>

        <!-- Hours Stats Content -->
        <div v-else-if="hoursStats">
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Использование лимита часов</span>
              <span class="text-sm font-medium" :class="getUsageColorClass(hoursStats.usagePercentage)">
                {{ hoursStats.usagePercentage }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                class="h-3 rounded-full transition-all duration-500"
                :class="getProgressBarColorClass(hoursStats.usagePercentage)"
                :style="{ width: `${Math.min(100, hoursStats.usagePercentage)}%` }"
              ></div>
            </div>
            <div class="flex justify-between mt-1">
              <span class="text-xs text-gray-500 dark:text-gray-400">0 ч.</span>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ hoursStats.maxHours }} ч. (макс.)</span>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div class="rounded-lg border border-success/30 bg-success/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <CheckCircle class="h-5 w-5 text-success" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Отработано</p>
                  <p class="text-lg font-bold text-success">{{ hoursStats.totalUsedHours }} ч.</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <CalendarClock class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Запланировано</p>
                  <p class="text-lg font-bold text-primary">{{ hoursStats.totalScheduledHours }} ч.</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <Clock class="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Осталось</p>
                  <p class="text-lg font-bold text-warning">{{ hoursStats.remainingHours }} ч.</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <FileText class="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">По договору</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ hoursStats.maxHours }} ч.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Breakdown -->
          <div v-if="hoursStats.byMonth.length > 0">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Разбивка по месяцам</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400">Месяц</th>
                    <th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Отработано</th>
                    <th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Запланировано</th>
                    <th class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400">Всего занятий</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="month in hoursStats.byMonth"
                    :key="month.yearMonth"
                    class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td class="py-2 px-3 font-medium text-gray-900 dark:text-white">
                      {{ month.monthName }} {{ month.year }}
                    </td>
                    <td class="py-2 px-3 text-right">
                      <span class="text-success font-medium">{{ month.usedHours }} ч.</span>
                    </td>
                    <td class="py-2 px-3 text-right">
                      <span class="text-primary font-medium">{{ month.scheduledHours }} ч.</span>
                    </td>
                    <td class="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                      {{ month.eventCount }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State for Monthly Breakdown -->
          <div v-else class="text-center py-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Нет данных о занятиях</p>
          </div>
        </div>

        <!-- Initial State -->
        <div v-else class="text-center py-8">
          <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
            <Clock class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-3">
            Нажмите кнопку выше, чтобы загрузить статистику часов
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            Максимум по договору: <span class="font-medium">{{ instructor.maxHours }} ч.</span>
          </p>
        </div>
      </div>

      <!-- Course History -->
      <div class="mt-6 rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            История курсов
          </h3>
          <button
            v-if="!courseHistory && !historyLoading"
            @click="loadCourseHistory"
            class="text-sm text-primary hover:underline"
          >
            Загрузить историю
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="historyLoading" class="flex justify-center items-center py-8">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="historyError" class="text-center py-6">
          <div class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertCircle class="w-6 h-6 text-danger" />
          </div>
          <p class="text-danger mb-3">{{ historyError }}</p>
          <button @click="loadCourseHistory" class="text-sm text-primary hover:underline">
            Попробовать снова
          </button>
        </div>

        <!-- History Content -->
        <div v-else-if="courseHistory">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div class="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <BookOpen class="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Всего занятий</p>
                  <p class="text-lg font-bold text-primary">{{ courseHistory.summary.totalEvents }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-success/30 bg-success/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <Clock class="h-5 w-5 text-success" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Всего часов</p>
                  <p class="text-lg font-bold text-success">{{ courseHistory.summary.totalHours }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-warning/30 bg-warning/10 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                  <FileText class="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Теория</p>
                  <p class="text-lg font-bold text-warning">{{ courseHistory.summary.theoryEvents }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <CheckCircle class="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Проверка знаний</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ courseHistory.summary.assessmentEvents }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- History List -->
          <div v-if="courseHistory.history.length > 0" class="space-y-3">
            <div
              v-for="event in courseHistory.history"
              :key="event.id"
              class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <!-- Event Header -->
                  <div class="flex items-start gap-3 mb-2">
                    <div
                      :class="[
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        getEventTypeColor(event.eventType)
                      ]"
                    >
                      <component :is="getEventTypeIcon(event.eventType)" class="h-5 w-5" />
                    </div>
                    <div class="flex-1">
                      <h4 class="font-semibold text-gray-900 dark:text-white">{{ event.title }}</h4>
                      <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ formatEventDate(event.date) }}
                        </span>
                        <span class="text-gray-400">•</span>
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                        </span>
                        <span class="text-gray-400">•</span>
                        <span class="text-sm font-medium text-primary">
                          {{ event.academicHours }} ак.ч.
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Group and Discipline Info -->
                  <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      <Users class="h-3 w-3" />
                      {{ event.group.code }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {{ event.group.courseName }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {{ event.discipline.name }}
                    </span>
                  </div>

                  <!-- Statistics -->
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div class="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Студентов</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">
                        {{ event.statistics.totalStudents }}
                      </p>
                    </div>
                    <div class="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Отмечено</p>
                      <p class="text-sm font-semibold" :class="getCompletionColor(event.statistics.completionPercent)">
                        {{ event.statistics.studentsMarked }} ({{ event.statistics.completionPercent }}%)
                      </p>
                    </div>
                    <div v-if="event.eventType === 'assessment'" class="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Оценено</p>
                      <p class="text-sm font-semibold" :class="getCompletionColor(event.statistics.completionPercent)">
                        {{ event.statistics.studentsGraded }} ({{ event.statistics.completionPercent }}%)
                      </p>
                    </div>
                    <div v-if="event.eventType === 'assessment' && event.statistics.avgGrade" class="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Средняя оценка</p>
                      <p class="text-sm font-semibold text-success">
                        {{ event.statistics.avgGrade }}
                      </p>
                    </div>
                    <div v-else class="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Ср. посещ.</p>
                      <p class="text-sm font-semibold text-primary">
                        {{ event.statistics.avgAttendanceHours }} ч.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Completion Badge -->
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'rounded-full px-3 py-1 text-xs font-medium',
                      event.statistics.completionPercent === 100
                        ? 'bg-success/10 text-success'
                        : event.statistics.completionPercent > 0
                        ? 'bg-warning/10 text-warning'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    ]"
                  >
                    {{ event.statistics.completionPercent === 100 ? 'Завершено' : 'Частично' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
              <BookOpen class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-gray-600 dark:text-gray-400">
              Нет завершенных занятий
            </p>
          </div>
        </div>

        <!-- Initial State -->
        <div v-else class="text-center py-8">
          <div class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center">
            <BookOpen class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-3">
            Нажмите кнопку выше, чтобы загрузить историю курсов
          </p>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <UsersInstructorFormModal
      v-if="showEditModal && instructor"
      :instructor="instructor"
      @close="closeEditModal"
      @saved="handleInstructorSaved"
    />

    <!-- Delete Confirmation Modal -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление инструктора"
      message="Вы уверены, что хотите удалить этого инструктора?"
      :item-name="instructor?.fullName"
      warning="Это действие нельзя отменить. Все данные инструктора будут удалены."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { Instructor } from '~/types/instructor';
import { 
  AlertCircle, 
  Edit, 
  GraduationCap, 
  BookOpen, 
  Users, 
  Clock,
  Trash2,
  CheckCircle,
  CalendarClock,
  FileText
} from 'lucide-vue-next';

// Интерфейс для статистики часов
interface InstructorHoursStats {
  maxHours: number;
  totalUsedHours: number;
  totalScheduledHours: number;
  remainingHours: number;
  usagePercentage: number;
  byMonth: Array<{
    yearMonth: string;
    year: number;
    month: number;
    monthName: string;
    usedHours: number;
    scheduledHours: number;
    eventCount: number;
  }>;
}

const route = useRoute();
const router = useRouter();
const id = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();

// State
const instructor = ref<Instructor | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showEditModal = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

// Hours Stats State
const hoursStats = ref<InstructorHoursStats | null>(null);
const hoursLoading = ref(false);
const hoursError = ref<string | null>(null);

// Meta
definePageMeta({
  title: 'Профиль инструктора',
});

useHead({
  title: 'Профиль инструктора - АТЦ Платформа',
});

// Load instructor data
const loadInstructor = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await authFetch<{ instructor: Instructor }>(
      `/api/instructors/${id}`,
      {
        method: 'GET',
      }
    );

    instructor.value = response.instructor;
  } catch (err: any) {
    console.error('Error loading instructor:', err);
    error.value = err.data?.message || 'Не удалось загрузить данные инструктора';
  } finally {
    loading.value = false;
  }
};

// Edit instructor
const editInstructor = () => {
  showEditModal.value = true;
};

// Close edit modal
const closeEditModal = () => {
  showEditModal.value = false;
};

// Handle instructor saved
const handleInstructorSaved = () => {
  showEditModal.value = false;
  // Reload instructor data to show updated information
  loadInstructor();
};

// Delete instructor
const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

// Close delete modal
const closeDeleteModal = () => {
  if (!isDeleting.value) {
    isDeleteModalOpen.value = false;
  }
};

// Confirm delete
const confirmDelete = async () => {
  isDeleting.value = true;

  try {
    await authFetch(
      `/api/instructors/${id}`,
      {
        method: 'DELETE',
      }
    );

    // Redirect to users page
    router.push('/users?tab=instructors');
  } catch (err: any) {
    console.error('Error deleting instructor:', err);
    // TODO: Show error notification
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

// Utilities
const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1] && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  if (name.length >= 2) {
    return name.substring(0, 2).toUpperCase();
  }
  return name.toUpperCase();
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Load data on mount
onMounted(() => {
  loadInstructor();
  // Автоматически загружаем статистику часов
  loadHoursStats();
});

// Загрузка статистики часов
const loadHoursStats = async () => {
  if (hoursLoading.value) return;
  
  hoursLoading.value = true;
  hoursError.value = null;
  
  try {
    console.log('[InstructorHours] Загрузка статистики для:', id);
    
    const response = await authFetch<{ success: boolean; stats: InstructorHoursStats }>(
      `/api/instructors/${id}/hours`,
      { method: 'GET' }
    );
    
    console.log('[InstructorHours] Ответ:', response);
    
    if (response.success && response.stats) {
      hoursStats.value = response.stats;
    } else {
      hoursError.value = 'Не удалось загрузить статистику';
    }
  } catch (err: any) {
    console.error('[InstructorHours] Ошибка:', err);
    hoursError.value = err.data?.statusMessage || err.message || 'Ошибка загрузки статистики';
  } finally {
    hoursLoading.value = false;
  }
};

// Определение класса цвета для процента использования
const getUsageColorClass = (percentage: number): string => {
  if (percentage >= 100) return 'text-danger';
  if (percentage >= 80) return 'text-warning';
  if (percentage >= 50) return 'text-primary';
  return 'text-success';
};

// Определение класса для прогресс-бара
const getProgressBarColorClass = (percentage: number): string => {
  if (percentage >= 100) return 'bg-danger';
  if (percentage >= 80) return 'bg-warning';
  if (percentage >= 50) return 'bg-primary';
  return 'bg-success';
};

// ============================================================================
// ИСТОРИЯ КУРСОВ
// ============================================================================

interface CourseHistoryEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  eventType: 'theory' | 'practice' | 'assessment' | 'other';
  academicHours: number;
  group: {
    id: string;
    code: string;
    courseName: string;
  };
  discipline: {
    name: string;
  };
  statistics: {
    totalStudents: number;
    studentsMarked: number;
    studentsGraded: number;
    avgAttendanceHours: number;
    avgGrade: number | null;
    completionPercent: number;
  };
}

interface CourseHistory {
  history: CourseHistoryEvent[];
  summary: {
    totalEvents: number;
    totalHours: number;
    theoryEvents: number;
    practiceEvents: number;
    assessmentEvents: number;
  };
}

// Course History State
const courseHistory = ref<CourseHistory | null>(null);
const historyLoading = ref(false);
const historyError = ref<string | null>(null);

// Загрузка истории курсов
const loadCourseHistory = async () => {
  if (historyLoading.value) return;
  
  historyLoading.value = true;
  historyError.value = null;
  
  try {
    console.log('[CourseHistory] Загрузка истории для:', id);
    
    const response = await authFetch<{ success: boolean; history: CourseHistoryEvent[]; summary: any }>(
      `/api/instructors/${id}/course-history`,
      { method: 'GET' }
    );
    
    console.log('[CourseHistory] Ответ:', response);
    
    if (response.success) {
      courseHistory.value = {
        history: response.history,
        summary: response.summary,
      };
    } else {
      historyError.value = 'Не удалось загрузить историю курсов';
    }
  } catch (err: any) {
    console.error('[CourseHistory] Ошибка:', err);
    historyError.value = err.data?.statusMessage || err.message || 'Ошибка загрузки истории курсов';
  } finally {
    historyLoading.value = false;
  }
};

// Вспомогательные функции для истории курсов
const getEventTypeColor = (eventType: string): string => {
  switch (eventType) {
    case 'theory':
      return 'bg-primary/10 text-primary';
    case 'practice':
      return 'bg-success/10 text-success';
    case 'assessment':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
};

const getEventTypeIcon = (eventType: string) => {
  switch (eventType) {
    case 'theory':
      return BookOpen;
    case 'practice':
      return Users;
    case 'assessment':
      return CheckCircle;
    default:
      return FileText;
  }
};

const getCompletionColor = (percent: number): string => {
  if (percent === 100) return 'text-success';
  if (percent >= 50) return 'text-warning';
  return 'text-danger';
};

const formatEventDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatTime = (dateTimeStr: string): string => {
  const date = new Date(dateTimeStr);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

</script>
