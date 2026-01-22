<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">
          Загрузка информации о группе...
        </p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div
      v-else-if="!group"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center">
        <svg
          class="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Группа не найдена
        </h3>
        <p class="mt-2 text-gray-500 dark:text-gray-400">
          Возможно, группа была удалена или перемещена
        </p>
        <UiButton class="mt-6" @click="$router.push('/groups')">
          Вернуться к списку групп
        </UiButton>
      </div>
    </div>

    <!-- Содержимое -->
    <template v-else>
      <!-- Заголовок и навигация -->
      <div class="mb-6">
        <div
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4"
        >
          <NuxtLink to="/groups" class="hover:text-primary transition-colors"
            >Учебные группы</NuxtLink
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
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span class="text-gray-900 dark:text-white">{{ group.code }}</span>
        </div>

        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl"
            >
              {{ group.code.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-bold text-black dark:text-white">
                  {{ group.code }}
                </h1>
                <span
                  v-if="group.isArchived"
                  class="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  АРХИВ
                </span>
              </div>
              <p class="text-gray-500 dark:text-gray-400">
                {{ group.course?.name }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <NuxtLink
              v-if="canIssueCertificates && !group.isArchived"
              :to="`/groups/${group.id}/certificates`"
            >
              <UiButton variant="primary">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Выдача сертификатов
              </UiButton>
            </NuxtLink>

            <UiButton
              v-if="canEditGroups && !group.isArchived"
              variant="outline"
              @click="showEditModal = true"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Редактировать
            </UiButton>

            <!-- Кнопка архивации (только Админ) -->
            <UiButton
              v-if="canArchiveGroups"
              variant="outline"
              @click="confirmArchive"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              {{ group.isArchived ? "Восстановить" : "В архив" }}
            </UiButton>

            <!-- Удалить (Только Админ) -->
            <UiButton
              v-if="isAdmin"
              variant="danger"
              @click="showDeleteModal = true"
            >
              <svg
                class="w-4 h-4 mr-2"
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
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Блок дисциплин на всю ширину -->
      <div
        v-if="disciplines.length > 0"
        class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md p-6"
      >
        <!-- (Укорочено: то же самое, что и было) -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <div
              class="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"
            >
              <svg
                class="w-5 h-5 text-info"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-black dark:text-white">
                Журналы дисциплин
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ disciplines.length }} дисциплин в программе
              </p>
            </div>
          </div>
        </div>

        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <NuxtLink
            v-for="discipline in disciplines"
            :key="discipline.id"
            :to="`/groups/journal/${group?.id}_${discipline.id}`"
            class="group p-4 rounded-xl bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-lg transition-all duration-200"
          >
            <div class="flex items-start justify-between mb-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <svg
                class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <h4
              class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2"
            >
              {{ discipline.name }}
            </h4>
            <!-- Статистика часов -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ discipline.theoryHours }} т
              </span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                {{ discipline.practiceHours }} п
              </span>
              <!-- ... -->
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Информация о группе, Курс и Отчеты -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Левая колонка: Информация + Учебная программа -->
        <div class="space-y-6">
          <!-- Карточка информации -->
          <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
              Информация о группе
            </h3>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400"
                  >Код группы</label
                >
                <p class="text-gray-900 dark:text-white font-medium">
                  {{ group.code }}
                </p>
              </div>

              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400"
                  >Статус</label
                >
                <p>
                  <span
                    :class="[
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium',
                      statusClass,
                    ]"
                  >
                    {{ statusText }}
                  </span>
                </p>
              </div>

              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400"
                  >Даты обучения</label
                >
                <p class="text-gray-900 dark:text-white font-medium">
                  {{ formatDate(group.startDate) }} —
                  {{ formatDate(group.endDate) }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ daysInfo }}
                </p>
              </div>

              <div v-if="group.description" class="col-span-2">
                <label class="text-sm text-gray-500 dark:text-gray-400"
                  >Описание</label
                >
                <p class="text-gray-900 dark:text-white">
                  {{ group.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Карточка курса (Учебная программа) -->
          <div
            v-if="group.course"
            class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6"
          >
            <h3 class="text-lg font-semibold text-black dark:text-white mb-4">
              Учебная программа
            </h3>

            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-500 dark:text-gray-400"
                  >Название</label
                >
                <p class="text-gray-900 dark:text-white font-medium">
                  {{ group.course.name }}
                </p>
              </div>

              <div class="flex gap-6">
                <div>
                  <label class="text-sm text-gray-500 dark:text-gray-400"
                    >Код</label
                  >
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ group.course.code }}
                  </p>
                </div>
                <div>
                  <label class="text-sm text-gray-500 dark:text-gray-400"
                    >Всего часов</label
                  >
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ group.course.totalHours }} а-ч
                  </p>
                </div>
              </div>

              <NuxtLink
                :to="`/programs/${group.courseId}`"
                class="inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                Перейти к программе
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
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Правая колонка: Документы группы -->
        <div class="rounded-xl bg-white dark:bg-boxdark shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-black dark:text-white">
              Документы группы
            </h3>
            <UiButton
              v-if="canEditGroups && !group.isArchived"
              variant="outline"
              size="sm"
              @click="showUploadReportModal = true"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Загрузить документ
            </UiButton>
          </div>
          <div v-if="loadingReports" class="text-sm text-gray-500">
            Загрузка документов...
          </div>
          <div
            v-else-if="reports.length === 0"
            class="text-sm text-gray-500 italic"
          >
            Документов не найдено
          </div>
          <!-- Список документов с ограничением высоты и скроллингом (4 строки) -->
          <div v-else class="space-y-3 max-h-[340px] overflow-y-auto pr-2">
            <div
              v-for="report in reports"
              :key="report.id"
              class="flex items-center justify-between p-3 rounded border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-danger/10 text-danger"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p
                    class="truncate text-sm font-medium text-gray-900 dark:text-white"
                  >
                    {{ report.name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ new Date(report.uploadedAt).toLocaleDateString() }} •
                    {{ formatFileSize(report.size) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <!-- Кнопка просмотра -->
                <button
                  @click="previewReport(report)"
                  class="text-info hover:text-info-dark p-1.5 rounded-full hover:bg-info/10 transition-colors"
                  title="Просмотр"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>

                <!-- Кнопка скачивания -->
                <button
                  @click="downloadReport(report)"
                  class="text-primary hover:text-primary-dark p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                  title="Скачать"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>

                <!-- Кнопка удаления (только для модераторов и админов) -->
                <button
                  v-if="canEditGroups || isAdmin"
                  @click="confirmDeleteReport(report)"
                  class="text-danger hover:text-danger-dark p-1.5 rounded-full hover:bg-danger/10 transition-colors"
                  title="Удалить"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Слушатели -->
      <div
        class="mb-6 rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"
      >
        <!-- ... тот же контент ... -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"
              >
                <svg
                  class="w-5 h-5 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-black dark:text-white">
                  Слушатели
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ group.students?.length || 0 }} человек
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UiButton
                v-if="canManageGroupStudents && !group.isArchived"
                @click="showManageStudentsModal = true"
              >
                Управление слушателями
              </UiButton>

              <!-- Кнопка скачивания пустого журнала с выбором формата -->
              <div
                v-if="group.students && group.students.length > 0"
                class="relative inline-block"
              >
                <UiButton
                  variant="outline"
                  @click="toggleEmptyJournalDropdown"
                  :disabled="generatingEmptyJournal"
                  class="flex items-center gap-2"
                >
                  <svg
                    v-if="!generatingEmptyJournal"
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{{
                    generatingEmptyJournal ? "Генерация..." : "Пустой журнал"
                  }}</span>
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </UiButton>

                <!-- Выпадающее меню -->
                <div
                  v-if="showEmptyJournalDropdown"
                  class="absolute right-0 mt-2 w-48 bg-white dark:bg-boxdark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                >
                  <button
                    @click="downloadEmptyJournal('pdf')"
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 rounded-t-lg"
                  >
                    <svg
                      class="w-4 h-4 text-danger"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                      />
                      <path d="M14 2v6h6" />
                      <path d="M10 13h4" />
                      <path d="M10 17h4" />
                      <path d="M10 9h1" />
                    </svg>
                    <span>Скачать PDF</span>
                  </button>
                  <button
                    @click="downloadEmptyJournal('docx')"
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 rounded-b-lg"
                  >
                    <svg
                      class="w-4 h-4 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                      />
                      <path d="M14 2v6h6" />
                      <path d="M10 12h4" />
                      <path d="M10 16h4" />
                    </svg>
                    <span>Скачать Word</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!group.students || group.students.length === 0"
          class="p-12 text-center text-gray-500 dark:text-gray-400"
        >
          <p>В группе пока нет слушателей</p>
        </div>
        <template v-else>
          <!-- Таблица слушателей -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr
                  class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                >
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Слушатель
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Организация
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Должность
                  </th>
                  <th
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Посещаемость
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    Дата зачисления
                  </th>
                  <th
                    v-if="canEditGroups || isAdmin"
                    class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                  >
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="gs in paginatedStudents"
                  :key="gs.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div
                        class="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success font-semibold"
                      >
                        {{ getInitials(gs.student?.fullName) }}
                      </div>
                      <span class="font-medium text-gray-900 dark:text-white">{{
                        gs.student?.fullName
                      }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      class="truncate max-w-[200px] inline-block"
                      :title="gs.student?.organization"
                      >{{ gs.student?.organization || "—" }}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      class="truncate max-w-[150px] inline-block"
                      :title="gs.student?.position"
                      >{{ gs.student?.position || "—" }}</span
                    >
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium"
                      :class="
                        getAttendanceColorClass(
                          getStudentAttendance(gs.studentId),
                        )
                      "
                    >
                      {{ getStudentAttendance(gs.studentId).toFixed(0) }}%
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {{ formatDate(gs.enrolledAt) }}
                  </td>
                  <td
                    v-if="canEditGroups || isAdmin"
                    class="px-6 py-4 text-center"
                  >
                    <NuxtLink
                      :to="`/students/${gs.studentId}`"
                      class="inline-flex items-center justify-center p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Просмотр студента"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Пагинация (как была) -->
          <div
            class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ paginationInfo }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                :disabled="currentStudentsPage === 1"
                @click="currentStudentsPage--"
                class="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Назад
              </button>
              <button
                :disabled="currentStudentsPage === totalStudentsPages"
                @click="currentStudentsPage++"
                class="p-2 border rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Расписание -->
      <div
        class="rounded-xl bg-white dark:bg-boxdark shadow-md overflow-hidden"
      >
        <button
          class="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          @click="scheduleExpanded = !scheduleExpanded"
        >
          <div class="flex items-center gap-3 flex-1">
            <div
              class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div class="text-left flex-1">
              <div class="flex items-center gap-3 mb-1">
                <h3 class="text-lg font-semibold text-black dark:text-white">
                  Расписание занятий
                </h3>
                <span class="text-sm text-gray-500">
                  {{ scheduleEvents.length }}
                  {{
                    scheduleEvents.length === 1
                      ? "занятие"
                      : scheduleEvents.length < 5
                        ? "занятия"
                        : "занятий"
                  }}
                </span>
              </div>

              <!-- Счетчик часов и прогресс-бар -->
              <div v-if="totalProgramHours > 0" class="space-y-2">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ totalScheduledHours }} / {{ totalProgramHours }} а-ч
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="{
                        'bg-success/10 text-success': hoursProgress >= 100,
                        'bg-info/10 text-info':
                          hoursProgress >= 75 && hoursProgress < 100,
                        'bg-warning/10 text-warning':
                          hoursProgress >= 50 && hoursProgress < 75,
                        'bg-danger/10 text-danger': hoursProgress < 50,
                      }"
                    >
                      {{ hoursProgress }}%
                    </span>
                  </div>
                </div>

                <!-- Прогресс-бар -->
                <div
                  class="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                >
                  <div
                    class="h-full transition-all duration-500 rounded-full"
                    :class="hoursProgressColor"
                    :style="{ width: `${hoursProgress}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <!-- Chevron icon -->
          <svg
            class="w-5 h-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': scheduleExpanded }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <!-- Schedule content -->
        <div
          v-if="scheduleExpanded"
          class="border-t border-gray-200 dark:border-gray-700"
        >
          <div v-if="loadingSchedule" class="p-6 text-center">
            <div
              class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
            ></div>
            <p class="mt-2 text-sm text-gray-500">Загрузка расписания...</p>
          </div>

          <div
            v-else-if="scheduleEvents.length === 0"
            class="p-12 text-center text-gray-500 dark:text-gray-400"
          >
            <svg
              class="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Занятия не запланированы</p>
            <p class="text-sm mt-2">
              Добавьте занятия в расписание через календарь
            </p>
          </div>

          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div
              v-for="event in scheduleEvents"
              :key="event.id"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="inline-block w-2 h-2 rounded-full"
                      :class="{
                        'bg-blue-500': event.eventType === 'theory',
                        'bg-green-500': event.eventType === 'practice',
                        'bg-orange-500': event.eventType === 'assessment',
                        'bg-gray-500': event.eventType === 'other',
                      }"
                    ></span>
                    <h4
                      class="font-medium text-gray-900 dark:text-white text-sm"
                    >
                      {{ event.title }}
                    </h4>
                  </div>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <div class="flex items-center gap-1.5">
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{{ formatDate(event.startTime) }}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        >{{ formatTime(event.startTime) }} -
                        {{ formatTime(event.endTime) }}</span
                      >
                    </div>
                    <div
                      v-if="event.instructor"
                      class="flex items-center gap-1.5"
                    >
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>{{
                        event.instructor.fullName ||
                        event.instructor.name ||
                        "Не указан"
                      }}</span>
                    </div>
                    <div
                      v-if="event.classroom"
                      class="flex items-center gap-1.5"
                    >
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      <span>{{ event.classroom.name || event.classroom }}</span>
                    </div>
                    <div
                      v-if="getAcademicHours(event) > 0"
                      class="flex items-center gap-1.5"
                    >
                      <svg
                        class="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                      >
                        {{ getAcademicHours(event) }} а-ч
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна -->
    <GroupsGroupFormModal
      :is-open="showEditModal"
      :group="group"
      @close="showEditModal = false"
      @updated="handleGroupUpdated"
    />

    <GroupsManageStudentsModal
      :is-open="showManageStudentsModal"
      :group="group"
      @close="showManageStudentsModal = false"
      @updated="loadGroup"
    />

    <!-- Архив модал -->
    <UiConfirmModal
      :is-open="showArchiveModal"
      :title="group?.isArchived ? 'Восстановление группы' : 'Архивация группы'"
      :message="
        group?.isArchived
          ? 'Вы уверены, что хотите восстановить эту группу?'
          : 'Вы уверены, что хотите архивировать эту группу? Она будет скрыта из списка активных групп.'
      "
      :item-name="group?.code"
      :loading="isArchiving"
      @confirm="archiveGroup"
      @cancel="showArchiveModal = false"
    />

    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы"
      message="Вы уверены, что хотите удалить эту группу?"
      :item-name="group?.code"
      warning="Все слушатели и отчеты будут удалены. Это действие нельзя отменить."
      :loading="isDeleting"
      @confirm="deleteGroup"
      @cancel="showDeleteModal = false"
    />

    <!-- Модальное окно загрузки документов -->
    <GroupsUploadReportModal
      v-if="group"
      :is-open="showUploadReportModal"
      :group-id="group.id"
      :group-code="group.code"
      @close="showUploadReportModal = false"
      @uploaded="handleReportUploaded"
    />

    <!-- Модальное окно просмотра PDF -->
    <UiModal :is-open="showPreviewModal" @close="closePreview" size="xl">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ previewingReport?.name }}
          </h3>
          <button
            @click="closePreview"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg
              class="w-6 h-6"
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
      </template>

      <div v-if="loadingPreview" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
          ></div>
          <p class="mt-4 text-sm text-gray-500">Загрузка документа...</p>
        </div>
      </div>
      <div v-else-if="previewError" class="text-center py-12">
        <svg
          class="mx-auto h-12 w-12 text-danger mb-4"
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
        <p class="text-danger">{{ previewError }}</p>
      </div>
      <div v-else-if="previewUrl" class="w-full" style="height: 70vh">
        <iframe
          :src="previewUrl"
          class="w-full h-full border-0 rounded"
          title="PDF Preview"
        ></iframe>
      </div>
    </UiModal>

    <!-- Модальное окно подтверждения удаления документа -->
    <UiConfirmModal
      :is-open="showDeleteReportModal"
      title="Удаление документа"
      message="Вы уверены, что хотите удалить этот документ?"
      :item-name="reportToDelete?.name"
      warning="Это действие нельзя отменить."
      :loading="isDeletingReport"
      @confirm="deleteReport"
      @cancel="showDeleteReportModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { StudyGroup } from "~/types/group";
