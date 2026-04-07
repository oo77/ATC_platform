<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка сертификатов...
        </p>
      </div>
    </div>

    <!-- Контент -->
    <template v-else-if="group">
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs -->
        <div class="mb-6">
          <NuxtLink
            :to="`/groups/${groupId}`"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-4 h-4 transition-transform group-hover:-translate-x-1"
              />
            </div>
            Назад к группе
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Left: Title & Info -->
          <div class="space-y-3">
            <h1
              class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-4"
            >
              Выдача сертификатов
            </h1>
            <p
              class="text-sm font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"
            >
              <span
                class="text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider"
                >{{ group.code }}</span
              >
              {{ group.course?.name }}
            </p>
          </div>

          <!-- Настройки выдачи -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Информация о шаблоне -->
            <div
              v-if="template"
              class="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm border border-primary/20 shadow-sm"
            >
              <FileIcon class="w-4 h-4" />
              <span>{{ template.name }}</span>
            </div>

            <!-- Предупреждение если нет шаблона -->
            <div
              v-else
              class="flex items-center gap-2 px-3 py-2 bg-warning/10 text-warning rounded-xl font-bold text-sm border border-warning/20 shadow-sm"
            >
              <AlertTriangle class="w-4 h-4" />
              <span>Шаблон не назначен для курса</span>
              <NuxtLink
                :to="`/programs/edit/${group.course?.id}`"
                class="text-xs underline hover:no-underline ml-2 text-warning/80"
              >
                Настроить
              </NuxtLink>
            </div>

            <!-- Выбор инструктора -->
            <div
              v-if="instructors.length > 0"
              class="flex items-center gap-2 group relative"
            >
              <div
                class="absolute left-3 text-slate-400 pointer-events-none z-10"
              >
                <UserIcon class="w-4 h-4" />
              </div>
              <select
                v-model="selectedInstructorId"
                class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-8 py-2 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none shadow-sm cursor-pointer"
              >
                <option :value="null">Инструктор (не указан)</option>
                <option
                  v-for="instructor in instructors"
                  :key="instructor.id"
                  :value="instructor.id"
                >
                  {{ instructor.fullName }}
                  <template v-if="instructor.isPrimary"> (основной)</template>
                </option>
              </select>
              <div class="absolute right-3 pointer-events-none text-slate-400">
                <ChevronDown class="w-4 h-4" />
              </div>
            </div>

            <!-- Дата выдачи -->
            <div class="flex items-center gap-2 relative">
              <input
                v-model="issueDate"
                type="date"
                class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm appearance-none"
              />
            </div>

            <!-- Срок действия -->
            <div
              v-if="group.course?.certificateValidityMonths"
              class="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <Clock class="w-4 h-4 text-slate-500" />
              <span
                class="text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                Срок: {{ group.course.certificateValidityMonths }} мес.
              </span>
            </div>
            <div
              v-else
              class="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <Clock class="w-4 h-4 text-slate-500" />
              <span class="text-sm font-bold text-slate-600 dark:text-slate-400"
                >Бессрочный</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <!-- Total -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Слушателей
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ stats.totalStudents }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-slate-600 dark:text-slate-300 transition-transform group-hover:rotate-12"
            >
              <Users class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Eligible -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Допущены
              </p>
              <h3 class="mt-1 text-2xl font-bold text-success">
                {{ stats.eligible }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12"
            >
              <CheckCircle class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- With Warnings -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                С предупреждениями
              </p>
              <h3 class="mt-1 text-2xl font-bold text-warning">
                {{ stats.withWarnings }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Issued -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Выдано
              </p>
              <h3 class="mt-1 text-2xl font-bold text-primary">
                {{ stats.issued }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12"
            >
              <Award class="w-5 h-5" />
            </div>
          </div>
        </div>

        <!-- Revoked -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Отозвано
              </p>
              <h3 class="mt-1 text-2xl font-bold text-danger">
                {{ stats.revoked }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-danger/10 p-3 text-danger transition-transform group-hover:rotate-12"
            >
              <XCircle class="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Toolkit -->
      <div
        class="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
      >
        <div class="flex flex-wrap gap-3">
          <!-- Выдать всем допущенным -->
          <UiButton
            @click="openBulkIssueModal('eligible')"
            :disabled="
              !template ||
              eligibleWithoutCertificate === 0 ||
              isIssuing ||
              certIssueStore.isIssuing.value
            "
            variant="primary"
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
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
            Выдать всем допущенным ({{ eligibleWithoutCertificate }})
          </UiButton>

          <!-- Выдать выбранным -->
          <UiButton
            @click="openBulkIssueModal('selected')"
            :disabled="
              !template ||
              selectedStudentIds.length === 0 ||
              isIssuing ||
              certIssueStore.isIssuing.value
            "
            variant="outline"
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Выдать выбранным ({{ selectedStudentIds.length }})
          </UiButton>

          <!-- Скачать ведомость с выбором формата -->
          <div class="relative inline-block">
            <UiButton
              @click="toggleReportDropdown"
              :disabled="generatingPdf || journal.length === 0"
              variant="outline"
              class="font-bold border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FileIcon v-if="!generatingPdf" class="w-4 h-4 mr-2" />
              <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
              <span>{{ generatingPdf ? "Генерация..." : "Ведомость" }}</span>
              <ChevronDown class="w-4 h-4 ml-1 opacity-50" />
            </UiButton>

            <!-- Выпадающее меню -->
            <div
              v-if="showReportDropdown"
              class="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
            >
              <button
                @click="downloadReport('pdf')"
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 rounded-t-lg text-gray-900 dark:text-white"
              >
                <svg
                  class="w-4 h-4 text-danger"
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
                <span>Скачать PDF</span>
              </button>
              <button
                @click="downloadReport('docx')"
                class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 rounded-b-lg text-gray-900 dark:text-white"
              >
                <svg
                  class="w-4 h-4 text-primary"
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
                <span>Скачать Word</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Индикатор активной фоновой выдачи -->
        <div
          v-if="
            certIssueStore.isIssuing.value &&
            certIssueStore.currentJob.value?.groupId === groupId
          "
          class="w-full sm:w-auto px-4 py-3 bg-success/5 dark:bg-success/10 rounded-xl border border-success/20 flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <Loader2 class="w-5 h-5 text-success animate-spin" />
            <div class="flex-1 min-w-[200px]">
              <div class="flex items-center justify-between gap-4 mb-1">
                <span class="text-sm font-bold text-success"
                  >Выдача сертификатов</span
                >
                <span class="text-xs font-bold text-success"
                  >{{ certIssueStore.processedCount.value }}/{{
                    certIssueStore.totalCount.value
                  }}</span
                >
              </div>
              <div
                class="h-1.5 w-full bg-success/20 rounded-full overflow-hidden"
              >
                <div
                  class="h-full bg-success transition-all duration-300 rounded-full"
                  :style="{ width: `${certIssueStore.percentage.value}%` }"
                ></div>
              </div>
              <p
                class="text-xs font-medium text-success mt-1 opacity-80 truncate max-w-[200px]"
              >
                {{ certIssueStore.currentStudentName.value || "Обработка..." }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица журнала -->
      <div
        class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 mb-8"
      >
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800"
              >
                <th
                  class="px-4 py-3 w-12 text-center border-r border-slate-100 dark:border-slate-800"
                >
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isPartialSelected"
                    @change="toggleSelectAll"
                    class="rounded-md border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800 w-4 h-4"
                  />
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                >
                  Слушатель
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Посещаемость
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Дисциплин
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Ср. балл
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Допуск
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Сертификат
                </th>
                <th
                  class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr
                v-for="row in journal"
                :key="row.student.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <!-- Чекбокс -->
                <td
                  class="px-4 py-4 text-center border-r border-slate-100 dark:border-slate-800"
                >
                  <input
                    type="checkbox"
                    :checked="selectedStudentIds.includes(row.student.id)"
                    :disabled="row.certificate?.status === 'issued'"
                    @change="toggleStudent(row.student.id)"
                    class="rounded-md border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/20 bg-white dark:bg-slate-800 w-4 h-4 disabled:opacity-50"
                  />
                </td>

                <!-- Слушатель -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/10 text-sm font-bold shadow-inner"
                    >
                      {{ getInitials(row.student.fullName) }}
                    </div>
                    <div class="min-w-0">
                      <p
                        class="font-bold text-slate-900 dark:text-white truncate"
                      >
                        {{ row.student.fullName }}
                      </p>
                      <p
                        class="text-xs text-slate-500 font-medium truncate mt-0.5"
                      >
                        {{ row.student.organization }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Посещаемость -->
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex flex-col items-center justify-center"
                  >
                    <span
                      class="inline-block px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset"
                      :class="
                        row.totalAttendancePercent >= 75
                          ? 'bg-success/10 text-success ring-success/20'
                          : row.totalAttendancePercent >= 50
                            ? 'bg-warning/10 text-warning ring-warning/20'
                            : 'bg-danger/10 text-danger ring-danger/20'
                      "
                    >
                      {{ row.totalAttendancePercent.toFixed(0) }}%
                    </span>
                  </span>
                </td>

                <!-- Дисциплин пройдено -->
                <td class="px-6 py-4 text-center">
                  <span
                    class="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    {{ row.eligibility.completedDisciplines }} /
                    {{ row.eligibility.totalDisciplines }}
                  </span>
                </td>

                <!-- Средний балл -->
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="row.averageGrade !== null"
                    class="text-sm font-black text-slate-900 dark:text-white"
                  >
                    {{ row.averageGrade.toFixed(1) }}
                  </span>
                  <span v-else class="text-slate-400 font-bold">—</span>
                </td>

                <!-- Допуск -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center">
                    <div
                      v-if="row.eligibility.isEligible"
                      class="flex items-center gap-1.5 text-success font-bold"
                    >
                      <CheckCircle class="w-4 h-4" />
                      <span class="text-xs">Допущен</span>
                    </div>
                    <button
                      v-else
                      @click="showWarnings(row)"
                      class="flex items-center gap-1.5 text-warning hover:text-warning/80 hover:bg-warning/10 px-2 py-1 rounded-lg transition-colors font-bold"
                    >
                      <AlertTriangle class="w-4 h-4" />
                      <span class="text-xs"
                        >{{ row.eligibility.warnings.length }} замеч.</span
                      >
                    </button>
                  </div>
                </td>

                <!-- Статус сертификата -->
                <td class="px-6 py-4 text-center">
                  <span
                    v-if="row.certificate"
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border"
                    :class="[
                      row.certificate.status === 'issued'
                        ? 'bg-success/10 text-success border-success/20'
                        : row.certificate.status === 'revoked'
                          ? 'bg-danger/10 text-danger border-danger/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
                    ]"
                  >
                    {{ certificateStatusLabels[row.certificate.status] }}
                  </span>
                  <span v-else class="text-slate-400 font-medium text-xs"
                    >Не выдан</span
                  >
                </td>

                <!-- Действия -->
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <!-- Скачать (показываем для выданных сертификатов) -->
                    <a
                      v-if="row.certificate?.status === 'issued'"
                      :href="`/api/certificates/download/${row.certificate.id}`"
                      target="_blank"
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary transition-colors"
                      title="Скачать сертификат"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </a>

                    <!-- Выдать -->
                    <button
                      v-if="
                        !row.certificate || row.certificate.status !== 'issued'
                      "
                      @click="issueSingle(row)"
                      :disabled="
                        !template ||
                        isIssuing ||
                        issuingStudentId === row.student.id
                      "
                      class="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Выдать сертификат"
                    >
                      <!-- Спиннер при выдаче этому студенту -->
                      <svg
                        v-if="issuingStudentId === row.student.id"
                        class="w-5 h-5 animate-spin"
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
                      <svg
                        v-else
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Модалка предупреждений -->
    <CertificatesWarningsModal
      :is-open="warningsModalOpen"
      :student="selectedStudent"
      :warnings="selectedWarnings"
      @close="warningsModalOpen = false"
      @confirm="handleIssueWithWarnings"
    />

    <!-- Модалка результатов (для одиночной выдачи) -->
    <CertificatesResultsModal
      :is-open="resultsModalOpen"
      :results="issueResults"
      @close="resultsModalOpen = false"
    />

    <!-- Модалка массовой выдачи с прогресс-баром -->
    <CertificatesBulkIssueModal
      ref="bulkIssueModalRef"
      :is-open="bulkIssueModalOpen"
      :students-count="bulkIssueStudentIds.length"
      :template-name="template?.name || ''"
      @close="bulkIssueModalOpen = false"
      @confirm="executeBulkIssue"
      @complete="handleBulkIssueComplete"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  Award,
  XCircle,
  Download,
  FileText,
  FileIcon,
  User as UserIcon,
  ChevronDown,
  CheckCircle2,
  XCircle as XCircleIcon,
  Loader2,
  Play,
} from "lucide-vue-next";
import type {
  CertificateTemplate,
  CertificateJournalRow,
  IssueWarning,
  CertificateJournalResponse,
  IssueCertificatesResponse,
} from "~/types/certificate";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();
const certIssueStore = useCertificateIssueStore();

// Route params
const groupId = computed(() => route.params.id as string);

// State
const loading = ref(true);
const group = ref<CertificateJournalResponse["group"] | null>(null);
const journal = ref<CertificateJournalRow[]>([]);
const stats = ref({
  totalStudents: 0,
  eligible: 0,
  withWarnings: 0,
  issued: 0,
  revoked: 0,
});

// Template (теперь берётся из курса)
const template = ref<CertificateTemplate | null>(null);

// Issue settings
const issueDate = ref(new Date().toISOString().split("T")[0]); // Сегодняшняя дата

// Инструкторы для выбора
interface InstructorOption {
  id: string;
  fullName: string;
  position: string | null;
  isPrimary: boolean;
}
const instructors = ref<InstructorOption[]>([]);
const selectedInstructorId = ref<string | null>(null);
const loadingInstructors = ref(false);

// Selection
const selectedStudentIds = ref<string[]>([]);

// Issue state
const isIssuing = ref(false);
const issuingStudentId = ref<string | null>(null);
const issueResults = ref<IssueCertificatesResponse["results"]>([]);
const resultsModalOpen = ref(false);
const generatingPdf = ref(false); // Состояние генерации ведомости
const showReportDropdown = ref(false); // Состояние выпадающего меню формата

// Bulk issue modal
const bulkIssueModalOpen = ref(false);
const bulkIssueModalRef = ref<any>(null);
const bulkIssueStudentIds = ref<string[]>([]);
const bulkIssueMode = ref<"eligible" | "selected">("eligible");

// Warnings modal
const warningsModalOpen = ref(false);
const selectedStudent = ref<CertificateJournalRow["student"] | null>(null);
const selectedWarnings = ref<IssueWarning[]>([]);
const pendingIssueStudentId = ref<string | null>(null);

// Labels
const certificateStatusLabels: Record<string, string> = {
  draft: "Черновик",
  issued: "Выдан",
  revoked: "Отозван",
};

// Computed
const isAllSelected = computed(() => {
  const available = journal.value.filter(
    (r) => r.certificate?.status !== "issued",
  );
  return (
    available.length > 0 &&
    available.every((r) => selectedStudentIds.value.includes(r.student.id))
  );
});

const isPartialSelected = computed(() => {
  if (isAllSelected.value) return false;
  return selectedStudentIds.value.length > 0;
});

// Количество допущенных без сертификата
const eligibleWithoutCertificate = computed(() => {
  return journal.value.filter(
    (r) => r.eligibility.isEligible && r.certificate?.status !== "issued",
  ).length;
});

// Title
useHead(() => ({
  title: group.value
    ? `Выдача сертификатов — ${group.value.code}`
    : "Загрузка...",
}));

// Load data
const loadData = async () => {
  loading.value = true;
  try {
    const journalRes = await authFetch<CertificateJournalResponse>(
      `/api/certificates/issue/${groupId.value}`,
    );

    if (journalRes.success) {
      group.value = journalRes.group;
      journal.value = journalRes.journal;
      stats.value = journalRes.stats;
      template.value = journalRes.template;
    }

    // Загружаем инструкторов для выбора
    loadingInstructors.value = true;
    try {
      const instructorsRes = await authFetch<{
        success: boolean;
        instructors: InstructorOption[];
        defaultInstructorId: string | null;
      }>(`/api/certificates/issue/${groupId.value}/instructors`);

      if (instructorsRes.success) {
        instructors.value = instructorsRes.instructors;
        // Устанавливаем дефолтного инструктора
        if (instructorsRes.defaultInstructorId && !selectedInstructorId.value) {
          selectedInstructorId.value = instructorsRes.defaultInstructorId;
        }
      }
    } catch (instrError: any) {
      console.error("Error loading instructors:", instrError);
      // Не показываем ошибку - инструкторы не обязательны
    } finally {
      loadingInstructors.value = false;
    }
  } catch (e: any) {
    console.error("Error loading data:", e);
    showError(e.message || "Ошибка загрузки данных");
  } finally {
    loading.value = false;
  }
};

// Helpers
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
};

// Selection handlers
const toggleSelectAll = () => {
  const available = journal.value.filter(
    (r) => r.certificate?.status !== "issued",
  );
  if (isAllSelected.value) {
    selectedStudentIds.value = [];
  } else {
    selectedStudentIds.value = available.map((r) => r.student.id);
  }
};

const toggleStudent = (studentId: string) => {
  const idx = selectedStudentIds.value.indexOf(studentId);
  if (idx === -1) {
    selectedStudentIds.value.push(studentId);
  } else {
    selectedStudentIds.value.splice(idx, 1);
  }
};

// Show warnings
const showWarnings = (row: CertificateJournalRow) => {
  selectedStudent.value = row.student;
  selectedWarnings.value = row.eligibility.warnings;
  pendingIssueStudentId.value = null;
  warningsModalOpen.value = true;
};

// Issue single
const issueSingle = (row: CertificateJournalRow) => {
  if (isIssuing.value || issuingStudentId.value) return;

  if (!template.value) {
    showError("Шаблон сертификата не назначен для курса");
    return;
  }

  if (!row.eligibility.isEligible) {
    selectedStudent.value = row.student;
    selectedWarnings.value = row.eligibility.warnings;
    pendingIssueStudentId.value = row.student.id;
    warningsModalOpen.value = true;
    return;
  }

  issuingStudentId.value = row.student.id;
  issueToStudents([row.student.id], false);
};

// Issue with warnings
const handleIssueWithWarnings = () => {
  if (isIssuing.value || issuingStudentId.value) return;

  if (pendingIssueStudentId.value) {
    issuingStudentId.value = pendingIssueStudentId.value;
    issueToStudents([pendingIssueStudentId.value], true);
  }
  warningsModalOpen.value = false;
};

// Открыть модалку массовой выдачи
const openBulkIssueModal = (mode: "eligible" | "selected") => {
  // Защита от открытия во время обработки
  if (isIssuing.value || certIssueStore.isIssuing.value) {
    console.warn("[Certificates] Выдача уже выполняется");
    return;
  }

  if (!template.value) {
    showError("Шаблон сертификата не назначен для курса");
    return;
  }

  bulkIssueMode.value = mode;

  if (mode === "eligible") {
    // Все допущенные без сертификата
    bulkIssueStudentIds.value = journal.value
      .filter(
        (r) => r.eligibility.isEligible && r.certificate?.status !== "issued",
      )
      .map((r) => r.student.id);
  } else {
    // Выбранные
    bulkIssueStudentIds.value = [...selectedStudentIds.value];
  }

  if (bulkIssueStudentIds.value.length === 0) {
    showError("Нет студентов для выдачи сертификатов");
    return;
  }

  bulkIssueModalOpen.value = true;
};

// Выполнить массовую выдачу с прогрессом (теперь использует глобальный store)
const executeBulkIssue = async () => {
  // Защита от двойного вызова
  if (isIssuing.value || certIssueStore.isIssuing.value) {
    console.warn("[Certificates] executeBulkIssue уже выполняется, пропускаем");
    return;
  }

  if (!template.value || !group.value) return;

  // Получаем данные студентов для отображения имён
  const studentRows = journal.value.filter((r) =>
    bulkIssueStudentIds.value.includes(r.student.id),
  );

  // Формируем job для глобального store
  const job: Parameters<typeof certIssueStore.startBulkIssue>[0] = {
    groupId: groupId.value,
    groupCode: group.value.code,
    courseName: group.value.course?.name || "",
    templateId: template.value.id,
    templateName: template.value.name,
    issueDate: issueDate.value ?? new Date().toISOString().split("T")[0]!,
    instructorId: selectedInstructorId.value,
    studentIds: bulkIssueStudentIds.value,
    studentData: studentRows.map((r) => ({
      id: r.student.id,
      fullName: r.student.fullName,
      isEligible: r.eligibility.isEligible,
    })),
    expiryMode: group.value.course?.certificateValidityMonths
      ? ("auto" as const)
      : ("none" as const),
  };

  // Закрываем модалку и запускаем выдачу в store
  bulkIssueModalOpen.value = false;
  selectedStudentIds.value = [];

  // Запускаем выдачу через глобальный store (продолжится даже при переходе на другую страницу)
  console.log(
    `[Certificates] Запускаем фоновую выдачу через store: ${job.studentIds.length} студентов`,
  );
  certIssueStore.startBulkIssue(job);
};

// Обработка завершения массовой выдачи (для обратной совместимости с модалкой)
const handleBulkIssueComplete = async (
  _results: IssueCertificatesResponse["results"],
) => {
  // Clear selection
  selectedStudentIds.value = [];

  // Reload data
  await loadData();
};

// Отслеживаем завершение выдачи из store для обновления данных
watch(
  () => certIssueStore.isCompleted.value,
  async (isCompleted) => {
    // Если выдача завершена и это была выдача для текущей группы
    if (
      isCompleted &&
      certIssueStore.currentJob.value?.groupId === groupId.value
    ) {
      console.log("[Certificates] Выдача завершена, обновляем данные");
      await loadData();
    }
  },
);

// Issue to students (для одиночной выдачи)
const issueToStudents = async (
  studentIds: string[],
  overrideWarnings: boolean,
) => {
  isIssuing.value = true;
  try {
    const response = await authFetch<IssueCertificatesResponse>(
      `/api/certificates/issue/${groupId.value}`,
      {
        method: "POST",
        body: {
          templateId: template.value!.id,
          studentIds,
          issueDate: issueDate.value,
          instructorId: selectedInstructorId.value,
          expiryMode: group.value?.course?.certificateValidityMonths
            ? "auto"
            : "none",
          overrideWarnings,
        },
      },
    );

    if (response.success) {
      issueResults.value = response.results;
      resultsModalOpen.value = true;

      // Reload data
      await loadData();

      showSuccess(response.message);
    }
  } catch (e: any) {
    console.error("Issue error:", e);
    showError(e.data?.message || e.message || "Ошибка выдачи сертификатов");
  } finally {
    isIssuing.value = false;
    issuingStudentId.value = null;
  }
};

// Функция переключения выпадающего меню формата ведомости
const toggleReportDropdown = () => {
  showReportDropdown.value = !showReportDropdown.value;
};

// Download certificate report
const downloadReport = async (format: "pdf" | "docx" = "pdf") => {
  if (generatingPdf.value) return;

  // Закрываем выпадающее меню
  showReportDropdown.value = false;

  generatingPdf.value = true;
  try {
    // Получаем данные для ведомости
    const reportData = await authFetch<{
      success: boolean;
      groupCode: string;
      courseName: string;
      instructors: string[];
      students: any[];
      startDate?: string;
      endDate?: string;
      generatedBy: string;
    }>(`/api/certificates/report/${groupId.value}`);

    if (!reportData.success) {
      throw new Error("Не удалось получить данные для ведомости");
    }

    // Генерируем документ в выбранном формате
    if (format === "pdf") {
      const { generateCertificateReport } =
        await import("~/utils/pdf/generateCertificateReport");
      await generateCertificateReport({
        groupCode: reportData.groupCode,
        courseName: reportData.courseName,
        instructors: reportData.instructors,
        students: reportData.students,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedBy: reportData.generatedBy,
      });
    } else {
      const { generateCertificateReportDocx } =
        await import("~/utils/docx/generateCertificateReport");
      await generateCertificateReportDocx({
        groupCode: reportData.groupCode,
        courseName: reportData.courseName,
        instructors: reportData.instructors,
        students: reportData.students,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedBy: reportData.generatedBy,
      });
    }

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "certificate_report",
          format,
          groupCode: reportData.groupCode,
          groupId: groupId.value,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showSuccess(`Ведомость успешно сформирована (${format.toUpperCase()})`);
  } catch (error: any) {
    console.error("Error generating certificate report:", error);
    showError(error.message || "Ошибка при формировании ведомости");
  } finally {
    generatingPdf.value = false;
  }
};

// Load on mount
onMounted(() => {
  loadData();
});
</script>
