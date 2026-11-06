<template>
  <!-- Внешний враппер без двойного отступа (отступ задаёт layout) -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Загрузка: компактный спиннер -->
    <div v-if="loading" class="flex min-h-[400px] items-center justify-center">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
        <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Загрузка информации об инструкторе...</p>
      </div>
    </div>

    <!-- Ошибка: единственное действие — вернуться к списку -->
    <div v-else-if="error || !instructor" class="flex min-h-[400px] items-center justify-center">
      <div class="max-w-md text-center">
        <div class="mb-4 inline-block rounded-full bg-gray-100 p-5 text-gray-400 dark:bg-white/[0.06]">
          <UserIcon class="h-10 w-10" />
        </div>
        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ error || "Инструктор не найден" }}
        </h3>
        <UiButton class="mt-6" @click="$router.push('/instructors')">К списку инструкторов</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Единая шапка: крошки, имя, статус бейджем, контакты в мета-строке -->
      <UiPageHeader
        :title="instructor.fullName"
        :breadcrumbs="[{ label: 'Инструкторы', to: '/instructors' }, { label: instructor.fullName }]"
      >
        <!-- Статус активности (раньше — мелкий CAPS-бейдж 9px) -->
        <template #badge>
          <span
            class="rounded-md border px-2 py-0.5 text-xs font-medium"
            :class="instructor.isActive ? 'border-success/20 bg-success/5 text-success' : 'border-danger/20 bg-danger/5 text-danger'"
          >
            {{ instructor.isActive ? 'Активен' : 'Неактивен' }}
          </span>
        </template>

        <!-- Контакты; телефон скрыт маской -->
        <template #meta>
          <span class="inline-flex items-center gap-1.5"><MailIcon class="h-3.5 w-3.5 text-gray-400" />{{ instructor.email || 'Email не указан' }}</span>
          <span class="inline-flex items-center gap-1.5">
            <PhoneIcon class="h-3.5 w-3.5 text-gray-400" />
            <UiSensitiveValue v-if="instructor.phone" :value="instructor.phone" :visible-tail="4" />
            <template v-else>Телефон не указан</template>
          </span>
        </template>

        <!-- Действия: главное «Карточка PDF» + «Изменить» + «⋯» с группой «Опасные» -->
        <template #actions>
          <UiButton variant="primary" :start-icon="FileDownIcon" @click="exportCertificate">Карточка PDF</UiButton>
          <UiButton v-if="canEditInstructors" variant="outline" :start-icon="SettingsIcon" @click="isEditModalOpen = true">Изменить</UiButton>
          <UiDropdown
            v-if="canDeleteInstructors"
            icon-only
            variant="outline"
            aria-label="Другие действия"
            :groups="menuGroups"
            @select="onMenuSelect"
          />
        </template>
      </UiPageHeader>

      <!-- Блок профиля: фото + полоса метрик в одну строку вместо 4 «bento»-карточек -->
      <div class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
          <img v-if="instructor.photo_base64" :src="instructor.photo_base64" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
            <span class="text-xl font-semibold">{{ getInitials(instructor.fullName) }}</span>
          </div>
        </div>

        <div class="grid min-w-0 flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
          <UiStat
            label="Квалификация"
            :value="instructor.academic_degree || instructor.education || 'Не указана'"
            :hint="instructor.academic_rank || '—'"
            :icon="GraduationCapIcon"
            tone="primary"
          />
          <UiStat
            label="Загрузка часов"
            :value="`${instructor.usedHours || 0} / ${instructor.maxHours || '∞'}`"
            :icon="ClockIcon"
            tone="success"
            :progress="Math.min(((instructor.usedHours || 0) / (instructor.maxHours || 1)) * 100, 100)"
          />
          <UiStat label="Стаж в центре" :value="experienceText" :hint="`С ${formatDate(instructor.hireDate)}`" :icon="CalendarIcon" tone="warning" />
          <UiStat
            label="Языки"
            :value="instructor.languages?.length || 0"
            :hint="(instructor.languages || []).map((l) => languageMap[l] || l).join(', ')"
            :icon="GlobeIcon"
            tone="info"
          />
        </div>
      </div>

      <!-- Вкладки через UiTabs -->
      <UiTabs v-model="activeTab" :tabs="availableTabs" />

      <!-- Содержимое вкладок -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <!-- Основная область (8 колонок) -->
        <div class="space-y-4 lg:col-span-8">
          <!-- Вкладка «Профиль и Квалификация» -->
          <div v-show="activeTab === 'info'" class="space-y-4">
            <!-- Данные инструктора -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <UserIcon class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Данные инструктора</h3>
              </div>
              <div class="divide-y divide-gray-100 dark:divide-gray-800">
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Дата рождения</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(instructor.birthDate) }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Паспортные данные</span>
                  <!-- Паспорт: маска + показать + копировать -->
                  <UiSensitiveValue :value="instructor.passportData" :visible-tail="4" class="text-gray-800 dark:text-gray-200" />
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">ФИО на русском</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ instructor.full_name_ru || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Сокращенное ФИО (узб.)</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ instructor.short_name_uz || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Сокращенное ФИО (рус.)</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ instructor.short_name_ru || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Учёная степень</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ instructor.academic_degree || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Учёное звание</span>
                  <span class="text-right text-sm font-medium text-gray-800 dark:text-gray-200">{{ instructor.academic_rank || '—' }}</span>
                </div>
                <div class="flex items-center justify-between px-4 py-2.5">
                  <span class="w-40 shrink-0 text-sm text-gray-500 dark:text-gray-400">Языки</span>
                  <div class="flex flex-wrap justify-end gap-1">
                    <span v-if="!instructor.languages?.length" class="text-sm text-gray-400">—</span>
                    <span
                      v-for="lang in instructor.languages"
                      :key="lang"
                      class="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-300"
                    >{{ languageMap[lang] || lang }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Образование -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <SchoolIcon class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Образование</h3>
              </div>
              <div
                v-if="!instructor.education_history?.length && !instructor.education && !instructor.university"
                class="px-4 py-6 text-center text-sm text-gray-400"
              >
                Сведения об образовании не указаны
              </div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="(edu, index) in ((instructor.education_history?.length ? instructor.education_history : [{ education: instructor.education, university: instructor.university, specialty: instructor.specialty, diploma_file_ids: instructor.diploma_file_ids }]) as any[])"
                  :key="index"
                  class="px-4 py-3"
                >
                  <div class="mb-1 flex items-start justify-between gap-3">
                    <div class="flex min-w-0 items-start gap-2">
                      <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <SchoolIcon class="h-3.5 w-3.5" />
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">{{ edu.university || '—' }}</p>
                        <p v-if="edu.education" class="mt-0.5 text-xs font-medium text-primary">{{ edu.education }}</p>
                      </div>
                    </div>
                    <span v-if="edu.year_start || edu.year_end || edu.date_start || edu.date_end" class="shrink-0 whitespace-nowrap text-xs text-gray-500">
                      {{ edu.year_start || (edu.date_start ? new Date(edu.date_start).getFullYear() : '?') }} – {{ edu.year_end || (edu.date_end ? new Date(edu.date_end).getFullYear() : '?') }}
                    </span>
                  </div>
                  <div class="ml-8 flex items-center justify-between gap-2">
                    <span class="truncate text-xs text-gray-500">{{ edu.specialty || '' }}</span>
                    <span v-if="edu.diploma_series || edu.diploma_number" class="shrink-0 whitespace-nowrap text-xs text-gray-400">
                      Диплом: {{ [edu.diploma_series, edu.diploma_number].filter(Boolean).join(' ') }}
                    </span>
                  </div>
                  <div v-if="edu.diploma_file_ids?.length" class="ml-8 mt-2 flex flex-wrap gap-1.5">
                    <div
                      v-for="fileId in edu.diploma_file_ids"
                      :key="fileId"
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 transition-colors hover:border-primary/30 hover:bg-primary/5 dark:border-gray-700 dark:bg-white/[0.04]"
                      @click="allEducationFilesMap[fileId] && previewFile(fileId, allEducationFilesMap[fileId].filename)"
                    >
                      <FileTextIcon class="h-3 w-3 text-primary" />
                      <span class="text-xs text-gray-600 dark:text-gray-300">{{ allEducationFilesMap[fileId]?.filename || 'Документ' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Опыт работы -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <BookOpenIcon class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Опыт работы</h3>
              </div>
              <div v-if="!instructor.work_experience?.length" class="px-4 py-6 text-center text-sm text-gray-400">Опыт работы не указан</div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="(exp, index) in instructor.work_experience"
                  :key="index"
                  class="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{{ exp.employer }}</p>
                    <p class="mt-0.5 text-xs text-gray-500">{{ exp.position }}</p>
                  </div>
                  <span class="shrink-0 whitespace-nowrap text-xs text-gray-400">{{ exp.period }}</span>
                </div>
              </div>
            </div>

            <!-- Сертификаты -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <AwardIcon class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Сертификаты</h3>
              </div>
              <div v-if="!instructor.certificates?.length" class="px-4 py-6 text-center text-sm text-gray-400">Список сертификатов пуст</div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="(cert, index) in instructor.certificates"
                  :key="index"
                  class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                    <AwardIcon class="h-3.5 w-3.5 text-warning" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">{{ cert.name }}</p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2">
                      <span v-if="(cert as any).series || cert.certificate_number" class="text-xs text-gray-400">
                        № <span class="text-gray-600 dark:text-gray-300">{{ [(cert as any).series, cert.certificate_number].filter(Boolean).join(' ') }}</span>
                      </span>
                      <span v-if="cert.date" class="text-xs text-gray-400">{{ formatDate(cert.date) }}</span>
                    </div>
                  </div>
                  <!-- Действия файла: на touch видны всегда, на десктопе — при hover/фокусе -->
                  <div v-if="cert.fileId" class="flex shrink-0 items-center gap-1 transition-opacity lg:opacity-0 lg:focus-within:opacity-100 lg:group-hover:opacity-100">
                    <button type="button" title="Просмотр" class="p-1.5 text-gray-400 transition-colors hover:text-primary" @click="previewFile(cert.fileId, cert.name)"><EyeIcon class="h-4 w-4" /></button>
                    <button type="button" title="Скачать" class="p-1.5 text-gray-400 transition-colors hover:text-success" @click="downloadFile(cert.fileId, cert.name)"><DownloadIcon class="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Сертификаты аттестации — выдаются автоматически после сдачи -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <ShieldCheckIcon class="h-4 w-4 text-gray-400" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Сертификаты аттестации</h3>
              </div>
              <div v-if="!attestationCertificates.length" class="px-4 py-6 text-center text-sm text-gray-400">
                Сертификаты аттестации ещё не выданы
              </div>
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
                <div
                  v-for="cert in attestationCertificates"
                  :key="cert.id"
                  class="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10">
                    <AwardIcon class="h-3.5 w-3.5 text-success" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium leading-tight text-gray-900 dark:text-gray-100">{{ cert.templateName || "Сертификат" }}</p>
                    <div class="mt-0.5 flex flex-wrap items-center gap-2">
                      <span class="text-xs text-gray-400">№ <span class="text-gray-600 dark:text-gray-300">{{ cert.certificateNumber }}</span></span>
                      <span class="text-xs text-gray-400">{{ formatDate(cert.issueDate) }}</span>
                    </div>
                  </div>
                  <a
                    v-if="cert.id"
                    :href="`/api/certificates/download/${cert.id}`"
                    target="_blank"
                    title="Скачать"
                    class="shrink-0 p-1.5 text-gray-400 transition-colors hover:text-success lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100"
                  >
                    <DownloadIcon class="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Вкладка «Отчётность и Часы» -->
          <div v-show="activeTab === 'hours'">
            <InstructorsHoursStats
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="hoursStatsRef"
            />
          </div>

          <!-- Вкладка «История дисциплин» -->
          <div v-show="activeTab === 'history'">
            <InstructorsCourseHistory
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="courseHistoryRef"
            />
          </div>

          <!-- Вкладка «Расписание» -->
          <div v-show="activeTab === 'schedule'">
            <InstructorsScheduleDownload
              v-if="instructor"
              :instructor-id="instructor.id"
              :initial-load="false"
              ref="scheduleDownloadRef"
            />
          </div>
        </div>

        <!-- Боковая колонка (4 колонки) -->
        <div class="space-y-4 lg:col-span-4">
          <!-- Трудоустройство -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <CalendarIcon class="h-4 w-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Трудоустройство</h4>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div class="flex items-center justify-between px-4 py-2.5">
                <span class="text-sm text-gray-500 dark:text-gray-400">Дата приёма</span>
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ formatDate(instructor.hireDate) }}</span>
              </div>
              <div class="px-4 py-2.5">
                <span class="mb-1 block text-sm text-gray-500 dark:text-gray-400">Контрактные данные</span>
                <span class="text-sm font-medium leading-snug text-gray-700 dark:text-gray-300">{{ instructor.contractInfo || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Документы -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <FileTextIcon class="h-4 w-4 text-gray-400" />
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Документы</h4>
            </div>
            <div v-if="!additionalFilesList.length" class="px-4 py-5 text-center text-sm text-gray-400">Нет дополнительных файлов</div>
            <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="file in additionalFilesList"
                :key="file.uuid"
                class="group flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <FileTextIcon class="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <span class="truncate text-sm text-gray-700 dark:text-gray-300">{{ file.filename }}</span>
                </div>
                <!-- Действия файла: видны всегда на touch, при hover/фокусе — на десктопе -->
                <div class="flex shrink-0 items-center gap-0.5 transition-opacity lg:opacity-0 lg:focus-within:opacity-100 lg:group-hover:opacity-100">
                  <button type="button" title="Просмотр" class="p-1.5 text-gray-400 transition-colors hover:text-primary" @click="previewFile(file.uuid, file.filename)">
                    <EyeIcon class="h-4 w-4" />
                  </button>
                  <button type="button" title="Скачать" class="p-1.5 text-gray-400 transition-colors hover:text-success" @click="downloadFile(file.uuid, file.filename)">
                    <DownloadIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна (логика без изменений) -->
    <UsersInstructorFormModal
      v-if="isEditModalOpen && instructor"
      :instructor="instructor"
      @close="isEditModalOpen = false"
      @saved="loadInstructor"
    />

    <!-- Подтверждение удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление инструктора"
      message="Вы уверены, что хотите удалить этого инструктора? Это действие может повлиять на связанные курсы и расписание."
      :item-name="instructor?.fullName"
      warning="Это действие нельзя отменить."
      :loading="isDeleting"
      loading-text="Удаление…"
      @confirm="confirmDelete"
      @cancel="isDeleteModalOpen = false"
    />

    <!-- Окно просмотра документа -->
    <UiModal
      :is-open="showPreviewModal"
      :title="previewingFileName"
      size="xl"
      @close="closePreview"
    >
      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closePreview">Закрыть</UiButton>
          <UiButton
            v-if="instructor && previewingFileId"
            variant="primary"
            class="gap-2"
            @click="downloadFile(previewingFileId, previewingFileName)"
          >
            <DownloadIcon class="h-4 w-4" /> Скачать
          </UiButton>
        </div>
      </template>

      <div v-if="loadingPreview" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <p class="mt-3 text-sm text-gray-500">Загрузка документа...</p>
        </div>
      </div>
      <div v-else-if="previewError" class="py-12 text-center">
        <AlertCircleIcon class="mx-auto mb-4 h-10 w-10 text-danger" />
        <p class="text-danger">{{ previewError }}</p>
      </div>
      <div v-else-if="previewUrl" class="w-full" style="height: 70vh">
        <iframe :src="previewUrl" class="h-full w-full rounded-xl border-0" title="Document Preview"></iframe>
      </div>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import type { Instructor, UpdateInstructorInput } from "~/types/instructor";
import {
  ArrowLeft,
  User as UserIcon,
  Clock as ClockIcon,
  History as HistoryIcon,
  AlertCircle as AlertCircleIcon,
  GraduationCap as GraduationCapIcon,
  Calendar as CalendarIcon,
  Check as CheckIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Settings as SettingsIcon,
  Trash2 as Trash2Icon,
  Award as AwardIcon,
  School as SchoolIcon,
  FileText as FileTextIcon,
  Globe as GlobeIcon,
  Plus as PlusIcon,
  FileDown as FileDownIcon,
  Eye as EyeIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  BookOpen as BookOpenIcon,
  ShieldCheck as ShieldCheckIcon,
} from "lucide-vue-next";
import InstructorsHoursStats from "~/components/instructors/HoursStats.vue";
import InstructorsCourseHistory from "~/components/instructors/CourseHistory.vue";
import InstructorsScheduleDownload from "~/components/instructors/ScheduleDownload.vue";
import UsersInstructorFormModal from "~/components/users/InstructorFormModal.vue";
import { usePDFExport } from "~/composables/usePDFExport"; // Will need to implement this

// Route and Auth
const route = useRoute();
const router = useRouter();
const instructorId = route.params.id as string;
const { authFetch } = useAuthFetch();
const notification = useNotification();
const { canEditInstructors, canDeleteInstructors } = usePermissions();
const { getFilesByUuids } = useFileManager();

const languageMap: Record<string, string> = {
  uz: "Узбекский",
  ru: "Русский",
  en: "Английский",
  de: "Немецкий",
};

// State
const instructor = ref<Instructor | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isDeleting = ref(false);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);

// Document Preview State
const showPreviewModal = ref(false);
const previewUrl = ref("");
const loadingPreview = ref(false);
const previewError = ref("");
const previewingFileName = ref("");
const previewingFileId = ref("");

// Файлы для предпросмотра
const additionalFilesList = ref<any[]>([]);
const allEducationFilesMap = ref<Record<string, any>>({});

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Профиль и Квалификация", icon: UserIcon },
  { id: "hours", label: "Отчётность и Часы", icon: ClockIcon },
  { id: "history", label: "История Дисциплин", icon: HistoryIcon },
  { id: "schedule", label: "Расписание", icon: CalendarIcon },
];

// Меню «⋯» в шапке: удаление отделено в группу «Опасные» (показывается только при canDeleteInstructors)
const menuGroups = [
  {
    label: "Опасные",
    items: [{ key: "delete", label: "Удалить инструктора", icon: Trash2Icon, danger: true }],
  },
];
// Пункт меню открывает прежнее подтверждение удаления (UiConfirmModal)
const onMenuSelect = (key: string) => {
  if (key === "delete") isDeleteModalOpen.value = true;
};

// Computed
const experienceText = computed(() => {
  if (!instructor.value?.hireDate) return "—";
  const hireDate = new Date(instructor.value.hireDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) return `${diffDays} дн.`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} мес.`;
  const diffYears = Math.floor(diffMonths / 12);
  const remainingMonths = diffMonths % 12;
  return `${diffYears} г. ${remainingMonths} мес.`;
});

// Methods
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const previewFile = async (fileId: string, fileName: string = "Документ") => {
  try {
    previewingFileName.value = fileName;
    previewingFileId.value = fileId;
    showPreviewModal.value = true;
    loadingPreview.value = true;
    previewError.value = "";
    previewUrl.value = "";

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      previewError.value = "Ошибка авторизации";
      loadingPreview.value = false;
      return;
    }

    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    previewUrl.value = window.URL.createObjectURL(blob);
  } catch (error) {
    console.error("[previewFile] Error:", error);
    previewError.value = "Ошибка при загрузке документа";
  } finally {
    loadingPreview.value = false;
  }
};

const downloadFile = async (fileId: string, fileName: string = "document") => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!token) {
      notification.error("Ошибка авторизации");
      return;
    }

    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("[downloadFile] Error:", error);
    notification.error("Ошибка при скачивании файла");
  }
};

const closePreview = () => {
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
  }
  showPreviewModal.value = false;
  previewUrl.value = "";
  previewingFileName.value = "";
};

const fetchFileMetadata = async () => {
  if (!instructor.value) return;

  const educationFileIds =
    instructor.value.education_history?.flatMap(
      (edu) => edu.diploma_file_ids || [],
    ) || [];
  const legacyDiplomaIds = instructor.value.diploma_file_ids || [];

  const allUuids = [
    ...educationFileIds,
    ...legacyDiplomaIds,
    ...(instructor.value.additional_files || []),
    ...((instructor.value.certificates
      ?.map((c) => c.fileId)
      .filter(Boolean) as string[]) || []),
  ];

  if (allUuids.length === 0) return;

  try {
    const files = await getFilesByUuids(allUuids);

    // Map education files
    files.forEach((f) => {
      if (
        educationFileIds.includes(f.uuid) ||
        legacyDiplomaIds.includes(f.uuid)
      ) {
        allEducationFilesMap.value[f.uuid] = f;
      }
    });

    additionalFilesList.value = files.filter((f) =>
      instructor.value?.additional_files?.includes(f.uuid),
    );
  } catch (error) {
    console.error("Error fetching file metadata:", error);
  }
};

const attestationCertificates = ref<any[]>([]);

const loadAttestationCertificates = async () => {
  try {
    const res = await authFetch<{ success: boolean; certificates: any[] }>(
      `/api/instructors/${instructorId}/certificates`,
    );
    if (res.success) attestationCertificates.value = res.certificates || [];
  } catch (err) {
    console.error("Error loading attestation certificates:", err);
  }
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
      fetchFileMetadata();
      loadAttestationCertificates();
    } else {
      error.value = "Не удалось загрузить данные инструктора";
    }
  } catch (err: any) {
    error.value = err.message || "Ошибка загрузки";
  } finally {
    loading.value = false;
  }
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
    isDeleteModalOpen.value = false;
  }
};

const exportCertificate = async () => {
  if (!instructor.value) return;
  notification.info("Подготовка справки к экспорту...");

  try {
    const { exportInstructorProfile } = usePDFExport();
    await exportInstructorProfile(instructor.value);
    notification.success("Справка успешно сформирована");
  } catch (err) {
    console.error("Export error:", err);
    notification.error("Ошибка при генерации PDF");
  }
};

// Refs for child components
const hoursStatsRef = ref<any>(null);
const courseHistoryRef = ref<any>(null);
const scheduleDownloadRef = ref<any>(null);

// Trigger updates when tab changes
watch(activeTab, (newTab) => {
  if (newTab === "hours") {
    setTimeout(() => hoursStatsRef.value?.load?.(), 100);
  } else if (newTab === "history") {
    setTimeout(() => courseHistoryRef.value?.load?.(), 100);
  } else if (newTab === "schedule") {
    setTimeout(() => scheduleDownloadRef.value?.load?.(), 100);
  }
});

// Lifecycle
onMounted(() => {
  loadInstructor();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>