import { generateEmptyJournal } from "~/utils/pdf/generateEmptyJournal";

// ... imports ...

interface Discipline {
  id: string;
  name: string;
  theoryHours: number;
  practiceHours: number;
  assessmentHours: number;
  hours: number;
}

definePageMeta({
  layout: "default",
});

const route = useRoute();
const router = useRouter();
const { authFetch } = useAuthFetch();
const toast = useNotification();
const { user } = useAuth();
const {
  canEditGroups,
  canDeleteGroups,
  canManageGroupStudents,
  canIssueCertificates,
  canArchiveGroups,
  isAdmin,
} = usePermissions(); // Assuming isAdmin is available or check authStore.user.role

// Получаем настройки расписания для правильного вычисления академических часов
const { settings: scheduleSettings, loadSettings: loadScheduleSettings } =
  useScheduleSettings();

// State
const loading = ref(true);
const group = ref<StudyGroup | null>(null);
const showEditModal = ref(false);
const showManageStudentsModal = ref(false);
const showDeleteModal = ref(false);
const showArchiveModal = ref(false);
const showUploadReportModal = ref(false);
const isDeleting = ref(false);
const isArchiving = ref(false);
const loadingSchedule = ref(false);
const scheduleEvents = ref<any[]>([]);
const disciplines = ref<Discipline[]>([]);
const scheduleExpanded = ref(false);
const studentAttendanceData = ref<
  Map<string, { attended: number; total: number }>
