<template>
  <div
    class="flex flex-1 min-h-0 h-full w-full overflow-hidden bg-white dark:bg-slate-900 relative"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @paste="handlePaste"
  >
    <!-- Drag & Drop Overlay -->
    <div
      v-if="isDragging"
      class="absolute inset-0 z-50 bg-primary/15 backdrop-blur-xs border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center gap-3 pointer-events-none"
    >
      <div class="p-4 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg">
        <UploadCloud class="w-10 h-10 animate-bounce text-primary" />
      </div>
      <p class="font-bold text-base text-primary">
        Отпустите PDF-файл или скан документа здесь
      </p>
      <p class="text-xs text-slate-500">
        Поддерживаются PDF, PNG, JPG, WebP
      </p>
    </div>

    <!-- Двухпанельный Layout: Левая панель (Чат и ввод) / Правая панель (Сверка и выбор) -->
    <div class="flex w-full h-full min-h-0 overflow-hidden divide-x divide-slate-200 dark:divide-slate-800">
      
      <!-- ==================== ЛЕВАЯ ПАНЕЛЬ: ЧАТ И ВВОД (380px) ==================== -->
      <div class="w-[380px] lg:w-[420px] shrink-0 flex flex-col h-full min-h-0 bg-slate-50/50 dark:bg-slate-900/40">
        <!-- Шапка левой панели -->
        <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-slate-900 dark:text-white">
                ИИ-Ассистент зачисления
              </h4>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">
                Распознавание документов
              </p>
            </div>
          </div>

          <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Онлайн
          </span>
        </div>

        <!-- История переписки / Лента сообщений (скроллируемая область) -->
        <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <!-- Стартовая подсказка, если нет сообщений -->
          <div
            v-if="!messages.length"
            class="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/50 text-center space-y-2.5"
          >
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <FileText class="w-5 h-5" />
            </div>
            <h5 class="text-xs font-bold text-slate-900 dark:text-white">
              Как передать слушателей?
            </h5>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-left">
              1. Прикрепите <strong>PDF приказа</strong> или служебной записки.<br />
              2. Либо вставьте скриншот из буфера (<kbd class="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">Ctrl+V</kbd>).<br />
              3. Либо вставьте текст списка из Telegram или письма.
            </p>
          </div>

          <!-- Список сообщений -->
          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="flex flex-col"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <div
              :class="[
                'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-xs'
                  : msg.role === 'error'
                    ? 'bg-danger/10 border border-danger/20 text-danger rounded-bl-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-xs',
              ]"
            >
              <div v-if="msg.fileName" class="flex items-center gap-1.5 text-[11px] font-semibold opacity-90 mb-1">
                <Paperclip class="w-3 h-3" />
                <span class="truncate max-w-[200px]">{{ msg.fileName }}</span>
              </div>
              <p class="whitespace-pre-wrap">{{ msg.text }}</p>
            </div>
            <span class="text-[10px] text-slate-400 mt-1 px-1">
              {{ msg.role === 'user' ? 'Вы' : 'ИИ-Ассистент' }}
            </span>
          </div>

          <!-- Индикатор загрузки/распознавания -->
          <div v-if="sending" class="flex items-start gap-2">
            <div class="rounded-2xl rounded-bl-xs px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5 shadow-2xs">
              <Loader2 class="w-4 h-4 animate-spin text-primary shrink-0" />
              <span>Распознаю документ и сверяю слушателей с базой ATC...</span>
            </div>
          </div>
        </div>

        <!-- Нижняя панель ввода и прикрепления (фиксированная внизу левой панели) -->
        <div class="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          <!-- Превью выбранного файла -->
          <div
            v-if="selectedFile"
            class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <FileText v-if="selectedFile.name.endsWith('.pdf')" class="w-4 h-4 shrink-0 text-red-500" />
              <ImageIcon v-else class="w-4 h-4 shrink-0 text-blue-500" />
              <div class="min-w-0 flex-1">
                <p class="font-bold truncate text-slate-900 dark:text-white">{{ selectedFile.name }}</p>
                <p class="text-[10px] text-slate-500 opacity-80">{{ formatBytes(selectedFile.size) }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="clearFile"
              class="p-1 text-slate-400 hover:text-danger rounded-lg transition-colors cursor-pointer"
              title="Удалить файл"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Поле ввода текста и кнопки -->
          <div class="space-y-2">
            <textarea
              v-model="inputText"
              rows="3"
              placeholder="Вставьте список ФИО, текст приказа или служебной записки (или нажмите Ctrl+V для картинки)..."
              class="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs outline-none focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 transition-all resize-none custom-scrollbar"
              @keydown.enter.ctrl.prevent="sendMessage"
            ></textarea>

            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="onFileSelected"
                />
                <button
                  type="button"
                  @click="fileInputRef?.click()"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-primary hover:border-primary/50 transition-all cursor-pointer"
                  title="Прикрепить файл приказа"
                >
                  <Paperclip class="w-3.5 h-3.5" />
                  <span>PDF / Скан</span>
                </button>

                <button
                  type="button"
                  @click="triggerClipboardPaste"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:border-slate-300 transition-all cursor-pointer"
                  title="Вставить из буфера обмена"
                >
                  <Clipboard class="w-3.5 h-3.5" />
                  <span>Вставить</span>
                </button>
              </div>

              <UiButton
                type="button"
                variant="primary"
                size="sm"
                class="px-4 gap-1.5 rounded-xl font-bold"
                :disabled="!canSend"
                @click="sendMessage"
              >
                <Loader2 v-if="sending" class="w-3.5 h-3.5 animate-spin" />
                <Send v-else class="w-3.5 h-3.5" />
                <span>Распознать</span>
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== ПРАВАЯ ПАНЕЛЬ: СВЕРКА И ЗАЧИСЛЕНИЕ (FLEX-1) ==================== -->
      <div class="flex-1 min-w-0 flex flex-col h-full min-h-0 bg-white dark:bg-slate-900">
        
        <!-- Состояние, когда результатов еще нет -->
        <div
          v-if="!reviewItems || !reviewItems.length"
          class="flex-1 min-h-0 flex flex-col items-center justify-center p-8 text-center"
        >
          <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-inner">
            <Users class="w-8 h-8" />
          </div>
          <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">
            Здесь появится список распознанных слушателей
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
            Отправьте документ или список слушателей в левой панели. ИИ автоматически найдет каждого человека в базе ATC, проверит ПИНФЛ, должность, организацию и предупредит о конфликтах расписания.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg w-full text-left">
            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 class="w-4 h-4" />
                <span>Точное совпадение</span>
              </div>
              <p class="text-[11px] text-slate-500">Автоматически выбирает слушателя при 100% совпадении</p>
            </div>

            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <HelpCircle class="w-4 h-4" />
                <span>Выбор из вариантов</span>
              </div>
              <p class="text-[11px] text-slate-500">Предлагает однофамильцев с % схожести в 1 клик</p>
            </div>

            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1">
              <div class="flex items-center gap-1.5 text-xs font-bold text-primary">
                <UserPlus class="w-4 h-4" />
                <span>Быстрое создание</span>
              </div>
              <p class="text-[11px] text-slate-500">Регистрирует нового слушателя прямо из документа</p>
            </div>
          </div>
        </div>

        <!-- Состояние, когда результаты получены -->
        <div v-else class="flex-1 min-h-0 flex flex-col h-full">
          <!-- Верхний тулбар сверки -->
          <div class="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0 space-y-3">
            <div class="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 class="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Сверка слушателей с базой</span>
                  <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-mono font-bold">
                    {{ reviewItems.length }} чел.
                  </span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Проверьте найденные совпадения и выберите кандидатов для зачисления
                </p>
              </div>

              <!-- Пакетные действия -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="selectAllMatched"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-primary hover:border-primary/40 shadow-2xs transition-all cursor-pointer"
                >
                  <CheckCheck class="w-3.5 h-3.5 text-primary" />
                  <span>Выбрать всех найденных</span>
                </button>

                <button
                  type="button"
                  @click="deselectAll"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 shadow-2xs transition-all cursor-pointer"
                >
                  <Square class="w-3.5 h-3.5" />
                  <span>Снять выбор</span>
                </button>

                <button
                  type="button"
                  @click="cancelReview"
                  class="p-1.5 text-slate-400 hover:text-danger rounded-lg transition-colors cursor-pointer"
                  title="Очистить результаты"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Фильтр-табы и строка быстрого поиска -->
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <div class="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-700/60 p-1 text-xs">
                <button
                  type="button"
                  @click="filterTab = 'all'"
                  :class="[
                    'px-3 py-1 rounded-md font-bold transition-all cursor-pointer',
                    filterTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                  ]"
                >
                  Все ({{ reviewItems.length }})
                </button>
                <button
                  type="button"
                  @click="filterTab = 'ready'"
                  :class="[
                    'px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    filterTab === 'ready'
                      ? 'bg-white text-emerald-600 shadow-xs dark:bg-slate-800 dark:text-emerald-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                  ]"
                >
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Готовы ({{ totalSelectedCount }})
                </button>
                <button
                  type="button"
                  @click="filterTab = 'attention'"
                  :class="[
                    'px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5',
                    filterTab === 'attention'
                      ? 'bg-white text-amber-600 shadow-xs dark:bg-slate-800 dark:text-amber-400'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
                  ]"
                >
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  Требуют внимания ({{ attentionCount }})
                </button>
              </div>

              <!-- Поиск внутри найденных -->
              <div class="relative w-64">
                <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  v-model="itemsSearchQuery"
                  type="text"
                  placeholder="Фильтр по списку..."
                  class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <!-- Список интерактивных карточек (скроллируемая область) -->
          <div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            <div
              v-for="(item, idx) in filteredReviewItems"
              :key="idx"
              class="rounded-xl border p-4 transition-all space-y-3 shadow-2xs"
              :class="[
                !item.skip && item.chosenId
                  ? 'border-primary/40 bg-white dark:bg-slate-900 ring-1 ring-primary/20'
                  : item.skip
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              ]"
            >
              <!-- Заголовок карточки: данные из документа + статус -->
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3 min-w-0 flex-1">
                  <!-- Главный чекбокс включения -->
                  <div class="pt-0.5">
                    <input
                      type="checkbox"
                      :checked="!item.skip && !!item.chosenId"
                      :disabled="isAlreadyEnrolled(item.chosenId)"
                      @change="toggleItemSelection(item)"
                      class="w-5 h-5 rounded text-primary focus:ring-primary accent-primary cursor-pointer disabled:opacity-40"
                    />
                  </div>

                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-sm text-slate-900 dark:text-white">
                        {{ item.rawName }}
                      </span>
                      <span
                        v-if="item.pinfl"
                        class="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        ПИНФЛ: {{ item.pinfl }}
                      </span>
                      <span
                        v-if="isAlreadyEnrolled(item.chosenId)"
                        class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        Уже в группе
                      </span>
                    </div>

                    <p
                      v-if="item.organization || item.position || item.department"
                      class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate"
                    >
                      {{ [item.organization, item.department, item.position].filter(Boolean).join(" · ") }}
                    </p>
                  </div>
                </div>

                <!-- Бейдж статуса -->
                <div class="shrink-0 flex items-center gap-1.5">
                  <span
                    :class="[
                      'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full',
                      item.status === 'matched'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : item.status === 'ambiguous'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
                    ]"
                  >
                    <UserCheck v-if="item.status === 'matched'" class="w-3.5 h-3.5" />
                    <HelpCircle v-else-if="item.status === 'ambiguous'" class="w-3.5 h-3.5" />
                    <UserX v-else class="w-3.5 h-3.5" />
                    <span>{{ getStatusLabel(item.status) }}</span>
                  </span>
                </div>
              </div>

              <!-- Предупреждение о конфликте расписания -->
              <div
                v-if="item.conflict"
                class="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs font-medium"
              >
                <AlertTriangle class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Конфликт расписания: слушатель занят в группе <strong>{{ item.conflict.groupCode }}</strong> (дата: {{ item.conflict.conflictDate }})
                </span>
              </div>

              <!-- ================= СЕКЦИЯ КАНДИДАТОВ ================= -->
              <div class="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <span v-if="item.candidates && item.candidates.length > 1">
                      Возможные кандидаты ({{ item.candidates.length }} вариантов):
                    </span>
                    <span v-else>
                      Сопоставленный слушатель в базе:
                    </span>
                  </p>
                  <span v-if="item.candidates && item.candidates.length > 1" class="text-[11px] text-primary font-medium">
                    Нажмите на нужного кандидата для выбора
                  </span>
                </div>

                <!-- Список найденных кандидатов в виде интерактивных плиток -->
                <div v-if="item.candidates && item.candidates.length > 0" class="grid grid-cols-1 gap-2">
                  <div
                    v-for="c in item.candidates"
                    :key="c.id"
                    @click="selectCandidate(item, c)"
                    class="p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3"
                    :class="[
                      item.chosenId === c.id && !item.skip
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    ]"
                  >
                    <div class="flex items-center gap-3 min-w-0 flex-1">
                      <!-- Индикатор выбора -->
                      <div
                        class="w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0"
                        :class="[
                          item.chosenId === c.id && !item.skip
                            ? 'border-primary bg-primary text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        ]"
                      >
                        <Check v-if="item.chosenId === c.id && !item.skip" class="w-3 h-3 stroke-[3]" />
                      </div>

                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {{ c.fullName }}
                          </span>
                          <span v-if="c.pinfl" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {{ c.pinfl }}
                          </span>
                        </div>
                        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {{ [c.organization, c.department, c.position].filter(Boolean).join(" · ") }}
                        </p>
                      </div>
                    </div>

                    <!-- % Совпадения -->
                    <span
                      class="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full"
                      :class="[
                        c.confidence >= 80
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      ]"
                    >
                      {{ c.confidence }}% совпадение
                    </span>
                  </div>
                </div>

                <!-- Слушатель не найден в базе -->
                <div
                  v-else
                  class="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-2">
                    <AlertCircle class="w-4 h-4 shrink-0 text-rose-500" />
                    <span>Слушатель не найден в базе ATC Platform.</span>
                  </div>

                  <UiButton
                    type="button"
                    variant="outline"
                    size="sm"
                    class="h-8 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/5 shrink-0"
                    @click="openQuickCreate(item)"
                  >
                    <UserPlus class="w-3.5 h-3.5" />
                    <span>Создать в 1 клик</span>
                  </UiButton>
                </div>

                <!-- Дополнительные действия: поиск вручную / пропустить -->
                <div class="flex items-center justify-between gap-3 pt-2 text-xs flex-wrap">
                  <div class="flex items-center gap-3">
                    <!-- Переключатель ручного поиска -->
                    <button
                      type="button"
                      @click="item.showManualSearch = !item.showManualSearch"
                      class="text-primary hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Search class="w-3 h-3" />
                      <span>{{ item.showManualSearch ? 'Скрыть поиск' : 'Найти другого в базе вручную' }}</span>
                    </button>

                    <!-- Кнопка создания нового -->
                    <button
                      type="button"
                      @click="openQuickCreate(item)"
                      class="text-slate-600 dark:text-slate-300 hover:text-primary font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus class="w-3 h-3" />
                      <span>Создать слушателя</span>
                    </button>
                  </div>

                  <!-- Кнопка исключить / пропустить -->
                  <button
                    type="button"
                    @click="toggleSkip(item)"
                    :class="[
                      'text-xs font-semibold cursor-pointer transition-colors',
                      item.skip
                        ? 'text-primary font-bold'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    ]"
                  >
                    {{ item.skip ? 'Включить в список' : 'Пропустить этого человека' }}
                  </button>
                </div>

                <!-- Блок ручного поиска по базе -->
                <div v-if="item.showManualSearch" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                  <div class="relative">
                    <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      v-model="item.manualQuery"
                      type="text"
                      placeholder="Поиск по ФИО или ПИНФЛ в базе..."
                      class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      @input="onManualQueryInput(item)"
                    />
                  </div>

                  <div v-if="item.manualSearching" class="text-[11px] text-slate-500 flex items-center gap-1.5 py-1">
                    <Loader2 class="w-3 h-3 animate-spin text-primary" />
                    <span>Поиск по всей базе ATC...</span>
                  </div>

                  <div v-else-if="item.manualResults && item.manualResults.length" class="space-y-1 max-h-40 overflow-y-auto">
                    <div
                      v-for="s in item.manualResults"
                      :key="s.id"
                      @click="selectManualStudent(item, s)"
                      class="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-between gap-2 text-xs"
                    >
                      <div class="min-w-0 flex-1">
                        <span class="font-bold text-slate-900 dark:text-white">{{ s.fullName }}</span>
                        <span class="text-slate-400 ml-2">{{ s.pinfl }} • {{ s.organization }}</span>
                      </div>
                      <span class="text-[11px] font-bold text-primary shrink-0">Выбрать</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Нижний Action Bar с кнопкой зачисления (Sticky Footer) -->
          <div class="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between gap-4 shadow-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base font-mono">
                {{ totalSelectedCount }}
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900 dark:text-white">
                  Готово к зачислению в группу: {{ totalSelectedCount }} чел.
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Всего распознано в документе: {{ reviewItems.length }} слушателей
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UiButton
                type="button"
                variant="outline"
                size="md"
                @click="cancelReview"
              >
                Отмена
              </UiButton>

              <UiButton
                type="button"
                variant="primary"
                size="md"
                class="gap-2 px-6 font-bold shadow-md"
                :disabled="totalSelectedCount === 0 || submitting"
                @click="confirmSelection"
              >
                <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
                <UserCheck v-else class="w-4 h-4" />
                <span>Зачислить в группу ({{ totalSelectedCount }})</span>
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно быстрого создания слушателя -->
    <QuickStudentModal
      :is-open="showQuickModal"
      :initial-data="quickModalData"
      @close="showQuickModal = false"
      @created="handleStudentCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Sparkles,
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  X,
  Search,
  FileText,
  Image as ImageIcon,
  UserCheck,
  HelpCircle,
  UserX,
  AlertTriangle,
  UserPlus,
  UploadCloud,
  Check,
  CheckCheck,
  Square,
  Clipboard,
  Users,
  AlertCircle,
} from 'lucide-vue-next';
import QuickStudentModal from './QuickStudentModal.vue';

