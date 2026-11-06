<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка информации о группе...</p>
      </div>
    </div>

    <!-- Группа не найдена: единственное действие — вернуться к списку -->
    <div v-else-if="!group" class="flex min-h-[400px] items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-4 inline-block rounded-full bg-gray-100 p-5 dark:bg-white/[0.06]">
          <ShieldCheck class="h-10 w-10 text-gray-400" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Группа не найдена</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Возможно, группа была удалена или вы используете неверную ссылку.
        </p>
        <UiButton class="mt-6" @click="navigateTo('/attestation')">Вернуться к списку групп</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Единая шапка: крошки вместо ссылки «Назад», код группы + статус, мета-строка в одну линию -->
      <UiPageHeader
        :title="group.code"
        :breadcrumbs="[{ label: 'Аттестация', to: '/attestation' }, { label: group.code }]"
      >
        <!-- Статус группы бейджем рядом с кодом (без CAPS и 10px) -->
        <template #badge>
          <span class="rounded-md border px-2 py-0.5 text-xs font-medium" :class="statusClass">{{ statusText }}</span>
        </template>

        <!-- Мета: название, даты экзамена, место, тест — вместо отдельного <h1> и трёх строк -->
        <template #meta>
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ group.name }}</span>
          <span v-if="group.examStart" class="inline-flex items-center gap-1.5">
            <CalendarIcon class="h-3.5 w-3.5 shrink-0 text-gray-400" />
            {{ formatDateTime(group.examStart) }} — {{ formatDateTime(group.examEnd) }}
          </span>
          <span v-if="group.location" class="inline-flex items-center gap-1.5">
            <MapPin class="h-3.5 w-3.5 shrink-0 text-gray-400" />{{ group.location }}
          </span>
          <span v-if="group.templateName" class="inline-flex items-center gap-1.5">
            <FileCheck class="h-3.5 w-3.5 shrink-0 text-gray-400" />
            Тест: <b class="font-medium text-gray-700 dark:text-gray-300">{{ group.templateName }}</b> ({{ group.passingScore ?? "—" }}%)
          </span>
        </template>

        <!-- Главное действие — протокол; доступно только при праве canManageAttestation.
             Кнопка «Параметры» убрана: это дубль вкладки «Параметры и расписание» -->
        <template #actions>
          <UiButton
            v-if="canManageAttestation"
            variant="primary"
            :start-icon="FileText"
            :loading="generatingProtocol"
            @click="generateProtocol"
          >
            {{ group.protocolFileId ? "Обновить протокол" : "Сформировать протокол" }}
          </UiButton>
        </template>
      </UiPageHeader>

      <!-- Полоса из 4 метрик через UiStat (плоские карточки, без shadow и hover-эффектов) -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UiStat label="Инструкторов" :value="instructors.length" hint="в группе" :icon="Users" tone="primary" />
        <UiStat
          label="Комиссия"
          :value="commission.length"
          :hint="chairman ? chairman.fullName : 'Председатель не назначен'"
          :icon="Gavel"
          tone="warning"
        />
        <UiStat
          label="Сдали экзамен"
          :value="`${passedCount} / ${results.length}`"
          :icon="CheckCircle2"
          tone="success"
          :progress="passedPercent"
        />
        <UiStat label="Сертификаты" :value="group.certTemplateName || 'Не назначены'" :icon="Award" tone="success" />
      </div>

      <!-- Вкладки через UiTabs; «Параметры» скрыты для тех, у кого нет права управления -->
      <UiTabs v-model="activeTab" :tabs="tabItems" />

      <!-- Вкладка 1: участники и результаты -->
      <div v-show="activeTab === 'participants'" class="space-y-4">
        <!-- Единый блок фильтров: поиск + сегменты статусов (счётчики внутри) + «Найдено N» -->
        <UiFilterBar
          v-model:search="searchInstructor"
          search-placeholder="Поиск по имени или специальности..."
          :debounce="0"
          :segments="statusFilters.map((f) => ({ value: f.id, label: f.label, count: f.count }))"
          :segment="statusFilter"
          :total="filteredResults.length"
          @update:segment="onSegment"
        >
          <!-- Добавление инструкторов — управляющее действие, только при canManageAttestation -->
          <template #actions>
            <UiButton v-if="canManageAttestation" variant="primary" :start-icon="UserPlus" @click="showInstructorsModal = true">
              Добавить инструкторов
            </UiButton>
          </template>
        </UiFilterBar>

        <!-- Таблица инструкторов -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <!-- Пустое состояние: нет инструкторов вообще -->
          <div v-if="instructors.length === 0" class="px-4 py-12 text-center">
            <UiEmptyState title="В группе пока нет инструкторов" description="Добавьте инструкторов с помощью окна выбора." :icon="Users" />
            <UiButton v-if="canManageAttestation" class="mt-2" :start-icon="UserPlus" @click="showInstructorsModal = true">
              Выбрать инструкторов
            </UiButton>
          </div>

          <!-- Пустое состояние: фильтр ничего не нашёл -->
          <div v-else-if="filteredResults.length === 0" class="py-12 text-center text-sm text-gray-500">
            Нет участников, соответствующих критериям фильтра
          </div>

          <!-- Контейнер со скроллом, чтобы шапка таблицы была липкой -->
          <div v-else class="max-h-[65vh] overflow-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr class="border-b border-gray-100 dark:border-gray-800">
                  <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Инструктор</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Балл теста</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Попыток</th>
                  <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">Решение комиссии</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Действия</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="r in filteredResults"
                  :key="r.instructorId"
                  class="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <!-- Инструктор -->
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2.5">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                        {{ getInitials(r.fullName) }}
                      </div>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ r.fullName }}</p>
                        <p class="truncate text-xs text-gray-500">{{ r.specialty || r.positionSnapshot || "Инструктор" }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Балл теста -->
                  <td class="px-4 py-2.5 text-center">
                    <span
                      v-if="r.scorePercent !== null"
                      class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold"
                      :class="[
                        group.passingScore && r.scorePercent >= group.passingScore
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger',
                      ]"
                    >
                      {{ Math.round(r.scorePercent) }}%
                    </span>
                    <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                  </td>

                  <!-- Попытки -->
                  <td class="px-4 py-2.5 text-center text-gray-600 dark:text-gray-400">
                    <span v-if="r.attempts > 0">{{ r.attempts }}</span>
                    <span v-else class="text-gray-300 dark:text-gray-600">0</span>
                  </td>

                  <!-- Бейдж решения -->
                  <td class="px-4 py-2.5">
                    <span :class="['inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', decisionBadgeClass(r)]">
                      {{ decisionLabel(r) }}
                    </span>
                  </td>

                  <!-- Действия строки: одно основное («Решение ▾» вместо двух одинаковых кнопок) + «⋯» -->
                  <td class="px-4 py-2.5">
                    <div class="flex items-center justify-end gap-1">
                      <!-- Решение комиссии: Сдал / Не сдал в одном меню; обработчик прежний — requestDecide -->
                      <UiDropdown
                        label="Решение"
                        variant="soft"
                        size="sm"
                        :groups="decisionGroups"
                        @select="onDecisionSelect($event, r)"
                      />
                      <!-- «⋯»: оценочный лист, сертификат; удаление из группы — отдельной группой «Опасные» -->
                      <UiDropdown
                        icon-only
                        variant="ghost"
                        size="sm"
                        aria-label="Другие действия"
                        :groups="rowMenuGroups(r)"
                        @select="onRowAction($event, r)"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Вкладка 2: комиссия -->
      <div v-show="activeTab === 'commission'" class="space-y-4">
        <div class="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div class="space-y-0.5">
            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <Gavel class="h-4 w-4 text-gray-400" />
              Аттестационная комиссия группы
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Комиссия принимает решения по результатам тестов и подписывает протокол аттестации.
            </p>
          </div>

          <!-- Изменение состава комиссии — только при canManageAttestation -->
          <UiButton v-if="canManageAttestation" variant="primary" class="shrink-0" :start-icon="Settings" @click="showCommissionModal = true">
            {{ commission.length ? "Изменить состав комиссии" : "Сформировать комиссию" }}
          </UiButton>
        </div>

        <div v-if="commission.length === 0" class="rounded-xl border border-gray-200 bg-white py-12 text-center dark:border-gray-800 dark:bg-white/[0.03]">
          <UiEmptyState title="Комиссия ещё не сформирована" description="Выберите членов комиссии и назначьте председателя." :icon="Gavel" />
          <UiButton v-if="canManageAttestation" class="mt-2" :start-icon="Plus" @click="showCommissionModal = true">Сформировать комиссию</UiButton>
        </div>

        <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="c in sortedCommission"
            :key="c.id"
            class="flex flex-col justify-between rounded-xl border p-4"
            :class="[
              c.role === 'chairman'
                ? 'border-warning/40 bg-warning/5'
                : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]',
            ]"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                  :class="[
                    c.role === 'chairman'
                      ? 'border-warning bg-warning text-white'
                      : 'border-primary/20 bg-primary/10 text-primary',
                  ]"
                >
                  <Crown v-if="c.role === 'chairman'" class="h-4 w-4" />
                  <span v-else>{{ getInitials(c.fullName) }}</span>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ c.fullName }}</p>
                  <p class="mt-0.5 truncate text-xs text-gray-500">{{ c.position || c.organization || "Член комиссии" }}</p>
                </div>
              </div>

              <!-- Роль в комиссии: цвета из токенов, без CAPS и 10px -->
              <span
                class="shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium"
                :class="[
                  c.role === 'chairman'
                    ? 'border-warning/30 bg-warning/15 text-warning'
                    : c.role === 'responsible'
                      ? 'border-success/20 bg-success/10 text-success'
                      : c.role === 'secretary'
                        ? 'border-info/20 bg-info/10 text-info'
                        : 'border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-white/[0.06] dark:text-gray-300',
                ]"
              >
                {{ roleLabel(c.role) }}
              </span>
            </div>

            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400 dark:border-gray-800">
              <span class="truncate">{{ c.organization || "Организация не указана" }}</span>
              <!-- Убрать из комиссии — управляющее действие (canManageAttestation); подтверждение — прежнее UiConfirmModal -->
              <button
                v-if="canManageAttestation"
                type="button"
                class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-danger/10 hover:text-danger"
                title="Убрать из комиссии"
                aria-label="Убрать из комиссии"
                @click="requestRemoveCommissionMember(c)"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка 3: параметры и расписание — целиком только для canManageAttestation -->
      <div v-if="canManageAttestation" v-show="activeTab === 'settings'" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Карточка 1: расписание и тест -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <CalendarClock class="h-4 w-4 text-gray-400" />
                Расписание и шаблон теста
              </h3>
            </div>
            <div class="space-y-3.5 p-4">
              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Шаблон теста</label>
                <div class="relative">
                  <select
                    v-model="scheduleForm.testTemplateId"
                    class="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Не назначен</option>
                    <option v-for="t in testTemplates" :key="t.id" :value="t.id">{{ t.name }} (порог: {{ t.passingScore ?? 75 }}%)</option>
                  </select>
                  <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Начало экзамена</label>
                  <input
                    v-model="scheduleForm.examStart"
                    type="datetime-local"
                    class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Окончание экзамена</label>
                  <input
                    v-model="scheduleForm.examEnd"
                    type="datetime-local"
                    class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Место проведения</label>
                <input
                  v-model="scheduleForm.location"
                  type="text"
                  placeholder="Аудитория 17, Главный учебный корпус"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div class="flex justify-end pt-1">
                <UiButton :start-icon="Save" :loading="savingSchedule" @click="saveSchedule">Сохранить расписание</UiButton>
              </div>
            </div>
          </div>

          <!-- Карточка 2: автовыдача сертификатов -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Award class="h-4 w-4 text-gray-400" />
                Автовыдача сертификатов
              </h3>
            </div>
            <div class="space-y-3.5 p-4">
              <div class="flex items-start gap-2 rounded-lg bg-info/10 p-3 text-sm text-info">
                <Info class="mt-0.5 h-4 w-4 shrink-0" />
                <p class="leading-relaxed">
                  При включенном шаблоне сертификат генерируется автоматически сразу после того, как инструктор отмечается со статусом «Сдал».
                </p>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Шаблон сертификата</label>
                <div class="relative">
                  <select
                    v-model="certTemplateId"
                    class="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Не назначен (автовыдача отключена)</option>
                    <option v-for="t in certificateTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                  <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div class="flex justify-end pt-1">
                <UiButton :start-icon="Save" :loading="savingCertTemplate" @click="saveCertTemplate">Сохранить шаблон</UiButton>
              </div>
            </div>
          </div>

          <!-- Карточка 3: основные данные группы -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <ShieldCheck class="h-4 w-4 text-gray-400" />
                Основные данные группы
              </h3>
            </div>
            <div class="space-y-3.5 p-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Код группы</label>
                  <input
                    :value="group.code"
                    type="text"
                    disabled
                    class="h-9 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 font-mono text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-white/[0.04]"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Статус</label>
                  <div class="relative">
                    <select
                      v-model="infoForm.status"
                      class="h-9 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-9 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="draft">Черновик</option>
                      <option value="scheduled">Запланирована</option>
                      <option value="in_progress">Идёт экзамен</option>
                      <option value="completed">Завершена</option>
                      <option value="cancelled">Отменена</option>
                    </select>
                    <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Название</label>
                <input
                  v-model="infoForm.name"
                  type="text"
                  class="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
                <textarea
                  v-model="infoForm.description"
                  rows="2"
                  class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                ></textarea>
              </div>

              <div class="flex justify-end pt-1">
                <UiButton :start-icon="Save" :loading="savingInfo" @click="saveGroupInfo">Сохранить данные</UiButton>
              </div>
            </div>
          </div>

          <!-- Карточка 4: опасная зона (отделена цветом; удаление подтверждается вводом кода группы) -->
          <div class="flex flex-col justify-between space-y-4 rounded-xl border border-danger/20 bg-danger/5 p-4">
            <div>
              <h4 class="flex items-center gap-2 text-sm font-semibold text-danger">
                <AlertTriangle class="h-4 w-4" />
                Опасная зона
              </h4>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Удаление группы приведет к безвозвратному удалению всех связанных результатов и связей с инструкторами.
              </p>
            </div>

            <div class="flex justify-end">
              <UiButton variant="danger-ghost" :start-icon="Trash2" @click="showDeleteModal = true">Удалить группу</UiButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модалка выбора инструкторов (мультиселект) -->
    <AttestationSelectInstructorsModal
      :is-open="showInstructorsModal"
      :group-id="groupId"
      :already-selected-ids="instructors.map((i) => i.instructorId)"
      @close="showInstructorsModal = false"
      @added="onInstructorsAdded"
    />

    <!-- Модалка выбора членов комиссии (мультиселект) -->
    <AttestationSelectCommissionModal
      :is-open="showCommissionModal"
      :group-id="groupId"
      :current-members="commission.map((c) => ({ commissionMemberId: c.commissionMemberId, role: c.role }))"
      @close="showCommissionModal = false"
      @saved="onCommissionSaved"
    />

    <!-- Подтверждение решения комиссии (Сдал / Не сдал) -->
    <UiConfirmModal
      :is-open="!!decideTarget"
      :title="decideTarget?.decision === 'passed' ? 'Подтвердить сдачу экзамена' : 'Подтвердить несдачу экзамена'"
      :message="`Изменить решение комиссии по инструктору «${decideTarget?.result?.fullName}» на «${decideTarget?.decision === 'passed' ? 'Сдал' : 'Не сдал'}»?`"
      :warning="decideTarget?.result?.attempts === 0 ? 'Этот инструктор ещё не проходил тестирование — решение будет зафиксировано вручную.' : ''"
      confirm-text="Подтвердить"
      cancel-text="Отмена"
      :variant="decideTarget?.decision === 'passed' ? 'warning' : 'danger'"
      :loading="deciding"
      loading-text="Сохранение…"
      @confirm="confirmDecide"
      @cancel="decideTarget = null"
    />

    <!-- Удаление инструктора из группы -->
    <UiConfirmModal
      :is-open="!!instructorToRemove"
      title="Удаление инструктора"
      :message="`Удалить инструктора «${instructorToRemove?.fullName}» из состава группы?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="removingInstructor"
      loading-text="Удаление…"
      @confirm="confirmRemoveInstructor"
      @cancel="instructorToRemove = null"
    />

    <!-- Удаление члена комиссии -->
    <UiConfirmModal
      :is-open="!!commissionMemberToRemove"
      title="Удаление члена комиссии"
      :message="`Удалить «${commissionMemberToRemove?.fullName}» из состава аттестационной комиссии?`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="removingCommissionMember"
      loading-text="Удаление…"
      @confirm="confirmRemoveCommissionMember"
      @cancel="commissionMemberToRemove = null"
    />

    <!-- Удаление группы: для необратимого действия требуем ввести код группы -->
    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Удаление группы аттестации"
      :message="`Вы уверены, что хотите удалить группу «${group?.name}»? Действие необратимо.`"
      confirm-text="Удалить навсегда"
      cancel-text="Отмена"
      variant="danger"
      :require-text="group?.code"
      :loading="deletingGroup"
      loading-text="Удаление…"
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
// Право управления аттестацией: скрывает сохранение настроек, добавление/удаление инструкторов и комиссии,
// «Опасную зону» и формирование протокола у пользователей без ATTESTATION_MANAGE (сервер проверяет права и так)
const { canManageAttestation } = usePermissions();

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