>(new Map());
const reports = ref<any[]>([]); // Добавлено для отчетов
const loadingReports = ref(false);
const generatingEmptyJournal = ref(false); // Состояние генерации пустого журнала
const showEmptyJournalDropdown = ref(false); // Состояние выпадающего меню формата

// Состояния для просмотра и удаления документов
const showPreviewModal = ref(false);
const previewingReport = ref<any>(null);
const previewUrl = ref<string>("");
const loadingPreview = ref(false);
const previewError = ref<string>("");
const showDeleteReportModal = ref(false);
const reportToDelete = ref<any>(null);
const isDeletingReport = ref(false);

const currentStudentsPage = ref(1);
const studentsPerPage = ref(10);

// ... existing helper methods ...
const getInitials = (name?: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getAcademicHours = (event: any): number => {
  // Используем academicHours напрямую, если есть
  if (event.academicHours) {
    return event.academicHours;
  }

  // Fallback для старых записей: расчёт из durationMinutes
  const academicHourMinutes = parseInt(
    scheduleSettings.value.academic_hour_minutes || "40",
    10,
  );

  if (event.durationMinutes) {
    return Math.ceil(event.durationMinutes / academicHourMinutes);
  }

  // Последний fallback: расчёт из разницы времени
  if (event.startTime && event.endTime) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.ceil(diffMinutes / academicHourMinutes);
  }

  return 0;
};

