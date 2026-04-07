<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Загрузка -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div
          class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-slate-600 dark:text-slate-400 font-medium">
          Загрузка информации о группе...
        </p>
      </div>
    </div>

    <!-- Группа не найдена -->
    <div
      v-else-if="!group"
      class="flex items-center justify-center min-h-[400px]"
    >
      <div class="text-center max-w-md">
        <div
          class="bg-slate-100 dark:bg-slate-800 p-6 rounded-full inline-block mb-6"
        >
          <CalendarIcon class="w-12 h-12 text-slate-400" />
        </div>
        <h3 class="text-2xl font-bold text-slate-900 dark:text-white">
          Группа не найдена
        </h3>
        <p class="mt-2 text-slate-500 dark:text-gray-400">
          Возможно, группа была удалена или вы используете неверную ссылку.
        </p>
        <UiButton class="mt-8 shadow-lg" @click="$router.push('/groups')"
          >Вернуться к списку групп</UiButton
        >
      </div>
    </div>

    <template v-else>
      <!-- Header Section -->
      <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <!-- Breadcrumbs / Back Navigation -->
        <div class="mb-6">
          <NuxtLink
            to="/groups"
            class="group inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft
                class="w-4 h-4 transition-transform group-hover:-translate-x-1"
              />
            </div>
            Назад к списку групп
          </NuxtLink>
        </div>

        <div
          class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <!-- Left: Title & Info -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <h1
                class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase"
              >
                {{ group.code }}
              </h1>
              <div
                class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                :class="statusClass"
              >
                {{ statusText }}
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                {{ group.course?.name }}
              </div>
              <div
                class="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400"
              >
                <CalendarIcon class="w-4 h-4 text-slate-400" />
                {{ formatDate(group.startDate) }} —
                {{ formatDate(group.endDate) }}
              </div>
            </div>
          </div>

          <!-- Right: Action Buttons Group -->
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              v-if="canIssueCertificates && !group.isArchived"
              :to="`/groups/${group.id}/certificates`"
            >
              <UiButton
                variant="primary"
                size="sm"
                class="h-10 px-4 gap-2 font-bold shadow-sm"
              >
                <GraduationCap class="w-4 h-4" />
                Сертификаты
              </UiButton>
            </NuxtLink>

            <UiButton
              v-if="canEditGroups"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="showEditModal = true"
            >
              <Settings class="w-4 h-4" />
              Настроить
            </UiButton>

            <UiButton
              v-if="canArchiveGroups"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold"
              @click="showArchiveModal = true"
            >
              <Clock class="w-4 h-4" v-if="group.isArchived" />
              <CalendarIcon class="w-4 h-4" v-else />
              {{ group.isArchived ? "Восстановить" : "В архив" }}
            </UiButton>

            <UiButton
              v-if="canDeleteGroups"
              variant="outline"
              size="sm"
              class="h-10 px-4 gap-2 font-bold text-danger border-danger/20 hover:bg-danger/5 hover:border-danger/40"
              @click="showDeleteModal = true"
            >
              <Trash2 class="w-4 h-4" />
              Удалить
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Bento Box Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <!-- Attendance Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Посещаемость
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                85.4%
              </h3>
            </div>
            <div
              class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12"
            >
              <Users class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2">
            <span
              class="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full"
              >+2.3%</span
            >
            <span class="text-xs text-slate-400 font-medium"
              >с прошлой недели</span
            >
          </div>
        </div>

        <!-- Hours Progress Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Прогресс часов
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ totalScheduledHours }} / {{ totalProgramHours }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12"
            >
              <Clock class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <div
              class="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="hoursProgressColor"
                :style="{ width: `${hoursProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Disciplines Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Дисциплины
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ disciplines.length }} предм.
              </h3>
            </div>
            <div
              class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12"
            >
              <BookOpen class="w-6 h-6" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-xs text-slate-400 font-medium whitespace-nowrap">
              Учебная программа активна
            </p>
          </div>
        </div>

        <!-- Schedule/Timeline Card -->
        <div
          class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">
                Срок обучения
              </p>
              <h3
                class="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {{ daysInfo }}
              </h3>
            </div>
            <div
              class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12"
            >
              <CalendarIcon class="w-6 h-6" />
            </div>
          </div>
          <div
            class="mt-4 text-xs font-medium text-slate-600 dark:text-slate-400 space-y-1"
          >
            <div class="flex justify-between">
              <span>Старт:</span>
              <span class="text-slate-900 dark:text-white">{{
                formatDate(group.startDate)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span>Конец:</span>
              <span class="text-slate-900 dark:text-white">{{
                formatDate(group.endDate)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
        <div
          class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800"
        >
          <nav class="flex gap-1" aria-label="Tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="changeTab(tab.id)"
              :class="[
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
              ]"
            >
              <component :is="tab.icon" class="h-4 w-4" />
              {{ tab.label }}
            </button>
          </nav>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div class="space-y-6">
        <!-- OVERVIEW TAB -->
        <div
          v-show="activeTab === 'overview'"
          class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div class="lg:col-span-2 space-y-6">
            <!-- Group Info Card -->
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div
                class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-6"
              >
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <LayoutDashboard class="w-5 h-5 text-primary" />
                  Информация о группе
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >Код группы</label
                    >
                    <p class="text-lg font-bold text-slate-900 dark:text-white">
                      {{ group.code }}
                    </p>
                  </div>
                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >Статус</label
                    >
                    <div>
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-3 py-1 text-sm font-bold',
                          statusClass,
                        ]"
                      >
                        {{ statusText }}
                      </span>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <label
                      class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >Период обучения</label
                    >
                    <p
                      class="text-slate-900 dark:text-white font-semibold flex items-center gap-2"
                    >
                      {{ formatDate(group.startDate) }}
                      <ChevronRight class="w-4 h-4 text-slate-300" />
                      {{ formatDate(group.endDate) }}
                    </p>
                    <p class="text-sm text-slate-500 font-medium">
                      {{ daysInfo }}
                    </p>
                  </div>
                  <div class="space-y-1" v-if="group.course">
                    <label
                      class="text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >Учебная программа</label
                    >
                    <NuxtLink
                      :to="`/programs/${group.courseId}`"
                      class="text-primary hover:underline font-semibold group flex items-center gap-1"
                    >
                      {{ group.course.name }}
                      <Eye
                        class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </NuxtLink>
                  </div>
                  <div
                    v-if="group.description"
                    class="col-span-1 md:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                  >
                    <label
                      class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1"
                      >Описание</label
                    >
                    <p
                      class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed"
                    >
                      {{ group.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Organization Breakdown Card -->
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div
                class="border-b border-slate-100 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <Users class="w-5 h-5 text-success" />
                  Состав по организациям
                </h3>
              </div>
              <div class="p-6">
                <div
                  v-if="studentsByOrganization.length > 0"
                  class="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div
                    v-for="org in studentsByOrganization"
                    :key="org.name"
                    class="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-success/30 hover:bg-success/5 transition-all group"
                  >
                    <span
                      class="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-2 group-hover:text-success transition-colors"
                      >{{ org.name }}</span
                    >
                    <span
                      class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-extrabold group-hover:bg-success group-hover:text-white transition-all"
                    >
                      {{ org.count }}
                    </span>
                  </div>
                </div>
                <div
                  v-else
                  class="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
                >
                  <p class="text-slate-500 font-medium">
                    Данные об организациях отсутствуют
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column of Overview -->
          <div class="space-y-6">
            <!-- Instructors Card -->
            <div
              class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all hover:shadow-md"
            >
              <div
                class="bg-linear-to-br from-warning/10 to-transparent p-6 border-b border-slate-100 dark:border-slate-800"
              >
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <GraduationCap class="w-5 h-5 text-warning" />
                  Преподаватели
                </h3>
              </div>
              <div class="p-4 space-y-3">
                <div
                  v-for="instructor in groupInstructors"
                  :key="instructor.id"
                  class="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                  <div
                    class="h-10 w-10 shrink-0 rounded-full bg-warning/10 text-warning flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-slate-800"
                  >
                    {{ getInitials(instructor.fullName) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="text-sm font-bold text-slate-900 dark:text-white truncate"
                    >
                      {{ instructor.fullName }}
                    </p>
                    <p class="text-xs text-slate-500 truncate">
                      {{ instructor.completedHours }} /
                      {{ instructor.totalHours }} ч.
                    </p>
                  </div>
                  <div class="text-right">
                    <div
                      class="text-xs font-extrabold"
                      :class="
                        instructor.hoursPercent >= 100
                          ? 'text-success'
                          : 'text-warning'
                      "
                    >
                      {{ instructor.hoursPercent }}%
                    </div>
                  </div>
                </div>
                <div
                  v-if="groupInstructors.length === 0"
                  class="text-center py-6 text-slate-400 text-sm italic"
                >
                  Инструкторы не назначены
                </div>
              </div>
              <div class="px-4 pb-4">
                <UiButton
                  variant="outline"
                  size="sm"
                  class="w-full text-xs font-semibold gap-1"
                  @click="activeTab = 'schedule'"
                >
                  <CalendarDays class="w-3 h-3" />
                  Смотреть расписание
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- STUDENTS TAB -->
        <div
          v-show="activeTab === 'students'"
          class="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            <div
              class="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <GraduationCap class="w-5 h-5 text-success" />
                  Список слушателей
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-1">
                  {{ group.students?.length || 0 }} подтвержденных участников
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UiButton
                  v-if="canManageGroupStudents && !group.isArchived"
                  variant="outline"
                  size="sm"
                  class="gap-2 font-bold"
                  @click="showManageStudentsModal = true"
                >
                  <Plus class="w-4 h-4" />
                  Управление
                </UiButton>

                <div
                  v-if="group.students && group.students.length > 0"
                  class="relative group/journal"
                >
                  <UiButton
                    variant="outline"
                    size="sm"
                    class="gap-2 font-bold"
                    @click="toggleEmptyJournalDropdown"
                    :disabled="generatingEmptyJournal"
                  >
                    <Download class="w-4 h-4" />
                    Пустой журнал
                  </UiButton>
                  <!-- Dropdown Menu (logic remains same) -->
                  <div
                    v-if="showEmptyJournalDropdown"
                    class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                  >
                    <button
                      @click="downloadEmptyJournal('pdf')"
                      class="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"
                    >
                      <FileText class="w-4 h-4 text-danger" />
                      Скачать PDF
                    </button>
                    <button
                      @click="downloadEmptyJournal('docx')"
                      class="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-slate-700"
                    >
                      <FileText class="w-4 h-4 text-primary" />
                      Скачать Word
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="!group.students || group.students.length === 0"
              class="p-16 text-center"
            >
              <div
                class="bg-slate-50 dark:bg-slate-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Users class="w-8 h-8 text-slate-300" />
              </div>
              <p class="text-slate-500 font-medium">
                В этой группе пока нет слушателей
              </p>
            </div>

            <template v-else>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50/50 dark:bg-slate-800/50">
                      <th
                        class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Слушатель
                      </th>
                      <th
                        class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Организация
                      </th>
                      <th
                        class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                      >
                        Посещаемость
                      </th>
                      <th
                        class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"
                      >
                        Дата зачисления
                      </th>
                      <th
                        class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right"
                      >
                        Инфо
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    class="divide-y divide-slate-100 dark:divide-slate-800"
                  >
                    <tr
                      v-for="gs in paginatedStudents"
                      :key="gs.id"
                      class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="h-9 w-9 rounded-full bg-linear-to-br from-success/20 to-success/5 text-success flex items-center justify-center font-bold text-xs border border-success/10"
                          >
                            {{ getInitials(gs.student?.fullName) }}
                          </div>
                          <div>
                            <p
                              class="font-bold text-slate-900 dark:text-white text-sm tracking-tight"
                            >
                              {{ gs.student?.fullName }}
                            </p>
                            <p
                              class="text-xs text-slate-500 truncate max-w-[150px] font-medium"
                            >
                              {{ gs.student?.position || "Слушатель" }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span
                          class="text-sm font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[200px] block"
                          :title="gs.student?.organization"
                        >
                          {{ gs.student?.organization || "—" }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex flex-col items-center gap-1">
                          <div
                            class="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
                          >
                            <div
                              class="h-full rounded-full transition-all"
                              :class="
                                getAttendanceColorClass(
                                  getStudentAttendance(gs.studentId),
                                )
                                  .replace('bg-', 'bg-')
                                  .split(' ')[0]
                              "
                              :style="{
                                width: `${getStudentAttendance(gs.studentId)}%`,
                              }"
                            ></div>
                          </div>
                          <span
                            class="text-[10px] font-extrabold uppercase tracking-tighter"
                            :class="
                              getAttendanceColorClass(
                                getStudentAttendance(gs.studentId),
                              ).split(' ')[1]
                            "
                          >
                            {{ getStudentAttendance(gs.studentId).toFixed(0) }}%
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-xs font-bold text-slate-500">
                        {{ formatDate(gs.enrolledAt) }}
                      </td>
                      <td class="px-6 py-4 text-right">
                        <NuxtLink
                          :to="`/students/${gs.studentId}`"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                          <Eye class="w-4 h-4" />
                        </NuxtLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Compact Pagination -->
              <div
                class="px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <span
                  class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                  >{{ paginationInfo }}</span
                >
                <div class="flex gap-2">
                  <UiButton
                    :disabled="currentStudentsPage === 1"
                    variant="outline"
                    size="sm"
                    class="h-8 px-3"
                    @click="currentStudentsPage--"
                    >Назад</UiButton
                  >
                  <UiButton
                    :disabled="currentStudentsPage === totalStudentsPages"
                    variant="outline"
                    size="sm"
                    class="h-8 px-3"
                    @click="currentStudentsPage++"
                    >Вперед</UiButton
                  >
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- JOURNAL & PROGRAM TAB -->
        <div
          v-show="activeTab === 'journal'"
          class="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <NuxtLink
              v-for="discipline in disciplines"
              :key="discipline.id"
              :to="`/groups/journal/${group?.id}_${discipline.id}`"
              class="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div
                class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div class="bg-primary/10 text-primary p-2 rounded-lg">
                  <ArrowLeft class="w-4 h-4 rotate-180" />
                </div>
              </div>
              <div
                class="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-4 group-hover:bg-primary group-hover:text-white transition-colors"
              >
                <BookOpen class="w-6 h-6" />
              </div>
              <h4
                class="font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-snug group-hover:text-primary transition-colors"
              >
                {{ discipline.name }}
              </h4>
              <div class="flex items-center gap-3">
                <div class="flex -space-x-2">
                  <div
                    class="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500/10 text-blue-600 flex items-center justify-center text-[10px] font-bold"
                    title="Теория"
                  >
                    {{ discipline.theoryHours }}ч
                  </div>
                  <div
                    class="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-green-500/10 text-green-600 flex items-center justify-center text-[10px] font-bold"
                    title="Практика"
                  >
                    {{ discipline.practiceHours }}ч
                  </div>
                </div>
                <span
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
                  >Перейти к журналу</span
                >
              </div>
            </NuxtLink>
            <div
              v-if="disciplines.length === 0"
              class="col-span-full py-12 text-center text-slate-400 italic"
            >
              Дисциплины программы не найдены
            </div>
          </div>
        </div>

        <!-- SCHEDULE TAB -->
        <div
          v-show="activeTab === 'schedule'"
          class="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            <div
              class="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <CalendarDays class="w-5 h-5 text-primary" />
                  Расписание занятий
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-1">
                  {{ scheduleEvents.length }} запланированных событий
                </p>
              </div>
              <div
                v-if="totalProgramHours > 0"
                class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 px-4 rounded-xl"
              >
                <div class="text-right">
                  <p
                    class="text-[10px] font-bold text-slate-400 uppercase leading-none"
                  >
                    Прогресс
                  </p>
                  <p
                    class="text-sm font-extrabold text-slate-900 dark:text-white leading-none mt-1"
                  >
                    {{ totalScheduledHours }} / {{ totalProgramHours }} ч.
                  </p>
                </div>
                <div
                  class="w-10 h-10 rounded-full border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center relative"
                >
                  <span class="text-[10px] font-bold"
                    >{{ hoursProgress }}%</span
                  >
                </div>
              </div>
            </div>

            <div v-if="loadingSchedule" class="p-12 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
              ></div>
              <p class="mt-4 text-slate-500 text-sm">Загрузка расписания...</p>
            </div>

            <div
              v-else-if="scheduleEvents.length === 0"
              class="p-16 text-center"
            >
              <CalendarIcon class="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p class="text-slate-500 font-medium">
                Занятия еще не запланированы
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Добавьте занятия через общий календарь планирования
              </p>
            </div>

            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="event in scheduleEvents"
                :key="event.id"
                class="p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div class="shrink-0 flex items-center gap-4">
                  <div class="w-14 text-center">
                    <p
                      class="text-xs font-extrabold text-slate-400 uppercase tracking-tighter"
                    >
                      {{
                        new Date(event.startTime).toLocaleDateString("ru-RU", {
                          weekday: "short",
                        })
                      }}
                    </p>
                    <p
                      class="text-xl font-black text-slate-900 dark:text-white leading-tight"
                    >
                      {{ new Date(event.startTime).getDate() }}
                    </p>
                  </div>
                  <div
                    class="h-10 w-1 bg-slate-200 dark:bg-slate-700 rounded-full hidden sm:block"
                  ></div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest"
                      :class="{
                        'bg-blue-100 text-blue-600':
                          event.eventType === 'theory',
                        'bg-green-100 text-green-600':
                          event.eventType === 'practice',
                        'bg-orange-100 text-orange-600':
                          event.eventType === 'assessment',
                        'bg-slate-100 text-slate-600': ![
                          'theory',
                          'practice',
                          'assessment',
                        ].includes(event.eventType),
                      }"
                    >
                      {{
                        event.eventType === "theory"
                          ? "Теория"
                          : event.eventType === "practice"
                            ? "Практика"
                            : "Экзамен"
                      }}
                    </span>
                    <h4
                      class="font-bold text-slate-900 dark:text-white truncate"
                    >
                      {{ event.title }}
                    </h4>
                  </div>
                  <div
                    class="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-500"
                  >
                    <div class="flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5" />
                      {{ formatTime(event.startTime) }} -
                      {{ formatTime(event.endTime) }}
                    </div>
                    <div
                      v-if="event.instructor"
                      class="flex items-center gap-1.5"
                    >
                      <Users class="w-3.5 h-3.5" />
                      {{ event.instructor.fullName }}
                    </div>
                    <div
                      class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg text-slate-900 dark:text-white tracking-widest"
                    >
                      {{ getAcademicHours(event) }} а-ч
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- FILES TAB -->
        <div
          v-show="activeTab === 'files'"
          class="animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div
            class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
          >
            <div
              class="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h3
                  class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <FileText class="w-5 h-5 text-primary" />
                  Документация группы
                </h3>
                <p class="text-xs text-slate-500 font-medium mt-1">
                  Отчеты, приказы и учебные материалы
                </p>
              </div>
              <UiButton
                v-if="canEditGroups"
                variant="outline"
                size="sm"
                class="gap-2 font-bold"
                @click="showUploadReportModal = true"
              >
                <Plus class="w-4 h-4" />
                Загрузить
              </UiButton>
            </div>

            <div v-if="loadingReports" class="p-12 text-center text-slate-400">
              Загрузка документов...
            </div>
            <div v-else-if="reports.length === 0" class="p-16 text-center">
              <FileText class="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p class="text-slate-500 font-medium">Список документов пуст</p>
            </div>

            <div
              v-else
              class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6"
            >
              <div
                v-for="report in reports"
                :key="report.id"
                class="group flex flex-col p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all"
              >
                <div class="flex items-start justify-between mb-4">
                  <div
                    class="h-10 w-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center"
                  >
                    <FileText class="w-6 h-6" />
                  </div>
                  <div
                    class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      @click="previewReport(report)"
                      class="p-2 text-slate-400 hover:text-primary transition-colors"
                      title="Просмотр"
                    >
                      <Eye class="w-4 h-4" />
                    </button>
                    <button
                      @click="downloadReport(report)"
                      class="p-2 text-slate-400 hover:text-success transition-colors"
                      title="Скачать"
                    >
                      <Download class="w-4 h-4" />
                    </button>
                    <button
                      v-if="canEditGroups || isAdmin"
                      @click="confirmDeleteReport(report)"
                      class="p-2 text-slate-400 hover:text-danger transition-colors"
                      title="Удалить"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h4
                  class="text-sm font-bold text-slate-900 dark:text-white truncate mb-1"
                  :title="report.name"
                >
                  {{ report.name }}
                </h4>
                <div class="flex items-center justify-between mt-auto">
                  <span
                    class="text-[10px] font-bold text-slate-400 uppercase"
                    >{{
                      new Date(report.uploadedAt).toLocaleDateString()
                    }}</span
                  >
                  <span
                    class="text-[10px] font-bold text-slate-400 uppercase"
                    >{{ formatFileSize(report.size) }}</span
                  >
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
import {
  Users,
  Clock,
  BookOpen,
  Calendar as CalendarIcon,
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  FileText,
  Settings,
  ChevronRight,
  Download,
  Eye,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-vue-next";
import type { StudyGroup } from "~/types/group";
import { generateEmptyJournal } from "~/utils/pdf/generateEmptyJournal";

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

// Вкладки
const activeTab = ref("overview");
const tabs = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "students", label: "Слушатели", icon: GraduationCap },
  { id: "journal", label: "Программа и Журнал", icon: BookOpen },
  { id: "schedule", label: "Расписание", icon: CalendarDays },
  { id: "files", label: "Документы", icon: FileText },
];

const changeTab = (tabId: string) => {
  activeTab.value = tabId;
  router.push({ query: { ...route.query, tab: tabId } });
};

const syncTabWithUrl = () => {
  const tab = route.query.tab as string;
  if (tab && tabs.some((t) => t.id === tab)) {
    activeTab.value = tab;
  }
};

watch(() => route.query.tab, syncTabWithUrl);

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
    return "bg-slate-100 text-slate-500 border-slate-200";
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive)
    return "bg-slate-100 text-slate-500 border-slate-200";
  if (endDate < today) return "bg-warning/10 text-warning border-warning/20";
  if (startDate > today) return "bg-info/10 text-info border-info/20";
  return "bg-success/10 text-success border-success/20";
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

const studentsByOrganization = computed(() => {
  if (!group.value?.students) return [];
  const orgCount: Record<string, number> = {};

  group.value.students.forEach((gs: any) => {
    const org = gs.student?.organization?.trim() || "Без организации";
    orgCount[org] = (orgCount[org] || 0) + 1;
  });

  return Object.entries(orgCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
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

// Вычисление уникальных инструкторов с их статистикой часов
const groupInstructors = computed(() => {
  const now = new Date();
  const academicHourMinutes = parseInt(
    scheduleSettings.value.academic_hour_minutes || "40",
    10,
  );

  const instructorMap = new Map<
    string,
    {
      id: string;
      fullName: string;
      specialization?: string;
      totalHours: number;
      completedHours: number;
      lessonsCount: number;
    }
  >();

  for (const event of scheduleEvents.value) {
    const instr = event.instructor;
    if (!instr) continue;

    const instrId =
      instr.id || instr.instructorId || String(instr.fullName || instr.name);
    if (!instrId) continue;

    // Академические часы занятия
    let hours = 0;
    if (event.academicHours) {
      hours = event.academicHours;
    } else if (event.durationMinutes) {
      hours = Math.ceil(event.durationMinutes / academicHourMinutes);
    } else if (event.startTime && event.endTime) {
      const diff =
        (new Date(event.endTime).getTime() -
          new Date(event.startTime).getTime()) /
        60000;
      hours = Math.ceil(diff / academicHourMinutes);
    }

    const isCompleted = event.startTime && new Date(event.startTime) < now;

    const existing = instructorMap.get(instrId) || {
      id: instrId,
      fullName: instr.fullName || instr.name || "Не указан",
      specialization: instr.specialization || instr.position || undefined,
      totalHours: 0,
      completedHours: 0,
      lessonsCount: 0,
    };

    existing.totalHours += hours;
    if (isCompleted) existing.completedHours += hours;
    existing.lessonsCount += 1;

    instructorMap.set(instrId, existing);
  }

  return Array.from(instructorMap.values()).map((instr) => ({
    ...instr,
    completedHours: Math.round(instr.completedHours * 10) / 10,
    totalHours: Math.round(instr.totalHours * 10) / 10,
    hoursPercent:
      instr.totalHours > 0
        ? Math.min(
            Math.round((instr.completedHours / instr.totalHours) * 100),
            100,
          )
        : 0,
  }));
});

// Load actions
const loadSchedule = async (groupId: string) => {
  loadingSchedule.value = true;
  try {
    const response = await authFetch<{ success: boolean; events: any[] }>(
      `/api/schedule?groupId=${groupId}&limit=500`,
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
  syncTabWithUrl(); // Синхронизируем вкладку с URL
});
</script>
