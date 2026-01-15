<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Навигация назад -->
    <div class="mb-6">
      <NuxtLink
        to="/database"
        class="inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ArrowLeft class="h-4 w-4" />
        Назад к списку
      </NuxtLink>
    </div>

    <!-- Состояние загрузки -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
        ></div>
        <p class="text-gray-600 dark:text-gray-400">
          Загрузка данных студента...
        </p>
      </div>
    </div>

    <!-- Ошибка -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger/30 bg-danger/5 p-8 text-center"
    >
      <AlertCircle class="mx-auto h-12 w-12 text-danger" />
      <h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        Ошибка загрузки
      </h3>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        {{ error }}
      </p>
      <UiButton variant="primary" class="mt-4" @click="fetchStudent">
        Попробовать снова
      </UiButton>
    </div>

    <!-- Карточка студента -->
    <template v-else-if="student">
      <!-- Header с градиентом -->
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
                  {{ getInitials(student.fullName) }}
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
                {{ student.fullName }}
              </h1>
              <p class="text-lg text-gray-600 dark:text-gray-400">
                {{ student.position }}
              </p>
            </div>

            <!-- Кнопки действий -->
            <div
              class="flex gap-3 pb-2 w-full sm:w-auto justify-center sm:justify-end"
            >
              <UiButton
                v-if="canEditStudents"
                variant="primary"
                @click="openEditModal"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Редактировать
              </UiButton>
              <UiButton
                v-if="canDeleteStudents"
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
            <!-- Личные данные -->
            <div
              class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
            >
              <h3
                class="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
              >
                Личные данные
              </h3>
              <div class="space-y-3">
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    ПИНФЛ
                  </p>
                  <div class="flex items-center gap-2">
                    <p
                      class="font-medium text-gray-900 dark:text-white font-mono flex-1"
                    >
                      {{ student.pinfl }}
                    </p>
                    <button
                      @click="copyToClipboard(student.pinfl)"
                      class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Копировать"
                    >
                      <svg
                        class="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Дата регистрации
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatDate(student.created_at) }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Последнее обновление
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ formatDate(student.updated_at) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Место работы -->
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
                    Организация
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ student.organization }}
                  </p>
                </div>
                <div
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Должность
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ student.position }}
                  </p>
                </div>
                <div
                  v-if="student.department"
                  class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <p class="mb-1 text-sm text-gray-600 dark:text-gray-400">
                    Служба/Отдел
                  </p>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ student.department }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'courses'">
          <div
            class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
          >
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-black dark:text-white">
                  Курсы слушателя
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего: {{ studentCourses.length }}
                </p>
              </div>
            </div>

            <!-- Состояние загрузки -->
            <div
              v-if="coursesLoading"
              class="flex justify-center items-center py-12"
            >
              <div
                class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
              ></div>
            </div>

            <!-- Список курсов -->
            <div v-else-if="studentCourses.length > 0" class="space-y-4">
              <!-- Активные курсы -->
              <div v-if="activeCourses.length > 0">
                <h3
                  class="text-lg font-semibold text-black dark:text-white mb-3"
                >
                  Активные курсы
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="course in activeCourses"
                    :key="course.group_id"
                    class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer bg-linear-to-br from-primary/5 to-transparent"
                    @click="openCourseDetailModal(course)"
                  >
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <h4
                          class="font-semibold text-black dark:text-white mb-1"
                        >
                          {{ course.course_name }}
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Группа: {{ course.group_name }}
                        </p>
                      </div>
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success"
                      >
                        <span class="h-2 w-2 rounded-full bg-success"></span>
                        Активен
                      </span>
                    </div>

                    <!-- Прогресс -->
                    <div class="mb-3">
                      <div class="flex justify-between items-center mb-1">
                        <span class="text-xs text-gray-600 dark:text-gray-400"
                          >Прогресс</span
                        >
                        <span class="text-xs font-medium text-primary"
                          >{{ course.progress }}%</span
                        >
                      </div>
                      <div
                        class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                      >
                        <div
                          class="h-2 rounded-full bg-linear-to-r from-primary to-purple-500 transition-all duration-500"
                          :style="{ width: `${course.progress}%` }"
                        ></div>
                      </div>
                    </div>

                    <!-- Детали -->
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Начало:</span
                        >
                        <span class="ml-2 text-black dark:text-white">{{
                          formatShortDate(course.start_date)
                        }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Окончание:</span
                        >
                        <span class="ml-2 text-black dark:text-white">{{
                          formatShortDate(course.end_date)
                        }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Занятий:</span
                        >
                        <span
                          class="ml-2 font-medium text-black dark:text-white"
                          >{{ course.attended_lessons }}/{{
                            course.total_lessons
                          }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Завершенные курсы -->
              <div v-if="completedCourses.length > 0" class="mt-6">
                <h3
                  class="text-lg font-semibold text-black dark:text-white mb-3"
                >
                  Завершенные курсы
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="course in completedCourses"
                    :key="course.group_id"
                    class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                    @click="openCourseDetailModal(course)"
                  >
                    <div class="flex items-start justify-between gap-4 mb-3">
                      <div class="flex-1">
                        <h4
                          class="font-semibold text-black dark:text-white mb-1"
                        >
                          {{ course.course_name }}
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Группа: {{ course.group_name }}
                        </p>
                      </div>
                      <span
                        class="inline-flex items-center gap-1.5 rounded-full bg-gray-200 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        <svg
                          class="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Завершен
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Начало:</span
                        >
                        <span class="ml-2 text-black dark:text-white">{{
                          formatShortDate(course.start_date)
                        }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Окончание:</span
                        >
                        <span class="ml-2 text-black dark:text-white">{{
                          formatShortDate(course.end_date)
                        }}</span>
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Посещаемость:</span
                        >
                        <span
                          class="ml-2 font-medium text-black dark:text-white"
                          >{{ course.progress }}%</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Пустое состояние -->
            <div v-else class="text-center py-12">
              <svg
                class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p class="text-gray-500 dark:text-gray-400 text-lg">
                У студента пока нет курсов
              </p>
            </div>
          </div>
        </div>

        <div v-show="activeTab === 'certificates'">
          <div
            class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6"
          >
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-black dark:text-white">
                  Сертификаты
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего: {{ student.certificates.length }}
                </p>
              </div>
              <UiButton
                variant="primary"
                @click="openCertificatesModal"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Управление сертификатами
              </UiButton>
            </div>

            <!-- Список сертификатов -->
            <div v-if="student.certificates.length > 0" class="space-y-4">
              <div
                v-for="certificate in student.certificates"
                :key="certificate.id"
                class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer"
                @click="openCertificateDetailModal(certificate)"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <h3 class="font-semibold text-black dark:text-white mb-2">
                      {{ certificate.courseName }}
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Номер:</span
                        >
                        <span
                          class="ml-2 font-mono text-black dark:text-white"
                          >{{ certificate.certificateNumber }}</span
                        >
                      </div>
                      <div>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Дата выдачи:</span
                        >
                        <span class="ml-2 text-black dark:text-white">{{
                          formatDate(certificate.issueDate)
                        }}</span>
                      </div>
                      <div v-if="certificate.expiryDate">
                        <span class="text-gray-500 dark:text-gray-400"
                          >Срок действия:</span
                        >
                        <span
                          class="ml-2 font-medium"
                          :class="getExpiryStatusClass(certificate.expiryDate)"
                        >
                          {{ formatDate(certificate.expiryDate) }}
                          <span
                            v-if="
                              getExpiryStatus(certificate.expiryDate) !==
                              'valid'
                            "
                            class="ml-1 text-xs px-1.5 py-0.5 rounded-full"
                            :class="getExpiryBadgeClass(certificate.expiryDate)"
                          >
                            {{ getExpiryLabel(certificate.expiryDate) }}
                          </span>
                        </span>
                      </div>
                      <div v-else>
                        <span class="text-gray-500 dark:text-gray-400"
                          >Срок действия:</span
                        >
                        <span class="ml-2 text-success font-medium"
                          >Бессрочный</span
                        >
                      </div>
                    </div>
                  </div>
                  <div v-if="certificate.fileUrl" class="shrink-0">
                    <a
                      v-if="certificate.id"
                      :href="`/api/certificates/download/${certificate.id}`"
                      target="_blank"
                      class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      @click.stop
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
                      Скачать
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Пустое состояние -->
            <div v-else class="text-center py-12">
              <svg
                class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
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
              <p class="text-gray-500 dark:text-gray-400 text-lg">
                У студента пока нет сертификатов
              </p>
              <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Нажмите "Управление сертификатами" чтобы добавить
              </p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Модальные окна -->
    <DatabaseStudentFormModal
      v-if="isEditModalOpen && student"
      :student="student"
      :is-open="isEditModalOpen"
      @close="closeEditModal"
      @submit="handleUpdate"
    />

    <DatabaseStudentCertificatesModal
      v-if="isCertificatesModalOpen && student"
      :student="student"
      :is-open="isCertificatesModalOpen"
      @close="closeCertificatesModal"
      @refresh="fetchStudent"
    />

    <!-- Модальное окно деталей сертификата (Read-only) -->
    <DatabaseCertificateDetailModal
      v-if="isCertificateDetailModalOpen && selectedCertificate"
      :certificate="certificateDetailData!"
      :is-open="isCertificateDetailModalOpen"
      @close="closeCertificateDetailModal"
    />

    <!-- Модальное окно деталей курса -->
    <DatabaseStudentCourseDetailModal
      v-if="isCourseDetailModalOpen && selectedCourse"
      :course="selectedCourse"
      :is-open="isCourseDetailModalOpen"
      @close="closeCourseDetailModal"
    />

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удаление студента"
      message="Вы уверены, что хотите удалить этого студента?"
      :item-name="student?.fullName"
      warning="Это действие нельзя отменить. Все данные студента будут удалены."
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type {
  Student,
  UpdateStudentData,
  StudentCertificate,
} from "~/types/student";
import { User, BookOpen, Award, ArrowLeft, AlertCircle } from "lucide-vue-next";

// Получаем ID студента из маршрута
const route = useRoute();
const router = useRouter();
const studentId = route.params.id as string;

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const notification = useNotification();

// Проверка прав доступа
const { canEditStudents, canDeleteStudents } = usePermissions();

// Состояние
const student = ref<Student | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const isEditModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const activeTab = ref("info");

const availableTabs = [
  { id: "info", label: "Информация", icon: User },
  { id: "courses", label: "Курсы", icon: BookOpen },
  { id: "certificates", label: "Сертификаты", icon: Award },
];

/**
 * Курсы слушателя
 */
interface CourseRecord {
  group_id: string;
  course_id: string;
  course_name: string;
  group_name: string;
  start_date: string;
  end_date: string;
  total_lessons: number;
  attended_lessons: number;
  progress: number;
  status: "active" | "completed" | "dropped";
  teacher_name: string | null;
  days_schedule?: { day: string; time: string }[];
  schedule_events?: any[];
}

const studentCourses = ref<CourseRecord[]>([]);
const coursesLoading = ref(false);

const isCourseDetailModalOpen = ref(false);
const selectedCourse = ref<CourseRecord | null>(null);

const activeCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "active")
);
const completedCourses = computed(() =>
  studentCourses.value.filter((c) => c.status === "completed")
);

const fetchStudentCourses = async () => {
  coursesLoading.value = true;
  try {
    // В реальном приложении здесь был бы API вызов
    // Например: const response = await authFetch(`/api/students/${studentId}/courses`);
    // Сейчас используем мок-данные или текущую реализацию если есть

    const response = await authFetch<{
      success: boolean;
      courses: CourseRecord[];
    }>(`/api/students/${studentId}/courses`);

    if (response.success) {
      studentCourses.value = response.courses;
    }
  } catch (err) {
    console.error("Failed to load courses:", err);
    // Не блокируем основной интерфейс ошибкой курсов
  } finally {
    coursesLoading.value = false;
  }
};

const openCourseDetailModal = (course: CourseRecord) => {
  selectedCourse.value = course;
  isCourseDetailModalOpen.value = true;
};

const closeCourseDetailModal = () => {
  isCourseDetailModalOpen.value = false;
  selectedCourse.value = null;
};

/**
 * Инициалы для аватара
 */
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Форматирование даты
const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatShortDate = (dateString?: string | Date) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
};

// Загрузка данных
const fetchStudent = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`
    );
    if (response.success) {
      student.value = response.student;
      // После успешной загрузки студента, грузим курсы
      fetchStudentCourses();
    } else {
      error.value = "Не удалось загрузить данные";
    }
  } catch (e: any) {
    error.value = e.message || "Ошибка соединения с сервером";
  } finally {
    loading.value = false;
  }
};

// Модальное окно редактирования
const openEditModal = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const handleUpdate = async (data: UpdateStudentData) => {
  try {
    const response = await authFetch<{ success: boolean; student: Student }>(
      `/api/students/${studentId}`,
      {
        method: "PUT",
        body: data,
      }
    );

    if (response.success) {
      student.value = response.student;
      closeEditModal();
      notification.success("Данные студента обновлены");
    }
  } catch (e) {
    console.error("Error updating student:", e);
    notification.error("Ошибка при обновлении данных");
  }
};

// Копирование в буфер
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  notification.success("Скопировано в буфер обмена");
};

// Удаление
const handleDelete = () => {
  isDeleteModalOpen.value = true;
};

const closeDeleteModal = () => {
  isDeleteModalOpen.value = false;
};

const confirmDelete = async () => {
  isDeleting.value = true;
  try {
    await authFetch(`/api/students/${studentId}`, {
      method: "DELETE",
    });
    router.push("/database");
    notification.success("Студент удален");
  } catch (e) {
    console.error("Error deleting student:", e);
    notification.error("Ошибка удаления");
  } finally {
    isDeleting.value = false;
    closeDeleteModal();
  }
};

// Сертификаты
const isCertificatesModalOpen = ref(false);
const isCertificateDetailModalOpen = ref(false);
const selectedCertificate = ref<StudentCertificate | null>(null);

const certificateDetailData = computed(() => {
  if (!selectedCertificate.value || !student.value) return null;
  return {
    ...selectedCertificate.value,
    studentName: student.value.fullName,
    studentId: student.value.id,
  };
});

const openCertificatesModal = () => {
  isCertificatesModalOpen.value = true;
};

const closeCertificatesModal = () => {
  isCertificatesModalOpen.value = false;
};

const openCertificateDetailModal = (cert: StudentCertificate) => {
  selectedCertificate.value = cert;
  isCertificateDetailModalOpen.value = true;
};

const closeCertificateDetailModal = () => {
  isCertificateDetailModalOpen.value = false;
  selectedCertificate.value = null;
};

// Хелперы для статусов сертификатов
const getExpiryStatus = (
  expiryDate?: string | Date | null
): "valid" | "expiring" | "expired" => {
  if (!expiryDate) return "valid";
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 30) return "expiring";
  return "valid";
};

const getExpiryStatusClass = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  switch (status) {
    case "expired":
      return "text-danger";
    case "expiring":
      return "text-warning";
    default:
      return "text-black dark:text-white";
  }
};

const getExpiryBadgeClass = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  switch (status) {
    case "expired":
      return "bg-danger/10 text-danger";
    case "expiring":
      return "bg-warning/10 text-warning";
    default:
      return "bg-success/10 text-success";
  }
};

const getExpiryLabel = (expiryDate?: string | Date | null) => {
  const status = getExpiryStatus(expiryDate);
  switch (status) {
    case "expired":
      return "Истек";
    case "expiring":
      return "Истекает скоро";
    default:
      return "Действителен";
  }
};

onMounted(() => {
  fetchStudent();
});
</script>
