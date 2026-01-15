<!-- Блок "Мои курсы" для вставки в app/pages/students/[id].vue -->
<!-- Вставить ПОСЛЕ блока "Сертификаты" и ПЕРЕД "<!-- Модальные окна -->" -->

        <!-- Мои курсы -->
        <div
          class="bg-white dark:bg-boxdark rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
        >
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div
                class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-primary"
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
              </div>
              <div>
                <h2 class="text-xl font-bold text-black dark:text-white">
                  Мои курсы
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего: {{ studentCourses.length }}
                </p>
              </div>
            </div>
          </div>

          <!-- Состояние загрузки -->
          <div v-if="coursesLoading" class="flex justify-center items-center py-12">
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
            ></div>
          </div>

          <!-- Список курсов -->
          <div v-else-if="studentCourses.length > 0" class="space-y-4">
            <!-- Активные курсы -->
            <div v-if="activeCourses.length > 0">
              <h3 class="text-lg font-semibold text-black dark:text-white mb-3">
                Активные курсы
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="course in activeCourses"
                  :key="course.group_id"
                  class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-transparent"
                >
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <div class="flex-1">
                      <h4 class="font-semibold text-black dark:text-white mb-1">
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
                        class="h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-500"
                        :style="{ width: `${course.progress}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Детали -->
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Начало:</span>
                      <span class="ml-2 text-black dark:text-white">{{
                        formatShortDate(course.start_date)
                      }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Окончание:</span>
                      <span class="ml-2 text-black dark:text-white">{{
                        formatShortDate(course.end_date)
                      }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Занятий:</span>
                      <span class="ml-2 font-medium text-black dark:text-white"
                        >{{ course.attended_lessons }}/{{ course.total_lessons }}</span
                      >
                    </div>
                    <div v-if="course.teacher_name">
                      <span class="text-gray-500 dark:text-gray-400">Преподаватель:</span>
                      <span class="ml-2 text-black dark:text-white">{{
                        course.teacher_name
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Завершенные курсы -->
            <div v-if="completedCourses.length > 0" class="mt-6">
              <h3 class="text-lg font-semibold text-black dark:text-white mb-3">
                Завершенные курсы
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="course in completedCourses"
                  :key="course.group_id"
                  class="border border-gray-200 dark:border-strokedark rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                >
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <div class="flex-1">
                      <h4 class="font-semibold text-black dark:text-white mb-1">
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

                  <!-- Детали -->
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Начало:</span>
                      <span class="ml-2 text-black dark:text-white">{{
                        formatShortDate(course.start_date)
                      }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Окончание:</span>
                      <span class="ml-2 text-black dark:text-white">{{
                        formatShortDate(course.end_date)
                      }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Занятий:</span>
                      <span class="ml-2 font-medium text-black dark:text-white"
                        >{{ course.attended_lessons }}/{{ course.total_lessons }}</span
                      >
                    </div>
                    <div>
                      <span class="text-gray-500 dark:text-gray-400">Посещаемость:</span>
                      <span class="ml-2 font-medium text-black dark:text-white"
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