const getStudentAttendance = (studentId: string): number => {
  const data = studentAttendanceData.value.get(studentId);
  if (!data || data.total === 0) return 0;
  return (data.attended / data.total) * 100;
};

const getAttendanceColorClass = (percent: number): string => {
  if (percent >= 75) return "bg-success/10 text-success";
  if (percent >= 50) return "bg-warning/10 text-warning";
  return "bg-danger/10 text-danger";
};

// Загрузка посещаемости для всех студентов
const loadStudentAttendance = async () => {
  if (!group.value?.id || !group.value?.students?.length) return;

  const groupId = group.value.id;
  const newData = new Map<string, { attended: number; total: number }>();

  // Для каждой дисциплины загружаем данные журнала
  for (const discipline of disciplines.value) {
    try {
      const response = await authFetch<{
        success: boolean;
        rows?: Array<{
          student: { id: string };
          totalHoursAttended: number;
          totalMaxHours: number;
        }>;
      }>(
        `/api/attendance/journal?groupId=${groupId}&disciplineId=${discipline.id}`,
      );

      if (response.success && response.rows) {
        for (const row of response.rows) {
          const current = newData.get(row.student.id) || {
            attended: 0,
            total: 0,
          };
          current.attended += row.totalHoursAttended || 0;
          current.total += row.totalMaxHours || 0;
          newData.set(row.student.id, current);
        }
      }
    } catch (err) {
      console.error(
        "Error loading attendance for discipline:",
        discipline.id,
        err,
      );
    }
  }

  studentAttendanceData.value = newData;
};

