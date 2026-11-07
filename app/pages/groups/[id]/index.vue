<template>
  <!-- Внешний враппер без двойного отступа: отступы уже задаёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Состояние загрузки: спокойный спиннер без лишних декораций -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div
          class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Загрузка информации о группе...
        </p>
      </div>
    </div>

    <!-- Группа не найдена: единый UiEmptyState с понятным следующим шагом -->
    <div
      v-else-if="!group"
      class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <UiEmptyState
        title="Группа не найдена"
        description="Возможно, группа была удалена или вы используете неверную ссылку."
        :icon="CalendarIcon"
      >
        <template #actions>
          <UiButton @click="$router.push('/groups')"
            >Вернуться к списку групп</UiButton
          >
        </template>
      </UiEmptyState>
    </div>

    <template v-else>
      <!-- Шапка в одну строку: крошки вместо большой ссылки «Назад», код + статус, мета-строка; справа ровно 3 контрола -->
      <UiPageHeader
        :title="group.code"
        :breadcrumbs="[
          { label: 'Группы', to: '/groups' },
          { label: group.code },
        ]"
        class="!mb-0"
      >
        <!-- Статус рядом с кодом: один бейдж вместо дублей в карточках -->
        <template #badge>
          <UiBadge size="sm" :color="statusBadgeColor">{{ statusText }}</UiBadge>
        </template>

        <!-- Мета-строка: курс · даты · дни · слушатели (здесь единственное место, где эти данные показаны) -->
        <template #meta>
          <span v-if="group.course?.name" class="truncate">{{
            group.course.name
          }}</span>
          <span class="text-gray-300 dark:text-gray-600">·</span>
          <span
            >{{ formatDate(group.startDate) }} —
            {{ formatDate(group.endDate) }}</span
          >
          <span class="text-gray-300 dark:text-gray-600">·</span>
          <span>{{ daysInfo }}</span>
          <span class="text-gray-300 dark:text-gray-600">·</span>
          <span>{{ group.students?.length || 0 }} слушателей</span>
        </template>

        <!-- Действия: primary «Сертификаты» + меню «Документы» + меню «Действия» -->
        <template #actions>
          <!-- Главное действие экрана; ссылка через UiButton :to, а не кнопка внутри <a> -->
          <UiButton
            v-if="canIssueCertificates && !group.isArchived"
            variant="primary"
            size="md"
            :to="`/groups/${group.id}/certificates`"
            :start-icon="GraduationCap"
          >
            Сертификаты
          </UiButton>

          <!-- 8 генераторов документов, сгруппированных по этапам обучения; пункты вызывают прежнюю логику -->
          <UiDropdown
            v-if="group.students && group.students.length > 0"
            label="Документы"
            variant="outline"
            size="md"
            :trigger-icon="FileText"
            :groups="documentGroups"
            @select="handleDocumentSelect"
          />

          <!-- Меню «Действия»: управление и опасные операции; не рисуется, если нет доступных пунктов -->
          <UiDropdown
            v-if="hasGroupActions"
            label="Действия"
            variant="outline"
            size="md"
            :trigger-icon="Settings"
            :groups="actionGroups"
            @select="handleGroupAction"
          />
        </template>
      </UiPageHeader>

      <!-- Одна полоса из 4 метрик вместо 5 «bento»-карточек; срок обучения убран — он в мета-строке -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <UiStat
          label="Слушатели"
          :value="group.students?.length || 0"
          :icon="GraduationCap"
          tone="primary"
        />
        <UiStat
          label="Посещаемость"
          :value="`${averageAttendance.toFixed(1)}%`"
          :icon="Users"
          tone="success"
        />
        <UiStat
          label="Часы"
          :value="`${totalScheduledHours} / ${totalProgramHours}`"
          :icon="Clock"
          tone="info"
          :progress="hoursProgress"
        />
        <UiStat
          label="Дисциплины"
          :value="disciplines.length"
          :icon="BookOpen"
          tone="warning"
        />
      </div>

      <!-- Вкладки с подчёркиванием и счётчиками; переключение идёт через прежний changeTab (синхронизация с URL) -->
      <UiTabs :model-value="activeTab" :tabs="tabs" @change="changeTab" />

      <!-- Содержимое вкладок -->
      <div class="space-y-4">
        <!-- ВКЛАДКА «ОБЗОР» -->
        <div
          v-show="activeTab === 'overview'"
          class="grid grid-cols-1 gap-4 lg:grid-cols-3"
        >
          <div class="space-y-4 lg:col-span-2">
            <!-- Информация о группе: без дублей кода, статуса и дат (они уже в шапке) — остаются программа и описание -->
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <h3
                  class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
                >
                  <LayoutDashboard class="h-4 w-4 text-primary" />
                  Информация о группе
                </h3>
              </div>
              <div class="space-y-4 p-5">
                <div v-if="group.course" class="space-y-1">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Учебная программа
                  </p>
                  <NuxtLink
                    :to="`/programs/${group.courseId}`"
                    class="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {{ group.course.name }}
                    <!-- Иконка-подсказка видна всегда на touch, по hover — на десктопе -->
                    <Eye
                      class="h-4 w-4 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
                    />
                  </NuxtLink>
                </div>
                <div
                  v-if="group.description"
                  class="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                >
                  <p class="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    Описание
                  </p>
                  <p
                    class="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  >
                    {{ group.description }}
                  </p>
                </div>
                <p
                  v-if="!group.course && !group.description"
                  class="text-sm text-gray-500 dark:text-gray-400"
                >
                  Дополнительной информации нет
                </p>
              </div>
            </div>

            <!-- Состав по организациям: плоские плитки вместо цветных hover-эффектов -->
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <h3
                  class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
                >
                  <Users class="h-4 w-4 text-success" />
                  Состав по организациям
                </h3>
              </div>
              <div class="p-5">
                <div
                  v-if="studentsByOrganization.length > 0"
                  class="grid grid-cols-1 gap-3 md:grid-cols-2"
                >
                  <div
                    v-for="org in studentsByOrganization"
                    :key="org.name"
                    class="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800"
                  >
                    <span
                      class="truncate pr-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                      >{{ org.name }}</span
                    >
                    <span
                      class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-gray-900 dark:bg-white/[0.06] dark:text-white"
                    >
                      {{ org.count }}
                    </span>
                  </div>
                </div>
                <UiEmptyState
                  v-else
                  title="Данные об организациях отсутствуют"
                  :icon="Users"
                />
              </div>
            </div>
          </div>

          <!-- Правая колонка обзора -->
          <div class="space-y-4">
            <!-- Преподаватели: градиентная шапка убрана, карточка в общем стиле -->
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <h3
                  class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
                >
                  <GraduationCap class="h-4 w-4 text-warning" />
                  Преподаватели
                </h3>
              </div>
              <div class="space-y-1 p-3">
                <div
                  v-for="instructor in groupInstructors"
                  :key="instructor.id"
                  class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-xs font-semibold text-warning"
                  >
                    {{ getInitials(instructor.fullName) }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p
                      class="truncate text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ instructor.fullName }}
                    </p>
                    <p class="truncate text-xs text-gray-500">
                      {{ instructor.completedHours }} /
                      {{ instructor.totalHours }} ч.
                    </p>
                  </div>
                  <div
                    class="text-xs font-semibold tabular-nums"
                    :class="
                      instructor.hoursPercent >= 100
                        ? 'text-success'
                        : 'text-warning'
                    "
                  >
                    {{ instructor.hoursPercent }}%
                  </div>
                </div>
                <p
                  v-if="groupInstructors.length === 0"
                  class="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Инструкторы не назначены
                </p>
              </div>
              <div class="px-3 pb-3">
                <!-- Переход на вкладку расписания через changeTab, чтобы обновлялся URL -->
                <UiButton
                  variant="outline"
                  size="sm"
                  block
                  :start-icon="CalendarDays"
                  @click="changeTab('schedule')"
                >
                  Смотреть расписание
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- ВКЛАДКА «СЛУШАТЕЛИ»: кнопки документов убраны (они в меню «Документы»), «Управление слушателями» — в меню «Действия» -->
        <div v-show="activeTab === 'students'">
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h3
                class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
              >
                <GraduationCap class="h-4 w-4 text-success" />
                Список слушателей
              </h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ group.students?.length || 0 }} подтвержденных участников
              </p>
            </div>

            <!-- Пустое состояние -->
            <UiEmptyState
              v-if="!group.students || group.students.length === 0"
              title="В этой группе пока нет слушателей"
              :icon="Users"
            />

            <template v-else>
              <!-- Таблица со sticky-шапкой внутри прокручиваемого контейнера -->
              <div class="max-h-[60vh] overflow-auto">
                <table class="w-full border-collapse text-left">
                  <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                    <tr class="border-b border-gray-100 dark:border-gray-800">
                      <th
                        class="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Слушатель
                      </th>
                      <th
                        class="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Организация
                      </th>
                      <th
                        class="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Посещаемость
                      </th>
                      <th
                        class="px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Дата зачисления
                      </th>
                      <th
                        class="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Профиль
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr
                      v-for="gs in paginatedStudents"
                      :key="gs.id"
                      class="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <td class="px-5 py-3">
                        <div class="flex items-center gap-3">
                          <div
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-xs font-semibold text-success"
                          >
                            {{ getInitials(gs.student?.fullName) }}
                          </div>
                          <div class="min-w-0">
                            <p
                              class="text-sm font-medium text-gray-900 dark:text-white"
                            >
                              {{ gs.student?.fullName }}
                            </p>
                            <p
                              class="max-w-[200px] truncate text-xs text-gray-500"
                            >
                              {{ gs.student?.position || "Слушатель" }}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="px-5 py-3">
                        <span
                          class="block max-w-[220px] truncate text-sm text-gray-600 dark:text-gray-400"
                          :title="gs.student?.organization"
                        >
                          {{ gs.student?.organization || "—" }}
                        </span>
                      </td>
                      <td class="px-5 py-3">
                        <div class="flex flex-col items-center gap-1">
                          <!-- Полоса посещаемости: сплошной цвет (раньше заливка была 10% и почти не видна) -->
                          <div
                            class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                          >
                            <div
                              class="h-full rounded-full transition-all"
                              :class="
                                getAttendanceBarClass(
                                  getStudentAttendance(gs.studentId),
                                )
                              "
                              :style="{
                                width: `${getStudentAttendance(gs.studentId)}%`,
                              }"
                            ></div>
                          </div>
                          <span
                            class="text-[11px] font-semibold tabular-nums"
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
                      <td class="px-5 py-3 text-sm text-gray-500">
                        {{ formatDate(gs.enrolledAt) }}
                      </td>
                      <td class="px-5 py-3 text-right">
                        <!-- Единственное действие строки; видно всегда, в том числе на touch -->
                        <UiButton
                          variant="ghost"
                          size="sm"
                          icon
                          :to="`/students/${gs.studentId}`"
                          title="Открыть профиль"
                          aria-label="Открыть профиль"
                        >
                          <Eye class="h-4 w-4" />
                        </UiButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Пагинация v2 футером внутри карточки; подключена к прежним currentStudentsPage / studentsPerPage -->
              <UiPagination
                :current-page="currentStudentsPage"
                :total-pages="totalStudentsPages"
                :total="group.students.length"
                :limit="studentsPerPage"
                hide-limit
                @update:page="currentStudentsPage = $event"
              />
            </template>
          </div>
        </div>

        <!-- ВКЛАДКА «ЖУРНАЛ»: карточки дисциплин в плоском стиле -->
        <div v-show="activeTab === 'journal'">
          <div
            class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <NuxtLink
              v-for="discipline in disciplines"
              :key="discipline.id"
              :to="`/groups/journal/${group?.id}_${discipline.id}`"
              class="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-primary/50 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div
                class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors group-hover:bg-primary group-hover:text-white dark:bg-white/[0.06]"
              >
                <BookOpen class="h-5 w-5" />
              </div>
              <h4
                class="mb-3 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary dark:text-white"
              >
                {{ discipline.name }}
              </h4>
              <!-- Часы подписаны словами, а не кружками с 10px-текстом -->
              <div
                class="mt-auto flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400"
              >
                <span title="Теория / практика"
                  >Теория {{ discipline.theoryHours }} ч · Практика
                  {{ discipline.practiceHours }} ч</span
                >
                <ArrowLeft class="h-4 w-4 shrink-0 rotate-180 text-gray-400" />
              </div>
            </NuxtLink>
            <UiEmptyState
              v-if="disciplines.length === 0"
              class="col-span-full"
              title="Дисциплины программы не найдены"
              :icon="BookOpen"
            />
          </div>
        </div>

        <!-- ВКЛАДКА «РАСПИСАНИЕ» -->
        <div v-show="activeTab === 'schedule'">
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div
              class="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center"
            >
              <div>
                <h3
                  class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
                >
                  <CalendarDays class="h-4 w-4 text-primary" />
                  Расписание занятий
                </h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ scheduleEvents.length }} запланированных событий
                </p>
              </div>
              <!-- Прогресс часов: читаемый текст вместо кружка с 10px-подписью -->
              <div
                v-if="totalProgramHours > 0"
                class="text-sm text-gray-600 dark:text-gray-300"
              >
                <span class="font-semibold tabular-nums text-gray-900 dark:text-white"
                  >{{ totalScheduledHours }} / {{ totalProgramHours }} ч.</span
                >
                <span class="ml-2 text-gray-500">{{ hoursProgress }}%</span>
              </div>
            </div>

            <div v-if="loadingSchedule" class="p-12 text-center">
              <div
                class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
              ></div>
              <p class="mt-4 text-sm text-gray-500">Загрузка расписания...</p>
            </div>

            <UiEmptyState
              v-else-if="scheduleEvents.length === 0"
              title="Занятия еще не запланированы"
              description="Добавьте занятия через общий календарь планирования"
              :icon="CalendarIcon"
            />

            <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="event in scheduleEvents"
                :key="event.id"
                class="flex flex-col gap-3 px-5 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] sm:flex-row sm:items-center sm:gap-4"
              >
                <!-- Дата занятия -->
                <div class="w-14 shrink-0 text-center">
                  <p class="text-xs capitalize text-gray-500">
                    {{
                      new Date(event.startTime).toLocaleDateString("ru-RU", {
                        weekday: "short",
                      })
                    }}
                  </p>
                  <p
                    class="text-xl font-semibold leading-tight text-gray-900 dark:text-white"
                  >
                    {{ new Date(event.startTime).getDate() }}
                  </p>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="mb-1 flex items-center gap-2">
                    <span
                      class="rounded px-2 py-0.5 text-[11px] font-medium"
                      :class="{
                        'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400':
                          event.eventType === 'theory',
                        'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400':
                          event.eventType === 'practice',
                        'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-400':
                          event.eventType === 'assessment',
                        'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300':
                          !['theory', 'practice', 'assessment'].includes(
                            event.eventType,
                          ),
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
                      class="truncate text-sm font-medium text-gray-900 dark:text-white"
                    >
                      {{ event.title }}
                    </h4>
                  </div>
                  <div
                    class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
                  >
                    <div class="flex items-center gap-1.5">
                      <Clock class="h-3.5 w-3.5" />
                      {{ formatTime(event.startTime) }} -
                      {{ formatTime(event.endTime) }}
                    </div>
                    <div
                      v-if="event.instructor"
                      class="flex items-center gap-1.5"
                    >
                      <Users class="h-3.5 w-3.5" />
                      {{ event.instructor.fullName }}
                    </div>
                    <div
                      class="rounded-md bg-gray-100 px-2 py-0.5 text-gray-900 dark:bg-white/[0.06] dark:text-white"
                    >
                      {{ getAcademicHours(event) }} а-ч
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ВКЛАДКА «ФАЙЛЫ» (бывшие «Документы») -->
        <div v-show="activeTab === 'files'">
          <div
            class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div
              class="flex flex-col justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center"
            >
              <div>
                <h3
                  class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
                >
                  <FileText class="h-4 w-4 text-primary" />
                  Документация группы
                </h3>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Отчеты, приказы и учебные материалы
                </p>
              </div>
              <UiButton
                v-if="canEditGroups"
                variant="outline"
                size="sm"
                :start-icon="Plus"
                @click="showUploadReportModal = true"
              >
                Загрузить
              </UiButton>
            </div>

            <div
              v-if="loadingReports"
              class="p-12 text-center text-sm text-gray-500"
            >
              Загрузка документов...
            </div>
            <UiEmptyState
              v-else-if="reports.length === 0"
              title="Список документов пуст"
              :icon="FileText"
            />

            <div
              v-else
              class="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 lg:grid-cols-3"
            >
              <div
                v-for="report in reports"
                :key="report.id"
                class="group flex flex-col rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-colors hover:bg-white dark:border-gray-800 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
              >
                <div class="mb-3 flex items-start justify-between">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10 text-danger"
                  >
                    <FileText class="h-5 w-5" />
                  </div>
                  <!-- Действия файла: на touch видны всегда, на десктопе — по hover и при фокусе -->
                  <div
                    class="flex gap-1 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-primary dark:hover:bg-white/[0.06]"
                      title="Просмотр"
                      aria-label="Просмотр"
                      @click="previewReport(report)"
                    >
                      <Eye class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-success dark:hover:bg-white/[0.06]"
                      title="Скачать"
                      aria-label="Скачать"
                      @click="downloadReport(report)"
                    >
                      <Download class="h-4 w-4" />
                    </button>
                    <button
                      v-if="canEditGroups || isAdmin"
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-danger dark:hover:bg-white/[0.06]"
                      title="Удалить"
                      aria-label="Удалить"
                      @click="confirmDeleteReport(report)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h4
                  class="mb-1 truncate text-sm font-medium text-gray-900 dark:text-white"
                  :title="report.name"
                >
                  {{ report.name }}
                </h4>
                <div
                  class="mt-auto flex items-center justify-between text-xs text-gray-500"
                >
                  <span>{{ new Date(report.uploadedAt).toLocaleDateString() }}</span>
                  <span>{{ formatFileSize(report.size) }}</span>
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

    <!-- Инструкторы и формат пустого журнала -->
    <GroupsEmptyJournalModal
      v-if="group"
      :is-open="showEmptyJournalModal"
      :group-id="group.id"
      :loading="generatingEmptyJournal"
      @close="showEmptyJournalModal = false"
      @submit="downloadEmptyJournal"
    />

    <!-- Состав комиссии для оценочных листов -->
    <GroupsEvaluationSheetsModal
      :is-open="showEvaluationSheetsModal"
      :loading="generatingEvaluationSheets"
      @close="showEvaluationSheetsModal = false"
      @submit="downloadEvaluationSheets"
    />

    <!-- Состав комиссии для оценочных листов (тест): председатель и члены, без заместителя -->
    <GroupsEvaluationSheetsModal
      :is-open="showEvaluationSheetsTestModal"
      title="Оценочные листы (тест) — состав комиссии"
      :show-deputy="false"
      :loading="generatingEvaluationSheetsTest"
      @close="showEvaluationSheetsTestModal = false"
      @submit="downloadEvaluationSheetsTest"
    />

    <!-- Данные протокола итогового экзамена -->
    <GroupsFinalExamProtocolModal
      v-if="group"
      :is-open="showFinalExamProtocolModal"
      :group-id="group.id"
      :loading="generatingFinalExamProtocol"
      @close="showFinalExamProtocolModal = false"
      @submit="downloadFinalExamProtocol"
    />

    <!-- Данные протокола итогового экзамена (тест) -->
    <GroupsFinalExamProtocolTestModal
      v-if="group"
      :is-open="showFinalExamProtocolTestModal"
      :group-id="group.id"
      :loading="generatingFinalExamProtocolTest"
      @close="showFinalExamProtocolTestModal = false"
      @submit="downloadFinalExamProtocolTest"
    />

    <!-- Данные ведомости практических работ -->
    <GroupsPracticalSkillsSheetModal
      v-if="group"
      :is-open="showPracticalSkillsModal"
      :loading="generatingPracticalSkills"
      @close="showPracticalSkillsModal = false"
      @submit="downloadPracticalSkillsSheet"
    />

    <!-- Блок подписей ведомости контроля знаний: шаблон или экзаменатор-инструктор -->
    <GroupsAssessmentSheetModal
      v-if="group"
      :is-open="showAssessmentSheetModal"
      :group-id="group.id"
      :loading="generatingAssessmentSheet"
      @close="showAssessmentSheetModal = false"
      @submit="downloadAssessmentSheet"
    />

    <!-- Данные реестра (листа регистрации слушателей) -->
    <GroupsRegistryModal
      :is-open="showRegistryModal"
      :loading="generatingRegistry"
      @close="showRegistryModal = false"
      @submit="downloadRegistry"
    />

    <!-- Инструктор для листа ознакомления -->
    <GroupsAcquaintanceSheetModal
      v-if="group"
      :is-open="showAcquaintanceSheetModal"
      :group-id="group.id"
      :loading="generatingAcquaintanceSheet"
      @close="showAcquaintanceSheetModal = false"
      @submit="downloadAcquaintanceSheet"
    />

    <!-- Место, дата заполнения и инструктор для обезличенного вопросника -->
    <GroupsQuestionnaireModal
      v-if="group"
      :is-open="showQuestionnaireModal"
      :group-id="group.id"
      :loading="generatingQuestionnaire"
      @close="showQuestionnaireModal = false"
      @submit="downloadQuestionnaire"
    />

    <!-- Архивация/восстановление: понятная подпись кнопки, жёлтый вариант (не красный «Удалить»), текст во время операции -->
    <UiConfirmModal
      :is-open="showArchiveModal"
      :title="group?.isArchived ? 'Восстановление группы' : 'Архивация группы'"
      :message="
        group?.isArchived
          ? 'Вы уверены, что хотите восстановить эту группу?'
          : 'Вы уверены, что хотите архивировать эту группу? Она будет скрыта из списка активных групп.'
      "
      :item-name="group?.code"
      :confirm-text="group?.isArchived ? 'Восстановить' : 'В архив'"
      :loading-text="group?.isArchived ? 'Восстановление...' : 'Архивация...'"
      variant="warning"
      :loading="isArchiving"
      @confirm="archiveGroup"
      @cancel="showArchiveModal = false"
    />

    <!-- Удаление группы: для необратимой операции требуем ввести код группы -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы"
      message="Вы уверены, что хотите удалить эту группу?"
      :item-name="group?.code"
      warning="Все слушатели и отчеты будут удалены. Это действие нельзя отменить."
      :require-text="group?.code || undefined"
      loading-text="Удаление..."
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

    <!-- Подтверждение удаления документа -->
    <UiConfirmModal
      :is-open="showDeleteReportModal"
      title="Удаление документа"
      message="Вы уверены, что хотите удалить этот документ?"
      :item-name="reportToDelete?.name"
      warning="Это действие нельзя отменить."
      loading-text="Удаление..."
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
  Pencil, // иконка «Редактировать» в меню «Действия»
  Upload, // иконка «Загрузить документ» в меню «Действия»
  Archive, // иконка «В архив» в меню «Действия»
  ArchiveRestore, // иконка «Восстановить» в меню «Действия»
} from "lucide-vue-next";
import type { StudyGroup } from "~/types/group";
import type { EvaluationSheetsCommission } from "../../../../shared/utils/evaluationSheets";
import type { PracticalSkillsSheetForm } from "../../../../shared/utils/practicalSkillsSheet";
import type { FinalExamProtocolForm } from "../../../../shared/utils/finalExamProtocol";
import type { RegistryForm } from "../../../../shared/utils/registry";

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
const showEmptyJournalModal = ref(false); // Форма выбора инструкторов и формата журнала
const generatingEvaluationSheets = ref(false); // Состояние генерации оценочных листов
const showEvaluationSheetsModal = ref(false); // Форма состава комиссии перед скачиванием листов
const generatingEvaluationSheetsTest = ref(false); // Состояние генерации оценочных листов (тест)
const showEvaluationSheetsTestModal = ref(false); // Форма состава комиссии для листов (тест)
const generatingFinalExamProtocol = ref(false); // Состояние генерации протокола экзамена
const generatingPracticalSkills = ref(false); // Состояние генерации ведомости практических работ
const showPracticalSkillsModal = ref(false); // Форма данных ведомости практических работ
const showFinalExamProtocolModal = ref(false); // Форма данных протокола перед скачиванием
const generatingFinalExamProtocolTest = ref(false); // Состояние генерации протокола экзамена (тест)
const showFinalExamProtocolTestModal = ref(false); // Форма данных протокола (тест) перед скачиванием
const generatingAssessmentSheet = ref(false); // Состояние генерации ведомости контроля знаний
const showAssessmentSheetModal = ref(false); // Форма блока подписей и формата ведомости
const generatingRegistry = ref(false); // Состояние генерации реестра
const showRegistryModal = ref(false); // Форма данных реестра перед скачиванием
const generatingAcquaintanceSheet = ref(false); // Состояние генерации листа ознакомления
const showAcquaintanceSheetModal = ref(false); // Выбор инструктора для листа ознакомления
const generatingQuestionnaire = ref(false); // Состояние генерации обезличенного вопросника
const showQuestionnaireModal = ref(false); // Форма вопросника: место, дата, инструктор
const generatingGroupList = ref(false); // Состояние генерации списка группы
const generatingGroupSchedule = ref(false); // Состояние генерации расписания группы

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
// Вкладки стали computed, чтобы показывать счётчики (слушатели, дисциплины, занятия, файлы);
// ярлыки сокращены: «Программа и Журнал» -> «Журнал», «Документы» -> «Файлы»
const tabs = computed(() => [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  {
    id: "students",
    label: "Слушатели",
    icon: GraduationCap,
    count: group.value?.students?.length || 0,
  },
  {
    id: "journal",
    label: "Журнал",
    icon: BookOpen,
    count: disciplines.value.length,
  },
  {
    id: "schedule",
    label: "Расписание",
    icon: CalendarDays,
    count: scheduleEvents.value.length,
  },
  { id: "files", label: "Файлы", icon: FileText, count: reports.value.length },
]);