// Презентационное: вкладки для UiTabs. Счётчики берём из прежнего поля badge, а «Параметры» скрываем без права управления
const tabItems = computed(() =>
  tabs.value.map((t) => ({
    id: t.id as string,
    label: t.label,
    icon: t.icon,
    count: t.badge,
    hidden: t.id === "settings" && !canManageAttestation.value,
  })),
);

// Сегмент статуса из UiFilterBar пишет в прежний statusFilter (логика фильтрации не менялась)
const onSegment = (v: string | number | boolean) => {
  statusFilter.value = v as StatusFilterId;
};

// Меню «Решение»: два исхода комиссии собраны в одну кнопку, чтобы строка не содержала пары одинаковых кнопок
const decisionGroups = [
  {
    items: [
      { key: "passed", label: "Сдал", icon: CheckCircle2 },
      { key: "failed", label: "Не сдал", icon: XCircle },
    ],
  },
];
const onDecisionSelect = (key: string, r: any) => {
  // Тот же обработчик, что и раньше — откроет UiConfirmModal подтверждения
  if (key === "passed" || key === "failed") requestDecide(r, key);
};

// Меню «⋯» строки: оценочный лист и сертификат (если есть); удаление из группы — отдельная группа «Опасные», только canManageAttestation
const rowMenuGroups = (r: any) => [
  {
    items: [
      { key: "sheet", label: "Оценочный лист", icon: FileText },
      { key: "certificate", label: "Скачать сертификат", icon: Award, hidden: !r.certificateId },
    ],
  },
  {
    label: "Опасные",
    items: [{ key: "remove", label: "Удалить из группы", icon: Trash2, danger: true, hidden: !canManageAttestation.value }],
  },
];
const onRowAction = (key: string, r: any) => {
  if (key === "sheet") openEvaluationSheet(r);
  else if (key === "certificate") window.open(`/api/certificates/download/${r.certificateId}`, "_blank");
  else if (key === "remove") requestRemoveInstructor(r);
};

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
    // Единая нейтральная палитра (gray) и токены warning/success вместо slate/amber/emerald
    draft: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/[0.06] dark:text-gray-400 dark:border-gray-700",
    scheduled: "bg-primary/10 text-primary border-primary/20",
    in_progress: "bg-warning/10 text-warning border-warning/20",
    completed: "bg-success/10 text-success border-success/20",
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
  if (r?.attempts > 0) return "bg-warning/10 text-warning border-warning/20";
  return "bg-gray-100 text-gray-500 border-gray-200 dark:bg-white/[0.06] dark:text-gray-400 dark:border-gray-700";
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