// ... status computed ...
const statusClass = computed(() => {
  if (!group.value) return "";
  if (group.value.isArchived)
    return "bg-gray-100 dark:bg-gray-700 text-gray-500";
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive)
    return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
  if (endDate < today) return "bg-warning/10 text-warning";
  if (startDate > today) return "bg-info/10 text-info";
  return "bg-success/10 text-success";
});

const statusText = computed(() => {
  if (!group.value) return "";
  if (group.value.isArchived) return "Архив";
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive) return "Неактивна";
  if (endDate < today) return "Завершена";
  if (startDate > today) return "Ожидает начала";
  return "В процессе";
});

const daysInfo = computed(() => {
  if (!group.value) return "";
  const today = new Date();
  const startDate = new Date(group.value.startDate);
  const endDate = new Date(group.value.endDate);
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (startDate > today) {
    const daysUntilStart = Math.ceil(
      (startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `Начнётся через ${daysUntilStart} дн.`;
  }
  if (endDate < today) {
    return `Завершено (${totalDays} дн.)`;
  }
  const daysPassed = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return `${daysPassed} из ${totalDays} дн.`;
});

// Pagination computed...
const totalStudentsPages = computed(() => {
  if (!group.value?.students) return 1;
  return Math.ceil(group.value.students.length / studentsPerPage.value) || 1;
});
const paginatedStudents = computed(() => {
  if (!group.value?.students) return [];
  const start = (currentStudentsPage.value - 1) * studentsPerPage.value;
  return group.value.students.slice(start, start + studentsPerPage.value);
});
const paginationInfo = computed(() => {
  if (!group.value?.students) return "";
  const total = group.value.students.length;
  const start = (currentStudentsPage.value - 1) * studentsPerPage.value + 1;
  const end = Math.min(
    currentStudentsPage.value * studentsPerPage.value,
    total,
  );
  return `${start}–${end} из ${total}`;
});

// Computed для подсчета часов и прогресса
const totalProgramHours = computed(() => {
  return group.value?.course?.totalHours || 0;
});

const totalScheduledHours = computed(() => {
  const total = scheduleEvents.value.reduce((sum, event) => {
    // Используем academicHours напрямую, если есть
    if (event.academicHours) {
      return sum + event.academicHours;
    }

    // Fallback для старых записей: расчёт из durationMinutes
    const academicHourMinutes = parseInt(
      scheduleSettings.value.academic_hour_minutes || "40",
      10,
    );

    if (event.durationMinutes) {
      return sum + Math.ceil(event.durationMinutes / academicHourMinutes);
    }

    // Последний fallback: расчёт из разницы времени
    if (event.startTime && event.endTime) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return sum + Math.ceil(diffMinutes / academicHourMinutes);
    }
    return sum;
  }, 0);

  console.log("[totalScheduledHours] Всего запланировано часов:", total);
  return total;
});

const hoursProgress = computed(() => {
  if (totalProgramHours.value === 0) return 0;
  return Math.min(
    Math.round((totalScheduledHours.value / totalProgramHours.value) * 100),
    100,
  );
});

const hoursProgressColor = computed(() => {
  const progress = hoursProgress.value;
  if (progress >= 100) return "bg-success";
  if (progress >= 75) return "bg-info";
  if (progress >= 50) return "bg-warning";
  return "bg-danger";
});

// Load actions
const loadSchedule = async (groupId: string) => {
  loadingSchedule.value = true;
  try {
    const response = await authFetch<{ success: boolean; events: any[] }>(
      `/api/schedule?groupId=${groupId}&limit=100`,
    );
    if (response.success && response.events) {
      scheduleEvents.value = response.events;
    }
  } catch (e) {
    console.error("Error loading schedule:", e);
  } finally {
    loadingSchedule.value = false;
  }
};

const loadGroup = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const response = await authFetch<{ success: boolean; group?: StudyGroup }>(
      `/api/groups/${id}`,
    );
    if (response.success && response.group) {
      group.value = response.group;
      loadReports(id);
      loadSchedule(id);

      // Загрузка дисциплин (используем эндпоинт группы)
      try {
        const discResponse = await authFetch<{
          success: boolean;
          disciplines: Discipline[];
        }>(`/api/groups/${id}/disciplines`);
        if (discResponse.success) {
          disciplines.value = discResponse.disciplines || [];
          loadStudentAttendance();
        }
      } catch (err) {
        console.error("Error loading disciplines", err);
      }
    } else {
      group.value = null;
    }
  } catch (error) {
    console.error("Error loading group:", error);
    group.value = null;
  } finally {
    loading.value = false;
  }
};