const props = defineProps<{
  groupId?: string;
  startDate?: string;
  endDate?: string;
  existingStudentIds?: string[];
  organizationId?: string;
}>();

const emit = defineEmits<{
  confirm: [studentIds: string[]];
}>();

const { authFetch } = useAuthFetch();
const toast = useNotification();

interface Candidate {
  id: string;
  fullName: string;
  pinfl: string;
  organization: string;
  position: string;
  department: string;
  confidence: number;
}

interface ReviewItem {
  rawName: string;
  pinfl: string;
  position: string;
  department: string;
  organization: string;
  status: 'matched' | 'ambiguous' | 'not_found';
  candidates: Candidate[];
  chosenId: string | null;
  skip: boolean;
  conflict?: {
    groupCode: string;
    conflictDate: string;
  } | null;
  showManualSearch?: boolean;
  manualQuery?: string;
  manualResults?: Candidate[];
  manualSearching?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'error';
  text: string;
  fileName?: string;
}

// State
const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const selectedFile = ref<File | null>(null);
const sending = ref(false);
const submitting = ref(false);
const isDragging = ref(false);
const reviewItems = ref<ReviewItem[] | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Filters
const filterTab = ref<'all' | 'ready' | 'attention'>('all');
const itemsSearchQuery = ref('');

