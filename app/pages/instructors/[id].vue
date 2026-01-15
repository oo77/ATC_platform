<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Навигация назад -->
    <div class="mb-6">
      <NuxtLink
        to="/users"
        class="inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft class="h-4 w-4" />
        Назад к списку пользователей
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">
          Загрузка данных инструктора...
        </p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center"
    >
      <AlertCircle class="mx-auto h-12 w-12 text-danger" />
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Ошибка загрузки
      </h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">{{ error }}</p>
      <UiButton variant="primary" class="mt-4" @click="loadInstructor">
        Попробовать снова
      </UiButton>
    </div>

    <!-- Instructor Profile -->
    <template v-else-if="instructor">
      <!-- Profile Header -->
      <div
        class="bg-white dark:bg-boxdark rounded-2xl shadow-lg overflow-hidden mb-6"
      >
        <!-- Фоновый градиент -->
        <div
          class="h-32 bg-linear-to-r from-primary via-purple-500 to-pink-500 relative"
        >
          <div class="absolute inset-0 bg-black/10"></div>
        </div>

        <!-- Основная информация -->
        <div class="relative px-8 pb-8">
          <!-- Аватар -->
          <div class="flex flex-col sm:flex-row items-end gap-6 -mt-16 mb-6">
            <div class="relative">
              <div
                class="h-32 w-32 rounded-2xl bg-white dark:bg-boxdark shadow-xl flex items-center justify-center border-4 border-white dark:border-boxdark"
              >
                <span class="text-5xl font-bold text-primary">
                  {{ getInitials(instructor.fullName) }}
                </span>
              </div>
              <div
                class="absolute -bottom-2 -right-2 h-10 w-10 bg-success rounded-full border-4 border-white dark:border-boxdark flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div class="flex-1 pb-2 text-center sm:text-left">
              <h1 class="text-3xl font-bold text-black dark:text-white mb-2">
                {{ instructor.fullName }}
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                {{ instructor.email || "Email не указан" }}
              </p>
            </div>

            <!-- Кнопки действий -->
            <div
              class="flex gap-3 pb-2 w-full sm:w-auto justify-center sm:justify-end"
            >
              <UiButton
                variant="primary"
                @click="editInstructor"
                class="flex items-center gap-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586"
                  />
                </svg>
                Редактировать
              </UiButton>
              <UiButton
                variant="danger"
                @click="handleDelete"
                class="flex items-center gap-2"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16"
                  />
                </svg>
                Удалить
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex flex-col gap-6">
        <!-- Tabs Navigation -->
        <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in availableTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
              ]"
            >
              <span class="flex items-center justify-center gap-2">
                <component :is="tab.icon" class="h-5 w-5" />
                {{ tab.label }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Tab Content -->

        <div v-show="activeTab === 'info'">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Личная информация -->
            <div
              class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
            >
              <h3
                class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
              >
                Личная информация
              </h3>
              <div class="space-y-3">
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Полное имя
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.fullName }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Email
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.email || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Телефон
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.phone || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    ID
                  </p>
                  <p
                    class="font-medium text-gray-900 dark:text-white font-mono text-sm"
                  >
                    {{ instructor.id }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Рабочая информация -->
            <div
              class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
            >
              <h3
                class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
              >
                Рабочая информация
              </h3>
              <div class="space-y-3">
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Дата приема на работу
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{
                      instructor.hireDate
                        ? formatDate(instructor.hireDate)
                        : "—"
                    }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Максимальное количество часов
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.maxHours }} часов
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Информация о контракте
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ instructor.contractInfo || "—" }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Статус
                  </p>
                  <span
                    :class="[
                      'inline-flex rounded-full px-3 py-1 text-sm font-medium',
                      instructor.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger',
                    ]"
                  >
                    {{ instructor.isActive ? "Активен" : "Неактивен" }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'hours'">
          <!-- Отчётность по часам -->
          <div
            class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                Отчётность по часам
              </h3>
              <!-- We can trigger loadHoursStats on mounted instead, or keep the button if preferred. 
                      Let's keep the button logic if it hasn't loaded. -->
              <button
                v-if="!hoursStats && !hoursLoading"
                @click="loadHoursStats"
                class="text-sm text-primary hover:underline"
              >
                Загрузить статистику
              </button>
            </div>

            <!-- Loading State -->
            <div
              v-if="hoursLoading"
              class="flex justify-center items-center py-8"
            >
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
              ></div>
            </div>

            <!-- Error State -->
            <div v-else-if="hoursError" class="text-center py-6">
              <div
                class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center"
              >
                <AlertCircle class="w-6 h-6 text-danger" />
              </div>
              <p class="text-danger mb-3">{{ hoursError }}</p>
              <button
                @click="loadHoursStats"
                class="text-sm text-primary hover:underline"
              >
                Попробовать снова
              </button>
            </div>

            <!-- Hours Stats Content -->
            <div v-else-if="hoursStats">
              <!-- Progress Bar -->
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-sm text-gray-600 dark:text-gray-400"
                    >Использование лимита часов</span
                  >
                  <span
                    class="text-sm font-medium"
                    :class="getUsageColorClass(hoursStats.usagePercentage)"
                  >
                    {{ hoursStats.usagePercentage }}%
                  </span>
                </div>
                <div
                  class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
                >
                  <div
                    class="h-3 rounded-full transition-all duration-500"
                    :class="
                      getProgressBarColorClass(hoursStats.usagePercentage)
                    "
                    :style="{
                      width: `${Math.min(100, hoursStats.usagePercentage)}%`,
                    }"
                  ></div>
                </div>
                <div class="flex justify-between mt-1">
                  <span class="text-xs text-gray-500 dark:text-gray-400"
                    >0 ч.</span
                  >
                  <span class="text-xs text-gray-500 dark:text-gray-400"
                    >{{ hoursStats.maxHours }} ч. (макс.)</span
                  >
                </div>
              </div>

              <!-- Stats Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div
                  class="rounded-lg border border-success/30 bg-success/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20"
                    >
                      <CheckCircle class="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Отработано
                      </p>
                      <p class="text-lg font-bold text-success">
                        {{ hoursStats.totalUsedHours }} ч.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-primary/30 bg-primary/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"
                    >
                      <CalendarClock class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Запланировано
                      </p>
                      <p class="text-lg font-bold text-primary">
                        {{ hoursStats.totalScheduledHours }} ч.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-warning/30 bg-warning/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20"
                    >
                      <Clock class="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Осталось
                      </p>
                      <p class="text-lg font-bold text-warning">
                        {{ hoursStats.remainingHours }} ч.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700"
                    >
                      <FileText
                        class="h-5 w-5 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        По договору
                      </p>
                      <p
                        class="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {{ hoursStats.maxHours }} ч.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Monthly Breakdown -->
              <div v-if="hoursStats.byMonth.length > 0">
                <h4
                  class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                >
                  Разбивка по месяцам
                </h4>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-200 dark:border-gray-700">
                        <th
                          class="py-2 px-3 text-left font-medium text-gray-600 dark:text-gray-400"
                        >
                          Месяц
                        </th>
                        <th
                          class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400"
                        >
                          Отработано
                        </th>
                        <th
                          class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400"
                        >
                          Запланировано
                        </th>
                        <th
                          class="py-2 px-3 text-right font-medium text-gray-600 dark:text-gray-400"
                        >
                          Всего занятий
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="month in hoursStats.byMonth"
                        :key="month.yearMonth"
                        class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td
                          class="py-2 px-3 font-medium text-gray-900 dark:text-white"
                        >
                          {{ month.monthName }} {{ month.year }}
                        </td>
                        <td class="py-2 px-3 text-right">
                          <span class="text-success font-medium"
                            >{{ month.usedHours }} ч.</span
                          >
                        </td>
                        <td class="py-2 px-3 text-right">
                          <span class="text-primary font-medium"
                            >{{ month.scheduledHours }} ч.</span
                          >
                        </td>
                        <td
                          class="py-2 px-3 text-right text-gray-600 dark:text-gray-400"
                        >
                          {{ month.eventCount }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Empty State for Monthly Breakdown -->
              <div v-else class="text-center py-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Нет данных о занятиях
                </p>
              </div>
            </div>

            <!-- Initial State -->
            <div v-else class="text-center py-8">
              <div
                class="mx-auto mb-4 h-16 w-16 rounded-full bg-gray-100 dark:bg-meta-4 flex items-center justify-center"
              >
                <Clock class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-gray-600 dark:text-gray-400 mb-3">
                Нажмите "Загрузить статистику", чтобы посмотреть детальный отчет
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-500">
                Максимум по договору:
                <span class="font-medium">{{ instructor.maxHours }} ч.</span>
              </p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'history'">
          <!-- Course History -->
          <div
            class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
          >
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
            <div
              v-if="historyLoading"
              class="flex justify-center items-center py-8"
            >
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
              ></div>
            </div>

            <!-- Error State -->
            <div v-else-if="historyError" class="text-center py-6">
              <div
                class="mx-auto mb-4 h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center"
              >
                <AlertCircle class="w-6 h-6 text-danger" />
              </div>
              <p class="text-danger mb-3">{{ historyError }}</p>
              <button
                @click="loadCourseHistory"
                class="text-sm text-primary hover:underline"
              >
                Попробовать снова
              </button>
            </div>

            <!-- History Content -->
            <div v-else-if="courseHistory">
              <!-- Summary Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div
                  class="rounded-lg border border-primary/30 bg-primary/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"
                    >
                      <BookOpen class="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Всего занятий
                      </p>
                      <p class="text-lg font-bold text-primary">
                        {{ courseHistory.summary.totalEvents }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-success/30 bg-success/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20"
                    >
                      <Clock class="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Всего часов
                      </p>
                      <p class="text-lg font-bold text-success">
                        {{ courseHistory.summary.totalHours }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-warning/30 bg-warning/10 p-4"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20"
                    >
                      <FileText class="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Теория
                      </p>
                      <p class="text-lg font-bold text-warning">
                        {{ courseHistory.summary.theoryEvents }}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700"
                    >
                      <CheckCircle
                        class="h-5 w-5 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        Проверка знаний
                      </p>
                      <p
                        class="text-lg font-bold text-gray-900 dark:text-white"
                      >
                        {{ courseHistory.summary.assessmentEvents }}
                      </p>
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
                            getEventTypeColor(event.eventType),
                          ]"
                        >
                          <component
                            :is="getEventTypeIcon(event.eventType)"
                            class="h-5 w-5"
                          />
                        </div>
                        <div class="flex-1">
                          <h4
                            class="font-semibold text-gray-900 dark:text-white"
                          >
                            {{ event.title }}
                          </h4>
                          <div class="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              class="text-sm text-gray-600 dark:text-gray-400"
                            >
                              {{ formatEventDate(event.date) }}
                            </span>
                            <span class="text-gray-400">•</span>
                            <span
                              class="text-sm text-gray-600 dark:text-gray-400"
                            >
                              {{ formatTime(event.startTime) }} -
                              {{ formatTime(event.endTime) }}
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
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          <Users class="h-3 w-3" />
                          {{ event.group.code }}
                        </span>
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {{ event.group.courseName }}
                        </span>
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        >
                          {{ event.discipline.name }}
                        </span>
                      </div>

                      <!-- Statistics -->
                      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div
                          class="text-center p-2 rounded bg-white dark:bg-gray-900"
                        >
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Студентов
                          </p>
                          <p
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            {{ event.statistics.totalStudents }}
                          </p>
                        </div>
                        <div
                          class="text-center p-2 rounded bg-white dark:bg-gray-900"
                        >
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Отмечено
                          </p>
                          <p
                            class="text-sm font-semibold"
                            :class="
                              getCompletionColor(
                                event.statistics.completionPercent
                              )
                            "
                          >
                            {{ event.statistics.studentsMarked }} ({{
                              event.statistics.completionPercent
                            }}%)
                          </p>
                        </div>
                        <div
                          v-if="event.eventType === 'assessment'"
                          class="text-center p-2 rounded bg-white dark:bg-gray-900"
                        >
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Оценено
                          </p>
                          <p
                            class="text-sm font-semibold"
                            :class="
                              getCompletionColor(
                                event.statistics.completionPercent
                              )
                            "
                          >
                            {{ event.statistics.studentsGraded }} ({{
                              event.statistics.completionPercent
                            }}%)
                          </p>
                        </div>
                        <div
                          v-if="
                            event.statistics.commentsCount &&
                            event.statistics.commentsCount > 0
                          "
                          class="text-center p-2 rounded bg-white dark:bg-gray-900"
                        >
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            Комментариев
                          </p>
                          <p
                            class="text-sm font-semibold text-gray-900 dark:text-white"
                          >
                            {{ event.statistics.commentsCount }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State for History -->
              <div v-else class="text-center py-4">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  История пуста
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <InstructorsInstructorFormModal
      v-if="isEditModalOpen && instructor"
      :instructor="instructor"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление инструктора"
      message="Вы уверены, что хотите удалить этого инструктора? Это действие может повлиять на связанные курсы и расписание."
      :item-name="instructor?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { Instructor, UpdateInstructorInput } from "~/types/instructor";
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  CalendarClock,
  FileText,
  User,
  History,
  GraduationCap,
} from "lucide-vue-next";

// Route and Auth
const route = useRoute();
const router = useRouter();
const instructorId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditInstructors, canDeleteInstructors } = usePermissions();

// State
const instructor = ref<Instructor | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Информация", icon: User },
  { id: "hours", label: "Отчётность", icon: Clock },
  { id: "history", label: "История курсов", icon: History },
];