const changeTab = (tabId: string) => {
  activeTab.value = tabId;
  router.push({ query: { ...route.query, tab: tabId } });
};

const syncTabWithUrl = () => {
  const tab = route.query.tab as string;
  if (tab && tabs.value.some((t) => t.id === tab)) {
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

  const academicHourMinutes = parseInt(
    scheduleSettings.value.academic_hour_minutes || "40",
    10,
  );

  // Fallback: из durationMinutes (округление до 0.5 а-ч)
  if (event.durationMinutes) {
    return Math.round((event.durationMinutes / academicHourMinutes) * 2) / 2;
  }

  // Последний fallback: из разницы startTime/endTime
  if (event.startTime && event.endTime) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.round((diffMinutes / academicHourMinutes) * 2) / 2;
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

const averageAttendance = computed(() => {
  if (studentAttendanceData.value.size === 0) return 0;
  let totalAttended = 0;
  let totalMax = 0;

  for (const data of studentAttendanceData.value.values()) {
    totalAttended += data.attended;
    totalMax += data.total;
  }

  if (totalMax === 0) return 0;
  return (totalAttended / totalMax) * 100;
});

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

// Цвет UiBadge для статуса в шапке (вместо ручных классов statusClass): светлый/серый для архива и неактивной
const statusBadgeColor = computed<
  "primary" | "success" | "error" | "warning" | "info" | "light" | "dark"
>(() => {
  if (!group.value) return "light";
  if (group.value.isArchived || !group.value.isActive) return "light";
  const today = new Date();
  if (new Date(group.value.endDate) < today) return "warning";
  if (new Date(group.value.startDate) > today) return "info";
  return "success";
});

// Сплошной цвет заливки полосы посещаемости (прежняя заливка брала класс bg-*/10 и была почти невидима)
const getAttendanceBarClass = (percent: number): string => {
  if (percent >= 75) return "bg-success";
  if (percent >= 50) return "bg-warning";
  return "bg-danger";
};

// ... status computed ...
const statusClass = computed(() => {
  if (!group.value) return "";
  if (group.value.isArchived)
    return "bg-gray-100 text-gray-500 border-gray-200";
  const today = new Date();
  const endDate = new Date(group.value.endDate);
  const startDate = new Date(group.value.startDate);

  if (!group.value.isActive)
    return "bg-gray-100 text-gray-500 border-gray-200";
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
  const academicHourMinutes = parseInt(
    scheduleSettings.value.academic_hour_minutes || "40",
    10,
  );

  return scheduleEvents.value.reduce((sum, event) => {
    // ИСКЛЮЧАЕМ пересдачи — они не входят в часы учебной программы
    if (event.allowedStudentIds && event.allowedStudentIds.length > 0) {
      return sum;
    }

    // Приоритет: academicHours → durationMinutes → разница startTime/endTime
    // Формула: round до ближайших 0.5 а-ч
    if (event.academicHours) {
      return sum + event.academicHours;
    }
    if (event.durationMinutes) {
      return sum + Math.round((event.durationMinutes / academicHourMinutes) * 2) / 2;
    }
    if (event.startTime && event.endTime) {
      const diffMinutes =
        (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / 60000;
      return sum + Math.round((diffMinutes / academicHourMinutes) * 2) / 2;
    }
    return sum;
  }, 0);
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

    // ИСКЛЮЧАЕМ пересдачи — они не входят в плановые часы преподавателя по программе
    if (event.allowedStudentIds && event.allowedStudentIds.length > 0) continue;

    const instrId =
      instr.id || instr.instructorId || String(instr.fullName || instr.name);
    if (!instrId) continue;

    // Академические часы занятия с единой формулой округления до 0.5 а-ч
    let hours = 0;
    if (event.academicHours) {
      hours = event.academicHours;
    } else if (event.durationMinutes) {
      hours = Math.round((event.durationMinutes / academicHourMinutes) * 2) / 2;
    } else if (event.startTime && event.endTime) {
      const diff =
        (new Date(event.endTime).getTime() -
          new Date(event.startTime).getTime()) /
        60000;
      hours = Math.round((diff / academicHourMinutes) * 2) / 2;
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

// Функция для скачивания пустого журнала. Формат и инструкторов для строки
// «Instruktor F.I.Sh» пользователь выбирает в форме (GroupsEmptyJournalModal)
const downloadEmptyJournal = async ({
  format,
  instructorIds,
}: {
  format: "pdf" | "docx";
  instructorIds: string[];
}) => {
  if (generatingEmptyJournal.value || !group.value) return;

  try {
    generatingEmptyJournal.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    // Бланк формирует сервер по утверждённому шаблону журнала (Word или PDF)
    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/empty-journal`,
      {
        query: { format, instructorIds: instructorIds.join(",") },
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Pustoy_Zhurnal_${group.value.code}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

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

    showEmptyJournalModal.value = false;
    toast.success(
      `Пустой журнал успешно сформирован (${format.toUpperCase()})`,
    );
  } catch (error: any) {
    console.error("Error generating empty journal:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания журнала"
        : "Ошибка при формировании пустого журнала",
    );
  } finally {
    generatingEmptyJournal.value = false;
  }
};

// Ведомость проведения контроля знаний — бланк по утверждённому образцу, формирует сервер
// (server/services/assessmentSheetService.ts). Блок подписей и формат пользователь выбирает
// в форме (GroupsAssessmentSheetModal)
const downloadAssessmentSheet = async ({
  format,
  examinerInstructorId,
}: {
  format: "pdf" | "docx";
  examinerInstructorId: string | null;
}) => {
  if (generatingAssessmentSheet.value || !group.value) return;

  try {
    generatingAssessmentSheet.value = true;

    const blob = await authFetch<Blob>(`/api/groups/${group.value.id}/assessment-sheet`, {
      query: { format, examinerInstructorId: examinerInstructorId ?? undefined },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vedomost_${group.value.code}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "assessment_sheet",
          format,
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showAssessmentSheetModal.value = false;
    toast.success(`Ведомость контроля знаний сформирована (${format.toUpperCase()})`);
  } catch (error: any) {
    console.error("Error generating assessment sheet:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания ведомости"
        : error?.data?.message || "Ошибка при формировании ведомости",
    );
  } finally {
    generatingAssessmentSheet.value = false;
  }
};

// Функция для скачивания оценочных листов (BAHOLASH VARAQASI) — один Word-файл на всю группу.
// Состав комиссии пользователь заполняет в форме (GroupsEvaluationSheetsModal)
const downloadEvaluationSheets = async (
  commission: EvaluationSheetsCommission,
) => {
  if (generatingEvaluationSheets.value || !group.value) return;

  try {
    generatingEvaluationSheets.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    // Листы формирует сервер по утверждённому образцу (по листу на слушателя)
    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/evaluation-sheets`,
      { method: "POST", body: commission, responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${group.value.code} Оценочные листы (устный).docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "evaluation_sheets",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    showEvaluationSheetsModal.value = false;
    toast.success("Оценочные листы успешно сформированы (DOCX)");
  } catch (error: any) {
    console.error("Error generating evaluation sheets:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания оценочных листов"
        : "Ошибка при формировании оценочных листов",
    );
  } finally {
    generatingEvaluationSheets.value = false;
  }
};

// Оценочные листы (тест): оценка и дата сдачи подставляются сервером из результатов тестов группы,
// состав комиссии (председатель и члены) пользователь заполняет в форме
const downloadEvaluationSheetsTest = async (
  commission: EvaluationSheetsCommission,
) => {
  if (generatingEvaluationSheetsTest.value || !group.value) return;

  try {
    generatingEvaluationSheetsTest.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/evaluation-sheets-test`,
      {
        method: "POST",
        body: { chairman: commission.chairman, members: commission.members },
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${group.value.code} Оценочные листы (тест).docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "evaluation_sheets_test",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showEvaluationSheetsTestModal.value = false;
    toast.success("Оценочные листы (тест) успешно сформированы (DOCX)");
  } catch (error: any) {
    console.error("Error generating evaluation sheets (test):", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания оценочных листов"
        : "Ошибка при формировании оценочных листов (тест)",
    );
  } finally {
    generatingEvaluationSheetsTest.value = false;
  }
};

// Функция для скачивания протокола итогового экзамена (Bayonnoma) со списком слушателей.
// Дату, номер, сведения об экзамене и состав комиссии пользователь заполняет в форме
// (GroupsFinalExamProtocolModal)
const downloadFinalExamProtocol = async (protocol: FinalExamProtocolForm) => {
  if (generatingFinalExamProtocol.value || !group.value) return;

  try {
    generatingFinalExamProtocol.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    // Протокол формирует сервер по утверждённому образцу
    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/final-exam-protocol`,
      { method: "POST", body: protocol, responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Как у образца: «Bayonnoma_AX-26-04_AB-APA-02PP.docx»
    link.download = `Bayonnoma_${protocol.number.replace(/[\\/:*?"<>|]/g, "_")}_${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "final_exam_protocol",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    showFinalExamProtocolModal.value = false;
    toast.success("Протокол экзамена успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating final exam protocol:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания протокола экзамена"
        : "Ошибка при формировании протокола экзамена",
    );
  } finally {
    generatingFinalExamProtocol.value = false;
  }
};

// Ведомость практических работ (Amaliy koʻnikmalarni tekshirish QAYDNOMASI): по странице на
// слушателя. Службу, дату, время и комиссию пользователь заполняет в форме
// (GroupsPracticalSkillsSheetModal)
const downloadPracticalSkillsSheet = async (sheet: PracticalSkillsSheetForm) => {
  if (generatingPracticalSkills.value || !group.value) return;

  try {
    generatingPracticalSkills.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/practical-skills-sheet`,
      { method: "POST", body: sheet, responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Amaliy_qaydnoma_${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "practical_skills_sheet",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showPracticalSkillsModal.value = false;
    toast.success("Ведомость практических работ успешно сформирована (DOCX)");
  } catch (error: any) {
    console.error("Error generating practical skills sheet:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания ведомости практических работ"
        : "Ошибка при формировании ведомости практических работ",
    );
  } finally {
    generatingPracticalSkills.value = false;
  }
};

// Протокол итогового экзамена-теста (Bayonnoma): баллы, оценки и итоговые числа сервер берёт
// из результатов тестов группы, остальное пользователь заполняет в форме
// (GroupsFinalExamProtocolTestModal)
const downloadFinalExamProtocolTest = async (protocol: FinalExamProtocolForm) => {
  if (generatingFinalExamProtocolTest.value || !group.value) return;

  try {
    generatingFinalExamProtocolTest.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/final-exam-protocol-test`,
      { method: "POST", body: protocol, responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Как у образца: «Bayonnoma_AX-26-18_AB-SAB-01PK_test.docx»
    link.download = `Bayonnoma_${protocol.number.replace(/[\\/:*?"<>|]/g, "_")}_${group.value.code}_test.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "final_exam_protocol_test",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    showFinalExamProtocolTestModal.value = false;
    toast.success("Протокол экзамена (тест) успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating final exam protocol (test):", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания протокола экзамена"
        : "Ошибка при формировании протокола экзамена (тест)",
    );
  } finally {
    generatingFinalExamProtocolTest.value = false;
  }
};

// Функция для скачивания реестра — листа регистрации слушателей и подтверждения личности.
// Дату, время, место и комиссию пользователь заполняет в форме (GroupsRegistryModal)
const downloadRegistry = async (registry: RegistryForm) => {
  if (generatingRegistry.value || !group.value) return;

  try {
    generatingRegistry.value = true;

    if (!group.value.students?.length) {
      toast.error("В группе нет студентов");
      return;
    }

    // Реестр формирует сервер по образцу
    const blob = await authFetch<Blob>(`/api/groups/${group.value.id}/registry`, {
      method: "POST",
      body: registry,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Реестр ${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "registry",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    showRegistryModal.value = false;
    toast.success("Реестр успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating registry:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания реестра"
        : "Ошибка при формировании реестра",
    );
  } finally {
    generatingRegistry.value = false;
  }
};

// Функция для скачивания листа ознакомления с инструктажем. Группа, программа и дата
// подставляются на сервере, инструктора пользователь выбирает в форме (GroupsAcquaintanceSheetModal)
const downloadAcquaintanceSheet = async ({
  instructorId,
}: {
  instructorId: string | null;
}) => {
  if (generatingAcquaintanceSheet.value || !group.value) return;

  try {
    generatingAcquaintanceSheet.value = true;

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/acquaintance-sheet`,
      {
        query: instructorId ? { instructorId } : {},
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Лист ознакомления ${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "acquaintance_sheet",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    showAcquaintanceSheetModal.value = false;
    toast.success("Лист ознакомления успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating acquaintance sheet:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания листа ознакомления"
        : "Ошибка при формировании листа ознакомления",
    );
  } finally {
    generatingAcquaintanceSheet.value = false;
  }
};

// «Обезличенный вопросник»: программа, группа, число слушателей и период подставляются на
// сервере, место, дату заполнения и инструктора пользователь вводит в форме (GroupsQuestionnaireModal)
const downloadQuestionnaire = async (questionnaire: {
  placeUz: string;
  placeRu: string;
  filledDate: string;
  instructorId: string | null;
}) => {
  if (generatingQuestionnaire.value || !group.value) return;

  try {
    generatingQuestionnaire.value = true;

    const blob = await authFetch<Blob>(`/api/groups/${group.value.id}/questionnaire`, {
      method: "POST",
      body: questionnaire,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Вопросник ${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "questionnaire",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    showQuestionnaireModal.value = false;
    toast.success("Вопросник успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating questionnaire:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания вопросника"
        : "Ошибка при формировании вопросника",
    );
  } finally {
    generatingQuestionnaire.value = false;
  }
};

// «Список группы» — бланк таблицы слушателей: заполнены только номер группы и даты обучения
const downloadGroupList = async () => {
  if (generatingGroupList.value || !group.value) return;

  try {
    generatingGroupList.value = true;

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/group-list`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Список группы ${group.value.code}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    // Логируем скачивание
    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "group_list",
          format: "docx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
      // Не показываем ошибку пользователю, это не критично
    }

    toast.success("Список группы успешно сформирован (DOCX)");
  } catch (error: any) {
    console.error("Error generating group list:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания списка группы"
        : "Ошибка при формировании списка группы",
    );
  } finally {
    generatingGroupList.value = false;
  }
};

// «Расписание группы» — Excel со всеми занятиями группы (все инструкторы), как расписание
// инструктора, но без фильтра по нему
const downloadGroupSchedule = async () => {
  if (generatingGroupSchedule.value || !group.value) return;

  try {
    generatingGroupSchedule.value = true;

    const blob = await authFetch<Blob>(
      `/api/groups/${group.value.id}/schedule-export`,
      { responseType: "blob" },
    );

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Расписание ${group.value.code}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    try {
      await authFetch("/api/reports/log-download", {
        method: "POST",
        body: {
          reportType: "group_schedule",
          format: "xlsx",
          groupCode: group.value.code,
          groupId: group.value.id,
        },
      });
    } catch (logError) {
      console.error("Failed to log download:", logError);
    }

    toast.success("Расписание группы успешно сформировано (XLSX)");
  } catch (error: any) {
    console.error("Error generating group schedule:", error);
    toast.error(
      error?.statusCode === 403
        ? "Недостаточно прав для скачивания расписания группы"
        : error?.statusCode === 404
          ? "В расписании группы нет занятий"
          : "Ошибка при формировании расписания группы",
    );
  } finally {
    generatingGroupSchedule.value = false;
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

// Меню «Документы»: 8 генераторов, сгруппированных по этапам обучения.
// Каждый пункт открывает ту же модалку / вызывает ту же функцию, что и прежние кнопки на вкладке «Слушатели»
const documentGroups = computed(() => [
  {
    label: "Начало обучения",
    items: [
      { key: "groupList", label: "Список группы", icon: FileText, loading: generatingGroupList.value },
      { key: "registry", label: "Реестр", icon: FileText, loading: generatingRegistry.value },
      { key: "acquaintance", label: "Лист ознакомления", icon: FileText, loading: generatingAcquaintanceSheet.value },
    ],
  },
  {
    label: "Ход обучения",
    items: [
      { key: "groupSchedule", label: "Расписание группы", icon: FileText, loading: generatingGroupSchedule.value },
      { key: "emptyJournal", label: "Пустой журнал", icon: FileText, loading: generatingEmptyJournal.value },
    ],
  },
  {
    label: "Аттестация",
    items: [
      { key: "assessment", label: "Ведомость контроля", icon: FileText, loading: generatingAssessmentSheet.value },
      { key: "practical", label: "Ведомость практ. работ", icon: FileText, loading: generatingPracticalSkills.value },
      { key: "evaluation", label: "Оценочные листы (устный)", icon: FileText, loading: generatingEvaluationSheets.value },
      { key: "evaluationTest", label: "Оценочные листы (тест)", icon: FileText, loading: generatingEvaluationSheetsTest.value },
      { key: "protocol", label: "Протокол экзамена (устный)", icon: FileText, loading: generatingFinalExamProtocol.value },
      { key: "protocolTest", label: "Протокол экзамена (тест)", icon: FileText, loading: generatingFinalExamProtocolTest.value },
    ],
  },
  {
    label: "Завершение",
    items: [
      { key: "questionnaire", label: "Вопросник", icon: FileText, loading: generatingQuestionnaire.value },
    ],
  },
]);

// Обработчик выбора пункта меню «Документы»: делегирует прежней логике (модалки/скачивание)
const handleDocumentSelect = (key: string) => {
  switch (key) {
    case "groupList":
      downloadGroupList();
      break;
    case "registry":
      showRegistryModal.value = true;
      break;
    case "acquaintance":
      showAcquaintanceSheetModal.value = true;
      break;
    case "groupSchedule":
      downloadGroupSchedule();
      break;
    case "emptyJournal":
      showEmptyJournalModal.value = true;
      break;
    case "assessment":
      showAssessmentSheetModal.value = true;
      break;
    case "practical":
      showPracticalSkillsModal.value = true;
      break;
    case "evaluation":
      showEvaluationSheetsModal.value = true;
      break;
    case "evaluationTest":
      showEvaluationSheetsTestModal.value = true;
      break;
    case "protocol":
      showFinalExamProtocolModal.value = true;
      break;
    case "protocolTest":
      showFinalExamProtocolTestModal.value = true;
      break;
    case "questionnaire":
      showQuestionnaireModal.value = true;
      break;
  }
};

// Меню «Действия»: «Управление» + отдельная группа опасных операций (архив/удаление) — права проверяются через hidden
const actionGroups = computed(() => [
  {
    label: "Управление",
    items: [
      { key: "edit", label: "Редактировать", icon: Pencil, hidden: !canEditGroups.value },
      {
        key: "students",
        label: "Управление слушателями",
        icon: Users,
        hidden: !(canManageGroupStudents.value && !group.value?.isArchived),
      },
      { key: "upload", label: "Загрузить документ", icon: Upload, hidden: !canEditGroups.value },
    ],
  },
  {
    items: [
      {
        key: "archive",
        label: group.value?.isArchived ? "Восстановить" : "В архив",
        icon: group.value?.isArchived ? ArchiveRestore : Archive,
        hidden: !canArchiveGroups.value,
      },
      { key: "delete", label: "Удалить группу", icon: Trash2, danger: true, hidden: !canDeleteGroups.value },
    ],
  },
]);

// Показываем меню «Действия» только если есть хотя бы один доступный пункт
const hasGroupActions = computed(() =>
  actionGroups.value.some((g) => g.items.some((i) => !i.hidden)),
);

// Обработчик выбора пункта меню «Действия» — открывает те же модалки, что и прежние кнопки в шапке
const handleGroupAction = (key: string) => {
  switch (key) {
    case "edit":
      showEditModal.value = true;
      break;
    case "students":
      showManageStudentsModal.value = true;
      break;
    case "upload":
      showUploadReportModal.value = true;
      break;
    case "archive":
      showArchiveModal.value = true;
      break;
    case "delete":
      showDeleteModal.value = true;
      break;
  }
};

onMounted(() => {
  loadScheduleSettings(); // Загружаем настройки расписания
  loadGroup();
  syncTabWithUrl(); // Синхронизируем вкладку с URL
});
</script>