// Quick Student Modal
const showQuickModal = ref(false);
const quickModalData = ref<any>(null);
const activeReviewItemIndex = ref<number | null>(null);

let manualSearchTimeout: ReturnType<typeof setTimeout> | null = null;

const canSend = computed(() => !sending.value && (inputText.value.trim() || selectedFile.value));

const isAlreadyEnrolled = (id: string | null) => {
  if (!id) return false;
  return Boolean(props.existingStudentIds && props.existingStudentIds.includes(id));
};

const totalSelectedCount = computed(() => {
  if (!reviewItems.value) return 0;
  return reviewItems.value.filter(
    (i) => !i.skip && i.chosenId && !isAlreadyEnrolled(i.chosenId)
  ).length;
});

const attentionCount = computed(() => {
  if (!reviewItems.value) return 0;
  return reviewItems.value.filter(
    (i) => i.status === 'ambiguous' || i.status === 'not_found' || !i.chosenId || !!i.conflict
  ).length;
});

const filteredReviewItems = computed(() => {
  if (!reviewItems.value) return [];
  let list = reviewItems.value;

  if (filterTab.value === 'ready') {
    list = list.filter((i) => !i.skip && i.chosenId && !isAlreadyEnrolled(i.chosenId));
  } else if (filterTab.value === 'attention') {
    list = list.filter((i) => i.status === 'ambiguous' || i.status === 'not_found' || !i.chosenId || !!i.conflict);
  }

  if (itemsSearchQuery.value.trim()) {
    const q = itemsSearchQuery.value.toLowerCase().trim();
    list = list.filter((i) =>
      i.rawName.toLowerCase().includes(q) ||
      i.pinfl?.includes(q) ||
      i.organization?.toLowerCase().includes(q) ||
      i.candidates?.some((c) => c.fullName.toLowerCase().includes(q))
    );
  }

  return list;
});

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'matched': return 'Найден';
    case 'ambiguous': return 'Уточнить выбор';
    case 'not_found': return 'Не найден';
    default: return status;
  }
};

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) {
    selectedFile.value = target.files[0];
  }
};