// Hours Stats Interface
interface HoursStats {
  totalUsedHours: number;
  totalScheduledHours: number;
  remainingHours: number;
  maxHours: number;
  usagePercentage: number;
  byMonth: {
    year: number;
    month: number;
    monthName: string;
    yearMonth: string;
    usedHours: number;
    scheduledHours: number;
    eventCount: number;
  }[];
}

const hoursStats = ref<HoursStats | null>(null);
const hoursLoading = ref(false);
const hoursError = ref<string | null>(null);

// Course History Interface
interface CourseHistoryEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  academicHours: number;
  eventType: "lesson" | "assessment" | "exam";
  group: {
    id: string;
    code: string;
    courseName: string;
  };
  discipline: {
    id: string;
    name: string;
  };
  statistics: {
    totalStudents: number;
    studentsMarked: number;
    studentsGraded: number;
    completionPercent: number;
    commentsCount: number;
  };
}

interface CourseHistory {
  history: CourseHistoryEvent[];
  summary: {
    totalEvents: number;
    totalHours: number;
    theoryEvents: number;
    assessmentEvents: number;
  };
}

const courseHistory = ref<CourseHistory | null>(null);
const historyLoading = ref(false);
const historyError = ref<string | null>(null);

// Methods
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const loadInstructor = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{
      success: boolean;
      instructor: Instructor;
    }>(`/api/instructors/${instructorId}`);

    if (response.success) {
      instructor.value = response.instructor;
    } else {
      error.value = "Не удалось загрузить данные инструктора";
    }
  } catch (err: any) {
    error.value = err.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
};

