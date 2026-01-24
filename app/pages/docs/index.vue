<template>
  <div class="p-4 max-w-7xl mx-auto">
    <!-- Заголовок страницы -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-3">Руководство пользователя АТЦ Платформы</h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        Пошаговое руководство по использованию всех функций и возможностей системы управления учебным процессом.
      </p>
    </div>

    <!-- Навигация по вкладкам -->
    <div class="mb-8 overflow-x-auto">
      <nav class="flex space-x-2 border-b border-gray-200 dark:border-gray-700 min-w-max pb-1" aria-label="Tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="currentTab = tab.id"
          :class="[
            'px-5 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 border-b-2 whitespace-nowrap',
            currentTab === tab.id
              ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
          ]"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Контент -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:p-8 min-h-[60vh]">
      
      <!-- ВКЛАДКА: Начало работы -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
        mode="out-in"
      >
        <div v-if="currentTab === 'start'" key="start" class="space-y-8">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Добро пожаловать в АТЦ Платформу</h2>
            <p class="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
              <strong>АТЦ Платформа</strong> — это комплексная система управления учебным процессом, которая автоматизирует работу учебного центра 
              и объединяет администраторов, менеджеров, преподавателей и студентов в единой информационной среде.
            </p>

            <!-- Роли -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div class="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/30">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <SettingsIcon class="w-6 h-6" />
                  </div>
                  <h3 class="font-bold text-blue-900 dark:text-blue-100">Администратор</h3>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">Полный контроль над системой: управление пользователями, настройками, шаблонами документов и мониторинг всех процессов.</p>
              </div>

              <div class="p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800/30">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <DocsIcon class="w-6 h-6" />
                  </div>
                  <h3 class="font-bold text-purple-900 dark:text-purple-100">Менеджер</h3>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">Управление учебными программами, создание групп, формирование расписания и контроль учебного процесса.</p>
              </div>

              <div class="p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <AcademicCapIcon class="w-6 h-6" />
                  </div>
                  <h3 class="font-bold text-emerald-900 dark:text-emerald-100">Преподаватель</h3>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">Ведение журнала посещаемости, выставление оценок, управление тестами и взаимодействие со студентами.</p>
              </div>

              <div class="p-5 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/30">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                    <UserCircleIcon class="w-6 h-6" />
                  </div>
                  <h3 class="font-bold text-orange-900 dark:text-orange-100">Студент</h3>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">Доступ к расписанию, материалам курса, прохождение тестов и получение сертификатов.</p>
              </div>
            </div>

            <!-- Первые шаги -->
            <div class="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-900/10 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <GridIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Первые шаги
              </h3>
              <ol class="space-y-4">
                <li class="flex items-start gap-4">
                  <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/30">1</span>
                  <span class="text-gray-700 dark:text-gray-300 pt-1"><strong class="text-gray-900 dark:text-white">Вход в систему:</strong> Используйте ваш Email и пароль для входа на страницу <code class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm font-mono">/ auth/signin</code></span>
                </li>
                <li class="flex items-start gap-4">
                  <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/30">2</span>
                  <span class="text-gray-700 dark:text-gray-300 pt-1"><strong class="text-gray-900 dark:text-white">Настройка профиля:</strong> После первого входа перейдите в "Профиль" (правый верхний угол) и обновите личные данные.</span>
                </li>
                <li class="flex items-start gap-4">
                  <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/30">3</span>
                  <span class="text-gray-700 dark:text-gray-300 pt-1"><strong class="text-gray-900 dark:text-white">Изучите интерфейс:</strong> Боковое меню содержит все разделы системы, доступные вашей роли.</span>
                </li>
                <li class="flex items-start gap-4">
                  <span class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/30">4</span>
                  <span class="text-gray-700 dark:text-gray-300 pt-1"><strong class="text-gray-900 dark:text-white">Обратитесь к документации:</strong> Используйте вкладки выше для изучения конкретных функций.</span>
                </li>
              </ol>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Учебные программы и группы -->
        <div v-else-if="currentTab === 'programs'" key="programs" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Управление учебными программами и группами</h2>
            
            <!-- Создание учебной программы -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                  <AcademicCapIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Шаг 1: Создание учебной программы</h3>
              </div>
              
              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Менеджер, Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">1.</span>
                  <div>
                    <p>Перейдите в раздел <strong>"Учебные программы"</strong> через боковое меню.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">2.</span>
                  <div>
                    <p>Нажмите кнопку <strong>"Создать программу"</strong>.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">3.</span>
                  <div>
                    <p>Заполните основную информацию:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Название программы (например: "Охрана труда для руководителей")</li>
                      <li>Код программы (например: "OT-RUK-2024")</li>
                      <li>Описание и цели обучения</li>
                      <li>Продолжительность (в часах)</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">4.</span>
                  <div>
                    <p>Добавьте <strong>дисциплины</strong> в программу:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Укажите название дисциплины</li>
                      <li>Количество часов (теория/практика)</li>
                      <li>Порядок изучения</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">5.</span>
                  <div>
                    <p>Привяжите <strong>тесты</strong> к дисциплинам (если требуется контроль знаний).</p>
                  </div>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Создание учебной группы -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                  <UserGroupIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Шаг 2: Создание учебной группы</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Менеджер, Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">1.</span>
                  <div>
                    <p>Перейдите в <strong>"Учебные группы"</strong> → <strong>"Создать группу"</strong>.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">2.</span>
                  <div>
                    <p>Выберите учебную программу из списка.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">3.</span>
                  <div>
                    <p>Укажите параметры группы:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Код группы (например: "OT-2024-001")</li>
                      <li>Дата начала и окончания обучения</li>
                      <li>Назначьте куратора и преподавателей</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">4.</span>
                  <div>
                    <p><strong>Обязательно:</strong> Загрузите PDF-отчет (приказ о создании группы).</p>
                    <div class="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-sm">
                      <p class="text-yellow-800 dark:text-yellow-200">⚠️ Без загрузки PDF-документа группа не будет создана.</p>
                    </div>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">5.</span>
                  <div>
                    <p>Добавьте студентов:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li><strong>Вручную:</strong> Через форму добавления студента</li>
                      <li><strong>Импорт Excel:</strong> Загрузите файл со списком студентов</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Расписание и занятия -->
        <div v-else-if="currentTab === 'schedule'" key="schedule" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Создание расписания и проведение занятий</h2>

            <!-- Создание расписания -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600">
                  <CalenderIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Создание занятия в расписании</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Преподаватель, Менеджер, Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">1.</span>
                  <div>
                    <p>Откройте <strong>"Расписание"</strong> в боковом меню.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">2.</span>
                  <div>
                    <p>Нажмите на нужную дату или кнопку <strong>"Создать событие"</strong>.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">3.</span>
                  <div>
                    <p>Заполните форму:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Выберите группу</li>
                      <li>Выберите дисциплину</li>
                      <li>Укажите дату и время (начало и окончание)</li>
                      <li>Выберите аудиторию (опционально)</li>
                      <li>Назначьте преподавателя</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">4.</span>
                  <div>
                    <p>Выберите <strong>тип занятия</strong>:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li><strong>Теория</strong> — лекционное занятие</li>
                      <li><strong>Практика</strong> — практическое занятие</li>
                      <li><strong>Проверка знаний</strong> — тестирование (требует выбора теста)</li>
                      <li><strong>Пересдача</strong> — дополнительное занятие для отстающих студентов</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">5.</span>
                  <div>
                    <p>Если выбран тип <strong>"Проверка знаний"</strong>:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Выберите тест из списка (тесты, привязанные к дисциплине)</li>
                      <li>Опционально переопределите время и проходной балл</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">6.</span>
                  <div>
                    <p>Сохраните событие. Оно появится в календаре и будет видно всем участникам группы.</p>
                  </div>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Отметка посещаемости -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                  <CheckIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Отметка посещаемости</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Преподаватель</p>
              </div>

              <div class="bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-yellow-600 p-4 mb-6">
                <p class="text-sm text-yellow-900 dark:text-yellow-200">
                  <strong>Важно:</strong> Посещаемость должна быть отмечена в течение <strong>24 часов</strong> после занятия. 
                  После этого срока требуется одобрение администратора.
                </p>
              </div>

              <h4 class="font-bold text-gray-900 dark:text-white mb-3">Сценарий 1: Отметка в срок (до 24 часов)</h4>
              <ol class="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">1.</span>
                  <p>Перейдите в <strong>"Группы"</strong> → выберите группу → <strong>"Журнал"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">2.</span>
                  <p>Выберите занятие из выпадающего списка.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">3.</span>
                  <p>Нажмите <strong>"Отметить всех"</strong> или отметьте каждого студента индивидуально.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">4.</span>
                  <p>Укажите количество часов и сохраните.</p>
                </li>
              </ol>

              <h4 class="font-bold text-gray-900 dark:text-white mb-3">Сценарий 2: Просроченная отметка (более 72 часов)</h4>
              <ol class="space-y-3 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-red-600">1.</span>
                  <p>Система покажет предупреждение: <strong>"Требуется одобрение администратора"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-red-600">2.</span>
                  <p>Нажмите <strong>"Отметить всех"</strong> → откроется модальное окно запроса.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-red-600">3.</span>
                  <p><strong>Обязательно</strong> укажите причину опоздания (минимум 10 символов).</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-red-600">4.</span>
                  <p>Отправьте запрос и дождитесь одобрения администратора.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-red-600">5.</span>
                  <p>После одобрения вы сможете отметить посещаемость.</p>
                </li>
              </ol>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Тестирование -->
        <div v-else-if="currentTab === 'testing'" key="testing" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Система тестирования</h2>

            <!-- Создание банка вопросов -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600">
                  <ClipboardCheckIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Шаг 1: Создание банка вопросов</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Менеджер, Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-purple-600">1.</span>
                  <div>
                    <p>Перейдите в <strong>"Банк тестирования"</strong> → <strong>"Банки вопросов"</strong>.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-purple-600">2.</span>
                  <div>
                    <p>Нажмите <strong>"Создать банк"</strong> и заполните:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Название (например: "Охрана труда - Базовый уровень")</li>
                      <li>Код (например: "OT-BASE")</li>
                      <li>Категория для группировки</li>
                      <li>Описание</li>
                    </ul>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-purple-600">3.</span>
                  <div>
                    <p>Добавьте вопросы:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li><strong>Вручную:</strong> Через форму создания вопроса</li>
                      <li><strong>Импорт Excel:</strong> Загрузите файл с вопросами</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Создание шаблона теста -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600">
                  <DocsIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Шаг 2: Создание шаблона теста</h3>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-indigo-600">1.</span>
                  <div>
                    <p>Перейдите в <strong>"Шаблоны тестов"</strong> → <strong>"Создать шаблон"</strong>.</p>
                  </div>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-indigo-600">2.</span>
                  <div>
                    <p>Настройте параметры теста:</p>
                    <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                      <li>Выберите банк вопросов</li>
                      <li>Режим вопросов: все / случайные N / вручную выбранные</li>
                      <li>Лимит времени (в минутах)</li>
                      <li>Проходной балл (в процентах, по умолчанию 60%)</li>
                      <li>Количество попыток</li>
                      <li>Перемешивать вопросы и варианты ответов</li>
                      <li>Антипрокторинг (блокировка переключения вкладок)</li>
                    </ul>
                  </div>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Прохождение теста студентом -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                  <DocsIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Прохождение теста (для студентов)</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Студент</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">1.</span>
                  <p>Перейдите в <strong>"Мои тесты"</strong> в боковом меню.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">2.</span>
                  <p>Найдите назначенный тест и нажмите <strong>"Начать тест"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">3.</span>
                  <p>Ознакомьтесь с информацией: количество вопросов, время, проходной балл.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">4.</span>
                  <p>Нажмите <strong>"Начать"</strong> — запустится таймер.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">5.</span>
                  <p>Отвечайте на вопросы. Ваши ответы автоматически сохраняются.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">6.</span>
                  <p>После ответа на все вопросы нажмите <strong>"Завершить тест"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">7.</span>
                  <p>Система автоматически подсчитает результат и запишет оценку в журнал.</p>
                </li>
              </ol>

              <div class="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <p class="text-sm text-red-900 dark:text-red-200">
                  <strong>⚠️ Внимание:</strong> Если включен антипрокторинг, переключение вкладок будет зафиксировано как нарушение.
                </p>
              </div>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Сертификаты -->
        <div v-else-if="currentTab === 'certificates'" key="certificates" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Управление сертификатами</h2>

            <!-- Создание шаблона -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center text-yellow-600">
                  <CertificateIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Создание шаблона сертификата</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">1.</span>
                  <p>Перейдите в <strong>"Шаблоны сертификатов"</strong> (раздел Администрирование).</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">2.</span>
                  <p>Нажмите <strong>"Создать шаблон"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">3.</span>
                  <p>Загрузите фоновое изображение сертификата (PNG/JPG).</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">4.</span>
                  <p>Используйте визуальный редактор для размещения полей:</p>
                  <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>ФИО студента</li>
                    <li>Название курса</li>
                    <li>Дата выдачи</li>
                    <li>Номер сертификата</li>
                    <li>QR-код для верификации</li>
                  </ul>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">5.</span>
                  <p>Настройте шрифты, размеры и выравнивание текста.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-yellow-600">6.</span>
                  <p>Сохраните шаблон.</p>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Выдача сертификатов -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600">
                  <CertificateIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Выдача сертификатов студентам</h3>
              </div>

              <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-4">
                <p class="text-sm text-blue-900 dark:text-blue-200"><strong>Роль:</strong> Менеджер, Администратор</p>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">1.</span>
                  <p>Перейдите в <strong>"Группы"</strong> → выберите завершенную группу.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">2.</span>
                  <p>Откройте вкладку <strong>"Сертификаты"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">3.</span>
                  <p>Выберите студентов, которые успешно завершили обучение.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">4.</span>
                  <p>Нажмите <strong>"Выдать сертификаты"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">5.</span>
                  <p>Выберите шаблон сертификата.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-green-600">6.</span>
                  <p>Система автоматически:</p>
                  <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Сгенерирует уникальный номер</li>
                    <li>Создаст QR-код для верификации</li>
                    <li>Сформирует PDF-файл</li>
                    <li>Запишет сертификат в реестр</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Telegram-бот -->
        <div v-else-if="currentTab === 'telegram'" key="telegram" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Telegram-бот для представителей организаций</h2>

            <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-600 p-4 mb-6">
              <p class="text-sm text-blue-900 dark:text-blue-200">
                Telegram-бот позволяет представителям организаций получать информацию о своих студентах, расписании и сертификатах без входа в веб-интерфейс.
              </p>
            </div>

            <!-- Регистрация -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                  <PlusIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Регистрация в боте</h3>
              </div>

              <ol class="space-y-4 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">1.</span>
                  <p>Найдите бот в Telegram и нажмите <strong>/start</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">2.</span>
                  <p>Введите ваше ФИО (минимум 3 символа).</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">3.</span>
                  <p>Отправьте номер телефона (формат: +998XXXXXXXXX).</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">4.</span>
                  <p>Выберите вашу организацию из списка или введите название новой.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">5.</span>
                  <p>Дождитесь одобрения заявки администратором.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-blue-600">6.</span>
                  <p>После одобрения вам станут доступны команды бота.</p>
                </li>
              </ol>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Команды бота -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600">
                  <DocsIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Доступные команды</h3>
              </div>

              <div class="grid gap-4">
                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-bold text-gray-900 dark:text-white mb-2">/students</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Список всех студентов вашей организации с группировкой по курсам и группам.</p>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-bold text-gray-900 dark:text-white mb-2">/schedule</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Расписание занятий для студентов вашей организации с указанием даты, времени, преподавателя и аудитории.</p>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-bold text-gray-900 dark:text-white mb-2">/certificates</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Список выданных сертификатов с возможностью скачивания PDF-файлов.</p>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-bold text-gray-900 dark:text-white mb-2">/status</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Проверка статуса вашей заявки на регистрацию.</p>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 class="font-bold text-gray-900 dark:text-white mb-2">/help</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Справка по всем доступным командам.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- ВКЛАДКА: Администрирование -->
        <div v-else-if="currentTab === 'admin'" key="admin" class="space-y-10">
          <section>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Функции администратора</h2>

            <!-- Управление пользователями -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                  <UserGroupIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Управление пользователями</h3>
              </div>

              <p class="text-gray-700 dark:text-gray-300 mb-4">
                Раздел <strong>"Пользователи"</strong> позволяет управлять всеми учетными записями в системе.
              </p>

              <div class="space-y-4 text-gray-700 dark:text-gray-300">
                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 class="font-semibold mb-2">Создание пользователя</h4>
                  <ul class="list-disc pl-6 space-y-1 text-sm">
                    <li>Укажите Email, ФИО, пароль</li>
                    <li>Назначьте роль: Администратор, Менеджер, Преподаватель, Студент</li>
                    <li>Установите права доступа</li>
                  </ul>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 class="font-semibold mb-2">Блокировка пользователя</h4>
                  <p class="text-sm">Временная или постоянная блокировка доступа к системе с указанием причины.</p>
                </div>

                <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <h4 class="font-semibold mb-2">Сброс пароля</h4>
                  <p class="text-sm">Возможность сбросить пароль пользователя и отправить новый на Email.</p>
                </div>
              </div>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Журнал действий -->
            <div class="mb-10">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300">
                  <ClipboardCheckIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Журнал действий (Activity Logs)</h3>
              </div>

              <p class="text-gray-700 dark:text-gray-300 mb-4">
                Полный аудит всех действий пользователей в системе для обеспечения безопасности и контроля.
              </p>

              <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p><strong>Отслеживаемые события:</strong></p>
                <ul class="list-disc pl-6 space-y-1">
                  <li>Вход и выход из системы</li>
                  <li>Создание, изменение и удаление записей</li>
                  <li>Изменение настроек</li>
                  <li>Выдача сертификатов</li>
                  <li>Изменение прав доступа</li>
                </ul>
              </div>
            </div>

            <hr class="border-gray-200 dark:border-gray-700 my-8" />

            <!-- Запросы на отметку -->
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600">
                  <CalenderIcon class="w-6 h-6" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Запросы на изменение посещаемости</h3>
              </div>

              <p class="text-gray-700 dark:text-gray-300 mb-4">
                Обработка запросов преподавателей на изменение посещаемости задним числом (более 72 часов после занятия).
              </p>

              <ol class="space-y-3 text-gray-700 dark:text-gray-300">
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">1.</span>
                  <p>Перейдите в <strong>"Запросы на отметку"</strong>.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">2.</span>
                  <p>Просмотрите список ожидающих запросов.</p>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">3.</span>
                  <p>Для каждого запроса отображается:</p>
                  <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li>Преподаватель, отправивший запрос</li>
                    <li>Занятие (дата, время, группа)</li>
                    <li>Причина опоздания</li>
                  </ul>
                </li>
                <li class="flex gap-3">
                  <span class="font-bold text-orange-600">4.</span>
                  <p>Примите решение:</p>
                  <ul class="list-disc pl-6 mt-2 space-y-1 text-sm">
                    <li><strong>Одобрить</strong> — преподаватель сможет отметить посещаемость</li>
                    <li><strong>Отклонить</strong> — запрос будет отклонен (можно указать причину)</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Import custom icons