const clearFile = () => {
  selectedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const f = files[0];
    if (f) selectedFile.value = f;
  }
};

const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        selectedFile.value = file;
        toast.info('Изображение прикреплено из буфера обмена');
        return;
      }
    }
  }
};

const triggerClipboardPaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      inputText.value = text;
      toast.info('Текст вставлен из буфера');
    }
  } catch {
    toast.warning('Нажмите Ctrl+V для вставки');
  }
};

const sendMessage = async () => {
  if (!canSend.value) return;

  const textToSend = inputText.value.trim();
  const file = selectedFile.value;

  messages.value.push({
    role: 'user',
    text: textToSend || (file ? `Загружен файл: ${file.name}` : ''),
    fileName: file?.name,
  });

  sending.value = true;
  reviewItems.value = null;
  inputText.value = '';
  clearFile();

  try {
    let res: any;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (textToSend) formData.append('text', textToSend);
      if (props.groupId) formData.append('groupId', props.groupId);
      if (props.startDate) formData.append('startDate', props.startDate);
      if (props.endDate) formData.append('endDate', props.endDate);
      if (props.organizationId) formData.append('organizationId', props.organizationId);

      res = await authFetch('/api/groups/ai-extract', {
        method: 'POST',
        body: formData,
      });
    } else {
      res = await authFetch('/api/groups/ai-extract', {
        method: 'POST',
        body: {
          text: textToSend,
          groupId: props.groupId,
          startDate: props.startDate,
          endDate: props.endDate,
          organizationId: props.organizationId,
        },
      });
    }

    messages.value.push({
      role: 'assistant',
      text: res.reply || 'Распознавание завершено.',
    });

    const items: any[] = res.items || [];
    if (!items.length) {
      toast.info('В документе не обнаружено слушателей');
      return;
    }

    reviewItems.value = items.map((item) => {
      const topCandId = item.candidates?.[0]?.id || null;
      const initialChosenId = item.chosenId || (item.status === 'matched' ? topCandId : null);
      return {
        ...item,
        chosenId: initialChosenId,
        skip: Boolean(item.skip || (initialChosenId && isAlreadyEnrolled(initialChosenId))),
        showManualSearch: false,
        manualQuery: item.rawName,
        manualResults: [],
        manualSearching: false,
      };
    });

    toast.success(`Распознано: ${items.length} слушателей`);
  } catch (err: any) {
    console.error('AI extract error:', err);
    messages.value.push({
      role: 'error',
      text: err.data?.message || err.message || 'Ошибка распознавания документа',
    });
    toast.error('Не удалось распознать документ');
  } finally {
    sending.value = false;
  }
};