const editInstructor = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const handleUpdate = async (data: UpdateInstructorInput) => {
  try {
    const response = await authFetch<{
      success: boolean;
      instructor: Instructor;
    }>(`/api/instructors/${instructorId}`, {
      method: "PUT",
      body: data,
    });

    if (response.success) {
      instructor.value = response.instructor;
      closeEditModal();
      notification.success("Данные инструктора обновлены");
    }
  } catch (err) {
    console.error("Error updating instructor:", err);
    notification.error("Ошибка при обновлении инструктора");
  }
};

const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/instructors/${instructorId}`, {
      method: "DELETE",
    });
    notification.success("Инструктор удален");
    router.push("/users");
  } catch (err) {
    console.error("Error deleting instructor:", err);
    notification.error("Ошибка при удалении инструктора");
  } finally {
    isDeleting.value = false;
    closeDeleteModal();
  }
};

// Hours Stats Logic
const loadHoursStats = async () => {
  hoursLoading.value = true;
  hoursError.value = null;

  try {
    const response = await authFetch<{ success: boolean; stats: HoursStats }>(
      `/api/instructors/${instructorId}/hours-report`
    );

    if (response.success) {
      hoursStats.value = response.stats;
    }
  } catch (err: any) {
    console.error("Error loading hours stats:", err);
    hoursError.value = "Не удалось загрузить статистику часов";
  } finally {
    hoursLoading.value = false;
  }
};

const getUsageColorClass = (percentage: number) => {
  if (percentage >= 100) return "text-danger";
  if (percentage >= 80) return "text-warning";
  return "text-success";
};

const getProgressBarColorClass = (percentage: number) => {
  if (percentage >= 100) return "bg-danger";
  if (percentage >= 80) return "bg-warning";
  return "bg-success";
};

// Course History Logic
const loadCourseHistory = async () => {
  historyLoading.value = true;
  historyError.value = null;

  try {
    const response = await authFetch<{
      success: boolean;
      data: CourseHistory; // Updated to match likely API response structure wrapper
    }>(`/api/instructors/${instructorId}/course-history`);

    // Note: Adjust based on actual API response structure if it's strictly { success: boolean, ...data } or wrapped in data
    // Assuming spread or direct access based on typical usage
    if (response.success && (response as any).history) {
      courseHistory.value = response as any; // If flat
    } else if (response.success && response.data) {
      courseHistory.value = response.data;
    } else {
      // Fallback logic if needed, or assume flat structure like stats
      courseHistory.value = response as unknown as CourseHistory;
    }
  } catch (err: any) {
    console.error("Error loading course history:", err);
    historyError.value = "Не удалось загрузить историю курсов";
  } finally {
    historyLoading.value = false;
  }
};

const getEventTypeIcon = (type: string) => {
  switch (type) {
    case "exam":
      return GraduationCap;
    case "assessment":
      return FileText;
    default:
      return BookOpen;
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case "exam":
      return "bg-danger/10 text-danger";
    case "assessment":
      return "bg-warning/10 text-warning";
    default:
      return "bg-primary/10 text-primary";
  }
};

const formatEventDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
};

const formatTime = (time: string) => {
  return time.substring(0, 5);
};

const getCompletionColor = (percent: number) => {
  if (percent === 100) return "text-success";
  if (percent >= 50) return "text-warning";
  return "text-danger";
};

// Lifecycle
onMounted(() => {
  loadInstructor();
  // Optional: Auto-load stats if desired
  // loadHoursStats();
});
</script>