const loadReports = async (groupId: string) => {
  loadingReports.value = true;
  console.log("[loadReports] Загрузка документов для группы:", groupId);
  try {
    const res = await authFetch<{ success: boolean; files: any[] }>(
      `/api/groups/${groupId}/reports`,
    );
    console.log("[loadReports] Ответ от API:", res);
    if (res.success) {
      reports.value = res.files;
      console.log("[loadReports] Загружено документов:", res.files.length);
      // Логируем структуру первого файла для отладки
      if (res.files.length > 0) {
        console.log("[loadReports] Структура первого файла:", res.files[0]);
        console.log("[loadReports] UUID первого файла:", res.files[0].uuid);
      }
    } else {
      console.warn("[loadReports] API вернул success: false");
    }
  } catch (e) {
    console.error("[loadReports] Ошибка загрузки документов:", e);
  } finally {
    loadingReports.value = false;
  }
};

// Функция переключения выпадающего меню формата журнала
const toggleEmptyJournalDropdown = () => {
  showEmptyJournalDropdown.value = !showEmptyJournalDropdown.value;
};

// Функция для скачивания пустого журнала
const downloadEmptyJournal = async (format: "pdf" | "docx" = "pdf") => {
  if (generatingEmptyJournal.value || !group.value) return;

  // Закрываем выпадающее меню
  showEmptyJournalDropdown.value = false;

  try {
    generatingEmptyJournal.value = true;

    // Собираем список студентов
    const studentNames =
      group.value.students
        ?.map((gs: any) => gs.student?.fullName || "")
        .filter(Boolean) || [];

    if (studentNames.length === 0) {
      toast.error("В группе нет студентов");
      return;
    }

    // Подготавливаем данные для пустого журнала
    const emptyJournalData = {
      groupCode: group.value.code,
      courseName: group.value.course?.name,
      startDate: group.value.startDate,
      endDate: group.value.endDate,
      studentNames,
      columnCount: 20, // 20 пустых колонок
    };

    // Генерируем документ в выбранном формате
    if (format === "pdf") {
      await generateEmptyJournal(emptyJournalData);
    } else {
      const { generateEmptyJournalDocx } =
        await import("~/utils/docx/generateEmptyJournal");
      await generateEmptyJournalDocx(emptyJournalData);
    }

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "empty_journal",
          format,
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    toast.success(
      `Пустой журнал успешно сформирован (${format.toUpperCase()})`,
    );
  } catch (error: any) {
    console.error("Error generating empty journal:", error);
    toast.error(error.message || "Ошибка при формировании пустого журнала");
  } finally {
    generatingEmptyJournal.value = false;
  }
};