// Выбор кандидата кликом на плитку
const selectCandidate = (item: ReviewItem, candidate: Candidate) => {
  item.chosenId = candidate.id;
  item.skip = false;
};

// Чекбокс включения/выключения
const toggleItemSelection = (item: ReviewItem) => {
  if (item.skip) {
    item.skip = false;
    if (!item.chosenId && item.candidates?.[0]) {
      item.chosenId = item.candidates[0].id;
    }
  } else {
    item.skip = true;
  }
};

const toggleSkip = (item: ReviewItem) => {
  item.skip = !item.skip;
  if (!item.skip && !item.chosenId && item.candidates?.[0]) {
    item.chosenId = item.candidates[0].id;
  }
};

const selectAllMatched = () => {
  if (!reviewItems.value) return;
  for (const item of reviewItems.value) {
    if (item.candidates && item.candidates[0]) {
      item.chosenId = item.candidates[0].id;
      item.skip = false;
    }
  }
  toast.success('Выбраны все найденные слушатели');
};

const deselectAll = () => {
  if (!reviewItems.value) return;
  for (const item of reviewItems.value) {
    item.skip = true;
  }
  toast.info('Выбор снят со всех слушателей');
};

const onManualQueryInput = (item: ReviewItem) => {
  if (manualSearchTimeout) clearTimeout(manualSearchTimeout);
  if (!item.manualQuery || item.manualQuery.trim().length < 2) {
    item.manualResults = [];
    return;
  }

  manualSearchTimeout = setTimeout(async () => {
    item.manualSearching = true;
    try {
      const res = await authFetch<{ success: boolean; students: any[] }>('/api/students', {
        params: { search: item.manualQuery!.trim(), limit: 5 },
      });
      item.manualResults = (res.students || []).map((s) => ({
        id: s.id,
        fullName: s.fullName,
        pinfl: s.pinfl,
        organization: s.organization || '',
        position: s.position || '',
        department: s.department || '',
        confidence: 100,
      }));
    } catch {
      item.manualResults = [];
    } finally {
      item.manualSearching = false;
    }
  }, 300);
};