import GridIcon from '~/components/icons/GridIcon.vue';
import AcademicCapIcon from '~/components/icons/AcademicCapIcon.vue';
import UserGroupIcon from '~/components/icons/UserGroupIcon.vue';
import CalenderIcon from '~/components/icons/CalenderIcon.vue';
import CheckIcon from '~/components/icons/CheckIcon.vue';
import ClipboardCheckIcon from '~/components/icons/ClipboardCheckIcon.vue';
import DocsIcon from '~/components/icons/DocsIcon.vue';
import CertificateIcon from '~/components/icons/CertificateIcon.vue';
import PlusIcon from '~/components/icons/PlusIcon.vue';
import SettingsIcon from '~/components/icons/SettingsIcon.vue';
import UserCircleIcon from '~/components/icons/UserCircleIcon.vue';

definePageMeta({
  title: 'Документация',
  layout: 'default'
})

useHead({
  title: 'Руководство пользователя - АТЦ Платформа'
})

const currentTab = ref('start');

const tabs = [
  { id: 'start', label: 'Начало работы' },
  { id: 'programs', label: 'Программы и группы' },
  { id: 'schedule', label: 'Расписание' },
  { id: 'testing', label: 'Тестирование' },
  { id: 'certificates', label: 'Сертификаты' },
  { id: 'telegram', label: 'Telegram-бот' },
  { id: 'admin', label: 'Администрирование' },
];
</script>

<style scoped>
/* Увеличиваем толщину обводки для иконок с stroke, чтобы они были лучше видны */
svg {
  stroke-width: 2;
}
</style>