const confirmArchive = () => {
  showArchiveModal.value = true;
};

const archiveGroup = async () => {
  if (!group.value) return;
  isArchiving.value = true;
  try {
    const newStatus = !group.value.isArchived;
    await authFetch(`/api/groups/${group.value.id}/archive`, {
      method: "PUT",
      body: { isArchived: newStatus },
    });
    toast.success(newStatus ? "Группа архивирована" : "Группа восстановлена");
    showArchiveModal.value = false;
    loadGroup();
  } catch (e) {
    toast.error("Ошибка изменения статуса архивации");
    console.error(e);
  } finally {
    isArchiving.value = false;
  }
};

const downloadReport = async (report: any) => {
  try {
    console.log("[downloadReport] Скачивание файла:", report.name);
    console.log("[downloadReport] URL:", report.url);

    // Получаем токен из куки
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      console.error("[downloadReport] Токен не найден");
      toast.error("Ошибка авторизации");
      return;
    }

    // Используем fetch для получения файла с токеном
    const response = await fetch(report.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(
        "[downloadReport] Ошибка ответа:",
        response.status,
        response.statusText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем blob
    const blob = await response.blob();
    console.log("[downloadReport] Получен blob, размер:", blob.size);

    // Создаем временную ссылку для скачивания
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = report.name;
    document.body.appendChild(a);
    a.click();

    // Очищаем
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log("[downloadReport] Файл успешно скачан");
  } catch (error) {
    console.error("[downloadReport] Ошибка скачивания:", error);
    toast.error("Ошибка при скачивании файла");
  }
};

// Функция для просмотра документа
const previewReport = async (report: any) => {
  try {
    console.log("[previewReport] Открытие просмотра:", report.name);
    previewingReport.value = report;
    showPreviewModal.value = true;
    loadingPreview.value = true;
    previewError.value = "";
    previewUrl.value = "";

    // Получаем токен из куки
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      console.error("[previewReport] Токен не найден");
      previewError.value = "Ошибка авторизации";
      loadingPreview.value = false;
      return;
    }

    // Загружаем файл с токеном
    const response = await fetch(report.url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(
        "[previewReport] Ошибка ответа:",
        response.status,
        response.statusText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем blob
    const blob = await response.blob();
    console.log("[previewReport] Получен blob, размер:", blob.size);

    // Создаем URL для просмотра
    const url = window.URL.createObjectURL(blob);
    previewUrl.value = url;

    console.log("[previewReport] Документ готов к просмотру");
  } catch (error) {
    console.error("[previewReport] Ошибка загрузки:", error);
    previewError.value = "Ошибка при загрузке документа";
  } finally {
    loadingPreview.value = false;
  }
};

// Функция для закрытия просмотра
const closePreview = () => {
  showPreviewModal.value = false;
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
  }
  previewUrl.value = "";
  previewingReport.value = null;
  previewError.value = "";
};

// Функция для подтверждения удаления документа
const confirmDeleteReport = (report: any) => {
  reportToDelete.value = report;
  showDeleteReportModal.value = true;
};

// Функция для удаления документа
const deleteReport = async () => {
  if (!reportToDelete.value || !group.value) return;

  isDeletingReport.value = true;
  try {
    console.log(
      "[deleteReport] Полный объект документа:",
      reportToDelete.value,
    );
    console.log("[deleteReport] UUID документа:", reportToDelete.value.uuid);
    console.log("[deleteReport] ID группы:", group.value.id);
    console.log(
      "[deleteReport] URL запроса:",
      `/api/groups/${group.value.id}/reports/${reportToDelete.value.uuid}`,
    );

    await authFetch(
      `/api/groups/${group.value.id}/reports/${reportToDelete.value.uuid}`,
      {
        method: "DELETE",
      },
    );

    toast.success("Документ успешно удален");
    showDeleteReportModal.value = false;
    reportToDelete.value = null;

    // Перезагружаем список документов
    loadReports(group.value.id);
  } catch (error) {
    console.error("[deleteReport] Ошибка удаления:", error);
    toast.error("Ошибка при удалении документа");
  } finally {
    isDeletingReport.value = false;
  }
};

const deleteGroup = async () => {
  if (!group.value) return;
  isDeleting.value = true;
  try {
    await authFetch(`/api/groups/${group.value.id}`, { method: "DELETE" });
    toast.success("Группа удалена");
    router.push("/groups");
  } catch (e) {
    toast.error("Ошибка удаления группы");
  } finally {
    isDeleting.value = false;
  }
};

const handleGroupUpdated = (updated: StudyGroup) => {
  group.value = updated;
  // Maybe reload full data
  loadGroup();
};

const handleReportUploaded = () => {
  // Перезагружаем список документов
  if (group.value?.id) {
    loadReports(group.value.id);
  }
};

onMounted(() => {
  loadScheduleSettings(); // Загружаем настройки расписания
  loadGroup();
});
</script>
