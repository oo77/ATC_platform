<template>
  <div class="h-[calc(100vh-5.5rem)] flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-950">
    <!-- Header Bar -->
    <div
      class="h-14 px-4 border-b border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10"
    >
      <div class="flex items-center gap-3 min-w-0">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :title="isSidebarOpen ? 'Скрыть историю' : 'Показать историю'"
        >
          <PanelLeft :size="18" />
        </button>

        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
            <Sparkles :size="16" />
          </div>
          <div class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ currentSessionTitle }}
              </h1>
              <span class="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200/50 dark:border-blue-800/50">
                SQL + Files ReAct
              </span>
            </div>
            <span class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              Автономный аналитический агент с доступом к базе данных и реестру файлов
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <button
          v-if="currentArtifact"
          @click="isCanvasOpen = !isCanvasOpen"
          class="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm"
          :class="isCanvasOpen
            ? 'bg-blue-600 text-white shadow-blue-500/25'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'"
        >
          <TableIcon :size="14" />
          <span>{{ isCanvasOpen ? 'Скрыть Canvas' : 'Открыть Canvas' }}</span>
          <span
            v-if="currentArtifact?.rows?.length"
            class="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-500/20 text-blue-100"
          >
            {{ currentArtifact.rows.length }}
          </span>
        </button>

        <button
          @click="startNewSession"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
        >
          <Plus :size="14" />
          <span class="hidden sm:inline">Новый диалог</span>
        </button>
      </div>
    </div>

    <!-- Main Workspace Layout (Sidebar + Chat Feed + Canvas) -->
    <div class="flex-1 flex min-h-0 relative">
      <!-- Left Sidebar: Session History -->
      <aside
        v-show="isSidebarOpen"
        class="w-72 border-r border-gray-200/80 dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md flex flex-col shrink-0 transition-all z-20"
      >
        <div class="p-3 border-b border-gray-100 dark:border-gray-800">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="sessionSearch"
              type="text"
              placeholder="Поиск диалогов..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div
            v-if="sessionsLoading"
            class="py-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2"
          >
            <Loader2 :size="18" class="animate-spin text-blue-600" />
            <span>Загрузка истории...</span>
          </div>

          <div
            v-else-if="filteredSessions.length === 0"
            class="py-8 text-center text-xs text-gray-400 px-3"
          >
            <MessageSquare :size="24" class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <span>Диалогов не найдено</span>
          </div>

          <div
            v-for="s in filteredSessions"
            :key="s.id"
            @click="selectSession(s.id)"
            class="group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all"
            :class="currentSessionId === s.id
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-xs'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60'"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <MessageSquare :size="14" class="shrink-0 text-gray-400 group-hover:text-blue-500" />
              <div class="min-w-0 flex-1">
                <p class="truncate leading-snug">{{ s.title }}</p>
                <span class="text-[10px] text-gray-400">{{ formatDate(s.updatedAt) }}</span>
              </div>
            </div>

            <!-- Actions (Rename / Delete) -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="openRenameModal(s)"
                class="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                title="Переименовать"
              >
                <Edit3 :size="12" />
              </button>
              <button
                @click.stop="confirmDeleteSession(s.id)"
                class="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200/50 dark:hover:bg-gray-700"
                title="Удалить"
              >
                <Trash2 :size="12" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Center Panel: Chat Feed -->
      <main
        class="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-all overflow-hidden"
        :class="isCanvasFullscreen ? 'hidden' : ''"
      >
        <!-- Messages Stream -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar"
        >
          <!-- Welcome Screen (if empty) -->
          <div
            v-if="messages.length === 0"
            class="max-w-2xl mx-auto py-8 px-4 flex flex-col items-center text-center"
          >
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 animate-bounce-subtle">
              <Sparkles :size="32" />
            </div>

            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Аналитический AI-Ассистент ATC
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
              Задавайте вопросы на естественном языке. Ассистент выполнит безопасные SQL-запросы к базе данных, найдет слушателей или проверит файлы и построит интерактивный отчет.
            </p>

            <!-- Quick Action Chips -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg text-left">
              <button
                v-for="chip in quickChips"
                :key="chip.text"
                @click="sendQuickPrompt(chip.text)"
                class="p-3 bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 border border-gray-200/80 dark:border-gray-700/70 hover:border-blue-300 dark:hover:border-blue-700 rounded-2xl text-xs text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 transition-all flex items-start gap-2.5 shadow-xs"
              >
                <component :is="chip.icon" :size="16" class="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span class="leading-tight">{{ chip.text }}</span>
              </button>
            </div>
          </div>

          <!-- Message List -->
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="max-w-3xl mx-auto flex flex-col gap-2"
          >
            <!-- User Message -->
            <div
              v-if="msg.role === 'user'"
              class="flex justify-end gap-3 items-start group"
            >
              <button
                @click="rollbackMessage(msg)"
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex items-center gap-1 mt-1"
                title="Откатить текст в поле ввода"
              >
                <RotateCcw :size="13" />
                <span class="text-[10px]">Откатить</span>
              </button>

              <div class="max-w-[85%] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm shadow-sm">
                <p class="text-sm whitespace-pre-wrap leading-relaxed">{{ msg.content }}</p>
                <span class="block text-right text-[10px] text-blue-200/80 mt-1.5">
                  {{ formatTime(msg.createdAt) }}
                </span>
              </div>
            </div>

            <!-- Assistant Message -->
            <div
              v-else
              class="flex items-start gap-3 w-full"
            >
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot :size="16" />
              </div>

              <div class="flex-1 min-w-0 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl rounded-tl-sm p-4 text-sm text-gray-900 dark:text-gray-100 shadow-xs space-y-3">
                <!-- ReAct Reasoning Accordion -->
                <div
                  v-if="msg.steps && msg.steps.length"
                  class="rounded-xl border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 overflow-hidden text-xs"
                >
                  <button
                    @click="msg.isStepsOpen = !msg.isStepsOpen"
                    class="w-full px-3 py-2 flex items-center justify-between text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100/40 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <div class="flex items-center gap-2">
                      <Database :size="13" />
                      <span>Поиск в БД и файлах ({{ msg.steps.length }} {{ getStepWord(msg.steps.length) }})</span>
                    </div>
                    <ChevronDown
                      :size="14"
                      class="transition-transform duration-200"
                      :class="msg.isStepsOpen ? 'rotate-180' : ''"
                    />
                  </button>

                  <div
                    v-show="msg.isStepsOpen"
                    class="p-3 border-t border-blue-200/60 dark:border-blue-900/50 space-y-2.5 bg-white/50 dark:bg-gray-900/50"
                  >
                    <div
                      v-for="step in msg.steps"
                      :key="step.step"
                      class="space-y-1.5"
                    >
                      <div class="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                        <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px]">
                          {{ step.step }}
                        </span>
                        <span>Действие: {{ step.action }}</span>
                      </div>
                      <p v-if="step.thought" class="text-gray-600 dark:text-gray-400 text-xs italic pl-6">
                        "{{ step.thought }}"
                      </p>

                      <!-- SQL Display -->
                      <div v-if="step.input?.sql" class="pl-6">
                        <div class="flex items-center justify-between bg-gray-900 text-gray-200 px-3 py-1.5 rounded-t-lg text-[10px] font-mono">
                          <span>MySQL SELECT</span>
                          <button
                            @click="copyToClipboard(step.input.sql)"
                            class="hover:text-blue-400 flex items-center gap-1"
                          >
                            <Copy :size="11" />
                            <span>Копировать</span>
                          </button>
                        </div>
                        <pre class="bg-gray-950 text-emerald-400 p-2.5 rounded-b-lg text-[11px] font-mono overflow-x-auto custom-scrollbar"><code>{{ step.input.sql }}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Text Content -->
                <div class="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {{ msg.content }}
                </div>

                <!-- Artifact Button (Canvas trigger) -->
                <div
                  v-if="msg.artifact"
                  class="mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/70 dark:border-blue-800/70 flex items-center justify-between"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <TableIcon :size="16" />
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {{ msg.artifact.title || 'Сводная аналитика' }}
                      </h4>
                      <p class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {{ msg.artifact.rows?.length || 0 }} записей в таблице
                      </p>
                    </div>
                  </div>

                  <button
                    @click="openArtifactInCanvas(msg.artifact)"
                    class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <span>Открыть Canvas</span>
                    <ArrowRight :size="13" />
                  </button>
                </div>

                <span class="block text-right text-[10px] text-gray-400">
                  {{ formatTime(msg.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div
            v-if="isGenerating"
            class="max-w-3xl mx-auto flex items-start gap-3"
          >
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot :size="16" />
            </div>
            <div class="p-4 rounded-2xl rounded-tl-sm bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
              <Loader2 :size="16" class="animate-spin text-blue-600" />
              <span>ИИ анализирует вопрос, проверяет таблицы БД и файлы...</span>
            </div>
          </div>
        </div>

        <!-- Input Box Area -->
        <div class="p-4 border-t border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div class="max-w-3xl mx-auto space-y-2">
            <!-- Attached File Chip (if any) -->
            <div
              v-if="attachedFile"
              class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300"
            >
              <FileText :size="13" />
              <span class="truncate max-w-xs">{{ attachedFile.filename }}</span>
              <button
                @click="attachedFile = null"
                class="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
              >
                <X :size="12" />
              </button>
            </div>

            <div class="flex items-end gap-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500 transition-all">
              <!-- Attach File Button -->
              <button
                @click="showAttachFileModal = true"
                class="p-2 rounded-xl text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
                title="Прикрепить файл для анализа"
              >
                <Paperclip :size="18" />
              </button>

              <!-- Textarea with autogrow -->
              <textarea
                ref="promptInput"
                v-model="inputPrompt"
                @keydown.enter.exact.prevent="handleSubmit"
                rows="1"
                placeholder="Задайте вопрос по слушателям, курсам, группам или файлам... (Enter для отправки)"
                class="flex-1 bg-transparent border-0 resize-none text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 max-h-36 py-2 custom-scrollbar"
                :disabled="isGenerating"
              ></textarea>

              <!-- Send Button -->
              <button
                @click="handleSubmit"
                :disabled="!inputPrompt.trim() || isGenerating"
                class="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shrink-0 shadow-sm shadow-blue-500/25"
                title="Отправить запрос"
              >
                <Send :size="16" />
              </button>
            </div>
            <p class="text-[10px] text-gray-400 text-center">
              Shift + Enter для переноса строки. Доступ к базе данных ограничен политикой безопасности в режиме только для чтения.
            </p>
          </div>
        </div>
      </main>

      <!-- Right Panel: Interactive Canvas (Table / Chart / KPI) -->
      <section
        v-if="isCanvasOpen && currentArtifact"
        class="border-l border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col z-10 transition-all duration-300"
        :class="isCanvasFullscreen ? 'flex-1 w-full' : 'w-[520px] xl:w-[640px] shrink-0'"
      >
        <!-- Canvas Header -->
        <div class="h-14 px-4 border-b border-gray-200/80 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-gray-950/50">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <TableIcon :size="16" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-gray-900 dark:text-white truncate">
                {{ currentArtifact.title || 'Интерактивный холст' }}
              </h3>
              <p class="text-[10px] text-gray-400 truncate">
                {{ currentArtifact.description || 'Табличный и графический анализ' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Tabs: Table / Chart -->
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-xs">
              <button
                @click="canvasTab = 'table'"
                class="px-2.5 py-1 rounded-lg font-medium transition-all"
                :class="canvasTab === 'table' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
              >
                Таблица
              </button>
              <button
                @click="canvasTab = 'chart'"
                class="px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                :class="canvasTab === 'chart' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'"
              >
                <BarChart3 :size="12" />
                <span>График</span>
              </button>
            </div>

            <!-- Export to Excel -->
            <button
              @click="exportArtifactToExcel"
              class="p-1.5 text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Экспорт в Excel (.xlsx)"
            >
              <FileSpreadsheet :size="16" />
            </button>

            <!-- Fullscreen toggle -->
            <button
              @click="isCanvasFullscreen = !isCanvasFullscreen"
              class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              :title="isCanvasFullscreen ? 'Свернуть' : 'На весь экран'"
            >
              <Maximize2 v-if="!isCanvasFullscreen" :size="15" />
              <Minimize2 v-else :size="15" />
            </button>

            <!-- Close Canvas -->
            <button
              @click="isCanvasOpen = false"
              class="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Закрыть холст"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- Canvas Content Area -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <!-- KPI Summary Cards -->
          <div
            v-if="currentArtifact.summaryMetrics?.length"
            class="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            <div
              v-for="(metric, idx) in currentArtifact.summaryMetrics"
              :key="idx"
              class="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 shadow-xs"
            >
              <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400 block truncate">
                {{ metric.label }}
              </span>
              <span class="text-lg font-black text-gray-900 dark:text-white mt-1 block">
                {{ metric.value }}
              </span>
            </div>
          </div>

          <!-- Tab 1: Table View -->
          <div v-show="canvasTab === 'table'" class="space-y-3">
            <!-- Table Search and Stats -->
            <div class="flex items-center justify-between gap-3">
              <div class="relative flex-1 max-w-xs">
                <Search :size="13" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="tableFilter"
                  type="text"
                  placeholder="Фильтр по строкам..."
                  class="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>

              <span class="text-xs text-gray-400">
                Показано: {{ pagedRows.length }} из {{ filteredRows.length }}
              </span>
            </div>

            <!-- Table Container -->
            <div class="rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-xs">
              <div class="overflow-x-auto custom-scrollbar">
                <table class="w-full text-left text-xs border-collapse">
                  <thead class="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200/80 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th
                        v-for="col in currentArtifact.columns"
                        :key="col.key"
                        @click="sortBy(col.key)"
                        class="p-3 cursor-pointer select-none hover:bg-gray-100/70 dark:hover:bg-gray-700/60 transition-colors whitespace-nowrap"
                      >
                        <div class="flex items-center gap-1.5">
                          <span>{{ col.label }}</span>
                          <ArrowUpDown :size="11" class="text-gray-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-800/80 bg-white dark:bg-gray-900">
                    <tr
                      v-for="(row, rIdx) in pagedRows"
                      :key="rIdx"
                      class="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                    >
                      <td
                        v-for="col in currentArtifact.columns"
                        :key="col.key"
                        class="p-3 text-gray-800 dark:text-gray-200 whitespace-nowrap"
                      >
                        {{ formatCellValue(row[col.key], col.type) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Table Pagination -->
            <div
              v-if="filteredRows.length > tablePageSize"
              class="flex items-center justify-between text-xs text-gray-500 pt-2"
            >
              <span>Страница {{ tableCurrentPage }} из {{ totalTablePages }}</span>
              <div class="flex items-center gap-1">
                <button
                  @click="tableCurrentPage = Math.max(1, tableCurrentPage - 1)"
                  :disabled="tableCurrentPage === 1"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Назад
                </button>
                <button
                  @click="tableCurrentPage = Math.min(totalTablePages, tableCurrentPage + 1)"
                  :disabled="tableCurrentPage === totalTablePages"
                  class="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  Вперед
                </button>
              </div>
            </div>
          </div>

          <!-- Tab 2: Chart View -->
          <div v-show="canvasTab === 'chart'" class="space-y-4">
            <div class="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80">
              <h4 class="text-xs font-bold text-gray-900 dark:text-white mb-3">
                {{ currentArtifact.chartSuggestion?.title || 'Графическое распределение' }}
              </h4>

              <div v-if="chartCategories.length && chartSeriesData.length">
                <DynamicBarChart
                  chart-id="ai-canvas-bar-chart"
                  :categories="chartCategories"
                  :series="[{ name: 'Значение', data: chartSeriesData }]"
                  :height="320"
                />
              </div>
              <div v-else class="py-12 text-center text-xs text-gray-400">
                Недостаточно числовых данных для построения графика
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Attach File Modal -->
    <Modal
      :is-open="showAttachFileModal"
      @close="showAttachFileModal = false"
      title="Выбор файла для передачи ИИ"
      size="md"
    >
      <div class="space-y-4">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Выберите файл из хранилища ATC Platform (приказы, списки слушателей в Excel, учебные программы), чтобы передать его содержимое в контекст запроса ИИ:
        </p>

        <div class="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar">
          <div
            v-if="filesLoading"
            class="py-6 text-center text-xs text-gray-400 flex flex-col items-center gap-2"
          >
            <Loader2 :size="18" class="animate-spin text-blue-600" />
            <span>Загрузка файлов...</span>
          </div>

          <div
            v-else-if="systemFiles.length === 0"
            class="py-6 text-center text-xs text-gray-400"
          >
            Файлы не найдены
          </div>

          <div
            v-for="file in systemFiles"
            :key="file.uuid"
            @click="selectAttachmentFile(file)"
            class="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer flex items-center justify-between text-xs transition-colors"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <FileText :size="15" class="text-blue-600 shrink-0" />
              <div class="min-w-0">
                <p class="font-medium text-gray-900 dark:text-white truncate">{{ file.filename }}</p>
                <span class="text-[10px] text-gray-400">{{ file.category }} • {{ formatFileSize(file.sizeBytes) }}</span>
              </div>
            </div>
            <button class="text-blue-600 font-semibold text-xs shrink-0">Выбрать</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Rename Session Modal -->
    <Modal
      :is-open="showRenameModal"
      @close="showRenameModal = false"
      title="Переименовать диалог"
      size="sm"
    >
      <div class="space-y-4">
        <input
          v-model="newSessionTitle"
          type="text"
          placeholder="Новое название диалога"
          class="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keydown.enter="handleRenameSession"
        />
        <div class="flex justify-end gap-2">
          <Button variant="outline" size="sm" @click="showRenameModal = false">Отмена</Button>
          <Button variant="primary" size="sm" @click="handleRenameSession">Сохранить</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  Table as TableIcon,
  Copy,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  BarChart3,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  PanelLeft,
  MessageSquare,
  ArrowRight,
  Database,
  ChevronDown,
  Paperclip,
  FileText,
  X,
  Maximize2,
  Minimize2,
  Users,
  GraduationCap,
  Building2,
  Calendar,
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import DynamicBarChart from '~/components/charts/DynamicBarChart.vue';
import Modal from '~/components/ui/Modal.vue';
import Button from '~/components/ui/Button.vue';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();
const notification = useNotification();

// --- Состояние сессий ---
const sessions = ref<Array<{ id: string; title: string; createdAt: string; updatedAt: string }>>([]);
const sessionsLoading = ref(false);
const currentSessionId = ref<string | null>(null);
const currentSessionTitle = ref('Новый диалог');
const sessionSearch = ref('');
const isSidebarOpen = ref(true);

// --- Состояние сообщений ---
interface AgentStep {
  step: number;
  thought: string;
  action: string;
  input?: any;
  output?: any;
}

interface ReportArtifact {
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string; type?: 'text' | 'number' | 'date' }>;
  rows: Record<string, any>[];
  summaryMetrics?: Array<{ label: string; value: string | number; change?: string }>;
  chartSuggestion?: {
    type?: 'bar' | 'doughnut' | 'line';
    xKey?: string;
    yKey?: string;
    title?: string;
  };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: AgentStep[];
  isStepsOpen?: boolean;
  artifact?: ReportArtifact;
  sqlExecuted?: string;
  createdAt: string;
}

const messages = ref<ChatMessage[]>([]);
const inputPrompt = ref('');
const isGenerating = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);
const promptInput = ref<HTMLTextAreaElement | null>(null);

// --- Состояние Canvas ---
const isCanvasOpen = ref(false);
const isCanvasFullscreen = ref(false);
const canvasTab = ref<'table' | 'chart'>('table');
const currentArtifact = ref<ReportArtifact | null>(null);
const tableFilter = ref('');
const tableSortKey = ref('');
const tableSortAsc = ref(true);
const tableCurrentPage = ref(1);
const tablePageSize = ref(15);

// --- Прикрепление файлов ---
const showAttachFileModal = ref(false);
const systemFiles = ref<any[]>([]);
const filesLoading = ref(false);
const attachedFile = ref<{ uuid: string; filename: string } | null>(null);

// --- Модалка переименования ---
const showRenameModal = ref(false);
const renamingSessionId = ref<string | null>(null);
const newSessionTitle = ref('');

// --- Быстрые сценарии ---
const quickChips = [
  { text: 'Сколько групп сейчас в процессе обучения?', icon: Users },
  { text: 'Выведи топ самых популярных учебных курсов', icon: GraduationCap },
  { text: 'Покажи статистику слушателей по организациям', icon: Building2 },
  { text: 'Какие файлы и приказы загружены в систему?', icon: FileText },
];

// --- Вычисляемые свойства ---
const filteredSessions = computed(() => {
  if (!sessionSearch.value.trim()) return sessions.value;
  const q = sessionSearch.value.toLowerCase();
  return sessions.value.filter((s) => s.title.toLowerCase().includes(q));
});

const filteredRows = computed(() => {
  if (!currentArtifact.value?.rows) return [];
  let rows = [...currentArtifact.value.rows];

  if (tableFilter.value.trim()) {
    const q = tableFilter.value.toLowerCase();
    rows = rows.filter((r) =>
      Object.values(r).some((val) => String(val || '').toLowerCase().includes(q))
    );
  }

  if (tableSortKey.value) {
    const key = tableSortKey.value;
    rows.sort((a, b) => {
      const valA = a[key] ?? '';
      const valB = b[key] ?? '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return tableSortAsc.value ? valA - valB : valB - valA;
      }
      return tableSortAsc.value
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  return rows;
});

const totalTablePages = computed(() =>
  Math.max(1, Math.ceil(filteredRows.value.length / tablePageSize.value))
);

const pagedRows = computed(() => {
  const start = (tableCurrentPage.value - 1) * tablePageSize.value;
  return filteredRows.value.slice(start, start + tablePageSize.value);
});

// Данные для графика
const chartCategories = computed(() => {
  if (!currentArtifact.value?.rows || !currentArtifact.value?.chartSuggestion) return [];
  const xKey = currentArtifact.value.chartSuggestion.xKey || currentArtifact.value.columns[0]?.key;
  if (!xKey) return [];
  return currentArtifact.value.rows.slice(0, 12).map((r) => String(r[xKey] ?? ''));
});

const chartSeriesData = computed(() => {
  if (!currentArtifact.value?.rows || !currentArtifact.value?.chartSuggestion) return [];
  const yKey = currentArtifact.value.chartSuggestion.yKey || currentArtifact.value.columns[1]?.key;
  if (!yKey) return [];
  return currentArtifact.value.rows.slice(0, 12).map((r) => {
    const num = Number(r[yKey]);
    return isNaN(num) ? 0 : num;
  });
});

// --- Методы работы с сессиями ---
async function loadSessions() {
  sessionsLoading.value = true;
  try {
    const res: any = await authFetch('/api/ai/chat/sessions');
    if (res.success) {
      sessions.value = res.data;
      // Если сессия не выбрана, выбираем первую
      if (!currentSessionId.value && sessions.value.length > 0) {
        const first = sessions.value[0];
        if (first) {
          selectSession(first.id);
        }
      }
    }
  } catch (err: any) {
    notification.error(err.message || 'Не удалось загрузить диалоги');
  } finally {
    sessionsLoading.value = false;
  }
}

async function selectSession(sessionId: string) {
  currentSessionId.value = sessionId;
  const s = sessions.value.find((item) => item.id === sessionId);
  if (s) currentSessionTitle.value = s.title;

  try {
    const res: any = await authFetch(`/api/ai/chat/sessions/${sessionId}`);
    if (res.success) {
      messages.value = res.data.messages.map((m: any) => ({
        ...m,
        isStepsOpen: false,
      }));
      // Находим последний артефакт в диалоге
      const lastWithArtifact = [...messages.value].reverse().find((m) => m.artifact);
      if (lastWithArtifact?.artifact) {
        currentArtifact.value = lastWithArtifact.artifact;
      }
      scrollToBottom();
    }
  } catch (err: any) {
    notification.error(err.message || 'Ошибка загрузки диалога');
  }
}

function startNewSession() {
  currentSessionId.value = null;
  currentSessionTitle.value = 'Новый диалог';
  messages.value = [];
  currentArtifact.value = null;
  isCanvasOpen.value = false;
  inputPrompt.value = '';
  attachedFile.value = null;
  nextTick(() => {
    promptInput.value?.focus();
  });
}

function openRenameModal(session: { id: string; title: string }) {
  renamingSessionId.value = session.id;
  newSessionTitle.value = session.title;
  showRenameModal.value = true;
}

async function handleRenameSession() {
  if (!renamingSessionId.value || !newSessionTitle.value.trim()) return;
  try {
    await authFetch(`/api/ai/chat/sessions/${renamingSessionId.value}`, {
      method: 'PATCH',
      body: { title: newSessionTitle.value.trim() },
    });
    const s = sessions.value.find((item) => item.id === renamingSessionId.value);
    if (s) s.title = newSessionTitle.value.trim();
    if (currentSessionId.value === renamingSessionId.value) {
      currentSessionTitle.value = newSessionTitle.value.trim();
    }
    notification.success('Диалог переименован');
    showRenameModal.value = false;
  } catch (err: any) {
    notification.error(err.message || 'Ошибка переименования');
  }
}

async function confirmDeleteSession(sessionId: string) {
  if (!confirm('Вы действительно хотите удалить этот диалог?')) return;
  try {
    await authFetch(`/api/ai/chat/sessions/${sessionId}`, { method: 'DELETE' });
    sessions.value = sessions.value.filter((s) => s.id !== sessionId);
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        const first = sessions.value[0];
        if (first) {
          selectSession(first.id);
        }
      } else {
        startNewSession();
      }
    }
    notification.success('Диалог удален');
  } catch (err: any) {
    notification.error(err.message || 'Ошибка удаления диалога');
  }
}

// --- Отправка запросов ---
function sendQuickPrompt(text: string) {
  inputPrompt.value = text;
  handleSubmit();
}

async function handleSubmit() {
  const text = inputPrompt.value.trim();
  if (!text || isGenerating.value) return;

  const userMsgText = text;
  inputPrompt.value = '';
  isGenerating.value = true;

  // Оптимистичное добавление сообщения пользователя
  const tempUserMsgId = 'temp-' + Date.now();
  messages.value.push({
    id: tempUserMsgId,
    role: 'user',
    content: userMsgText,
    createdAt: new Date().toISOString(),
  });
  scrollToBottom();

  const fileUuid = attachedFile.value?.uuid;
  attachedFile.value = null;

  try {
    const res: any = await authFetch('/api/ai/chat/message', {
      method: 'POST',
      body: {
        sessionId: currentSessionId.value,
        message: userMsgText,
        fileAttachmentUuid: fileUuid,
      },
    });

    if (res.success) {
      const data = res.data;
      currentSessionId.value = data.sessionId;
      currentSessionTitle.value = data.sessionTitle;

      // Заменяем временное сообщение реальным
      const idx = messages.value.findIndex((m) => m.id === tempUserMsgId);
      if (idx !== -1) {
        messages.value[idx] = data.userMessage;
      }

      // Добавляем ответ ассистента
      messages.value.push({
        ...data.assistantMessage,
        isStepsOpen: false,
      });

      // Если вернулся артефакт, открываем Canvas
      if (data.assistantMessage?.artifact) {
        currentArtifact.value = data.assistantMessage.artifact;
        isCanvasOpen.value = true;
      }

      // Обновляем список сессий
      loadSessions();
    }
  } catch (err: any) {
    notification.error(err.message || 'Ошибка генерации ответа');
  } finally {
    isGenerating.value = false;
    scrollToBottom();
  }
}

function rollbackMessage(msg: ChatMessage) {
  inputPrompt.value = msg.content;
  nextTick(() => {
    promptInput.value?.focus();
  });
  notification.info('Текст возвращен в поле ввода');
}

function openArtifactInCanvas(art: ReportArtifact) {
  currentArtifact.value = art;
  isCanvasOpen.value = true;
  canvasTab.value = 'table';
}

function sortBy(key: string) {
  if (tableSortKey.value === key) {
    tableSortAsc.value = !tableSortAsc.value;
  } else {
    tableSortKey.value = key;
    tableSortAsc.value = true;
  }
}

function formatCellValue(val: any, type?: string): string {
  if (val === null || val === undefined) return '—';
  if (type === 'number') return Number(val).toLocaleString('ru-RU');
  if (type === 'date') return new Date(val).toLocaleDateString('ru-RU');
  return String(val);
}

function exportArtifactToExcel() {
  if (!currentArtifact.value?.rows?.length) {
    notification.warning('Нет данных для экспорта');
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(currentArtifact.value.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Отчет');
    const filename = `${currentArtifact.value.title || 'ai-report'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    notification.success('Файл Excel успешно скачан');
  } catch (err: any) {
    notification.error('Ошибка экспорта в Excel: ' + err.message);
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    notification.success('SQL-запрос скопирован в буфер обмена');
  } catch {
    notification.error('Не удалось скопировать в буфер');
  }
}

// --- Загрузка списка файлов для прикрепления ---
async function loadSystemFiles() {
  filesLoading.value = true;
  try {
    const res: any = await authFetch('/api/files?limit=25');
    if (res.data) {
      systemFiles.value = res.data;
    }
  } catch (err: any) {
    console.error('Ошибка загрузки файлов:', err);
  } finally {
    filesLoading.value = false;
  }
}

function selectAttachmentFile(file: any) {
  attachedFile.value = {
    uuid: file.uuid,
    filename: file.filename,
  };
  showAttachFileModal.value = false;
  notification.success(`Файл "${file.filename}" прикреплен к запросу`);
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatTime(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getStepWord(count: number): string {
  if (count === 1) return 'шаг';
  if (count >= 2 && count <= 4) return 'шага';
  return 'шагов';
}

onMounted(() => {
  loadSessions();
  loadSystemFiles();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}
@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.animate-bounce-subtle {
  animation: bounceSubtle 3s ease-in-out infinite;
}
</style>