const selectManualStudent = (item: ReviewItem, student: Candidate) => {
  item.chosenId = student.id;
  item.status = 'matched';
  item.skip = false;
  item.candidates = [student];
  item.showManualSearch = false;
};

const openQuickCreate = (item: ReviewItem) => {
  const idx = reviewItems.value?.indexOf(item);
  activeReviewItemIndex.value = idx !== undefined && idx >= 0 ? idx : null;
  quickModalData.value = {
    fullName: item.rawName,
    organization: item.organization || '',
    position: item.position || '',
    department: item.department || '',
    pinfl: item.pinfl || '',
  };
  showQuickModal.value = true;
};

const handleStudentCreated = (newStudent: any) => {
  if (activeReviewItemIndex.value !== null && reviewItems.value) {
    const item = reviewItems.value[activeReviewItemIndex.value];
    if (item) {
      const candidate: Candidate = {
        id: newStudent.id,
        fullName: newStudent.fullName,
        pinfl: newStudent.pinfl,
        organization: newStudent.organization || '',
        position: newStudent.position || '',
        department: newStudent.department || '',
        confidence: 100,
      };
      item.candidates = [candidate];
      item.chosenId = newStudent.id;
      item.status = 'matched';
      item.skip = false;
      item.showManualSearch = false;
    }
  }
};

const confirmSelection = () => {
  if (!reviewItems.value) return;
  const ids = reviewItems.value
    .filter((i) => !i.skip && i.chosenId && !isAlreadyEnrolled(i.chosenId))
    .map((i) => i.chosenId!) as string[];

  const uniqueIds = Array.from(new Set(ids));
  if (uniqueIds.length === 0) {
    toast.error('Ни одного слушателя не выбрано');
    return;
  }

  emit('confirm', uniqueIds);
  messages.value.push({
    role: 'assistant',
    text: `Зачислено в группу: ${uniqueIds.length} слушателей.`,
  });
  reviewItems.value = null;
};

const cancelReview = () => {
  reviewItems.value = null;
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.35);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.55);
}
</style>
